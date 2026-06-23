import { createClient } from '@/lib/supabase/server'
import ProductoCard from '@/components/tienda/ProductoCard'
import { Tag } from 'lucide-react'

export default async function OfertasPage() {
  const supabase = await createClient()
  const { data: productos } = await supabase
    .from('productos')
    .select('*, categoria:categorias(*)')
    .eq('activo', true)
    .not('precio_oferta', 'is', null)
    .order('nombre')

  return (
    <div style={{ backgroundColor: 'oklch(0.97 0.012 82)', minHeight: '100vh' }}>
      {/* Header */}
      <div className="px-4 pt-5 pb-4 border-b" style={{ borderColor: 'oklch(0.88 0.03 70)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'oklch(0.50 0.22 24 / 0.12)' }}>
            <Tag className="h-4 w-4" style={{ color: 'oklch(0.50 0.22 24)' }} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.8rem', letterSpacing: '0.05em', color: 'oklch(0.2 0.03 30)' }}>
            Ofertas
          </h1>
        </div>
        <p className="text-sm mt-1" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
          Productos con precio especial
        </p>
      </div>

      <div className="px-4 py-6 pb-32">
        {(!productos || productos.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'oklch(0.92 0.02 82)' }}>
              <Tag className="h-8 w-8" style={{ color: 'oklch(0.70 0.03 40)' }} />
            </div>
            <div className="text-center">
              <p style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.5rem', letterSpacing: '0.04em', color: 'oklch(0.2 0.03 30)' }}>
                Sin ofertas por ahora
              </p>
              <p className="text-sm mt-1" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
                Pronto habrá promociones disponibles
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {productos.map((p: any) => <ProductoCard key={p.id} producto={p} />)}
          </div>
        )}
      </div>
    </div>
  )
}
