# GM Silver Design System

This document translates the premium GM Silver UI vision into implementation-ready guidance for mobile and admin experiences.

## 1. Brand Intent

- Positioning: premium silver catalog and operations suite.
- Visual personality: refined, bright, calm, modern, trustworthy.
- UI direction: soft glassmorphism on light surfaces with metallic accents.

## 2. Core Palette

### Neutrals

- Pearl White: `#F8F7F4`
- Frost White: `#FFFFFF`
- Mist Grey: `#EEF1F4`
- Silver Satin: `#C6CCD3`
- Platinum Light: `#DDE2E8`

### Text

- Primary text: `#1F2733`
- Secondary text: `#667283`
- Muted text: `#8390A1`

### Accents

- Soft Blue: `#87A9D9`
- Elegant Purple: `#8C78B8`
- Premium Teal: `#4EA8A1`
- Champagne: `#D8C29A`

### States

- Success: `#66B7A3`
- Warning: `#D9A86C`
- Error: `#C97D8A`

## 3. Typography

- Heading style: Plus Jakarta Sans (fallback: system semibold/bold)
- Body style: Manrope (fallback: system regular/medium)
- Numeric data emphasis: Space Grotesk (fallback: system medium)

Mobile fallback scale:

- Hero: 24/30, 700
- H2: 20/26, 700
- Card title: 14/18, 700
- Body: 14/22, 500
- Caption: 12/18, 500
- Meta: 11/16, 600, uppercase tracking

## 4. Spacing and Radius

- Base spacing unit: 4
- Scale: 4, 8, 12, 16, 20, 24, 32, 40
- Radius:
  - Input: 10
  - Standard card: 14-16
  - Feature card: 18-20
  - Modal: 20+

## 5. Shadow and Glass Specs

- Card shadow: soft cool shadow, y-offset 8-10, blur 14-18, low opacity.
- Border: 1px cool neutral at 20-35% opacity.
- Glass panel: white tint with 65-75% alpha over atmospheric background.

## 6. Mobile Screen Blueprint

### Splash

- Full-screen pearl-to-platinum wash.
- GM Silver mark in center with subtle reflective sweep.
- Duration target: 1.2-1.8 seconds.

### Login

- Top logo lockup and trust tagline.
- Centered glass card with email/password + biometric CTA.
- Secondary row: forgot password + support.

### Dashboard

- Welcome hero.
- KPI summary strip.
- Featured collection carousel.
- Top products cards and quick actions.

### Product Catalog

- Search input + filter chips + sort control.
- Grid/list toggle.
- Product card includes image, name, SKU, price, stock indicator.

### Product Details

- Image gallery at top.
- SKU and purity metadata.
- Weight and pricing blocks.
- Inventory status and related products.

### Categories

- Image-led tiles, visible product counts.
- Quick drill-down to product lists.

### Favorites

- Segments: favorites, recent, saved filters.
- Quick remove and share actions.

### Notifications

- Group by type: stock, price, launches, updates.
- Rich card style with direct action CTA.

## 7. Admin UX Blueprint

### Responsive Layout

- Desktop: left nav + top utility bar + multi-panel analytics.
- Tablet: compact sidebar + two-column data cards.
- Mobile admin: bottom tabs + stacked cards + drawers.

### Core Modules

- Dashboard: KPIs, category velocity, low-stock watchlist.
- Product Management: add/edit/delete, SKU controls, image manager, bulk import.
- Catalog Management: category and collection hierarchy.
- User Management: RBAC for admin/manager/sales roles.
- Reports: time filters, export presets, trend analysis.

## 8. Component Library Guidance

- Buttons: primary glass, outline, text, destructive outline.
- Cards: product card, featured card, KPI card, insight card.
- Tables: sticky headers, soft row hover, compact/comfortable density.
- Forms: floating labels, inline validation, searchable dropdowns.
- Feedback: skeleton loaders, empty states, toast and modal system.

## 9. Motion and Interaction

- Tap feedback: 160-200ms.
- Panel transitions: 240-320ms.
- Hero/entry reveals: 380-450ms with subtle stagger.
- Use light haptics for selection and success confirmations.

## 10. Accessibility and Quality Bar

- WCAG AA contrast minimum for all text and controls.
- Minimum touch target: 44x44.
- Dynamic type support and semantic labels.
- Performance: progressive image loading and lightweight overlays.

## 11. Suggested Inspiration Themes

- Luxury jewelry editorial layouts.
- Premium fintech clarity patterns.
- Boutique retail analytics dashboards.
- Material-focused product galleries.
