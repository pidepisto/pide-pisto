'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Bell, BellOff, Package, Tag, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const RED  = 'oklch(0.50 0.22 24)'
const BG   = 'oklch(0.97 0.012 82)'
const GRN  = 'oklch(0.55 0.18 145)'
const CARD: React.CSSProperties = { backgroundColor: 'oklch(1 0 0)', border: '1px solid oklch(0.90 0.02 75)', borderRadius: '1rem' }
const TXT: React.CSSProperties  = { color: 'oklch(0.2 0.03 30)', fontFamily: 'var(--font-dm-sans)' }
const DIM: React.CSSProperties  = { color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }

type Permiso = 'desconocido' | 'no_soportado' | 'concedido' | 'denegado' | 'pendiente'

function Toggle({ activo, onChange, disabled }: { activo: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange(!activo)}
      disabled={disabled}
      className="relative w-12 h-7 rounded-full transition-all flex-shrink-0 disabled:opacity-40"
      style={{ backgroundColor: activo ? GRN : 'oklch(0.82 0.02 75)' }}
    >
      <div className="absolute top-0.5 bottom-0.5 aspect-square rounded-full bg-white shadow transition-all"
        style={{ left: activo ? 'calc(100% - 1.625rem)' : '0.125rem' }} />
    </button>
  )
}

async function registrarSW(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  try {
    return await navigator.serviceWorker.register('/sw.js')
  } catch {
    return null
  }
}

function urlBase64ToUint8Array(base64: string) {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + pad).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export default function NotificacionesPage() {
  const [permiso,     setPermiso]     = useState<Permiso>('desconocido')
  const [suscrito,    setSuscrito]    = useState(false)
  const [cargando,    setCargando]    = useState(false)
  const [prefPedidos, setPrefPedidos] = useState(true)
  const [prefPromos,  setPrefPromos]  = useState(true)

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPermiso('no_soportado'); return
    }
    const perm = Notification.permission
    if (perm === 'granted') {
      setPermiso('concedido')
      // Verificar si ya hay suscripción activa
      navigator.serviceWorker.ready.then(async (reg) => {
        const sub = await reg.pushManager.getSubscription()
        setSuscrito(!!sub)
      })
    } else if (perm === 'denied') {
      setPermiso('denegado')
    } else {
      setPermiso('pendiente')
    }
  }, [])

  const activar = async () => {
    setCargando(true)
    try {
      const reg = await registrarSW()
      if (!reg) throw new Error('Service worker no disponible')

      const perm = await Notification.requestPermission()
      if (perm !== 'granted') {
        setPermiso('denegado')
        toast.error('Permiso denegado')
        return
      }
      setPermiso('concedido')

      // Suscribirse al push
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      })

      // Guardar en el servidor
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      })
      if (!res.ok) throw new Error('No se pudo guardar la suscripción')

      setSuscrito(true)
      toast.success('Notificaciones activadas')
    } catch (e: any) {
      toast.error(e.message ?? 'Error al activar notificaciones')
    } finally {
      setCargando(false)
    }
  }

  const desactivar = async () => {
    setCargando(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setSuscrito(false)
      toast('Notificaciones desactivadas')
    } catch {
      toast.error('Error al desactivar')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div style={{ backgroundColor: BG, minHeight: '100vh' }}>
      <div className="flex items-center gap-3 px-4 pt-5 pb-4">
        <Link href="/cuenta">
          <button className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ border: '1px solid oklch(0.88 0.03 70)', backgroundColor: 'oklch(1 0 0)' }}>
            <ChevronLeft className="h-4 w-4" style={{ color: 'oklch(0.35 0.03 30)' }} />
          </button>
        </Link>
        <h1 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.8rem', letterSpacing: '0.05em', color: 'oklch(0.2 0.03 30)' }}>
          Notificaciones
        </h1>
      </div>

      <div className="px-4 flex flex-col gap-5 pb-32 max-w-lg mx-auto">

        {/* ── Estado / toggle principal ── */}
        <div className="rounded-2xl p-5 flex flex-col gap-4" style={CARD}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: suscrito ? `${GRN}15` : `${RED}12` }}>
              {suscrito
                ? <Bell className="h-6 w-6" style={{ color: GRN }} />
                : <BellOff className="h-6 w-6" style={{ color: RED }} />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold" style={TXT}>
                {permiso === 'no_soportado' ? 'No disponible' :
                 suscrito                   ? 'Notificaciones activas' :
                 permiso === 'denegado'     ? 'Bloqueadas por el navegador' :
                                             'Notificaciones desactivadas'}
              </p>
              <p className="text-xs mt-0.5" style={DIM}>
                {suscrito                   ? 'Recibirás avisos de tus pedidos y ofertas' :
                 permiso === 'denegado'     ? 'Cambia el permiso en ajustes del navegador' :
                 permiso === 'no_soportado' ? 'Instala la app en tu pantalla de inicio'    :
                                             'Actívalas para saber cuándo llega tu pedido'}
              </p>
            </div>
            {permiso === 'concedido' && !cargando && (
              <Toggle activo={suscrito} onChange={(v) => v ? activar() : desactivar()} />
            )}
            {cargando && <Loader2 className="h-5 w-5 animate-spin flex-shrink-0" style={{ color: RED }} />}
          </div>

          {permiso === 'pendiente' && (
            <button onClick={activar} disabled={cargando}
              className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
              style={{ backgroundColor: RED, color: 'oklch(0.97 0.012 82)', fontFamily: 'var(--font-dm-sans)' }}>
              {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
              {cargando ? 'Activando…' : 'Activar notificaciones'}
            </button>
          )}

          {permiso === 'denegado' && (
            <div className="flex items-start gap-2 p-3 rounded-xl" style={{ backgroundColor: `${RED}10` }}>
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: RED }} />
              <p className="text-xs" style={{ color: RED, fontFamily: 'var(--font-dm-sans)' }}>
                Ve a <strong>Ajustes del navegador → Privacidad → Notificaciones</strong> y permite las notificaciones de pidepisto.com
              </p>
            </div>
          )}

          {permiso === 'no_soportado' && (
            <div className="flex items-start gap-2 p-3 rounded-xl" style={{ backgroundColor: 'oklch(0.92 0.02 82)' }}>
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: 'oklch(0.55 0.02 40)' }} />
              <p className="text-xs" style={DIM}>
                Tu navegador no soporta notificaciones push. En iPhone, añade Pide Pisto a la pantalla de inicio desde Safari e inténtalo de nuevo.
              </p>
            </div>
          )}
        </div>

        {/* ── Preferencias ── */}
        {suscrito && (
          <div className="rounded-2xl overflow-hidden" style={CARD}>
            <div className="px-5 py-4 border-b" style={{ borderColor: 'oklch(0.93 0.015 75)' }}>
              <p className="text-sm font-bold" style={TXT}>¿Qué quieres recibir?</p>
            </div>
            {[
              { icon: Package, label: 'Estado de pedidos',    desc: 'Confirmación, en camino y entrega', val: prefPedidos, set: setPrefPedidos },
              { icon: Tag,     label: 'Ofertas y promociones', desc: 'Descuentos, cupones y novedades',   val: prefPromos,  set: setPrefPromos  },
            ].map(({ icon: Icon, label, desc, val, set }, i) => (
              <div key={label}>
                {i > 0 && <div className="h-px mx-5" style={{ backgroundColor: 'oklch(0.93 0.015 75)' }} />}
                <div className="flex items-center gap-3 px-5 py-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: val ? `${GRN}15` : 'oklch(0.92 0.02 82)' }}>
                    <Icon className="h-4 w-4" style={{ color: val ? GRN : 'oklch(0.60 0.02 40)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={TXT}>{label}</p>
                    <p className="text-xs mt-0.5" style={DIM}>{desc}</p>
                  </div>
                  <Toggle activo={val} onChange={set} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Info PWA ── */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: `${RED}06`, border: `1px solid ${RED}25`, borderRadius: '1rem' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: RED, fontFamily: 'var(--font-dm-sans)' }}>
            Tip — Instala la app
          </p>
          <p className="text-xs" style={DIM}>
            Para la mejor experiencia instala Pide Pisto en tu pantalla de inicio.
            En Chrome: menú (⋮) → "Añadir a pantalla de inicio". En Safari: Compartir → "Añadir al inicio".
          </p>
        </div>

      </div>
    </div>
  )
}
