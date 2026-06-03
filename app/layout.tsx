import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { TourProvider } from '@/lib/tourStore'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Omweg — Laat AI bepalen waar je uitkomt',
  description: 'Een AI-roadtripspel voor in de auto. Passagiers krijgen verrassende opdrachten. De bestuurder rijdt altijd veilig.',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#302b63',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={inter.variable}>
      <body>
        <TourProvider>
          <main className="min-h-screen max-w-md mx-auto px-4 safe-area-top safe-area-bottom">
            {children}
          </main>
        </TourProvider>
      </body>
    </html>
  )
}
