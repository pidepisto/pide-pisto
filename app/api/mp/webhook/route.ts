import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function getMp() {
  const { data: cfg } = await admin.from('configuracion').select('mp_access_token').single()
  const accessToken = cfg?.mp_access_token ?? process.env.MP_ACCESS_TOKEN ?? ''
  return new MercadoPagoConfig({ accessToken })
}

// Verifica la firma HMAC que MP envía en el header x-signature
function verificarFirma(req: NextRequest, rawBody: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET
  if (!secret) return true // En dev sin secret, omitir verificación

  const xSignature = req.headers.get('x-signature') ?? ''
  const xRequestId = req.headers.get('x-request-id') ?? ''
  const url = new URL(req.url)
  const dataId = url.searchParams.get('data.id') ?? ''

  // MP firma: ts=...;v1=...
  const parts = Object.fromEntries(xSignature.split(';').map(p => p.split('=')))
  const ts = parts['ts'] ?? ''
  const v1 = parts['v1'] ?? ''

  const message = `id:${dataId};request-id:${xRequestId};ts:${ts};`
  const expected = crypto.createHmac('sha256', secret).update(message).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1))
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  if (!verificarFirma(req, rawBody)) {
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
  }

  const body = JSON.parse(rawBody)

  // MP envía distintos tipos de eventos — solo nos importan los de pago
  if (body.type !== 'payment') {
    return NextResponse.json({ ok: true })
  }

  const paymentId = body.data?.id
  if (!paymentId) return NextResponse.json({ ok: true })

  try {
    const mp = await getMp()
    const payment = new Payment(mp)
    const pago = await payment.get({ id: paymentId })

    const pedidoId        = pago.external_reference
    const status          = pago.status           // approved | pending | rejected
    const statusDetail    = pago.status_detail

    if (!pedidoId) return NextResponse.json({ ok: true })

    // Mapear estado MP → estado pedido
    let estadoPedido: string | null = null
    if (status === 'approved')            estadoPedido = 'pagado'
    else if (status === 'pending' || status === 'in_process') estadoPedido = 'pendiente_pago'
    else if (status === 'rejected' || status === 'cancelled') estadoPedido = 'pago_fallido'

    if (!estadoPedido) return NextResponse.json({ ok: true })

    await admin.from('pedidos').update({
      estado:          estadoPedido,
      mp_payment_id:   String(paymentId),
      mp_status:       status,
      mp_status_detail: statusDetail ?? null,
      ...(status === 'approved' ? { pagado_en: new Date().toISOString() } : {}),
    }).eq('id', pedidoId)

    // Si fue aprobado, actualizar estado a "confirmado" para que el admin lo vea
    if (status === 'approved') {
      await admin.from('pedidos').update({ estado: 'confirmado' }).eq('id', pedidoId)
    }

  } catch (err) {
    console.error('[MP webhook] error al procesar pago', err)
    // Retornar 200 para que MP no reintente indefinidamente
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ ok: true })
}
