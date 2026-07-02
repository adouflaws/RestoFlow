// Design tokens — source of truth matching DESIGN.md frontmatter.
// Commandes page uses a local T object that mirrors these; other pages use this.
export const C = {
  brand:           "#1a4d2e",
  brandHover:      "#16a34a",
  danger:          "#df1b41",
  dangerBg:        "#fef2f2",
  warnAmber:       "#b45309",
  warnAmberBg:     "#fffbeb",
  warnAmberBorder: "#fde68a",
  warnRed:         "#dc2626",
  warnRedBorder:   "#fecaca",
  textPrimary:     "#30313d",
  textSecondary:   "#6b7c93",
  textTertiary:    "#8898aa",
  white:           "#ffffff",
  surface:         "#f6f9fc",
  surfaceSubtle:   "#f4f5f6",
  border:          "#e0e6eb",
  borderInner:     "#f4f5f6",
} as const;

export const SH = {
  sm:    "0px 1px 1px rgba(0,0,0,0.03), 0px 3px 6px rgba(18,42,66,0.02)",
  md:    "0 2px 5px 0 rgba(50,50,93,0.10), 0 1px 1px 0 rgba(0,0,0,0.07)",
  lg:    "0 30px 60px rgba(0,0,0,0.12), 0 0 0 1px rgba(50,50,93,0.05)",
  focus: "0 0 0 2px rgba(26,77,46,0.30)",
} as const;

export const WA_UPGRADE =
  "https://wa.me/22376753087?text=Bonjour%20RestoFlow%2C%20je%20souhaite%20passer%20au%20plan%20Pro.";
