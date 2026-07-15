'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Clock, CheckCircle, Truck, PackageCheck, XCircle, ChevronRight } from 'lucide-react'
import { fp } from '@/lib/utils'

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
  const router   = useRouter()
  const [pedidos, setPedidos]           = useState<PedidoAdmin[]>([])
  const [filtro,  setFiltro]            = useState('todos')
  const [loading, setLoading]           = useState(true)

  // ── carga pedidos ──
  const cargar = async () => {
    setLoading(true)
    let q = supabase
      .from('pedidos')
      .select(`
        id, estado, total, direccion, created_at, notas, repartidor_id, usuario_id, descuento_aplicado,
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

    // Obtener perfiles de clientes por separado (no hay FK directa pedidos→perfiles)
    const usuarioIds = [...new Set((data ?? []).map((p: any) => p.usuario_id).filter(Boolean))]
    const perfilesMap: Record<string, { nombre: string | null; telefono: string | null }> = {}
    if (usuarioIds.length) {
      const { data: perfs } = await supabase
        .from('perfiles').select('id, nombre, telefono').in('id', usuarioIds)
      for (const p of perfs ?? []) perfilesMap[p.id] = { nombre: p.nombre, telefono: p.telefono }
    }

    const mapped: PedidoAdmin[] = (data ?? []).map((p: any) => ({
      id:                  p.id,
      estado:              p.estado,
      total:               p.total,
      direccion:           p.direccion,
      created_at:          p.created_at,
      notas:               p.notas,
      repartidor_id:       p.repartidor_id,
      descuento_aplicado:  p.descuento_aplicado,
      nombre_cliente:      perfilesMap[p.usuario_id]?.nombre   ?? null,
      telefono_cliente:    perfilesMap[p.usuario_id]?.telefono ?? null,
      nombre_zona:         p.zonas?.nombre ?? null,
      items: (p.pedido_items ?? []).map((i: any) => ({
        cantidad:          i.cantidad,
        precio_unitario:   i.precio_unitario,
        nombre_producto:   i.productos?.nombre ?? 'Producto',
      })),
    }))
    setPedidos(mapped)
    setLoading(false)

  }

  useEffect(() => { cargar() }, [filtro])

  useEffect(() => {
    const canal = supabase.channel('admin-pedidos-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, cargar)
      .subscribe()
    return () => { supabase.removeChannel(canal) }
  }, [filtro])


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
            <button key={p.id} onClick={() => router.push(`/admin/pedidos/${p.id}`)}
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
                {fp(p.total)}
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

