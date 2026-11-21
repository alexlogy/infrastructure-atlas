import React from 'react'
import './styles.css'

export const metadata = {
  title: 'Infrastructure Atlas',
  description: 'An open-source, CMS-driven portfolio platform.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <main id="main">{children}</main>
      </body>
    </html>
  )
}
