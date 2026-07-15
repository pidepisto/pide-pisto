'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Save, X, Bike, Package } from 'lucide-react'
import { fp } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

type Rep = { id: string; nombre: string | null; telefono: string | null; rol: string }
type PedidoRep = { id: string; estado: string; total: number; direccion: string; created_at: string }

const BDR = '1px solid oklch(0.88 0.03 70)'
const inputStyle = { backgroundColor: 'oklch(0.97 0.012 82)', color: 'oklch(0.20 0.03 30)', border: BDR, fontFamily: 'var(--font-dm-sans)' }

const estadoColor: Record<string, string> = {
  pendiente: 'oklch(0.60 0.12 75)', confirmado: 'oklch(0.50 0.22 24)',
  en_camino: 'oklch(0.45 0.15 145)', entregado: 'oklch(0.45 0.15 145)', cancelado: 'oklch(0.55 0.02 40)'
}

const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold" style={{ color: 'oklch(0.35 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>{label}</label>
    {children}
  </div>
)

export default function AdminRepartidores() {
  const supabase = createClient()
  const [reps,        setReps]        = useState<Rep[]>([])
  const [modal,       setModal]       = useState(false)
  const [selec,       setSelec]       = useState<Rep | null>(null)
  const [pedidos,     setPedidos]     = useState<PedidoRep[]>([])
  const [form,        setForm]        = useState({ email: '', password: '', nombre: '', telefono: '' })
  const [loading,     setLoading]     = useState(false)

  const cargar = async () => {
    const { data } = await supabase.from('perfiles').select('id, nombre, telefono, rol').eq('rol', 'repartidor').order('nombre')
    setReps((data ?? []) as any)
  }

  const cargarPedidos = async (repId: string) => {
    const { data } = await supabase.from('pedidos').select('id, estado, total, direccion, created_at').eq('repartidor_id', repId).order('created_at', { ascending: false }).limit(20)
    setPedidos((data ?? []) as any)
  }

  useEffect(() => { cargar() }, [])

  const verRepartidor = (r: Rep) => { setSelec(r); cargarPedidos(r.id) }

  const crear = async () => {
    if (!form.email || !form.password || !form.nombre) { toast.error('Completa nombre, email y contraseña'); return }
    setLoading(true)
    const res = await fetch('/api/admin/crear-repartidor', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    })
    if (res.ok) { toast.success('Repartidor creado'); setModal(false); setForm({ email: '', password: '', nombre: '', telefono: '' }); cargar() }
    else { const e = await res.json(); toast.error(e.error ?? 'Error al crear') }
    setLoading(false)
  }

  return (
    <div className="p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 style={{ fontFamily: 'var(--font-bebas)', fontSize: '2rem', letterSpacing: '0.04em', color: 'oklch(0.20 0.03 30)' }}>Repartidores</h1>
        <Button onClick={() => setModal(true)} className="gap-2 border-0"
          style={{ backgroundColor: 'oklch(0.50 0.22 24)', color: 'oklch(0.97 0.012 82)', fontFamily: 'var(--font-dm-sans)' }}>
          <Plus className="h-4 w-4" /> Nuevo repartidor
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Lista */}
        <div className="flex flex-col gap-2">
          {reps.length === 0 && <p className="text-sm py-8 text-center" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>Sin repartidores aún</p>}
          {reps.map(r => (
            <button key={r.id} onClick={() => verRepartidor(r)} className="w-full text-left rounded-2xl p-4 transition-all"
              style={{
                backgroundColor: selec?.id === r.id ? 'oklch(0.50 0.22 24 / 0.06)' : 'oklch(1 0 0)',
                border: `1.5px solid ${selec?.id === r.id ? 'oklch(0.50 0.22 24 / 0.4)' : 'oklch(0.88 0.03 70)'}`,
              }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: selec?.id === r.id ? 'oklch(0.50 0.22 24)' : 'oklch(0.50 0.22 24 / 0.10)' }}>
                  <Bike className="h-4 w-4" style={{ color: selec?.id === r.id ? 'oklch(0.97 0.012 82)' : 'oklch(0.50 0.22 24)' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'oklch(0.20 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>{r.nombre ?? 'Sin nombre'}</p>
                  {r.telefono && <p className="text-xs" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>{r.telefono}</p>}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Pedidos del repartidor */}
        {selec && (
          <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ backgroundColor: 'oklch(1 0 0)', border: BDR }}>
            <div className="flex items-center gap-2 pb-1">
              <Package className="h-4 w-4" style={{ color: 'oklch(0.50 0.22 24)' }} />
              <p className="text-sm font-semibold" style={{ color: 'oklch(0.20 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>
                Pedidos de {selec.nombre}
              </p>
            </div>
            <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
              {pedidos.length === 0 && (
                <p className="text-xs py-4 text-center" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>Sin pedidos asignados</p>
              )}
              {pedidos.map(p => (
                <div key={p.id} className="flex items-center justify-between gap-2 p-3 rounded-xl"
                  style={{ backgroundColor: 'oklch(0.96 0.01 82)', border: '1px solid oklch(0.91 0.02 75)' }}>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: 'oklch(0.20 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>#{p.id.slice(-6).toUpperCase()}</p>
                    <p className="text-xs" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>{new Date(p.created_at).toLocaleDateString('es-MX')}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full capitalize"
                    style={{ backgroundColor: `${estadoColor[p.estado]}18`, color: estadoColor[p.estado], fontFamily: 'var(--font-dm-sans)' }}>
                    {p.estado.replace('_', ' ')}
                  </span>
                  <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '1rem', color: 'oklch(0.20 0.03 30)' }}>{fp(p.total)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal crear */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModal(false)} />
          <div className="relative w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4"
            style={{ backgroundColor: 'oklch(1 0 0)', border: BDR, boxShadow: '0 8px 40px oklch(0 0 0 / 0.15)' }}>
            <div className="flex items-center justify-between">
              <h2 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.5rem', letterSpacing: '0.04em', color: 'oklch(0.20 0.03 30)' }}>Nuevo repartidor</h2>
              <button onClick={() => setModal(false)} style={{ color: 'oklch(0.55 0.02 40)' }}><X className="h-5 w-5" /></button>
            </div>
            <F label="Nombre *"><Input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="Juan García" style={inputStyle} /></F>
            <F label="Teléfono"><Input value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} placeholder="55 1234 5678" style={inputStyle} /></F>
            <F label="Email *"><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="juan@pidepisto.com" style={inputStyle} /></F>
            <F label="Contraseña *"><Input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Mínimo 6 caracteres" style={inputStyle} /></F>
            <Button onClick={crear} disabled={loading} className="gap-2 border-0"
              style={{ backgroundColor: 'oklch(0.50 0.22 24)', color: 'oklch(0.97 0.012 82)', fontFamily: 'var(--font-dm-sans)' }}>
              <Save className="h-4 w-4" />{loading ? 'Creando…' : 'Crear cuenta'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
