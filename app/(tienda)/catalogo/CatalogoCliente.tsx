'use client'

import { useRef, useState, useMemo, useEffect } from 'react'
import { ShoppingCart, Search, MapPin, ChevronDown, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import ProductoCard from '@/components/tienda/ProductoCard'
import DireccionesPanel from '@/components/tienda/DireccionesPanel'
import PedidoActivo from '@/components/tienda/PedidoActivo'
import { useCarrito } from '@/lib/store/carrito'
import { useDirecciones } from '@/lib/hooks/useDirecciones'
import type { Banner, Categoria, Producto } from '@/lib/types'

type Props = { categorias: Categoria[]; productos: Producto[]; banners: Banner[] }

const ACENTOS = ['oklch(0.50 0.22 24)', 'oklch(0.55 0.18 145)', 'oklch(0.76 0.14 80)']

/* ── Banner carousel ─────────────────────────────────────────── */
function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [activo, setActivo] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)

  // Auto-avance cada 4 s
  useEffect(() => {
    if (banners.length < 2) return
    const t = setInterval(() => setActivo(i => (i + 1) % banners.length), 4000)
    return () => clearInterval(t)
  }, [banners.length])

  useEffect(() => {
    trackRef.current?.children[activo]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [activo])

  if (banners.length === 0) return null

  return (
    <div className="px-4 pt-4 pb-1 flex flex-col gap-2">
      {/* Track */}
      <div ref={trackRef} className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-none rounded-2xl"
        onScroll={(e) => {
          const el = e.currentTarget
          const idx = Math.round(el.scrollLeft / el.offsetWidth)
          setActivo(idx)
        }}>
        {banners.map((b) => (
          <div key={b.id}
            className="flex-shrink-0 w-full snap-center rounded-2xl overflow-hidden relative"
            style={{ aspectRatio: '16/7', minWidth: '100%', backgroundColor: b.color_fondo }}>

            {/* Imagen de fondo o decorativa */}
            {b.imagen_url && (
              <Image
                src={b.imagen_url}
                alt={b.titulo}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 600px"
              />
            )}


            {/* Contenido */}
            <div className="absolute inset-0 flex flex-col justify-center px-5 py-4 gap-1.5">
              {b.badge_texto && (
                <span className="self-start text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider"
                  style={{ backgroundColor: b.badge_color, color: '#fff', fontFamily: 'var(--font-dm-sans)' }}>
                  {b.badge_texto}
                </span>
              )}
              {b.titulo && (
                <h2 style={{ fontFamily: 'var(--font-bebas)', fontSize: 'clamp(1.4rem, 5vw, 2rem)', letterSpacing: '0.04em', color: b.color_texto, lineHeight: 1.05 }}>
                  {b.titulo}
                </h2>
              )}
              {b.subtitulo && (
                <p className="text-xs font-medium" style={{ color: b.color_texto, opacity: 0.85, fontFamily: 'var(--font-dm-sans)' }}>
                  {b.subtitulo}
                </p>
              )}
              {b.boton_texto && b.boton_url && (
                <Link href={b.boton_url} className="self-start mt-1">
                  <button className="flex items-center gap-1 px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95"
                    style={{ backgroundColor: b.badge_color || 'oklch(0.50 0.22 24)', color: '#fff', fontFamily: 'var(--font-dm-sans)' }}>
                    {b.boton_texto}
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Dots */}
      {banners.length > 1 && (
        <div className="flex justify-center gap-1.5">
          {banners.map((_, i) => (
            <button key={i} onClick={() => setActivo(i)}
              className="rounded-full transition-all"
              style={{ width: activo === i ? '1.5rem' : '0.375rem', height: '0.375rem', backgroundColor: activo === i ? 'oklch(0.50 0.22 24)' : 'oklch(0.82 0.02 75)' }} />
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Main ─────────────────────────────────────────────────────── */
export default function CatalogoCliente({ categorias, productos, banners }: Props) {
  const [categoriaActiva, setCategoriaActiva] = useState<string | null>(null)
  const [busqueda, setBusqueda]               = useState('')
  const [busquedaAbierta, setBusquedaAbierta] = useState(false)
  const [panelDir, setPanelDir]               = useState(false)
  const seccionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const inputRef    = useRef<HTMLInputElement>(null)

  const total      = useCarrito((s) => s.total)
  const totalItems = useCarrito((s) => s.totalItems)
  const { activa } = useDirecciones()

  const productosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return productos
    const q = busqueda.toLowerCase()
    return productos.filter((p) => p.nombre.toLowerCase().includes(q))
  }, [busqueda, productos])

  const grupos = useMemo(() =>
    categorias
      .map((cat) => ({ categoria: cat, productos: productosFiltrados.filter((p) => p.categoria_id === cat.id) }))
      .filter((g) => g.productos.length > 0),
    [categorias, productosFiltrados]
  )

  const scrollACategoria = (slug: string) => {
    setCategoriaActiva(slug)
    seccionRefs.current[slug]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const abrirBusqueda = () => {
    setBusquedaAbierta(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  useEffect(() => {
    window.addEventListener('pp-abrir-busqueda', abrirBusqueda)
    return () => window.removeEventListener('pp-abrir-busqueda', abrirBusqueda)
  }, [])

  const cerrarBusqueda = () => {
    setBusquedaAbierta(false)
    setBusqueda('')
  }

  return (
    <div style={{ backgroundColor: 'oklch(0.97 0.012 82)', minHeight: '100vh' }}>

      {/* ── SEARCH OVERLAY ── */}
      {busquedaAbierta && (
        <div className="fixed inset-0 z-50" style={{ backgroundColor: 'oklch(0.97 0.012 82)' }}>
          <div className="flex items-center gap-3 px-4 py-4 border-b" style={{ paddingTop: '4rem', borderColor: 'oklch(0.88 0.03 70)' }}>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'oklch(0.55 0.02 40)' }} />
              <input
                ref={inputRef}
                type="text"
                placeholder="¿Qué pedimos hoy?"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-4 py-3 rounded-2xl text-sm outline-none"
                style={{ backgroundColor: 'oklch(0.92 0.02 82)', border: '1px solid oklch(0.88 0.03 70)', color: 'oklch(0.2 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}
              />
            </div>
            <button onClick={cerrarBusqueda} className="text-sm font-semibold flex-shrink-0" style={{ color: 'oklch(0.50 0.22 24)', fontFamily: 'var(--font-dm-sans)' }}>
              Cancelar
            </button>
          </div>
          <div className="px-4 py-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
            {busqueda && (
              <p className="text-xs mb-4" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
                {productosFiltrados.length} resultado{productosFiltrados.length !== 1 ? 's' : ''} para &ldquo;{busqueda}&rdquo;
              </p>
            )}
            {grupos.map(({ categoria, productos: prods }, i) => (
              <div key={categoria.id} className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: ACENTOS[i % ACENTOS.length], fontFamily: 'var(--font-dm-sans)' }}>
                  {categoria.nombre}
                </p>
                <div className="flex gap-3 overflow-x-auto md:overflow-visible md:flex-wrap pb-2 scrollbar-none">
                  {prods.map((p) => <ProductoCard key={p.id} producto={p} />)}
                </div>
              </div>
            ))}
            {busqueda && grupos.length === 0 && (
              <div className="text-center py-20">
                <p style={{ fontFamily: 'var(--font-bebas)', fontSize: '2rem', color: 'oklch(0.50 0.22 24)', letterSpacing: '0.04em' }}>Sin resultados</p>
                <p className="text-sm mt-2" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>Intenta con otro término</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── BARRA DE DIRECCIÓN ── */}
      <div className="sticky z-40 px-4 pt-3 pb-2 border-b"
        style={{ top: '3.5rem', backgroundColor: 'oklch(0.97 0.012 82)', borderColor: 'oklch(0.88 0.03 70)' }}>
        <button
          onClick={() => setPanelDir(true)}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl transition-colors active:scale-[0.99]"
          style={{ backgroundColor: 'oklch(0.92 0.02 82)', border: '1px solid oklch(0.88 0.03 70)' }}
        >
          <MapPin className="h-4 w-4 flex-shrink-0" style={{ color: 'oklch(0.50 0.22 24)' }} />
          <div className="flex-1 text-left leading-tight">
            <span className="block text-[10px] font-medium" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>Entregar en</span>
            <span className="block text-sm font-semibold truncate" style={{ color: 'oklch(0.2 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>
              {activa ? `${activa.alias} · ${activa.colonia}` : 'Agregar dirección'}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 flex-shrink-0" style={{ color: 'oklch(0.55 0.02 40)' }} />
        </button>
      </div>

      {/* ── BANNERS ── */}
      <BannerCarousel banners={banners} />

      {/* ── CATEGORÍAS CON FOTO ── */}
      <div className="sticky z-30 px-4 py-3 flex gap-4 overflow-x-auto scrollbar-none border-b"
        style={{ top: 'calc(3.5rem + 66px)', backgroundColor: 'oklch(0.97 0.012 82)', borderColor: 'oklch(0.88 0.03 70)' }}>
        {categorias.map((cat) => {
          const activo = categoriaActiva === cat.slug
          return (
            <button key={cat.id} onClick={() => scrollACategoria(cat.slug)}
              className="flex-shrink-0 flex flex-col items-center gap-1.5 transition-all">
              <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center transition-all"
                style={{
                  backgroundColor: 'oklch(0.92 0.02 82)',
                  border: activo ? '2.5px solid oklch(0.50 0.22 24)' : '2.5px solid transparent',
                  boxShadow: activo ? '0 0 0 1px oklch(0.50 0.22 24 / 0.15)' : 'none',
                }}>
                {cat.imagen_url
                  ? <Image src={cat.imagen_url} alt={cat.nombre} width={64} height={64} className="w-full h-full object-cover" />
                  : <span style={{ fontSize: '1.8rem' }}>{cat.nombre.charAt(0)}</span>
                }
              </div>
              <span className="text-[11px] font-semibold text-center leading-tight"
                style={{ fontFamily: 'var(--font-dm-sans)', color: activo ? 'oklch(0.50 0.22 24)' : 'oklch(0.35 0.03 30)', maxWidth: '4.5rem' }}>
                {cat.nombre}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── CONTENIDO ── */}
      <div className="max-w-5xl mx-auto px-4 py-5 flex flex-col gap-10 pb-32 md:pb-10">
        <PedidoActivo />

        {grupos.length === 0 && !busqueda && (
          <div className="text-center py-20">
            <p style={{ fontFamily: 'var(--font-bebas)', fontSize: '2rem', color: 'oklch(0.50 0.22 24)', letterSpacing: '0.04em' }}>Sin productos</p>
          </div>
        )}

        {grupos.map(({ categoria, productos: prods }, i) => {
          const acento = ACENTOS[i % ACENTOS.length]
          return (
            <div key={categoria.id} ref={(el) => { seccionRefs.current[categoria.slug] = el }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 rounded-full" style={{ backgroundColor: acento }} />
                  <h2 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.8rem', letterSpacing: '0.04em', color: 'oklch(0.2 0.03 30)' }}>
                    {categoria.nombre}
                  </h2>
                </div>
                <span className="text-xs" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
                  {prods.length} producto{prods.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex gap-3 overflow-x-auto md:overflow-visible md:flex-wrap pb-2 scrollbar-none">
                {prods.map((p) => <ProductoCard key={p.id} producto={p} />)}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── CARRITO FLOTANTE ── */}
      {totalItems() > 0 && (
        <div className="fixed bottom-24 left-4 right-4 z-50">
          <Link href="/carrito">
            <button className="w-full h-14 rounded-2xl flex items-center justify-between px-5 shadow-2xl transition-transform active:scale-[0.98]"
              style={{ backgroundColor: 'oklch(0.50 0.22 24)', color: 'oklch(0.97 0.012 82)' }}>
              <div className="flex items-center gap-2.5">
                <ShoppingCart className="h-5 w-5" />
                <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                  {totalItems()} artículo{totalItems() !== 1 ? 's' : ''}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-xl text-sm font-bold"
                style={{ backgroundColor: 'oklch(0.76 0.14 80)', color: 'oklch(0.2 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>
                ${total().toFixed(0)}
              </span>
            </button>
          </Link>
        </div>
      )}

      {panelDir && <DireccionesPanel onCerrar={() => setPanelDir(false)} />}
    </div>
  )
}
