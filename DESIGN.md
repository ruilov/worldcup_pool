# Design System - World Cup Pool 2026

## Visual Identity

**Aesthetic:** Sports-statistics terminal inspired by platforms like STATSCORE
**Theme:** Dark, high-contrast, data-driven
**Feel:** Precise, cool, minimal — a polished data terminal for World Cup predictions

## Color Palette

### Background Layers
- **Primary**: `#0a0e14` - Main canvas
- **Secondary**: `#111318` - Cards and panels
- **Tertiary**: `#1a1f28` - Elevated elements
- **Hover**: `#1e242e` - Interactive states

### Borders & Separators
- **Subtle**: `#1e242e` - Thin grid lines
- **Medium**: `#2a3340` - Standard separators
- **Strong**: `#3d4655` - Emphasis borders

### Text Hierarchy
- **Primary**: `#e6e8eb` - Main content
- **Secondary**: `#9ca3af` - Supporting text
- **Tertiary**: `#6b7280` - Labels and metadata
- **Muted**: `#4b5563` - Disabled states

### Accent Colors (Neon Tones)
- **Cyan**: `#06b6d4` - Scores, active states, primary actions
- **Mint**: `#10b981` - Success, completed states
- **Glow**: `rgba(6, 182, 212, 0.15)` - Focus rings and highlights

### Status Colors
- **Live/Error**: `#ef4444` - In-progress matches, errors
- **Completed**: `#10b981` - Finished matches
- **Scheduled**: `#6b7280` - Upcoming matches
- **Lock**: `#f59e0b` - Locked bets indicator

## Typography

### Font Families
- **Sans-serif**: System UI stack for body text and headings
- **Monospace**: Used for numerals, scores, match numbers, timestamps

### Principles
- **Tabular numerals**: All numbers use monospace for alignment
- **Modern & legible**: Clean sans-serif for maximum readability
- **Uppercase labels**: Small caps for section headers and metadata
- **Tight letter-spacing**: -0.01em to -0.02em for headings
- **Wide letter-spacing**: 0.05em to 0.1em for uppercase labels

### Scale
- **XS**: 0.75rem (12px) - Metadata, labels
- **SM**: 0.875rem (14px) - Secondary text
- **Base**: 1rem (16px) - Body text
- **LG**: 1.125rem (18px) - Subheadings
- **XL**: 1.25rem (20px) - Section headings

## Layout System

### Spacing Scale
- **XS**: 0.25rem (4px)
- **SM**: 0.5rem (8px)
- **MD**: 1rem (16px)
- **LG**: 1.5rem (24px)
- **XL**: 2rem (32px)

### Grid Principles
- **Clean grids**: Modular data cards with consistent spacing
- **Thin separators**: 1px borders using `border-subtle`
- **Card-based layout**: Data grouped in visual containers
- **Responsive**: Mobile-first with breakpoints at 768px and 1024px

### Border Radius
- **SM**: 2px - Badges, small UI elements
- **MD**: 4px - Cards, containers
- **LG**: 6px - Larger panels

## Components

### Match List Grid
- **Fixed-width columns** for consistent data alignment
- **Monospace match numbers** (#1, #42, #104)
- **Team names** in primary text color
- **Timestamps** in monospace, secondary color
- **Status badges** with colored backgrounds and borders
- **Scores** in cyan accent color, bold weight
- **Lock icons** with color-coded states (amber/gray)

### Status Badges
- **Uppercase labels** with letter-spacing
- **Border + background** for emphasis
- **Color-coded** by match state
- **Compact size** (XS font, tight padding)

### Interactive States
- **Hover**: Subtle background color shift
- **Focus**: Cyan border with soft glow
- **Transition**: 150-250ms ease for smoothness

## Usage Guidelines

### When to Use Cyan Accent
- Scores and numerical data
- Active/selected states
- Primary CTAs
- Links and interactive elements

### When to Use Mint Accent
- Success states
- Completed matches
- Positive indicators

### When to Use Monospace
- Match numbers (#42)
- Scores (2-1, 3-3)
- Timestamps
- Any numerical data
- ID fields

### When to Use Uppercase
- Section headings (MATCHES, LEADERBOARD)
- Table headers
- Labels (STATUS, LOCKED)
- Metadata tags

## Files

### Core Theme
- `src/styles/theme.css` - CSS variables and global styles

### Components
- `src/App.module.css` - Main app layout and header
- `src/components/MatchList.module.css` - Match grid and cards

### Import Order
1. `theme.css` (design tokens)
2. `index.css` (resets, if needed)
3. Component-specific CSS modules

## Future Considerations

- **Animations**: Smooth transitions for live score updates
- **Data visualization**: Charts and graphs using cyan/mint palette
- **Loading states**: Skeleton screens matching grid structure
- **Micro-interactions**: Subtle hover effects, focus indicators
- **Dark mode variations**: Already dark, but consider lighter "terminal" mode
