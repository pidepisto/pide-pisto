import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Beer, Clock, MapPin, ShieldCheck, ArrowRight, Truck, MessageCircle, FileText, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Pide Pisto — Alcohol a domicilio en Chalco e Ixtapaluca',
  description: 'Cerveza, vino, mezcal y más, entregados en tu puerta en minutos. Cobertura en Chalco e Ixtapaluca, Estado de México. Pide ahora.',
  keywords: ['alcohol a domicilio', 'cerveza a domicilio', 'Chalco', 'Ixtapaluca', 'bebidas a domicilio', 'delivery alcohol Estado de México'],
  openGraph: {
    title: 'Pide Pisto — Alcohol a domicilio en Chalco e Ixtapaluca',
    description: 'Cerveza, vino, mezcal y más, entregados en tu puerta en minutos.',
    type: 'website',
    locale: 'es_MX',
  },
  alternates: {
    canonical: 'https://pidepisto.com',
  },
}

// Structured data para búsquedas locales
const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'Pide Pisto',
  description: 'Servicio de entrega de alcohol a domicilio en Chalco e Ixtapaluca, Estado de México.',
  areaServed: [
    { '@type': 'City', name: 'Chalco', containedInPlace: { '@type': 'State', name: 'Estado de México' } },
    { '@type': 'City', name: 'Ixtapaluca', containedInPlace: { '@type': 'State', name: 'Estado de México' } },
  ],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Bebidas alcohólicas',
    itemListElement: [
      { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Cervezas' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Vinos' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Destilados' } },
    ],
  },
}

export default async function Home() {
  const supabase = await createClient()
  const { data: categorias } = await supabase
    .from('categorias')
    .select('id, nombre, slug, imagen_url')
    .order('orden')
    .limit(8)

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }} />
    <div className="flex flex-col">

      {/* ── HERO — foto de fondo ── */}
      <section
        className="relative flex flex-col items-center justify-center text-center px-4 py-28 overflow-hidden"
      >
        {/* Imagen de fondo */}
        <Image
          src="/hero.jpg"
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        {/* Overlay rojo oscuro para mantener identidad y legibilidad */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, oklch(0.35 0.22 24 / 0.92) 0%, oklch(0.45 0.22 24 / 0.80) 50%, oklch(0.30 0.18 24 / 0.88) 100%)' }} />

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

      {/* ── PLATAFORMAS ── */}
      <section style={{ backgroundColor: 'oklch(0.97 0.012 82)' }} className="py-16 px-4">
        <div className="max-w-xl mx-auto flex flex-col items-center gap-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em]"
            style={{ color: 'oklch(0.60 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
            Encuéntranos también en
          </p>
          <div className="flex items-center justify-center">
            <div className="px-8 py-4 rounded-2xl transition-all hover:scale-105"
              style={{ backgroundColor: 'oklch(0.93 0.02 80)', border: '1px solid oklch(0.88 0.03 70)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logos/rappi.webp" alt="Rappi" style={{ height: '36px', width: 'auto' }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── CATEGORÍAS ── */}
      {categorias && categorias.length > 0 && (
        <section style={{ backgroundColor: 'oklch(0.97 0.012 82)' }} className="py-16 px-4">
          <div className="max-w-4xl mx-auto flex flex-col gap-8">
            <div className="text-center">
              <h2 style={{ fontFamily: 'var(--font-bebas)', fontSize: 'clamp(2rem,5vw,3rem)', letterSpacing: '0.04em', color: 'oklch(0.50 0.22 24)', lineHeight: 1 }}>
                Lo que tenemos para ti
              </h2>
              <p className="text-sm mt-2" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
                Más de 100 productos listos para llegar a tu puerta
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {categorias.map((cat) => (
                <Link key={cat.id} href={`/catalogo#${cat.slug}`}>
                  <div className="group relative rounded-2xl overflow-hidden aspect-square cursor-pointer"
                    style={{ backgroundColor: 'oklch(0.90 0.02 80)' }}>
                    {cat.imagen_url
                      ? <Image src={cat.imagen_url} alt={cat.nombre} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="(max-width:640px) 50vw, 25vw" />
                      : <div className="w-full h-full flex items-center justify-center">
                          <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '3rem', color: 'oklch(0.65 0.03 40)' }}>{cat.nombre.charAt(0)}</span>
                        </div>
                    }
                    {/* Overlay degradado */}
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, oklch(0.10 0.03 30 / 0.75) 0%, transparent 55%)' }} />
                    <p className="absolute bottom-0 left-0 right-0 px-3 py-2.5 text-sm font-bold"
                      style={{ fontFamily: 'var(--font-bebas)', letterSpacing: '0.05em', color: '#fff', fontSize: '1.1rem' }}>
                      {cat.nombre}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center">
              <Link href="/catalogo">
                <Button className="gap-2 border-0 px-8"
                  style={{ backgroundColor: 'oklch(0.50 0.22 24)', color: 'oklch(0.97 0.012 82)', fontFamily: 'var(--font-dm-sans)' }}>
                  Ver catálogo completo <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

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
      <footer className="px-4 pt-14 pb-8" style={{ backgroundColor: 'oklch(0.14 0.02 30)' }}>
        <div className="max-w-4xl mx-auto flex flex-col gap-10">

          {/* Fila principal */}
          <div className="grid sm:grid-cols-3 gap-10">

            {/* Marca */}
            <div className="flex flex-col gap-3">
              <span style={{ fontFamily: 'var(--font-bebas)', letterSpacing: '0.07em', fontSize: '1.8rem', color: 'oklch(0.97 0.012 82)' }}>
                Pide Pisto
              </span>
              <p className="text-sm leading-relaxed" style={{ color: 'oklch(0.65 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
                Alcohol a domicilio en Chalco e Ixtapaluca, Estado de México. Rápido, seguro y legal.
              </p>
              {/* WhatsApp */}
              <a href="https://wa.me/521XXXXXXXXXX" target="_blank" rel="noopener noreferrer"
                className="self-start flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
                style={{ backgroundColor: 'oklch(0.50 0.18 145)', color: '#fff', fontFamily: 'var(--font-dm-sans)' }}>
                <MessageCircle className="h-4 w-4" />
                Escríbenos por WhatsApp
              </a>
            </div>

            {/* Horario y zonas */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'oklch(0.50 0.22 24)', fontFamily: 'var(--font-dm-sans)' }}>
                Servicio
              </p>
              <div className="flex flex-col gap-1.5 text-sm" style={{ color: 'oklch(0.65 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'oklch(0.76 0.14 80)' }} />
                  <span>Lun – Dom · 10:00 a 23:00</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'oklch(0.76 0.14 80)' }} />
                  <span>Chalco e Ixtapaluca, Edo. Méx.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'oklch(0.76 0.14 80)' }} />
                  <span>Entrega en menos de 45 min</span>
                </div>
              </div>
            </div>

            {/* Links legales y redes */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'oklch(0.50 0.22 24)', fontFamily: 'var(--font-dm-sans)' }}>
                Legal
              </p>
              <div className="flex flex-col gap-2">
                <Link href="/terminos" className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity"
                  style={{ color: 'oklch(0.65 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
                  <FileText className="h-3.5 w-3.5" /> Términos de servicio
                </Link>
                <Link href="/privacidad" className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity"
                  style={{ color: 'oklch(0.65 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
                  <Lock className="h-3.5 w-3.5" /> Aviso de privacidad
                </Link>
                <a href="https://instagram.com/pidepisto" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity"
                  style={{ color: 'oklch(0.65 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
                  <svg className="h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                  </svg>
                  @pidepisto
                </a>
              </div>
            </div>
          </div>

          {/* Línea divisora */}
          <div style={{ height: '1px', backgroundColor: 'oklch(1 0 0 / 0.07)' }} />

          {/* Copyright */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs"
            style={{ color: 'oklch(0.45 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
            <span>© 2025 Pide Pisto · Solo para mayores de 18 años</span>
            <span>La venta de alcohol a menores está prohibida por la ley</span>
          </div>
        </div>
      </footer>

    </div>
    </>
  )
}
