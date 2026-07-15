import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ProductoCard from '@/components/tienda/ProductoCard'
import { Tag } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Ofertas y promociones | Pide Pisto',
  description: 'Aprovecha las mejores ofertas en cervezas, vinos y destilados. Descuentos especiales con entrega a domicilio en Chalco e Ixtapaluca.',
  openGraph: {
    title: 'Ofertas — Pide Pisto',
    description: 'Las mejores ofertas en alcohol a domicilio en Chalco e Ixtapaluca.',
    type: 'website',
  },
}

const RED = 'oklch(0.50 0.22 24)'
const BG  = 'oklch(0.97 0.012 82)'

export default async function OfertasPage() {
  const supabase = await createClient()
  const { data: productos } = await supabase
    .from('productos')
    .select('*, categoria:categorias(*)')
    .eq('activo', true)
    .not('precio_promocion', 'is', null)
    .order('nombre')

  return (
    <div style={{ backgroundColor: BG, minHeight: '100vh' }}>

      {/* Header */}
      <div className="border-b" style={{ borderColor: 'oklch(0.88 0.03 70)' }}>
        <div className="max-w-7xl mx-auto px-4 pt-5 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${RED}12` }}>
              <Tag className="h-4 w-4" style={{ color: RED }} />
            </div>
            <h1 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.8rem', letterSpacing: '0.05em', color: 'oklch(0.2 0.03 30)' }}>
              Ofertas
            </h1>
            {productos && productos.length > 0 && (
              <span className="ml-2 text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: `${RED}12`, color: RED, fontFamily: 'var(--font-dm-sans)' }}>
                {productos.length} producto{productos.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-sm mt-1" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
            Productos con precio especial
          </p>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 py-6 pb-32 md:pb-10">
        {(!productos || productos.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{ backgroundColor: `${RED}12`, border: `2px dashed ${RED}40` }}>
              <Tag className="h-9 w-9" style={{ color: RED }} />
            </div>
            <div className="text-center">
              <p style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.8rem', letterSpacing: '0.04em', color: 'oklch(0.2 0.03 30)' }}>
                Sin ofertas por ahora
              </p>
              <p className="text-sm mt-1" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
                Pronto habrá promociones disponibles
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {productos.map((p: any) => <ProductoCard key={p.id} producto={p} />)}
          </div>
        )}
      </div>
    </div>
  )
}
