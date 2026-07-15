'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, ShoppingBag } from 'lucide-react'
import Link from 'next/link'

const RED = 'oklch(0.50 0.22 24)'

export default function TiendaError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => { console.error('[TiendaError]', error) }, [error])

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center gap-6">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ backgroundColor: `${RED}12`, border: `2px dashed ${RED}40` }}>
        <AlertTriangle className="h-8 w-8" style={{ color: RED }} />
      </div>

      <div>
        <h2 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.8rem', letterSpacing: '0.04em', color: 'oklch(0.20 0.03 30)', lineHeight: 1 }}>
          Algo salió mal
        </h2>
        <p className="mt-2 text-sm max-w-xs" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
          No pudimos cargar esta sección. Intenta de nuevo o regresa al catálogo.
        </p>
      </div>

      <div className="flex gap-3 flex-wrap justify-center">
        <button onClick={reset}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold active:scale-95"
          style={{ backgroundColor: RED, color: 'oklch(0.97 0.012 82)', fontFamily: 'var(--font-dm-sans)' }}>
          <RefreshCw className="h-4 w-4" /> Reintentar
        </button>
        <Link href="/catalogo">
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold active:scale-95"
            style={{ backgroundColor: 'oklch(1 0 0)', color: 'oklch(0.35 0.02 40)', border: '1px solid oklch(0.88 0.03 70)', fontFamily: 'var(--font-dm-sans)' }}>
            <ShoppingBag className="h-4 w-4" /> Ver catálogo
          </button>
        </Link>
      </div>
    </div>
  )
}
