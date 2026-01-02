# Vector Graph Implementation Log

This document tracks what has been implemented in the Stats Vectorization & 3D Graphing feature.

---

## Implementation Status

### ✅ Completed Features

#### Core Vectorization System
- **File:** `FE/src/analytics/statsVectorization.ts`
- **Functions:**
  - `buildSeasonVectors()` - Converts player stats to z-scored vectors
  - `computePCA3D()` - PCA projection from 12D to 3D
  - `aggregatePlayerSeason()` - Aggregates stats across season
  - `computePerSetFeatures()` - Calculates per-set statistics
  - `computeFeaturePopulationStats()` - Z-score normalization
- **Status:** ✅ Complete
- **Version:** v2 (PCA-based, 13 raw stats)
- **Missing Data:** All stats use `asNumber()` helper to safely handle undefined/null values (treated as 0)

#### Data Fetching
- **File:** `FE/src/hooks/useVectorGraphData.ts`
- **Hooks:**
  - `useFetchPlayersWithStats()` - Fetches all players with stats
  - `useFetchSeasons()` - Fetches all seasons
- **Status:** ✅ Complete

#### Main Page Component
- **File:** `FE/src/components/VectorGraphPage.tsx`
- **Features:**
  - Season selection dropdown
  - Minimum sets played slider (default: 5)
  - Players in graph count display
  - Selected season display
  - PCA components display (PC1, PC2, PC3 with top 4 features each)
  - 2x2 grid layout for controls
  - Keyboard zoom controls (+/- keys)
  - Hover state management for overlapping points
  - Click-to-select with persistent popup
  - Click empty space to deselect
- **Status:** ✅ Complete

#### 3D Visualization
- **File:** `FE/src/components/VectorGraphPage.tsx` (VectorGraph3D component)
- **Features:**
  - React Three Fiber integration
  - OrbitControls for camera manipulation
  - Player points as 3D spheres
  - Hover highlighting (color change + scale)
  - Player info popups on hover
  - Click-to-select with persistent popup
  - Closest point detection for overlapping points
  - Grid and axes helpers
  - Ambient and point lighting
- **Status:** ✅ Complete

#### Styling
- **File:** `FE/src/styles/VectorGraphPage.css`
- **Features:**
  - Responsive grid layout
  - Control group styling
  - 3D container styling
  - Info panel styling
  - Color-coded PCA feature display
  - Mobile-responsive breakpoints
- **Status:** ✅ Complete

#### Routing & Navigation
- **File:** `FE/src/App.tsx`, `FE/src/components/NavBar.tsx`
- **Features:**
  - Public route `/vector-graph`
  - Navigation bar link
- **Status:** ✅ Complete

---

## Technical Implementation Details

### Statistical Dimensions (13 total)
1. Spike kills per set
2. Spike attempts per set
3. APE kills per set
4. APE attempts per set
5. Blocks per set
6. Assists per set
7. Aces per set
8. Digs per set
9. Block follows per set
10. Spiking errors per set
11. Setting errors per set
12. Serving errors per set
13. Misc errors per set

### Missing Data Handling
- **Function:** `asNumber()` helper in `statsVectorization.ts`
- **Behavior:** Safely converts `undefined`, `null`, `NaN`, or non-number values to `0`
- **Usage:** Applied to all stat fields during aggregation
- **Rationale:** Ensures missing stats don't break calculations; missing values are treated as 0
- **Affected Stats:** All 13 statistical dimensions are protected with `asNumber()` wrapper

### PCA Implementation
- Computes covariance matrix from z-scored vectors
- Uses power iteration with deflation for eigenvalue decomposition
- Projects onto first 3 principal components
- Displays explained variance for each component
- Shows top 4 contributing features per PC with color-coded weights
- Handles zero-variance features safely (returns 0 for all players if std <= 1e-9)

### Accessibility Features
- Keyboard zoom controls (+/- keys)
- Works without mouse
- Ignores keypresses when typing in input fields

### Performance Optimizations
- Uses `useMemo` for expensive computations (PCA, point calculations)
- Efficient hover state management with object-based tracking
- React hooks properly ordered to avoid conditional hook calls

---

## Known Issues / Future Improvements

### Potential Enhancements
- [ ] Color coding by position/team
- [ ] Clustering/archetype detection
- [ ] Cross-season comparison
- [ ] Player similarity calculations
- [ ] Export functionality
- [ ] Animation/transitions

---

## Version History

- **v2.6** - Added player similarity analytics and fixed hover state issues
  - Added similarity calculations: When clicking a player, calculates most similar (closest) and least similar (farthest) players
  - Uses Euclidean distance on z-vectors (normalized stats) to find similar players
  - Displays similarity results in player info panel when a player is selected
  - Fixed hover state clearing: Added `setHoveredPoints({})` to properly clear hover state when clicking empty space
  - Reordered controls list: Action first, then input method (e.g., "Rotate: Left Click + Drag")

- **v2.5** - Fixed click-to-select functionality and improved info panel styling
  - Fixed click-to-select: Changed from `onClick` to `onPointerDown`/`onPointerUp` to properly handle mouse release
  - Added drag detection: Distinguishes between clicks and drags (ignores if mouse moved >5px or took >300ms)
  - Selection now persists after mouse release (not just while holding button)
  - Removed margins from info section headers and h4 elements for tighter spacing
  - Updated axes labels to include PC1/PC2/PC3 designations

- **v2.4** - Added collapsible sections to info panel
  - Each section (Player Info, Controls, Axes) can be individually collapsed/expanded
  - Added clickable headers with collapse icons (▶/▼) for each section
  - Added hide/show button (×) to minimize the entire info panel
  - When hidden, shows a small info button (ℹ) to restore the panel
  - Improved UX by allowing users to customize which information is visible
  - Fixed CSS positioning issue (removed duplicate `position: relative` that was overriding `position: absolute`)
  - Added minimum width (250px) and minimum height (200px) to prevent constant resizing
  - Improved spacing between close button (×) and section headers to prevent accidental clicks

- **v2.8** - Refactored archetype system to prefix-suffix combination model and separated into own module
  - Replaced flat list of 20 archetypes with a combination system
  - Primary traits (prefixes): Error Prone, Efficient, High Volume, Low Volume, Conservative
  - Secondary traits (suffixes): Offensive, Defender, Setter, Scorer, Blocker, Server, Balanced, All-Around, Utility
  - Standalone archetypes: Conservative, High Flyer, Risk Taker
  - Archetypes now combine as "Primary - Secondary" (e.g., "Error Prone - Defender", "Efficient - Offensive")
  - Color comes from secondary trait for combinations, or standalone archetype for unique types
  - More scalable and flexible system that reduces redundancy
  - Extracted archetype system into `FE/src/analytics/playerArchetypes.ts` for better separation of concerns
  - Added JSDoc documentation to classification function
  - Adjusted all thresholds to work with raw per-set values (not z-scores)
  - Made "Risk Taker" much more restrictive (>6 attempts, >3 kills, >1.2 errors) to improve diversity
  - Recalibrated all primary/secondary trait thresholds based on realistic volleyball stat ranges
  - Changed default collapsible section states: Controls and Axes default to collapsed, Player Info defaults to expanded

- **v2.9** - Creative archetype naming system and comprehensive descriptions
  - Renamed primary traits: "Maverick" (error-prone), "Precise" (efficient), "Workhorse" (high volume), "Selective" (low volume), "Steady" (conservative)
  - Renamed secondary traits: "Striker" (offensive), "Guardian" (defender), "Playmaker" (setter), "Finisher" (scorer), "Intimidator" (blocker), "Bomber" (server), "Versatile" (all-around), "Jack of All Trades" (utility)
  - New standalone archetypes: "Perfectly Balanced" (exceptionally balanced stats), "Unicorn" (elite in 3+ categories), "Sniper" (high kill rate, low errors), "Gunslinger" (high volume/risk/reward), "Anchor" (steady, low risk)
  - Special combination handling: "Intimidating Playmaker" (block-heavy + assist-heavy), "Playmaking Intimidator" (assist-heavy + block-heavy), "Maverick Playmaker" (risk-taking setter)
  - Created comprehensive description system with detailed explanations for all archetypes
  - Descriptions now explain statistical profiles, play style characteristics, and specific thresholds (e.g., "55%+ kill rate", "6+ assists/set")
  - Combination descriptions explain both primary trait behavior and secondary trait specialization
  - Removed hyphen from combination names (e.g., "Maverick Striker" instead of "Maverick - Striker")
  - Created comprehensive README documentation (`VectorGraphREADME.md`) covering overview, features, architecture, usage, and design principles

- **v2.13** - Added "Tireless" primary trait to diversify high-volume players
  - Added new "Tireless" prefix for elite high-volume players (>6.5 spike attempts/set OR >2.8 ape attempts/set OR >9.5 assists/set)
  - Made "Workhorse" more restrictive by excluding players who qualify for "Tireless"
  - "Tireless" represents the top tier of high-volume players, while "Workhorse" covers the next tier
  - This splits the previously overused "Workhorse" category into two groups for better diversity
  - Updated all description dictionaries to include "Tireless" explanations

- **v2.14** - Adjusted Tireless/Workhorse thresholds for better distribution
  - Increased "Tireless" thresholds to be more restrictive: >7.0 spike attempts/set (was 6.5), >3.2 ape attempts/set (was 2.8), >10.5 assists/set (was 9.5)
  - This creates a more even split between "Tireless" (elite) and "Workhorse" (high volume) categories
  - Fixed duplicate "workhorse" entry that was causing classification issues
  - Further adjusted Tireless spike attempts threshold to >7.5/set for better exclusivity

- **v3.0** - Player search functionality and archetype legend
  - Added search bar in top left of graph section for searching players by name
  - Real-time filtering as user types with dropdown results (shows up to 5 matches)
  - Clicking a search result animates camera to focus on the selected player and automatically selects them
  - Camera smoothly animates to player position with easing function
  - Search bar styled to match dark graph background (#1a1a1a) with subtle border (#3a3a3a)
  - Search bar width set to 224px (reduced from 280px for better proportions)
  - Added archetype legend below search bar showing all archetypes present in current graph
  - Legend displays archetype name, color indicator, and player count
  - Clicking an archetype in legend shows detailed popup with:
    - High-level description (what the archetype represents)
    - Statistical thresholds (specific numbers/conditions)
  - Legend styled to match dark theme with custom scrollbar (thin dark bar, no box)
  - Legend has proper bottom margin (2rem) to prevent overlap with screen edge
  - Legend scrollable with max-height constraint to stay within graph bounds
  - Fixed seasons endpoint to use `/api/seasons/skinny` to avoid 500 errors from loading unnecessary relations
  - Improved error messages to include status codes for better debugging

- **v3.1** - Archetype classification improvements
  - Added prioritization logic for Workhorse/Tireless players to prefer offensive traits (Striker, Piercer) over defensive (Guardian)
  - This ensures high-volume offensive players get "Workhorse Striker" instead of "Workhorse Guardian"
  - Priority order: Piercer > Striker > Finisher for offensive traits
  - Helps create more diverse archetype combinations
  - Added Playmaker prioritization for setters (assists >6.0/set) to ensure offensive setters get "Playmaking Striker" instead of just "Striker"
  - Special combinations now include primary traits: "Tireless Playmaking Striker", "Workhorse Playmaking Piercer", etc.
  - Renamed "Precise" primary trait to "Technician" for better naming when combined (e.g., "Technician Versatile" instead of "Precise Versatile")
  - Updated Tireless threshold to 7.5 spike attempts/set for optimal exclusivity

- **v3.2** - UI improvements and fixes
  - Fixed archetype legend popup visibility: changed to fixed positioning to escape container overflow constraints
  - Popup now renders outside legend container and calculates position using refs and getBoundingClientRect()
  - Fixed search results dropdown z-index (25) to appear above legend (10) when visible
  - Changed search results to absolute positioning with proper top calculation
  - Added hide/show toggle for archetype legend with sliding animation
  - Toggle uses < and > arrows instead of × and ⓘ buttons
  - Button positioned outside legend: on right side when visible, moves to left edge when hidden
  - Button styled as text-only (no background/border) with muted opacity (0.6) that becomes fully visible on hover
  - Removed top padding from legend since button is now outside
  - Made Tireless thresholds more restrictive (8.0/3.5/11.0 instead of 7.5/3.2/10.5) to reduce overuse
  - Added prioritization logic: error-based primary traits (Maverick, Inconsistent, Precise) now take priority over volume-based traits (Tireless, Workhorse) when player qualifies for both
  - This creates more diverse combinations like "Inconsistent Striker", "Maverick Striker", "Workhorse Striker" instead of mostly "Tireless"
  - Added "Technician" as standalone archetype (not a prefix) for players with exceptional technical precision
  - Reverted "Precise" back to being a prefix (primary trait) - only renamed standalone version to "Technician"

- **v2.3** - Fixed PCA component color coding and improved spacing
  - Fixed dynamic color coding for PCA feature weights (was showing all dark for PC1/PC2)
  - Improved weight normalization to use min-max scaling within top features (0.3-1.0 opacity range)
  - Added proper handling for equal-weight features (medium-high opacity instead of all max)
  - Added top and bottom margins (20px) to main content div for better spacing

- **v2.2** - Added click-to-select feature with persistent popup
  - Click player point to select and show persistent popup
  - Click empty space to deselect
  - Click another player to replace selection
  - Works alongside hover functionality
  - Fixed hover state interference with clicked state

- **v2.1** - Expanded to use all 13 raw stats from Stats interface (previously used aggregated stats)
  - Changed from: aggregated stats (total kills, total attempts, total errors, receives, percentages, plus/minus)
  - Changed to: individual raw stats (spikeKills, spikeAttempts, apeKills, apeAttempts, blocks, assists, aces, digs, blockFollows, spikingErrors, settingErrors, servingErrors, miscErrors)
  - Rationale: Use all available raw data for more granular PCA analysis
  - Impact: Increased from 12 to 13 dimensions, removed calculated/aggregated fields

- **v2** - PCA implementation, UI improvements, keyboard controls, 12 dimensions (aggregated stats)
- **v1** - Initial implementation with simple 3D projection

---

