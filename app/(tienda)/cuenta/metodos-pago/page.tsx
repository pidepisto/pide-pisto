'use client'
import Link from 'next/link'
import { ChevronLeft, CreditCard, Clock, Smartphone, Banknote } from 'lucide-react'

const RED = 'oklch(0.50 0.22 24)'
const BG  = 'oklch(0.97 0.012 82)'
const YEL = 'oklch(0.76 0.14 80)'

export default function MetodosPagoPage() {
  return (
    <div style={{ backgroundColor: BG, minHeight: '100vh' }}>
      <div className="md:hidden flex items-center gap-3 px-4 pt-5 pb-4">
        <Link href="/cuenta">
          <button className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ border: '1px solid oklch(0.88 0.03 70)', backgroundColor: 'oklch(1 0 0)' }}>
            <ChevronLeft className="h-4 w-4" style={{ color: 'oklch(0.35 0.03 30)' }} />
          </button>
        </Link>
        <h1 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.8rem', letterSpacing: '0.05em', color: 'oklch(0.2 0.03 30)' }}>
          Métodos de pago
        </h1>
      </div>
      <h1 className="hidden md:block pb-5" style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.8rem', letterSpacing: '0.05em', color: 'oklch(0.2 0.03 30)' }}>
        Métodos de pago
      </h1>

      <div className="flex flex-col items-center justify-center px-8 py-16 gap-6 max-w-sm mx-auto text-center">
        <div className="w-24 h-24 rounded-3xl flex items-center justify-center"
          style={{ backgroundColor: `${RED}15`, border: `2px dashed ${RED}` }}>
          <CreditCard className="h-10 w-10" style={{ color: RED }} />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-3"
            style={{ backgroundColor: YEL, color: 'oklch(0.2 0.03 30)' }}>
            <Clock className="h-3.5 w-3.5" />
            <span className="text-xs font-bold" style={{ fontFamily: 'var(--font-dm-sans)' }}>Próximamente</span>
          </div>
          <p style={{ fontFamily: 'var(--font-bebas)', fontSize: '2rem', letterSpacing: '0.04em', color: 'oklch(0.2 0.03 30)', lineHeight: 1.1 }}>
            Pago en línea
          </p>
          <p className="text-sm mt-2" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
            Pronto podrás guardar tus tarjetas y pagar directo en la app.
          </p>
        </div>

        <div className="w-full rounded-2xl p-4 flex flex-col gap-3"
          style={{ backgroundColor: 'oklch(1 0 0)', border: '1px solid oklch(0.90 0.02 75)' }}>
          <p className="text-xs font-bold text-left mb-1" style={{ color: 'oklch(0.2 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>
            Métodos disponibles hoy
          </p>
          {[
            { icon: Banknote,    label: 'Efectivo al recibir',     badge: 'Disponible' },
            { icon: CreditCard,  label: 'Tarjeta en línea',        badge: 'Próximamente' },
            { icon: Smartphone,  label: 'Clip / MercadoPago',      badge: 'Próximamente' },
          ].map(({ icon: Icon, label, badge }) => {
            const available = badge === 'Disponible'
            return (
              <div key={label} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: available ? `${RED}12` : 'oklch(0.92 0.02 82)' }}>
                  <Icon className="h-4 w-4" style={{ color: available ? RED : 'oklch(0.60 0.02 40)' }} />
                </div>
                <p className="flex-1 text-sm font-medium text-left" style={{ color: 'oklch(0.2 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>
                  {label}
                </p>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: available ? `${RED}15` : YEL,
                    color: available ? RED : 'oklch(0.2 0.03 30)',
                    fontFamily: 'var(--font-dm-sans)',
                  }}>
                  {badge}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
