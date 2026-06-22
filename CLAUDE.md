@AGENTS.md

## Projet RestoFlow

Site vitrine restaurant — Next.js (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui.

### Stack
- **Framework** : Next.js 16+ (App Router, `src/` directory)
- **UI** : Tailwind CSS v4, shadcn/ui, Lucide icons
- **Utilitaires** : clsx, tailwind-merge, class-variance-authority
- **Carousel** : embla-carousel-react
- **Langue** : TypeScript strict

### Structure
```
src/
  app/            → Pages (App Router)
  components/
    layout/       → Header, Footer
    sections/     → Hero, Menu, About, Gallery, Reservation, Contact
    ui/           → Composants shadcn/ui
  data/           → Données statiques (restaurant.ts)
  lib/            → Utilitaires (utils.ts)
public/images/    → Images du site
```

### Commandes
- `npm run dev` — Serveur de développement
- `npm run build` — Build production
- `npx next start --hostname 0.0.0.0` — Test mobile (après build)

### Règles
- Toujours utiliser `cn()` pour combiner les classes
- Composants serveur par défaut, `"use client"` seulement si nécessaire
- Données centralisées dans `src/data/restaurant.ts`
- Design dark/premium par défaut
