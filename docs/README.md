# Docs

Reference documentation for the Volleyball 4.2 platform. The hard rules that govern contributions live in [`../CLAUDE.md`](../CLAUDE.md); these documents explain the mechanisms behind them.

## `architecture/`

| Document | Covers |
|---|---|
| [`design-system.md`](architecture/design-system.md) | The token system in `globals.css`: the three-stage colour indirection, the generated brand scale, light/dark, why the chart/archetype/team palettes are theme-invariant, the two responsive systems, and how the rules are enforced. |
| [`frontend-components.md`](architecture/frontend-components.md) | Every shared component, grouped by purpose-based category. **Search this before writing any UI element** (CLAUDE.md Rule 1). |
| [`frontend-hooks.md`](architecture/frontend-hooks.md) | Every hook. All HTTP in the frontend originates here (CLAUDE.md Rule 3). |

## Keeping these current

CLAUDE.md Rule 10: if a change touches something a doc describes, update the doc **in the same PR**. A new component goes in the component inventory; a new hook goes in the hook inventory; a new or changed token goes in the design system doc.

A rule that isn't followed at commit time regresses.
