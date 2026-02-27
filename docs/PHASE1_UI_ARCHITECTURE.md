# F1IQ Phase 1 UI Architecture

## Design Tokens

### Color System
- `--f1-red`: primary action/accent.
- `--f1-bg`, `--f1-bg-alt`: app backgrounds.
- `--f1-surface`, `--f1-surface-soft`, `--f1-surface-2`: layered surfaces and card depth.
- `--f1-text`, `--f1-muted`: primary/secondary text hierarchy.
- `--f1-neon`: telemetry highlight.

Theme modes:
- `data-theme="dark"`: default high-contrast motorsport UI.
- `data-theme="light"`: daylight/office viewing mode with preserved contrast ratios.

### Typography Scale
- Display: `font-f1-display` (`Rajdhani`) for primary headings and section titles.
- Body/UI: `font-f1` (`Space Grotesk`) for readability in dense data interfaces.
- Scale:
  - Hero title: `text-5xl` to `text-6xl`.
  - Page title: `text-3xl` to `text-5xl`.
  - Section title: `text-2xl`.
  - Body: `text-sm` to `text-base`.
  - Meta/labels: `text-xs` with tracked uppercase labels.

### Spacing & Radius
- Base spacing: 4px grid through Tailwind spacing scale.
- Core card padding: `p-6` / `p-8`.
- Core section rhythm: `space-y-8` or `space-y-10`.
- Radii:
  - Primary cards: `rounded-2xl`.
  - Hero surfaces: `rounded-3xl`.
  - Inputs/buttons: `rounded-lg` / `rounded-xl`.

## Layout Strategy

- Desktop: fixed left navigation rail with persistent context modules.
- Mobile: sticky topbar + slide-in drawer navigation.
- Content region: centralized `app-main` with wider analytics canvas and improved readability.
- Page hierarchy:
  - `PageHeader` (overline + title + summary).
  - Filters/controls.
  - Analytical modules (cards/tables/charts).

## Component Patterns

- `f1-card`: elevated glass-like panel with subtle border and hover lift.
- `f1-button` / `f1-button-secondary`: primary vs. neutral CTAs.
- `f1-select` / `f1-input`: unified control styling and focus behavior.
- `f1-table`: standardized data table headers, rows, and hover states.
- `f1-loading-state` / `f1-error-state`: premium feedback states.
- Tab system:
  - `f1-tabs-list`
  - `f1-tab-trigger`
  - `f1-tab-trigger-active`

## Motion Design

- Motion primitives:
  - `fadeInUp`
  - `pulseSoft`
  - `borderGlow`
- Animations are short, intentional, and non-blocking.
- `prefers-reduced-motion: reduce` disables transitions/animations for accessibility.

## Performance-Safe UI Upgrades

- Route-level code splitting via `React.lazy` + `Suspense`.
- Shared primitives reduce repeated DOM/style complexity.
- Visual improvements avoid introducing expensive continuous animations on critical paths.

## Migration Notes

- Core analytics/business logic and API flow remain unchanged.
- This phase is visual architecture + component-system modernization.
- Phase 2 (feature expansion) should build on these tokens/primitives to stay consistent.

