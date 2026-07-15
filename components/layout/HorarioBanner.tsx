'use client'

import { usePathname } from 'next/navigation'
import { Clock } from 'lucide-react'
import { useConfiguracion } from '@/lib/hooks/useConfiguracion'

export default function HorarioBanner() {
  const pathname = usePathname()
  const { config, cargando, abierto, horaAperturaTexto } = useConfiguracion()

  // No mostrar en admin
  if (pathname.startsWith('/admin')) return null
  if (cargando) return null

  return (
    <div
      className="flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-semibold"
      style={{
        backgroundColor: abierto ? 'oklch(0.55 0.18 145 / 0.12)' : 'oklch(0.50 0.22 24 / 0.10)',
        color: abierto ? 'oklch(0.35 0.14 145)' : 'oklch(0.45 0.18 24)',
        fontFamily: 'var(--font-dm-sans)',
        borderBottom: `1px solid ${abierto ? 'oklch(0.55 0.18 145 / 0.2)' : 'oklch(0.50 0.22 24 / 0.18)'}`,
      }}
    >
      <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
        {abierto && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
            style={{ backgroundColor: 'oklch(0.55 0.18 145)' }} />
        )}
        <span className="relative inline-flex rounded-full h-1.5 w-1.5"
          style={{ backgroundColor: abierto ? 'oklch(0.55 0.18 145)' : 'oklch(0.50 0.22 24)' }} />
      </span>

      {abierto ? (
        <span>
          Abiertos · Entrega en ~{config.tiempo_entrega_min} min
        </span>
      ) : (
        <span>
          Cerrado ahora · Abrimos a las {horaAperturaTexto}
        </span>
      )}

      <Clock className="h-3 w-3 opacity-60 flex-shrink-0" />
    </div>
  )
}
