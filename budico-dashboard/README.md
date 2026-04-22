# BUIDCO Dashboard - Frontend Project

**Bihar Urban Infrastructure Development Corporation (BUIDCO) - Real-time Project Monitoring System**

## 📋 Project Overview

A comprehensive React-based dashboard for monitoring 75+ urban infrastructure projects across 11 sectors and 15 districts in Bihar. Built with React 18, Recharts for data visualization, and Tailwind CSS for styling.

### Key Features
- ✅ Real-time project status monitoring
- ✅ Interactive sector & district analytics  
- ✅ Advanced sorting, filtering, and search
- ✅ Role-based access control (MD, DC, PMU Engineer, Finance)
- ✅ CoS/EoT tracking and management
- ✅ Pre-monsoon risk assessment
- ✅ Financial utilization tracking
- ✅ Responsive design with live clock

---

## 📁 Project Structure

```
budico-dashboard/
├── public/                          # Static assets
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── common/                  # Reusable UI primitives
│   │   │   ├── Primitives.jsx       # Badge, Pill, Logo, KpiCard, Modal, etc.
│   │   │   ├── Button.jsx           # Custom button component
│   │   │   └── Divider.jsx          # Separator component
│   │   ├── layout/                  # Layout components
│   │   │   ├── Header.jsx           # Top navigation
│   │   │   ├── Sidebar.jsx          # Sidebar navigation (future)
│   │   │   └── MainLayout.jsx       # Main wrapper layout
│   │   ├── tabs/                    # Tab-based views
│   │   │   ├── OverviewTab.jsx      # KPI overview
│   │   │   ├── SectorsTab.jsx       # Sector analysis
│   │   │   ├── ProjectsTab.jsx      # Projects listing
│   │   │   ├── DistrictsTab.jsx     # District overview
│   │   │   ├── CosEotTab.jsx        # Change of Scope tracking
│   │   │   └── MgmtActionTab.jsx    # Management flags
│   │   ├── modals/                  # Modal dialogs
│   │   │   ├── ProjectDetailModal.jsx
│   │   │   ├── ProjectFormModal.jsx
│   │   │   └── ManagementFlagModal.jsx
│   │   ├── tables/                  # Table components
│   │   │   ├── ProjectsTable.jsx    # Main projects table
│   │   │   ├── CosTable.jsx         # CoS/EoT table
│   │   │   └── TableHeader.jsx      # Reusable table header with sort/filter
│   │   ├── charts/                  # Recharts wrappers
│   │   │   ├── SectorChart.jsx      # Physical vs Financial bar chart
│   │   │   ├── StatusChart.jsx      # Project status donut chart
│   │   │   └── FinancialChart.jsx   # Financial tracking charts
│   │   └── BuidcoDashboard.jsx      # Main dashboard component
│   ├── data/
│   │   ├── sectors.js               # Sector definitions
│   │   ├── projects.js              # Project dataset
│   │   ├── managementFlags.js        # Management action flags
│   │   └── cosEotData.js             # Change of scope events
│   ├── hooks/
│   │   ├── useTableControls.js       # Sorting/filtering/searching hook
│   │   ├── useLiveClock.js           # Live clock hook
│   │   └── useModalState.js          # Modal management hook
│   ├── config/
│   │   ├── theme.js                  # Design tokens & colors
│   │   └── constants.js              # App constants
│   ├── utils/
│   │   ├── formatters.js             # Formatting utilities (currency, date, etc.)
│   │   └── helpers.js                # Other helper functions
│   ├── App.jsx                       # Main app component
│   ├── main.jsx                      # React entry point
│   └── index.css                     # Global styles
├── index.html                        # HTML entry point
├── package.json                      # Dependencies & scripts
├── vite.config.js                    # Vite configuration
├── tailwind.config.js                # Tailwind configuration (optional)
├── postcss.config.js                 # PostCSS config (optional)
└── README.md                         # This file
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm 7+
- Git (for version control)

### Installation

1. **Clone/Navigate to the project:**
```bash
cd budico-dashboard
```

2. **Install all dependencies:**
```bash
npm install
```

This will install:
- `react` & `react-dom` - React framework
- `recharts` - Data visualization library
- `tailwindcss` - Utility-first CSS framework
- `vite` - Build tool
- Development tools (ESLint, Autoprefixer, etc.)

### Development

3. **Start the development server:**
```bash
npm run dev
```

The dashboard will open at `http://localhost:3000` with hot module reloading (HMR).

### Build for Production

4. **Build optimized production bundle:**
```bash
npm run build
```

Output will be in the `dist/` directory.

5. **Preview production build:**
```bash
npm run preview
```

---

## 📦 Dependencies

### Core Dependencies
- **react** (^18.2.0) - React library
- **react-dom** (^18.2.0) - React DOM rendering
- **recharts** (^2.10.3) - Composable charting library

### Development Dependencies
- **vite** (^5.0.8) - Next-generation frontend build tool
- **@vitejs/plugin-react** (^4.2.1) - React support for Vite
- **tailwindcss** (^3.3.6) - Utility-first CSS framework
- **postcss** (^8.4.32) - CSS transformation
- **autoprefixer** (^10.4.16) - CSS vendor prefixing
- **eslint** (^8.55.0) - JavaScript linter
- **eslint-plugin-react** (^7.33.2) - React ESLint plugin

---

## 🎨 Design System

### Colors
All colors are defined in `src/config/theme.js`:
- **Primary**: Navy (#0D2137)
- **Semantic**: Blue, Teal, Green, Amber, Red, Purple
- **Neutral**: Gray scale for text and backgrounds

### Typography
- **Display**: DM Serif Display (headers)
- **Body**: DM Sans (main text)
- **Code**: DM Mono (monospace)

### Component Primitives
- **Badge**: Small status labels
- **Pill**: Rounded badges with borders
- **KpiCard**: Key metric cards with hover effects
- **Modal**: Overlay dialogs
- **ProgressBar**: Visual progress indicators

---

## 📊 Data Structure

### Projects
75 projects across sectors with properties:
```javascript
{
  project_id: 1,
  project_code: "BU/WATER/PAT/2021/07",
  project_name: "Patna 24×7 Water Supply",
  sector_code: "WATER",
  sector_name: "Water Supply",
  district: "Patna",
  ulb_name: "Patna",
  contractor_name: "L&T Construction",
  current_sanctioned_cost: 91000,
  financial_progress_pct: 71.2,
  actual_physical_pct: 74,
  scheduled_physical_pct: 70,
  delay_days: 0,
  phase: "Construction",
  status: "IN_PROGRESS",
  latitude: 25.5941,
  longitude: 85.1376,
  // ... more properties
}
```

### Sectors (11 Total)
- Water Supply
- Sewerage & STP
- Storm Drainage
- Solid Waste Management
- Urban Transport
- Housing
- Riverfront Development
- Street Lighting
- Markets
- Beautification
- Roads & Bridges

### Districts (15 Total)
Patna, Muzaffarpur, Gaya, Bhagalpur, Darbhanga, Begusarai, Purnia, Ara, Samastipur, Munger, Chapra, Sitamarhi, Madhubani, Supaul, Saharsa

---

## 🔧 Component Architecture

### Custom Hooks
- **useTableControls()** - Manages sorting, filtering, searching
- **useLiveClock()** - Real-time clock and date
- **useModalState()** - Modal open/close and form state

### Utilities
- **formatCrores()** - Format large currency values
- **formatLakhs()** - Format currency in lakhs
- **getPercentageColor()** - Color coding based on percentage
- **searchProjects()** - Multi-field search
- **filterProjects()** - Advanced filtering

---

## 👥 Role-Based Access Control

```javascript
MD:           { can_edit: true,  can_add: true  }
DC:           { can_edit: false, can_add: false }
PMU_ENGINEER: { can_edit: true,  can_add: false }
FINANCE:      { can_edit: false, can_add: false }
READ_ONLY:    { can_edit: false, can_add: false }
```

---

## 📱 Responsive Design

The dashboard is fully responsive with:
- Mobile-friendly tables (horizontal scroll)
- Flexible grid layouts
- Touch-optimized components
- Breakpoint-aware design

---

## 🐛 Troubleshooting

### Port already in use
```bash
# Use custom port
npm run dev -- --port 3001
```

### Module not found errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Vite build issues
```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run build
```

---

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [Recharts Documentation](https://recharts.org)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)

---

## 📝 Notes

1. **Font Loading**: Google Fonts are loaded via CSS @import in index.css
2. **Colors**: No CSS variables needed - all colors in theme.js
3. **Styling**: Mix of inline styles and CSS classes for maximum flexibility
4. **Data**: Initial data is in src/data/ - connect to API when ready
5. **State Management**: Using React hooks - consider Redux/Zustand for complex state

---

## ✅ Next Steps

1. ✅ Install dependencies: `npm install`
2. ⏳ Move original BuidcoDashboard component to `src/components/BuidcoDashboard.jsx`
3. ⏳ Refactor into smaller components (tabs, tables, charts)
4. ⏳ Connect to backend API endpoints
5. ⏳ Add TypeScript (optional but recommended)
6. ⏳ Implement state management (Redux/Zustand)
7. ⏳ Add unit tests (Jest + React Testing Library)
8. ⏳ Set up CI/CD pipeline

---

## 📄 License

Internal - Bihar Urban Infrastructure Development Corporation

---

**Last Updated**: April 19, 2026  
**Version**: 1.0.0  
**Maintainer**: Development Team
