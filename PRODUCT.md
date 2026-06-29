# Product

## Register

split: brand (/) · product (/[restaurantId]/*)

The landing page (/) is a conversion surface — design IS the pitch. The dashboard is an operational tool — design SERVES the workflow. Both registers coexist; default to `product` for any page under `/[restaurantId]/`.

## Users

**Restaurant owners in Bamako and Francophone West Africa.** Small to mid-sized operations: maquis, grillades, family restaurants. They manage everything themselves or with 2-3 staff. They take orders on WhatsApp already — by hand, losing 30-40% of evening orders when they're busy. Their phone is their primary computer. Network quality varies.

Secondary: the restaurant's end customers (invisible to the UI, but they interact with the WhatsApp bot RestoFlow powers).

## Product Purpose

RestoFlow is a WhatsApp-native ordering automation SaaS for West African restaurants. The bot takes orders, confirms them, triggers Wave/mobile-money payment, and surfaces them on a real-time kitchen dashboard — without the owner lifting a finger. Success = the owner gains 2h/day and 30%+ more evening revenue without hiring anyone.

## Brand Personality

**Ambitieux · Moderne · Direct**

Tone: confident, no filler. Speaks to restaurateurs as capable entrepreneurs, not tech novices. French-first. Numbers over adjectives ("15 commandes de plus par mois" beats "boostez votre CA"). Urgency is real, not manufactured.

## Anti-references

- SaaS générique US: purple/blue gradients, "Supercharge your workflow", pricing tables with 10 checkboxes, Webflow hero templates, "AI-powered" badge. None of that.
- Telco / mobile money aesthetic (MTN yellow, Orange red, Wave blue-purple). RestoFlow is for restaurants, not a telco.
- Generic dark dashboard with colored sidebar nav. The product UI should feel operational, not decorative.

## Design Principles

1. **Clarifier le prochain geste.** Every screen has one obvious next action. Never make the user think about what to do.
2. **Convertir avec des preuves.** Conversions happen through specific numbers and names, never generic claims. "Ibrahim K. — Hamdallaye — +40%" beats "nos clients témoignent".
3. **Réassurer avant le doute.** Anticipate the objection before the user forms it. Answer it in the same sentence that raises it.
4. **Valeur en 5 secondes.** Landing or dashboard — the core benefit must be obvious within 5 seconds of arrival.
5. **Mobile d'abord, toujours.** Designs are judged on a 375px screen before a 1440px one. Tap targets ≥44px. No hover-only affordances.

## Accessibility & Inclusion

Target: WCAG 2.1 AA contrast (4.5:1 body, 3:1 large text), keyboard navigation, visible focus rings. No motion by default for users with `prefers-reduced-motion`. Accessible in French only (no i18n required for now).
