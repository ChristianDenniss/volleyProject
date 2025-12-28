# Vector Graph Implementation Decision Log

This document tracks all implementation decisions made during the development of the Stats Vectorization & 3D Graphing feature.

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

## Future Decisions (To Be Logged)

### Planned for v2:
- PCA projection implementation
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

## Notes

- All decisions align with the design principles outlined in `vector.md`
- Decisions prioritize clarity, correctness, and extensibility
- v1 focuses on establishing foundation; advanced features deferred to v2+
- Architecture follows separation of concerns: fetching → processing → display

