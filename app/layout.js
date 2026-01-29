export const metadata = {
  title: 'Jai Dashboard',
  description: 'Portfolio & Research Dashboard',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <style>{`
          /* Mobile-first responsive styles */
          @media (max-width: 768px) {
            .review-grid {
              display: flex !important;
              flex-direction: column !important;
            }
            .review-file-list {
              max-height: none !important;
            }
            .review-content {
              min-height: auto !important;
            }
          }
        `}</style>
      </head>
      <body style={{ margin: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
