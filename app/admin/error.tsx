'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => { console.error('[AdminError]', error) }, [error])

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-96 gap-5 p-8 text-center">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ backgroundColor: 'oklch(0.50 0.22 24 / 0.10)' }}>
        <AlertTriangle className="h-7 w-7" style={{ color: 'oklch(0.50 0.22 24)' }} />
      </div>
      <div>
        <h2 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.6rem', letterSpacing: '0.04em', color: 'oklch(0.20 0.03 30)' }}>
          Error al cargar
        </h2>
        <p className="text-sm mt-1" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
          {error.message || 'Algo salió mal. Intenta de nuevo.'}
        </p>
      </div>
      <button onClick={reset}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
        style={{ backgroundColor: 'oklch(0.50 0.22 24)', color: 'oklch(0.97 0.012 82)', fontFamily: 'var(--font-dm-sans)' }}>
        <RefreshCw className="h-4 w-4" /> Reintentar
      </button>
    </div>
  )
}
