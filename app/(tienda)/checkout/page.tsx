'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, ClipboardList, CheckCircle, Plus, Truck, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useCarrito } from '@/lib/store/carrito'
import { useDirecciones } from '@/lib/hooks/useDirecciones'
import { useConfiguracion } from '@/lib/hooks/useConfiguracion'
import { fp } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import DireccionesPanel from '@/components/tienda/DireccionesPanel'
import { AplicarCupon } from '@/components/tienda/AplicarCupon'
import type { Cupon, Zona } from '@/lib/types'

const RED  = 'oklch(0.50 0.22 24)'
const GRN  = 'oklch(0.55 0.18 145)'
const BG   = 'oklch(0.97 0.012 82)'
const CARD: React.CSSProperties = { backgroundColor: 'oklch(1 0 0)', border: '1px solid oklch(0.88 0.03 70)' }

export default function CheckoutPage() {
  const router   = useRouter()
  const supabase = createClient()
  const { items, total, limpiar } = useCarrito()
  const { activa, cargando: cargandoDirs } = useDirecciones()
  const { config } = useConfiguracion()

  const [notas,            setNotas]            = useState('')
  const [loading,          setLoading]          = useState(false)
  const [panelDir,         setPanelDir]         = useState(false)
  const [usuarioId,        setUsuarioId]        = useState<string | null>(null)
  const [cupon,            setCupon]            = useState<Cupon | null>(null)
  const [descuento,        setDescuento]        = useState(0)
  const [pedidoConfirmado, setPedidoConfirmado] = useState(false)
  const [zona,             setZona]             = useState<Zona | null>(null)
  const [resumenAbierto,   setResumenAbierto]   = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUsuarioId(user.id)
    })
  }, [])

  useEffect(() => {
    if (items.length === 0 && !pedidoConfirmado) router.push('/catalogo')
  }, [items, pedidoConfirmado])

  // Cargar datos de zona cuando cambia la dirección activa
  useEffect(() => {
    if (!activa) { setZona(null); return }
    const zonaId = (activa as any).zona_id
    const query = zonaId
      ? supabase.from('zonas').select('*').eq('id', zonaId).single()
      : supabase.from('zonas').select('*').eq('nombre', activa.zona).single()
    query.then(({ data }) => setZona(data as Zona ?? null))
  }, [activa?.zona])

  // Calcular costo de envío
  const subtotal      = total()
  const costoEnvio    = zona
    ? (zona.envio_gratis_desde !== null && subtotal >= zona.envio_gratis_desde ? 0 : zona.costo_envio)
    : 0
  const envioGratis   = zona?.envio_gratis_desde !== null && subtotal >= (zona?.envio_gratis_desde ?? Infinity)
  const faltaParaGratis = zona?.envio_gratis_desde !== null
    ? Math.max(0, (zona?.envio_gratis_desde ?? 0) - subtotal)
    : null

  const totalFinal = Math.max(0, subtotal - descuento + costoEnvio)

  const confirmarPedido = async () => {
    if (!activa || !usuarioId || !zona) return
    setLoading(true)

    const direccionCompleta = `${activa.calle} ${activa.numero}, ${activa.colonia}, CP ${activa.cp}${activa.referencia ? ` — ${activa.referencia}` : ''}`

    // 1. Crear el pedido en DB
    const res = await fetch('/api/pedido/crear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items:        items.map(i => ({ producto_id: i.producto.id, cantidad: i.cantidad })),
        zona_id:      zona.id,
        direccion:    direccionCompleta,
        notas:        notas.trim() || null,
        cupon_codigo: cupon?.codigo ?? null,
      }),
    })

    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? 'Error al crear el pedido'); setLoading(false); return }

    // 2. Crear preferencia de pago en MercadoPago
    const mpRes = await fetch('/api/mp/crear-preferencia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pedido_id: data.pedido_id }),
    })

    const mpData = await mpRes.json()
    if (!mpRes.ok || !mpData.checkout_url) {
      toast.error('Error al iniciar el pago. Intenta de nuevo.')
      setLoading(false)
      return
    }

    // 3. Limpiar carrito y redirigir a MP
    limpiar()
    setPedidoConfirmado(true)
    window.location.href = mpData.checkout_url
  }

  if (items.length === 0 && !pedidoConfirmado) return null

  /* ── Resumen compartido (usado en mobile y desktop) ── */
  const ResumenPedido = () => (
    <div className="flex flex-col gap-2">
      {items.map(({ producto, cantidad }) => (
        <div key={producto.id} className="flex justify-between text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          <span style={{ color: 'oklch(0.35 0.03 30)' }}>{producto.nombre} × {cantidad}</span>
          <span style={{ color: 'oklch(0.2 0.03 30)', fontWeight: 600 }}>{fp(producto.precio * cantidad)}</span>
        </div>
      ))}
      <div className="h-px mt-1" style={{ backgroundColor: 'oklch(0.90 0.02 82)' }} />

      {/* Envío */}
      <div className="flex justify-between text-sm items-center">
        <span className="flex items-center gap-1.5" style={{ color: 'oklch(0.35 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>
          <Truck className="h-3.5 w-3.5" />
          Envío
          {zona?.envio_gratis_desde !== null && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: envioGratis ? `${GRN}15` : 'oklch(0.76 0.14 80 / 0.15)', color: envioGratis ? GRN : 'oklch(0.55 0.10 80)' }}>
              {envioGratis ? '¡Gratis!' : `Gratis desde ${fp(zona?.envio_gratis_desde ?? 0)}`}
            </span>
          )}
        </span>
        <span style={{ color: envioGratis ? GRN : 'oklch(0.2 0.03 30)', fontFamily: 'var(--font-dm-sans)', fontWeight: 600 }}>
          {costoEnvio === 0 ? 'Gratis' : fp(costoEnvio)}
        </span>
      </div>

      {/* Descuento cupón */}
      {descuento > 0 && (
        <div className="flex justify-between text-sm">
          <span style={{ color: GRN, fontFamily: 'var(--font-dm-sans)' }}>Descuento ({cupon?.codigo})</span>
          <span style={{ color: GRN, fontFamily: 'var(--font-dm-sans)', fontWeight: 600 }}>-{fp(descuento)}</span>
        </div>
      )}

      <div className="h-px" style={{ backgroundColor: 'oklch(0.90 0.02 82)' }} />
      <div className="flex justify-between items-center">
        <span className="text-sm font-semibold" style={{ color: 'oklch(0.2 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>Total</span>
        <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.5rem', letterSpacing: '0.03em', color: RED }}>{fp(totalFinal)}</span>
      </div>
    </div>
  )

  return (
    <div style={{ backgroundColor: BG, minHeight: '100vh' }}>

      {/* Header */}
      <div className="sticky top-14 z-30 px-4 py-4 border-b flex items-center gap-3"
        style={{ backgroundColor: BG, borderColor: 'oklch(0.88 0.03 70)' }}>
        <Link href="/carrito">
          <button className="p-2 rounded-xl hover:bg-black/5 transition-colors">
            <ArrowLeft className="h-5 w-5" style={{ color: RED }} />
          </button>
        </Link>
        <h1 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.8rem', letterSpacing: '0.04em', color: 'oklch(0.2 0.03 30)' }}>
          Confirmar pedido
        </h1>
      </div>

      {/* Banner "falta X para envío gratis" */}
      {faltaParaGratis !== null && faltaParaGratis > 0 && (
        <div className="px-4 pt-3">
          <div className="max-w-5xl mx-auto rounded-xl px-4 py-2.5 flex items-center gap-2"
            style={{ backgroundColor: 'oklch(0.76 0.14 80 / 0.15)', border: '1px solid oklch(0.76 0.14 80 / 0.3)' }}>
            <Truck className="h-4 w-4 flex-shrink-0" style={{ color: 'oklch(0.55 0.10 80)' }} />
            <p className="text-sm" style={{ color: 'oklch(0.35 0.08 60)', fontFamily: 'var(--font-dm-sans)' }}>
              Agrega <strong>{fp(faltaParaGratis)} más</strong> para obtener envío gratis
            </p>
          </div>
        </div>
      )}

      {/* Layout */}
      <div className="max-w-5xl mx-auto px-4 py-6 pb-40 md:pb-10 md:grid md:grid-cols-[1fr_340px] md:gap-8 md:items-start">

        {/* Columna izquierda */}
        <div className="flex flex-col gap-5">

          {/* Resumen colapsable — solo mobile */}
          <div className="md:hidden rounded-2xl overflow-hidden" style={CARD}>
            <button
              onClick={() => setResumenAbierto(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3.5 transition-colors active:bg-black/5"
            >
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" style={{ color: RED }} />
                <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.1rem', letterSpacing: '0.04em', color: 'oklch(0.2 0.03 30)' }}>
                  Ver resumen del pedido
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.1rem', color: RED }}>
                  {fp(totalFinal)}
                </span>
                <ChevronDown
                  className="h-4 w-4 transition-transform duration-200"
                  style={{ color: 'oklch(0.55 0.02 40)', transform: resumenAbierto ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </div>
            </button>
            {resumenAbierto && (
              <div className="px-4 pb-4 flex flex-col gap-2 border-t" style={{ borderColor: 'oklch(0.92 0.02 82)' }}>
                <div className="pt-3 flex flex-col gap-2">
                  {items.map(({ producto, cantidad }) => (
                    <div key={producto.id} className="flex justify-between text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                      <span style={{ color: 'oklch(0.35 0.03 30)' }}>{producto.nombre} × {cantidad}</span>
                      <span style={{ color: 'oklch(0.2 0.03 30)', fontWeight: 600 }}>{fp(producto.precio * cantidad)}</span>
                    </div>
                  ))}
                </div>
                <div className="h-px mt-1" style={{ backgroundColor: 'oklch(0.90 0.02 82)' }} />
                <div className="flex justify-between text-sm items-center">
                  <span className="flex items-center gap-1.5" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
                    <Truck className="h-3.5 w-3.5" /> Envío
                  </span>
                  <span style={{ color: costoEnvio === 0 ? GRN : 'oklch(0.2 0.03 30)', fontFamily: 'var(--font-dm-sans)', fontWeight: 600 }}>
                    {costoEnvio === 0 ? '¡Gratis!' : fp(costoEnvio)}
                  </span>
                </div>
                {descuento > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: GRN, fontFamily: 'var(--font-dm-sans)' }}>Descuento ({cupon?.codigo})</span>
                    <span style={{ color: GRN, fontFamily: 'var(--font-dm-sans)', fontWeight: 600 }}>-{fp(descuento)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-1">
                  <span className="text-sm font-semibold" style={{ color: 'oklch(0.2 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>Total</span>
                  <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.4rem', letterSpacing: '0.03em', color: RED }}>{fp(totalFinal)}</span>
                </div>

                {/* Cupón dentro del acordeón */}
                <div className="h-px mt-1" style={{ backgroundColor: 'oklch(0.90 0.02 82)' }} />
                <p className="text-xs font-bold uppercase tracking-wider pt-1" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
                  Cupón de descuento
                </p>
                <AplicarCupon subtotal={subtotal} cuponAplicado={cupon}
                  onAplicar={(c, d) => { setCupon(c); setDescuento(d) }}
                  onRemover={() => { setCupon(null); setDescuento(0) }} />
              </div>
            )}
          </div>

          {/* Dirección */}
          <div className="rounded-2xl overflow-hidden" style={CARD}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'oklch(0.92 0.02 82)' }}>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" style={{ color: RED }} />
                <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.1rem', letterSpacing: '0.04em', color: 'oklch(0.2 0.03 30)' }}>
                  Dirección de entrega
                </span>
              </div>
              <button onClick={() => setPanelDir(true)}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors hover:bg-black/5"
                style={{ color: RED, fontFamily: 'var(--font-dm-sans)' }}>
                Cambiar
              </button>
            </div>
            <div className="px-4 py-4">
              {cargandoDirs ? (
                <p className="text-sm" style={{ color: 'oklch(0.65 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>Cargando…</p>
              ) : activa ? (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: 'oklch(0.2 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>{activa.alias}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: 'oklch(0.50 0.22 24 / 0.1)', color: RED, fontFamily: 'var(--font-dm-sans)' }}>
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
                <button onClick={() => setPanelDir(true)} className="flex items-center gap-2 text-sm font-semibold"
                  style={{ color: RED, fontFamily: 'var(--font-dm-sans)' }}>
                  <Plus className="h-4 w-4" /> Agregar dirección de entrega
                </button>
              )}
            </div>
          </div>

          {/* Cupón — solo desktop (en mobile va dentro del acordeón) */}
          <div className="hidden md:flex flex-col gap-3 rounded-2xl p-4" style={CARD}>
            <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.1rem', letterSpacing: '0.04em', color: 'oklch(0.2 0.03 30)' }}>
              Cupón de descuento
            </span>
            <AplicarCupon subtotal={subtotal} cuponAplicado={cupon}
              onAplicar={(c, d) => { setCupon(c); setDescuento(d) }}
              onRemover={() => { setCupon(null); setDescuento(0) }} />
          </div>

          {/* Notas */}
          <div className="rounded-2xl p-4 flex flex-col gap-3" style={CARD}>
            <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.1rem', letterSpacing: '0.04em', color: 'oklch(0.2 0.03 30)' }}>
              Notas para el repartidor
            </span>
            <textarea
              placeholder="Instrucciones especiales, timbre, etc…"
              value={notas} onChange={(e) => setNotas(e.target.value)} rows={3}
              className="w-full resize-none rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ backgroundColor: 'oklch(0.95 0.01 82)', border: '1px solid oklch(0.88 0.03 70)', color: 'oklch(0.2 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}
            />
          </div>

          {/* Método de pago */}
          <div className="rounded-2xl p-4 flex items-center gap-3"
            style={{ backgroundColor: 'oklch(0.55 0.18 145 / 0.08)', border: '1px solid oklch(0.55 0.18 145 / 0.25)' }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: GRN }}>
              <span style={{ fontSize: '1rem' }}>💳</span>
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'oklch(0.2 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>Pago seguro con MercadoPago</p>
              <p className="text-xs" style={{ color: 'oklch(0.48 0.03 40)', fontFamily: 'var(--font-dm-sans)' }}>Tarjeta, OXXO, transferencia y más · Te redirigiremos al pagar</p>
            </div>
          </div>
        </div>

        {/* Columna derecha desktop */}
        <div className="hidden md:flex flex-col gap-4 sticky top-28">
          <div className="rounded-2xl overflow-hidden" style={CARD}>
            <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: 'oklch(0.92 0.02 82)' }}>
              <ClipboardList className="h-4 w-4" style={{ color: RED }} />
              <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.1rem', letterSpacing: '0.04em', color: 'oklch(0.2 0.03 30)' }}>
                Tu pedido
              </span>
            </div>
            <div className="px-4 py-3">
              <ResumenPedido />
            </div>
          </div>

          <button
            className="w-full h-14 rounded-2xl flex items-center justify-center gap-2 font-semibold text-base transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!activa || !zona || loading} onClick={confirmarPedido}
            style={{ backgroundColor: activa ? RED : 'oklch(0.88 0.03 70)', color: activa ? 'oklch(0.97 0.012 82)' : 'oklch(0.65 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
            {loading ? 'Redirigiendo a pago…' : (
              <><CheckCircle className="h-5 w-5" />
                {activa ? `Pagar · ${fp(totalFinal)}` : 'Agrega una dirección'}
              </>
            )}
          </button>
          {activa && zona && (
            <div className="flex items-center justify-center gap-1.5">
              <Truck className="h-3.5 w-3.5" style={{ color: GRN }} />
              <span className="text-xs" style={{ color: GRN, fontFamily: 'var(--font-dm-sans)', fontWeight: 500 }}>
                Entrega estimada: ~{config.tiempo_entrega_min} min
              </span>
            </div>
          )}
        </div>
      </div>

      {/* CTA fijo mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t"
        style={{ backgroundColor: BG, borderColor: 'oklch(0.88 0.03 70)' }}>
        {/* Mini resumen de costos en mobile */}
        {activa && zona && (
          <div className="flex items-center justify-between px-4 pt-3 pb-1 text-xs" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            <span style={{ color: 'oklch(0.55 0.02 40)' }}>
              Subtotal {fp(subtotal)}
              {descuento > 0 && <> · Desc. -{fp(descuento)}</>}
            </span>
            <span style={{ color: envioGratis ? GRN : 'oklch(0.35 0.03 30)' }}>
              Envío {costoEnvio === 0 ? '¡Gratis!' : fp(costoEnvio)}
            </span>
          </div>
        )}
        {activa && zona && (
          <div className="flex items-center justify-center gap-1.5 px-4 pb-1">
            <Truck className="h-3 w-3" style={{ color: GRN }} />
            <span className="text-xs" style={{ color: GRN, fontFamily: 'var(--font-dm-sans)', fontWeight: 500 }}>
              Entrega estimada: ~{config.tiempo_entrega_min} min
            </span>
          </div>
        )}
        <div className="p-4 pt-2">
          <button
            className="w-full h-14 rounded-2xl flex items-center justify-center gap-2 font-semibold text-base transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!activa || !zona || loading} onClick={confirmarPedido}
            style={{ backgroundColor: activa ? RED : 'oklch(0.88 0.03 70)', color: activa ? 'oklch(0.97 0.012 82)' : 'oklch(0.65 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
            {loading ? 'Confirmando…' : (
              <><CheckCircle className="h-5 w-5" />
                {activa ? `Confirmar pedido · ${fp(totalFinal)}` : 'Agrega una dirección para continuar'}
              </>
            )}
          </button>
        </div>
      </div>

      {panelDir && <DireccionesPanel onCerrar={() => setPanelDir(false)} />}
    </div>
  )
}
