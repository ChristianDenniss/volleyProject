# Stats Vectorization & Graphing Design (v1)

## End Goal

Build an abstract system that can:

1. Accept structured objects originating from a relational data model
   (e.g. Player → Stats → Game → Season).
2. Transform those objects into numeric representations suitable for analysis.
3. Vectorize those representations in a consistent, versioned manner.
4. Project vectors into a low-dimensional space (3D) for visualization.
5. Serve as a foundation for future analytical features such as:
   - player similarity
   - clustering / archetypes
   - development trajectories
   - alternative evaluation or weighting models

The system is intentionally designed to be **extensible and modular**, rather
than opinionated or final.

---

## Scope & Assumptions (v1)

The following assumptions apply to the current implementation only:

- Player stat-lines are **complete by construction** due to ingestion rules
  enforced upstream.
- Graphs are generated **per season**, using only players who appeared in that
  season.
- Opportunity normalization is done using **per-set** rates.
- A **minimum sets played threshold** is applied as a configurable filter to
  reduce noise from small samples.

These assumptions simplify v1 and do not restrict future versions.

---

## Development & Testing Context (v1)

During development and initial testing, this system is exercised against a
**pre-filled PostgreSQL relational database** containing historical player,
game, and season data.

### Tooling Used
- **PostgreSQL** – primary relational datastore
- **TablePlus** – direct inspection and validation of relational data
  (tables, joins, aggregates)
- **Postman** – API-level testing of endpoints that expose player and stat data

### Purpose of This Setup
- Enables deterministic testing with known datasets
- Makes aggregation and normalization logic easy to validate
- Allows manual verification of season scoping, set counts, and stat totals

This setup reflects the **current development environment**, not a system
requirement. The vectorization and graphing logic operates purely on structured
objects and remains agnostic to the database, transport layer, or tooling used
to produce those objects.

---

## Design Direction (v1 choices, not absolutes)

For the initial implementation, we are **choosing** to:

- Treat vectors as **neutral representations** of statistical output, rather
  than encoding subjective notions of value or importance.
- Favor **explainable transformations** (rates, normalization, linear
  projections) over opaque or black-box methods.
- Scope normalization and projection **within a single season** to preserve
  contextual meaning.

These are intentional design choices for v1, not permanent constraints.

---

## Key Decisions & Reasoning

### Decision: Per-season embeddings
**Why**
- Statistical environments differ across seasons.
- A season-scoped embedding ensures all players are compared within the same
  context.

**Consequence**
- Axes (e.g. PC1 / PC2 / PC3) are consistent within a season.
- Axes are not assumed to be semantically identical across seasons.

---

### Decision: Opportunity normalization via per-set rates
**Why**
- Raw totals disproportionately reward playing time / oppurtunity.
- Per-set rates better represent how a player performs WHEN involved.
  - Per set still has its flaws but it is the most accurate and objective method we have of normalization for this data.

**Consequence**
- Players are compared by rate of production.
- Small samples may introduce instability, handled separately.

---

### Decision: User-configurable minimum sets threshold
**Why**
- Stability requirements vary by use case.
- Allowing the user to control the threshold preserves flexibility.

**Consequence**
- The threshold is applied as a **filter**, not as part of vector computation.
- Changing the threshold legitimately changes the population and geometry of the
  graph.

---

### Decision: Fixed-schema vectorization
**Why**
- Distance metrics and projections require consistent dimensional meaning.
- A fixed schema allows reproducibility and comparison.

**Consequence**
- Feature lists and ordering are versioned.
- Schema changes require a version bump, not a rewrite.

---

### Decision: Neutral (unweighted) vectors in v1
**Why**
- Weighting encodes subjective assumptions about importance of a stat
- Separating “what a player does” from “how valuable it is” keeps the base system
  clean and reusable.
- Once your start to add subjective aspects to a project like this, you can lose track of what
  is actually objectively true very quickly.

**Consequence**
- v1 vectors describe **statistical profiles**, not impact or quality.
- Value-weighted or role-aware models can be layered on later.

---

### Decision: 3D projection for visualization
**Why**
- 3D preserves more information than 2D.
- Visualization is a core use case for exploration and intuition.
- Looks way cooler than 2D (cherry on top)

**Axis Interpretation**
- Axes are **emergent**, not pre-assigned (e.g. PCA components).
- Axis meaning is derived post-hoc from contributing features.

**Consequence**
- Axis interpretations may change season-to-season.
- Axes are described, not named absolutely.

---

## System Architecture (Conceptual)

1. **Database Layer**
   - PostgreSQL stores players, games, stats, seasons.

2. **API / Fetch Layer**
   - Endpoints expose structured Player objects.
   - Validated using Postman.

3. **Analytics Layer**
   - Vectorization and normalization logic (pure functions).
   - No dependency on React, HTML, or rendering.

4. **Presentation Layer**
   - React components consume analytics output.
   - Responsible only for visualization and interaction.

---

## What This System Is (v1)

- A **representation and transformation engine**
- A **foundation for analytics**, not a final model
- A **tool for exploration and comparison**

---

## What This System Is Not (v1)

- Not a ranking system
- Not a valuation model
- Not an opinionated definition of player quality
- Not inherently cross-season comparable

---

## Future Directions (Explicitly Supported)

The design intentionally supports future extensions such as:
- Value-weighted or role-aware vectors
- Career-level embeddings
- Cross-season or global projections
- Alternative projection methods (PCA, UMAP, etc.)
- Clustering and archetype labeling

None of these require rewriting the core vectorization pipeline.

---

## Summary

v1 prioritizes clarity, correctness, and extensibility:

- Season-scoped embeddings
- Per-set opportunity normalization
- User-controlled participation thresholds
- Neutral, fixed-schema vectorization
- 3D visualization with emergent axes
- Development validated against a real relational dataset

This establishes a strong and flexible foundation for more advanced analytics.
