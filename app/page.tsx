import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Beer, Clock, MapPin, ShieldCheck, ArrowRight, Truck } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex flex-col">

      {/* ── HERO — fondo rojo ── */}
      <section
        className="relative flex flex-col items-center justify-center text-center px-4 py-28 overflow-hidden"
        style={{ backgroundColor: 'oklch(0.50 0.22 24)' }}
      >
        {/* Textura sutil de fondo */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, oklch(0.76 0.14 80) 0%, transparent 50%), radial-gradient(circle at 80% 20%, oklch(0.55 0.18 145) 0%, transparent 40%)',
          }}
        />

        <div className="relative z-10 flex flex-col items-center gap-5 max-w-3xl mx-auto">
          {/* Pill location */}
          <div className="rounded-full px-4 py-1.5 text-sm font-semibold flex items-center gap-2"
            style={{ backgroundColor: 'oklch(0.76 0.14 80)', color: 'oklch(0.2 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>
            <MapPin className="h-3.5 w-3.5" />
            Chalco e Ixtapaluca, Estado de México
          </div>

          <h1
            className="text-[clamp(3.5rem,11vw,6rem)] leading-none"
            style={{
              fontFamily: 'var(--font-bebas)',
              letterSpacing: '0.03em',
              color: 'oklch(0.97 0.012 82)',
            }}
          >
            Tu bebida favorita<br />en tu puerta
          </h1>

          <p
            className="text-lg max-w-md leading-relaxed"
            style={{ color: 'oklch(0.97 0.012 82 / 0.75)', fontFamily: 'var(--font-dm-sans)' }}
          >
            Cerveza, vinos y destilados a domicilio. Pedido en minutos, entrega en menos de 45.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-1">
            <Link href="/catalogo">
              <Button size="lg"
                className="font-semibold gap-2 px-8 border-0"
                style={{
                  backgroundColor: 'oklch(0.97 0.012 82)',
                  color: 'oklch(0.50 0.22 24)',
                  fontFamily: 'var(--font-dm-sans)',
                }}
              >
                Ver catálogo <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/registro">
              <Button size="lg"
                className="glass-on-red font-semibold px-8"
                style={{ color: 'oklch(0.97 0.012 82)', fontFamily: 'var(--font-dm-sans)' }}
              >
                Crear cuenta
              </Button>
            </Link>
          </div>
        </div>

        {/* Stat cards flotantes */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-14 w-full max-w-2xl">
          {[
            { icon: <Clock className="h-5 w-5" />, value: '45 min', label: 'Entrega máx.', accent: 'oklch(0.76 0.14 80)' },
            { icon: <Beer className="h-5 w-5" />, value: '100+', label: 'Productos', accent: 'oklch(0.55 0.18 145)' },
            { icon: <Truck className="h-5 w-5" />, value: '2 zonas', label: 'Cobertura', accent: 'oklch(0.76 0.14 80)' },
            { icon: <ShieldCheck className="h-5 w-5" />, value: '100%', label: 'Pago seguro', accent: 'oklch(0.55 0.18 145)' },
          ].map((s) => (
            <div key={s.label} className="glass-on-red rounded-2xl p-4 flex flex-col items-center gap-1.5 text-center">
              <span style={{ color: s.accent }}>{s.icon}</span>
              <span
                className="text-xl"
                style={{ fontFamily: 'var(--font-bebas)', letterSpacing: '0.04em', color: 'oklch(0.97 0.012 82)' }}
              >
                {s.value}
              </span>
              <span className="text-xs" style={{ color: 'oklch(0.97 0.012 82 / 0.6)' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Separador chevrones */}
      <div className="h-5 chevron-pattern-cream" />

      {/* ── CÓMO FUNCIONA — fondo crema ── */}
      <section style={{ backgroundColor: 'oklch(0.97 0.012 82)' }} className="py-24 px-4">
        <div className="container mx-auto max-w-3xl">
          <h2
            className="text-center mb-12"
            style={{
              fontFamily: 'var(--font-bebas)',
              letterSpacing: '0.04em',
              fontSize: 'clamp(2.5rem,6vw,4rem)',
              color: 'oklch(0.50 0.22 24)',
            }}
          >
            Cómo funciona
          </h2>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                num: '01',
                icon: <Beer className="h-6 w-6" style={{ color: 'oklch(0.50 0.22 24)' }} />,
                title: 'Elige tus bebidas',
                desc: 'Navega el catálogo y agrega lo que quieras al carrito.',
              },
              {
                num: '02',
                icon: <MapPin className="h-6 w-6" style={{ color: 'oklch(0.50 0.22 24)' }} />,
                title: 'Confirma tu dirección',
                desc: 'Ingresa tu dirección en Chalco o Ixtapaluca.',
              },
              {
                num: '03',
                icon: <Truck className="h-6 w-6" style={{ color: 'oklch(0.50 0.22 24)' }} />,
                title: 'Recibe en casa',
                desc: 'Tu pedido llega en menos de 45 minutos.',
              },
            ].map((item) => (
              <div key={item.num} className="glass-on-cream rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: 'oklch(0.50 0.22 24 / 0.1)' }}
                  >
                    {item.icon}
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--font-bebas)',
                      fontSize: '2.5rem',
                      color: 'oklch(0.50 0.22 24 / 0.15)',
                      letterSpacing: '0.02em',
                      lineHeight: 1,
                    }}
                  >
                    {item.num}
                  </span>
                </div>
                <div>
                  <h3
                    className="mb-1"
                    style={{
                      fontFamily: 'var(--font-bebas)',
                      fontSize: '1.4rem',
                      letterSpacing: '0.04em',
                      color: 'oklch(0.2 0.03 30)',
                    }}
                  >
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'oklch(0.48 0.03 40)' }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Separador chevrones */}
      <div className="h-5 chevron-pattern" />

      {/* ── CTA — fondo rojo ── */}
      <section
        className="relative py-24 px-4 overflow-hidden"
        style={{ backgroundColor: 'oklch(0.50 0.22 24)' }}
      >
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 50% 50%, oklch(0.76 0.14 80) 0%, transparent 60%)',
          }}
        />
        <div className="relative z-10 max-w-xl mx-auto text-center flex flex-col items-center gap-6">
          <h2
            style={{
              fontFamily: 'var(--font-bebas)',
              letterSpacing: '0.03em',
              fontSize: 'clamp(2.5rem,7vw,4.5rem)',
              color: 'oklch(0.97 0.012 82)',
              lineHeight: 1,
            }}
          >
            ¿Listo para pedir?
          </h2>
          <p className="text-base max-w-sm" style={{ color: 'oklch(0.97 0.012 82 / 0.7)', fontFamily: 'var(--font-dm-sans)' }}>
            Crea tu cuenta gratis y haz tu primer pedido en minutos.
          </p>
          <Link href="/registro">
            <Button
              size="lg"
              className="font-semibold gap-2 px-10 border-0"
              style={{
                backgroundColor: 'oklch(0.97 0.012 82)',
                color: 'oklch(0.50 0.22 24)',
                fontFamily: 'var(--font-dm-sans)',
              }}
            >
              Empezar ahora <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        className="py-7 px-4"
        style={{ backgroundColor: 'oklch(0.2 0.03 30)', borderTop: '1px solid oklch(1 0 0 / 0.06)' }}
      >
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span
            style={{ fontFamily: 'var(--font-bebas)', letterSpacing: '0.06em', fontSize: '1.1rem', color: 'oklch(0.97 0.012 82)' }}
          >
            Pide Pisto
          </span>
          <span className="text-sm" style={{ color: 'oklch(0.97 0.012 82 / 0.4)' }}>
            Solo para mayores de 18 años · Chalco e Ixtapaluca, Estado de México
          </span>
          <span className="text-sm" style={{ color: 'oklch(0.97 0.012 82 / 0.4)' }}>© 2025</span>
        </div>
      </footer>

    </div>
  )
}
