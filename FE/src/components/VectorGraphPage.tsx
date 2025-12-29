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

// Player archetype/cluster definitions based on statistical profiles
type PlayerArchetype = {
  id: string;
  name: string;
  color: string;
  description: string;
  // Thresholds for classification (using z-scores, so >0 means above average, <0 means below average)
  conditions: (features: Record<string, number>) => boolean;
};

const PLAYER_ARCHETYPES: PlayerArchetype[] = [
  {
    id: "offensive-heavy",
    name: "Offensive Heavy",
    color: "#FF6B6B",
    description: "High scoring, high attempts",
    conditions: (f) => 
      (f.spikeKillsPerSet > 0.5 || f.apeKillsPerSet > 0.5) && 
      (f.spikeAttemptsPerSet > 0.3 || f.apeAttemptsPerSet > 0.3)
  },
  {
    id: "defensive-specialist",
    name: "Defensive Specialist",
    color: "#4ECDC4",
    description: "High digs, blocks, low errors",
    conditions: (f) => 
      (f.digsPerSet > 0.5 || f.blocksPerSet > 0.5) && 
      (f.spikingErrorsPerSet < 0.3 && f.settingErrorsPerSet < 0.3 && f.servingErrorsPerSet < 0.3)
  },
  {
    id: "error-prone",
    name: "Error Prone",
    color: "#F38181",
    description: "High error rates across categories",
    conditions: (f) => 
      (f.spikingErrorsPerSet > 0.5 || f.settingErrorsPerSet > 0.5 || f.servingErrorsPerSet > 0.5 || f.miscErrorsPerSet > 0.5)
  },
  {
    id: "balanced",
    name: "Balanced",
    color: "#95E1D3",
    description: "Moderate stats across all categories",
    conditions: (f) => {
      const offensive = Math.abs(f.spikeKillsPerSet) + Math.abs(f.apeKillsPerSet);
      const defensive = Math.abs(f.digsPerSet) + Math.abs(f.blocksPerSet);
      const errors = Math.abs(f.spikingErrorsPerSet) + Math.abs(f.settingErrorsPerSet) + Math.abs(f.servingErrorsPerSet);
      return offensive < 1 && defensive < 1 && errors < 1;
    }
  },
  {
    id: "error-prone-scoring",
    name: "Error Prone Scoring Machine",
    color: "#AA96DA",
    description: "High scoring but also high errors",
    conditions: (f) => 
      (f.spikeKillsPerSet > 0.5 || f.apeKillsPerSet > 0.5) && 
      (f.spikingErrorsPerSet > 0.5 || f.settingErrorsPerSet > 0.5 || f.servingErrorsPerSet > 0.5)
  },
  {
    id: "efficient-scorer",
    name: "Efficient Scorer",
    color: "#A8E6CF",
    description: "High kill rate, low errors",
    conditions: (f) => 
      (f.spikeKillsPerSet > 0.5 || f.apeKillsPerSet > 0.5) && 
      (f.spikingErrorsPerSet < 0.2 && f.settingErrorsPerSet < 0.2 && f.servingErrorsPerSet < 0.2)
  },
  {
    id: "setter-playmaker",
    name: "Setter/Playmaker",
    color: "#C7CEEA",
    description: "High assists, orchestrates offense",
    conditions: (f) => f.assistsPerSet > 0.5
  },
  {
    id: "ace-server",
    name: "Ace Server",
    color: "#FFD3A5",
    description: "High aces, strong serving",
    conditions: (f) => f.acesPerSet > 0.5
  },
  {
    id: "block-specialist",
    name: "Block Specialist",
    color: "#FCBAD3",
    description: "High blocks and block follows",
    conditions: (f) => 
      (f.blocksPerSet > 0.5 || f.blockFollowsPerSet > 0.5) && 
      f.blocksPerSet > 0.3
  },
  {
    id: "all-around",
    name: "All-Around Player",
    color: "#FFFFD2",
    description: "Strong across multiple categories",
    conditions: (f) => {
      const hasOffense = (f.spikeKillsPerSet > 0.3 || f.apeKillsPerSet > 0.3);
      const hasDefense = (f.digsPerSet > 0.3 || f.blocksPerSet > 0.3);
      const hasSetting = f.assistsPerSet > 0.3;
      const lowErrors = (f.spikingErrorsPerSet < 0.3 && f.settingErrorsPerSet < 0.3);
      return (hasOffense && hasDefense) || (hasOffense && hasSetting) || (hasDefense && hasSetting && lowErrors);
    }
  },
  {
    id: "low-volume-scorer",
    name: "Low Volume Scorer",
    color: "#B4E4FF",
    description: "Efficient but low attempts",
    conditions: (f) => 
      (f.spikeKillsPerSet > 0.3 || f.apeKillsPerSet > 0.3) && 
      (f.spikeAttemptsPerSet < 0.2 && f.apeAttemptsPerSet < 0.2) &&
      (f.spikingErrorsPerSet < 0.3)
  },
  {
    id: "high-volume-scorer",
    name: "High Volume Scorer",
    color: "#FF9A9E",
    description: "Lots of attempts, moderate efficiency",
    conditions: (f) => 
      (f.spikeAttemptsPerSet > 0.5 || f.apeAttemptsPerSet > 0.5) && 
      (f.spikeKillsPerSet > 0.2 || f.apeKillsPerSet > 0.2) &&
      (f.spikingErrorsPerSet < 0.5)
  },
  {
    id: "defensive-anchor",
    name: "Defensive Anchor",
    color: "#6BCB77",
    description: "Very high digs, defensive leader",
    conditions: (f) => 
      f.digsPerSet > 0.7 && 
      (f.spikingErrorsPerSet < 0.4 && f.settingErrorsPerSet < 0.4)
  },
  {
    id: "net-presence",
    name: "Net Presence",
    color: "#4D96FF",
    description: "High blocks, strong at net",
    conditions: (f) => 
      (f.blocksPerSet > 0.5 && f.blockFollowsPerSet > 0.3) ||
      (f.blocksPerSet > 0.7)
  },
  {
    id: "service-specialist",
    name: "Service Specialist",
    color: "#FFE66D",
    description: "High aces, focused on serving",
    conditions: (f) => 
      f.acesPerSet > 0.5 && 
      (f.spikeKillsPerSet < 0.3 && f.apeKillsPerSet < 0.3 && f.assistsPerSet < 0.3)
  },
  {
    id: "utility-player",
    name: "Utility Player",
    color: "#D4A5FF",
    description: "Moderate everything, versatile",
    conditions: (f) => {
      const allStats = [
        f.spikeKillsPerSet, f.apeKillsPerSet, f.assistsPerSet, f.digsPerSet, 
        f.blocksPerSet, f.acesPerSet
      ];
      const hasMultiple = allStats.filter(s => Math.abs(s) > 0.2 && Math.abs(s) < 0.6).length >= 3;
      const lowErrors = (f.spikingErrorsPerSet < 0.4 && f.settingErrorsPerSet < 0.4);
      return hasMultiple && lowErrors;
    }
  },
  {
    id: "power-hitter",
    name: "Power Hitter",
    color: "#FF6B9D",
    description: "High spike kills and attempts",
    conditions: (f) => 
      f.spikeKillsPerSet > 0.5 && 
      f.spikeAttemptsPerSet > 0.5
  },
  {
    id: "finesse-player",
    name: "Finesse Player",
    color: "#95E1D3",
    description: "Moderate kills, very low errors",
    conditions: (f) => 
      (f.spikeKillsPerSet > 0.2 || f.apeKillsPerSet > 0.2) && 
      (f.spikingErrorsPerSet < 0.1 && f.settingErrorsPerSet < 0.1 && f.servingErrorsPerSet < 0.1)
  },
  {
    id: "risk-taker",
    name: "Risk Taker",
    color: "#FF8C94",
    description: "High attempts, high errors, high kills",
    conditions: (f) => 
      (f.spikeAttemptsPerSet > 0.5 || f.apeAttemptsPerSet > 0.5) && 
      (f.spikeKillsPerSet > 0.4 || f.apeKillsPerSet > 0.4) &&
      (f.spikingErrorsPerSet > 0.4 || f.settingErrorsPerSet > 0.4)
  },
  {
    id: "conservative-player",
    name: "Conservative Player",
    color: "#C8E6C9",
    description: "Low attempts, low errors",
    conditions: (f) => 
      (f.spikeAttemptsPerSet < 0.2 && f.apeAttemptsPerSet < 0.2) && 
      (f.spikingErrorsPerSet < 0.2 && f.settingErrorsPerSet < 0.2 && f.servingErrorsPerSet < 0.2)
  },
  {
    id: "clutch-performer",
    name: "Clutch Performer",
    color: "#FFB74D",
    description: "High kills relative to attempts, low errors",
    conditions: (f) => {
      const killRate = (f.spikeKillsPerSet + f.apeKillsPerSet) / Math.max(1, f.spikeAttemptsPerSet + f.apeAttemptsPerSet);
      return killRate > 0.6 && 
             (f.spikeKillsPerSet > 0.4 || f.apeKillsPerSet > 0.4) &&
             (f.spikingErrorsPerSet < 0.25 && f.settingErrorsPerSet < 0.25);
    }
  }
];

// Classify a player into an archetype based on their raw per-set features
function classifyPlayerArchetype(features: Record<string, number>): PlayerArchetype | null {
  // Check archetypes in order (more specific first)
  for (const archetype of PLAYER_ARCHETYPES) {
    if (archetype.conditions(features)) {
      return archetype;
    }
  }
  return null; // No archetype matched
}

// Component for individual player point in 3D space
function PlayerPoint({
  vectorRow,
  position,
  onHover,
  onClick,
  isSelected,
  isClosestHovered,
  archetype
}: {
  vectorRow: PlayerSeasonVectorRow;
  position: [number, number, number];
  onHover: (hovered: boolean, distance: number) => void;
  onClick: () => void;
  isSelected: boolean;
  isClosestHovered: boolean;
  archetype?: PlayerArchetype | null;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const { camera } = useThree();
  const [hovered, setHovered] = useState(false);

  const handlePointerEnter = () => {
    setHovered(true);
    // Only update hover state if this point is not selected
    // Selected points should keep their popup visible
    if (!isSelected) {
      const pointWorld = new THREE.Vector3(...position);
      const cameraWorld = camera.position;
      const distance = pointWorld.distanceTo(cameraWorld);
      onHover(true, distance);
    }
  };

  const handlePointerLeave = () => {
    setHovered(false);
    // Only update hover state if this point is not selected
    // Selected points should keep their popup visible
    if (!isSelected) {
      onHover(false, Infinity);
    }
  };

  const handleClick = (e: any) => {
    // Stop propagation to prevent OrbitControls from handling the event
    e.stopPropagation();
    // Also stop on the original event if it exists
    if (e.nativeEvent) {
      e.nativeEvent.stopPropagation();
    }
    if (e.stopImmediatePropagation) {
      e.stopImmediatePropagation();
    }
    // Prevent default to avoid any default behaviors
    e.preventDefault?.();
    onClick();
  };

  const scale = isSelected ? 1.5 : hovered ? 1.2 : 1;
  // Color priority: selected > hovered > archetype color > default gray
  const color = isSelected 
    ? "#ff6b6b" 
    : hovered 
    ? "#4ecdc4" 
    : archetype 
    ? archetype.color
    : "#95a5a6";
  // Show label if selected (persistent) OR if hovered and closest
  const showLabel = isSelected || (hovered && isClosestHovered);

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
  onPlayerClick
}: {
  vectorRows: PlayerSeasonVectorRow[];
  onPlayerHover?: (player: PlayerSeasonVectorRow | null) => void;
  onPlayerClick?: (player: PlayerSeasonVectorRow | null) => void;
}) {
  // ALL HOOKS MUST BE CALLED FIRST - before any conditional returns
  const [hoveredPlayer, setHoveredPlayer] = useState<PlayerSeasonVectorRow | null>(null);
  const [clickedPlayer, setClickedPlayer] = useState<PlayerSeasonVectorRow | null>(null);
  const [similarPlayers, setSimilarPlayers] = useState<{
    closest: PlayerSeasonVectorRow | null;
    farthest: PlayerSeasonVectorRow | null;
  }>({ closest: null, farthest: null });
  const [infoBoxHidden, setInfoBoxHidden] = useState<boolean>(false);
  const [playerInfoCollapsed, setPlayerInfoCollapsed] = useState<boolean>(false);
  const [controlsCollapsed, setControlsCollapsed] = useState<boolean>(false);
  const [axesCollapsed, setAxesCollapsed] = useState<boolean>(false);
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

  // Classify players into archetypes based on their statistical profiles
  const archetypeAssignments = useMemo(() => {
    const archetypeMap = new Map<string, PlayerArchetype>();
    vectorRows.forEach((row) => {
      const archetype = classifyPlayerArchetype(row.rawPerSetFeatures);
      if (archetype) {
        archetypeMap.set(row.playerId, archetype);
      }
    });
    return archetypeMap;
  }, [vectorRows]);
  
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
  // Note: This only affects hover state, not clicked/selected state
  useEffect(() => {
    // Don't update hover state if a player is clicked (clicked state takes precedence)
    if (clickedPlayer) {
      return;
    }
    
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
  }, [closestHoveredPlayerId, vectorRows, onPlayerHover, clickedPlayer]);

  // Calculate Euclidean distance between two z-vectors
  const calculateDistance = (vec1: number[], vec2: number[]): number => {
    if (vec1.length !== vec2.length) return Infinity;
    let sumSquaredDiffs = 0;
    for (let i = 0; i < vec1.length; i++) {
      const diff = vec1[i] - vec2[i];
      sumSquaredDiffs += diff * diff;
    }
    return Math.sqrt(sumSquaredDiffs);
  };

  // Find closest and farthest players based on z-vector similarity
  const findSimilarPlayers = (targetPlayer: PlayerSeasonVectorRow): {
    closest: PlayerSeasonVectorRow | null;
    farthest: PlayerSeasonVectorRow | null;
  } => {
    if (vectorRows.length < 2) {
      return { closest: null, farthest: null };
    }

    let closest: PlayerSeasonVectorRow | null = null;
    let farthest: PlayerSeasonVectorRow | null = null;
    let minDistance = Infinity;
    let maxDistance = -Infinity;

    for (const player of vectorRows) {
      // Skip the target player itself
      if (player.playerId === targetPlayer.playerId) {
        continue;
      }

      const distance = calculateDistance(targetPlayer.zVector, player.zVector);

      if (distance < minDistance) {
        minDistance = distance;
        closest = player;
      }

      if (distance > maxDistance) {
        maxDistance = distance;
        farthest = player;
      }
    }

    return { closest, farthest };
  };

  // Handle player click
  const handlePlayerClick = (player: PlayerSeasonVectorRow) => {
    // Toggle: if clicking the same player, deselect; otherwise select the new player
    if (clickedPlayer?.playerId === player.playerId) {
      setClickedPlayer(null);
      setSimilarPlayers({ closest: null, farthest: null });
      if (onPlayerClick) {
        onPlayerClick(null);
      }
    } else {
      setClickedPlayer(player);
      // Calculate similar players when a player is selected
      const similar = findSimilarPlayers(player);
      setSimilarPlayers(similar);
      if (onPlayerClick) {
        onPlayerClick(player);
      }
    }
  };

  // Handle canvas click to deselect (fires when clicking empty space)
  // Player clicks stop propagation, so this only fires for background clicks
  const handleCanvasClick = () => {
    setClickedPlayer(null);
    setHoveredPlayer(null); // Also clear hovered player when deselecting
    setHoveredPoints({}); // Clear all hovered points
    setSimilarPlayers({ closest: null, farthest: null }); // Clear similarity data
    if (onPlayerClick) {
      onPlayerClick(null);
    }
    if (onPlayerHover) {
      onPlayerHover(null);
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
            isSelected={clickedPlayer?.playerId === row.playerId}
            isClosestHovered={closestHoveredPlayerId === row.playerId}
            archetype={archetypeAssignments.get(row.playerId)}
          />
        ))}
        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.05}
          minDistance={maxRange * 0.5}
          maxDistance={maxRange * 5}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
        />
      </Canvas>
      {!infoBoxHidden && (
        <div className="vector-graph-info">
          <button 
            className="info-box-toggle"
            onClick={() => setInfoBoxHidden(true)}
            title="Hide info panel"
            aria-label="Hide info panel"
          >
            ×
          </button>
          
          <div className={`info-section ${playerInfoCollapsed ? 'collapsed' : ''}`}>
            <div 
              className="info-section-header"
              onClick={() => setPlayerInfoCollapsed(!playerInfoCollapsed)}
            >
              <h4>Player Info</h4>
              <span className="collapse-icon">{playerInfoCollapsed ? '▶' : '▼'}</span>
            </div>
            {!playerInfoCollapsed && (() => {
              // Prioritize clicked player over hovered player
              const displayPlayer = clickedPlayer || hoveredPlayer;
              if (!displayPlayer) return <p className="note">Hover or click a player to see info</p>;
              
              return (
                <div className="hovered-player-info">
                  <div className="player-info-header">
                    <h4>{displayPlayer.playerName}</h4>
                    {clickedPlayer && clickedPlayer.playerId === displayPlayer.playerId && (
                      <span className="selected-badge">Selected</span>
                    )}
                  </div>
                  <p>Season: {displayPlayer.seasonNumber}</p>
                  <p>Sets Played: {displayPlayer.setsPlayed}</p>
                  {clickedPlayer && clickedPlayer.playerId === displayPlayer.playerId && (
                    <>
                      {(() => {
                        const archetype = archetypeAssignments.get(displayPlayer.playerId);
                        if (archetype) {
                          const archetypePlayers = vectorRows.filter(
                            row => archetypeAssignments.get(row.playerId)?.id === archetype.id
                          );
                          return (
                            <div className="cluster-info">
                              <p>
                                <strong>Archetype:</strong> {archetype.name}
                                <span 
                                  className="cluster-color-indicator"
                                  style={{ backgroundColor: archetype.color }}
                                />
                                ({archetypePlayers.length} players)
                              </p>
                              <p className="archetype-description">{archetype.description}</p>
                            </div>
                          );
                        }
                        return null;
                      })()}
                      {similarPlayers.closest && (
                        <div className="similarity-info">
                          <p><strong>Most Similar:</strong> {similarPlayers.closest.playerName}</p>
                        </div>
                      )}
                      {similarPlayers.farthest && (
                        <div className="similarity-info">
                          <p><strong>Least Similar:</strong> {similarPlayers.farthest.playerName}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })()}
          </div>
          
          <div className={`info-section ${controlsCollapsed ? 'collapsed' : ''}`}>
            <div 
              className="info-section-header"
              onClick={() => setControlsCollapsed(!controlsCollapsed)}
            >
              <h4>Controls</h4>
              <span className="collapse-icon">{controlsCollapsed ? '▶' : '▼'}</span>
            </div>
            {!controlsCollapsed && (
              <ul>
                <li>Rotate: Left Click + Drag</li>
                <li>Pan: Right Click + Drag</li>
                <li>Zoom: Scroll</li>
                <li>Zoom In / Out: + / - Keys</li>
                <li>View player info: Hover</li>
              </ul>
            )}
          </div>
          
          <div className={`info-section ${axesCollapsed ? 'collapsed' : ''}`}>
            <div 
              className="info-section-header"
              onClick={() => setAxesCollapsed(!axesCollapsed)}
            >
              <h4>Axes (PCA)</h4>
              <span className="collapse-icon">{axesCollapsed ? '▶' : '▼'}</span>
            </div>
            {!axesCollapsed && (
              <>
                <p>X: First Principal Component (PC1)</p>
                <p>Y: Second Principal Component (PC2)</p>
                <p>Z: Third Principal Component (PC3)</p>
                {model && model.explainedVariance && model.explainedVariance.length > 0 && (
                  <p className="note">
                    Variance explained: PC1: {((model.explainedVariance[0] / model.explainedVariance.reduce((a: number, b: number) => a + b, 0)) * 100).toFixed(1)}%, 
                    PC2: {((model.explainedVariance[1] / model.explainedVariance.reduce((a: number, b: number) => a + b, 0)) * 100).toFixed(1)}%, 
                    PC3: {((model.explainedVariance[2] / model.explainedVariance.reduce((a: number, b: number) => a + b, 0)) * 100).toFixed(1)}%
                  </p>
                )}
                <p className="note">Uses all 12 statistical dimensions via PCA.</p>
              </>
            )}
          </div>
        </div>
      )}
      {infoBoxHidden && (
        <button 
          className="info-box-show-button"
          onClick={() => setInfoBoxHidden(false)}
          title="Show info panel"
          aria-label="Show info panel"
        >
          ℹ
        </button>
      )}
    </div>
  );
}

const VectorGraphPage: React.FC = () => {
  const { data: players, loading: playersLoading, error: playersError } = useFetchPlayersWithStats();
  const { data: seasons, loading: seasonsLoading, error: seasonsError } = useFetchSeasons();
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number | null>(null);
  const [minSetsPlayed, setMinSetsPlayed] = useState<number>(DEFAULT_MIN_SETS);

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
          const allFeatures = VECTOR_FEATURE_ORDER.map((key, idx) => ({
            key,
            weight: component[idx] || 0,
            absWeight: Math.abs(component[idx] || 0)
          }));
          
          // Find max weight across ALL features in this component for proper normalization
          const maxWeight = Math.max(...allFeatures.map(f => f.absWeight));
          
          // Get top features sorted by absolute weight
          const topFeatures = [...allFeatures]
            .sort((a, b) => b.absWeight - a.absWeight)
            .slice(0, count);
          
          // Find min and max weights in the top features for better color distribution
          const topWeights = topFeatures.map(f => f.absWeight);
          const minTopWeight = Math.min(...topWeights);
          const maxTopWeight = Math.max(...topWeights);
          const weightRange = maxTopWeight - minTopWeight;
          
          return topFeatures.map(f => {
            const sign = f.weight >= 0 ? '+' : '-';
            // Normalize to 0-1 range within the top features, with better distribution
            // Use the full component's max weight as reference, but scale within top features
            let normalizedWeight = 0;
            if (maxWeight > 0) {
              if (weightRange > 0) {
                // Map to 0.3-1.0 range for better visual distinction
                normalizedWeight = 0.3 + ((f.absWeight - minTopWeight) / weightRange) * 0.7;
              } else {
                // All top features have same weight, give them all medium-high opacity
                normalizedWeight = 0.7;
              }
            }
            return {
              text: `${sign}${formatFeatureName(f.key)}`,
              weight: normalizedWeight,
              absWeight: f.absWeight
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
          onPlayerHover={() => {}} // Hover state managed internally by VectorGraph3D
          onPlayerClick={() => {}} // Click state managed internally by VectorGraph3D
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
