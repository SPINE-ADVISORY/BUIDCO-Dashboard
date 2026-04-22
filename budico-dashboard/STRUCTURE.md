# BUDICO Frontend - Detailed Project Structure

## Directory Breakdown

### `/public` - Static Assets
Contains files that are served as-is without being processed by the build system.
- Favicon, images, fonts, and other static files
- Only use for assets that don't need bundling

### `/src` - Source Code

#### `/src/components` - Reusable React Components

**`/common` - Primitive Components**
- `Primitives.jsx` - Base UI components:
  - `ProgressBar` - Visual progress indicator
  - `Badge` - Small status labels
  - `Pill` - Rounded badges
  - `Logo` - BUIDCO logo SVG
  - `KpiCard` - KPI display cards
  - `Modal` - Dialog overlay
  - `Button` - Button component
  - `StatusIndicator` - Status dot
  - `Divider` - Separator

**`/layout` - Layout Components** (To be created)
- `Header.jsx` - Top navigation bar with search
- `MainLayout.jsx` - Main wrapper layout
- `Sidebar.jsx` - Sidebar navigation (if needed)

**`/tabs` - Tab-Based Views** (To be created)
- `OverviewTab.jsx` - Dashboard overview with KPIs
- `SectorsTab.jsx` - Sector analysis and cards
- `ProjectsTab.jsx` - Projects table and filtering
- `DistrictsTab.jsx` - District-wise breakdown
- `CosEotTab.jsx` - Change of Scope & Extension of Time
- `MgmtActionTab.jsx` - Management flags and actions

**`/modals` - Modal Dialogs** (To be created)
- `ProjectDetailModal.jsx` - Detailed project view
- `ProjectFormModal.jsx` - Add/Edit project form
- `ManagementFlagModal.jsx` - Flag details

**`/tables` - Table Components** (To be created)
- `ProjectsTable.jsx` - Main projects data table
- `CosTable.jsx` - CoS/EoT events table
- `TableHeader.jsx` - Reusable header with sort/filter
- `DistrictTable.jsx` - District summary table

**`/charts` - Chart Components** (To be created)
- `SectorChart.jsx` - Physical vs Financial bar chart
- `StatusChart.jsx` - Project status donut/pie chart
- `FinancialChart.jsx` - Financial tracking charts

**`BuidcoDashboard.jsx` - Main Dashboard Component** (To be created)
- Central component that orchestrates all tabs
- Manages global state and navigation
- Renders the main UI structure

#### `/src/data` - Static Data

**`sectors.js`** - Sector definitions
```javascript
export const SECTORS = [
  { sector_code: "WATER", sector_name: "Water Supply", ... },
  // ... 11 sectors total
]
```

**`projects.js`** - Project dataset
```javascript
export const PROJECTS = [
  { project_id: 1, project_name: "...", ... },
  // ... 75 projects
]
```

**`managementFlags.js`** - Management action flags
```javascript
export const MANAGEMENT_FLAGS = [
  { flag_id: 1, severity: "CRITICAL", ... },
  // ... flags for urgent issues
]
```

**`cosEotData.js`** - Change of Scope and EoT events
```javascript
export const COS_EOT_DATA = [
  { project_id: 1, cos_number: "CoS-01", ... },
  // ... cost variations and time extensions
]
```

#### `/src/hooks` - Custom React Hooks

**`useTableControls.js`**
- `useTableControls(data, searchFields)` - Sorting, filtering, searching
- `useModalState()` - Modal open/close management
- `useLiveClock()` - Real-time clock
- `useFilterDropdown()` - Filter dropdown state

#### `/src/config` - Configuration

**`theme.js` - Design System**
```javascript
export const COLORS = { ... }          // 30+ color tokens
export const PHASE_COLORS = { ... }    // Project phase colors
export const SEVERITY_COLORS = { ... } // Severity mapping
export const THEME = { ... }           // Typography, spacing, shadows
```

**`constants.js` - Application Constants**
```javascript
export const PROJECT_PHASES = [...]
export const DISTRICTS = [...]
export const ROLE_PERMISSIONS = {...}
export const PROJECT_STATUSES = [...]
export const CoS_CATEGORIES = [...]
export const SEVERITY_LEVELS = [...]
```

#### `/src/utils` - Utility Functions

**`formatters.js` - Data Formatting**
- `formatCrores(value)` - Format to crores with ₹
- `formatLakhs(value)` - Format to lakhs with ₹
- `formatDate(dateString)` - Format dates
- `getCurrentTimeString()` - Get HH:MM:SS
- `getCurrentDateString()` - Get formatted date
- `searchProjects(projects, query, fields)` - Multi-field search
- `filterProjects(projects, filters)` - Advanced filtering
- `sortBy(array, field, direction)` - Array sorting
- `groupBy(array, field)` - Group by key
- `calculateAggregates(projects)` - Calculate stats
- `truncateText(text, length)` - Truncate strings
- `getPercentageColor(value)` - Color coding
- `getStatusStyle(status)` - Status styling

### Root Level Files

**`index.html`** - HTML entry point
- Meta tags for SEO
- Root div for React mounting
- Script reference to main.jsx

**`package.json`** - Dependencies and scripts
```json
{
  "scripts": {
    "dev": "vite",           // Start dev server
    "build": "vite build",   // Production build
    "preview": "vite preview", // Preview production
    "lint": "eslint src --ext js,jsx"
  }
}
```

**`vite.config.js`** - Vite build tool configuration
- React plugin setup
- Development server config
- Build output settings

**`tailwind.config.js`** - Tailwind CSS configuration
- Custom colors and spacing
- Font families
- Shadow definitions

**`postcss.config.js`** - PostCSS plugin configuration
- Tailwind CSS processing
- Autoprefixer for vendor prefixes

**`.eslintrc.json`** - ESLint linting rules
- React and JSX support
- Code quality rules

**`.gitignore`** - Git ignore patterns
- node_modules, dist, build
- Environment files, logs
- IDE and OS files

**`.env.example`** - Environment variable template
- API endpoints
- Feature flags
- Analytics settings

**`README.md`** - Main documentation

---

## Data Flow Architecture

```
┌─────────────────────────────────────────┐
│     BuidcoDashboard (Main Component)    │
├─────────────────────────────────────────┤
│  State: activeTab, projects, filters... │
└────────┬────────────────────────────────┘
         │
    ┌────┴──────────┬──────────────┬────────────────┬──────────────┐
    │               │              │                │              │
┌───▼─────┐  ┌─────▼────┐  ┌─────▼────┐  ┌────────▼──┐  ┌──────▼─────┐
│ Overview │  │ Sectors  │  │ Projects │  │ Districts │  │ Mgmt Flags │
│   Tab    │  │   Tab    │  │   Tab    │  │    Tab    │  │    Tab     │
└──────────┘  └──────────┘  └──────────┘  └───────────┘  └────────────┘
    │              │              │              │             │
    └──────────────┴──────────────┴──────────────┴─────────────┘
                          │
              ┌───────────┴──────────────┐
              │                          │
         ┌────▼─────┐           ┌───────▼────┐
         │Components│           │   Hooks    │
         │ & Tables │           │  & Utils   │
         └──────────┘           └────────────┘
              │                          │
              └──────────────┬───────────┘
                             │
                    ┌────────▼─────────┐
                    │  Config & Data   │
                    │  (theme, consts) │
                    └──────────────────┘
```

---

## Component Dependency Tree

```
BuidcoDashboard
├── Header
│   ├── Logo
│   ├── Search (Global)
│   └── LiveClock
├── OverviewTab
│   ├── KpiCard (x3)
│   ├── SectorChart (Recharts)
│   └── StatusChart (Recharts)
├── SectorsTab
│   └── SectorCard (x11)
│       ├── Badge
│       └── ProgressBar
├── ProjectsTab
│   ├── ProjectsTable
│   │   ├── TableHeader (Sortable)
│   │   └── ProjectRow (x75)
│   │       ├── Badge
│   │       ├── Pill
│   │       └── ProgressBar
│   └── ProjectDetailModal
│       └── CoS Timeline
├── DistrictsTab
│   ├── DistrictCard (x15)
│   │   └── ProgressBar
│   └── DistrictTable
├── CosEotTab
│   ├── KpiCard (x4)
│   └── CosTable
│       └── TableHeader
├── MgmtActionTab
│   ├── ManagementFlagCard
│   └── FlagDetailsModal
└── Modals
    ├── ProjectFormModal
    ├── ProjectDetailModal
    └── ManagementActionModal
```

---

## Styling Strategy

### Three-Layer Approach

1. **Global Styles** (`src/index.css`)
   - Font imports
   - Reset and base styles
   - Utility classes
   - CSS variables (optional)

2. **Component Styles** (Inline + Theme)
   - Theme tokens imported from `config/theme.js`
   - Inline styles for dynamic values
   - Tailwind for responsive design

3. **Tailwind CSS** (Optional)
   - Utility classes for rapid development
   - Custom theme extensions in `tailwind.config.js`
   - Only compile what's used

### Color System
All colors defined in `config/theme.js`:
- Reusable throughout app
- Consistent design language
- Easy theming for future

---

## Performance Optimization Tips

1. **Code Splitting**
   - Use React.lazy() for tabs
   - Dynamic imports for large components

2. **Memoization**
   - useMemo for complex calculations
   - React.memo for pure components

3. **Data Loading**
   - Implement pagination for large tables
   - Virtual scrolling for long lists

4. **Bundle Size**
   - Tree-shake unused code
   - Dynamic imports
   - Lazy load charts

---

## Next Steps for Development

1. **Create missing tab components**
   - OverviewTab.jsx
   - SectorsTab.jsx
   - ProjectsTab.jsx
   - DistrictsTab.jsx
   - CosEotTab.jsx
   - MgmtActionTab.jsx

2. **Create table components**
   - ProjectsTable.jsx
   - CosTable.jsx
   - TableHeader.jsx

3. **Create data file**
   - Move data from BuidcoDashboard_v5.jsx

4. **Create chart components**
   - Wrap Recharts charts

5. **Integrate with backend**
   - Create API service layer
   - Replace static data with API calls
   - Add error handling

6. **Add state management**
   - Consider Redux or Zustand
   - Centralize app state

7. **Add authentication**
   - Implement OAuth or JWT
   - Role-based access control

---

Last Updated: April 19, 2026
