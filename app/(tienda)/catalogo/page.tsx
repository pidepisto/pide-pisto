import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import CatalogoCliente from './CatalogoCliente'

export const metadata: Metadata = {
  title: 'Catálogo — Cervezas, vinos y destilados | Pide Pisto',
  description: 'Explora nuestro catálogo de cervezas, vinos, mezcales, tequilas y más. Entrega a domicilio en Chalco e Ixtapaluca, Estado de México.',
  openGraph: {
    title: 'Catálogo — Pide Pisto',
    description: 'Cervezas, vinos y destilados a domicilio en Chalco e Ixtapaluca.',
    type: 'website',
  },
}

export default async function CatalogoPage() {
  const supabase = await createClient()

  const [{ data: categorias }, { data: productos }, { data: banners }] = await Promise.all([
    supabase.from('categorias').select('*').order('orden'),
    supabase.from('productos').select('*, categoria:categorias(*)').eq('activo', true).order('nombre'),
    supabase.from('banners').select('*').eq('activo', true).order('orden'),
  ])

  return (
    <CatalogoCliente
      categorias={categorias ?? []}
      productos={productos ?? []}
      banners={banners ?? []}
    />
  )
}
