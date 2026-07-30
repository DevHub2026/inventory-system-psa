# PSA Inventory System - Unified Design System

## Overview
This document defines the unified design language across Web and Mobile platforms to ensure visual consistency, improved user experience, and maintainable codebase.

## Design Principles
1. **Consistency**: Same visual language across platforms
2. **Clean & Modern**: Minimalist design with focus on content
3. **PSA Brand**: Respect the PSA blue, yellow, and red identity
4. **Accessibility**: WCAG 2.1 AA compliant
5. **Responsive**: Mobile-first approach

---

## Color System

### Primary Brand Colors
```
PSA Blue (Primary):   #0D47A1
PSA Blue Hover:       #1565C0
PSA Blue Light:       #1A6FD4
PSA Blue Pale:        #EEF4FF
PSA Yellow (Accent):  #FFD400
PSA Yellow Light:     #FFE566
PSA Red (Alert):      #E31C23
PSA Red Light:        #FF5A5F
```

### Semantic Colors
```
Success:  #2E7D32 (green)
Warning:  #F9A825 (amber)
Danger:   #D32F2F (red)
Info:     #0288D1 (blue)
Purple:   #7C3AED
Teal:     #0F766E
```

### Neutral Palette
```
Background:     #F5F7FA (light gray-blue)
Surface:        #F8FAFC (almost white)
Card:           #FFFFFF (pure white)
Border:         #E5E7EB (light gray)
Border Light:   #EEF2F8 (very light blue-gray)

Text Primary:   #1F2937 (almost black)
Text Secondary: #6B7280 (medium gray)
Text Muted:     #9CA3AF (light gray)
Hover BG:       #F3F4F6 (subtle gray)
```

---

## Typography

### Font Family
- **Web & Mobile**: Inter (sans-serif)
- **Fallback**: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui

### Font Sizes
```
Page Title:      32px (H1)
Section Title:   22px (H2)
Subsection:      18px (H3)
Card Title:      14px (H5)
Body Text:       14px
Secondary Text:  13px
Small Text:      12px
Tiny Text:       11px
```

### Font Weights
```
Light:    300
Regular:  400
Medium:   500
Semibold: 600
Bold:     700
Extra Bold: 800
```

---

## Spacing Scale

### Base Unit: 4px
```
1:  4px   (space-1)
2:  8px   (space-2)
3:  12px  (space-3)
4:  16px  (space-4)
5:  20px  (space-5)
6:  24px  (space-6)
8:  32px  (space-8)
10: 40px  (space-10)
12: 48px  (space-12)
```

---

## Border Radius

```
XS:   4px   (radius-xs)   - Chips, tags
SM:   6px   (radius-sm)   - Small buttons
Base: 10px  (radius)      - Default
MD:   12px  (radius-md)   - Cards, inputs, buttons
LG:   16px  (radius-lg)   - Large cards
XL:   20px  (radius-xl)   - Modals
2XL:  24px  (radius-2xl)  - Hero elements
```

---

## Shadows

```
XS: 0 1px 2px rgba(0,0,0,0.05)    - Subtle lift
SM: 0 2px 6px rgba(0,0,0,0.06)    - Small cards
MD: 0 4px 12px rgba(0,0,0,0.08)   - Default cards
LG: 0 8px 24px rgba(0,0,0,0.10)   - Elevated cards
XL: 0 16px 40px rgba(0,0,0,0.12)  - Modals, dropdowns
```

---

## Component Specifications

### Buttons

#### Primary Button
```
Height:        40px
Padding:       10px 20px
Border Radius: 10px
Background:    Linear gradient (PSA Blue)
Text:          14px, weight 500, white
Shadow:        MD on hover
```

#### Secondary Button
```
Height:        40px
Padding:       10px 20px
Border Radius: 10px
Background:    White
Border:        1.5px solid PSA Blue
Text:          14px, weight 500, PSA Blue
```

#### Tertiary/Text Button
```
Height:        36px
Padding:       8px 16px
Background:    Transparent
Text:          14px, weight 500, PSA Blue
Hover:         Background: PSA Blue Pale
```

### Input Fields

```
Height:        44px
Border Radius: 10px
Border:        1.5px solid #E5E7EB
Background:    #F8FAFC
Padding:       12px 14px
Font Size:     14px
Focus Border:  PSA Blue (#0D47A1)
Focus Shadow:  0 0 0 3px rgba(13,71,161,0.12)
```

### Cards

#### Standard Card
```
Background:    White
Border:        1px solid #E5E7EB
Border Radius: 12px
Padding:       16px
Shadow:        SM (default), MD (hover)
Hover:         Lift -2px, increase shadow
```

#### Stat Card (Dashboard)
```
Min Height:    148px
Background:    White
Border Radius: 12px
Padding:       20px
Icon Size:     24px in 48px container
Number:        32px, weight 700
Label:         13px, weight 500, muted
```

### Status Badges

```
Height:        24px
Padding:       4px 10px
Border Radius: 20px (pill shape)
Font Size:     11px
Font Weight:   600
Letter Spacing: 0.04em
Text Transform: Uppercase

Colors:
- Available:   Green background, dark green text
- Borrowed:    Blue background, dark blue text
- Reserved:    Purple background, dark purple text
- Maintenance: Amber background, dark amber text
- Disposed:    Red background, dark red text
```

### Navigation

#### Top Navigation (Web)
```
Height:        64px
Background:    PSA Blue
Text:          White
Shadow:        None
Logo Height:   36px
```

#### Bottom Navigation (Mobile)
```
Height:        60px
Background:    White
Border Top:    1px solid #E5E7EB
Icon Size:     22px
Label:         11px, weight 600
Active Color:  PSA Blue
Inactive:      Text Muted
```

#### Sidebar (Web)
```
Width:         260px
Background:    White
Border Right:  1px solid #E5E7EB
Item Height:   52px
Icon Size:     20px
Gap:           12px
Active BG:     PSA Blue Pale
Active Text:   PSA Blue
```

---

## Layout Patterns

### Page Structure (Web)
```
- App Shell: Flex layout
- Sidebar: 260px fixed width
- Main Content: Flex 1
- Content Padding: 24px
- Max Content Width: 1400px
```

### Page Structure (Mobile)
```
- App Bar: 56px height
- Content: Flex 1, scrollable
- Bottom Nav: 60px height
- Screen Padding: 16px
```

### Grid System
```
Mobile (< 640px):   1 column
Tablet (640-1024px): 2 columns
Desktop (> 1024px):  4 columns (stats), 2-3 columns (content)
Gap: 16px
```

---

## Iconography

### Icon Library
- **Web**: Lucide React
- **Mobile**: Material Icons (Flutter)

### Icon Sizes
```
Small:   16px
Default: 20px
Medium:  24px
Large:   32px
XLarge:  40px
```

### Icon Usage
- Use outline style by default
- Fill style for selected/active states
- Consistent 2px stroke width
- Align with text baseline

---

## Animation & Transitions

### Duration
```
Fast:    150ms
Default: 200ms
Slow:    300ms
```

### Easing
```
Default:    cubic-bezier(0.4, 0, 0.2, 1)
Emphasized: cubic-bezier(0.22, 1, 0.36, 1)
```

### Common Transitions
```
- Hover effects: 150ms
- Modal appear: 200ms fade + slide
- Page transitions: 200ms fade
- Card hover: Transform + shadow 200ms
```

---

## Responsive Breakpoints

```
Mobile:   < 640px
Tablet:   640px - 1024px
Desktop:  > 1024px
Wide:     > 1400px
```

---

## Accessibility

### Color Contrast
- All text meets WCAG AA (4.5:1 for normal, 3:1 for large)
- Interactive elements have 3:1 contrast

### Focus States
- Visible focus ring: 3px solid PSA Blue with 0.3 opacity
- Focus indicator never removed

### Touch Targets (Mobile)
- Minimum: 44x44px
- Preferred: 48x48px

### Screen Reader Support
- Semantic HTML
- ARIA labels where needed
- Proper heading hierarchy

---

## Implementation Notes

### Web (React + TypeScript)
- Use CSS custom properties
- Tailwind for utility classes
- Component library in `/components/ui`

### Mobile (Flutter + Dart)
- Centralized theme in `app_theme.dart`
- Material Design 3
- Consistent widget styling

### Cross-Platform Consistency
- Match visual appearance 1:1
- Same spacing, colors, typography
- Platform-specific interactions (e.g., swipe gestures)
