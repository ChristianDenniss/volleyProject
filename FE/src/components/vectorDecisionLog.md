# Vector Graph Decision Log

This document tracks all **decisions and rationale** made during the development of the Stats Vectorization & 3D Graphing feature.

For implementation details and what was actually built, see `vectorImplementationLog.md`.

---

## Decision Log

### 2024-12-XX - Initial Implementation Decisions

#### Decision: Default Minimum Sets Threshold
**Decision:** Set default minimum sets played threshold to **5**
**Rationale:** 
- Balances between sample size stability and inclusion of players
- 5 sets provides reasonable statistical basis while not being too restrictive
- User-configurable, so can be adjusted per use case

**Status:** ✅ Implemented

---

#### Decision: Page Access Level
**Decision:** Make the vector graph page **publicly accessible**
**Rationale:**
- The visualization is a tool for exploration and comparison, not sensitive data
- Aligns with the design goal of being a "tool for exploration"
- No authentication required for viewing player statistical representations

**Status:** ✅ Implemented

---

#### Decision: 3D Visualization Library
**Decision:** Use **@react-three/fiber** and **@react-three/drei** for 3D rendering
**Rationale:**
- React-friendly declarative API
- Well-maintained and popular in React ecosystem
- Drei provides useful helpers (OrbitControls, etc.)
- Easier integration with existing React codebase than raw Three.js

**Status:** ✅ Implemented

---

#### Decision: Projection Method (v1)
**Decision:** Use **simple first-3-dimensions projection** for v1, defer PCA to v2
**Rationale:**
- Faster to implement and validate the full pipeline
- Allows testing of visualization, interactions, and data flow
- PCA can be added later without breaking existing functionality
- Document explicitly notes this as a placeholder for v2

**Status:** ✅ Implemented (v1)

---

#### Decision: File Organization
**Decision:** 
- Extract vectorization logic to `FE/src/analytics/statsVectorization.ts`
- Create `FE/src/components/VectorGraphPage.tsx` for main page
- Create `FE/src/components/VectorGraph3D.tsx` for 3D visualization component

**Rationale:**
- Separates analytics layer (pure functions) from presentation layer
- Follows existing project structure patterns
- Makes analytics logic reusable and testable
- Clear separation of concerns

**Status:** ✅ Implemented

---

#### Decision: Data Fetching Pattern
**Decision:** Create custom hook `useFetchPlayersWithStats(seasonNumber)` following existing `useFetch` patterns
**Rationale:**
- Consistent with existing codebase patterns
- Reusable hook pattern
- Handles loading/error states automatically
- Can leverage existing `authFetch` infrastructure

**Status:** ✅ Implemented

---

#### Decision: State Management
**Decision:** Use **local React state** (useState/useEffect) for component state
**Rationale:**
- Simple requirements don't need complex state management
- Keeps component self-contained
- Easy to understand and maintain
- Can refactor to context/global state later if needed

**Status:** ✅ Implemented

---

#### Decision: Styling Approach
**Decision:** Follow existing CSS patterns in the project (separate CSS file)
**Rationale:**
- Consistency with existing components
- Maintains project styling conventions
- Easier to maintain and update

**Status:** ✅ Implemented

---

### 2024-12-XX - PCA Implementation & UI Improvements

#### Decision: PCA Projection Implementation (v2)
**Decision:** Implement **Principal Component Analysis (PCA)** for 3D projection instead of simple first-3-dimensions
**Rationale:**
- Uses all 12 statistical dimensions instead of just first 3
- Preserves maximum variance across all dimensions
- Provides mathematically sound dimensionality reduction
- Better represents player similarity in statistical space
- More accurate representation of player relationships

**Status:** ✅ Implemented (see `vectorImplementationLog.md` for details)

---

#### Decision: React Hooks Order Fix
**Decision:** Ensure all hooks are called before any conditional returns
**Rationale:**
- Fixes React error #310 (hooks called conditionally)
- Follows Rules of Hooks - hooks must be called in same order every render
- Prevents runtime errors in production builds
- Moved early return (`if (vectorRows.length === 0)`) to after all hooks

**Status:** ✅ Implemented

---

#### Decision: Keyboard Zoom Controls
**Decision:** Add keyboard controls for zooming (+/- keys) in addition to mouse scroll
**Rationale:**
- Accessibility - not everyone has functioning mouse
- Improves usability for keyboard-only users
- Follows accessibility best practices
- Uses OrbitControls `dollyIn()` and `dollyOut()` methods
- Ignores keypresses when typing in input fields to avoid conflicts

**Status:** ✅ Implemented

---

#### Decision: Controls Layout - 2x2 Grid
**Decision:** Reorganize controls into a 2x2 grid layout instead of horizontal row
**Rationale:**
- Better space utilization
- More organized and compact
- Better visual hierarchy
- Layout: Row 1 (Season dropdown | Min Sets slider), Row 2 (Players in Graph | Selected Season)

**Status:** ✅ Implemented

---

#### Decision: Overlapping Points Popup Fix
**Decision:** Show only the closest point's popup when multiple points overlap
**Rationale:**
- Prevents multiple overlapping popups from showing simultaneously
- Improves user experience - less visual clutter
- Calculates distance from camera to each hovered point
- Only displays popup for the point closest to camera
- Uses object-based state instead of Map for React state compatibility

**Status:** ✅ Implemented

---

#### Decision: PCA Components Display
**Decision:** Add a row showing what each principal component (PC1, PC2, PC3) represents
**Rationale:**
- Makes PCA transformation transparent (not a "black box")
- Shows top 4 contributing features per PC (12 dimensions / 3 PCs = 4 per PC)
- Helps users understand what each axis represents
- Educational value - users learn what drives the visualization
- Displays as third row in controls section

**Status:** ✅ Implemented

---

#### Decision: Color Coding for PCA Features
**Decision:** Color code features by their weight within each PC using opacity and font weight
**Rationale:**
- Visual indication of feature importance
- Quick visual scanning - users can immediately see strongest contributors
- Opacity scales from 40% to 100% based on normalized weight
- Font weight varies (700 for strong, 600 for medium, 500 for weak)
- Makes it easy to see which features drive each principal component

**Status:** ✅ Implemented

---

#### Decision: UI Cleanup - Remove Redundant Elements
**Decision:** Remove redundant "3D Vector Graph" heading and player count from info panel
**Rationale:**
- "3D Vector Graph" is obvious from context and page title
- Player count already shown in controls section
- Reduces visual clutter
- Follows principle of not repeating information
- Info panel now focuses on hovered player info and controls/axes info

**Status:** ✅ Implemented

---

#### Decision: CSS Spacing Improvements
**Decision:** Add more top margin to main content section
**Rationale:**
- Better visual separation between controls and graph
- Improved spacing and readability
- Changed from 20px to 30px top margin

**Status:** ✅ Implemented

---

#### Decision: Click-to-Select with Persistent Popup
**Decision:** Implement click-to-select functionality where clicking a player point shows a persistent popup until deselected
**Rationale:**
- Improves user experience - allows users to "lock in" a player selection
- Persistent popup remains visible while exploring the graph
- Clicking empty space deselects (intuitive interaction)
- Clicking another player replaces the selection (standard UI pattern)
- Works alongside hover functionality (hover shows temporary info, click shows persistent)

**Implementation Details:**
- Added `onClick` handler to PlayerPoint component
- Added `clickedPlayer` state in VectorGraph3D
- Canvas onClick handler for deselection (player clicks stop propagation)
- Selected player popup persists until deselected or another player is clicked
- Visual indication: selected player shows red color and larger scale

**Status:** ✅ Implemented

---

## Future Decisions (To Be Logged)

### Planned for v3+:
- Color coding strategy (position vs team vs neutral)
- Clustering/archetype features
- Cross-season comparison features

---

## Data Flow Architecture

### Overview
The vector graph system follows a clear separation of concerns with three main layers:

```
API (Backend)
    ↓
useVectorGraphData.ts (React Hook - Data Fetching)
    ↓ Fetches raw data
    ↓
VectorGraphPage.tsx (Component - Orchestration)
    ↓ Calls buildSeasonVectors()
    ↓
statsVectorization.ts (Pure Analytics - Data Processing)
    ↓ Processes & transforms data
    ↓ Returns vectors
    ↓
VectorGraphPage.tsx (Component - Display)
    ↓ Displays in 3D visualization
```

### File Responsibilities

#### `useVectorGraphData.ts` - Data Fetching Layer
**Purpose:** Fetches raw data from the API

**Functions:**
- `useFetchPlayersWithStats()` - Fetches all players with their stats (includes game and season relations)
- `useFetchSeasons()` - Fetches all seasons for the dropdown selector

**Responsibilities:**
- API communication
- Loading/error state management
- Returns raw `Player[]` and `Season[]` objects

**Why Separate:**
- Reusable hook pattern
- Can be used by other components
- No business logic, just data fetching

---

#### `statsVectorization.ts` - Analytics/Processing Layer
**Purpose:** Transforms raw player data into mathematical vectors

**Functions:**
- `buildSeasonVectors()` - Takes raw players, computes per-set stats, normalizes to z-scores
- `projectZVectorTo3D()` - Projects 12D vectors to 3D for visualization
- Internal helpers for aggregation and normalization

**Responsibilities:**
- Pure mathematical transformations
- No React dependencies
- No API calls
- Stateless functions

**Why Separate:**
- Reusable analytics logic
- Testable without React
- Can be used in other contexts (similarity calculations, clustering, etc.)
- Follows single responsibility principle

---

#### `VectorGraphPage.tsx` - Presentation Layer
**Purpose:** Orchestrates data flow and displays visualization

**Responsibilities:**
- Uses hooks to fetch data
- Calls vectorization functions
- Manages UI state (season selection, min sets threshold)
- Renders 3D visualization
- Handles user interactions

**Why Separate:**
- Clear separation of concerns
- Easy to modify UI without touching data/analytics logic

---

### Data Flow Example

```typescript
// 1. FETCH DATA (useVectorGraphData.ts)
const { data: players } = useFetchPlayersWithStats();  // ← Gets raw players
const { data: seasons } = useFetchSeasons();           // ← Gets seasons

// 2. PROCESS DATA (statsVectorization.ts)
const vectorRows = useMemo(() => {
  if (!players || !selectedSeasonNumber) return [];
  
  return buildSeasonVectors(players, selectedSeasonNumber, minSetsPlayed);
  // ↑ Takes raw players → Returns processed vectors
}, [players, selectedSeasonNumber, minSetsPlayed]);

// 3. DISPLAY DATA
<VectorGraph3D vectorRows={vectorRows} />  // ← Shows in 3D
```

### Benefits of This Architecture

1. **Reusability**
   - Hook can fetch data for other components
   - Vectorization can be used in other contexts (similarity calculations, clustering)

2. **Testability**
   - Hook can be tested independently
   - Vectorization is pure functions (easy to unit test)

3. **Maintainability**
   - Change API endpoint? Only touch the hook
   - Change vectorization logic? Only touch analytics file
   - Change UI? Only touch the component

4. **Single Responsibility Principle**
   - Each file has one clear job
   - Easy to understand and modify

---

#### Decision: Dynamic Color Coding for PCA Feature Weights
**Decision:** Fix PCA component feature weight color coding to be truly dynamic based on relative weights within each PC.
**Rationale:**
- Previous implementation normalized weights only within the top 4 features, causing all features with similar weights to appear equally dark
- New approach uses min-max scaling within the top features, mapping to a 0.3-1.0 opacity range for better visual distinction
- Handles edge case where all top features have equal weights (assigns medium-high opacity instead of all max)
**Status:** ✅ Implemented (v2.3)

#### Decision: Main Content Spacing
**Decision:** Add top and bottom margins (20px) to the main content div for better visual spacing.
**Rationale:**
- Improves readability and visual hierarchy
- Provides breathing room between controls and graph content
- Matches general site spacing patterns
**Status:** ✅ Implemented (v2.3)

#### Decision: Collapsible Info Panel Sections
**Decision:** Make each section of the info panel (Player Info, Controls, Axes) individually collapsible, and add ability to hide/show the entire panel.
**Rationale:**
- Allows users to customize which information is visible based on their needs
- Reduces visual clutter when certain sections aren't needed
- Provides flexibility for different use cases (some users may only need controls, others may want all info)
- Hide/show entire panel gives maximum screen real estate when needed
**Implementation:**
- Clickable headers with collapse icons (▶/▼) for each section
- Close button (×) in top-right to hide entire panel
- Small info button (ℹ) appears when panel is hidden to restore it
- Fixed CSS positioning issue that was preventing panel from displaying
- Added minimum dimensions (250px width, 200px height) to prevent constant resizing
- Improved spacing between close button and section headers for better UX
**Status:** ✅ Implemented (v2.4)

#### Decision: Click-to-Select Event Handling Fix
**Decision:** Change click event handling from `onClick` to `onPointerDown`/`onPointerUp` with drag detection to ensure selection persists after mouse release.
**Rationale:**
- `onClick` in React Three Fiber wasn't reliably firing or was being interfered with by OrbitControls
- Selection was only working while holding mouse button down, not persisting after release
- Need to distinguish between clicks (for selection) and drags (for camera rotation)
**Implementation:**
- Track pointer down position and time on `onPointerDown`
- On `onPointerUp`, check if movement was <5px and duration <300ms to treat as click
- If it's a click, call selection handler; if it's a drag, ignore it
- This ensures selection persists after mouse release and doesn't interfere with camera controls
**Status:** ✅ Implemented (v2.5)

#### Decision: Info Panel Styling Refinements
**Decision:** Remove margins from info section headers and h4 elements, and update axes labels to include PC designations.
**Rationale:**
- Tighter spacing improves visual hierarchy and reduces unnecessary whitespace
- Adding PC1/PC2/PC3 to axes labels provides clearer context for users
**Status:** ✅ Implemented (v2.5)

#### Decision: Player Similarity Analytics
**Decision:** Calculate and display most similar (closest) and least similar (farthest) players when a player is selected.
**Rationale:**
- Provides valuable insights into player statistical profiles
- Helps identify players with similar or contrasting play styles
- Uses Euclidean distance on z-vectors (normalized stats) for accurate comparisons within season context
**Implementation:**
- `calculateDistance()` function computes Euclidean distance between two z-vectors
- `findSimilarPlayers()` function finds closest and farthest players by comparing all players in the season
- Results displayed in player info panel when a player is selected
- Similarity data cleared when player is deselected
**Status:** ✅ Implemented (v2.6)

#### Decision: Hover State Management Fix
**Decision:** Clear `hoveredPoints` object when clicking empty space to properly reset hover state.
**Rationale:**
- Fixed bug where hover state wasn't clearing properly after clicking empty space
- `hoveredPoints` object was retaining entries, causing hover state to persist incorrectly
- Now properly clears both `hoveredPlayer` and `hoveredPoints` when deselecting
**Status:** ✅ Implemented (v2.6)

#### Decision: Controls List Reordering
**Decision:** Reorder controls list to show action first, then input method (e.g., "Rotate: Left Click + Drag" instead of "Left Click + Drag: Rotate").
**Rationale:**
- More intuitive - users think about what they want to do first, then how to do it
- Better readability and user experience
**Status:** ✅ Implemented (v2.6)

#### Decision: Prefix-Suffix Archetype Combination System
**Decision:** Refactor archetype system from flat list to a combination system with prefixes (e.g., "Error Prone", "Efficient", "High Volume") and suffixes/roles (e.g., "Defender", "Offensive", "Setter"), plus standalone archetypes (e.g., "Conservative", "High Flyer", "Risk Taker").
**Rationale:**
- Allows for more flexible and descriptive player classifications (e.g., "Error Prone - Defender", "Efficient - Offensive")
- Reduces redundancy by combining traits instead of creating separate archetypes for every combination
- Standalone archetypes capture unique player types that don't fit the prefix-suffix pattern
- More scalable - can add new prefixes/suffixes without creating exponential combinations
**Implementation:**
- `PRIMARY_TRAITS`: Prefix traits describing error/consistency patterns (Error Prone, Efficient, High Volume, Low Volume, Conservative)
- `SECONDARY_TRAITS`: Suffix traits describing role/play style (Offensive, Defender, Setter, Scorer, Blocker, Server, Balanced, All-Around, Utility)
- `STANDALONE_ARCHETYPES`: Unique archetypes that don't combine (Conservative, High Flyer, Risk Taker)
- Classification logic: First checks standalone, then combines primary + secondary if both match, otherwise uses whichever matches
- Color comes from secondary trait (for combinations) or standalone archetype
**Status:** ✅ Implemented (v2.8)

#### Decision: Separate Archetype System into Own Module
**Decision:** Extract archetype classification system into a separate file (`FE/src/analytics/playerArchetypes.ts`) for better separation of concerns.
**Rationale:**
- Improves code organization and maintainability
- Makes archetype logic reusable across different components
- Reduces clutter in the main component file
- Follows single responsibility principle
**Implementation:**
- Created `FE/src/analytics/playerArchetypes.ts` with all archetype types, constants, and classification logic
- Exported `PlayerArchetype` type and `classifyPlayerArchetype` function
- Updated `VectorGraphPage.tsx` to import from the new module
- Added JSDoc documentation to the classification function
**Status:** ✅ Implemented (v2.8)

#### Decision: Adjust Archetype Thresholds for Raw Per-Set Values
**Decision:** Recalibrate all archetype classification thresholds to work with raw per-set statistics instead of z-scores, and make "Risk Taker" more restrictive to improve diversity.
**Rationale:**
- Initial thresholds (0.2-0.5) were too low for raw per-set volleyball statistics
- Almost all players were being classified as "Risk Taker" due to overly broad conditions
- Need realistic thresholds based on actual volleyball stat ranges (e.g., 2-8 spike attempts per set, 1-5 kills per set, 0.2-1.5 errors per set)
- Better diversity requires more specific and restrictive conditions
**Implementation:**
- **Risk Taker**: Now requires >6 total attempts, >3 total kills, and >1.2 total errors per set (much more restrictive)
- **High Flyer**: Requires >3 attempts, >2.5 kills, kill rate >55%, and low errors
- **Primary Traits**: Error Prone (>1.5 total errors or >1.0 spiking errors), Efficient (<0.5 total errors), High Volume (>5 spike attempts or >8 assists), Low Volume (<1.5 attempts and <2 assists)
- **Secondary Traits**: Offensive (>2.5 kills and >4 attempts), Defender (>3 digs or >1 block), Setter (>6 assists), Scorer (>2.5 kills), Blocker (>1 block), Server (>0.8 aces), Balanced (1-4 offensive/defensive stats, <1 errors), All-Around (multiple roles), Utility (3+ stats in 0.5-3.0 range)
**Status:** ✅ Implemented (v2.8)

#### Decision: Default Collapsible Section States
**Decision:** Set default states for collapsible sections in the info panel: Controls and Axes default to collapsed (closed), Player Info defaults to expanded (open).
**Rationale:**
- Player Info is the most frequently accessed section, so it should be visible by default
- Controls and Axes are reference information that users can expand when needed
- Reduces visual clutter on initial load while keeping essential player information visible
**Implementation:**
- Changed `controlsCollapsed` default from `false` to `true`
- Changed `axesCollapsed` default from `false` to `true`
- Kept `playerInfoCollapsed` default as `false` (open)
**Status:** ✅ Implemented (v2.8)

#### Decision: Creative Archetype Naming System
**Decision:** Replace literal archetype names with more creative, evocative names that better capture player identity and play style.
**Rationale:**
- Literal names like "Error Prone - Defender" are too descriptive and lack personality
- Creative names like "Maverick", "Intimidating Playmaker", "Unicorn" are more memorable and engaging
- Better reflects the unique character of different player types
- Makes the system more interesting and fun to use
**Implementation:**
- **Primary Traits (Prefixes)**: "Maverick" (error-prone), "Precise" (efficient), "Workhorse" (high volume), "Selective" (low volume), "Steady" (conservative)
- **Secondary Traits (Suffixes)**: "Striker" (offensive), "Guardian" (defender), "Playmaker" (setter), "Finisher" (scorer), "Intimidator" (blocker), "Bomber" (server), "Versatile" (all-around), "Jack of All Trades" (utility)
- **Standalone Archetypes**: "Perfectly Balanced" (exceptionally balanced stats), "Unicorn" (elite in 3+ categories), "Sniper" (high kill rate, low errors), "Gunslinger" (high volume/risk/reward), "Anchor" (steady, low risk)
- **Special Combinations**: "Intimidating Playmaker" (block-heavy + assist-heavy), "Playmaking Intimidator" (assist-heavy + block-heavy), "Maverick Playmaker" (risk-taking setter)
- Updated descriptions to be more evocative and less literal
**Status:** ✅ Implemented (v2.9)

#### Decision: Comprehensive Archetype Descriptions
**Decision:** Provide detailed, explanatory descriptions for all archetypes that explain their statistical profile and play style characteristics.
**Rationale:**
- Generic descriptions like "maverick striker" don't help users understand what the archetype actually means
- Users need to understand the statistical thresholds and play style implications
- Better descriptions improve the analytical value of the archetype system
- Makes the system more educational and informative
**Implementation:**
- Created detailed description mappings for all primary traits explaining error patterns and volume
- Created detailed description mappings for all secondary traits explaining role and statistical focus
- Updated standalone archetype descriptions to include specific statistical criteria (e.g., "55%+ kill rate", "6+ assists/set")
- Combination descriptions now explain both the primary trait behavior and secondary trait specialization
- Special combinations include specific statistical thresholds in their descriptions
**Status:** ✅ Implemented (v2.9)

#### Decision: Add "Tireless" Primary Trait to Diversify High-Volume Players
**Decision:** Split the overused "Workhorse" category by adding a new "Tireless" prefix for elite high-volume players, making "Workhorse" more restrictive.
**Rationale:**
- "Workhorse" was being assigned to too many players, reducing archetype diversity
- Need to distinguish between elite high-volume players and standard high-volume players
- Better classification granularity improves the analytical value of the archetype system
- Creates a clearer hierarchy: "Tireless" (elite) > "Workhorse" (high) > standard players
**Implementation:**
- Added "Tireless" primary trait with elite thresholds: >6.5 spike attempts/set OR >2.8 ape attempts/set OR >9.5 assists/set
- Modified "Workhorse" condition to explicitly exclude players who qualify for "Tireless"
- "Tireless" represents the top tier of high-volume players (exceptional activity levels)
- "Workhorse" now covers the next tier (high but not elite volume)
- Updated all description dictionaries to include "Tireless" explanations
- "Tireless" is checked before "Workhorse" in the PRIMARY_TRAITS array to ensure proper classification
**Status:** ✅ Implemented (v2.13)

#### Decision: Adjust Tireless/Workhorse Thresholds for Better Distribution
**Decision:** Increase "Tireless" thresholds to create a more even split between "Tireless" and "Workhorse" categories.
**Rationale:**
- Initial thresholds resulted in "Tireless" completely replacing "Workhorse" instead of splitting the group
- Need a more balanced distribution where both categories are represented
- Higher "Tireless" thresholds make it more exclusive, leaving more room for "Workhorse"
**Implementation:**
- Increased "Tireless" thresholds: >7.0 spike attempts/set (from 6.5), >3.2 ape attempts/set (from 2.8), >10.5 assists/set (from 9.5)
- Updated "Workhorse" exclusion check to match new "Tireless" thresholds
- Removed duplicate "workhorse" entry that was causing classification conflicts
- Further refined to >7.5 spike attempts/set for optimal exclusivity
**Status:** ✅ Implemented (v2.14)

#### Decision: Player Search Functionality
**Decision:** Add search bar in top left of graph section to allow users to quickly find and focus on specific players.
**Rationale:**
- Large graphs with many players make it difficult to find specific individuals
- Search provides quick access to any player in the current dataset
- Camera animation to selected player improves discoverability
- Enhances user experience by reducing time spent manually exploring the graph
**Implementation:**
- Search input positioned absolutely in top left (1rem from edges)
- Real-time filtering as user types (case-insensitive substring matching)
- Dropdown results show up to 5 matches with "+X more" indicator if needed
- Clicking result triggers camera animation to player position and auto-selects player
- Camera uses smooth easing animation (ease-out cubic) over 1 second duration
- Search bar styled to match dark graph background for seamless integration
- Width optimized to 224px (reduced from 280px) for better proportions
**Status:** ✅ Implemented (v3.0)

#### Decision: Archetype Legend with Click Popups
**Decision:** Add legend below search bar showing all archetypes in current graph with click-to-view detailed information.
**Rationale:**
- Users need to understand what archetypes are present in the current visualization
- Legend provides quick reference for archetype colors and distribution
- Click popups allow detailed exploration without cluttering the UI
- Separates high-level overview (description) from low-level details (statistical thresholds)
**Implementation:**
- Legend positioned below search bar, same width (224px) for visual consistency
- Displays archetype name, color circle, and player count
- Sorted by count (descending) then alphabetically
- Clicking archetype shows popup with:
  - Header: Archetype name
  - Description: High-level explanation of what the archetype represents
  - Thresholds: Specific statistical conditions (numbers/requirements)
- Popup styled as formatted box with max-width (320px) and proper text wrapping
- Legend scrollable with custom dark scrollbar (thin bar, no box, matches theme)
- Bottom margin (2rem) prevents overlap with screen edge
- Max-height constraint keeps legend within graph bounds
**Status:** ✅ Implemented (v3.0)

#### Decision: Use Skinny Seasons Endpoint
**Decision:** Switch from `/api/seasons` to `/api/seasons/skinny` endpoint to avoid 500 errors.
**Rationale:**
- Full seasons endpoint loads relations (teams, games, awards) causing 500 errors
- Frontend only needs basic season metadata (seasonNumber, theme, id) for dropdown
- Skinny endpoint avoids unnecessary data transfer and improves reliability
- Prevents deployment failures due to server resource constraints
**Implementation:**
- Updated `useFetchSeasons` hook to use `/api/seasons/skinny` endpoint
- Improved error messages to include HTTP status codes for better debugging
**Status:** ✅ Implemented (v3.0)

#### Decision: Prioritize Offensive Traits for High-Volume Players
**Decision:** When Workhorse/Tireless players qualify for multiple secondary traits, prioritize offensive traits (Striker, Piercer) over defensive (Guardian).
**Rationale:**
- High-volume players often qualify for both offensive and defensive secondary traits
- Without prioritization, defensive traits were being selected first (due to array order)
- This resulted in "Workhorse Guardian" being more common than "Workhorse Striker"
- Offensive traits better represent the primary role of high-volume players
- Creates more diverse and accurate archetype combinations
**Implementation:**
- Added logic to detect when Workhorse/Tireless players match multiple secondary traits
- Prioritizes offensive traits: Piercer > Striker > Finisher
- Only applies when player qualifies for both offensive and defensive traits
- Maintains existing behavior for players who only match one category
**Status:** ✅ Implemented (v3.1)

#### Decision: Prioritize Playmaker for Offensive Setters
**Decision:** When a player qualifies for both Playmaker (assists >6.0/set) and offensive traits (Striker, Piercer), prioritize Playmaker and combine them (e.g., "Playmaking Striker").
**Rationale:**
- Offensive setters were being labeled as just "Striker" without acknowledging their setting role
- Setters with high assists should be identified as Playmakers first
- Combining Playmaker with offensive traits creates more accurate labels like "Tireless Playmaking Striker"
- Better represents players who both set and attack effectively
**Implementation:**
- Added special combination checks for Playmaker + Striker/Piercer
- These combinations include primary traits when present (e.g., "Tireless Playmaking Striker")
- Special combinations checked before regular primary+secondary combinations
- Ensures setters are properly identified even when they have good offensive stats
**Status:** ✅ Implemented (v3.1)

#### Decision: Rename "Precise" to "Technician"
**Decision:** Rename the "Precise" primary trait to "Technician" to improve naming when combined with other traits.
**Rationale:**
- "Precise Versatile" and "Workhorse Precise" sounded awkward
- "Technician" better describes a player who minimizes errors through technical skill
- "Technician Versatile" and "Workhorse Technician" read more naturally
- Maintains the same meaning (low errors, technical precision) with better naming
**Implementation:**
- Changed primary trait ID from "precise" to "technician"
- Updated all references, descriptions, and threshold displays
- No functional changes, only naming improvements
**Status:** ✅ Implemented (v3.1)

#### Decision: Fix Archetype Legend Popup Visibility
**Decision:** Change archetype legend popup to fixed positioning to escape container overflow constraints.
**Rationale:**
- Popup was being clipped by parent container's `overflow: hidden`
- Fixed positioning allows popup to render outside the container bounds
- Better user experience when viewing archetype details
**Implementation:**
- Changed popup from `position: absolute` to `position: fixed`
- Moved popup rendering outside legend container
- Added refs and useEffect to calculate position based on clicked item's location
- Uses getBoundingClientRect() for accurate positioning
**Status:** ✅ Implemented (v3.2)

#### Decision: Add Hide/Show Toggle for Archetype Legend
**Decision:** Add ability to hide and show the archetype legend to reduce UI clutter when not needed.
**Rationale:**
- Legend takes up significant screen space
- Users may want to focus on the graph without the legend visible
- Consistent with info panel hide/show functionality
- Improves flexibility of the UI
**Implementation:**
- Added × button in top-right of legend to hide it
- Added ⓘ button in same position when hidden to show it again
- State management with `legendHidden` boolean
- Styled buttons to match dark theme and existing UI patterns
**Status:** ✅ Implemented (v3.2)

#### Decision: Fix Search Results Z-Index
**Decision:** Increase search results dropdown z-index to appear above archetype legend.
**Rationale:**
- Search results were appearing behind the legend when both were visible
- Search functionality should have visual priority when active
- Better user experience when searching for players
**Implementation:**
- Increased search container z-index from 10 to 25
- Changed search results to absolute positioning with proper top calculation
- Legend remains at z-index: 10
- Ensures search results always appear on top
**Status:** ✅ Implemented (v3.2)

#### Decision: Sliding Legend Toggle with Arrow Buttons
**Decision:** Replace ×/ⓘ buttons with < and > arrows that slide the legend horizontally, with button repositioning.
**Rationale:**
- × and ⓘ buttons were taking up space inside the legend
- Sliding animation provides better visual feedback
- Arrow buttons (< and >) are more intuitive for hide/show actions
- Moving button outside legend prevents it from blocking content
- Button on left edge when hidden makes it easy to find and restore legend
**Implementation:**
- Changed toggle buttons from ×/ⓘ to < and > arrows
- Added CSS transform animation for smooth sliding (translateX)
- Button positioned outside legend: right side when visible, left edge when hidden
- Button styled as text-only (no background/border) for subtle appearance
- Muted opacity (0.6) by default, fully visible on hover
- Removed top padding from legend since button is outside
**Status:** ✅ Implemented (v3.2)

#### Decision: Prioritize Error-Based Traits Over Volume-Based Traits
**Decision:** When a player qualifies for both error-based (Maverick, Inconsistent, Precise) and volume-based (Tireless, Workhorse) primary traits, prioritize error-based traits.
**Rationale:**
- Volume-based traits were dominating because they appear earlier in the array
- Error-based traits provide more meaningful differentiation
- Creates more diverse archetype combinations (e.g., "Inconsistent Striker" vs just "Tireless")
- Better represents player characteristics beyond just volume
**Implementation:**
- Modified primary trait selection to check all matching traits first
- Prioritize error-based traits: Maverick, Inconsistent, Precise, Opportunistic, Selective, Steady, Stalwart
- Fall back to volume-based traits only if no error-based trait matches
- This ensures combinations like "Inconsistent Striker", "Maverick Striker", "Workhorse Striker" appear more frequently
**Status:** ✅ Implemented (v3.2)

#### Decision: Make Tireless More Restrictive
**Decision:** Increase Tireless thresholds to reduce overuse and create better distribution with Workhorse.
**Rationale:**
- Tireless was appearing too frequently, overshadowing other archetypes
- Need better balance between Tireless (elite) and Workhorse (high volume)
- More restrictive thresholds make Tireless truly elite
**Implementation:**
- Increased thresholds: spike attempts >8.0/set (from 7.5), ape attempts >3.5/set (from 3.2), assists >11.0/set (from 10.5)
- Updated Workhorse exclusion check to match new Tireless thresholds
- Updated threshold description in popup
**Status:** ✅ Implemented (v3.2)

#### Decision: Add "Technician" as Standalone Archetype
**Decision:** Add "Technician" as a standalone archetype (not a prefix) for players with exceptional technical precision.
**Rationale:**
- Need a standalone archetype for technical precision specialists
- Different from "Precise" prefix which can combine with other traits
- Represents players who excel through flawless execution rather than volume
**Implementation:**
- Added to STANDALONE_ARCHETYPES array
- Conditions: total errors <0.4/set, spiking errors <0.25/set, setting errors <0.15/set, attempts ≥3.0/set, kill rate >50%, kills ≥2.0/set
- Distinct from "Sniper" (higher kill rate requirement) and "Anchor" (lower volume)
- Appears as just "Technician" (not combined with other traits)
**Status:** ✅ Implemented (v3.2)

---

## Notes

- All decisions align with the design principles outlined in `vector.md`
- Decisions prioritize clarity, correctness, and extensibility
- v1 focuses on establishing foundation; advanced features deferred to v2+
- Architecture follows separation of concerns: fetching → processing → display

