import type { Metadata, Viewport } from 'next'
import { Bebas_Neue, DM_Sans } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import BottomNav from '@/components/layout/BottomNav'
import HorarioBanner from '@/components/layout/HorarioBanner'
import VerificacionEdad from '@/components/layout/VerificacionEdad'
import PwaInit from '@/components/layout/PwaInit'
import CartDrawer from '@/components/tienda/CartDrawer'
import { Toaster } from '@/components/ui/sonner'

const bebasNeue = Bebas_Neue({
  weight: '400',
  variable: '--font-bebas',
  subsets: ['latin'],
  display: 'swap',
})

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Pide Pisto — Alcohol a domicilio',
  description: 'Cerveza, vinos y destilados a domicilio en Chalco e Ixtapaluca, Estado de México.',
  applicationName: 'Pide Pisto',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'Pide Pisto',
    statusBarStyle: 'default',
  },
  formatDetection: { telephone: false },
  icons: {
    icon:  [{ url: '/icons/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icons/icon-192.png', sizes: '192x192' }],
  },
  openGraph: {
    type: 'website',
    siteName: 'Pide Pisto',
    title: 'Pide Pisto — Alcohol a domicilio',
    description: 'Cerveza, vinos y destilados a domicilio en Chalco e Ixtapaluca, Estado de México.',
  },
}

export const viewport: Viewport = {
  themeColor: '#8B1A1A',
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${bebasNeue.variable} ${dmSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-canvas text-ink">
        <PwaInit />
        <Navbar />
        <main className="flex-1 pt-14">
          <HorarioBanner />
          {children}
        </main>
        <BottomNav />
        <CartDrawer />
        <Toaster richColors position="top-right" />
        <VerificacionEdad />
      </body>
    </html>
  )
}
