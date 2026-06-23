'use client'
import Link from 'next/link'
import { ChevronLeft, Star, Clock } from 'lucide-react'

const RED = 'oklch(0.50 0.22 24)'
const BG  = 'oklch(0.97 0.012 82)'
const YEL = 'oklch(0.76 0.14 80)'
const GRN = 'oklch(0.55 0.18 145)'

export default function LoyaltyPage() {
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
          Loyalty
        </h1>
      </div>

      <div className="flex flex-col items-center justify-center px-8 py-20 gap-6 max-w-sm mx-auto text-center">
        <div className="w-24 h-24 rounded-3xl flex items-center justify-center"
          style={{ backgroundColor: `${YEL}30`, border: `2px dashed ${YEL}` }}>
          <Star className="h-10 w-10" style={{ color: 'oklch(0.60 0.14 75)', fill: `${YEL}80` }} />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-3"
            style={{ backgroundColor: YEL, color: 'oklch(0.2 0.03 30)' }}>
            <Clock className="h-3.5 w-3.5" />
            <span className="text-xs font-bold" style={{ fontFamily: 'var(--font-dm-sans)' }}>Próximamente</span>
          </div>
          <p style={{ fontFamily: 'var(--font-bebas)', fontSize: '2rem', letterSpacing: '0.04em', color: 'oklch(0.2 0.03 30)', lineHeight: 1.1 }}>
            Programa de puntos Pide Pisto
          </p>
          <p className="text-sm mt-2" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
            Gana puntos en cada pedido y canjéalos por descuentos y productos gratis. Muy pronto disponible.
          </p>
        </div>

        {/* preview de beneficios */}
        <div className="w-full rounded-2xl p-4 flex flex-col gap-3"
          style={{ backgroundColor: 'oklch(1 0 0)', border: '1px solid oklch(0.90 0.02 75)' }}>
          {[
            { pts: '1 punto', desc: 'por cada $10 en compras' },
            { pts: '50 puntos', desc: '= $20 de descuento' },
            { pts: 'Doble puntos', desc: 'en tus productos favoritos' },
          ].map(({ pts, desc }) => (
            <div key={pts} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${GRN}15` }}>
                <Star className="h-4 w-4" style={{ color: GRN }} />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold" style={{ color: 'oklch(0.2 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>{pts}</p>
                <p className="text-xs" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
