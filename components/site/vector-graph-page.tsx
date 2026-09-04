// @ts-nocheck
"use client";

// src/components/VectorGraphPage.tsx

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { buildSeasonVectors, computePCA3D, VECTOR_FEATURE_ORDER } from "@/lib/analytics/stats-vectorization";
import type { PlayerSeasonVectorRow, VectorGraphPlayer } from "@/lib/analytics/stats-vectorization";
import { classifyPlayerArchetype, type PlayerArchetype } from "@/lib/analytics/player-archetypes";

const DEFAULT_MIN_SETS = 5;

/* ── Page chrome ─────────────────────────────────────────────────────────────
   Named because several strings are long and many are reused. Every value is
   literal rather than a scale step: this page was written in rem and px that
   do not line up with Tailwind's scale, and rounding them is a look change. */

const vectorGraphPage =
  "p-[20px] max-w-[1200px] mx-auto min-h-[100vh] box-border bg-rvl-ground upto-md:p-[1rem]";

const vectorGraphHeader = "mt-0 mr-0 mb-[20px] ml-0 p-0 border-none";

const vectorGraphHeaderTitle =
  "mt-0 mr-0 mb-[10px] ml-0 p-0 border-none font-display text-[2rem] font-bold text-text upto-md:text-[1.75rem]";

const vectorGraphSubtitle = "text-[1rem] text-rvl-ink-2 leading-[1.5] m-0";

/* Two-column `1fr 1fr` is not grid-cols-2 (that is minmax(0, 1fr)). At 768px
   the stylesheet set both `flex-direction: column` and `grid-template-columns:
   1fr`; it is `display: grid`, so flex-direction was a no-op. gap: 15px won
   over the earlier gap: 12px in the same query. */
const vectorGraphControls =
  "grid grid-cols-[1fr_1fr] gap-[20px] my-[20px] mx-0 py-[12px] px-[15px] " +
  "bg-rvl-panel rounded-[8px] border border-rvl-line " +
  "upto-md:grid-cols-[1fr] upto-md:gap-[15px] upto-md:py-[10px] upto-md:px-[12px]";

/* `.pca-components-row` overrode only columns and margin-top. The 768px
   `.vector-graph-controls` rule still collapses it to one column. */
const vectorGraphControlsPca =
  "grid grid-cols-[1fr_1fr_1fr] gap-[20px] mt-0 mb-[20px] mx-0 py-[12px] px-[15px] " +
  "bg-rvl-panel rounded-[8px] border border-rvl-line " +
  "upto-md:grid-cols-[1fr] upto-md:gap-[15px] upto-md:py-[10px] upto-md:px-[12px]";

const controlGroup =
  "flex flex-col gap-[6px] min-w-[200px] flex-1 upto-md:w-full " +
  "[&_label]:font-medium [&_label]:text-text [&_label]:text-[13px] [&_label]:m-0";

/* `.pca-component { min-width: auto }` beats `.control-group { min-width: 200px }`. */
const pcaComponent =
  "flex flex-col gap-[6px] min-w-auto flex-1 upto-md:w-full " +
  "[&_label]:font-medium [&_label]:text-text [&_label]:text-[13px] [&_label]:m-0";

const statValueLarge =
  "text-[18px] font-bold text-rvl-accent leading-[1] m-0 py-[4px] px-0";

const pcaDescription =
  "text-[12px] text-text font-medium leading-[1.3] m-0 py-[2px] px-0";

const pcaFeature = "inline transition-[opacity] duration-200 ease-[ease]";

/* The chevron is the same glyph as FilterSelect (`--chevron-down-white`).
   Hover/focus restated the url inside the `background` shorthand so the icon
   survived the fill change; `hover:bg-*` only touches background-color, so
   the image stays without repeating it. */
const controlSelect =
  "text-[14px] py-[6px] px-[12px] pr-[32px] border border-rvl-accent-soft rounded-[4px] " +
  "bg-rvl-accent-soft bg-[image:var(--chevron-down-white)] bg-no-repeat bg-[right_8px_center] bg-[length:20px] " +
  "text-rvl-ink cursor-pointer transition-[background-color] duration-200 ease-[ease] " +
  "appearance-none shadow-none h-auto " +
  "hover:bg-rvl-accent-soft hover:border-rvl-accent hover:outline-none " +
  "hover:shadow-[0_0_0_2px_var(--rvl-accent-soft)] " +
  "focus:bg-rvl-accent-soft focus:border-rvl-accent focus:outline-none " +
  "focus:shadow-[0_0_0_2px_var(--rvl-accent-soft)]";

const controlSlider =
  "w-full h-[6px] rounded-[3px] bg-rvl-line outline-none appearance-none " +
  "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:[-webkit-appearance:none] " +
  "[&::-webkit-slider-thumb]:w-[18px] [&::-webkit-slider-thumb]:h-[18px] " +
  "[&::-webkit-slider-thumb]:rounded-[50%] [&::-webkit-slider-thumb]:bg-rvl-accent-soft " +
  "[&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-[background] " +
  "[&::-webkit-slider-thumb]:duration-200 [&::-webkit-slider-thumb]:ease-[ease] " +
  "[&::-webkit-slider-thumb:hover]:bg-rvl-accent " +
  "[&::-moz-range-thumb]:w-[18px] [&::-moz-range-thumb]:h-[18px] " +
  "[&::-moz-range-thumb]:rounded-[50%] [&::-moz-range-thumb]:bg-rvl-accent-soft " +
  "[&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none " +
  "[&::-moz-range-thumb]:transition-[background] [&::-moz-range-thumb]:duration-200 " +
  "[&::-moz-range-thumb]:ease-[ease] [&::-moz-range-thumb:hover]:bg-rvl-accent";

const sliderLabels = "flex justify-between text-[12px] text-rvl-dim mt-[4px]";

const vectorGraphContent =
  "my-[20px] mx-0 bg-rvl-panel rounded-[8px] border border-rvl-line p-[1rem] " +
  "min-h-[600px] upto-md:min-h-[400px]";

const vectorGraphFooter =
  "my-[20px] mx-0 p-[20px] bg-rvl-panel rounded-[8px] border border-rvl-line";

const infoBoxTitle =
  "mt-0 mr-0 mb-[15px] ml-0 text-text text-[1.25rem] font-bold";

const infoBoxP = "leading-[1.6] text-rvl-ink-2 mb-[10px]";

/* `.info-box .version-info` (0,2,0) beats `.info-box p` for color and
   margin-bottom. line-height: 1.6 still comes from the p rule. */
const versionInfo = "leading-[1.6] text-[0.875rem] text-rvl-dim italic mb-0";

const statusContainer =
  "text-center py-[4rem] px-[2rem] bg-rvl-panel rounded-[8px] border border-rvl-line";

const statusTitle = "text-text mb-[1rem] text-[1.5rem] font-bold";

const errorText = "text-[#e53e3e] my-[0.5rem] mx-0";

const vectorGraph3d =
  "relative w-full h-[600px] rounded-[8px] overflow-hidden bg-[#1a1a1a] upto-md:h-[400px]";

const playerSearchContainer = "absolute top-[1rem] left-[1rem] z-[25] w-[224px]";

const playerSearchInput =
  "w-full py-[0.5rem] px-[0.75rem] text-[14px] border border-[#3a3a3a] rounded-[6px] " +
  "bg-[#1a1a1a] text-[#e2e8f0] shadow-[0_2px_4px_rgba(0,0,0,0.2)] " +
  "transition-[border-color,box-shadow] duration-200 ease-[ease] " +
  "focus:outline-none focus:border-[#5a5a5a] focus:shadow-[0_2px_8px_rgba(0,0,0,0.3)] " +
  "placeholder:text-[#6a6a6a]";

const playerSearchResults =
  "mt-[0.5rem] bg-[#1a1a1a] border border-[#3a3a3a] rounded-[6px] " +
  "shadow-[0_4px_6px_rgba(0,0,0,0.3)] max-h-[200px] overflow-y-auto z-[25] " +
  "absolute w-full top-[calc(100%_+_0.5rem)] left-0";

const playerSearchResultItem =
  "py-[0.5rem] px-[0.75rem] cursor-pointer text-[#e2e8f0] text-[14px] " +
  "transition-[background-color] duration-150 ease-[ease] border-b border-b-[#2a2a2a] " +
  "last:border-b-0 hover:bg-[#2a2a2a]";

const playerSearchResultMore =
  "py-[0.5rem] px-[0.75rem] text-[#8a8a8a] text-[12px] italic text-center " +
  "border-t border-t-[#2a2a2a]";

/* `dark-scrollbar` stays a class: it is defined in App.css.
   Default/hidden `transform` is applied in JSX so only one value is present. */
const archetypeLegend =
  "dark-scrollbar absolute top-[4rem] left-[1rem] bottom-[2rem] z-[10] w-[224px] " +
  "max-h-[calc(600px_-_5rem)] overflow-y-auto overflow-x-visible " +
  "pt-[0.75rem] px-[0.75rem] pb-[1rem] bg-[#1a1a1a] border border-[#3a3a3a] rounded-[6px] " +
  "shadow-[0_2px_4px_rgba(0,0,0,0.2)] flex flex-col gap-[0.5rem] " +
  "transition-[transform] duration-300 ease-[ease-in-out]";

const archetypeLegendToggle =
  "absolute top-[4rem] bg-transparent border-none rounded-none text-[1.1rem] font-semibold " +
  "text-[rgba(226,232,240,0.5)] cursor-pointer py-[0.25rem] px-[0.5rem] min-w-auto h-auto " +
  "flex items-center justify-center leading-[1] transition-all duration-200 ease-[ease] " +
  "z-[15] opacity-[0.6] hover:text-[rgba(226,232,240,1)] hover:opacity-100";

const archetypeLegendItem =
  "flex items-center gap-[0.5rem] py-[0.375rem] px-[0.5rem] text-[#e2e8f0] text-[13px] " +
  "cursor-pointer relative rounded-[4px] transition-[background-color] duration-150 ease-[ease] " +
  "overflow-visible hover:bg-[#2a2a2a]";

const archetypeLegendColor =
  "w-[12px] h-[12px] rounded-[50%] shrink-0 border border-[rgba(255,255,255,0.2)]";

const archetypeLegendName =
  "flex-1 font-medium min-w-0 overflow-hidden text-ellipsis whitespace-nowrap";

const archetypeLegendCount = "text-[#8a8a8a] text-[12px]";

const archetypeLegendPopup =
  "fixed min-w-[250px] max-w-[320px] w-max p-[1rem] bg-[#2a2a2a] border border-[#3a3a3a] " +
  "rounded-[6px] text-[#e2e8f0] text-[12px] leading-[1.5] z-[10000] " +
  "shadow-[0_4px_6px_rgba(0,0,0,0.3)] pointer-events-auto break-words whitespace-normal " +
  "[transform:translateX(0.75rem)] " +
  "before:content-[''] before:absolute before:right-[100%] before:top-[0.75rem] " +
  "before:[border-width:6px] before:[border-style:solid] " +
  "before:[border-top-color:transparent] before:[border-bottom-color:transparent] " +
  "before:[border-left-color:transparent] before:[border-right-color:#2a2a2a]";

const archetypePopupHeader =
  "text-[14px] font-bold text-[#ffffff] mb-[0.5rem] pb-[0.5rem] border-b border-b-[#3a3a3a]";

const archetypePopupDescription = "mb-[0.75rem] text-[#e2e8f0]";

const archetypePopupThresholds = "mt-[0.75rem] pt-[0.75rem] border-t border-t-[#3a3a3a]";

const archetypePopupThresholdsLabel =
  "block text-[#ffffff] mb-[0.5rem] text-[11px] uppercase tracking-[0.5px]";

const archetypePopupThresholdsText = "text-[#b0b0b0] text-[11px] leading-[1.6]";

const vectorGraphEmpty =
  "flex flex-col items-center justify-center h-[600px] text-rvl-dim text-center p-[2rem] " +
  "upto-md:h-[400px] " +
  "[&_p]:my-[0.5rem] [&_p]:mx-0 [&_p]:text-[1rem] [&_p]:text-rvl-ink-2";

const playerLabel =
  "bg-[rgba(0,0,0,0.85)] text-white py-[0.5rem] px-[0.75rem] rounded-[6px] " +
  "text-[0.85rem] pointer-events-none whitespace-nowrap shadow-[0_2px_8px_rgba(0,0,0,0.3)]";

const playerName = "font-semibold mb-[0.25rem]";

const playerSets = "text-[0.75rem] opacity-90";

const vectorGraphInfo =
  "absolute top-[1rem] right-[1rem] bg-rvl-ground/95 rounded-[8px] p-[1rem] " +
  "min-w-[250px] max-w-[300px] min-h-[200px] shadow-[0_4px_6px_rgba(0,0,0,0.2)] z-[10] " +
  "max-h-[calc(100%_-_2rem)] overflow-y-auto border border-rvl-line " +
  "upto-md:relative upto-md:top-auto upto-md:right-auto upto-md:max-w-full " +
  "upto-md:mt-[1rem] upto-md:max-h-none";

const infoBoxToggle =
  "absolute top-[0.75rem] right-[0.75rem] bg-transparent border-none text-[1.5rem] " +
  "text-rvl-ink-2 cursor-pointer p-0 w-[24px] h-[24px] flex items-center justify-center " +
  "leading-[1] transition-[color] duration-200 ease-[ease] z-[11] hover:text-text";

const infoBoxShowButton =
  "absolute top-[1rem] right-[1rem] bg-rvl-ground/95 border border-rvl-line " +
  "rounded-[8px] text-[1.5rem] text-rvl-ink-2 cursor-pointer py-[0.5rem] px-[0.75rem] " +
  "w-[40px] h-[40px] flex items-center justify-center shadow-[0_4px_6px_rgba(0,0,0,0.2)] " +
  "transition-all duration-200 ease-[ease] z-[10] " +
  "hover:bg-rvl-ground hover:text-text hover:shadow-[0_6px_8px_rgba(0,0,0,0.3)]";

const infoSection =
  "mb-[1rem] border-b border-b-rvl-line last:border-b-0 last:mb-0 last:pb-0 " +
  "[&_p]:my-[0.25rem] [&_p]:mx-0 [&_p]:text-[0.85rem] [&_p]:text-rvl-ink-2 [&_p]:leading-[1.4] " +
  "[&_ul]:my-[0.5rem] [&_ul]:mx-0 [&_ul]:pl-[1.25rem] [&_ul]:text-[0.85rem] [&_ul]:text-rvl-ink-2 " +
  "[&_li]:my-[0.25rem] [&_li]:mx-0 [&_li]:leading-[1.4]";

/* Margin-bottom is applied in JSX: `.info-section.collapsed .info-section-header`
   set it to 0, otherwise `margin: 0 0 0.5rem 0`. */
const infoSectionHeader =
  "flex justify-between items-center cursor-pointer select-none py-[0.5rem] pr-[2rem] " +
  "transition-[background-color] duration-200 ease-[ease] rounded-[4px] mt-0 mr-0 ml-0 " +
  "hover:bg-rvl-line";

/* `.info-section-header h4` plus `.info-section h4`: header contributes flex and
   pointer-events; the later h4 rule wins font-size, color, and weight. */
const infoSectionHeaderTitle =
  "m-0 flex-1 pointer-events-none text-[0.95rem] text-rvl-ink-2 font-semibold";

const collapseIcon =
  "text-[0.85rem] text-rvl-dim transition-[transform] duration-200 ease-[ease] " +
  "ml-[0.5rem] pointer-events-none inline-block min-w-[12px]";

const hoveredPlayerInfo =
  "bg-rvl-accent-soft p-[0.75rem] rounded-[6px] mt-[0.5rem] border border-rvl-accent";

const playerInfoHeader = "flex justify-between items-center mb-[0.5rem]";

/* `.hovered-player-info h4` comes last among equal-specificity h4 rules, so it
   wins margin/color/size/weight; `.player-info-header h4` still contributes flex. */
const playerInfoHeaderTitle =
  "mt-0 mr-0 mb-[0.5rem] ml-0 flex-1 text-rvl-accent text-[1rem] font-bold";

const selectedBadge =
  "bg-[#4ecdc4] text-white py-[0.25rem] px-[0.5rem] rounded-[4px] text-[0.75rem] " +
  "font-semibold uppercase tracking-[0.5px]";

const clusterInfo =
  "mt-[0.5rem] pt-[0.5rem] border-t border-t-rvl-line";

const clusterColorIndicator =
  "inline-block w-[12px] h-[12px] rounded-[50%] ml-[0.5rem] align-middle " +
  "border border-rvl-line-strong";

const similarityInfo = "mt-[0.5rem]";

/* `.info-section p` / `.hovered-player-info p` beat `.archetype-description`
   for size, color, and margin. font-style is the only property that lands. */
const archetypeDescription = "italic";

/* `.note { font-size: 0.8rem !important }` beats the p rule; color #718096
   loses to `.info-section p { color: #4a5568 }`. */
const note = "italic text-[0.8rem]!";

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
          <div className={playerLabel}>
            <div className={playerName}>{vectorRow.playerName}</div>
            <div className={playerSets}>Sets: {vectorRow.setsPlayed}</div>
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
      <div className={vectorGraphEmpty}>
        <p>No players match the selected criteria.</p>
        <p>Try adjusting the minimum sets threshold or selecting a different season.</p>
      </div>
    );
  }

  return (
    <div className={vectorGraph3d}>
      {/* Search Bar */}
      <div className={playerSearchContainer}>
        <input
          type="text"
          className={playerSearchInput}
          placeholder="Search players..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchResults.length > 0 && (
          <div className={playerSearchResults}>
            {searchResults.slice(0, 5).map((player) => (
              <div
                key={player.playerId}
                className={playerSearchResultItem}
                onClick={() => handleSearchSelect(player)}
              >
                {player.playerName}
              </div>
            ))}
            {searchResults.length > 5 && (
              <div className={playerSearchResultMore}>
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
            className={`${archetypeLegend} ${legendHidden ? "[transform:translateX(calc(-100%_+_40px))]" : "[transform:translateX(0)]"}`}
            ref={legendRef}
          >
            {!legendHidden && (
              <>
                {archetypeCounts.map(({ archetype, count }) => (
                  <div
                    key={archetype.id}
                    ref={(el) => {
                      if (el) itemRefs.current.set(archetype.id, el);
                      else itemRefs.current.delete(archetype.id);
                    }}
                    className={archetypeLegendItem}
                    onClick={() => setClickedArchetype(clickedArchetype === archetype.id ? null : archetype.id)}
                  >
                    <span
                      className={archetypeLegendColor}
                      style={{ backgroundColor: archetype.color }}
                    />
                    <span className={archetypeLegendName}>{archetype.name}</span>
                    <span className={archetypeLegendCount}>({count})</span>
                  </div>
                ))}
              </>
            )}
          </div>
          <button
            className={`${archetypeLegendToggle} ${legendHidden ? "left-[0.75rem]" : "left-[calc(1rem_+_224px_+_1.5rem)]"}`}
            onClick={() => setLegendHidden(!legendHidden)}
            title={legendHidden ? "Show legend" : "Hide legend"}
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
            className={archetypeLegendPopup}
            style={{
              left: `${popupPosition.left}px`,
              top: `${popupPosition.top}px`
            }}
          >
            <div className={archetypePopupHeader}>{archetype.name}</div>
            <div className={archetypePopupDescription}>{archetype.description}</div>
            <div className={archetypePopupThresholds}>
              <strong className={archetypePopupThresholdsLabel}>Statistical Thresholds:</strong>
              <div className={archetypePopupThresholdsText}>{getArchetypeThresholds(archetype.id)}</div>
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
        <div className={vectorGraphInfo}>
          <button 
            className={infoBoxToggle}
            onClick={() => setInfoBoxHidden(true)}
            title="Hide info panel"
            aria-label="Hide info panel"
          >
            ×
          </button>
          
          <div className={infoSection}>
            <div 
              className={`${infoSectionHeader} ${playerInfoCollapsed ? "mb-0" : "mb-[0.5rem]"}`}
              onClick={() => setPlayerInfoCollapsed(!playerInfoCollapsed)}
            >
              <h4 className={infoSectionHeaderTitle}>Player Info</h4>
              <span className={collapseIcon}>{playerInfoCollapsed ? '▶' : '▼'}</span>
            </div>
            {!playerInfoCollapsed && (() => {
              // Prioritize clicked player over hovered player
              const displayPlayer = clickedPlayer || hoveredPlayer;
              if (!displayPlayer) return <p className={note}>Hover or click a player to see info</p>;
              
              return (
                <div className={hoveredPlayerInfo}>
                  <div className={playerInfoHeader}>
                    <h4 className={playerInfoHeaderTitle}>{displayPlayer.playerName}</h4>
                    {clickedPlayer && clickedPlayer.playerId === displayPlayer.playerId && (
                      <span className={selectedBadge}>Selected</span>
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
                            <div className={clusterInfo}>
                              <p>
                                <strong>Archetype:</strong> {archetype.name}
                                <span 
                                  className={clusterColorIndicator}
                                  style={{ backgroundColor: archetype.color }}
                                />
                                ({archetypePlayers.length} players)
                              </p>
                              <p className={archetypeDescription}>{archetype.description}</p>
                            </div>
                          );
                        }
                        return null;
                      })()}
                      {similarPlayers.closest && (
                        <div className={similarityInfo}>
                          <p><strong>Most Similar:</strong> {similarPlayers.closest.playerName}</p>
                        </div>
                      )}
                      {similarPlayers.farthest && (
                        <div className={similarityInfo}>
                          <p><strong>Least Similar:</strong> {similarPlayers.farthest.playerName}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })()}
          </div>
          
          <div className={infoSection}>
            <div 
              className={`${infoSectionHeader} ${controlsCollapsed ? "mb-0" : "mb-[0.5rem]"}`}
              onClick={() => setControlsCollapsed(!controlsCollapsed)}
            >
              <h4 className={infoSectionHeaderTitle}>Controls</h4>
              <span className={collapseIcon}>{controlsCollapsed ? '▶' : '▼'}</span>
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
          
          <div className={infoSection}>
            <div 
              className={`${infoSectionHeader} ${axesCollapsed ? "mb-0" : "mb-[0.5rem]"}`}
              onClick={() => setAxesCollapsed(!axesCollapsed)}
            >
              <h4 className={infoSectionHeaderTitle}>Axes (PCA)</h4>
              <span className={collapseIcon}>{axesCollapsed ? '▶' : '▼'}</span>
            </div>
            {!axesCollapsed && (
              <>
                <p>X: First Principal Component (PC1)</p>
                <p>Y: Second Principal Component (PC2)</p>
                <p>Z: Third Principal Component (PC3)</p>
                {model && model.explainedVariance && model.explainedVariance.length > 0 && (
                  <p className={note}>
                    Variance explained: PC1: {((model.explainedVariance[0] / model.explainedVariance.reduce((a: number, b: number) => a + b, 0)) * 100).toFixed(1)}%, 
                    PC2: {((model.explainedVariance[1] / model.explainedVariance.reduce((a: number, b: number) => a + b, 0)) * 100).toFixed(1)}%, 
                    PC3: {((model.explainedVariance[2] / model.explainedVariance.reduce((a: number, b: number) => a + b, 0)) * 100).toFixed(1)}%
                  </p>
                )}
                <p className={note}>Uses all 12 statistical dimensions via PCA.</p>
              </>
            )}
          </div>
        </div>
      )}
      {infoBoxHidden && (
        <button 
          className={infoBoxShowButton}
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

export function VectorGraphPage({
  players,
  seasons,
}: {
  players: VectorGraphPlayer[];
  seasons: { id: number; seasonNumber: number; theme: string | null }[];
}) {
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number | null>(null);
  const [minSetsPlayed, setMinSetsPlayed] = useState<number>(DEFAULT_MIN_SETS);

  // Auto-select first season when seasons load
  React.useEffect(() => {
    if (seasons && seasons.length > 0 && selectedSeasonNumber === null) {
      const sortedSeasons = [...seasons].sort((a, b) => b.seasonNumber - a.seasonNumber);
      const latest = sortedSeasons[0];
      if (latest) setSelectedSeasonNumber(latest.seasonNumber);
    }
  }, [seasons, selectedSeasonNumber]);

  // Compute vectors for selected season
  const vectorRows = useMemo(() => {
    if (!players || !selectedSeasonNumber) {
      return [];
    }
    return buildSeasonVectors(players, selectedSeasonNumber, minSetsPlayed);
  }, [players, selectedSeasonNumber, minSetsPlayed]);

  if (seasons.length === 0) {
    return (
      <div className={vectorGraphPage}>
        <div className={statusContainer}>
          <h2 className={statusTitle}>No Data Available</h2>
          <p className={errorText}>No seasons found. Please ensure data is available in the database.</p>
        </div>
      </div>
    );
  }

  const sortedSeasons = [...seasons].sort((a, b) => b.seasonNumber - a.seasonNumber);

  return (
    <div className={vectorGraphPage}>
      <div className={vectorGraphHeader}>
        <h1 className={vectorGraphHeaderTitle}>Player Stats Vectorization</h1>
        <p className={vectorGraphSubtitle}>
          Explore player statistical profiles in 3D space. Each point represents a player's normalized
          performance across multiple statistical dimensions.
        </p>
      </div>

      <div className={vectorGraphControls}>
        <div className={controlGroup}>
          <label htmlFor="season-select">Season:</label>
          <select
            id="season-select"
            value={selectedSeasonNumber || ""}
            onChange={(e) => setSelectedSeasonNumber(Number(e.target.value))}
            className={controlSelect}
          >
            {sortedSeasons.map((season) => (
              <option key={season.id} value={season.seasonNumber}>
                Season {season.seasonNumber} {season.theme ? `- ${season.theme}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className={controlGroup}>
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
            className={controlSlider}
          />
          <div className={sliderLabels}>
            <span>1</span>
            <span>25</span>
            <span>50</span>
          </div>
        </div>

        <div className={controlGroup}>
          <label>Players in Graph:</label>
          <div className={statValueLarge}>{vectorRows.length}</div>
        </div>

        {selectedSeasonNumber && (
          <div className={controlGroup}>
            <label>Selected Season:</label>
            <div className={statValueLarge}>{selectedSeasonNumber}</div>
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
          <div className={vectorGraphControlsPca}>
            <div className={pcaComponent}>
              <label>PC1:</label>
              <div className={pcaDescription}>
                {pc1Features.map((feature, idx) => (
                  <span
                    key={idx}
                    className={pcaFeature}
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
            <div className={pcaComponent}>
              <label>PC2:</label>
              <div className={pcaDescription}>
                {pc2Features.map((feature, idx) => (
                  <span
                    key={idx}
                    className={pcaFeature}
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
            <div className={pcaComponent}>
              <label>PC3:</label>
              <div className={pcaDescription}>
                {pc3Features.map((feature, idx) => (
                  <span
                    key={idx}
                    className={pcaFeature}
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

      <div className={vectorGraphContent}>
        <VectorGraph3D
          vectorRows={vectorRows}
          onPlayerHover={() => {}} // Hover state managed internally by VectorGraph3D
          onPlayerClick={() => {}} // Click state managed internally by VectorGraph3D
        />
      </div>

      <div className={vectorGraphFooter}>
        <div>
          <h3 className={infoBoxTitle}>About This Visualization</h3>
          <p className={infoBoxP}>
            This graph represents players as vectors in a 13-dimensional statistical space, projected
            into 3D for visualization. Each player's position is determined by their normalized (z-scored)
            performance across multiple statistical categories.
          </p>
          <p className={infoBoxP}>
            <strong>Statistical Dimensions Used (13 total):</strong> Spike kills per set, Spike attempts per set, 
            APE kills per set, APE attempts per set, Blocks per set, Assists per set, Aces per set, 
            Digs per set, Block follows per set, Spiking errors per set, Setting errors per set, 
            Serving errors per set, and Misc errors per set.
          </p>
          <p className={versionInfo}>Vector Version: v2 | Projection: PCA (Principal Component Analysis)</p>
        </div>
      </div>
    </div>
  );
};

