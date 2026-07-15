'use client'

import { useEffect, useState } from 'react'
import { tiempoTranscurrido } from '@/lib/utils'

/** Texto "hace 8 min" que se refresca solo cada 30s, sin recargar la página */
export default function TiempoTranscurrido({ fecha, className, style }: { fecha: string | Date; className?: string; style?: React.CSSProperties }) {
  const [, forzar] = useState(0)

  useEffect(() => {
    const t = setInterval(() => forzar(n => n + 1), 30_000)
    return () => clearInterval(t)
  }, [])

  return <span className={className} style={style}>{tiempoTranscurrido(fecha)}</span>
}
