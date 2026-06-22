export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#f8f9fa', color: '#111111', fontFamily: 'system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
