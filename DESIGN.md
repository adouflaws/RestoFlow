---
name: RestoFlow
description: SaaS de commandes WhatsApp pour restaurants d'Afrique de l'Ouest francophone
colors:
  brand: "#1a4d2e"
  brand-hover: "#16a34a"
  danger: "#df1b41"
  danger-bg: "#fef2f2"
  warning-amber: "#b45309"
  warning-amber-bg: "#fffbeb"
  warning-amber-border: "#fde68a"
  warning-red: "#dc2626"
  warning-red-border: "#fecaca"
  text-primary: "#30313d"
  text-secondary: "#6b7c93"
  text-tertiary: "#8898aa"
  surface-white: "#ffffff"
  surface-base: "#f6f9fc"
  surface-subtle: "#f4f5f6"
  border: "#e0e6eb"
  border-inner: "#f4f5f6"
  status-preparing-bg: "#fff8e6"
  status-ready-bg: "#e8f0fd"
  status-delivered-bg: "#ecfdf5"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif"
    fontSize: "50px"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-1.5px"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif"
    fontSize: "36px"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-1px"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.3px"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
  caption:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.02em"
rounded:
  xs: "4px"
  sm: "6px"
  md: "8px"
  pill: "20px"
  full: "50%"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "80px"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.sm}"
    padding: "9px 18px"
  button-primary-hover:
    backgroundColor: "{colors.brand-hover}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.sm}"
    padding: "9px 18px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.brand}"
    rounded: "{rounded.sm}"
    padding: "9px 18px"
  button-ghost-hover:
    backgroundColor: "{colors.surface-base}"
    textColor: "{colors.brand}"
    rounded: "{rounded.sm}"
    padding: "9px 18px"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.sm}"
    padding: "9px 18px"
  card:
    backgroundColor: "{colors.surface-white}"
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"
  input:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xs}"
    padding: "10px 12px"
  badge:
    backgroundColor: "{colors.surface-subtle}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
---

# Design System: RestoFlow

## 1. Overview

**Creative North Star: "La Caisse Enregistreuse Moderne"**

RestoFlow's visual system is built like a well-designed cash register: every element is there because it does a job. Nothing decorates. Nothing performs. The owner of a maquis in Bamako opens the dashboard mid-service, glances at the screen, takes an action, and goes back to the grill. The interface should never make them think about the interface.

The system is product-register first. On the dashboard (`/[restaurantId]/*`), color is information, not branding. Green means action. Amber means wait. Red means act now. The landing page (`/`) is the one place where brand energy is permitted; everywhere else the goal is clarity at a glance.

This system rejects everything it doesn't need. No purple-blue SaaS gradients. No "Supercharge your workflow" energy. No telco palette (MTN yellow, Orange red, Wave blue-purple). No generic dark dashboard with colored sidebar chrome. The competitive frame is Stripe's dashboard and Linear's issue view, not a Webflow hero template.

**Key Characteristics:**
- Functional density over breathing room — information per pixel matters on a phone screen
- Color as signal, never decoration — four color roles, each with a distinct job
- One obvious next action per screen — hierarchy through layout, not decoration
- Ambient shadows, flat at rest — elevation only on modals and drawers
- System sans typography — no web fonts loaded; renders in under 50ms on 3G

## 2. Colors: The Operational Palette

Four roles, each with a distinct job. No color appears on screen without a reason.

### Primary
- **Vert Confiance Profond** (`#1a4d2e`): The brand anchor. Used exclusively on primary CTAs, active states, focus rings, checked states, and confirmed status indicators. Never as a background tint on large surfaces — its rarity is what makes it mean something.
- **Vert Confiance Hover** (`#16a34a`): The hover / active variant of the primary. Lighter, more energetic. Used only as a state transition on interactive elements that carry the primary color.

### Secondary
- **Ambre d'Alerte** (`#b45309`): Operational urgency. Used on order cards that have been waiting 5-10 minutes (preparing state, mild urgency) and on the corresponding background tint (`#fffbeb`). Signals "attention needed soon."
- **Rouge d'Urgence** (`#dc2626`): Maximum urgency. Used on order cards waiting more than 10 minutes and on the danger-bg tint (`#fef2f2`). Signals "act now." Distinct from danger (error) by context: urgency is operational, danger is systemic.

### Tertiary
- **Rouge Danger** (`#df1b41`): System error color (Stripe-exact). Used for error states, destructive action buttons, cancellation flows. Not used for urgency; that role belongs to Rouge d'Urgence.

### Neutral
- **Gris Rédactionnel** (`#30313d`): Primary text. Body copy, headings, labels that carry primary information. Warm, near-black — never pure black.
- **Gris Intermédiaire** (`#6b7c93`): Secondary text. Supporting labels, form field hints, table column headers.
- **Gris Silencieux** (`#8898aa`): Tertiary text. Timestamps, metadata, placeholder text. The quietest legible gray.
- **Blanc Pur** (`#ffffff`): Primary surface. Cards, panels, modals, inputs.
- **Gris Surface** (`#f6f9fc`): Page background and alternating section backgrounds. Slightly cooler than white — gives cards their lift without shadows.
- **Gris Léger** (`#f4f5f6`): Subtle hover and row-stripe tint. Also used as the pending-status badge background.
- **Gris Bordure** (`#e0e6eb`): Card outlines, input strokes, table dividers. Stripe-exact.
- **Gris Intérieur** (`#f4f5f6`): Inner dividers and secondary borders where `#e0e6eb` would be too heavy.

### Named Rules
**The One Voice Rule.** Vert Confiance Profond (`#1a4d2e`) appears on 10% or less of any given screen. One primary button, one active nav item, one focus ring. Its scarcity is what makes it trustworthy.

**The Four-Color Signal Rule.** The urgency system uses exactly four states: neutral (white), mild urgency (amber `#fffbeb`), high urgency (red `#fef2f2`), and resolved (white again). No additional tints. Adding a fifth state dilutes the signal.

## 3. Typography

**Body Font:** System sans-serif stack — `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`

No web fonts are loaded. The stack renders as Segoe UI on Windows, SF Pro on Apple devices, and Roboto on Android. In Bamako on a mid-range Android with variable network, zero font-loading latency is a feature, not a compromise.

**Character:** Bold weight contrast (800 for display and headline, 700 for titles, 400 for body) creates strong hierarchy without a second typeface. The tight letter-spacing on large sizes (-1.5px at display, -1px at headline) keeps headings compact and authoritative.

### Hierarchy
- **Display** (800, 50px, lh 1.05, ls -1.5px): Landing page hero only. The "RestoFlow reçoit vos commandes WhatsApp" headline.
- **Headline** (800, 36px, lh 1.1, ls -1px): Section headers on the landing page. Never used in the product dashboard.
- **Title** (700, 18px, lh 1.3, ls -0.3px): Page titles, modal titles, sidebar section headers in the dashboard.
- **Body** (400, 15px, lh 1.6): All paragraph text. Max line length 65-75ch enforced on marketing copy.
- **Label** (500, 13px, lh 1.4): Button text, form labels, table column headers, nav items, badge text.
- **Caption** (400, 11px, lh 1.4, ls 0.02em): Timestamps, metadata, fine print. Never for primary information.

### Named Rules
**The No-Web-Font Rule.** Never add a Google Fonts or Typekit import. The system sans stack renders correctly and instantly on every device in the target market. Font loading on 3G is a UX tax the user pays.

**The 65ch Rule.** Body text on marketing surfaces caps at 65-75ch per line. On mobile this is automatic; on desktop enforce `max-width: 65ch` on paragraph containers.

## 4. Elevation

The system is ambient-low at rest, inspired by Stripe's shadow vocabulary. Surfaces do not cast shadows on each other by default — they are distinguished by background color (`#ffffff` card on `#f6f9fc` page). Shadows appear only when an element lifts out of the flow: on hover, on modal open, on drawer open.

### Shadow Vocabulary
- **Ambient** (`0px 1px 1px rgba(0,0,0,0.03), 0px 3px 6px rgba(18,42,66,0.02)`): Cards and containers at rest. Nearly invisible — provides separation without visual weight. Default for all `.card` elements.
- **Elevated** (`0 2px 5px 0 rgba(50,50,93,0.10), 0 1px 1px 0 rgba(0,0,0,0.07)`): Hovered cards, dropdowns, filter popovers. Clear separation from the surface.
- **Modal** (`0 30px 60px rgba(0,0,0,0.12), 0 0 0 1px rgba(50,50,93,0.05)`): Dialogs and full-screen drawers. The 1px outline ring prevents edge bleed on white screens.
- **Focus** (`0 0 0 2px rgba(26,77,46,0.30)`): Keyboard focus ring on all interactive elements. Brand-green tinted, WCAG 2.1 AA compliant.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. Shadows appear only as a response to state (hover, lift, focus) or layer (modal above page). A card sitting next to another card does not need a shadow to be seen — the `#f6f9fc` page background does that job.

## 5. Components

### Buttons
Tactile and confident: the label is always readable, the hit target always safe (min 44px height on mobile), the state always unambiguous.

- **Shape:** Gently rounded (6px). Not a pill, not sharp. Stripe-adjacent.
- **Primary:** Vert Confiance Profond (`#1a4d2e`) background, white text, label weight (500, 13px), 9px 18px padding. Hover shifts to `#16a34a` in 150ms.
- **Ghost:** Transparent background, `#1a4d2e` text and border (1px solid). Hover fills `#f6f9fc`. Used as the secondary action alongside a primary button.
- **Danger:** `#df1b41` background, white text. Same shape as primary. Reserved for irreversible destructive actions (cancel order, delete).
- **Disabled:** Opacity 0.45 on the primary. No pointer events. No separate color.
- **Hover / Focus:** background-color 150ms ease-out. Focus ring: `box-shadow: 0 0 0 2px rgba(26,77,46,0.30)`. No transform on buttons (transform is for cards).

### Cards / Containers
- **Corner Style:** Softly rounded (8px)
- **Background:** White (`#ffffff`) on page surface (`#f6f9fc`)
- **Shadow Strategy:** Ambient at rest; Elevated on hover (see Elevation)
- **Border:** `1px solid #e0e6eb` — always present, never omitted. The border and the shadow together define the card; removing either weakens it.
- **Internal Padding:** 24px (`spacing.lg`) default. 16px (`spacing.md`) for compact dashboard cards.

### Order Cards (Signature Component)
The heart of the dashboard. Cards carry the urgency signal through background and border color, not through icons or labels alone.

- **Neutral (wait < 5min):** white background, `#e0e6eb` border, `#8898aa` timer
- **Amber urgency (5-10min):** `#fffbeb` background, `#fde68a` border, `#b45309` timer in bold
- **Red urgency (> 10min):** `#fef2f2` background, `#fecaca` border, `#dc2626` timer in bold
- **Selected state (desktop):** `2px solid #1a4d2e` ring, 3px box-shadow with brand color at 30% opacity
- **Shape:** 8px radius, full-width in list column
- **Interaction:** entire card is a `<button>`, opens detail panel (desktop) or drawer (mobile)

### Status Badges
Pill-shaped (20px radius), dense (4px 10px padding), label-weight (11-12px, 700).

| Status | Background | Text color |
|---|---|---|
| En attente | `#f4f5f6` | `#8898aa` |
| En préparation | `#fff8e6` | `#b45309` |
| Prêt | `#e8f0fd` | `#2e6da4` |
| Livré | `#ecfdf5` | `#16a34a` |
| Annulé | `#fef2f2` | `#df1b41` |

### Inputs / Fields
- **Style:** 1px solid `#e0e6eb` border, white background, 4px radius (Stripe-strict). Height: 44px minimum (touch target).
- **Focus:** border shifts to `#1a4d2e`, `box-shadow: 0 0 0 2px rgba(26,77,46,0.30)` applied simultaneously.
- **Error:** border becomes `#df1b41`, error message in `#df1b41` at 12px below the field. No icon required.
- **Disabled:** `#f4f5f6` background, `#8898aa` text, no pointer events.
- **Placeholder:** `#8898aa` (text-tertiary).

### Navigation (Dashboard)
- Sidebar nav on desktop, bottom tab bar on mobile
- Active item: `#1a4d2e` text + left-edge indicator (2px, brand green, inside the nav item — the only permitted border-left use in the system)
- Inactive item: `#6b7c93` text
- Hover: `#f4f5f6` background tint, 6px radius
- Font: label weight (500, 13px)

### KPI Cards
Compact metric display for the dashboard header.

- White background, 8px radius, ambient shadow, `#e0e6eb` border
- Leading 6px colored dot (brand green, amber, or red) above the metric label to indicate category — replaces all border-left accent treatments
- Metric value: 24px, 800 weight, text-primary
- Label: 12px, 500 weight, text-secondary

## 6. Do's and Don'ts

### Do:
- **Do** use `box-shadow: 0 0 0 2px rgba(26,77,46,0.30)` on every `:focus-visible` state. It is the universal focus indicator for the system — never replace it with an outline that clips at the border-radius.
- **Do** use `min-height: 44px` on every interactive element. Tap targets in a restaurant kitchen.
- **Do** keep Vert Confiance Profond (`#1a4d2e`) on 10% or less of screen surface. Its scarcity signals authority.
- **Do** use `prefers-reduced-motion: reduce` to disable all CSS transitions and animations for users who need it.
- **Do** use `text-wrap: balance` on headings (H1, H2, H3) to prevent widow words on narrow screens.
- **Do** express urgency through background and border color (amber/red tints on order cards), not through additional icons or labels.
- **Do** use the system sans font stack only. Never introduce a web font import.
- **Do** distinguish page background (`#f6f9fc`) from card background (`#ffffff`) — this separation replaces shadows on most surfaces.

### Don't:
- **Don't** use `border-left` or `border-right` greater than 1px as a colored accent on cards, callouts, or list items. This is an absolute ban. Replace with background tints, leading dots, or full-border treatments. The only exception is the sidebar nav active indicator.
- **Don't** use purple, blue, or gradient-heavy palettes. RestoFlow is not a generic US SaaS. "Supercharge your workflow" energy is explicitly rejected.
- **Don't** use MTN yellow, Orange red, or Wave blue-purple. RestoFlow is for restaurants, not a telco.
- **Don't** use `background-clip: text` with gradient fills. Gradient text is decorative noise.
- **Don't** use glassmorphism (backdrop-filter blur) as a default surface treatment. Reserved for rare modal overlays where it adds genuine depth.
- **Don't** build KPI cards with `border-left: 3px solid [accent]` as the color indicator. Use 6px dot above the label.
- **Don't** use the hero-metric template (big number, small label, gradient accent). It is a SaaS cliché that PRODUCT.md explicitly rejects.
- **Don't** render identical card grids (same-sized cards, icon + heading + text, repeated endlessly). Differentiate by size, weight, or purpose.
- **Don't** reach for a modal as the first solution. The order detail panel on desktop and drawer on mobile are both in-page — the modal is a last resort.
- **Don't** load fonts from Google Fonts, Typekit, or any CDN. The system sans stack is the font system.
- **Don't** use `transition: all` anywhere in the codebase. Always enumerate the specific properties to transition.
