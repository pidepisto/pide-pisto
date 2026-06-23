'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, ClipboardList, CheckCircle, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useCarrito } from '@/lib/store/carrito'
import { useDirecciones } from '@/lib/hooks/useDirecciones'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import DireccionesPanel from '@/components/tienda/DireccionesPanel'
import { AplicarCupon } from '@/components/tienda/AplicarCupon'
import type { Cupon } from '@/lib/types'

export default function CheckoutPage() {
  const router = useRouter()
  const supabase = createClient()
  const { items, total, limpiar } = useCarrito()
  const { activa, direcciones, cargando: cargandoDirs } = useDirecciones()
  const [notas, setNotas] = useState('')
  const [loading, setLoading] = useState(false)
  const [panelDir, setPanelDir] = useState(false)
  const [usuarioId, setUsuarioId] = useState<string | null>(null)
  const [cupon, setCupon] = useState<Cupon | null>(null)
  const [descuento, setDescuento] = useState(0)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUsuarioId(user.id)
    })
  }, [])

  const [pedidoConfirmado, setPedidoConfirmado] = useState(false)

  useEffect(() => {
    if (items.length === 0 && !pedidoConfirmado) router.push('/catalogo')
  }, [items, pedidoConfirmado])

  const confirmarPedido = async () => {
    if (!activa || !usuarioId) return
    setLoading(true)

    // Buscar zona_id
    const { data: zona } = await supabase
      .from('zonas')
      .select('id')
      .eq('nombre', activa.zona)
      .single()

    if (!zona) {
      toast.error('No encontramos la zona de entrega')
      setLoading(false)
      return
    }

    const direccionCompleta = `${activa.calle} ${activa.numero}, ${activa.colonia}, CP ${activa.cp}${activa.referencia ? ` — ${activa.referencia}` : ''}`

    // Crear pedido
    const { data: pedido, error } = await supabase
      .from('pedidos')
      .insert({
        usuario_id: usuarioId,
        zona_id: zona.id,
        direccion: direccionCompleta,
        total: Math.max(0, total() - descuento),
        cupon_id: cupon?.id ?? null,
        descuento_aplicado: descuento || null,
        estado: 'pendiente',
        metodo_pago: 'por_definir',
        notas: notas.trim() || null,
      })
      .select()
      .single()

    if (error || !pedido) {
      toast.error('Error al crear el pedido')
      setLoading(false)
      return
    }

    // Insertar items
    const itemsInsert = items.map((i) => ({
      pedido_id: pedido.id,
      producto_id: i.producto.id,
      cantidad: i.cantidad,
      precio_unitario: i.producto.precio,
    }))

    const { error: errorItems } = await supabase.from('pedido_items').insert(itemsInsert)

    if (cupon) {
      await supabase.from('cupones').update({ usos_actuales: cupon.usos_actuales + 1 }).eq('id', cupon.id)
    }

    if (errorItems) {
      toast.error('Error al guardar los productos')
      setLoading(false)
      return
    }

    setPedidoConfirmado(true)
    limpiar()
    router.push(`/pedidos/${pedido.id}?nuevo=1`)
  }

  if (items.length === 0 && !pedidoConfirmado) return null

  return (
    <div style={{ backgroundColor: 'oklch(0.97 0.012 82)', minHeight: '100vh' }}>

      {/* Header */}
      <div
        className="sticky top-14 z-30 px-4 py-4 border-b flex items-center gap-3"
        style={{ backgroundColor: 'oklch(0.97 0.012 82)', borderColor: 'oklch(0.88 0.03 70)' }}
      >
        <Link href="/carrito">
          <button className="p-2 rounded-xl hover:bg-black/5 transition-colors">
            <ArrowLeft className="h-5 w-5" style={{ color: 'oklch(0.50 0.22 24)' }} />
          </button>
        </Link>
        <h1 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.8rem', letterSpacing: '0.04em', color: 'oklch(0.2 0.03 30)' }}>
          Confirmar pedido
        </h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-5 pb-40">

        {/* Dirección de entrega */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: 'oklch(1 0 0)', border: '1px solid oklch(0.88 0.03 70)' }}
        >
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: 'oklch(0.92 0.02 82)' }}
          >
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" style={{ color: 'oklch(0.50 0.22 24)' }} />
              <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.1rem', letterSpacing: '0.04em', color: 'oklch(0.2 0.03 30)' }}>
                Dirección de entrega
              </span>
            </div>
            <button
              onClick={() => setPanelDir(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors hover:bg-black/5"
              style={{ color: 'oklch(0.50 0.22 24)', fontFamily: 'var(--font-dm-sans)' }}
            >
              Cambiar
            </button>
          </div>

          <div className="px-4 py-4">
            {cargandoDirs ? (
              <p className="text-sm" style={{ color: 'oklch(0.65 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>Cargando…</p>
            ) : activa ? (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold" style={{ color: 'oklch(0.2 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>
                    {activa.alias}
                  </span>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: activa.zona === 'Chalco' ? 'oklch(0.50 0.22 24 / 0.1)' : 'oklch(0.55 0.18 145 / 0.1)',
                      color: activa.zona === 'Chalco' ? 'oklch(0.50 0.22 24)' : 'oklch(0.45 0.15 145)',
                      fontFamily: 'var(--font-dm-sans)',
                    }}
                  >
                    {activa.zona}
                  </span>
                </div>
                <p className="text-sm" style={{ color: 'oklch(0.35 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>
                  {activa.calle} {activa.numero}, {activa.colonia}
                </p>
                <p className="text-xs" style={{ color: 'oklch(0.60 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
                  CP {activa.cp}{activa.referencia ? ` · ${activa.referencia}` : ''}
                </p>
              </div>
            ) : (
              <button
                onClick={() => setPanelDir(true)}
                className="flex items-center gap-2 text-sm font-semibold"
                style={{ color: 'oklch(0.50 0.22 24)', fontFamily: 'var(--font-dm-sans)' }}
              >
                <Plus className="h-4 w-4" /> Agregar dirección de entrega
              </button>
            )}
          </div>
        </div>

        {/* Resumen de productos */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: 'oklch(1 0 0)', border: '1px solid oklch(0.88 0.03 70)' }}
        >
          <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: 'oklch(0.92 0.02 82)' }}>
            <ClipboardList className="h-4 w-4" style={{ color: 'oklch(0.50 0.22 24)' }} />
            <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.1rem', letterSpacing: '0.04em', color: 'oklch(0.2 0.03 30)' }}>
              Tu pedido
            </span>
          </div>
          <div className="px-4 py-3 flex flex-col gap-2">
            {items.map(({ producto, cantidad }) => (
              <div key={producto.id} className="flex justify-between text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                <span style={{ color: 'oklch(0.35 0.03 30)' }}>{producto.nombre} × {cantidad}</span>
                <span style={{ color: 'oklch(0.2 0.03 30)', fontWeight: 600 }}>${(producto.precio * cantidad).toFixed(0)}</span>
              </div>
            ))}
            <div className="h-px mt-1" style={{ backgroundColor: 'oklch(0.90 0.02 82)' }} />
            {descuento > 0 && (
              <div className="flex justify-between text-sm">
                <span style={{ color: 'oklch(0.45 0.15 145)', fontFamily: 'var(--font-dm-sans)' }}>Descuento ({cupon?.codigo})</span>
                <span style={{ color: 'oklch(0.45 0.15 145)', fontFamily: 'var(--font-dm-sans)', fontWeight: 600 }}>-${descuento.toFixed(0)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold" style={{ color: 'oklch(0.2 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>Total</span>
              <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.5rem', letterSpacing: '0.03em', color: 'oklch(0.50 0.22 24)' }}>
                ${Math.max(0, total() - descuento).toFixed(0)}
              </span>
            </div>
          </div>
        </div>

        {/* Cupón */}
        <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ backgroundColor: 'oklch(1 0 0)', border: '1px solid oklch(0.88 0.03 70)' }}>
          <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.1rem', letterSpacing: '0.04em', color: 'oklch(0.2 0.03 30)' }}>Cupón de descuento</span>
          <AplicarCupon subtotal={total()} cuponAplicado={cupon} onAplicar={(c, d) => { setCupon(c); setDescuento(d) }} onRemover={() => { setCupon(null); setDescuento(0) }} />
        </div>

        {/* Notas */}
        <div
          className="rounded-2xl p-4 flex flex-col gap-3"
          style={{ backgroundColor: 'oklch(1 0 0)', border: '1px solid oklch(0.88 0.03 70)' }}
        >
          <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.1rem', letterSpacing: '0.04em', color: 'oklch(0.2 0.03 30)' }}>
            Notas para el repartidor
          </span>
          <textarea
            placeholder="Instrucciones especiales, timbre, etc…"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
            style={{
              backgroundColor: 'oklch(0.95 0.01 82)',
              border: '1px solid oklch(0.88 0.03 70)',
              color: 'oklch(0.2 0.03 30)',
              fontFamily: 'var(--font-dm-sans)',
            }}
          />
        </div>

        {/* Método de pago — placeholder */}
        <div
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{ backgroundColor: 'oklch(0.76 0.14 80 / 0.1)', border: '1px solid oklch(0.76 0.14 80 / 0.3)' }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'oklch(0.76 0.14 80)' }}
          >
            <span style={{ fontSize: '1rem' }}>💳</span>
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'oklch(0.2 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>
              Método de pago
            </p>
            <p className="text-xs" style={{ color: 'oklch(0.48 0.03 40)', fontFamily: 'var(--font-dm-sans)' }}>
              Próximamente: Clip, efectivo y más
            </p>
          </div>
        </div>
      </div>

      {/* CTA fijo */}
      <div
        className="fixed bottom-0 left-0 right-0 p-4 border-t"
        style={{ backgroundColor: 'oklch(0.97 0.012 82)', borderColor: 'oklch(0.88 0.03 70)' }}
      >
        <div className="max-w-2xl mx-auto">
          <Button
            size="lg"
            className="w-full gap-2 border-0 font-semibold text-base"
            disabled={!activa || loading}
            onClick={confirmarPedido}
            style={{
              backgroundColor: activa ? 'oklch(0.50 0.22 24)' : 'oklch(0.88 0.03 70)',
              color: activa ? 'oklch(0.97 0.012 82)' : 'oklch(0.65 0.02 40)',
              fontFamily: 'var(--font-dm-sans)',
            }}
          >
            {loading ? 'Confirmando…' : (
              <>
                <CheckCircle className="h-5 w-5" />
                {activa ? `Confirmar pedido · $${Math.max(0, total() - descuento).toFixed(0)}` : 'Agrega una dirección para continuar'}
              </>
            )}
          </Button>
        </div>
      </div>

      {panelDir && <DireccionesPanel onCerrar={() => setPanelDir(false)} />}
    </div>
  )
}
