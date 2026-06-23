import { createClient } from '@/lib/supabase/server'
import CatalogoCliente from './CatalogoCliente'

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
