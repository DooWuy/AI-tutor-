---
name: Fidelity Modern
colors:
  surface: '#f9f9ff'
  surface-dim: '#d7dae3'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3fc'
  surface-container: '#ebedf7'
  surface-container-high: '#e6e8f1'
  surface-container-highest: '#e0e2eb'
  on-surface: '#181c22'
  on-surface-variant: '#414753'
  inverse-surface: '#2d3037'
  inverse-on-surface: '#eef0fa'
  outline: '#717785'
  outline-variant: '#c1c6d5'
  surface-tint: '#005db8'
  primary: '#005cb8'
  on-primary: '#ffffff'
  primary-container: '#1275e2'
  on-primary-container: '#000512'
  inverse-primary: '#aac7ff'
  secondary: '#465f88'
  on-secondary: '#ffffff'
  secondary-container: '#b6d0ff'
  on-secondary-container: '#3f5881'
  tertiary: '#9a4600'
  on-tertiary: '#ffffff'
  tertiary-container: '#c05900'
  on-tertiary-container: '#0d0300'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#aac7ff'
  on-primary-fixed: '#001b3e'
  on-primary-fixed-variant: '#00458d'
  secondary-fixed: '#d6e3ff'
  secondary-fixed-dim: '#aec7f7'
  on-secondary-fixed: '#001b3d'
  on-secondary-fixed-variant: '#2d476f'
  tertiary-fixed: '#ffdbc9'
  tertiary-fixed-dim: '#ffb68c'
  on-tertiary-fixed: '#321200'
  on-tertiary-fixed-variant: '#763400'
  background: '#f9f9ff'
  on-background: '#181c22'
  surface-variant: '#e0e2eb'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  margin: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

# Design System Document

## Brand & Style
Fidelity Modern is a clean, reliable, and professional design system that blends precision with approachable digital interactions. It adopts a modern corporate aesthetic inspired by high-utility interface standards, emphasizing clarity, efficiency, and structured layout harmony. The visual language conveys trustworthiness and focus, prioritizing content readability and intuitive navigation.

## Colors
The color palette is built for clarity and high-contrast legibility in light mode environments.
- **Primary (`#1275e2`):** A vibrant, dependable blue driving key interactive elements, primary actions, and focused states.
- **Secondary (`#5f78a3`):** A slate-blue supporting tone used for secondary actions, subtle highlights, and complementary badges.
- **Tertiary (`#c55b00`):** A warm amber/orange accent utilized for critical highlights, alerts, and call-to-action focal points.
- **Neutral (`#74777f`):** A balanced gray palette for structural surfaces, borders, and typography.

## Typography
The system uses **Inter** exclusively across all hierarchy levels, ensuring a geometric yet humanist legibility across headlines, body copy, and interface labels.

## Layout & Spacing
A balanced fluid grid system governed by an 8px base spacing rhythm. Margins scale smoothly across viewports, while standard component gaps maintain consistent breathing room across dashboards, forms, and content containers.

## Elevation & Depth
Elevation is achieved through a combination of subtle tonal surface layering and diffused ambient shadows. Low-contrast borders provide crisp structural separation without heavy visual weight.

## Shapes
The design system employs a moderately rounded shape language (`roundedness: 2`). Buttons, cards, and input fields feature friendly, modern corner radii that soften the interface while maintaining structural precision.

## Components
- **Buttons:** Solid primary buttons use the primary blue with rounded corners, while secondary actions use subtle borders or tonal fills.
- **Input Fields:** Clear boundaries defined by neutral outlines, featuring distinct focus states using the primary color.
- **Cards:** Clean surfaces with soft elevation and rounded corners to group related information securely.
- **Chips & Badges:** Compact pill or rounded-rectangle elements for status tagging and filtering.