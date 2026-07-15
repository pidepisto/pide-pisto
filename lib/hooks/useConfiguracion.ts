'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type Configuracion = {
  nombre_negocio: string
  telefono_negocio: string | null
  hora_apertura: string // 'HH:MM:SS'
  hora_cierre: string
  tiempo_entrega_min: number
  pedido_minimo: number
  costo_envio: number
}

const DEFAULT_CONFIG: Configuracion = {
  nombre_negocio: 'Pide Pisto',
  telefono_negocio: null,
  hora_apertura: '10:00:00',
  hora_cierre: '23:00:00',
  tiempo_entrega_min: 30,
  pedido_minimo: 0,
  costo_envio: 0,
}

function parseHora(hora: string): number {
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + m
}

/** Calcula si el negocio está abierto ahora mismo, soportando horarios que cruzan medianoche (ej. 18:00–02:00) */
export function estaAbierto(config: Configuracion, ahora = new Date()): boolean {
  const minutosAhora  = ahora.getHours() * 60 + ahora.getMinutes()
  const apertura      = parseHora(config.hora_apertura)
  const cierre        = parseHora(config.hora_cierre)

  if (apertura === cierre) return true // 24 horas
  if (apertura < cierre) {
    // Horario normal, ej. 10:00–23:00
    return minutosAhora >= apertura && minutosAhora < cierre
  }
  // Cruza medianoche, ej. 18:00–02:00
  return minutosAhora >= apertura || minutosAhora < cierre
}

function formatearHora12(hora: string): string {
  const [h, m] = hora.split(':').map(Number)
  const periodo = h >= 12 ? 'pm' : 'am'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return m === 0 ? `${h12}${periodo}` : `${h12}:${String(m).padStart(2, '0')}${periodo}`
}

export function useConfiguracion() {
  const supabase = createClient()
  const [config, setConfig]     = useState<Configuracion>(DEFAULT_CONFIG)
  const [cargando, setCargando] = useState(true)
  const [abierto, setAbierto]   = useState(true)

  useEffect(() => {
    let intervalo: ReturnType<typeof setInterval>

    const cargar = async () => {
      const { data } = await supabase.from('configuracion').select('*').single()
      const cfg: Configuracion = data ? {
        nombre_negocio:     data.nombre_negocio ?? DEFAULT_CONFIG.nombre_negocio,
        telefono_negocio:   data.telefono_negocio ?? null,
        hora_apertura:      data.hora_apertura ?? DEFAULT_CONFIG.hora_apertura,
        hora_cierre:        data.hora_cierre ?? DEFAULT_CONFIG.hora_cierre,
        tiempo_entrega_min: data.tiempo_entrega_min ?? DEFAULT_CONFIG.tiempo_entrega_min,
        pedido_minimo:      data.pedido_minimo ?? 0,
        costo_envio:        data.costo_envio ?? 0,
      } : DEFAULT_CONFIG
      setConfig(cfg)
      setAbierto(estaAbierto(cfg))
      setCargando(false)
    }

    cargar()
    // Revisar cada minuto si cambió el estado abierto/cerrado
    intervalo = setInterval(() => setConfig(c => { setAbierto(estaAbierto(c)); return c }), 60_000)
    return () => clearInterval(intervalo)
  }, [])

  return {
    config,
    cargando,
    abierto,
    horaAperturaTexto: formatearHora12(config.hora_apertura),
    horaCierreTexto:   formatearHora12(config.hora_cierre),
  }
}
