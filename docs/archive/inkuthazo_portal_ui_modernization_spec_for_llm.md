# Inkuthazo Portal — UI Modernization Spec (LLM-ready)

**Purpose:** A single, step-by-step Markdown specification you can give to an LLM (or human designer/developer) to modernize the Inkuthazo burial society member portal UI. This file contains the brief, goals, design principles, component & page-level specs, accessibility & responsiveness rules, design token examples, and explicit LLM prompt templates for generating designs, assets and implementation artifacts.

---

## How to use this file
1. Provide the LLM with the project repo link (or Figma file + screenshots attached).
2. Ask the LLM to complete one *task block* at a time (Discovery → Visual System → Components → Pages → Implementation). Each block in this document includes clear acceptance criteria and QA checks.
3. For code or component output requests, instruct the LLM whether you want **Flutter** widgets, **React/Tailwind** CSS, or **CSS variables** + HTML.
4. When you ask the LLM to generate assets, ask for: design tokens JSON, exported SVG icons, sample component code, and a Storybook or widget story.

---

## Project Goals (high-level)
- Move from a generic CRM look to a modern, calm, friendly, and trustworthy UI while retaining a professional tone.
- Improve clarity and density for administrative tasks (dashboard, member management) while making the UI approachable for non-technical users (members).
- Create a scalable design system and token set for consistent theming and simple future theming (light/dark).
- Ensure strong accessibility, keyboard-first navigation, and mobile responsiveness.

---

## Constraints & Inputs
- Maintain current feature set and data surface (dashboard cards, member table, contributions, claims, payouts, reports, configuration).
- App is web-first (desktop primary), but must be fully responsive for tablet and mobile.
- Primary tech: **Flutter web** (if you want Flutter code snippets). Also provide CSS/Tailwind examples if needed for web teams.
- Inputs for the LLM: current screenshots (attached), current CSS/Flutter theme file (if available), and product copy.

---

## Personas (use for UI decisions)
- **Admin (Primary)** — manages members, approves contributions, processes payouts. Needs dense tables, quick filters, bulk actions, and clear status indicators.
- **Committee Treasurer (Secondary)** — needs payment summaries, exportable reports, and audit trails.
- **Member (Tertiary)** — views own contributions, downloads receipts, update profile. Needs simple clear pages and large touch targets on mobile.

---

## Design Principles
- **Friendly professionalism:** Soft corners, calm neutral backgrounds, single vibrant accent (not many bright competing colors).
- **Clarity first:** High information hierarchy — spacing, typography and clear labels reduce cognitive load.
- **Hierarchy by contrast:** Use purposeful contrast for primary actions and subtle contrast for background cards.
- **Actionable data:** Stats and lists should make the next action obvious (Approve / Reject / Invite / View). Provide clear affordances and affordance spacing.
- **Accessible interactions:** Keyboard navigable, visible focus rings, and color contrast that meets WCAG AA at minimum.

---

## Visual System (recommendation)
### Color palette (example)
- Primary: `#6D28D9` (deep violet) — used for primary CTAs, highlights.
- Accent/Positive: `#06B6D4` (teal) — used sparingly for success accents and charts.
- Background: `#F7FAFC` (very light gray) — page background.
- Surface / Card: `#FFFFFF` — card panels.
- Muted text: `#6B7280` — secondary copy.
- Danger: `#EF4444` — destructive actions.
- Neutral/Line: `#E6E9EE` — separators and subtle dividers.

> Note: Provide two theme seeds: one for light and one for a subtle dark mode.

### Typography
- Primary font: **Inter** (or `IBM Plex Sans` / `Poppins` if you prefer warmer shapes).
- Base scale (desktop): 14px body, 16 - 18px bodyLarge, 20px H4, 24px H3, 28–32px H2, 40px H1 (dashboard heading).
- Weights: 400 (regular), 600 (semibold), 700 (bold) where appropriate.
- Line heights and letter spacing tuned for readability: use 1.35 body line-height.

### Iconography
- Use modern thin-line icon set: **Feather**, **Lucide**, or **Tabler**.
- Reduce icon-to-text size on dense lists; keep icons only in the sidebar and compact controls.

### Spacing and radius
- Spacing scale: 4 / 8 / 16 / 24 / 32 / 48
- Border radius: base `12px` for cards and `8px` for inputs.
- Elevation: subtle `box-shadow: 0 6px 18px rgba(16,24,40,0.06)` for surface cards.

---

## Layout & Navigation
### Breakpoints
- Desktop: `≥ 1200px` (primary layout with sidebar + top header)
- Tablet: `768px–1199px` (collapsible sidebar, more vertical stacking)
- Mobile: `< 768px` (sidebar collapsed into hamburger, content stacked)

### Sidebar (left)
- Compact width: 72px (icons only) collapsed; Expanded width: 240px.
- Use grouped sections with subtle separators: Primary actions, Finance, Admin tools.
- Active state: subtle pill with left accent and slightly elevated background; icon color = primary.
- Add a collapsed tooltip on hover for labels.

### Top header
- Keep center-left brand (logo + short name), center content space minimal; right side: user avatar with role label, utility actions (search/global add / notifications / sign out).
- Primary CTA (e.g., *Invite Member*) should be a prominent button in the content area top-right, not the header.

### Page content area
- Use a 12-column grid; content padding 24–32px from the left content edge.
- Dashboard uses a responsive card grid; lists and tables use full width with comfortable row height.

---

## Component Library (required components & states)
> For every component the LLM should output: **visual spec** (colors, typography, spacing), **states** (default, hover, focus, disabled), **ARIA roles** and **CSS / Flutter example**.

1. **Top header** — app title, actions, avatar with dropdown, notifications.
2. **Sidebar** — icon + label rows, collapsed state tooltips.
3. **Statistic Card** — small tile with label, value, optional sparkline. (acceptance: value readable at small sizes, keyboard-focusable)
4. **Large Info Card** — title, body copy, KPI and CTA area (for larger metrics).
5. **Primary Button / Secondary / Ghost** — rounded (8–12px), sizes: small/medium/large.
6. **Invite FAB/Button** — prominent purple primary, rounded, subtle shadow.
7. **Search Input with Filter Chip Row** — input + clear button + filter chips.
8. **Table** — accessible table with sorting, sticky header, row hover, row actions menu. On mobile, collapse into list with accordion rows.
9. **Row Item (MemberRow)** — avatar, name, secondary text (email/phone), join date, status pill (approved/active/pending/rejected), actions (menu with View/Edit/Delete). Must be keyboard accessible.
10. **Status Pill** — soft background with icon and readable label (success green, neutral grey, warning yellow, danger red). Add subtle outline for contrast.
11. **Modal Dialog** — centered, accessible roles, title, body, primary & secondary actions, close button.
12. **Form Controls** — text input, number, select, date, toggle, file upload, validation messages.
13. **Toasts / Alerts** — small contextual messages with mild elevation and optional inline actions.
14. **Empty State** — friendly illustration, title, brief explanation, primary CTA.
15. **Pagination / Infinite scroll** — choose consistent approach. If table heavy, keep pagination controls visible.
16. **Charts** — donut and bar with muted gridlines and accessible legends (text + accessible color-blind friendly palettes)


---

## Page-Level Specifications & Acceptance Criteria
> Each page section below lists required components, layout needs, and what “done” looks like.

### A — Dashboard (Landing)
**Components:** Header, Sidebar, Search (optional), KPI stat cards (Total Members, Active Members, Total Contributions, Monthly Contributions), status summary cards (pending/approved/rejected), large chart (donut) + recent pending contributions table.

**Layout:** Two-row grid: Top KPI row (4 cards), middle metrics summary row (3 cards) and large grid containing chart + recent contributions table.

**Interactions / Acceptance:**
- KPI cards clickable and keyboard-focusable; clicking navigates to the relevant list filtered.
- Chart has hover tooltips and full accessible legend (text labels). Legend items are toggles to hide/show series.
- Recent contributions table rows link to contribution detail.
- Performance: page should render load skeletons while fetching.

### B — Members List
**Components:** Search + filters, members table (avatar, name, email, phone, join date, status pill, actions), invite button.

**Acceptance:**
- Search filters by name/email/phone with debounce 300ms.
- Table rows have a condensed and an expanded view (expanded shows address and quick actions) for narrow screens.
- Bulk select + bulk actions (Export CSV, Set status) present.
- Invite CTA pinned top-right as a primary accent button.

### C — Member Detail
**Components:** Member header (avatar, name, status, quick actions), tabs (Profile, Contributions, Claims, Payments, Activity), detail cards.

**Acceptance:**
- Tabs are keyboard navigable.
- Contribution list supports filtering by date range and type.

### D — Contributions, Payouts, Claims, Reports
**Components:** Table/list variants, filter drawers for advanced filters, export actions, batch actions (approve/reject), confirmation dialogs on destructive actions.

**Acceptance:**
- Advanced filters exist in a slide-over panel (not modal) and remember last used filters per user.
- Bulk operations show progress and partial failure states.

### E — Configuration & Admin Tools
**Components:** Forms with grouped sections, confirm dialogs for dangerous actions, user role management UI.

**Acceptance:**
- Each action should have confirmation & undo pattern where appropriate.

---

## Responsiveness Patterns
- **Desktop:** full table with columns. Sidebar expanded.
- **Tablet:** reduce columns, collapse less important columns into a “more” dropdown.
- **Mobile:** convert tables into stacked cards/accordions; include a compact header with a search icon and primary actions condensed.
- **Sidebar behavior:** collapsed into hamburger; show route breadcrumbs at top of content.

---

## Accessibility Checklist (must pass)
- Color contrast >= AA for body copy and >= AA for large text; aim for AAA where possible.
- All interactive elements reachable and operable by keyboard.
- All inputs and controls have accessible labels (`aria-label` or `<label>`).
- Focus visible and consistent (not reliant on color alone).
- Provide `prefers-reduced-motion` support.
- Charts provide textual summaries and accessible data tables for screen readers.
- Modal traps focus and returns focus on close.

---

## Design Tokens (examples)
```json
{
  "color": {
    "bg": "#F7FAFC",
    "surface": "#FFFFFF",
    "primary": "#6D28D9",
    "primary-600": "#5B21B6",
    "accent": "#06B6D4",
    "muted": "#6B7280",
    "danger": "#EF4444",
    "line": "#E6E9EE"
  },
  "radius": {
    "base": "12px",
    "input": "8px"
  },
  "shadow": {
    "card": "0 6px 18px rgba(16,24,40,0.06)"
  },
  "space": {
    "1": "4px",
    "2": "8px",
    "3": "16px",
    "4": "24px"
  },
  "font": {
    "family": "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue'",
    "base": "14px",
    "scale": {"sm": "12px", "md": "14px", "lg": "16px"}
  }
}
```

### CSS variable example
```css
:root{
  --bg: #F7FAFC;
  --surface: #FFFFFF;
  --primary: #6D28D9;
  --muted: #6B7280;
  --line: #E6E9EE;
  --radius-base: 12px;
  --shadow-card: 0 6px 18px rgba(16,24,40,0.06);
}
```

### Flutter Theme snippet (example)
```dart
final ThemeData appTheme = ThemeData(
  brightness: Brightness.light,
  primaryColor: Color(0xFF6D28D9),
  scaffoldBackgroundColor: Color(0xFFF7FAFC),
  cardColor: Colors.white,
  textTheme: TextTheme(
    bodyLarge: TextStyle(fontFamily: 'Inter', fontSize: 16),
    bodyMedium: TextStyle(fontFamily: 'Inter', fontSize: 14),
    titleLarge: TextStyle(fontFamily: 'Inter', fontSize: 20, fontWeight: FontWeight.w700),
  ),
  elevatedButtonTheme: ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)))
  )
);
```

---

## Motion & Microinteractions
- Use short easing and low-duration motions: 150-250ms for simple hover/press, 300ms for modal animations.
- Hover: subtle lift & shadow increase for cards.
- Focus: small outline + contrast change; don't rely on color only.
- Toasts: slide-in from top-right and auto-dismiss after 4-6s with hover pause.



