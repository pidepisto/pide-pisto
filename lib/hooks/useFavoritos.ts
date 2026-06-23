'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useFavoritos() {
  const supabase = createClient()
  const [ids, setIds]           = useState<Set<string>>(new Set())
  const [usuarioId, setUsuarioId] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUsuarioId(user?.id ?? null))
  }, [])

  const cargar = useCallback(async () => {
    if (!usuarioId) { setCargando(false); return }
    const { data } = await supabase
      .from('favoritos')
      .select('producto_id')
      .eq('usuario_id', usuarioId)
    setIds(new Set((data ?? []).map((f: any) => f.producto_id)))
    setCargando(false)
  }, [usuarioId])

  useEffect(() => { cargar() }, [cargar])

  const toggle = useCallback(async (productoId: string) => {
    if (!usuarioId) return false // no autenticado

    const esFav = ids.has(productoId)
    // Optimistic update
    setIds(prev => {
      const next = new Set(prev)
      esFav ? next.delete(productoId) : next.add(productoId)
      return next
    })

    if (esFav) {
      await supabase.from('favoritos').delete()
        .eq('usuario_id', usuarioId).eq('producto_id', productoId)
    } else {
      await supabase.from('favoritos').insert({ usuario_id: usuarioId, producto_id: productoId })
    }

    return !esFav
  }, [ids, usuarioId])

  const esFavorito = useCallback((productoId: string) => ids.has(productoId), [ids])

  return { esFavorito, toggle, cargando, autenticado: !!usuarioId }
}
