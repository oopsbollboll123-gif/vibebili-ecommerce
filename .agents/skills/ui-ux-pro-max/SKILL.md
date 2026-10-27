---
name: ui-ux-pro-max
description: >-
  UI/UX design intelligence for web, mobile, and desktop. This skill should be used when designing,
  building, reviewing, or fixing interfaces, including pages, components, design systems, accessibility,
  interaction, responsive layout, typography, color, charts, and stack-specific UI implementation.
---

# UI/UX Pro Max - Design Intelligence

Comprehensive UI/UX design intelligence and implementation guidance for web, mobile, and desktop applications.

## When to Apply
Use this Skill when the task involves UI structure, visual design decisions, interaction patterns, or user experience quality control:
- Designing new pages and screen layouts
- Creating, refactoring, or polishing UI components
- Choosing color, typography, spacing, and layout systems
- Reviewing UI for UX, accessibility (WCAG), and consistency
- Implementing navigation, animation, and responsive behavior
- Improving perceived quality, performance (CLS/LCP), and usability

## Rule Categories by Priority (1 → 10)

| Priority | Category | Impact | Key Checks (Must Have) | Anti-Patterns (Avoid) |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Accessibility** | CRITICAL | Contrast 4.5:1, Alt text, Keyboard nav, Focus rings, Aria-labels | Removing focus rings, Icon-only buttons without labels |
| **2** | **Touch & Interaction** | CRITICAL | Min target size 44×44px, 8px+ spacing, Loading feedback | Reliance on hover only, Instant state changes (0ms) |
| **3** | **Performance** | HIGH | WebP/AVIF, Lazy loading, Reserve space (CLS < 0.1) | Layout thrashing, Cumulative Layout Shift |
| **4** | **Style Selection** | HIGH | Match product type, Consistency, Clean SVG icons (no emoji as icons) | Mixing flat & skeuomorphic randomly, Emojis as UI icons |
| **5** | **Layout & Responsive** | HIGH | Mobile-first breakpoints, Viewport meta, No horizontal scroll | Horizontal scroll, Fixed px container widths, Disable zoom |
| **6** | **Typography & Color** | MEDIUM | Base 16px, Line-height 1.5, Semantic color tokens | Text < 12px body, Gray-on-gray low contrast, Raw hex scattered |
| **7** | **Animation** | MEDIUM | Context-aware timing (150-300ms), Motion conveys meaning | One duration for everything, Animating width/height, No reduced-motion |
| **8** | **Forms & Feedback** | MEDIUM | Visible labels, Error near field, Helper text, Progressive disclosure | Placeholder-only label, Errors only at top, Overwhelming forms upfront |
| **9** | **Navigation Patterns** | HIGH | Predictable back, Breadcrumbs, Bottom nav ≤5, Deep linking | Overloaded nav, Broken back behavior |
| **10** | **Charts & Data** | LOW | Legends, Tooltips, Accessible colors | Relying on color alone to convey meaning |

## Practical Guidelines for E-Commerce (SHEIN / Fashion High-Density)
1. **Visual Hierarchy:** Crisp monochromatic black/white base (`#111111` / `#FFFFFF`), high-impact discount red tag (`#E02424`), warm accent badges (`#F97316`).
2. **Iconography:** Use modern inline SVG vector icons with consistent 2px stroke width and 20×20px or 24×24px bounding boxes. Do not use raw Unicode emojis for functional UI buttons.
3. **Cart & Micro-interactions:** Immediate visual feedback upon add-to-cart (sliding drawer, cart badge count bump, toast feedback).
4. **Variant Matrix:** Intuitive pill selectors for attributes (color, size, length) with clear active/disabled states.
5. **Mobile Responsiveness:** Ensure sticky actions on mobile, no horizontal scrolling, and touch targets ≥ 44px.
