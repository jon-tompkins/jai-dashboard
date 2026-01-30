export const metadata = {
  title: 'Jai Dashboard',
  description: 'Portfolio & Research Dashboard',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
        <style>{`
          /* CSS Variables for theming */
          :root {
            --bg-primary: #0d1117;
            --bg-secondary: #161b22;
            --bg-tertiary: #21262d;
            --border-color: #30363d;
            --border-active: #58a6ff;
            --text-primary: #e6edf3;
            --text-secondary: #8b949e;
            --green: #3fb950;
            --red: #f85149;
            --blue: #58a6ff;
            --yellow: #d29922;
            --purple: #8957e5;
            --pink: #f778ba;
            
            --spacing-xs: 4px;
            --spacing-sm: 8px;
            --spacing-md: 12px;
            --spacing-lg: 16px;
            --spacing-xl: 20px;
            --spacing-2xl: 24px;
            
            --radius-sm: 4px;
            --radius-md: 6px;
            --radius-lg: 8px;
            
            --tap-target: 44px;
          }
          
          /* Reset & Base */
          * {
            box-sizing: border-box;
          }
          
          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          
          /* Touch-friendly tap targets */
          button, .clickable, [role="button"] {
            min-height: var(--tap-target);
            min-width: var(--tap-target);
          }
          
          /* Responsive grid utilities */
          .grid-responsive {
            display: grid;
            gap: var(--spacing-lg);
          }
          
          .grid-2col {
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          }
          
          .grid-sidebar {
            grid-template-columns: 1fr;
          }
          
          /* Collapsible sections */
          .collapsible-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            padding: var(--spacing-md);
            min-height: var(--tap-target);
            -webkit-tap-highlight-color: transparent;
          }
          
          .collapsible-content {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease-out;
          }
          
          .collapsible-content.expanded {
            max-height: 2000px;
          }
          
          /* Mobile-first responsive table */
          .table-responsive {
            width: 100%;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
          
          .table-responsive table {
            min-width: 600px;
          }
          
          /* Card stacking on mobile */
          .card-stack {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-lg);
          }
          
          /* Tab bar - horizontal scroll on mobile */
          .tabs-container {
            display: flex;
            gap: var(--spacing-sm);
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            padding-bottom: var(--spacing-sm);
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          
          .tabs-container::-webkit-scrollbar {
            display: none;
          }
          
          .tab-item {
            flex-shrink: 0;
            min-height: var(--tap-target);
            padding: var(--spacing-sm) var(--spacing-lg);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          /* Header responsive */
          .header-responsive {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-md);
          }
          
          .header-actions {
            display: flex;
            flex-wrap: wrap;
            gap: var(--spacing-sm);
            align-items: center;
          }
          
          /* Input touch-friendly */
          input, select, textarea {
            font-size: 16px; /* Prevents zoom on iOS */
            min-height: var(--tap-target);
          }
          
          /* Chart container */
          .chart-container {
            width: 100%;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
          
          .chart-container svg {
            min-width: 500px;
          }
          
          /* Legend wrap */
          .legend-wrap {
            display: flex;
            flex-wrap: wrap;
            gap: var(--spacing-sm);
          }
          
          /* Review grid */
          .review-grid {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-lg);
          }
          
          .review-file-list {
            max-height: none;
          }
          
          .review-content {
            min-height: auto;
          }
          
          /* Research grid */
          .research-grid {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-lg);
          }
          
          /* Summary grid */
          .summary-grid {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-lg);
            align-items: center;
          }
          
          /* Two-panel layout */
          .two-panel {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-lg);
          }
          
          /* Pie chart centering on mobile */
          .pie-container {
            display: flex;
            justify-content: center;
          }
          
          /* Form grid */
          .form-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: var(--spacing-md);
          }
          
          /* Sticky header for content viewer */
          .sticky-header {
            position: sticky;
            top: 0;
            background: var(--bg-secondary);
            z-index: 10;
            padding-bottom: var(--spacing-md);
            margin-bottom: var(--spacing-md);
            border-bottom: 1px solid var(--border-color);
          }
          
          /* Position breakdown in trade cards */
          .position-table {
            width: 100%;
          }
          
          /* Workout form responsive */
          .workout-form-fields {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: var(--spacing-md);
          }
          
          /* ============================================
             TABLET BREAKPOINT (768px+)
             ============================================ */
          @media (min-width: 768px) {
            .header-responsive {
              flex-direction: row;
              justify-content: space-between;
              align-items: center;
            }
            
            .grid-sidebar {
              grid-template-columns: 280px 1fr;
            }
            
            .review-grid {
              display: grid;
              grid-template-columns: minmax(200px, 280px) 1fr;
            }
            
            .review-file-list {
              max-height: 70vh;
              overflow-y: auto;
            }
            
            .review-content {
              min-height: 60vh;
              max-height: 80vh;
              overflow-y: auto;
            }
            
            .research-grid {
              display: grid;
              grid-template-columns: 280px 1fr;
            }
            
            .two-panel {
              display: grid;
              grid-template-columns: 320px 1fr;
            }
            
            .summary-grid {
              display: grid;
              grid-template-columns: 200px 1fr;
              align-items: start;
            }
            
            .form-grid {
              grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            }
          }
          
          /* ============================================
             DESKTOP BREAKPOINT (1024px+)
             ============================================ */
          @media (min-width: 1024px) {
            .grid-sidebar {
              grid-template-columns: 320px 1fr;
            }
          }
          
          /* ============================================
             MOBILE-SPECIFIC OVERRIDES (<768px)
             ============================================ */
          @media (max-width: 767px) {
            /* Stack everything vertically */
            .hide-mobile {
              display: none !important;
            }
            
            /* Full-width cards */
            .card-full-mobile {
              grid-column: 1 / -1 !important;
            }
            
            /* Smaller fonts on mobile */
            .big-number {
              font-size: 24px !important;
            }
            
            /* Table cells tighter */
            .table-compact td,
            .table-compact th {
              padding: 6px 4px !important;
              font-size: 12px !important;
            }
            
            /* Tags smaller */
            .tag-mobile {
              font-size: 10px !important;
              padding: 2px 6px !important;
            }
            
            /* Holdings table scrollable */
            .holdings-table-wrap {
              margin: 0 -12px;
              padding: 0 12px;
            }
            
            /* Progress bars stack */
            .progress-inline {
              flex-direction: column;
              align-items: flex-start !important;
              gap: 4px;
            }
            
            /* Trade cards - simpler layout */
            .trade-card-header {
              flex-direction: column;
              align-items: flex-start !important;
              gap: 8px;
            }
            
            /* Conviction dots inline */
            .conviction-mobile {
              display: flex;
              align-items: center;
              gap: 8px;
            }
            
            /* Filter dropdowns stack */
            .filters-mobile {
              flex-direction: column;
              width: 100%;
            }
            
            .filters-mobile select {
              width: 100%;
            }
          }
          
          /* ============================================
             SMALL MOBILE (<375px)
             ============================================ */
          @media (max-width: 375px) {
            .container-padding {
              padding: 12px !important;
            }
            
            h1 {
              font-size: 20px !important;
            }
            
            .tabs-container {
              gap: 4px;
            }
            
            .tab-item {
              padding: 8px 12px;
              font-size: 13px;
            }
          }
          
          /* Print styles */
          @media print {
            .no-print {
              display: none !important;
            }
          }
        `}</style>
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
