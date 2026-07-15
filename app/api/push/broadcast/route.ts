import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { limiters, getIp } from '@/lib/ratelimit'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(req: NextRequest) {
  const { success } = await limiters.broadcast.limit(getIp(req))
  if (!success) {
    return NextResponse.json({ error: 'Límite de broadcasts excedido (10/hora)' }, { status: 429 })
  }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: perfil } = await supabase.from('perfiles').select('es_admin').eq('id', user.id).single()
  if (!perfil?.es_admin) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { title, body, url = '/', zona_id } = await req.json()
  if (!title?.trim() || !body?.trim()) {
    return NextResponse.json({ error: 'Faltan título y mensaje' }, { status: 400 })
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Obtener suscripciones — si hay zona_id filtra por usuarios de esa zona
  let subs: { endpoint: string; p256dh: string; auth: string }[] = []

  if (zona_id) {
    // Usuarios que tienen al menos un pedido en esa zona
    const { data: pedidosZona } = await admin
      .from('pedidos')
      .select('usuario_id')
      .eq('zona_id', zona_id)
    const uids = [...new Set((pedidosZona ?? []).map((p: any) => p.usuario_id))]
    if (uids.length) {
      const { data } = await admin
        .from('push_subscriptions')
        .select('endpoint, p256dh, auth')
        .in('usuario_id', uids)
      subs = data ?? []
    }
  } else {
    const { data } = await admin
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
    subs = data ?? []
  }

  if (!subs.length) {
    return NextResponse.json({ ok: true, enviadas: 0, total: 0, msg: 'Sin suscriptores activos' })
  }

  const payload = JSON.stringify({ title, body, url })

  // Enviar en lotes de 50 para no saturar
  const LOTE = 50
  let enviadas = 0
  const expiradas: string[] = []

  for (let i = 0; i < subs.length; i += LOTE) {
    const lote = subs.slice(i, i + LOTE)
    const results = await Promise.allSettled(
      lote.map(s =>
        webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload
        )
      )
    )
    for (let j = 0; j < results.length; j++) {
      const r = results[j]
      if (r.status === 'fulfilled') { enviadas++ }
      else if ((r.reason as any)?.statusCode === 410) { expiradas.push(lote[j].endpoint) }
    }
  }

  if (expiradas.length) {
    await admin.from('push_subscriptions').delete().in('endpoint', expiradas)
  }

  return NextResponse.json({ ok: true, enviadas, total: subs.length, expiradas: expiradas.length })
}
