'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, Send, Users, MapPin, Loader2, CheckCircle, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

const RED = 'oklch(0.50 0.22 24)'
const BDR = '1px solid oklch(0.88 0.03 70)'
const inp = { backgroundColor: 'oklch(0.97 0.012 82)', color: 'oklch(0.20 0.03 30)', border: BDR, fontFamily: 'var(--font-dm-sans)' }

type Zona = { id: string; nombre: string }
type Enviada = { titulo: string; mensaje: string; zona: string; total: number; enviadas: number; ts: number }

const PLANTILLAS = [
  { label: '🍺 Promo del fin de semana',  titulo: '¡Fin de semana de ofertas!',     mensaje: 'Hasta 30% de descuento en cervezas y bebidas seleccionadas. ¡Solo este fin de semana!' },
  { label: '🚀 Pedido mínimo reducido',   titulo: 'Sin mínimo de pedido hoy 🎉',    mensaje: 'Por tiempo limitado puedes pedir sin monto mínimo. ¡Aprovecha y pide lo que quieras!' },
  { label: '🎁 Cupón exclusivo',          titulo: 'Cupón exclusivo para ti',         mensaje: 'Usa el código PISTO10 y obtén $10 de descuento en tu próximo pedido. ¡Válido hoy!' },
  { label: '⚡ Entrega express',          titulo: 'Entrega en 30 min garantizada',   mensaje: 'Esta noche entregamos en 30 minutos o tu próximo pedido tiene 20% de descuento.' },
  { label: '🌙 Promo nocturna',           titulo: '¡La noche apenas empieza! 🌙',   mensaje: 'Pide ahora y recibe tu pedido helado en minutos. Disponible hasta la 1 AM.' },
]

export default function AdminNotificaciones() {
  const supabase = createClient()
  const [zonas,    setZonas]    = useState<Zona[]>([])
  const [titulo,   setTitulo]   = useState('')
  const [mensaje,  setMensaje]  = useState('')
  const [url,      setUrl]      = useState('/')
  const [zonaId,   setZonaId]   = useState('')
  const [enviando, setEnviando] = useState(false)
  const [historial,setHistorial]= useState<Enviada[]>([])
  const [mostrarPlantillas, setMostrarPlantillas] = useState(false)

  useEffect(() => {
    supabase.from('zonas').select('id, nombre').eq('activa', true).order('nombre').then(({ data }) => {
      setZonas((data ?? []) as Zona[])
    })
    // Cargar historial del sessionStorage (solo dura la sesión)
    try {
      const h = sessionStorage.getItem('pp-notif-historial')
      if (h) setHistorial(JSON.parse(h))
    } catch {}
  }, [])

  const aplicarPlantilla = (p: typeof PLANTILLAS[0]) => {
    setTitulo(p.titulo)
    setMensaje(p.mensaje)
    setMostrarPlantillas(false)
  }

  const enviar = async () => {
    if (!titulo.trim() || !mensaje.trim()) { toast.error('Escribe título y mensaje'); return }
    setEnviando(true)
    try {
      const res = await fetch('/api/push/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: titulo.trim(), body: mensaje.trim(), url: url || '/', zona_id: zonaId || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al enviar')

      const entry: Enviada = {
        titulo: titulo.trim(),
        mensaje: mensaje.trim(),
        zona: zonaId ? (zonas.find(z => z.id === zonaId)?.nombre ?? 'Zona') : 'Todos',
        total: data.total,
        enviadas: data.enviadas,
        ts: Date.now(),
      }
      const nuevo = [entry, ...historial].slice(0, 20)
      setHistorial(nuevo)
      try { sessionStorage.setItem('pp-notif-historial', JSON.stringify(nuevo)) } catch {}

      if (data.enviadas === 0) {
        toast('Sin suscriptores activos — nadie ha activado las notificaciones todavía')
      } else {
        toast.success(`Enviada a ${data.enviadas} de ${data.total} dispositivo${data.total !== 1 ? 's' : ''}`)
      }
      setTitulo(''); setMensaje(''); setUrl('/'); setZonaId('')
    } catch (e: any) {
      toast.error(e.message ?? 'Error al enviar')
    }
    setEnviando(false)
  }

  const caracteresRestantes = 120 - mensaje.length

  return (
    <div className="p-6 flex flex-col gap-6 max-w-2xl">

      {/* Header */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-bebas)', fontSize: '2rem', letterSpacing: '0.04em', color: 'oklch(0.20 0.03 30)', lineHeight: 1 }}>
          Notificaciones
        </h1>
        <p className="text-sm mt-1" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
          Manda pushes a todos tus clientes o a una zona específica
        </p>
      </div>

      {/* ── Compositor ── */}
      <div className="rounded-2xl p-5 flex flex-col gap-4" style={{ backgroundColor: 'oklch(1 0 0)', border: BDR }}>

        {/* Plantillas */}
        <div className="relative">
          <button onClick={() => setMostrarPlantillas(v => !v)}
            className="flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-xl transition-colors"
            style={{ color: RED, backgroundColor: `${RED}08`, fontFamily: 'var(--font-dm-sans)' }}>
            <Bell className="h-4 w-4" />
            Usar plantilla
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${mostrarPlantillas ? 'rotate-180' : ''}`} />
          </button>

          {mostrarPlantillas && (
            <div className="absolute top-full left-0 mt-1 z-10 rounded-2xl overflow-hidden shadow-lg w-full"
              style={{ backgroundColor: 'oklch(1 0 0)', border: BDR }}>
              {PLANTILLAS.map(p => (
                <button key={p.label} onClick={() => aplicarPlantilla(p)}
                  className="w-full text-left px-4 py-3 border-b last:border-0 hover:bg-black/[0.02] transition-colors"
                  style={{ borderColor: 'oklch(0.92 0.02 70)', fontFamily: 'var(--font-dm-sans)' }}>
                  <p className="text-sm font-semibold" style={{ color: 'oklch(0.20 0.03 30)' }}>{p.label}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: 'oklch(0.55 0.02 40)' }}>{p.titulo}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Título */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold" style={{ color: 'oklch(0.35 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
            Título *
          </label>
          <Input value={titulo} onChange={e => setTitulo(e.target.value.slice(0, 60))}
            placeholder="¡Promo de fin de semana!" maxLength={60} style={inp} />
          <p className="text-[10px] text-right" style={{ color: 'oklch(0.65 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
            {titulo.length}/60
          </p>
        </div>

        {/* Mensaje */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold" style={{ color: 'oklch(0.35 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
            Mensaje *
          </label>
          <textarea
            value={mensaje}
            onChange={e => setMensaje(e.target.value.slice(0, 120))}
            placeholder="Hasta 30% de descuento esta noche…"
            rows={3}
            className="w-full px-3 py-2 rounded-xl text-sm resize-none outline-none"
            style={{ ...inp, lineHeight: 1.5 }}
          />
          <p className="text-[10px] text-right" style={{ color: caracteresRestantes < 20 ? RED : 'oklch(0.65 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
            {caracteresRestantes} caracteres restantes
          </p>
        </div>

        {/* URL + Zona */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold" style={{ color: 'oklch(0.35 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
              URL al tocar
            </label>
            <Input value={url} onChange={e => setUrl(e.target.value)}
              placeholder="/ofertas" style={inp} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold" style={{ color: 'oklch(0.35 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
              Destinatarios
            </label>
            <select value={zonaId} onChange={e => setZonaId(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm outline-none"
              style={{ ...inp, appearance: 'none' }}>
              <option value="">Todos los usuarios</option>
              {zonas.map(z => <option key={z.id} value={z.id}>{z.nombre}</option>)}
            </select>
          </div>
        </div>

        {/* Preview */}
        {(titulo || mensaje) && (
          <div className="rounded-xl p-3 flex items-start gap-3" style={{ backgroundColor: 'oklch(0.95 0.015 75)', border: BDR }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: RED }}>
              <Bell className="h-5 w-5" style={{ color: 'oklch(0.97 0.012 82)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'oklch(0.20 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>
                {titulo || 'Título…'}
              </p>
              <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'oklch(0.45 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
                {mensaje || 'Mensaje…'}
              </p>
            </div>
            <span className="text-[10px] flex-shrink-0 mt-0.5" style={{ color: 'oklch(0.65 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
              ahora
            </span>
          </div>
        )}

        <Button onClick={enviar} disabled={enviando || !titulo.trim() || !mensaje.trim()}
          className="gap-2 border-0 w-full"
          style={{ backgroundColor: RED, color: 'oklch(0.97 0.012 82)', fontFamily: 'var(--font-dm-sans)' }}>
          {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {enviando ? 'Enviando…' : `Enviar a ${zonaId ? (zonas.find(z => z.id === zonaId)?.nombre ?? 'zona') : 'todos'}`}
        </Button>
      </div>

      {/* ── Historial ── */}
      {historial.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.2rem', letterSpacing: '0.04em', color: 'oklch(0.20 0.03 30)' }}>
            Enviadas esta sesión
          </h2>
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'oklch(1 0 0)', border: BDR }}>
            {historial.map((h, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3 border-b last:border-0"
                style={{ borderColor: 'oklch(0.92 0.02 70)' }}>
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'oklch(0.45 0.15 145)' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'oklch(0.20 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>
                    {h.titulo}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
                    {h.mensaje}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-semibold" style={{ color: 'oklch(0.45 0.15 145)', fontFamily: 'var(--font-dm-sans)' }}>
                    {h.enviadas}/{h.total}
                  </p>
                  <p className="text-[10px] flex items-center gap-1 justify-end" style={{ color: 'oklch(0.60 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
                    {h.zona === 'Todos' ? <Users className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                    {h.zona}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
