import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

import { limiters, getIp } from '@/lib/ratelimit'

// Solo admins pueden llamar este endpoint
export async function POST(req: NextRequest) {
  const { success } = await limiters.push.limit(getIp(req))
  if (!success) {
    return NextResponse.json({ error: 'Rate limit excedido' }, { status: 429 })
  }
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  // Verificar que es admin
  const { data: perfil } = await supabase.from('perfiles').select('es_admin, rol').eq('id', user.id).single()
  if (!perfil?.es_admin) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { usuario_id, title, body, url = '/' } = await req.json()
  if (!usuario_id || !title || !body) {
    return NextResponse.json({ error: 'Faltan campos: usuario_id, title, body' }, { status: 400 })
  }

  // Usar service role para leer push_subscriptions de cualquier usuario
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: subs } = await admin.from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('usuario_id', usuario_id)

  if (!subs || subs.length === 0) {
    return NextResponse.json({ ok: true, enviadas: 0, msg: 'Sin suscripciones activas' })
  }

  const payload = JSON.stringify({ title, body, url })
  const results = await Promise.allSettled(
    subs.map((s) =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload
      )
    )
  )

  // Limpiar suscripciones expiradas (410 Gone)
  const expiradas = results
    .map((r, i) => ({ r, sub: subs[i] }))
    .filter(({ r }) => r.status === 'rejected' && (r.reason as any)?.statusCode === 410)

  if (expiradas.length) {
    await admin.from('push_subscriptions')
      .delete()
      .in('endpoint', expiradas.map(({ sub }) => sub.endpoint))
  }

  const enviadas = results.filter((r) => r.status === 'fulfilled').length
  return NextResponse.json({ ok: true, enviadas, total: subs.length })
}
