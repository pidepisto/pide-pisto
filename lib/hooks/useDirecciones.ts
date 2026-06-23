'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export type Direccion = {
  id: string
  alias: string
  calle: string
  numero: string
  colonia: string
  cp: string
  zona: string
  referencia?: string
  es_principal: boolean
}

const STORAGE_KEY = 'pp-direcciones'

function generarId() {
  return Math.random().toString(36).slice(2, 10)
}

export function useDirecciones() {
  const supabase = createClient()
  const [direcciones, setDirecciones] = useState<Direccion[]>([])
  const [activa, setActiva] = useState<Direccion | null>(null)
  const [usuarioId, setUsuarioId] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)

  // Detectar si está logueado
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUsuarioId(user?.id ?? null)
    })
  }, [])

  // Cargar direcciones
  const cargar = useCallback(async () => {
    setCargando(true)
    if (usuarioId) {
      const { data } = await supabase
        .from('direcciones')
        .select('*')
        .eq('usuario_id', usuarioId)
        .order('es_principal', { ascending: false })
        .order('created_at', { ascending: true })
      const dirs = (data ?? []) as Direccion[]
      setDirecciones(dirs)
      setActiva(dirs.find((d) => d.es_principal) ?? dirs[0] ?? null)
    } else {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as Direccion[]
        setDirecciones(saved)
        setActiva(saved.find((d) => d.es_principal) ?? saved[0] ?? null)
      } catch {
        setDirecciones([])
        setActiva(null)
      }
    }
    setCargando(false)
  }, [usuarioId])

  useEffect(() => {
    if (usuarioId !== undefined) cargar()
  }, [usuarioId, cargar])

  const agregar = async (nueva: Omit<Direccion, 'id' | 'es_principal'>) => {
    const esPrimera = direcciones.length === 0
    if (usuarioId) {
      const { data, error } = await supabase
        .from('direcciones')
        .insert({ ...nueva, usuario_id: usuarioId, es_principal: esPrimera })
        .select()
        .single()
      if (!error && data) {
        await cargar()
        return data as Direccion
      }
    } else {
      const nueva_: Direccion = { ...nueva, id: generarId(), es_principal: esPrimera }
      const actualizadas = [...direcciones, nueva_]
      setDirecciones(actualizadas)
      if (esPrimera) setActiva(nueva_)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(actualizadas))
      return nueva_
    }
    return null
  }

  const eliminar = async (id: string) => {
    if (usuarioId) {
      await supabase.from('direcciones').delete().eq('id', id).eq('usuario_id', usuarioId)
      await cargar()
    } else {
      const actualizadas = direcciones.filter((d) => d.id !== id)
      if (actualizadas.length > 0 && !actualizadas.find((d) => d.es_principal)) {
        actualizadas[0].es_principal = true
      }
      setDirecciones(actualizadas)
      setActiva(actualizadas.find((d) => d.es_principal) ?? actualizadas[0] ?? null)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(actualizadas))
    }
  }

  const seleccionarActiva = async (id: string) => {
    const dir = direcciones.find((d) => d.id === id)
    if (!dir) return
    setActiva(dir)
    if (usuarioId) {
      await supabase.from('direcciones').update({ es_principal: false }).eq('usuario_id', usuarioId)
      await supabase.from('direcciones').update({ es_principal: true }).eq('id', id).eq('usuario_id', usuarioId)
      await cargar()
    } else {
      const actualizadas = direcciones.map((d) => ({ ...d, es_principal: d.id === id }))
      setDirecciones(actualizadas)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(actualizadas))
    }
  }

  return { direcciones, activa, cargando, agregar, eliminar, seleccionarActiva, recargar: cargar }
}
