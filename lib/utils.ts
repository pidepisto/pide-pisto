import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Formatea un precio en pesos mexicanos: $1,234.50 MXN */
export function fp(n: number): string {
  const hasCents = n % 1 !== 0
  return '$' + n.toLocaleString('en-US', {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  }) + ' MXN'
}

/** "hace 8 min", "hace 2 h", "justo ahora" — para timestamps de seguimiento de pedidos */
export function tiempoTranscurrido(fecha: string | Date): string {
  const ms  = Date.now() - new Date(fecha).getTime()
  const min = Math.floor(ms / 60_000)
  if (min < 1)  return 'justo ahora'
  if (min < 60) return `hace ${min} min`
  const horas = Math.floor(min / 60)
  if (horas < 24) return `hace ${horas} h`
  const dias = Math.floor(horas / 24)
  return `hace ${dias} d`
}
