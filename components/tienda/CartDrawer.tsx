'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { X, Minus, Plus, Trash2, ShoppingCart, ArrowRight } from 'lucide-react'
import { useCarrito } from '@/lib/store/carrito'
import { fp } from '@/lib/utils'

const RED = 'oklch(0.50 0.22 24)'
const BG  = 'oklch(0.97 0.012 82)'

export default function CartDrawer() {
  const { items, drawerAbierto, cerrarDrawer, actualizarCantidad, total, totalItems } = useCarrito()

  // Bloquear scroll del body cuando está abierto
  useEffect(() => {
    if (drawerAbierto) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [drawerAbierto])

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') cerrarDrawer() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [cerrarDrawer])

  return (
    <>
      {/* Backdrop */}
      <div
        className="md:hidden fixed inset-0 z-40 transition-opacity duration-300"
        style={{
          backgroundColor: 'oklch(0 0 0 / 0.5)',
          opacity: drawerAbierto ? 1 : 0,
          pointerEvents: drawerAbierto ? 'auto' : 'none',
        }}
        onClick={cerrarDrawer}
      />

      {/* Drawer */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-3xl transition-transform duration-300 ease-out"
        style={{
          backgroundColor: BG,
          transform: drawerAbierto ? 'translateY(0)' : 'translateY(100%)',
          maxHeight: '88vh',
          boxShadow: '0 -8px 40px oklch(0 0 0 / 0.18)',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'oklch(0.82 0.02 75)' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0 border-b"
          style={{ borderColor: 'oklch(0.90 0.02 75)' }}>
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" style={{ color: RED }} />
            <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.5rem', letterSpacing: '0.04em', color: 'oklch(0.2 0.03 30)' }}>
              Tu carrito
            </span>
            {totalItems() > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: RED, color: 'oklch(0.97 0.012 82)', fontFamily: 'var(--font-dm-sans)' }}>
                {totalItems()}
              </span>
            )}
          </div>
          <button onClick={cerrarDrawer}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors active:bg-black/10"
            style={{ backgroundColor: 'oklch(0.92 0.02 82)' }}>
            <X className="h-4 w-4" style={{ color: 'oklch(0.35 0.03 30)' }} />
          </button>
        </div>

        {/* Contenido */}
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 px-8 flex-1">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center"
              style={{ backgroundColor: `${RED}12` }}>
              <ShoppingCart className="h-8 w-8" style={{ color: RED }} />
            </div>
            <div className="text-center">
              <p style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.5rem', color: RED, letterSpacing: '0.04em' }}>
                Carrito vacío
              </p>
              <p className="text-sm mt-1" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
                Agrega algo rico para empezar
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Lista de productos — scrollable */}
            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3" style={{ overscrollBehavior: 'contain' }}>
              {items.map(({ producto, cantidad }) => (
                <div key={producto.id}
                  className="flex items-center gap-3 rounded-2xl p-3"
                  style={{ backgroundColor: 'oklch(1 0 0)', border: '1px solid oklch(0.90 0.02 75)' }}>
                  {/* Imagen */}
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0"
                    style={{ backgroundColor: 'oklch(0.95 0.01 82)' }}>
                    <Image
                      src={producto.imagen_url ?? `https://placehold.co/200x200/C0392B/F5F0E0?text=${encodeURIComponent(producto.nombre)}`}
                      alt={producto.nombre} fill className="object-contain p-1" sizes="56px"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-tight line-clamp-2"
                      style={{ color: 'oklch(0.2 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>
                      {producto.nombre}
                    </p>
                    <p style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.05rem', letterSpacing: '0.03em', color: RED }}>
                      {fp(producto.precio * cantidad)}
                      {cantidad > 1 && (
                        <span className="text-xs font-normal ml-1" style={{ color: 'oklch(0.60 0.02 40)', fontFamily: 'var(--font-dm-sans)', letterSpacing: 0 }}>
                          ({fp(producto.precio)} c/u)
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Controles cantidad */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => actualizarCantidad(producto.id, cantidad - 1)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center border transition-colors active:bg-black/10"
                      style={{ borderColor: 'oklch(0.85 0.03 70)', color: cantidad === 1 ? 'oklch(0.65 0.15 24)' : RED }}>
                      {cantidad === 1
                        ? <Trash2 className="h-3 w-3" />
                        : <Minus className="h-3 w-3" />}
                    </button>
                    <span className="w-5 text-center text-sm font-bold"
                      style={{ color: 'oklch(0.2 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>
                      {cantidad}
                    </span>
                    <button
                      onClick={() => actualizarCantidad(producto.id, cantidad + 1)}
                      disabled={cantidad >= producto.stock}
                      className="w-7 h-7 rounded-lg flex items-center justify-center border-0 transition-colors active:opacity-80 disabled:opacity-40"
                      style={{ backgroundColor: RED, color: 'oklch(0.97 0.012 82)' }}>
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer: total + CTA */}
            <div className="flex-shrink-0 px-4 pt-3 pb-8 border-t flex flex-col gap-3"
              style={{ borderColor: 'oklch(0.90 0.02 75)' }}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold" style={{ color: 'oklch(0.35 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>
                  Total del pedido
                </span>
                <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.8rem', letterSpacing: '0.03em', color: RED }}>
                  {fp(total())}
                </span>
              </div>
              <Link href="/checkout" onClick={cerrarDrawer} className="block w-full">
                <button className="w-full h-14 rounded-2xl flex items-center justify-between px-5 font-semibold text-base transition-all active:scale-[0.98]"
                  style={{ backgroundColor: RED, color: 'oklch(0.97 0.012 82)', fontFamily: 'var(--font-dm-sans)' }}>
                  <span>Confirmar pedido</span>
                  <span className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-xl text-sm font-bold"
                      style={{ backgroundColor: 'oklch(0.76 0.14 80)', color: 'oklch(0.2 0.03 30)' }}>
                      {fp(total())}
                    </span>
                    <ArrowRight className="h-5 w-5" />
                  </span>
                </button>
              </Link>
              <Link href="/carrito" onClick={cerrarDrawer}
                className="text-center text-sm font-medium py-1"
                style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
                Ver carrito completo
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  )
}
