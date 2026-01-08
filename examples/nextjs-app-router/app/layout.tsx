import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Next.js App Router Example',
  description: 'React Code Finder with Next.js App Router',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
