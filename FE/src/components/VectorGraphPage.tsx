/**
 * VectorGraphPage — the 3D player-similarity explorer: every player in a season is placed in
 * 13-dimensional statistical space, projected to three principal components, and rendered as an
 * orbitable point cloud coloured by play-style archetype.
 * The panels floating over the canvas (search, archetype legend, player info) are absolutely
 * positioned overlays rather than page chrome, which is why this page's layout is hand-built
 * instead of using PageContainer's stacked sections.
 * Lives in `components/`; routed at /vector-graph. Archetype colours come from the
 * `--archetype-*` tokens via `analytics/playerArchetypes`.
 */

import PageContainer from '@/components/ui/layout/PageContainer';
import PageHeader from '@/components/ui/layout/PageHeader';
import Card from '@/components/ui/layout/Card';
import StatCard from '@/components/ui/layout/StatCard';
import FormField from '@/components/ui/inputs/FormField';
import Select from '@/components/ui/inputs/Select';
import TextInput from '@/components/ui/inputs/TextInput';
import ErrorNotice from '@/components/ui/feedback/ErrorNotice';
import EmptyState from '@/components/ui/feedback/EmptyState';
import { PageLoader } from '@/components/ui/feedback/LoadingSpinner';

/**
 * A PCA feature's emphasis, banded by how strongly it loads onto the component.
 * Three bands rather than a continuous weight, so the type stays on the app's font scale.
 */
function featureWeightClass(weight: number): string {
  if (weight > 0.7) return 'font-bold';
  if (weight > 0.4) return 'font-semibold';
  return 'font-medium';
}
// src/components/VectorGraphPage.tsx

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { useFetchPlayersWithStats, useFetchSeasons } from "../hooks/useVectorGraphData";
import { buildSeasonVectors, computePCA3D, VECTOR_FEATURE_ORDER } from "../analytics/statsVectorization";
import type { PlayerSeasonVectorRow } from "../analytics/statsVectorization";
import { classifyPlayerArchetype, type PlayerArchetype } from "../analytics/playerArchetypes";

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
          <div className="pointer-events-none whitespace-nowrap rounded-control border border-border bg-surface-elevated px-2 py-1 text-center shadow-[var(--shadow-sm)]">
            <div className="text-xs font-semibold text-content">{vectorRow.playerName}</div>
            <div className="text-[0.625rem] text-content-tertiary">
              Sets: {vectorRow.setsPlayed}
            </div>
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
      "precise": "Total errors <0.6/set AND spiking errors <0.35/set AND setting errors <0.25/set",
      "tireless": "Spike attempts >9.0/set OR ape attempts >4.0/set OR assists >12.0/set",
      "workhorse": "Spike attempts >4.0/set OR ape attempts >1.5/set OR assists >7.0/set (but not Tireless)",
      "stalwart": "High volume (spike attempts >5.0/set OR ape attempts >2.0/set OR assists >8.0/set) AND total errors <0.8/set AND spiking errors <0.5/set AND setting errors <0.3/set",
      "opportunistic": "Low volume (attempts <3.0/set) but high impact (kills >1.5/set with >45% kill rate)",
      "selective": "Very low volume: spike attempts <1.5/set AND ape attempts <0.5/set AND assists <2.0/set AND digs <2.0/set",
      "steady": "Low attempts (spike <2.0/set, ape <0.5/set) AND low errors (spiking <0.3/set, setting <0.2/set, serving <0.2/set)",
      "striker": "Kills >2.5 spike/set OR >1.0 ape/set AND attempts >4.0 spike/set OR >1.5 ape/set",
      "piercer": "Kills >2.5 spike/set OR >1.2 ape/set AND kill rate >52% AND total kills >2.5/set AND attempts ≥2.5/set",
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
  // Legend rows are <button>s now (they are clickable), so the map is typed to the
  // common element interface rather than HTMLDivElement.
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());

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
      <div className="flex min-h-96 flex-col items-center justify-center gap-2 rounded-panel border border-dashed border-border bg-surface p-8 text-center">
        <p className="m-0 text-sm font-medium text-content">
          No players match the selected criteria.
        </p>
        <p className="m-0 text-xs text-content-muted">
          Try adjusting the minimum sets threshold or selecting a different season.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-[70vh] min-h-[500px] w-full overflow-hidden rounded-panel border border-border bg-surface-inverse">
      {/* Search — floats over the canvas, top-left. */}
      <div className="absolute left-4 top-4 z-20 w-64">
        <TextInput
          size="sm"
          placeholder="Search players..."
          aria-label="Search players"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchResults.length > 0 && (
          <div className="mt-1 overflow-hidden rounded-card border border-border bg-surface-elevated shadow-[var(--shadow-lg)]">
            {searchResults.slice(0, 5).map((player) => (
              <button
                key={player.playerId}
                type="button"
                className="block w-full cursor-pointer px-3 py-2 text-left text-sm text-content-secondary transition-colors hover:bg-surface-inset hover:text-content"
                onClick={() => handleSearchSelect(player)}
              >
                {player.playerName}
              </button>
            ))}
            {searchResults.length > 5 && (
              <div className="px-3 py-2 text-xs text-content-muted">
                +{searchResults.length - 5} more
              </div>
            )}
          </div>
        )}
      </div>

      {/* Archetype Legend */}
      {archetypeCounts.length > 0 && (
        <>
          <div
            ref={legendRef}
            className={`scroll-inverse absolute right-4 top-4 z-20 max-h-[60%] overflow-y-auto rounded-card border border-surface-inverse-raised bg-surface-inverse-raised p-2 transition-all ${legendHidden ? 'pointer-events-none w-0 p-0 opacity-0' : 'w-52'}`}
          >
            {!legendHidden &&
              archetypeCounts.map(({ archetype, count }) => (
                <button
                  key={archetype.id}
                  type="button"
                  ref={(el) => {
                    if (el) itemRefs.current.set(archetype.id, el);
                    else itemRefs.current.delete(archetype.id);
                  }}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-control px-2 py-1 text-left text-xs text-content-inverse transition-colors hover:bg-surface-inverse-inset"
                  onClick={() =>
                    setClickedArchetype(clickedArchetype === archetype.id ? null : archetype.id)
                  }
                >
                  {/* The swatch IS the archetype's identity colour, resolved from its token at
                      runtime — there is no class that could express it. */}
                  <span
                    aria-hidden
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: archetype.color }}
                  />
                  <span className="min-w-0 flex-1 truncate">{archetype.name}</span>
                  <span className="shrink-0 text-content-inverse/60">({count})</span>
                </button>
              ))}
          </div>
          <button
            type="button"
            className={`absolute top-4 z-20 flex h-8 w-6 cursor-pointer items-center justify-center rounded-control border border-surface-inverse-raised bg-surface-inverse-raised text-content-inverse transition-all ${legendHidden ? 'right-4' : 'right-[14.5rem]'}`}
            onClick={() => setLegendHidden(!legendHidden)}
            title={legendHidden ? 'Show legend' : 'Hide legend'}
            aria-label={legendHidden ? 'Show legend' : 'Hide legend'}
          >
            {legendHidden ? '>' : '<'}
          </button>
        </>
      )}
      {/* Popup rendered outside legend to escape overflow constraints */}
      {clickedArchetype && popupPosition && (() => {
        const archetype = archetypeCounts.find(a => a.archetype.id === clickedArchetype)?.archetype;
        if (!archetype) return null;
        return (
          <div
            role="tooltip"
            className="fixed z-50 w-72 rounded-card border border-border bg-surface-elevated p-3 shadow-[var(--shadow-lg)]"
            style={{ left: `${popupPosition.left}px`, top: `${popupPosition.top}px` }}
          >
            <div className="mb-1 text-sm font-semibold text-content">{archetype.name}</div>
            <div className="mb-2 text-xs leading-relaxed text-content-secondary">
              {archetype.description}
            </div>
            <div className="text-xs text-content-tertiary">
              <strong className="text-content-secondary">Statistical Thresholds:</strong>
              <div className="mt-1 font-mono text-[0.6875rem]">
                {getArchetypeThresholds(archetype.id)}
              </div>
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
        <div className="scroll-inverse absolute bottom-4 left-4 z-20 flex max-h-[70%] w-72 flex-col gap-3 overflow-y-auto rounded-card border border-surface-inverse-raised bg-surface-inverse-raised p-3 text-content-inverse">
          <button
            type="button"
            className="absolute right-2 top-2 cursor-pointer text-lg leading-none text-content-inverse/70 transition-colors hover:text-content-inverse"
            onClick={() => setInfoBoxHidden(true)}
            title="Hide info panel"
            aria-label="Hide info panel"
          >
            &times;
          </button>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="flex cursor-pointer items-center justify-between gap-2 pr-6 text-left"
              onClick={() => setPlayerInfoCollapsed(!playerInfoCollapsed)}
              aria-expanded={!playerInfoCollapsed}
            >
              <h4 className="m-0 text-sm font-semibold">Player Info</h4>
              <span aria-hidden className="text-xs text-content-inverse/60">
                {playerInfoCollapsed ? '\u25B6' : '\u25BC'}
              </span>
            </button>
            {!playerInfoCollapsed && (() => {
              // Prioritize clicked player over hovered player
              const displayPlayer = clickedPlayer || hoveredPlayer;
              if (!displayPlayer)
                return (
                  <p className="m-0 text-xs italic text-content-inverse/60">
                    Hover or click a player to see info
                  </p>
                );

              return (
                <div className="flex flex-col gap-1.5 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="m-0 text-sm font-semibold">{displayPlayer.playerName}</h4>
                    {clickedPlayer && clickedPlayer.playerId === displayPlayer.playerId && (
                      <span className="rounded-full bg-brand-muted px-2 py-0.5 text-[0.625rem] font-semibold text-content">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="m-0">Season: {displayPlayer.seasonNumber}</p>
                  <p className="m-0">Sets Played: {displayPlayer.setsPlayed}</p>
                  {clickedPlayer && clickedPlayer.playerId === displayPlayer.playerId && (
                    <>
                      {(() => {
                        const archetype = archetypeAssignments.get(displayPlayer.playerId);
                        if (archetype) {
                          const archetypePlayers = vectorRows.filter(
                            row => archetypeAssignments.get(row.playerId)?.id === archetype.id
                          );
                          return (
                            <div className="mt-1 flex flex-col gap-1 border-t border-surface-inverse-inset pt-2">
                              <p className="m-0 flex flex-wrap items-center gap-1.5">
                                <strong>Archetype:</strong> {archetype.name}
                                {/* Identity colour resolved from the archetype's token. */}
                                <span
                                  aria-hidden
                                  className="inline-block h-2.5 w-2.5 rounded-full"
                                  style={{ backgroundColor: archetype.color }}
                                />
                                <span className="text-content-inverse/60">
                                  ({archetypePlayers.length} players)
                                </span>
                              </p>
                              <p className="m-0 leading-relaxed text-content-inverse/70">
                                {archetype.description}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      })()}
                      {similarPlayers.closest && (
                        <p className="m-0">
                          <strong>Most Similar:</strong> {similarPlayers.closest.playerName}
                        </p>
                      )}
                      {similarPlayers.farthest && (
                        <p className="m-0">
                          <strong>Least Similar:</strong> {similarPlayers.farthest.playerName}
                        </p>
                      )}
                    </>
                  )}
                </div>
              );
            })()}
          </div>

          <div className="flex flex-col gap-2 border-t border-surface-inverse-inset pt-3">
            <button
              type="button"
              className="flex cursor-pointer items-center justify-between gap-2 text-left"
              onClick={() => setControlsCollapsed(!controlsCollapsed)}
              aria-expanded={!controlsCollapsed}
            >
              <h4 className="m-0 text-sm font-semibold">Controls</h4>
              <span aria-hidden className="text-xs text-content-inverse/60">
                {controlsCollapsed ? '\u25B6' : '\u25BC'}
              </span>
            </button>
            {!controlsCollapsed && (
              <ul className="m-0 flex list-disc flex-col gap-1 pl-4 text-xs text-content-inverse/80">
                <li>Rotate: Left Click + Drag</li>
                <li>Pan: Right Click + Drag</li>
                <li>Zoom: Scroll</li>
                <li>Zoom In / Out: + / - Keys</li>
                <li>View player info: Hover</li>
              </ul>
            )}
          </div>

          <div className="flex flex-col gap-2 border-t border-surface-inverse-inset pt-3">
            <button
              type="button"
              className="flex cursor-pointer items-center justify-between gap-2 text-left"
              onClick={() => setAxesCollapsed(!axesCollapsed)}
              aria-expanded={!axesCollapsed}
            >
              <h4 className="m-0 text-sm font-semibold">Axes (PCA)</h4>
              <span aria-hidden className="text-xs text-content-inverse/60">
                {axesCollapsed ? '\u25B6' : '\u25BC'}
              </span>
            </button>
            {!axesCollapsed && (
              <div className="flex flex-col gap-1 text-xs text-content-inverse/80">
                <p className="m-0">X: First Principal Component (PC1)</p>
                <p className="m-0">Y: Second Principal Component (PC2)</p>
                <p className="m-0">Z: Third Principal Component (PC3)</p>
                {model && model.explainedVariance && model.explainedVariance.length > 0 && (
                  <p className="m-0 italic text-content-inverse/60">
                    Variance explained: PC1: {((model.explainedVariance[0] / model.explainedVariance.reduce((a: number, b: number) => a + b, 0)) * 100).toFixed(1)}%,
                    PC2: {((model.explainedVariance[1] / model.explainedVariance.reduce((a: number, b: number) => a + b, 0)) * 100).toFixed(1)}%,
                    PC3: {((model.explainedVariance[2] / model.explainedVariance.reduce((a: number, b: number) => a + b, 0)) * 100).toFixed(1)}%
                  </p>
                )}
                <p className="m-0 italic text-content-inverse/60">
                  Uses all 12 statistical dimensions via PCA.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      {infoBoxHidden && (
        <button
          type="button"
          className="absolute bottom-4 left-4 z-20 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-surface-inverse-raised bg-surface-inverse-raised text-content-inverse transition-colors hover:bg-surface-inverse-inset"
          onClick={() => setInfoBoxHidden(false)}
          title="Show info panel"
          aria-label="Show info panel"
        >
          i
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

  if (playersLoading || seasonsLoading || selectedSeasonNumber === null) {
    return (
      <PageContainer width="shell">
        <PageLoader message="Loading vector graph - fetching player and season data..." />
      </PageContainer>
    );
  }

  if (playersError || seasonsError) {
    return (
      <PageContainer width="shell">
        <ErrorNotice
          title="Error Loading Data"
          message={
            <>
              {playersError && <span className="block">Error loading players: {playersError}</span>}
              {seasonsError && <span className="block">Error loading seasons: {seasonsError}</span>}
            </>
          }
        />
      </PageContainer>
    );
  }

  if (!players || !seasons || seasons.length === 0) {
    return (
      <PageContainer width="shell">
        <EmptyState
          title="No Data Available"
          description="No seasons found. Please ensure data is available in the database."
        />
      </PageContainer>
    );
  }

  const sortedSeasons = [...seasons].sort((a, b) => b.seasonNumber - a.seasonNumber);

  return (
    <PageContainer width="shell">
      <PageHeader
        title="Player Stats Vectorization"
        subtitle="Explore player statistical profiles in 3D space. Each point represents a player's normalized performance across multiple statistical dimensions."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormField label="Season" htmlFor="season-select">
          <Select
            id="season-select"
            value={selectedSeasonNumber ? String(selectedSeasonNumber) : ''}
            onChange={(e) => setSelectedSeasonNumber(Number(e.target.value))}
            options={sortedSeasons.map((season) => ({
              value: String(season.seasonNumber),
              label: `Season ${season.seasonNumber}${season.theme ? ` - ${season.theme}` : ''}`,
            }))}
          />
        </FormField>

        <FormField
          label={
            <>
              Minimum Sets Played: <strong className="text-content">{minSetsPlayed}</strong>
            </>
          }
          htmlFor="min-sets-slider"
        >
          <div className="flex flex-col gap-1">
            <input
              id="min-sets-slider"
              type="range"
              min="1"
              max="50"
              value={minSetsPlayed}
              onChange={(e) => setMinSetsPlayed(Number(e.target.value))}
              className="w-full cursor-pointer accent-[var(--color-brand)]"
            />
            <div className="flex justify-between text-[0.625rem] tabular-nums text-content-muted">
              <span>1</span>
              <span>25</span>
              <span>50</span>
            </div>
          </div>
        </FormField>

        <StatCard label="Players in Graph" value={vectorRows.length} />
        {selectedSeasonNumber && (
          <StatCard label="Selected Season" value={selectedSeasonNumber} />
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
          <div className="grid gap-4 lg:grid-cols-3">
            <Card padding="md">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-content-tertiary">
                  PC1
                </span>
                <p className="m-0 text-sm text-content-secondary">
                  {pc1Features.map((feature, idx) => (
                    <span
                      key={idx}
                      className={featureWeightClass(feature.weight)}
                      // Opacity is a continuous function of the loading, so it has no class
                      // equivalent; the weight bands above do.
                      style={{ opacity: 0.4 + feature.weight * 0.6 }}
                    >
                      {feature.text}
                      {idx < pc1Features.length - 1 && ', '}
                    </span>
                  ))}
                </p>
              </div>
            </Card>
            <Card padding="md">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-content-tertiary">
                  PC2
                </span>
                <p className="m-0 text-sm text-content-secondary">
                  {pc2Features.map((feature, idx) => (
                    <span
                      key={idx}
                      className={featureWeightClass(feature.weight)}
                      // Opacity is a continuous function of the loading, so it has no class
                      // equivalent; the weight bands above do.
                      style={{ opacity: 0.4 + feature.weight * 0.6 }}
                    >
                      {feature.text}
                      {idx < pc2Features.length - 1 && ', '}
                    </span>
                  ))}
                </p>
              </div>
            </Card>
            <Card padding="md">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-content-tertiary">
                  PC3
                </span>
                <p className="m-0 text-sm text-content-secondary">
                  {pc3Features.map((feature, idx) => (
                    <span
                      key={idx}
                      className={featureWeightClass(feature.weight)}
                      // Opacity is a continuous function of the loading, so it has no class
                      // equivalent; the weight bands above do.
                      style={{ opacity: 0.4 + feature.weight * 0.6 }}
                    >
                      {feature.text}
                      {idx < pc3Features.length - 1 && ', '}
                    </span>
                  ))}
                </p>
              </div>
            </Card>
          </div>
        );
      })()}

      <VectorGraph3D
        vectorRows={vectorRows}
        onPlayerHover={() => {}} // Hover state is managed internally by VectorGraph3D
        onPlayerClick={() => {}} // Click state is managed internally by VectorGraph3D
      />

      <Card tone="inset" padding="lg">
        <div className="flex flex-col gap-2">
          <h3 className="m-0 text-base font-semibold text-content">About This Visualization</h3>
          <p className="m-0 text-sm leading-relaxed text-content-secondary">
            This graph represents players as vectors in a 13-dimensional statistical space,
            projected into 3D for visualization. Each player's position is determined by their
            normalized (z-scored) performance across multiple statistical categories.
          </p>
          <p className="m-0 text-sm leading-relaxed text-content-secondary">
            <strong className="text-content">Statistical Dimensions Used (13 total):</strong> Spike
            kills per set, Spike attempts per set, APE kills per set, APE attempts per set, Blocks
            per set, Assists per set, Aces per set, Digs per set, Block follows per set, Spiking
            errors per set, Setting errors per set, Serving errors per set, and Misc errors per set.
          </p>
          <p className="m-0 text-xs text-content-muted">
            Vector Version: v2 | Projection: PCA (Principal Component Analysis)
          </p>
        </div>
      </Card>
    </PageContainer>
  );
};

export default VectorGraphPage;
