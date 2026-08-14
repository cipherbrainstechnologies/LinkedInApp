# Design System Specification

## 1. Visual direction

Professional, current, and energetic without looking like a game or a generic AI gradient product. The UI should communicate clarity and forward motion.

Working visual language:

- Light neutral canvas with dark high-contrast text.
- Cobalt/indigo primary action.
- Mint/teal accent for confirmed progress, used sparingly.
- Amber for action required and red for destructive/error only.
- Clean geometric sans serif, compact data typography, generous whitespace.
- Subtle borders and tonal surfaces before shadows.
- Rounded corners, but not pill-shaped everywhere.

## 2. Tokens

Tokens live in `packages/design-tokens` and generate CSS variables plus React Native theme objects. Names are semantic; raw values may change.

### Colour roles

- `canvas`, `surface`, `surface-subtle`, `surface-raised`
- `text`, `text-muted`, `text-inverse`, `text-link`
- `border`, `border-strong`, `focus-ring`
- `primary`, `primary-hover`, `primary-active`, `on-primary`
- `success`, `success-surface`, `warning`, `warning-surface`
- `danger`, `danger-surface`, `info`, `info-surface`
- `status-draft`, `status-action`, `status-progress`, `status-applied`, `status-closed`

Provide light and dark schemes, but launch may default to system theme. All colour pairs must pass WCAG 2.2 AA contrast for their intended text/non-text use.

### Typography

Use a variable sans font with a system fallback stack and tabular numerals for money, quota, and dates.

- `display`: 40/48 desktop, 32/38 mobile.
- `heading-1`: 32/40 desktop, 28/34 mobile.
- `heading-2`: 24/32.
- `heading-3`: 20/28.
- `body`: 16/24.
- `body-sm`: 14/20.
- `label`: 14/20, medium weight.
- `caption`: 12/16, never for required form information.

Avoid using font weight alone for hierarchy; combine size, spacing, and semantics.

### Spacing and sizing

Base 4px scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80.

- Default content gap: 16 mobile, 24 desktop.
- Form field vertical gap: 20.
- Page inline padding: 16 at narrow widths, 24 tablet, 32–48 desktop.
- Main content max width: 1280px; long-form reading max width: 760px.
- Touch target: aim for 44x44 minimum.

### Radius and elevation

- `sm` 8, `md` 12, `lg` 16, `xl` 24.
- Controls default `md`; cards `lg`; sheets/modals `xl` where platform-appropriate.
- Use shadows only for overlay hierarchy; normal cards use border/tonal contrast.

### Motion

- Fast feedback 120–160ms; layout transition 180–240ms.
- Standard ease-out entering, ease-in exiting.
- No bouncing counters or decorative auto-looping motion.
- Reduced-motion mode removes spatial transforms and uses opacity/state changes.

## 3. Component inventory

### Primitives

Button, IconButton, Link, Text, Heading, Badge, Avatar, Divider, Surface, Stack, Inline, Grid, Skeleton, Spinner, Progress, VisuallyHidden.

### Inputs

TextField, TextArea, PhoneField, CurrencyField, DateField, DateRange, Select, Combobox, MultiSelect, Checkbox, RadioGroup, Switch, FileUpload, SearchField, OTPField only for owned flows.

All inputs support label, description, required/optional status, error, success, disabled, read-only, busy, and character/format constraints.

### Feedback and overlays

InlineAlert, Banner, Toast, Dialog, AlertDialog, Drawer, BottomSheet, Popover, Tooltip, EmptyState, ErrorState, OfflineBanner.

Toast never carries the only record of an error or success. High-impact status persists in-page.

### Navigation

AppShell, TopBar, SideNav, BottomTabs, Breadcrumbs, Tabs, Stepper, Pagination, CommandMenu.

### Data and domain composites

DataTable, FilterBar, FilterSheet, SortMenu, StatCard, ChartPanel, Timeline, ActivityEvent, JobCard, MatchEvidence, EligibilityBanner, ResumeCard, ApplicationStatus, QuotaMeter, MoneyBreakdown, SourceEvidence, ConsentSummary, ActionRequiredCard.

## 4. Component state rules

Every interactive component defines:

- default, hover, focus-visible, active, selected, disabled, busy, invalid, and success where relevant;
- pointer, keyboard, screen-reader, and touch behaviour;
- long text and localization behaviour;
- loading width/height stability;
- dark/high-contrast scheme;
- analytics event only when specified by product.

## 5. Layout breakpoints

Use container queries and available-space behaviour first. Reference breakpoints for testing:

- 320–479: compact single column.
- 480–767: wide phone.
- 768–1023: tablet/two-pane where useful.
- 1024–1439: desktop navigation and multi-column review.
- 1440+: max-width content; do not stretch reading lines.

Test short landscape viewports and virtual keyboard, not width alone.

## 6. Web/native sharing strategy

Share:

- Semantic tokens and icon names.
- Zod schemas and domain status mappings.
- Copy keys and message catalogue.
- Feature-level interaction contracts.
- Analytics event names.
- Visual regression fixtures.

Do not attempt to share DOM/Radix components directly with React Native. Implement `ui-web` and `ui-mobile` against the same component contracts and tokens.

## 7. Iconography and illustration

- Use one open-source outline icon set with filled status variants only where necessary.
- Never use icons without text for unfamiliar actions.
- Job/company logos are untrusted remote assets; proxy/cache safely, provide initials fallback, and never let layout depend on them.
- Use illustrations only for meaningful onboarding/empty states; provide reduced/no-motion alternatives.

## 8. Forms and validation

- Persistent visible labels; placeholders are examples only.
- Validate format on blur and required fields on submit, except immediate safety constraints.
- Error summary at top of long forms; focus first invalid field.
- Preserve values after network or provider errors.
- Use server-returned stable error codes mapped to localised copy.
- Avoid disabling the submit button solely because a form is incomplete; allow the user to trigger understandable validation, except during duplicate submission.

## 9. Tables and mobile cards

- Tables use semantic headers, captions where needed, keyboard-reachable actions, and meaningful sort state.
- User application table state is reflected in the URL.
- On mobile, transform each row into a card ordered by status/next action, job/company, date/source, then secondary metadata.
- Selection never silently spans filtered-out pages; display exact scope.

## 10. Performance budgets

Initial targets measured on representative mid-tier Android and desktop:

- Public/auth web route JS under 180KB gzipped where practical.
- Authenticated route incremental JS under 250KB gzipped excluding intentionally lazy charts/editor modules.
- LCP under 2.5s at P75, INP under 200ms, CLS under 0.1 on supported web clients.
- Mobile cold start monitored; first interactive authenticated screen target under 3s on representative device/network after optimisation.
- Use route-level code splitting, font subset/preload, responsive image sizing, and virtualise only measured long lists.

## 11. Visual QA matrix

At minimum capture:

- 320x568, 390x844, 768x1024, 1024x768, 1440x900.
- Light, dark, high contrast where supported.
- 200% browser zoom and large OS text.
- Empty, loading, error, long content, translated-expansion fixture, quota exhausted, waiting action, and destructive confirmation states.
