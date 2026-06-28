# RestoFlow Design System
> Inspiré des tokens Stripe (source : stripe.com branding + docs.stripe.com/elements/appearance-api)

## Couleurs

### Marque
| Token               | Valeur      | Usage                          |
|---------------------|-------------|--------------------------------|
| `brand`             | `#1a4d2e`   | Couleur principale RestoFlow   |
| `brand-light`       | `#16a34a`   | Hover, accents                 |
| `danger`            | `#df1b41`   | Erreurs, urgence (Stripe)      |
| `warning`           | `#c2410c`   | Alertes orange                 |

### Texte
| Token               | Valeur      | Usage                          |
|---------------------|-------------|--------------------------------|
| `text-primary`      | `#30313d`   | Corps principal (Stripe)       |
| `text-secondary`    | `#6b7c93`   | Sous-titres, labels            |
| `text-tertiary`     | `#8898aa`   | Métadonnées, placeholders      |

### Fond & Surfaces
| Token               | Valeur      | Usage                          |
|---------------------|-------------|--------------------------------|
| `bg`                | `#ffffff`   | Fond principal                 |
| `surface`           | `#f6f9fc`   | Sections alternées (Stripe)    |
| `surface-light`     | `#f4f5f6`   | Rangées de tableau, hover      |

### Bordures
| Token               | Valeur      | Usage                          |
|---------------------|-------------|--------------------------------|
| `border`            | `#e0e6eb`   | Séparateurs, cartes (Stripe)   |
| `border-light`      | `#f4f5f6`   | Séparateurs intérieurs         |

## Typographie

```
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```
(équivalent web-safe de "Sohne", la police de Stripe)

| Niveau  | Taille  | Poids | Letter-spacing |
|---------|---------|-------|----------------|
| H1      | 50px    | 800   | -1.5px         |
| H2      | 36px    | 800   | -1px           |
| H3      | 18px    | 700   | -0.3px         |
| Body    | 14-16px | 400   | normal         |
| Label   | 13px    | 500   | normal         |
| Caption | 11-12px | 400   | 0.02em         |

## Ombres

```css
/* Stripe sm — cartes légères */
--shadow-sm: 0px 1px 1px rgba(0, 0, 0, 0.03), 0px 3px 6px rgba(18, 42, 66, 0.02);

/* Stripe md — cartes élevées, modales */
--shadow-md: 0 2px 5px 0 rgba(50, 50, 93, 0.10), 0 1px 1px 0 rgba(0, 0, 0, 0.07);

/* Stripe lg — modales, dropdowns */
--shadow-lg: 0 30px 60px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(50, 50, 93, 0.05);

/* Focus ring */
--shadow-focus: 0 0 0 2px rgba(26, 77, 46, 0.30);
```

## Border Radius

| Élément       | Valeur | Note                      |
|---------------|--------|---------------------------|
| Inputs        | 4px    | Stripe strict             |
| Boutons       | 6px    | Stripe adapté             |
| Cartes        | 8px    | Stripe adapté             |
| Badges/Pills  | 20px   | Pill plein                |
| Avatar        | 50%    | Cercle                    |

## Spacing (unité 8px)

| Alias  | Valeur | Usage                    |
|--------|--------|--------------------------|
| `xs`   | 4px    | Icônes inline, gaps      |
| `sm`   | 8px    | Padding intérieur        |
| `md`   | 16px   | Gap entre éléments       |
| `lg`   | 24px   | Padding de carte         |
| `xl`   | 32px   | Section intérieure       |
| `2xl`  | 48px   | Gap de section           |
| `3xl`  | 80px   | Padding de section       |

## Composants

### Bouton primaire
```css
background: #1a4d2e;
color: #ffffff;
border-radius: 6px;
padding: 9px 18px;
font-weight: 700;
font-size: 14px;
border: none;
box-shadow: none; /* Stripe n'utilise pas de shadow sur les boutons */
transition: background-color 0.15s;
/* hover: background #16a34a */
```

### Carte
```css
background: #ffffff;
border: 1px solid #e0e6eb;
border-radius: 8px;
padding: 24px;
box-shadow: 0px 1px 1px rgba(0,0,0,0.03), 0px 3px 6px rgba(18,42,66,0.02);
```

### Badge statut
```css
border-radius: 20px;
padding: 4px 10px;
font-size: 11.5px;
font-weight: 700;
```
