'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, Clock, Truck, PackageCheck, XCircle, ArrowLeft, MapPin, MessageCircle, ReceiptText, Star } from 'lucide-react'
import Link from 'next/link'
import type { Pedido, PedidoItem } from '@/lib/types'
import { SkeletonDetallePedido } from '@/components/ui/Skeleton'

const RED = 'oklch(0.50 0.22 24)'
const GRN = 'oklch(0.55 0.18 145)'
const BG  = 'oklch(0.97 0.012 82)'

const ESTADOS: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  pendiente:  { label: 'Pendiente',  icon: <Clock className="h-5 w-5" />,       color: 'oklch(0.55 0.10 80)',  bg: 'oklch(0.76 0.14 80 / 0.15)'  },
  confirmado: { label: 'Confirmado', icon: <CheckCircle className="h-5 w-5" />, color: RED,                    bg: 'oklch(0.50 0.22 24 / 0.1)'   },
  en_camino:  { label: 'En camino',  icon: <Truck className="h-5 w-5" />,       color: GRN,                    bg: 'oklch(0.55 0.18 145 / 0.1)'  },
  entregado:  { label: 'Entregado',  icon: <PackageCheck className="h-5 w-5" />,color: GRN,                    bg: 'oklch(0.55 0.18 145 / 0.1)'  },
  cancelado:  { label: 'Cancelado',  icon: <XCircle className="h-5 w-5" />,     color: 'oklch(0.55 0.02 40)', bg: 'oklch(0.88 0.03 70 / 0.5)'   },
}

const PASOS = ['pendiente', 'confirmado', 'en_camino', 'entregado']

const CARD: React.CSSProperties = { backgroundColor: 'oklch(1 0 0)', border: '1px solid oklch(0.88 0.03 70)' }

export default function PedidoDetallePage() {
  const { id }       = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router       = useRouter()
  const supabase     = createClient()
  const esNuevo      = searchParams.get('nuevo') === '1'

  const [pedido,      setPedido]      = useState<Pedido | null>(null)
  const [items,       setItems]       = useState<PedidoItem[]>([])
  const [cargando,    setCargando]    = useState(true)
  const [resena,      setResena]      = useState<{ estrellas: number; comentario: string } | null>(null)
  const [resenaForm,  setResenaForm]  = useState({ estrellas: 0, comentario: '' })
  const [resenaEnv,   setResenaEnv]   = useState(false)
  const [resenaOk,    setResenaOk]    = useState(false)

  useEffect(() => {
    const cargar = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: p } = await supabase
        .from('pedidos')
        .select('*, zona:zonas(nombre)')
        .eq('id', id)
        .eq('usuario_id', user.id)
        .single()

      if (!p) { router.push('/pedidos'); return }
      setPedido(p)

      const { data: its } = await supabase
        .from('pedido_items')
        .select('*, producto:productos(nombre, precio, imagen_url)')
        .eq('pedido_id', id)

      setItems(its ?? [])

      const { data: rev } = await supabase
        .from('resenas')
        .select('estrellas, comentario')
        .eq('pedido_id', id)
        .maybeSingle()
      if (rev) { setResena(rev); setResenaOk(true) }

      setCargando(false)
    }
    cargar()

    const canal = supabase
      .channel(`pedido-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos', filter: `id=eq.${id}` },
        (payload) => setPedido((prev) => prev ? { ...prev, ...payload.new } : prev)
      )
      .subscribe()

    return () => { supabase.removeChannel(canal) }
  }, [id])

  const enviarResena = async () => {
    if (!resenaForm.estrellas) return
    setResenaEnv(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setResenaEnv(false); return }
    await supabase.from('resenas').upsert({
      pedido_id: id, usuario_id: user.id,
      estrellas: resenaForm.estrellas,
      comentario: resenaForm.comentario || null,
    }, { onConflict: 'pedido_id' })
    setResena(resenaForm)
    setResenaOk(true)
    setResenaEnv(false)
  }

  if (cargando) return (
    <div style={{ backgroundColor: BG, minHeight: '100vh' }}>
      <div className="sticky top-14 z-30 px-4 py-4 border-b" style={{ backgroundColor: BG, borderColor: 'oklch(0.88 0.03 70)', height: '4rem' }} />
      <SkeletonDetallePedido />
    </div>
  )

  if (!pedido) return null

  const estado     = ESTADOS[pedido.estado] ?? ESTADOS.pendiente
  const pasoActual = PASOS.indexOf(pedido.estado)
  const subtotal   = items.reduce((s, i) => s + i.precio_unitario * i.cantidad, 0)
  const descuento  = (pedido as any).descuento_aplicado as number | null

  return (
    <div style={{ backgroundColor: BG, minHeight: '100vh' }}>

      {/* Header */}
      <div className="sticky top-14 z-30 px-4 py-4 border-b flex items-center gap-3"
        style={{ backgroundColor: BG, borderColor: 'oklch(0.88 0.03 70)' }}>
        <Link href="/pedidos">
          <button className="p-2 rounded-xl hover:bg-black/5 transition-colors">
            <ArrowLeft className="h-5 w-5" style={{ color: RED }} />
          </button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.6rem', letterSpacing: '0.04em', color: 'oklch(0.2 0.03 30)' }}>
            Pedido #{pedido.id.slice(-6).toUpperCase()}
          </h1>
          <p className="text-xs" style={{ color: 'oklch(0.60 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
            {new Date(pedido.created_at).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
          style={{ backgroundColor: estado.bg, color: estado.color, fontFamily: 'var(--font-dm-sans)' }}>
          {estado.label}
        </span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-5 pb-32">

        {/* Banner pedido nuevo */}
        {esNuevo && (
          <div className="rounded-2xl p-5 flex items-center gap-4"
            style={{ backgroundColor: 'oklch(0.55 0.18 145 / 0.1)', border: '1.5px solid oklch(0.55 0.18 145 / 0.3)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: GRN }}>
              <CheckCircle className="h-6 w-6" style={{ color: 'oklch(0.97 0.012 82)' }} />
            </div>
            <div>
              <p className="font-bold" style={{ color: 'oklch(0.2 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>¡Pedido recibido!</p>
              <p className="text-sm" style={{ color: 'oklch(0.45 0.12 145)', fontFamily: 'var(--font-dm-sans)' }}>
                Te avisaremos cuando esté en camino.
              </p>
            </div>
          </div>
        )}

        {/* Barra de seguimiento */}
        {pedido.estado !== 'cancelado' && (
          <div className="rounded-2xl p-5" style={CARD}>
            <p className="text-xs font-bold uppercase tracking-widest mb-5"
              style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
              Seguimiento
            </p>
            <div className="flex items-start justify-between relative">
              <div className="absolute left-4 right-4 top-4 h-0.5" style={{ backgroundColor: 'oklch(0.90 0.02 82)' }} />
              <div className="absolute left-4 top-4 h-0.5 transition-all duration-500"
                style={{
                  backgroundColor: GRN,
                  width: pasoActual <= 0 ? '0%' : pasoActual >= 3 ? 'calc(100% - 2rem)' : `calc(${(pasoActual / 3) * 100}% - 0.5rem)`,
                }} />
              {PASOS.map((paso, i) => {
                const completado = i <= pasoActual
                const cfg = ESTADOS[paso]
                return (
                  <div key={paso} className="flex flex-col items-center gap-2 relative z-10">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                      style={{
                        backgroundColor: completado ? GRN : 'oklch(0.90 0.02 82)',
                        color: completado ? 'oklch(0.97 0.012 82)' : 'oklch(0.70 0.02 40)',
                        boxShadow: i === pasoActual ? `0 0 0 4px ${GRN}20` : 'none',
                      }}>
                      <span style={{ transform: 'scale(0.75)' }}>{cfg.icon}</span>
                    </div>
                    <p className="text-[10px] font-medium text-center"
                      style={{ color: completado ? 'oklch(0.35 0.03 30)' : 'oklch(0.70 0.02 40)', fontFamily: 'var(--font-dm-sans)', maxWidth: '3.5rem' }}>
                      {cfg.label}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Cancelado */}
        {pedido.estado === 'cancelado' && (
          <div className="rounded-2xl p-5 flex items-center gap-3"
            style={{ backgroundColor: 'oklch(0.50 0.22 24 / 0.06)', border: `1.5px solid ${RED}` }}>
            <XCircle className="h-7 w-7 flex-shrink-0" style={{ color: RED }} />
            <div>
              <p className="font-bold" style={{ color: RED, fontFamily: 'var(--font-dm-sans)' }}>Pedido cancelado</p>
              <p className="text-sm" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
                Contacta con nosotros si tienes dudas
              </p>
            </div>
          </div>
        )}

        {/* Dirección */}
        <div className="rounded-2xl p-4 flex items-start gap-3" style={CARD}>
          <MapPin className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: RED }} />
          <div>
            <p className="text-xs font-semibold mb-0.5" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
              Dirección de entrega
            </p>
            <p className="text-sm" style={{ color: 'oklch(0.2 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>
              {pedido.direccion}
            </p>
            {(pedido as any).zona?.nombre && (
              <p className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
                {(pedido as any).zona.nombre}
              </p>
            )}
            {pedido.notas && (
              <p className="text-xs mt-1 italic" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
                "{pedido.notas}"
              </p>
            )}
          </div>
        </div>

        {/* Productos + totales */}
        <div className="rounded-2xl overflow-hidden" style={CARD}>
          <div className="px-4 py-3 border-b" style={{ borderColor: 'oklch(0.92 0.02 82)' }}>
            <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.1rem', letterSpacing: '0.04em', color: 'oklch(0.2 0.03 30)' }}>
              Productos
            </span>
          </div>
          <div className="px-4 py-3 flex flex-col gap-2.5">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                <span style={{ color: 'oklch(0.35 0.03 30)' }}>
                  {(item.producto as any)?.nombre ?? 'Producto'} × {item.cantidad}
                </span>
                <span style={{ color: 'oklch(0.2 0.03 30)', fontWeight: 600 }}>
                  ${(item.precio_unitario * item.cantidad).toFixed(0)}
                </span>
              </div>
            ))}
            <div className="h-px mt-1" style={{ backgroundColor: 'oklch(0.90 0.02 82)' }} />
            {descuento && descuento > 0 && (
              <>
                <div className="flex justify-between text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                  <span style={{ color: 'oklch(0.55 0.02 40)' }}>Subtotal</span>
                  <span style={{ color: 'oklch(0.35 0.03 30)', fontWeight: 500 }}>${subtotal.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-sm" style={{ color: GRN, fontFamily: 'var(--font-dm-sans)', fontWeight: 600 }}>
                  <span>Descuento</span>
                  <span>−${descuento.toFixed(0)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between items-center mt-0.5">
              <span className="text-sm font-semibold" style={{ color: 'oklch(0.2 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>Total</span>
              <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.5rem', letterSpacing: '0.03em', color: RED }}>
                ${pedido.total.toFixed(0)}
              </span>
            </div>
          </div>
        </div>

        {/* Método de pago */}
        {pedido.metodo_pago && (
          <div className="rounded-2xl p-4 flex items-center gap-3" style={CARD}>
            <ReceiptText className="h-4 w-4 flex-shrink-0" style={{ color: 'oklch(0.55 0.02 40)' }} />
            <div>
              <p className="text-xs font-semibold" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>Método de pago</p>
              <p className="text-sm font-medium mt-0.5 capitalize" style={{ color: 'oklch(0.2 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>
                {pedido.metodo_pago}
              </p>
            </div>
          </div>
        )}

        {/* Ayuda WhatsApp */}
        <a href="https://wa.me/521XXXXXXXXXX?text=Hola%2C%20tengo%20una%20duda%20sobre%20mi%20pedido"
          target="_blank" rel="noopener noreferrer">
          <div className="rounded-2xl p-4 flex items-center gap-3 transition-all active:scale-[0.99]"
            style={{ backgroundColor: 'oklch(0.45 0.20 145 / 0.07)', border: '1px solid oklch(0.45 0.20 145 / 0.3)', borderRadius: '1rem' }}>
            <MessageCircle className="h-5 w-5 flex-shrink-0" style={{ color: GRN }} />
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: GRN, fontFamily: 'var(--font-dm-sans)' }}>¿Necesitas ayuda?</p>
              <p className="text-xs" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>Escríbenos por WhatsApp</p>
            </div>
          </div>
        </a>

        {/* Reseña — solo cuando está entregado */}
        {pedido.estado === 'entregado' && (
          <div className="rounded-2xl p-5 flex flex-col gap-4" style={{ backgroundColor: 'oklch(1 0 0)', border: '1px solid oklch(0.88 0.03 70)' }}>
            {resenaOk ? (
              <div className="flex flex-col items-center gap-2 py-2">
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="h-6 w-6" style={{ color: 'oklch(0.76 0.14 80)', fill: i <= (resena?.estrellas ?? 0) ? 'oklch(0.76 0.14 80)' : 'none' }} />
                  ))}
                </div>
                <p className="text-sm font-semibold" style={{ color: GRN, fontFamily: 'var(--font-dm-sans)' }}>¡Gracias por tu reseña!</p>
                {resena?.comentario && (
                  <p className="text-sm text-center italic" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
                    "{resena.comentario}"
                  </p>
                )}
              </div>
            ) : (
              <>
                <div>
                  <p className="text-sm font-bold" style={{ color: 'oklch(0.2 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>
                    ¿Cómo estuvo tu pedido?
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'oklch(0.60 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
                    Tu opinión nos ayuda a mejorar
                  </p>
                </div>
                <div className="flex gap-2 justify-center">
                  {[1,2,3,4,5].map(i => (
                    <button key={i} onClick={() => setResenaForm(f => ({ ...f, estrellas: i }))}
                      className="transition-transform active:scale-90">
                      <Star className="h-9 w-9" style={{
                        color: 'oklch(0.76 0.14 80)',
                        fill: i <= resenaForm.estrellas ? 'oklch(0.76 0.14 80)' : 'none',
                        strokeWidth: 1.5,
                        transition: 'fill 0.1s',
                      }} />
                    </button>
                  ))}
                </div>
                {resenaForm.estrellas > 0 && (
                  <>
                    <textarea
                      value={resenaForm.comentario}
                      onChange={e => setResenaForm(f => ({ ...f, comentario: e.target.value }))}
                      placeholder="Comentario opcional…"
                      rows={2}
                      className="w-full px-3 py-2.5 rounded-xl text-sm resize-none outline-none"
                      style={{ backgroundColor: 'oklch(0.95 0.01 82)', border: '1px solid oklch(0.88 0.03 70)', color: 'oklch(0.2 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}
                    />
                    <button onClick={enviarResena} disabled={resenaEnv}
                      className="w-full py-3 rounded-2xl text-sm font-bold transition-all active:scale-[0.98]"
                      style={{ backgroundColor: GRN, color: 'oklch(0.97 0.012 82)', fontFamily: 'var(--font-dm-sans)', opacity: resenaEnv ? 0.7 : 1 }}>
                      {resenaEnv ? 'Enviando…' : 'Enviar reseña'}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* CTA seguir comprando */}
        <Link href="/catalogo">
          <button className="w-full py-3.5 rounded-2xl text-sm font-semibold border transition-colors"
            style={{ borderColor: RED, color: RED, fontFamily: 'var(--font-dm-sans)', backgroundColor: 'transparent' }}>
            Seguir comprando
          </button>
        </Link>
      </div>
    </div>
  )
}
