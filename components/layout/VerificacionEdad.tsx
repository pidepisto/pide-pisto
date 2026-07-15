'use client'

import { useEffect, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter, usePathname } from 'next/navigation'

const STORAGE_KEY  = 'pp-edad-verificada'
const TTL_DIAS     = 30
const RUTAS_EXCLUIDAS = ['/login', '/registro']

function estaVerificado(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return false
    const ts = parseInt(raw, 10)
    if (isNaN(ts)) return false
    const diasPasados = (Date.now() - ts) / 1000 / 60 / 60 / 24
    return diasPasados < TTL_DIAS
  } catch {
    return false
  }
}

export default function VerificacionEdad() {
  // 'checking' → 'required' → 'done'
  const [estado, setEstado] = useState<'checking' | 'required' | 'done'>('checking')
  const pathname = usePathname()
  const router   = useRouter()

  useEffect(() => {
    if (RUTAS_EXCLUIDAS.includes(pathname)) { setEstado('done'); return }
    setEstado(estaVerificado() ? 'done' : 'required')
  }, [pathname])

  const confirmar = () => {
    try { localStorage.setItem(STORAGE_KEY, String(Date.now())) } catch {}
    setEstado('done')
  }

  const rechazar = () => {
    router.push('https://www.gob.mx/salud')
  }

  // Mientras se verifica: bloquea interacción con overlay invisible
  if (estado === 'checking') {
    return (
      <div className="fixed inset-0 z-[100]"
        style={{ backgroundColor: 'oklch(0.97 0.012 82)' }} />
    )
  }

  if (estado === 'done') return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* Overlay con blur */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: 'oklch(0.13 0.03 22 / 0.85)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      />

      {/* Modal */}
      <div
        className="relative w-full sm:max-w-sm sm:mx-4 rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col items-center text-center"
        style={{
          backgroundColor: 'oklch(0.97 0.012 82)',
          border: '1px solid oklch(0.88 0.03 70)',
        }}
      >
        {/* Franja roja superior */}
        <div
          className="w-full px-6 pt-8 pb-6 flex flex-col items-center gap-4"
          style={{ backgroundColor: 'oklch(0.50 0.22 24)' }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: 'oklch(1 0 0 / 0.15)' }}
          >
            <ShieldCheck className="h-8 w-8" style={{ color: 'oklch(0.97 0.012 82)' }} />
          </div>

          <div>
            <h2
              className="leading-none mb-2"
              style={{
                fontFamily: 'var(--font-bebas)',
                fontSize: '2.2rem',
                letterSpacing: '0.04em',
                color: 'oklch(0.97 0.012 82)',
              }}
            >
              Verificación de edad
            </h2>
            <p style={{ color: 'oklch(0.97 0.012 82 / 0.7)', fontFamily: 'var(--font-dm-sans)', fontSize: '0.9rem' }}>
              Este sitio vende bebidas alcohólicas
            </p>
          </div>

          {/* Pill zona */}
          <div
            className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{ backgroundColor: 'oklch(0.76 0.14 80)', color: 'oklch(0.2 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}
          >
            Chalco · Ixtapaluca, Estado de México
          </div>
        </div>

        {/* Contenido */}
        <div className="px-6 py-7 flex flex-col gap-5 w-full">
          <p
            className="leading-relaxed"
            style={{ color: 'oklch(0.35 0.03 30)', fontFamily: 'var(--font-dm-sans)', fontSize: '0.95rem' }}
          >
            Para continuar confirma que tienes{' '}
            <strong style={{ color: 'oklch(0.50 0.22 24)' }}>18 años o más</strong>.
            La venta de alcohol a menores de edad está prohibida por la ley.
          </p>

          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              onClick={confirmar}
              className="w-full font-bold border-0"
              style={{
                backgroundColor: 'oklch(0.50 0.22 24)',
                color: 'oklch(0.97 0.012 82)',
                fontFamily: 'var(--font-dm-sans)',
                fontSize: '1rem',
              }}
            >
              Sí, tengo 18 años o más
            </Button>

            <Button
              size="lg"
              variant="ghost"
              onClick={rechazar}
              className="w-full font-semibold"
              style={{
                color: 'oklch(0.60 0.02 40)',
                fontFamily: 'var(--font-dm-sans)',
                border: '1px solid oklch(0.88 0.03 70)',
              }}
            >
              No, soy menor de edad
            </Button>
          </div>

          <p
            className="text-xs leading-relaxed"
            style={{ color: 'oklch(0.70 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}
          >
            Al continuar aceptas nuestros términos de servicio y confirmas que el consumo de alcohol es legal en tu localidad.
          </p>
        </div>
      </div>
    </div>
  )
}
