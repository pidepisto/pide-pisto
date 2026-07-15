import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { limiters, getIp } from '@/lib/ratelimit'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  // Rate limit por usuario (más justo que por IP con usuarios detrás de NAT)
  const { success } = await limiters.pedido.limit(user.id)
  if (!success) {
    return NextResponse.json({ error: 'Demasiados pedidos en poco tiempo. Espera un momento.' }, { status: 429 })
  }

  const body = await req.json()
  const { items, zona_id, direccion, notas, cupon_codigo } = body

  // ── 1. Validar estructura básica ──────────────────────────────────────────
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'El pedido no tiene productos' }, { status: 400 })
  }
  if (!zona_id || !direccion?.trim()) {
    return NextResponse.json({ error: 'Faltan zona o dirección' }, { status: 400 })
  }

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // ── 2. Verificar productos en BD (precios reales, activos, con stock) ─────
  const productoIds: string[] = items.map((i: any) => i.producto_id)
  const { data: productos, error: prodErr } = await admin
    .from('productos')
    .select('id, nombre, precio, precio_promocion, stock, activo')
    .in('id', productoIds)

  if (prodErr || !productos) {
    return NextResponse.json({ error: 'Error al verificar productos' }, { status: 500 })
  }

  const prodMap = new Map(productos.map(p => [p.id, p]))
  const lineas: { producto_id: string; cantidad: number; precio_unitario: number; nombre: string }[] = []

  for (const item of items) {
    const { producto_id, cantidad } = item
    if (!producto_id || !Number.isInteger(cantidad) || cantidad < 1 || cantidad > 50) {
      return NextResponse.json({ error: 'Cantidad inválida en un producto' }, { status: 400 })
    }
    const prod = prodMap.get(producto_id)
    if (!prod) return NextResponse.json({ error: `Producto no encontrado: ${producto_id}` }, { status: 400 })
    if (!prod.activo) return NextResponse.json({ error: `"${prod.nombre}" ya no está disponible` }, { status: 400 })
    if (prod.stock < cantidad) return NextResponse.json({ error: `Stock insuficiente para "${prod.nombre}"` }, { status: 400 })

    // Precio real de la BD — usa precio_promocion si existe
    const precio = prod.precio_promocion ?? prod.precio
    lineas.push({ producto_id, cantidad, precio_unitario: precio, nombre: prod.nombre })
  }

  // ── 3. Calcular subtotal con precios de BD ────────────────────────────────
  const subtotal = lineas.reduce((s, l) => s + l.precio_unitario * l.cantidad, 0)

  // ── 4. Validar zona y costo de envío ─────────────────────────────────────
  const { data: zona, error: zonaErr } = await admin
    .from('zonas')
    .select('id, nombre, activa, costo_envio, envio_gratis_desde')
    .eq('id', zona_id)
    .single()

  if (zonaErr || !zona) return NextResponse.json({ error: 'Zona no válida' }, { status: 400 })
  if (!zona.activa) return NextResponse.json({ error: 'La zona no está disponible actualmente' }, { status: 400 })

  const costoEnvio = (zona.envio_gratis_desde !== null && subtotal >= zona.envio_gratis_desde)
    ? 0
    : (zona.costo_envio ?? 0)

  // ── 5. Validar cupón (si aplica) ──────────────────────────────────────────
  let descuento = 0
  let cuponId: string | null = null

  if (cupon_codigo?.trim()) {
    const hoy = new Date().toISOString().split('T')[0]
    const { data: cupon } = await admin
      .from('cupones')
      .select('id, tipo, valor, minimo_compra, limite_usos, usos_actuales, fecha_inicio, fecha_fin, activo')
      .eq('codigo', cupon_codigo.trim().toUpperCase())
      .single()

    if (!cupon || !cupon.activo) {
      return NextResponse.json({ error: 'Cupón no válido o inactivo' }, { status: 400 })
    }
    if (cupon.fecha_inicio && hoy < cupon.fecha_inicio) {
      return NextResponse.json({ error: 'El cupón aún no está activo' }, { status: 400 })
    }
    if (cupon.fecha_fin && hoy > cupon.fecha_fin) {
      return NextResponse.json({ error: 'El cupón ha expirado' }, { status: 400 })
    }
    if (cupon.limite_usos !== null && cupon.usos_actuales >= cupon.limite_usos) {
      return NextResponse.json({ error: 'El cupón ya alcanzó su límite de usos' }, { status: 400 })
    }
    if (subtotal < cupon.minimo_compra) {
      return NextResponse.json({ error: `El cupón requiere compra mínima de $${cupon.minimo_compra}` }, { status: 400 })
    }

    descuento = cupon.tipo === 'porcentaje'
      ? Math.min(subtotal, (subtotal * cupon.valor) / 100)
      : Math.min(subtotal, cupon.valor)
    descuento = Math.round(descuento * 100) / 100
    cuponId   = cupon.id
  }

  const totalFinal = Math.max(0, Math.round((subtotal - descuento + costoEnvio) * 100) / 100)

  // ── 6. Insertar pedido ────────────────────────────────────────────────────
  const { data: pedido, error: pedErr } = await admin.from('pedidos').insert({
    usuario_id:         user.id,
    zona_id:            zona.id,
    direccion:          direccion.trim(),
    total:              totalFinal,
    costo_envio:        costoEnvio,
    cupon_id:           cuponId,
    descuento_aplicado: descuento || null,
    estado:             'pendiente',
    metodo_pago:        'por_definir',
    notas:              notas?.trim() || null,
  }).select('id').single()

  if (pedErr || !pedido) {
    return NextResponse.json({ error: 'Error al crear el pedido' }, { status: 500 })
  }

  // ── 7. Insertar líneas ────────────────────────────────────────────────────
  const { error: itemsErr } = await admin.from('pedido_items').insert(
    lineas.map(l => ({ pedido_id: pedido.id, producto_id: l.producto_id, cantidad: l.cantidad, precio_unitario: l.precio_unitario }))
  )

  if (itemsErr) {
    // Revertir pedido si fallan los items
    await admin.from('pedidos').delete().eq('id', pedido.id)
    return NextResponse.json({ error: 'Error al guardar los productos' }, { status: 500 })
  }

  // ── 8. Incrementar usos del cupón ─────────────────────────────────────────
  if (cuponId) {
    const { error: rpcError } = await admin.rpc('incrementar_usos_cupon', { cupon_uuid: cuponId })
    if (rpcError) {
      const { data } = await admin.from('cupones').select('usos_actuales').eq('id', cuponId).single()
      if (data) await admin.from('cupones').update({ usos_actuales: data.usos_actuales + 1 }).eq('id', cuponId)
    }
  }

  return NextResponse.json({ ok: true, pedido_id: pedido.id, total: totalFinal })
}
