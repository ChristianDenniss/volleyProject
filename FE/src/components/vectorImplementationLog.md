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

- **v2.2** - Added click-to-select feature with persistent popup
  - Click player point to select and show persistent popup
  - Click empty space to deselect
  - Click another player to replace selection
  - Works alongside hover functionality

- **v2.1** - Expanded to use all 13 raw stats from Stats interface (previously used aggregated stats)
  - Changed from: aggregated stats (total kills, total attempts, total errors, receives, percentages, plus/minus)
  - Changed to: individual raw stats (spikeKills, spikeAttempts, apeKills, apeAttempts, blocks, assists, aces, digs, blockFollows, spikingErrors, settingErrors, servingErrors, miscErrors)
  - Rationale: Use all available raw data for more granular PCA analysis
  - Impact: Increased from 12 to 13 dimensions, removed calculated/aggregated fields

- **v2** - PCA implementation, UI improvements, keyboard controls, 12 dimensions (aggregated stats)
- **v1** - Initial implementation with simple 3D projection

---

