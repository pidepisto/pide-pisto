'use client'

import Image from 'next/image'
import { Plus, Minus, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCarrito } from '@/lib/store/carrito'
import { useFavoritos } from '@/lib/hooks/useFavoritos'
import type { Producto } from '@/lib/types'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const RED = 'oklch(0.50 0.22 24)'

export default function ProductoCard({ producto }: { producto: Producto }) {
  const { items, agregar, actualizarCantidad } = useCarrito()
  const { esFavorito, toggle, autenticado } = useFavoritos()
  const router = useRouter()
  const item     = items.find((i) => i.producto.id === producto.id)
  const cantidad = item?.cantidad ?? 0
  const fav      = esFavorito(producto.id)

  const handleAgregar = () => {
    agregar(producto)
    toast.success(`${producto.nombre} agregado`, { duration: 1500 })
  }

  const handleFav = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!autenticado) {
      toast('Inicia sesión para guardar favoritos', {
        action: { label: 'Entrar', onClick: () => router.push('/login') },
        duration: 3000,
      })
      return
    }
    const ahora = await toggle(producto.id)
    if (ahora) toast.success('Guardado en favoritos', { duration: 1500 })
    else toast('Eliminado de favoritos', { duration: 1500 })
  }

  return (
    <div
      className="flex-shrink-0 w-44 rounded-2xl overflow-hidden flex flex-col"
      style={{
        backgroundColor: 'oklch(1 0 0)',
        border: '1px solid oklch(0.88 0.03 70)',
        boxShadow: '0 2px 12px oklch(0 0 0 / 0.06)',
      }}
    >
      {/* Imagen */}
      <div className="relative w-full h-40 bg-gray-50">
        <Image
          src={producto.imagen_url ?? `https://placehold.co/400x400/C0392B/F5F0E0?text=${encodeURIComponent(producto.nombre)}`}
          alt={producto.nombre}
          fill
          className="object-contain p-3"
          sizes="176px"
        />
        {producto.stock < 10 && producto.stock > 0 && (
          <span
            className="absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'oklch(0.76 0.14 80)', color: 'oklch(0.2 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}
          >
            Últimos {producto.stock}
          </span>
        )}
        {/* Botón corazón */}
        <button
          onClick={handleFav}
          className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{
            backgroundColor: fav ? `${RED}15` : 'oklch(1 0 0 / 0.85)',
            backdropFilter: 'blur(4px)',
            border: `1px solid ${fav ? RED : 'oklch(0.88 0.03 70)'}`,
          }}
        >
          <Heart
            className="h-3.5 w-3.5"
            style={{
              color: fav ? RED : 'oklch(0.60 0.02 40)',
              fill: fav ? RED : 'none',
              strokeWidth: 2,
            }}
          />
        </button>
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-3 gap-2">
        <p
          className="text-sm leading-tight line-clamp-2 flex-1"
          style={{ color: 'oklch(0.2 0.03 30)', fontFamily: 'var(--font-dm-sans)', fontWeight: 500 }}
        >
          {producto.nombre}
        </p>

        <div className="flex items-center justify-between gap-1">
          <span
            style={{
              fontFamily: 'var(--font-bebas)',
              fontSize: '1.2rem',
              letterSpacing: '0.03em',
              color: 'oklch(0.50 0.22 24)',
            }}
          >
            ${producto.precio.toFixed(0)}
          </span>

          {cantidad === 0 ? (
            <Button
              size="icon"
              className="h-8 w-8 rounded-xl border-0 flex-shrink-0"
              style={{ backgroundColor: 'oklch(0.50 0.22 24)', color: 'oklch(0.97 0.012 82)' }}
              onClick={handleAgregar}
              disabled={producto.stock === 0}
            >
              <Plus className="h-4 w-4" />
            </Button>
          ) : (
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="outline"
                className="h-6 w-6 rounded-lg p-0"
                style={{ borderColor: 'oklch(0.85 0.03 70)', color: 'oklch(0.50 0.22 24)' }}
                onClick={() => actualizarCantidad(producto.id, cantidad - 1)}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span
                className="w-5 text-center text-sm font-semibold"
                style={{ color: 'oklch(0.2 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}
              >
                {cantidad}
              </span>
              <Button
                size="icon"
                className="h-6 w-6 rounded-lg p-0 border-0"
                style={{ backgroundColor: 'oklch(0.50 0.22 24)', color: 'oklch(0.97 0.012 82)' }}
                onClick={() => actualizarCantidad(producto.id, cantidad + 1)}
                disabled={cantidad >= producto.stock}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
