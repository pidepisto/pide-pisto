import { Ratelimit } from '@upstash/ratelimit'
import { Redis }     from '@upstash/redis'

// Redis compartido — una sola conexión reutilizada
const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Distintos límites según la criticidad del endpoint
export const limiters = {
  // Pedidos: 5 por minuto por usuario autenticado
  pedido: new Ratelimit({
    redis,
    limiter:   Ratelimit.slidingWindow(5, '1 m'),
    prefix:    'rl:pedido',
    analytics: false,
  }),
  // Admin: 20 acciones por minuto por IP
  admin: new Ratelimit({
    redis,
    limiter:   Ratelimit.slidingWindow(20, '1 m'),
    prefix:    'rl:admin',
    analytics: false,
  }),
  // Push individual (por cambio de estado de pedido): 60 por minuto por IP
  push: new Ratelimit({
    redis,
    limiter:   Ratelimit.slidingWindow(60, '1 m'),
    prefix:    'rl:push',
    analytics: false,
  }),
  // Broadcast de promos: 10 por hora (evita spam de notificaciones)
  broadcast: new Ratelimit({
    redis,
    limiter:   Ratelimit.slidingWindow(10, '1 h'),
    prefix:    'rl:broadcast',
    analytics: false,
  }),
}

export function getIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'anon'
  )
}
