'use client'

import { useCarrito } from '@/lib/store/carrito'
import { fp } from '@/lib/utils'
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'

const RED  = 'oklch(0.50 0.22 24)'
const BG   = 'oklch(0.97 0.012 82)'
const CARD: React.CSSProperties = { backgroundColor: 'oklch(1 0 0)', border: '1px solid oklch(0.88 0.03 70)' }

export default function CarritoPage() {
  const { items, actualizarCantidad, limpiar, total } = useCarrito()

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 px-4" style={{ backgroundColor: BG }}>
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ backgroundColor: 'oklch(0.50 0.22 24 / 0.1)' }}>
          <ShoppingCart className="h-9 w-9" style={{ color: RED }} />
        </div>
        <div className="text-center">
          <h1 style={{ fontFamily: 'var(--font-bebas)', fontSize: '2rem', letterSpacing: '0.04em', color: RED }}>
            Tu carrito está vacío
          </h1>
          <p className="text-sm mt-1" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
            Agrega productos desde el catálogo
          </p>
        </div>
        <Link href="/catalogo">
          <Button className="gap-2 border-0 font-semibold" style={{ backgroundColor: RED, color: 'oklch(0.97 0.012 82)', fontFamily: 'var(--font-dm-sans)' }}>
            <ArrowLeft className="h-4 w-4" /> Ver catálogo
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: BG, minHeight: '100vh' }}>

      {/* Header */}
      <div className="sticky top-14 z-30 px-4 py-4 border-b flex items-center justify-between"
        style={{ backgroundColor: BG, borderColor: 'oklch(0.88 0.03 70)' }}>
        <div className="flex items-center gap-3">
          <Link href="/catalogo">
            <button className="p-2 rounded-xl hover:bg-black/5 transition-colors">
              <ArrowLeft className="h-5 w-5" style={{ color: RED }} />
            </button>
          </Link>
          <h1 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.8rem', letterSpacing: '0.04em', color: 'oklch(0.2 0.03 30)' }}>
            Tu carrito
          </h1>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: RED, color: 'oklch(0.97 0.012 82)', fontFamily: 'var(--font-dm-sans)' }}>
            {items.length} {items.length === 1 ? 'producto' : 'productos'}
          </span>
        </div>
        <button onClick={limpiar} className="text-xs font-medium flex items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-black/5 transition-colors"
          style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
          <Trash2 className="h-3.5 w-3.5" /> Vaciar
        </button>
      </div>

      {/* ── Layout: columna en mobile, 2 columnas en desktop ── */}
      <div className="max-w-5xl mx-auto px-4 py-6 pb-40 md:pb-10 md:grid md:grid-cols-[1fr_340px] md:gap-8 md:items-start">

        {/* Columna izquierda: items */}
        <div className="flex flex-col gap-3">
          {items.map(({ producto, cantidad }) => (
            <div key={producto.id} className="flex items-center gap-4 p-4 rounded-2xl"
              style={{ ...CARD, boxShadow: '0 2px 8px oklch(0 0 0 / 0.04)' }}>
              <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0" style={{ backgroundColor: 'oklch(0.96 0.01 82)' }}>
                <Image
                  src={producto.imagen_url ?? `https://placehold.co/200x200/C0392B/F5F0E0?text=${encodeURIComponent(producto.nombre)}`}
                  alt={producto.nombre} fill className="object-contain p-1" sizes="64px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight line-clamp-2" style={{ color: 'oklch(0.2 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>
                  {producto.nombre}
                </p>
                <p className="mt-0.5" style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.1rem', letterSpacing: '0.03em', color: RED }}>
                  {fp(producto.precio * cantidad)}
                </p>
                {cantidad > 1 && (
                  <p className="text-xs" style={{ color: 'oklch(0.60 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
                    {fp(producto.precio)} c/u
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => actualizarCantidad(producto.id, cantidad - 1)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center border transition-colors hover:bg-black/5"
                  style={{ borderColor: 'oklch(0.85 0.03 70)', color: RED }}>
                  {cantidad === 1
                    ? <Trash2 className="h-3.5 w-3.5" style={{ color: 'oklch(0.65 0.15 24)' }} />
                    : <Minus className="h-3.5 w-3.5" />}
                </button>
                <span className="w-6 text-center font-bold text-sm" style={{ color: 'oklch(0.2 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>
                  {cantidad}
                </span>
                <button onClick={() => actualizarCantidad(producto.id, cantidad + 1)}
                  disabled={cantidad >= producto.stock}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors border-0"
                  style={{
                    backgroundColor: cantidad >= producto.stock ? 'oklch(0.92 0.02 82)' : RED,
                    color: cantidad >= producto.stock ? 'oklch(0.65 0.02 40)' : 'oklch(0.97 0.012 82)',
                  }}>
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Columna derecha: resumen + CTA — solo desktop */}
        <div className="hidden md:flex flex-col gap-4 md:sticky md:top-28">
          <div className="rounded-2xl p-5 flex flex-col gap-3" style={CARD}>
            <h3 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.3rem', letterSpacing: '0.04em', color: 'oklch(0.2 0.03 30)' }}>
              Resumen del pedido
            </h3>
            <div className="flex flex-col gap-2">
              {items.map(({ producto, cantidad }) => (
                <div key={producto.id} className="flex justify-between text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                  <span style={{ color: 'oklch(0.48 0.03 40)' }}>{producto.nombre} × {cantidad}</span>
                  <span style={{ color: 'oklch(0.2 0.03 30)', fontWeight: 500 }}>{fp(producto.precio * cantidad)}</span>
                </div>
              ))}
            </div>
            <div className="h-px" style={{ backgroundColor: 'oklch(0.90 0.02 82)' }} />
            <div className="flex justify-between items-center">
              <span className="font-semibold" style={{ color: 'oklch(0.2 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>Total</span>
              <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.6rem', letterSpacing: '0.03em', color: RED }}>
                {fp(total())}
              </span>
            </div>
          </div>

          <Link href="/checkout" className="block w-full">
            <button className="w-full h-14 rounded-2xl flex items-center justify-between px-5 font-semibold text-base transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ backgroundColor: RED, color: 'oklch(0.97 0.012 82)', fontFamily: 'var(--font-dm-sans)' }}>
              <span className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5" /> Ir a checkout
              </span>
              <span className="px-3 py-1 rounded-xl text-sm font-bold"
                style={{ backgroundColor: 'oklch(0.76 0.14 80)', color: 'oklch(0.2 0.03 30)' }}>
                {fp(total())}
              </span>
            </button>
          </Link>
        </div>
      </div>

      {/* CTA fijo solo en mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 border-t"
        style={{ backgroundColor: BG, borderColor: 'oklch(0.88 0.03 70)' }}>
        <Link href="/checkout" className="block w-full">
          <button className="w-full h-14 rounded-2xl flex items-center justify-between px-5 font-semibold text-base transition-all active:scale-[0.98]"
            style={{ backgroundColor: RED, color: 'oklch(0.97 0.012 82)', fontFamily: 'var(--font-dm-sans)' }}>
            <span className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5" /> Ir a checkout
            </span>
            <span className="px-3 py-1 rounded-xl text-sm font-bold"
              style={{ backgroundColor: 'oklch(0.76 0.14 80)', color: 'oklch(0.2 0.03 30)' }}>
              {fp(total())}
            </span>
          </button>
        </Link>
      </div>
    </div>
  )
}
