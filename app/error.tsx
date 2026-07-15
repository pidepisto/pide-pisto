'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

const RED = 'oklch(0.50 0.22 24)'
const BG  = 'oklch(0.97 0.012 82)'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // En producción podrías enviar a Sentry aquí
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-6"
      style={{ backgroundColor: BG }}>

      <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
        style={{ backgroundColor: `${RED}12`, border: `2px dashed ${RED}40` }}>
        <AlertTriangle className="h-9 w-9" style={{ color: RED }} />
      </div>

      <div>
        <h1 style={{ fontFamily: 'var(--font-bebas)', fontSize: '2.2rem', letterSpacing: '0.04em', color: 'oklch(0.20 0.03 30)', lineHeight: 1 }}>
          Algo salió mal
        </h1>
        <p className="mt-2 text-sm max-w-xs" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
          Ocurrió un error inesperado. Intenta recargar la página o vuelve al inicio.
        </p>
        {error.digest && (
          <p className="mt-2 text-[11px]" style={{ color: 'oklch(0.70 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
            Código: {error.digest}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <button onClick={reset}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all active:scale-95"
          style={{ backgroundColor: RED, color: 'oklch(0.97 0.012 82)', fontFamily: 'var(--font-dm-sans)' }}>
          <RefreshCw className="h-4 w-4" /> Reintentar
        </button>
        <Link href="/">
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all active:scale-95"
            style={{ backgroundColor: 'oklch(1 0 0)', color: 'oklch(0.35 0.02 40)', border: '1px solid oklch(0.88 0.03 70)', fontFamily: 'var(--font-dm-sans)' }}>
            <Home className="h-4 w-4" /> Inicio
          </button>
        </Link>
      </div>
    </div>
  )
}
