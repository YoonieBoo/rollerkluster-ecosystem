import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Providers } from './providers'
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'RollerKluster | Creator Ecosystem Platform',
  description: 'A governed creator ecosystem for managing creator capability, brand campaign demand, readiness training, structured engagements, and quality oversight.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'RollerKluster',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      {
        url: '/logo%20pic.PNG',
        type: 'image/png',
      },
    ],
    apple: '/logo%20pic.PNG',
  },
}

export const viewport: Viewport = {
  themeColor: '#bf6be8',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased bg-background text-foreground">
        <Providers>{children}</Providers>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
