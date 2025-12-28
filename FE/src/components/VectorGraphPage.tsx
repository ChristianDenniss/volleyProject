// src/components/VectorGraphPage.tsx

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { useFetchPlayersWithStats, useFetchSeasons } from "../hooks/useVectorGraphData";
import { buildSeasonVectors, computePCA3D } from "../analytics/statsVectorization";
import type { PlayerSeasonVectorRow } from "../analytics/statsVectorization";
import "../styles/VectorGraphPage.css";

const DEFAULT_MIN_SETS = 5;

// Component for individual player point in 3D space
function PlayerPoint({
  vectorRow,
  position,
  onHover,
  isSelected
}: {
  vectorRow: PlayerSeasonVectorRow;
  position: [number, number, number];
  onHover: (hovered: boolean) => void;
  isSelected: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  const handlePointerEnter = () => {
    setHovered(true);
    onHover(true);
  };

  const handlePointerLeave = () => {
    setHovered(false);
    onHover(false);
  };

  const scale = isSelected ? 1.5 : hovered ? 1.2 : 1;
  const color = isSelected ? "#ff6b6b" : hovered ? "#4ecdc4" : "#95a5a6";

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      scale={scale}
    >
      <sphereGeometry args={[0.1, 16, 16]} />
      <meshStandardMaterial color={color} />
      {(hovered || isSelected) && (
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
  selectedPlayerId
}: {
  vectorRows: PlayerSeasonVectorRow[];
  onPlayerHover?: (player: PlayerSeasonVectorRow | null) => void;
  selectedPlayerId?: string | null;
}) {
  const [hoveredPlayer, setHoveredPlayer] = useState<PlayerSeasonVectorRow | null>(null);
  const controlsRef = useRef<any>(null);

  if (vectorRows.length === 0) {
    return (
      <div className="vector-graph-empty">
        <p>No players match the selected criteria.</p>
        <p>Try adjusting the minimum sets threshold or selecting a different season.</p>
      </div>
    );
  }

  // Compute PCA on all vectors and project to 3D (uses all 12 dimensions)
  const zVectors = vectorRows.map(row => row.zVector);
  const { projections, model } = computePCA3D(zVectors);
  
  const points = vectorRows.map((row, idx) => {
    const coords = projections[idx] || { x: 0, y: 0, z: 0 };
    return {
      row,
      position: [coords.x, coords.y, coords.z] as [number, number, number]
    };
  });

  // Calculate bounds for camera positioning
  const allX = points.map((p) => p.position[0]);
  const allY = points.map((p) => p.position[1]);
  const allZ = points.map((p) => p.position[2]);
  const centerX = (Math.max(...allX) + Math.min(...allX)) / 2;
  const centerY = (Math.max(...allY) + Math.min(...allY)) / 2;
  const centerZ = (Math.max(...allZ) + Math.min(...allZ)) / 2;
  const maxRange = Math.max(
    Math.max(...allX) - Math.min(...allX),
    Math.max(...allY) - Math.min(...allY),
    Math.max(...allZ) - Math.min(...allZ)
  );
  const cameraDistance = maxRange > 0 ? maxRange * 2 : 10;

  const handlePlayerHover = (row: PlayerSeasonVectorRow | null) => {
    setHoveredPlayer(row);
    if (onPlayerHover) {
      onPlayerHover(row);
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

  return (
    <div className="vector-graph-3d-container">
      <Canvas
        camera={{
          position: [centerX + cameraDistance, centerY + cameraDistance, centerZ + cameraDistance],
          fov: 50
        }}
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
            onHover={(hovered) => handlePlayerHover(hovered ? row : null)}
            isSelected={selectedPlayerId === row.playerId}
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
          <h3>3D Vector Graph</h3>
          <p>Players: {vectorRows.length}</p>
          {hoveredPlayer && (
            <div className="hovered-player-info">
              <h4>{hoveredPlayer.playerName}</h4>
              <p>Season: {hoveredPlayer.seasonNumber}</p>
              <p>Sets Played: {hoveredPlayer.setsPlayed}</p>
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

      <div className="vector-graph-content">
        <VectorGraph3D
          vectorRows={vectorRows}
          onPlayerHover={(player) => setHoveredPlayer(player?.playerId || null)}
          selectedPlayerId={hoveredPlayer}
        />
      </div>

      <div className="vector-graph-footer">
        <div className="info-box">
          <h3>About This Visualization</h3>
          <p>
            This graph represents players as vectors in a 12-dimensional statistical space, projected
            into 3D for visualization. Each player's position is determined by their normalized (z-scored)
            performance across multiple statistical categories.
          </p>
          <p>
            <strong>Features:</strong> kills per set, attempts per set, spike percentages, blocks,
            assists, aces, digs, receives, errors, and plus/minus.
          </p>
          <p className="version-info">Vector Version: v1 | Projection: Simple (first 3 dimensions)</p>
        </div>
      </div>
    </div>
  );
};

export default VectorGraphPage;
