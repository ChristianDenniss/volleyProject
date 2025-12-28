// src/components/VectorGraphPage.tsx

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { useFetchPlayersWithStats, useFetchSeasons } from "../hooks/useVectorGraphData";
import { buildSeasonVectors, computePCA3D, VECTOR_FEATURE_ORDER } from "../analytics/statsVectorization";
import type { PlayerSeasonVectorRow } from "../analytics/statsVectorization";
import "../styles/VectorGraphPage.css";

const DEFAULT_MIN_SETS = 5;

// Component for individual player point in 3D space
function PlayerPoint({
  vectorRow,
  position,
  onHover,
  onClick,
  isSelected,
  isClosestHovered
}: {
  vectorRow: PlayerSeasonVectorRow;
  position: [number, number, number];
  onHover: (hovered: boolean, distance: number) => void;
  onClick: () => void;
  isSelected: boolean;
  isClosestHovered: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const { camera } = useThree();
  const [hovered, setHovered] = useState(false);

  const handlePointerEnter = () => {
    setHovered(true);
    // Calculate distance from camera to this point
    const pointWorld = new THREE.Vector3(...position);
    const cameraWorld = camera.position;
    const distance = pointWorld.distanceTo(cameraWorld);
    onHover(true, distance);
  };

  const handlePointerLeave = () => {
    setHovered(false);
    onHover(false, Infinity);
  };

  const handleClick = (e: any) => {
    e.stopPropagation(); // Prevent canvas click from firing
    onClick();
  };

  const scale = isSelected ? 1.5 : hovered ? 1.2 : 1;
  const color = isSelected ? "#ff6b6b" : hovered ? "#4ecdc4" : "#95a5a6";
  const showLabel = (hovered && isClosestHovered) || isSelected;

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
      scale={scale}
    >
      <sphereGeometry args={[0.1, 16, 16]} />
      <meshStandardMaterial color={color} />
      {showLabel && (
        <Html distanceFactor={10} position={[0, 0.3, 0]}>
          <div className="player-label">
            <div className="player-name">{vectorRow.playerName}</div>
            <div className="player-sets">Sets: {vectorRow.setsPlayed}</div>
          </div>
        </Html>
      )}
    </mesh>
  );
}

// 3D Graph component (inline)
function VectorGraph3D({
  vectorRows,
  onPlayerHover,
  onPlayerClick,
  selectedPlayerId
}: {
  vectorRows: PlayerSeasonVectorRow[];
  onPlayerHover?: (player: PlayerSeasonVectorRow | null) => void;
  onPlayerClick?: (player: PlayerSeasonVectorRow | null) => void;
  selectedPlayerId?: string | null;
}) {
  // ALL HOOKS MUST BE CALLED FIRST - before any conditional returns
  const [hoveredPlayer, setHoveredPlayer] = useState<PlayerSeasonVectorRow | null>(null);
  const [clickedPlayer, setClickedPlayer] = useState<PlayerSeasonVectorRow | null>(null);
  const controlsRef = useRef<any>(null);
  // Track hovered points with their distances (using object instead of Map for React state)
  const [hoveredPoints, setHoveredPoints] = useState<Record<string, number>>({});

  // Compute PCA on all vectors and project to 3D (uses all 12 dimensions)
  const zVectors = vectorRows.map(row => row.zVector);
  const { projections, model } = useMemo(() => {
    if (vectorRows.length === 0) {
      return { projections: [], model: null };
    }
    return computePCA3D(zVectors);
  }, [vectorRows, zVectors]);
  
  const points = useMemo(() => {
    if (vectorRows.length === 0) return [];
    return vectorRows.map((row, idx) => {
      const coords = projections[idx] || { x: 0, y: 0, z: 0 };
      return {
        row,
        position: [coords.x, coords.y, coords.z] as [number, number, number]
      };
    });
  }, [vectorRows, projections]);

  // Calculate bounds for camera positioning
  const { centerX, centerY, centerZ, maxRange, cameraDistance } = useMemo(() => {
    if (points.length === 0) {
      return { centerX: 0, centerY: 0, centerZ: 0, maxRange: 10, cameraDistance: 10 };
    }
    const allX = points.map((p) => p.position[0]);
    const allY = points.map((p) => p.position[1]);
    const allZ = points.map((p) => p.position[2]);
    const cx = (Math.max(...allX) + Math.min(...allX)) / 2;
    const cy = (Math.max(...allY) + Math.min(...allY)) / 2;
    const cz = (Math.max(...allZ) + Math.min(...allZ)) / 2;
    const mr = Math.max(
      Math.max(...allX) - Math.min(...allX),
      Math.max(...allY) - Math.min(...allY),
      Math.max(...allZ) - Math.min(...allZ)
    );
    return {
      centerX: cx,
      centerY: cy,
      centerZ: cz,
      maxRange: mr,
      cameraDistance: mr > 0 ? mr * 2 : 10
    };
  }, [points]);

  const handlePlayerHover = (row: PlayerSeasonVectorRow | null, distance: number, isEntering: boolean) => {
    // Update the hovered points object
    setHoveredPoints(prev => {
      if (isEntering && row) {
        return { ...prev, [row.playerId]: distance };
      } else if (!isEntering && row) {
        const { [row.playerId]: removed, ...rest } = prev;
        return rest;
      }
      return prev;
    });
  };

  // Find the closest hovered point
  const closestHoveredPlayerId = useMemo(() => {
    const entries = Object.entries(hoveredPoints);
    if (entries.length === 0) return null;
    let closestId: string | null = null;
    let closestDistance = Infinity;
    entries.forEach(([playerId, distance]) => {
      if (distance < closestDistance) {
        closestDistance = distance;
        closestId = playerId;
      }
    });
    return closestId;
  }, [hoveredPoints]);

  // Update the displayed hovered player based on closest point
  useEffect(() => {
    if (closestHoveredPlayerId) {
      const player = vectorRows.find(row => row.playerId === closestHoveredPlayerId);
      setHoveredPlayer(player || null);
      if (onPlayerHover) {
        onPlayerHover(player || null);
      }
    } else {
      setHoveredPlayer(null);
      if (onPlayerHover) {
        onPlayerHover(null);
      }
    }
  }, [closestHoveredPlayerId, vectorRows, onPlayerHover]);

  // Handle player click
  const handlePlayerClick = (player: PlayerSeasonVectorRow) => {
    setClickedPlayer(player);
    if (onPlayerClick) {
      onPlayerClick(player);
    }
  };

  // Handle canvas click to deselect (fires when clicking empty space)
  // Player clicks stop propagation, so this only fires for background clicks
  const handleCanvasClick = () => {
    setClickedPlayer(null);
    if (onPlayerClick) {
      onPlayerClick(null);
    }
  };

  // Keyboard zoom controls
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Check if user is typing in an input field
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        if (controlsRef.current) {
          controlsRef.current.dollyIn(0.5);
        }
      } else if (event.key === '-' || event.key === '_') {
        event.preventDefault();
        if (controlsRef.current) {
          controlsRef.current.dollyOut(0.5);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  // Early return AFTER all hooks
  if (vectorRows.length === 0) {
    return (
      <div className="vector-graph-empty">
        <p>No players match the selected criteria.</p>
        <p>Try adjusting the minimum sets threshold or selecting a different season.</p>
      </div>
    );
  }

  return (
    <div className="vector-graph-3d-container">
      <Canvas
        camera={{
          position: [centerX + cameraDistance, centerY + cameraDistance, centerZ + cameraDistance],
          fov: 50
        }}
        onClick={handleCanvasClick}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        <gridHelper args={[maxRange || 10, 10, "#888888", "#444444"]} />
        <axesHelper args={[maxRange || 5]} />
        {points.map(({ row, position }) => (
          <PlayerPoint
            key={row.playerId}
            vectorRow={row}
            position={position}
            onHover={(hovered, distance) => {
              handlePlayerHover(row, distance, hovered);
            }}
            onClick={() => handlePlayerClick(row)}
            isSelected={clickedPlayer?.playerId === row.playerId || selectedPlayerId === row.playerId}
            isClosestHovered={closestHoveredPlayerId === row.playerId}
          />
        ))}
        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.05}
          minDistance={maxRange * 0.5}
          maxDistance={maxRange * 5}
        />
      </Canvas>
      <div className="vector-graph-info">
        <div className="info-section">
          {(clickedPlayer || hoveredPlayer) && (
            <div className="hovered-player-info">
              <h4>{(clickedPlayer || hoveredPlayer)?.playerName}</h4>
              <p>Season: {(clickedPlayer || hoveredPlayer)?.seasonNumber}</p>
              <p>Sets Played: {(clickedPlayer || hoveredPlayer)?.setsPlayed}</p>
              {clickedPlayer && <p className="note">(Selected - click empty space to deselect)</p>}
            </div>
          )}
        </div>
        <div className="info-section">
          <h4>Controls</h4>
          <ul>
            <li>Left Click + Drag: Rotate</li>
            <li>Right Click + Drag: Pan</li>
            <li>Scroll: Zoom</li>
            <li>+ / - Keys: Zoom In / Out</li>
            <li>Hover: View player info</li>
          </ul>
        </div>
        <div className="info-section">
          <h4>Axes (PCA)</h4>
          <p>X: First Principal Component</p>
          <p>Y: Second Principal Component</p>
          <p>Z: Third Principal Component</p>
          {model && model.explainedVariance && model.explainedVariance.length > 0 && (
            <p className="note">
              Variance explained: PC1: {((model.explainedVariance[0] / model.explainedVariance.reduce((a: number, b: number) => a + b, 0)) * 100).toFixed(1)}%, 
              PC2: {((model.explainedVariance[1] / model.explainedVariance.reduce((a: number, b: number) => a + b, 0)) * 100).toFixed(1)}%, 
              PC3: {((model.explainedVariance[2] / model.explainedVariance.reduce((a: number, b: number) => a + b, 0)) * 100).toFixed(1)}%
            </p>
          )}
          <p className="note">Uses all 12 statistical dimensions via PCA.</p>
        </div>
      </div>
    </div>
  );
}

const VectorGraphPage: React.FC = () => {
  const { data: players, loading: playersLoading, error: playersError } = useFetchPlayersWithStats();
  const { data: seasons, loading: seasonsLoading, error: seasonsError } = useFetchSeasons();
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number | null>(null);
  const [minSetsPlayed, setMinSetsPlayed] = useState<number>(DEFAULT_MIN_SETS);
  const [hoveredPlayer, setHoveredPlayer] = useState<string | null>(null);

  // Auto-select first season when seasons load
  React.useEffect(() => {
    if (seasons && seasons.length > 0 && selectedSeasonNumber === null) {
      const sortedSeasons = [...seasons].sort((a, b) => b.seasonNumber - a.seasonNumber);
      setSelectedSeasonNumber(sortedSeasons[0].seasonNumber);
    }
  }, [seasons, selectedSeasonNumber]);

  // Compute vectors for selected season
  const vectorRows = useMemo(() => {
    if (!players || !selectedSeasonNumber) {
      return [];
    }
    return buildSeasonVectors(players, selectedSeasonNumber, minSetsPlayed);
  }, [players, selectedSeasonNumber, minSetsPlayed]);

  if (playersLoading || seasonsLoading) {
    return (
      <div className="vector-graph-page">
        <div className="loading-container">
          <h2>Loading Vector Graph...</h2>
          <p>Fetching player and season data...</p>
        </div>
      </div>
    );
  }

  if (playersError || seasonsError) {
    return (
      <div className="vector-graph-page">
        <div className="error-container">
          <h2>Error Loading Data</h2>
          {playersError && <p>Error loading players: {playersError}</p>}
          {seasonsError && <p>Error loading seasons: {seasonsError}</p>}
        </div>
      </div>
    );
  }

  if (!players || !seasons || seasons.length === 0) {
    return (
      <div className="vector-graph-page">
        <div className="error-container">
          <h2>No Data Available</h2>
          <p>No seasons found. Please ensure data is available in the database.</p>
        </div>
      </div>
    );
  }

  const sortedSeasons = [...seasons].sort((a, b) => b.seasonNumber - a.seasonNumber);

  return (
    <div className="vector-graph-page">
      <div className="vector-graph-header">
        <h1>Player Stats Vectorization</h1>
        <p className="subtitle">
          Explore player statistical profiles in 3D space. Each point represents a player's normalized
          performance across multiple statistical dimensions.
        </p>
      </div>

      <div className="vector-graph-controls">
        <div className="control-group">
          <label htmlFor="season-select">Season:</label>
          <select
            id="season-select"
            value={selectedSeasonNumber || ""}
            onChange={(e) => setSelectedSeasonNumber(Number(e.target.value))}
            className="control-select"
          >
            {sortedSeasons.map((season) => (
              <option key={season.id} value={season.seasonNumber}>
                Season {season.seasonNumber} {season.theme ? `- ${season.theme}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="min-sets-slider">
            Minimum Sets Played: <strong>{minSetsPlayed}</strong>
          </label>
          <input
            id="min-sets-slider"
            type="range"
            min="1"
            max="50"
            value={minSetsPlayed}
            onChange={(e) => setMinSetsPlayed(Number(e.target.value))}
            className="control-slider"
          />
          <div className="slider-labels">
            <span>1</span>
            <span>25</span>
            <span>50</span>
          </div>
        </div>

        <div className="control-group">
          <label>Players in Graph:</label>
          <div className="stat-value-large">{vectorRows.length}</div>
        </div>

        {selectedSeasonNumber && (
          <div className="control-group">
            <label>Selected Season:</label>
            <div className="stat-value-large">{selectedSeasonNumber}</div>
          </div>
        )}
      </div>

      {/* PCA Components Row */}
      {(() => {
        // Compute PCA to get the model
        const zVectors = vectorRows.map(row => row.zVector);
        const { model } = vectorRows.length > 0 ? computePCA3D(zVectors) : { model: null };
        
        if (!model || !model.components || model.components.length === 0) {
          return null;
        }

        // Helper to format feature names
        const formatFeatureName = (key: string): string => {
          const names: Record<string, string> = {
            spikeKillsPerSet: "Spike Kills/Set",
            spikeAttemptsPerSet: "Spike Attempts/Set",
            apeKillsPerSet: "APE Kills/Set",
            apeAttemptsPerSet: "APE Attempts/Set",
            blocksPerSet: "Blocks/Set",
            assistsPerSet: "Assists/Set",
            acesPerSet: "Aces/Set",
            digsPerSet: "Digs/Set",
            blockFollowsPerSet: "Block Follows/Set",
            spikingErrorsPerSet: "Spiking Errors/Set",
            settingErrorsPerSet: "Setting Errors/Set",
            servingErrorsPerSet: "Serving Errors/Set",
            miscErrorsPerSet: "Misc Errors/Set"
          };
          return names[key] || key;
        };

        // Get top 4 features for each PC (by absolute value) - 12 dimensions / 3 PCs = 4 per PC
        const getTopFeatures = (component: number[], count: number = 4) => {
          const features = VECTOR_FEATURE_ORDER.map((key, idx) => ({
            key,
            weight: component[idx] || 0,
            absWeight: Math.abs(component[idx] || 0)
          }))
            .sort((a, b) => b.absWeight - a.absWeight)
            .slice(0, count);
          
          // Find max weight for normalization
          const maxWeight = Math.max(...features.map(f => f.absWeight));
          
          return features.map(f => {
            const sign = f.weight >= 0 ? '+' : '-';
            const normalizedWeight = maxWeight > 0 ? f.absWeight / maxWeight : 0;
            return {
              text: `${sign}${formatFeatureName(f.key)}`,
              weight: normalizedWeight
            };
          });
        };

        const pc1Features = getTopFeatures(model.components[0]);
        const pc2Features = getTopFeatures(model.components[1]);
        const pc3Features = getTopFeatures(model.components[2]);

        return (
          <div className="vector-graph-controls pca-components-row">
            <div className="control-group pca-component">
              <label>PC1:</label>
              <div className="pca-description">
                {pc1Features.map((feature, idx) => (
                  <span
                    key={idx}
                    className="pca-feature"
                    style={{
                      opacity: 0.4 + (feature.weight * 0.6), // Range from 0.4 to 1.0
                      fontWeight: feature.weight > 0.7 ? 700 : feature.weight > 0.4 ? 600 : 500
                    }}
                  >
                    {feature.text}
                    {idx < pc1Features.length - 1 && ', '}
                  </span>
                ))}
              </div>
            </div>
            <div className="control-group pca-component">
              <label>PC2:</label>
              <div className="pca-description">
                {pc2Features.map((feature, idx) => (
                  <span
                    key={idx}
                    className="pca-feature"
                    style={{
                      opacity: 0.4 + (feature.weight * 0.6), // Range from 0.4 to 1.0
                      fontWeight: feature.weight > 0.7 ? 700 : feature.weight > 0.4 ? 600 : 500
                    }}
                  >
                    {feature.text}
                    {idx < pc2Features.length - 1 && ', '}
                  </span>
                ))}
              </div>
            </div>
            <div className="control-group pca-component">
              <label>PC3:</label>
              <div className="pca-description">
                {pc3Features.map((feature, idx) => (
                  <span
                    key={idx}
                    className="pca-feature"
                    style={{
                      opacity: 0.4 + (feature.weight * 0.6), // Range from 0.4 to 1.0
                      fontWeight: feature.weight > 0.7 ? 700 : feature.weight > 0.4 ? 600 : 500
                    }}
                  >
                    {feature.text}
                    {idx < pc3Features.length - 1 && ', '}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      <div className="vector-graph-content">
        <VectorGraph3D
          vectorRows={vectorRows}
          onPlayerHover={(player) => setHoveredPlayer(player?.playerId || null)}
          onPlayerClick={(player) => setHoveredPlayer(player?.playerId || null)}
          selectedPlayerId={hoveredPlayer}
        />
      </div>

      <div className="vector-graph-footer">
        <div className="info-box">
          <h3>About This Visualization</h3>
          <p>
            This graph represents players as vectors in a 13-dimensional statistical space, projected
            into 3D for visualization. Each player's position is determined by their normalized (z-scored)
            performance across multiple statistical categories.
          </p>
          <p>
            <strong>Statistical Dimensions Used (13 total):</strong> Spike kills per set, Spike attempts per set, 
            APE kills per set, APE attempts per set, Blocks per set, Assists per set, Aces per set, 
            Digs per set, Block follows per set, Spiking errors per set, Setting errors per set, 
            Serving errors per set, and Misc errors per set.
          </p>
          <p className="version-info">Vector Version: v2 | Projection: PCA (Principal Component Analysis)</p>
        </div>
      </div>
    </div>
  );
};

export default VectorGraphPage;
