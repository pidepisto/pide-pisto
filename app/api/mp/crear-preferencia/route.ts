import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { pedido_id } = await req.json()
  if (!pedido_id) return NextResponse.json({ error: 'Falta pedido_id' }, { status: 400 })

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Leer Access Token desde la DB (configurado en /admin/configuracion)
  const { data: cfg } = await admin.from('configuracion').select('mp_access_token').single()
  const accessToken = cfg?.mp_access_token ?? process.env.MP_ACCESS_TOKEN
  if (!accessToken) return NextResponse.json({ error: 'MercadoPago no configurado. Agrega tu Access Token en Configuración.' }, { status: 503 })

  const mp = new MercadoPagoConfig({ accessToken })

  // Verificar que el pedido pertenece al usuario y está pendiente
  const { data: pedido } = await admin
    .from('pedidos')
    .select('id, total, estado, usuario_id, pedido_items(cantidad, precio_unitario, productos(nombre))')
    .eq('id', pedido_id)
    .eq('usuario_id', user.id)
    .single()

  if (!pedido) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
  if (pedido.estado !== 'pendiente') return NextResponse.json({ error: 'El pedido ya fue procesado' }, { status: 400 })

  const { data: perfil } = await admin.from('perfiles').select('nombre, telefono').eq('id', user.id).single()

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `https://${req.headers.get('host')}`

  const preference = new Preference(mp)
  const { id: preferenceId } = await preference.create({
    body: {
      external_reference: pedido_id,
      items: (pedido.pedido_items as any[]).map((item) => ({
        id:          item.producto_id ?? item.id ?? '0',
        title:       item.productos?.nombre ?? 'Producto',
        quantity:    item.cantidad,
        unit_price:  Number(item.precio_unitario),
        currency_id: 'MXN',
      })),
      payer: {
        name:  perfil?.nombre ?? undefined,
        phone: perfil?.telefono ? { number: perfil.telefono } : undefined,
      },
      back_urls: {
        success: `${baseUrl}/pedidos/${pedido_id}?pago=exitoso`,
        failure: `${baseUrl}/pedidos/${pedido_id}?pago=fallido`,
        pending: `${baseUrl}/pedidos/${pedido_id}?pago=pendiente`,
      },
      auto_return:        'approved',
      notification_url:  `${baseUrl}/api/mp/webhook`,
      statement_descriptor: 'PIDE PISTO',
      expires:   true,
      expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
    },
  })

  // Obtener preference completo para el init_point
  const prefData = await preference.get({ preferenceId: preferenceId! })

  await admin.from('pedidos').update({ preference_id: preferenceId }).eq('id', pedido_id)

  const isProd = process.env.NODE_ENV === 'production'
  const checkoutUrl = isProd ? prefData.init_point : prefData.sandbox_init_point

  return NextResponse.json({ preference_id: preferenceId, checkout_url: checkoutUrl })
}
