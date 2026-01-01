// src/components/VectorGraphPage.tsx

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { useFetchPlayersWithStats, useFetchSeasons } from "../hooks/useVectorGraphData";
import { buildSeasonVectors, computePCA3D, VECTOR_FEATURE_ORDER } from "../analytics/statsVectorization";
import type { PlayerSeasonVectorRow } from "../analytics/statsVectorization";
import { classifyPlayerArchetype, type PlayerArchetype } from "../analytics/playerArchetypes";
import "../styles/VectorGraphPage.css";

const DEFAULT_MIN_SETS = 5;

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
  const [controlsCollapsed, setControlsCollapsed] = useState<boolean>(true);
  const [axesCollapsed, setAxesCollapsed] = useState<boolean>(true);
  const controlsRef = useRef<any>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);
  // Track hovered points with their distances (using object instead of Map for React state)
  const [hoveredPoints, setHoveredPoints] = useState<Record<string, number>>({});
  // Search functionality
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<PlayerSeasonVectorRow[]>([]);

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

  // Calculate archetype counts for legend
  const archetypeCounts = useMemo(() => {
    const counts = new Map<string, { archetype: PlayerArchetype; count: number }>();
    archetypeAssignments.forEach((archetype) => {
      const existing = counts.get(archetype.id);
      if (existing) {
        existing.count++;
      } else {
        counts.set(archetype.id, { archetype, count: 1 });
      }
    });
    // Sort by count (descending), then by name
    return Array.from(counts.values()).sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.archetype.name.localeCompare(b.archetype.name);
    });
  }, [archetypeAssignments]);

  // Get statistical thresholds for archetype
  const getArchetypeThresholds = (archetypeId: string): string => {
    const thresholds: Record<string, string> = {
      "maverick": "Total errors >2.0/set OR spiking errors >1.2/set + setting errors >0.4/set OR spiking errors >1.5/set OR setting errors >1.0/set",
      "inconsistent": "Total errors 1.2-2.0/set AND (multiple error types OR spiking errors >0.9/set OR setting errors >0.6/set)",
      "precise": "Total errors <0.5/set AND spiking errors <0.3/set AND setting errors <0.2/set",
      "tireless": "Spike attempts >7.5/set OR ape attempts >3.2/set OR assists >10.5/set",
      "workhorse": "Spike attempts >5.0/set OR ape attempts >2.0/set OR assists >8.0/set (but not Tireless)",
      "stalwart": "High volume (spike attempts >5.0/set OR ape attempts >2.0/set OR assists >8.0/set) AND total errors <0.8/set AND spiking errors <0.5/set AND setting errors <0.3/set",
      "opportunistic": "Low volume (attempts <3.0/set) but high impact (kills >1.5/set with >45% kill rate)",
      "selective": "Very low volume: spike attempts <1.5/set AND ape attempts <0.5/set AND assists <2.0/set AND digs <2.0/set",
      "steady": "Low attempts (spike <2.0/set, ape <0.5/set) AND low errors (spiking <0.3/set, setting <0.2/set, serving <0.2/set)",
      "striker": "Kills >2.5 spike/set OR >1.0 ape/set AND attempts >4.0 spike/set OR >1.5 ape/set",
      "piercer": "Kills >3.0 spike/set OR >1.5 ape/set AND kill rate >55% AND total kills >3.0/set",
      "guardian": "Digs >3.0/set OR blocks >1.0/set",
      "playmaker": "Assists >6.0/set",
      "finisher": "Spike kills >2.5/set OR ape kills >1.0/set",
      "intimidator": "Blocks >1.0/set OR block follows >1.5/set",
      "bomber": "Aces >0.8/set",
      "versatile": "Multiple roles: (offense + defense) OR (offense + setting) OR (defense + setting)",
      "jack-of-all-trades": "3+ stats in 0.5-3.0 range across multiple categories",
      "perfectly-balanced": "Offense 1.5-4.0/set AND defense 1.5-4.0/set AND setting 1.5-4.0/set AND all within 1.5 of each other AND errors <1.0/set",
      "unicorn": "Elite in 3+ categories: offense (>3.5 kills/set), setting (>8.0 assists/set), defense (>4.5 digs/set OR >1.5 blocks/set), serving (>1.2 aces/set), or efficiency (>60% kill rate)",
      "sniper": "Kill rate >55% AND kills >2.5/set AND spiking errors <0.8/set AND setting errors <0.3/set",
      "gunslinger": "Total attempts >9.0/set AND total kills >5.0/set AND total errors >2.0/set",
      "anchor": "Low attempts (spike <2.0/set, ape <0.5/set) AND low errors (spiking <0.3/set, setting <0.2/set, serving <0.2/set)",
      "technician": "Total errors <0.4/set AND spiking errors <0.25/set AND setting errors <0.15/set AND attempts ≥3.0/set AND kill rate >50% AND kills ≥2.0/set",
      "maverick-playmaker": "High errors (Maverick) AND assists >6.0/set (Playmaker)",
      "playmaking-striker": "Assists >6.0/set (Playmaker) AND (kills >2.5 spike/set OR >1.0 ape/set) AND (attempts >4.0 spike/set OR >1.5 ape/set) (Striker)",
      "playmaking-piercer": "Assists >6.0/set (Playmaker) AND (kills >3.0 spike/set OR >1.5 ape/set) AND kill rate >55% AND total kills >3.0/set (Piercer)",
      "playmaking-intimidator": "Assists >6.0/set (Playmaker) AND blocks >1.0/set OR block follows >1.5/set (Intimidator)",
      "intimidating-playmaker": "Blocks >1.0/set OR block follows >1.5/set (Intimidator) AND assists >6.0/set (Playmaker)"
    };
    return thresholds[archetypeId] || "Statistical thresholds vary based on combination";
  };

  // State for clicked archetype popup
  const [clickedArchetype, setClickedArchetype] = useState<string | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ left: number; top: number } | null>(null);
  const [legendHidden, setLegendHidden] = useState<boolean>(false);
  const legendRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  
  // Update popup position when clicked archetype changes
  useEffect(() => {
    if (clickedArchetype && legendRef.current) {
      const itemEl = itemRefs.current.get(clickedArchetype);
      if (itemEl) {
        const itemRect = itemEl.getBoundingClientRect();
        const legendRect = legendRef.current.getBoundingClientRect();
        setPopupPosition({
          left: legendRect.right + 12,
          top: itemRect.top
        });
      }
    } else {
      setPopupPosition(null);
    }
  }, [clickedArchetype]);
  
  // Update popup position when clicked archetype changes
  useEffect(() => {
    if (clickedArchetype && legendRef.current) {
      const itemEl = itemRefs.current.get(clickedArchetype);
      if (itemEl) {
        const itemRect = itemEl.getBoundingClientRect();
        const legendRect = legendRef.current.getBoundingClientRect();
        setPopupPosition({
          left: legendRect.right + 12,
          top: itemRect.top
        });
      }
    } else {
      setPopupPosition(null);
    }
  }, [clickedArchetype]);
  
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

  // Search functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const matches = vectorRows.filter(row => 
      row.playerName.toLowerCase().includes(query)
    );
    setSearchResults(matches);
  }, [searchQuery, vectorRows]);

  // Handle search result selection
  const handleSearchSelect = (player: PlayerSeasonVectorRow) => {
    // Find the player's position
    const playerPoint = points.find(p => p.row.playerId === player.playerId);
    if (!playerPoint || !controlsRef.current || !cameraRef.current) return;

    // Select the player
    handlePlayerClick(player);

    // Move camera to focus on the player
    const [px, py, pz] = playerPoint.position;
    const target = new THREE.Vector3(px, py, pz);
    
    // Calculate a good camera position (offset from the player)
    const offsetDistance = maxRange * 0.8;
    const offset = new THREE.Vector3(offsetDistance, offsetDistance, offsetDistance);
    const newCameraPos = target.clone().add(offset);
    
    // Animate camera to the new position
    if (controlsRef.current && cameraRef.current) {
      // Set the target (what the camera looks at)
      controlsRef.current.target.copy(target);
      
      // Animate camera position
      const startPos = cameraRef.current.position.clone();
      const duration = 1000; // 1 second
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Easing function (ease-out)
        const eased = 1 - Math.pow(1 - progress, 3);
        
        cameraRef.current!.position.lerpVectors(startPos, newCameraPos, eased);
        controlsRef.current!.update();
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      animate();
    }
    
    // Clear search after selection
    setSearchQuery("");
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
      {/* Search Bar */}
      <div className="player-search-container">
        <input
          type="text"
          className="player-search-input"
          placeholder="Search players..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchResults.length > 0 && (
          <div className="player-search-results">
            {searchResults.slice(0, 5).map((player) => (
              <div
                key={player.playerId}
                className="player-search-result-item"
                onClick={() => handleSearchSelect(player)}
              >
                {player.playerName}
              </div>
            ))}
            {searchResults.length > 5 && (
              <div className="player-search-result-more">
                +{searchResults.length - 5} more
              </div>
            )}
          </div>
        )}
      </div>

      {/* Archetype Legend */}
      {archetypeCounts.length > 0 && (
        <>
          <div className={`archetype-legend ${legendHidden ? 'legend-hidden' : ''}`} ref={legendRef}>
            <button
              className="archetype-legend-toggle"
              onClick={() => setLegendHidden(!legendHidden)}
              title={legendHidden ? "Show legend" : "Hide legend"}
            >
              {legendHidden ? '>' : '<'}
            </button>
            {!legendHidden && (
              <>
                {archetypeCounts.map(({ archetype, count }) => (
                  <div
                    key={archetype.id}
                    ref={(el) => {
                      if (el) itemRefs.current.set(archetype.id, el);
                      else itemRefs.current.delete(archetype.id);
                    }}
                    className="archetype-legend-item"
                    onClick={() => setClickedArchetype(clickedArchetype === archetype.id ? null : archetype.id)}
                  >
                    <span
                      className="archetype-legend-color"
                      style={{ backgroundColor: archetype.color }}
                    />
                    <span className="archetype-legend-name">{archetype.name}</span>
                    <span className="archetype-legend-count">({count})</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </>
      )}
      {/* Popup rendered outside legend to escape overflow constraints */}
      {clickedArchetype && popupPosition && (() => {
        const archetype = archetypeCounts.find(a => a.archetype.id === clickedArchetype)?.archetype;
        if (!archetype) return null;
        return (
          <div 
            className="archetype-legend-popup"
            style={{
              left: `${popupPosition.left}px`,
              top: `${popupPosition.top}px`
            }}
          >
            <div className="archetype-popup-header">{archetype.name}</div>
            <div className="archetype-popup-description">{archetype.description}</div>
            <div className="archetype-popup-thresholds">
              <strong>Statistical Thresholds:</strong>
              <div className="archetype-popup-thresholds-text">{getArchetypeThresholds(archetype.id)}</div>
            </div>
          </div>
        );
      })()}
      <Canvas
        camera={{
          position: [centerX + cameraDistance, centerY + cameraDistance, centerZ + cameraDistance],
          fov: 50
        }}
        onClick={handleCanvasClick}
        onCreated={({ camera }) => {
          cameraRef.current = camera;
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
