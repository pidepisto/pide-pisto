'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Clock, CheckCircle, Truck, PackageCheck, XCircle, ArrowLeft, Save, Phone } from 'lucide-react'
import { fp } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import TiempoTranscurrido from '@/components/ui/TiempoTranscurrido'
import { toast } from 'sonner'

// ── tipos ──────────────────────────────────────────────────────────────────────
type PedidoDetalle = {
  id: string
  estado: string
  total: number
  direccion: string
  created_at: string
  notas: string | null
  repartidor_id: string | null
  descuento_aplicado: number | null
  usuario_id: string
  nombre_cliente: string | null
  telefono_cliente: string | null
  nombre_zona: string | null
  mp_payment_id: string | null
  mp_status: string | null
  confirmado_en: string | null
  en_camino_desde: string | null
  entregado_en: string | null
  items: { cantidad: number; precio_unitario: number; nombre_producto: string }[]
}

// ── config estados ─────────────────────────────────────────────────────────────
const ESTADOS = ['pendiente', 'confirmado', 'en_camino', 'entregado', 'cancelado'] as const
const EST: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pendiente:      { label: 'Pendiente',       color: 'oklch(0.45 0.10 70)',  bg: 'oklch(0.76 0.14 80 / 0.15)',  icon: <Clock className="h-3.5 w-3.5" /> },
  pendiente_pago: { label: 'Pago en proceso', color: 'oklch(0.45 0.10 70)',  bg: 'oklch(0.76 0.14 80 / 0.15)',  icon: <Clock className="h-3.5 w-3.5" /> },
  pago_fallido:   { label: 'Pago fallido',    color: 'oklch(0.50 0.22 24)',  bg: 'oklch(0.50 0.22 24 / 0.12)', icon: <XCircle className="h-3.5 w-3.5" /> },
  confirmado:     { label: 'Confirmado',      color: 'oklch(0.50 0.22 24)',  bg: 'oklch(0.50 0.22 24 / 0.12)', icon: <CheckCircle className="h-3.5 w-3.5" /> },
  en_camino:      { label: 'En camino',       color: 'oklch(0.35 0.16 145)', bg: 'oklch(0.55 0.18 145 / 0.12)', icon: <Truck className="h-3.5 w-3.5" /> },
  entregado:      { label: 'Entregado',       color: 'oklch(0.35 0.14 145)', bg: 'oklch(0.55 0.18 145 / 0.12)', icon: <PackageCheck className="h-3.5 w-3.5" /> },
  cancelado:      { label: 'Cancelado',       color: 'oklch(0.45 0.04 40)',  bg: 'oklch(0 0 0 / 0.06)',         icon: <XCircle className="h-3.5 w-3.5" /> },
}

const MENSAJES_PUSH: Record<string, { title: string; body: string }> = {
  confirmado: { title: '✅ Pedido confirmado',    body: 'Tu pedido está siendo preparado.' },
  en_camino:  { title: '🛵 Tu pedido va en camino', body: 'El repartidor está en camino.' },
  entregado:  { title: '🎉 ¡Pedido entregado!',   body: '¡Disfrútalo! Gracias por tu compra en Pide Pisto.' },
  cancelado:  { title: '❌ Pedido cancelado',     body: 'Tu pedido fue cancelado. Contáctanos si tienes dudas.' },
}

const CARD: React.CSSProperties = { backgroundColor: 'oklch(1 0 0)', border: '1px solid oklch(0.87 0.03 70)', borderRadius: '1rem' }
const TXT:  React.CSSProperties = { color: 'oklch(0.2 0.03 30)',  fontFamily: 'var(--font-dm-sans)' }
const DIM:  React.CSSProperties = { color: 'oklch(0.48 0.03 40)', fontFamily: 'var(--font-dm-sans)' }
const RED  = 'oklch(0.50 0.22 24)'
const GRN  = 'oklch(0.45 0.15 145)'
const SEL: React.CSSProperties = {
  backgroundColor: 'oklch(0.95 0.015 75)',
  color: 'oklch(0.2 0.03 30)',
  border: '1px solid oklch(0.87 0.03 70)',
  fontFamily: 'var(--font-dm-sans)',
  borderRadius: '0.75rem',
  padding: '0.5rem 0.75rem',
  width: '100%',
  fontSize: '0.875rem',
  outline: 'none',
}

export default function AdminPedidoDetalle() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const supabase = createClient()

  const [pedido,      setPedido]      = useState<PedidoDetalle | null>(null)
  const [repartidores, setReps]       = useState<{ id: string; nombre: string }[]>([])
  const [cargando,    setCargando]    = useState(true)
  const [estado,      setEstado]      = useState('')
  const [repId,       setRepId]       = useState('')
  const [guardando,   setGuardando]   = useState(false)

  useEffect(() => {
    const cargar = async () => {
      // Verificar que es admin
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/admin'); return }
      const { data: perfil } = await supabase.from('perfiles').select('es_admin').eq('id', user.id).single()
      if (!perfil?.es_admin) { router.push('/admin'); return }

      // Cargar pedido
      const { data: p } = await supabase
        .from('pedidos')
        .select(`
          id, estado, total, direccion, created_at, notas, repartidor_id, usuario_id,
          descuento_aplicado, mp_payment_id, mp_status,
          confirmado_en, en_camino_desde, entregado_en,
          zonas(nombre),
          pedido_items(cantidad, precio_unitario, productos(nombre))
        `)
        .eq('id', id)
        .single()

      if (!p) { router.push('/admin/pedidos'); return }

      // Perfil del cliente
      const { data: perf } = await supabase
        .from('perfiles').select('nombre, telefono').eq('id', (p as any).usuario_id).single()

      const mapped: PedidoDetalle = {
        id:                 p.id,
        estado:             p.estado,
        total:              p.total,
        direccion:          p.direccion,
        created_at:         p.created_at,
        notas:              p.notas,
        repartidor_id:      p.repartidor_id,
        descuento_aplicado: p.descuento_aplicado,
        usuario_id:         (p as any).usuario_id,
        mp_payment_id:      (p as any).mp_payment_id ?? null,
        mp_status:          (p as any).mp_status ?? null,
        confirmado_en:      (p as any).confirmado_en ?? null,
        en_camino_desde:    (p as any).en_camino_desde ?? null,
        entregado_en:       (p as any).entregado_en ?? null,
        nombre_cliente:     perf?.nombre ?? null,
        telefono_cliente:   perf?.telefono ?? null,
        nombre_zona:        (p as any).zonas?.nombre ?? null,
        items: ((p as any).pedido_items ?? []).map((i: any) => ({
          cantidad:        i.cantidad,
          precio_unitario: i.precio_unitario,
          nombre_producto: i.productos?.nombre ?? 'Producto',
        })),
      }

      setPedido(mapped)
      setEstado(mapped.estado)
      setRepId(mapped.repartidor_id ?? '')
      setCargando(false)

      const { data: reps } = await supabase.from('perfiles').select('id, nombre').eq('rol', 'repartidor')
      setReps((reps ?? []) as any)
    }
    cargar()

    // Realtime — actualizar si el pedido cambia (desde otra pestaña o webhook MP)
    const canal = supabase.channel(`admin-pedido-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos', filter: `id=eq.${id}` },
        (payload) => {
          setPedido(prev => prev ? { ...prev, ...payload.new } : prev)
          setEstado((payload.new as any).estado ?? '')
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(canal) }
  }, [id])

  const guardar = async () => {
    if (!pedido) return
    setGuardando(true)

    // Solo escribe el timestamp la primera vez que entra a ese estado
    const update: Record<string, any> = { estado, repartidor_id: repId || null }
    const ahora = new Date().toISOString()
    if (estado === 'confirmado' && !pedido.confirmado_en)   update.confirmado_en   = ahora
    if (estado === 'en_camino' && !pedido.en_camino_desde)  update.en_camino_desde = ahora
    if (estado === 'entregado' && !pedido.entregado_en)     update.entregado_en    = ahora

    await supabase.from('pedidos').update(update).eq('id', id)
    toast.success('Pedido actualizado')

    // Push notification si cambia estado
    const msg = MENSAJES_PUSH[estado]
    if (msg && pedido.usuario_id) {
      fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: pedido.usuario_id, title: msg.title, body: msg.body, url: `/pedidos/${id}` }),
      }).catch(() => {})
    }

    setGuardando(false)
  }

  if (cargando) {
    return (
      <div className="p-5 flex flex-col gap-4 max-w-2xl animate-pulse">
        {[1,2,3].map(i => (
          <div key={i} className="h-28 rounded-2xl" style={{ backgroundColor: 'oklch(0.93 0.02 75)' }} />
        ))}
      </div>
    )
  }

  if (!pedido) return null

  const cfg     = EST[pedido.estado] ?? EST['pendiente']
  const subtotal = pedido.items.reduce((a, i) => a + i.precio_unitario * i.cantidad, 0)

  return (
    <div className="p-5 flex flex-col gap-5 max-w-2xl">

      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={() => router.push('/admin/pedidos')}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors mt-0.5"
          style={{ backgroundColor: 'oklch(1 0 0)', border: '1px solid oklch(0.87 0.03 70)', color: 'oklch(0.40 0.03 40)' }}>
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.8rem', letterSpacing: '0.05em', color: 'oklch(0.2 0.03 30)', lineHeight: 1 }}>
            Pedido #{pedido.id.slice(-6).toUpperCase()}
          </h1>
          <p className="text-xs mt-0.5" style={DIM}>
            {new Date(pedido.created_at).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' })}
            {pedido.nombre_zona && <> · {pedido.nombre_zona}</>}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-sm font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5"
            style={{ backgroundColor: cfg.bg, color: cfg.color, fontFamily: 'var(--font-dm-sans)' }}>
            {cfg.icon} {cfg.label}
          </span>
          {pedido.estado === 'en_camino' && pedido.en_camino_desde && (
            <TiempoTranscurrido fecha={pedido.en_camino_desde}
              className="text-[11px]" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }} />
          )}
          {pedido.estado === 'confirmado' && pedido.confirmado_en && (
            <TiempoTranscurrido fecha={pedido.confirmado_en}
              className="text-[11px]" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }} />
          )}
        </div>
      </div>

      {/* Pago MP — solo si hay datos */}
      {pedido.mp_payment_id && (
        <div className="rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{ backgroundColor: 'oklch(0.55 0.18 145 / 0.08)', border: '1px solid oklch(0.55 0.18 145 / 0.25)' }}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: GRN, fontFamily: 'var(--font-dm-sans)' }}>
              MercadoPago · {pedido.mp_status === 'approved' ? '✅ Aprobado' : pedido.mp_status ?? 'Pendiente'}
            </p>
            <p className="text-xs" style={DIM}>ID de pago: {pedido.mp_payment_id}</p>
          </div>
        </div>
      )}

      {/* Cliente */}
      <div className="rounded-2xl p-4 flex flex-col gap-3" style={CARD}>
        <p className="text-xs font-semibold uppercase tracking-wider" style={DIM}>Cliente</p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'oklch(0.50 0.22 24 / 0.12)' }}>
            <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.1rem', color: RED }}>
              {(pedido.nombre_cliente ?? 'C').charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={TXT}>{pedido.nombre_cliente ?? 'Anónimo'}</p>
            {pedido.telefono_cliente && (
              <a href={`tel:${pedido.telefono_cliente}`}
                className="text-xs flex items-center gap-1 mt-0.5 w-fit"
                style={{ color: RED, fontFamily: 'var(--font-dm-sans)' }}>
                <Phone className="h-3 w-3" /> {pedido.telefono_cliente}
              </a>
            )}
          </div>
          {pedido.telefono_cliente && (
            <a href={`https://wa.me/52${pedido.telefono_cliente.replace(/\D/g, '')}`}
              target="_blank" rel="noopener noreferrer"
              className="text-xs font-semibold px-3 py-1.5 rounded-xl"
              style={{ backgroundColor: 'oklch(0.55 0.18 145 / 0.12)', color: GRN, fontFamily: 'var(--font-dm-sans)' }}>
              WhatsApp
            </a>
          )}
        </div>
        <div className="h-px" style={{ backgroundColor: 'oklch(0.91 0.02 75)' }} />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={DIM}>Dirección</p>
          <p className="text-sm" style={TXT}>{pedido.direccion}</p>
          {pedido.notas && (
            <p className="text-xs mt-2 px-3 py-2 rounded-xl"
              style={{ backgroundColor: 'oklch(0.76 0.14 80 / 0.15)', color: 'oklch(0.40 0.06 70)', fontFamily: 'var(--font-dm-sans)' }}>
              📝 {pedido.notas}
            </p>
          )}
        </div>
      </div>

      {/* Productos */}
      <div className="rounded-2xl overflow-hidden" style={CARD}>
        <div className="px-4 py-3 border-b" style={{ borderColor: 'oklch(0.90 0.02 75)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={DIM}>Productos</p>
        </div>
        <div className="px-4 py-3 flex flex-col gap-2.5">
          {pedido.items.map((item, i) => (
            <div key={i} className="flex justify-between items-center text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              <span style={TXT}>{item.nombre_producto} <span style={DIM}>× {item.cantidad}</span></span>
              <span style={{ ...TXT, fontWeight: 600 }}>{fp(item.precio_unitario * item.cantidad)}</span>
            </div>
          ))}
          <div className="h-px mt-1" style={{ backgroundColor: 'oklch(0.90 0.02 75)' }} />
          {pedido.descuento_aplicado ? (
            <>
              <div className="flex justify-between text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                <span style={DIM}>Subtotal</span><span style={DIM}>{fp(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                <span style={{ color: GRN }}>Descuento</span>
                <span style={{ color: GRN, fontWeight: 600 }}>-{fp(pedido.descuento_aplicado)}</span>
              </div>
            </>
          ) : null}
          <div className="flex justify-between items-center pt-0.5">
            <span className="text-sm font-semibold" style={TXT}>Total</span>
            <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.7rem', letterSpacing: '0.03em', color: RED }}>
              {fp(pedido.total)}
            </span>
          </div>
        </div>
      </div>

      {/* Gestión */}
      <div className="rounded-2xl p-4 flex flex-col gap-4" style={CARD}>
        <p className="text-xs font-semibold uppercase tracking-wider" style={DIM}>Gestión del pedido</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold" style={DIM}>Estado</label>
            <select value={estado} onChange={e => setEstado(e.target.value)} style={SEL}>
              {ESTADOS.map(e => <option key={e} value={e}>{EST[e].label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold" style={DIM}>Repartidor</label>
            <select value={repId} onChange={e => setRepId(e.target.value)} style={SEL}>
              <option value="">Sin asignar</option>
              {repartidores.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
            </select>
          </div>
        </div>
        <Button onClick={guardar} disabled={guardando} className="gap-2 border-0 self-start"
          style={{ backgroundColor: RED, color: 'oklch(0.97 0.012 82)', fontFamily: 'var(--font-dm-sans)' }}>
          <Save className="h-4 w-4" />{guardando ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </div>

    </div>
  )
}
