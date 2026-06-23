'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useFavoritos } from '@/lib/hooks/useFavoritos'
import ProductoCard from '@/components/tienda/ProductoCard'
import { SkeletonProductoCard } from '@/components/ui/Skeleton'
import type { Producto } from '@/lib/types'

const RED = 'oklch(0.50 0.22 24)'
const BG  = 'oklch(0.97 0.012 82)'
const DIM = { color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }

export default function FavoritosPage() {
  const supabase = createClient()
  const { esFavorito, cargando: cargandoFavs, autenticado } = useFavoritos()
  const [productos, setProductos] = useState<Producto[]>([])
  const [cargando, setCargando]   = useState(true)

  useEffect(() => {
    const cargar = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setCargando(false); return }

      const { data: favs } = await supabase
        .from('favoritos')
        .select('producto_id')
        .eq('usuario_id', user.id)

      if (!favs || favs.length === 0) { setCargando(false); return }

      const ids = favs.map((f: any) => f.producto_id)
      const { data: prods } = await supabase
        .from('productos')
        .select('*, categoria:categorias(*)')
        .in('id', ids)
        .eq('activo', true)
        .order('nombre')

      setProductos(prods ?? [])
      setCargando(false)
    }
    cargar()
  }, [cargandoFavs]) // recarga cuando cambia el estado de favs (por si se elimina uno)

  // Filtra en tiempo real los que ya no son favoritos (tras quitar el corazón)
  const visibles = productos.filter((p) => esFavorito(p.id))

  return (
    <div style={{ backgroundColor: BG, minHeight: '100vh' }}>
      {/* Header */}
      <div className="px-4 pt-5 pb-4 border-b flex items-center gap-2" style={{ borderColor: 'oklch(0.88 0.03 70)' }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${RED}12` }}>
          <Heart className="h-4 w-4" style={{ color: RED, fill: `${RED}40` }} />
        </div>
        <h1 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.8rem', letterSpacing: '0.05em', color: 'oklch(0.2 0.03 30)' }}>
          Favoritos
        </h1>
        {visibles.length > 0 && (
          <span className="ml-auto text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: `${RED}12`, color: RED, fontFamily: 'var(--font-dm-sans)' }}>
            {visibles.length}
          </span>
        )}
      </div>

      {/* Sin sesión */}
      {!cargando && !autenticado && (
        <div className="flex flex-col items-center py-24 px-8 gap-5 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: 'oklch(0.92 0.02 82)' }}>
            <Heart className="h-8 w-8" style={{ color: 'oklch(0.70 0.03 40)' }} />
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.5rem', letterSpacing: '0.04em', color: 'oklch(0.2 0.03 30)' }}>
              Inicia sesión
            </p>
            <p className="text-sm mt-1" style={DIM}>Para guardar tus productos favoritos</p>
          </div>
          <Link href="/login">
            <button className="px-6 py-3 rounded-2xl text-sm font-semibold"
              style={{ backgroundColor: RED, color: 'oklch(0.97 0.012 82)', fontFamily: 'var(--font-dm-sans)' }}>
              Entrar
            </button>
          </Link>
        </div>
      )}

      {/* Cargando */}
      {cargando && (
        <div className="px-4 py-5 flex flex-wrap gap-3">
          {[1,2,3,4].map(i => <SkeletonProductoCard key={i} />)}
        </div>
      )}

      {/* Sin favoritos */}
      {!cargando && autenticado && visibles.length === 0 && (
        <div className="flex flex-col items-center py-24 px-8 gap-5 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: `${RED}12`, border: `2px dashed ${RED}50` }}>
            <Heart className="h-8 w-8" style={{ color: RED }} />
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.5rem', letterSpacing: '0.04em', color: 'oklch(0.2 0.03 30)' }}>
              Sin favoritos aún
            </p>
            <p className="text-sm mt-1" style={DIM}>
              Toca el corazón en cualquier producto para guardarlo aquí
            </p>
          </div>
          <Link href="/catalogo">
            <button className="px-6 py-3 rounded-2xl text-sm font-semibold"
              style={{ backgroundColor: RED, color: 'oklch(0.97 0.012 82)', fontFamily: 'var(--font-dm-sans)' }}>
              Explorar catálogo
            </button>
          </Link>
        </div>
      )}

      {/* Grid de favoritos */}
      {!cargando && visibles.length > 0 && (
        <div className="px-4 py-5 pb-32 max-w-5xl mx-auto">
          <div className="flex flex-wrap gap-3">
            {visibles.map((p) => (
              <ProductoCard key={p.id} producto={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
