'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Clock, CheckCircle, Truck, PackageCheck, XCircle, ChevronRight, ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

// ─── tipos ───────────────────────────────────────────────────────────────────
type PedidoAdmin = {
  id: string
  estado: string
  total: number
  direccion: string
  created_at: string
  notas: string | null
  repartidor_id: string | null
  descuento_aplicado: number | null
  nombre_cliente: string | null
  telefono_cliente: string | null
  nombre_zona: string | null
  items: { cantidad: number; precio_unitario: number; nombre_producto: string }[]
}

// ─── config estados ───────────────────────────────────────────────────────────
const ESTADOS = ['pendiente','confirmado','en_camino','entregado','cancelado'] as const
const EST: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pendiente:  { label: 'Pendiente',  color: 'oklch(0.45 0.10 70)',  bg: 'oklch(0.76 0.14 80 / 0.15)',  icon: <Clock className="h-3.5 w-3.5" /> },
  confirmado: { label: 'Confirmado', color: 'oklch(0.50 0.22 24)',  bg: 'oklch(0.50 0.22 24 / 0.12)',  icon: <CheckCircle className="h-3.5 w-3.5" /> },
  en_camino:  { label: 'En camino',  color: 'oklch(0.35 0.16 145)', bg: 'oklch(0.55 0.18 145 / 0.12)', icon: <Truck className="h-3.5 w-3.5" /> },
  entregado:  { label: 'Entregado',  color: 'oklch(0.35 0.14 145)', bg: 'oklch(0.55 0.18 145 / 0.12)', icon: <PackageCheck className="h-3.5 w-3.5" /> },
  cancelado:  { label: 'Cancelado',  color: 'oklch(0.45 0.04 40)',  bg: 'oklch(0 0 0 / 0.06)',          icon: <XCircle className="h-3.5 w-3.5" /> },
}

// ─── estilos compartidos ──────────────────────────────────────────────────────
const CARD = { backgroundColor: 'oklch(1 0 0)', border: '1px solid oklch(0.87 0.03 70)', borderRadius: '1rem' }
const TXT  = { color: 'oklch(0.2 0.03 30)',  fontFamily: 'var(--font-dm-sans)' }
const DIM  = { color: 'oklch(0.48 0.03 40)', fontFamily: 'var(--font-dm-sans)' }
const RED  = 'oklch(0.50 0.22 24)'
const YEL  = 'oklch(0.76 0.14 80)'
const GRN  = 'oklch(0.45 0.15 145)'

// ─── componente principal ─────────────────────────────────────────────────────
export default function AdminPedidos() {
  const supabase = createClient()
  const [pedidos, setPedidos]           = useState<PedidoAdmin[]>([])
  const [filtro,  setFiltro]            = useState('todos')
  const [detalle, setDetalle]           = useState<PedidoAdmin | null>(null)
  const [repartidores, setRepartidores] = useState<{ id: string; nombre: string }[]>([])
  const [loading, setLoading]           = useState(true)

  // ── carga pedidos ──
  const cargar = async () => {
    setLoading(true)
    let q = supabase
      .from('pedidos')
      .select(`
        id, estado, total, direccion, created_at, notas, repartidor_id, descuento_aplicado,
        perfiles ( nombre, telefono ),
        zonas    ( nombre ),
        pedido_items (
          cantidad, precio_unitario,
          productos ( nombre )
        )
      `)
      .order('created_at', { ascending: false })

    if (filtro !== 'todos') q = q.eq('estado', filtro)
    const { data, error } = await q

    if (error) { console.error(error); toast.error('Error al cargar pedidos'); setLoading(false); return }

    const mapped: PedidoAdmin[] = (data ?? []).map((p: any) => ({
      id:                  p.id,
      estado:              p.estado,
      total:               p.total,
      direccion:           p.direccion,
      created_at:          p.created_at,
      notas:               p.notas,
      repartidor_id:       p.repartidor_id,
      descuento_aplicado:  p.descuento_aplicado,
      nombre_cliente:      p.perfiles?.nombre    ?? null,
      telefono_cliente:    p.perfiles?.telefono  ?? null,
      nombre_zona:         p.zonas?.nombre       ?? null,
      items: (p.pedido_items ?? []).map((i: any) => ({
        cantidad:          i.cantidad,
        precio_unitario:   i.precio_unitario,
        nombre_producto:   i.productos?.nombre ?? 'Producto',
      })),
    }))
    setPedidos(mapped)
    setLoading(false)

    const { data: reps } = await supabase.from('perfiles').select('id, nombre').eq('rol', 'repartidor')
    setRepartidores((reps ?? []) as any)
  }

  useEffect(() => { cargar() }, [filtro])

  useEffect(() => {
    const canal = supabase.channel('admin-pedidos-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, cargar)
      .subscribe()
    return () => { supabase.removeChannel(canal) }
  }, [filtro])

  // ── acciones ──
  const MENSAJES_PUSH: Record<string, { title: string; body: string }> = {
    confirmado: { title: '✅ Pedido confirmado',   body: 'Tu pedido está siendo preparado.' },
    en_camino:  { title: '🛵 Tu pedido va en camino', body: 'El repartidor está en camino con tu pedido.' },
    entregado:  { title: '🎉 ¡Pedido entregado!',  body: '¡Disfrútalo! Gracias por tu compra en Pide Pisto.' },
    cancelado:  { title: '❌ Pedido cancelado',    body: 'Tu pedido fue cancelado. Contáctanos si tienes dudas.' },
  }

  const cambiarEstado = async (id: string, estado: string) => {
    // Obtener usuario del pedido antes de actualizar
    const { data: pedidoData } = await supabase
      .from('pedidos').select('usuario_id').eq('id', id).single()

    await supabase.from('pedidos').update({ estado }).eq('id', id)
    toast.success('Estado actualizado')
    if (detalle?.id === id) setDetalle(prev => prev ? { ...prev, estado } : null)
    cargar()

    // Enviar push si hay mensaje para este estado y el pedido tiene usuario
    const msg = MENSAJES_PUSH[estado]
    if (msg && pedidoData?.usuario_id) {
      fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: pedidoData.usuario_id,
          title: msg.title,
          body: msg.body,
          url: `/pedidos/${id}`,
        }),
      }).catch(() => {}) // silencioso — no bloquear el flujo
    }
  }

  const asignarRep = async (id: string, repId: string) => {
    await supabase.from('pedidos').update({ repartidor_id: repId || null }).eq('id', id)
    toast.success('Repartidor asignado')
    if (detalle?.id === id) setDetalle(prev => prev ? { ...prev, repartidor_id: repId || null } : null)
    cargar()
  }

  // ── vista detalle ──
  if (detalle) return <DetalleView p={detalle} reps={repartidores} onBack={() => setDetalle(null)} onEstado={cambiarEstado} onRep={asignarRep} />

  // ── lista ──
  return (
    <div className="p-5 flex flex-col gap-5">
      {/* Header + filtros */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 style={{ fontFamily: 'var(--font-bebas)', fontSize: '2rem', letterSpacing: '0.05em', color: 'oklch(0.2 0.03 30)' }}>
          Pedidos
        </h1>
        <div className="flex gap-2 flex-wrap">
          {['todos', ...ESTADOS].map(e => (
            <button key={e} onClick={() => setFiltro(e)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all capitalize"
              style={{
                backgroundColor: filtro === e ? RED : 'oklch(1 0 0)',
                color:           filtro === e ? 'oklch(0.97 0.012 82)' : 'oklch(0.40 0.03 40)',
                border:          `1px solid ${filtro === e ? RED : 'oklch(0.87 0.03 70)'}`,
                fontFamily:      'var(--font-dm-sans)',
              }}>
              {e === 'todos' ? 'Todos' : EST[e]?.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <p className="text-sm text-center py-12" style={DIM}>Cargando pedidos…</p>
      )}
      {!loading && pedidos.length === 0 && (
        <div className="flex flex-col items-center py-16 gap-3">
          <ShoppingBagEmpty />
          <p className="text-sm" style={DIM}>No hay pedidos{filtro !== 'todos' ? ` con estado "${EST[filtro]?.label}"` : ''}</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {pedidos.map(p => {
          const cfg = EST[p.estado]
          return (
            <button key={p.id} onClick={() => setDetalle(p)}
              className="w-full text-left rounded-2xl px-4 py-3.5 flex items-center gap-3 transition-all hover:shadow-md"
              style={{ ...CARD, transition: 'box-shadow 0.15s' }}>
              {/* estado color dot */}
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.color }} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold" style={TXT}>#{p.id.slice(-6).toUpperCase()}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
                    style={{ backgroundColor: cfg.bg, color: cfg.color, fontFamily: 'var(--font-dm-sans)' }}>
                    {cfg.icon} {cfg.label}
                  </span>
                  {p.nombre_zona && (
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: 'oklch(0.93 0.025 82)', color: 'oklch(0.45 0.04 40)', fontFamily: 'var(--font-dm-sans)' }}>
                      {p.nombre_zona}
                    </span>
                  )}
                </div>
                <p className="text-xs mt-0.5 truncate" style={DIM}>
                  {p.nombre_cliente ?? 'Cliente'} · {new Date(p.created_at).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                </p>
              </div>

              <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.3rem', letterSpacing: '0.03em', color: RED }}>
                ${p.total.toFixed(0)}
              </span>
              <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: 'oklch(0.70 0.03 40)' }} />
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── empty state icon ──────────────────────────────────────────────────────────
function ShoppingBagEmpty() {
  return (
    <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
      style={{ backgroundColor: 'oklch(0.93 0.025 82)' }}>
      <ShoppingBag className="h-8 w-8" style={{ color: 'oklch(0.70 0.04 40)' }} />
    </div>
  )
}
function ShoppingBag({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
    </svg>
  )
}

// ─── vista detalle ─────────────────────────────────────────────────────────────
function DetalleView({
  p, reps, onBack, onEstado, onRep
}: {
  p: PedidoAdmin
  reps: { id: string; nombre: string }[]
  onBack: () => void
  onEstado: (id: string, e: string) => void
  onRep: (id: string, r: string) => void
}) {
  const [estado,    setEstado]    = useState(p.estado)
  const [repId,     setRepId]     = useState(p.repartidor_id ?? '')
  const [guardando, setGuardando] = useState(false)

  const guardar = async () => {
    setGuardando(true)
    await onEstado(p.id, estado)
    await onRep(p.id, repId)
    setGuardando(false)
  }

  const cfg = EST[estado]
  const subtotal = p.items.reduce((a, i) => a + i.precio_unitario * i.cantidad, 0)

  const SEL = {
    backgroundColor: 'oklch(0.95 0.015 75)',
    color: 'oklch(0.2 0.03 30)',
    border: '1px solid oklch(0.87 0.03 70)',
    fontFamily: 'var(--font-dm-sans)',
    borderRadius: '0.75rem',
    padding: '0.5rem 0.75rem',
    width: '100%',
    fontSize: '0.875rem',
    outline: 'none',
  } as React.CSSProperties

  return (
    <div className="p-5 flex flex-col gap-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
          style={{ backgroundColor: 'oklch(1 0 0)', border: '1px solid oklch(0.87 0.03 70)', color: 'oklch(0.40 0.03 40)' }}>
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.8rem', letterSpacing: '0.05em', color: 'oklch(0.2 0.03 30)' }}>
            Pedido #{p.id.slice(-6).toUpperCase()}
          </h1>
          <p className="text-xs" style={DIM}>{new Date(p.created_at).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' })}</p>
        </div>
        <span className="ml-auto text-sm font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5"
          style={{ backgroundColor: cfg.bg, color: cfg.color, fontFamily: 'var(--font-dm-sans)' }}>
          {cfg.icon} {cfg.label}
        </span>
      </div>

      {/* Cliente + dirección */}
      <div className="rounded-2xl p-4 flex flex-col gap-3" style={CARD}>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ ...DIM }}>Cliente</p>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'oklch(0.50 0.22 24 / 0.12)' }}>
            <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '1rem', color: RED }}>
              {(p.nombre_cliente ?? 'C').charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold" style={TXT}>{p.nombre_cliente ?? 'Anónimo'}</p>
            {p.telefono_cliente && <p className="text-xs" style={DIM}>{p.telefono_cliente}</p>}
          </div>
        </div>
        <div className="h-px" style={{ backgroundColor: 'oklch(0.90 0.02 75)' }} />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={DIM}>Dirección</p>
          <p className="text-sm" style={TXT}>{p.direccion}</p>
          {p.notas && (
            <p className="text-xs mt-1.5 px-3 py-2 rounded-xl" style={{ backgroundColor: 'oklch(0.76 0.14 80 / 0.15)', color: 'oklch(0.40 0.06 70)', fontFamily: 'var(--font-dm-sans)' }}>
              Nota: {p.notas}
            </p>
          )}
        </div>
      </div>

      {/* Productos */}
      <div className="rounded-2xl overflow-hidden" style={CARD}>
        <div className="px-4 py-3 border-b" style={{ borderColor: 'oklch(0.90 0.02 75)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={DIM}>Productos</p>
        </div>
        <div className="px-4 py-3 flex flex-col gap-2">
          {p.items.map((item, i) => (
            <div key={i} className="flex justify-between items-center text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              <span style={TXT}>{item.nombre_producto} <span style={DIM}>× {item.cantidad}</span></span>
              <span style={{ ...TXT, fontWeight: 600 }}>${(item.precio_unitario * item.cantidad).toFixed(0)}</span>
            </div>
          ))}
          <div className="h-px mt-1" style={{ backgroundColor: 'oklch(0.90 0.02 75)' }} />
          {p.descuento_aplicado ? (
            <>
              <div className="flex justify-between text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                <span style={DIM}>Subtotal</span>
                <span style={DIM}>${subtotal.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                <span style={{ color: GRN }}>Descuento cupón</span>
                <span style={{ color: GRN, fontWeight: 600 }}>-${p.descuento_aplicado.toFixed(0)}</span>
              </div>
            </>
          ) : null}
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold" style={TXT}>Total</span>
            <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.6rem', letterSpacing: '0.03em', color: RED }}>
              ${p.total.toFixed(0)}
            </span>
          </div>
        </div>
      </div>

      {/* Acciones */}
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
              {reps.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
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
