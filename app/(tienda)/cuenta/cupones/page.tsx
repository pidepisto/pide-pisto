'use client'
import Link from 'next/link'
import { ChevronLeft, Gift, Clock } from 'lucide-react'

const RED = 'oklch(0.50 0.22 24)'
const BG  = 'oklch(0.97 0.012 82)'
const YEL = 'oklch(0.76 0.14 80)'

export default function CuponesPage() {
  return (
    <div style={{ backgroundColor: BG, minHeight: '100vh' }}>
      <div className="flex items-center gap-3 px-4 pt-5 pb-4">
        <Link href="/cuenta">
          <button className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ border: '1px solid oklch(0.88 0.03 70)', backgroundColor: 'oklch(1 0 0)' }}>
            <ChevronLeft className="h-4 w-4" style={{ color: 'oklch(0.35 0.03 30)' }} />
          </button>
        </Link>
        <h1 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.8rem', letterSpacing: '0.05em', color: 'oklch(0.2 0.03 30)' }}>
          Cupones
        </h1>
      </div>

      <div className="flex flex-col items-center justify-center px-8 py-24 gap-6 max-w-sm mx-auto text-center">
        <div className="w-24 h-24 rounded-3xl flex items-center justify-center"
          style={{ backgroundColor: `${RED}15`, border: `2px dashed ${RED}` }}>
          <Gift className="h-10 w-10" style={{ color: RED }} />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-3"
            style={{ backgroundColor: YEL, color: 'oklch(0.2 0.03 30)' }}>
            <Clock className="h-3.5 w-3.5" />
            <span className="text-xs font-bold" style={{ fontFamily: 'var(--font-dm-sans)' }}>Próximamente</span>
          </div>
          <p style={{ fontFamily: 'var(--font-bebas)', fontSize: '2rem', letterSpacing: '0.04em', color: 'oklch(0.2 0.03 30)', lineHeight: 1.1 }}>
            Tus cupones de descuento
          </p>
          <p className="text-sm mt-2" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
            Aquí podrás ver y aplicar tus cupones de descuento en cada pedido. Estamos trabajando en esto.
          </p>
        </div>

        <Link href="/catalogo">
          <button className="px-6 py-3 rounded-2xl text-sm font-semibold"
            style={{ backgroundColor: RED, color: 'oklch(0.97 0.012 82)', fontFamily: 'var(--font-dm-sans)' }}>
            Ir al catálogo
          </button>
        </Link>
      </div>
    </div>
  )
}
