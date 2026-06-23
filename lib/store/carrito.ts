import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ItemCarrito, Producto } from '@/lib/types'

type CarritoStore = {
  items: ItemCarrito[]
  agregar: (producto: Producto) => void
  quitar: (productoId: string) => void
  actualizarCantidad: (productoId: string, cantidad: number) => void
  limpiar: () => void
  total: () => number
  totalItems: () => number
}

export const useCarrito = create<CarritoStore>()(
  persist(
    (set, get) => ({
      items: [],

      agregar: (producto) => {
        const items = get().items
        const existe = items.find((i) => i.producto.id === producto.id)
        if (existe) {
          set({
            items: items.map((i) =>
              i.producto.id === producto.id
                ? { ...i, cantidad: i.cantidad + 1 }
                : i
            ),
          })
        } else {
          set({ items: [...items, { producto, cantidad: 1 }] })
        }
      },

      quitar: (productoId) => {
        set({ items: get().items.filter((i) => i.producto.id !== productoId) })
      },

      actualizarCantidad: (productoId, cantidad) => {
        if (cantidad <= 0) {
          get().quitar(productoId)
          return
        }
        set({
          items: get().items.map((i) =>
            i.producto.id === productoId ? { ...i, cantidad } : i
          ),
        })
      },

      limpiar: () => set({ items: [] }),

      total: () =>
        get().items.reduce(
          (acc, i) => acc + i.producto.precio * i.cantidad,
          0
        ),

      totalItems: () =>
        get().items.reduce((acc, i) => acc + i.cantidad, 0),
    }),
    { name: 'pide-pisto-carrito' }
  )
)
