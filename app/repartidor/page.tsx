'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MapPin, Phone, CheckCircle, Clock, Truck, Package, MessageCircle } from 'lucide-react'
import { fp, tiempoTranscurrido } from '@/lib/utils'
import { toast } from 'sonner'

const RED = 'oklch(0.50 0.22 24)'
const GRN = 'oklch(0.45 0.15 145)'
const YEL = 'oklch(0.55 0.10 80)'
const BG  = 'oklch(0.97 0.012 82)'
const CARD: React.CSSProperties = { backgroundColor: 'oklch(1 0 0)', border: '1px solid oklch(0.88 0.03 70)', borderRadius: '1rem' }
const TXT: React.CSSProperties  = { color: 'oklch(0.2 0.03 30)',  fontFamily: 'var(--font-dm-sans)' }
const DIM: React.CSSProperties  = { color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }

type Pedido = {
  id: string
  estado: 'confirmado' | 'en_camino'
  total: number
  direccion: string
  notas: string | null
  created_at: string
  en_camino_desde: string | null
  nombre_cliente: string | null
  telefono_cliente: string | null
  zona: string | null
  items: { nombre: string; cantidad: number }[]
}

function tarjeta(p: Pedido, onAccion: (id: string, nuevoEstado: string) => void, guardando: string | null) {
  const enCamino = p.estado === 'en_camino'
  return (
    <div key={p.id} className="rounded-2xl overflow-hidden" style={CARD}>
      {/* Cabecera estado */}
      <div className="px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: enCamino ? 'oklch(0.45 0.15 145 / 0.1)' : 'oklch(0.50 0.22 24 / 0.08)' }}>
        <div className="flex items-center gap-2">
          {enCamino
            ? <Truck className="h-4 w-4" style={{ color: GRN }} />
            : <Clock className="h-4 w-4" style={{ color: RED }} />}
          <span className="text-sm font-bold" style={{ color: enCamino ? GRN : RED, fontFamily: 'var(--font-dm-sans)' }}>
            {enCamino ? 'En camino' : 'Confirmado — listo para salir'}
          </span>
        </div>
        <span className="text-xs" style={DIM}>#{p.id.slice(-6).toUpperCase()}</span>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* Dirección */}
        <div className="flex items-start gap-3">
          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: RED }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={TXT}>{p.direccion}</p>
            {p.zona && <p className="text-xs mt-0.5" style={DIM}>{p.zona}</p>}
            {p.notas && (
              <p className="text-xs mt-1.5 px-2.5 py-1.5 rounded-xl"
                style={{ backgroundColor: 'oklch(0.76 0.14 80 / 0.15)', color: 'oklch(0.40 0.06 70)', fontFamily: 'var(--font-dm-sans)' }}>
                📝 {p.notas}
              </p>
            )}
          </div>
        </div>

        {/* Cliente */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${RED}15` }}>
            <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '1rem', color: RED }}>
              {(p.nombre_cliente ?? 'C').charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={TXT}>{p.nombre_cliente ?? 'Cliente'}</p>
            {p.telefono_cliente && (
              <a href={`tel:${p.telefono_cliente}`} className="text-xs flex items-center gap-1 mt-0.5"
                style={{ color: RED, fontFamily: 'var(--font-dm-sans)' }}>
                <Phone className="h-3 w-3" /> {p.telefono_cliente}
              </a>
            )}
          </div>
          {p.telefono_cliente && (
            <a href={`https://wa.me/52${p.telefono_cliente.replace(/\D/g, '')}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold flex-shrink-0"
              style={{ backgroundColor: 'oklch(0.45 0.15 145 / 0.12)', color: GRN, fontFamily: 'var(--font-dm-sans)' }}>
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </a>
          )}
        </div>

        {/* Productos */}
        <div className="rounded-xl px-3 py-2.5 flex flex-col gap-1.5"
          style={{ backgroundColor: 'oklch(0.95 0.01 82)' }}>
          {p.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              <span style={TXT}>{item.nombre}</span>
              <span style={DIM}>× {item.cantidad}</span>
            </div>
          ))}
          <div className="flex justify-between items-center pt-1 border-t" style={{ borderColor: 'oklch(0.88 0.03 70)' }}>
            <span className="text-xs" style={DIM}>Total</span>
            <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.3rem', letterSpacing: '0.03em', color: RED }}>{fp(p.total)}</span>
          </div>
        </div>

        {/* Tiempo */}
        <p className="text-xs" style={DIM}>
          Pedido: {tiempoTranscurrido(p.created_at)}
          {p.en_camino_desde && <> · En camino: {tiempoTranscurrido(p.en_camino_desde)}</>}
        </p>

        {/* Acción */}
        {p.estado === 'confirmado' && (
          <button
            onClick={() => onAccion(p.id, 'en_camino')}
            disabled={guardando === p.id}
            className="w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
            style={{ backgroundColor: RED, color: 'oklch(0.97 0.012 82)', fontFamily: 'var(--font-dm-sans)' }}>
            <Truck className="h-4 w-4" />
            {guardando === p.id ? 'Actualizando…' : 'Salir a entregar'}
          </button>
        )}
        {p.estado === 'en_camino' && (
          <button
            onClick={() => onAccion(p.id, 'entregado')}
            disabled={guardando === p.id}
            className="w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
            style={{ backgroundColor: GRN, color: 'oklch(0.97 0.012 82)', fontFamily: 'var(--font-dm-sans)' }}>
            <CheckCircle className="h-4 w-4" />
            {guardando === p.id ? 'Registrando…' : 'Marcar como entregado'}
          </button>
        )}
      </div>
    </div>
  )
}

export default function RepartidorPage() {
  const supabase = createClient()
  const [pedidos,   setPedidos]   = useState<Pedido[]>([])
  const [cargando,  setCargando]  = useState(true)
  const [userId,    setUserId]    = useState<string | null>(null)
  const [guardando, setGuardando] = useState<string | null>(null)

  const cargar = async (uid: string) => {
    const { data } = await supabase
      .from('pedidos')
      .select(`
        id, estado, total, direccion, notas, created_at, en_camino_desde, usuario_id,
        zonas(nombre),
        pedido_items(cantidad, productos(nombre))
      `)
      .eq('repartidor_id', uid)
      .in('estado', ['confirmado', 'en_camino'])
      .order('created_at', { ascending: true })

    if (!data) return

    const uids = [...new Set(data.map((p: any) => p.usuario_id).filter(Boolean))]
    const { data: perfs } = await supabase.from('perfiles').select('id, nombre, telefono').in('id', uids)
    const perfMap = Object.fromEntries((perfs ?? []).map((p: any) => [p.id, p]))

    setPedidos(data.map((p: any) => ({
      id:              p.id,
      estado:          p.estado,
      total:           p.total,
      direccion:       p.direccion,
      notas:           p.notas,
      created_at:      p.created_at,
      en_camino_desde: p.en_camino_desde ?? null,
      zona:            p.zonas?.nombre ?? null,
      nombre_cliente:  perfMap[p.usuario_id]?.nombre ?? null,
      telefono_cliente: perfMap[p.usuario_id]?.telefono ?? null,
      items:           (p.pedido_items ?? []).map((i: any) => ({
        nombre:   i.productos?.nombre ?? 'Producto',
        cantidad: i.cantidad,
      })),
    })))
    setCargando(false)
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      await cargar(user.id)

      // Realtime: refrescar si cambia algún pedido asignado
      supabase.channel('repartidor-pedidos')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos', filter: `repartidor_id=eq.${user.id}` },
          () => cargar(user.id)
        )
        .subscribe()
    }
    init()
  }, [])

  const accion = async (pedidoId: string, nuevoEstado: string) => {
    setGuardando(pedidoId)
    const update: Record<string, any> = { estado: nuevoEstado }
    if (nuevoEstado === 'en_camino') update.en_camino_desde = new Date().toISOString()
    if (nuevoEstado === 'entregado') update.entregado_en    = new Date().toISOString()

    const { error } = await supabase.from('pedidos').update(update).eq('id', pedidoId)
    if (error) { toast.error('Error al actualizar el pedido'); setGuardando(null); return }

    toast.success(nuevoEstado === 'en_camino' ? '🛵 ¡A entregar!' : '✅ Entregado')
    if (userId) await cargar(userId)
    setGuardando(null)
  }

  return (
    <div style={{ backgroundColor: BG, minHeight: '100vh' }}>
      <div className="max-w-lg mx-auto px-4 py-5 pb-10 flex flex-col gap-5">
        <div>
          <h1 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.8rem', letterSpacing: '0.05em', color: 'oklch(0.2 0.03 30)', lineHeight: 1 }}>
            Mis entregas
          </h1>
          <p className="text-sm mt-0.5" style={DIM}>
            {pedidos.length === 0 && !cargando ? 'Sin pedidos asignados' : `${pedidos.length} pedido${pedidos.length !== 1 ? 's' : ''} asignado${pedidos.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {cargando && (
          <div className="flex flex-col gap-4 animate-pulse">
            {[1,2].map(i => <div key={i} className="h-64 rounded-2xl" style={{ backgroundColor: 'oklch(0.91 0.02 75)' }} />)}
          </div>
        )}

        {!cargando && pedidos.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-20">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{ backgroundColor: `${RED}12`, border: `2px dashed ${RED}50` }}>
              <Package className="h-9 w-9" style={{ color: RED }} />
            </div>
            <div className="text-center">
              <p style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.4rem', letterSpacing: '0.04em', color: 'oklch(0.2 0.03 30)' }}>
                Sin pedidos por ahora
              </p>
              <p className="text-sm mt-1" style={DIM}>Los pedidos asignados aparecerán aquí</p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {pedidos.map(p => tarjeta(p, accion, guardando))}
        </div>
      </div>
    </div>
  )
}
