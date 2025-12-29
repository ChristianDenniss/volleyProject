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

---

## Notes

- All decisions align with the design principles outlined in `vector.md`
- Decisions prioritize clarity, correctness, and extensibility
- v1 focuses on establishing foundation; advanced features deferred to v2+
- Architecture follows separation of concerns: fetching → processing → display

