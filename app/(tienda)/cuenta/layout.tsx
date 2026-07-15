'use client'

import { useRouter, usePathname } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import CuentaSidebar from '@/components/tienda/CuentaSidebar'

const BG = 'oklch(0.97 0.012 82)'

const TITULOS: Record<string, string> = {
  '/cuenta':              'Cuenta',
  '/cuenta/editar':       'Editar perfil',
  '/cuenta/direcciones':  'Mis direcciones',
  '/cuenta/pedidos':      'Mis pedidos',
  '/cuenta/cupones':      'Cupones',
  '/cuenta/notificaciones': 'Notificaciones',
  '/cuenta/loyalty':      'Beneficios',
  '/cuenta/metodos-pago': 'Métodos de pago',
}

export default function CuentaLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const esPrincipal = pathname === '/cuenta'
  const titulo = TITULOS[pathname] ?? 'Cuenta'

  return (
    <div style={{ backgroundColor: BG, minHeight: '100vh' }}>
      {/* Header mobile */}
      <div className="md:hidden flex items-center gap-2 px-4 py-3 border-b sticky top-14 z-20"
        style={{ backgroundColor: BG, borderColor: 'oklch(0.88 0.03 70)' }}>
        {!esPrincipal && (
          <button onClick={() => router.back()}
            className="p-1.5 rounded-xl -ml-1"
            style={{ color: 'oklch(0.50 0.22 24)' }}>
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.3rem', letterSpacing: '0.04em', color: 'oklch(0.20 0.03 30)' }}>
          {titulo}
        </span>
      </div>

      <div className="md:max-w-5xl md:mx-auto">
        <div className="md:grid md:grid-cols-[280px_1fr] md:gap-8 md:px-4 md:py-6 md:pb-10">
          <div className="hidden md:block md:sticky md:top-20">
            <CuentaSidebar />
          </div>
          <div>{children}</div>
        </div>
      </div>
    </div>
  )
}
