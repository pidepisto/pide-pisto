'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Save, X, Power } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import type { Cupon } from '@/lib/types'

type Form = { codigo: string; descripcion: string; tipo: 'porcentaje'|'fijo'; valor: string; minimo_compra: string; limite_usos: string; fecha_inicio: string; fecha_fin: string }
const hoy = new Date().toISOString().slice(0,10)
const FORM_VACIO: Form = { codigo: '', descripcion: '', tipo: 'porcentaje', valor: '', minimo_compra: '0', limite_usos: '', fecha_inicio: hoy, fecha_fin: '' }

const BDR = '1px solid oklch(0.88 0.03 70)'
const inputStyle = { backgroundColor: 'oklch(0.97 0.012 82)', color: 'oklch(0.20 0.03 30)', border: BDR, fontFamily: 'var(--font-dm-sans)' }

const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold" style={{ color: 'oklch(0.45 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>{label}</label>
    {children}
  </div>
)

export default function AdminCupones() {
  const supabase = createClient()
  const [cupones, setCupones] = useState<Cupon[]>([])
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState<Cupon | null>(null)
  const [form, setForm] = useState<Form>(FORM_VACIO)
  const [loading, setLoading] = useState(false)

  const cargar = async () => {
    const { data } = await supabase.from('cupones').select('*').order('created_at', { ascending: false })
    setCupones((data ?? []) as any)
  }
  useEffect(() => { cargar() }, [])

  const abrirNuevo = () => { setEditando(null); setForm(FORM_VACIO); setModal(true) }
  const abrirEditar = (c: Cupon) => {
    setEditando(c)
    setForm({ codigo: c.codigo, descripcion: c.descripcion ?? '', tipo: c.tipo, valor: String(c.valor), minimo_compra: String(c.minimo_compra), limite_usos: c.limite_usos ? String(c.limite_usos) : '', fecha_inicio: c.fecha_inicio?.slice(0,10) ?? hoy, fecha_fin: c.fecha_fin?.slice(0,10) ?? '' })
    setModal(true)
  }

  const guardar = async () => {
    if (!form.codigo || !form.valor) { toast.error('Código y valor son requeridos'); return }
    setLoading(true)
    const payload = {
      codigo: form.codigo.toUpperCase().trim(),
      descripcion: form.descripcion || null,
      tipo: form.tipo,
      valor: parseFloat(form.valor),
      minimo_compra: parseFloat(form.minimo_compra) || 0,
      limite_usos: form.limite_usos ? parseInt(form.limite_usos) : null,
      fecha_inicio: form.fecha_inicio,
      fecha_fin: form.fecha_fin || null,
    }
    if (editando) {
      await supabase.from('cupones').update(payload).eq('id', editando.id)
      toast.success('Cupón actualizado')
    } else {
      await supabase.from('cupones').insert(payload)
      toast.success('Cupón creado')
    }
    setModal(false); cargar(); setLoading(false)
  }

  const toggleActivo = async (c: Cupon) => {
    await supabase.from('cupones').update({ activo: !c.activo }).eq('id', c.id)
    toast.success(c.activo ? 'Cupón desactivado' : 'Cupón activado')
    cargar()
  }

  return (
    <div className="p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 style={{ fontFamily: 'var(--font-bebas)', fontSize: '2rem', letterSpacing: '0.04em', color: 'oklch(0.20 0.03 30)' }}>Cupones</h1>
        <Button onClick={abrirNuevo} className="gap-2 border-0" style={{ backgroundColor: 'oklch(0.50 0.22 24)', color: 'oklch(0.97 0.012 82)', fontFamily: 'var(--font-dm-sans)' }}>
          <Plus className="h-4 w-4" /> Nuevo cupón
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {cupones.length === 0 && <p className="text-sm text-center py-12" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>Sin cupones creados</p>}
        {cupones.map(c => (
          <div key={c.id} className="rounded-2xl p-4 flex items-center gap-4"
            style={{ backgroundColor: 'oklch(1 0 0)', border: BDR, opacity: c.activo ? 1 : 0.55 }}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.2rem', letterSpacing: '0.06em', color: c.activo ? 'oklch(0.50 0.22 24)' : 'oklch(0.55 0.02 40)' }}>{c.codigo}</span>
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: c.activo ? 'oklch(0.55 0.18 145 / 0.12)' : 'oklch(0.90 0.02 70)', color: c.activo ? 'oklch(0.40 0.15 145)' : 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
                  {c.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <p className="text-sm mt-0.5" style={{ color: 'oklch(0.40 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
                {c.tipo === 'porcentaje' ? `${c.valor}% de descuento` : `$${c.valor} de descuento`}
                {c.minimo_compra > 0 && ` · mínimo $${c.minimo_compra}`}
              </p>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                {/* Contador de usos */}
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg"
                    style={{ backgroundColor: c.limite_usos && c.usos_actuales >= c.limite_usos ? 'oklch(0.50 0.22 24 / 0.10)' : 'oklch(0.93 0.02 75)' }}>
                    <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '1rem', letterSpacing: '0.03em',
                      color: c.limite_usos && c.usos_actuales >= c.limite_usos ? 'oklch(0.50 0.22 24)' : 'oklch(0.25 0.02 40)' }}>
                      {c.usos_actuales}
                    </span>
                    {c.limite_usos && (
                      <span className="text-xs" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
                        / {c.limite_usos}
                      </span>
                    )}
                  </div>
                  <span className="text-xs" style={{ color: 'oklch(0.60 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
                    uso{c.usos_actuales !== 1 ? 's' : ''}
                  </span>
                </div>
                {/* Barra de progreso si hay límite */}
                {c.limite_usos && (
                  <div className="flex items-center gap-1.5 flex-1" style={{ minWidth: 80, maxWidth: 140 }}>
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'oklch(0.90 0.02 70)' }}>
                      <div className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (c.usos_actuales / c.limite_usos) * 100)}%`,
                          backgroundColor: c.usos_actuales >= c.limite_usos ? 'oklch(0.50 0.22 24)' : 'oklch(0.55 0.18 145)',
                        }} />
                    </div>
                    <span className="text-[10px]" style={{ color: 'oklch(0.60 0.02 40)', fontFamily: 'var(--font-dm-sans)', flexShrink: 0 }}>
                      {Math.round((c.usos_actuales / c.limite_usos) * 100)}%
                    </span>
                  </div>
                )}
                {/* Fechas */}
                <span className="text-xs" style={{ color: 'oklch(0.60 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
                  {c.fecha_inicio?.slice(0,10)}{c.fecha_fin ? ` → ${c.fecha_fin?.slice(0,10)}` : ''}
                </span>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => abrirEditar(c)}
                className="h-8 px-3 rounded-xl flex items-center justify-center text-xs font-medium transition-colors"
                style={{ backgroundColor: 'oklch(0.91 0.02 70)', color: 'oklch(0.35 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
                Editar
              </button>
              <button onClick={() => toggleActivo(c)}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                style={{ backgroundColor: c.activo ? 'oklch(0.45 0.15 145 / 0.12)' : 'oklch(0.91 0.02 70)', color: c.activo ? 'oklch(0.40 0.15 145)' : 'oklch(0.55 0.02 40)' }}>
                <Power className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModal(false)} />
          <div className="relative w-full max-w-md rounded-2xl p-6 flex flex-col gap-4 overflow-y-auto max-h-[90vh]"
            style={{ backgroundColor: 'oklch(1 0 0)', border: BDR, boxShadow: '0 8px 40px oklch(0 0 0 / 0.15)' }}>
            <div className="flex items-center justify-between">
              <h2 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.5rem', letterSpacing: '0.04em', color: 'oklch(0.20 0.03 30)' }}>{editando ? 'Editar cupón' : 'Nuevo cupón'}</h2>
              <button onClick={() => setModal(false)} style={{ color: 'oklch(0.55 0.02 40)' }}><X className="h-5 w-5" /></button>
            </div>
            <F label="Código *"><Input value={form.codigo} onChange={e => setForm({...form, codigo: e.target.value.toUpperCase()})} placeholder="BIENVENIDO20" style={inputStyle} /></F>
            <F label="Descripción"><Input value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} placeholder="20% en tu primer pedido" style={inputStyle} /></F>
            <div className="grid grid-cols-2 gap-3">
              <F label="Tipo">
                <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value as any})} className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={inputStyle}>
                  <option value="porcentaje">Porcentaje (%)</option>
                  <option value="fijo">Monto fijo ($)</option>
                </select>
              </F>
              <F label="Valor *"><Input type="number" value={form.valor} onChange={e => setForm({...form, valor: e.target.value})} placeholder={form.tipo === 'porcentaje' ? '20' : '50'} style={inputStyle} /></F>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <F label="Mínimo de compra"><Input type="number" value={form.minimo_compra} onChange={e => setForm({...form, minimo_compra: e.target.value})} placeholder="0" style={inputStyle} /></F>
              <F label="Límite de usos"><Input type="number" value={form.limite_usos} onChange={e => setForm({...form, limite_usos: e.target.value})} placeholder="Sin límite" style={inputStyle} /></F>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <F label="Fecha inicio *"><Input type="date" value={form.fecha_inicio} onChange={e => setForm({...form, fecha_inicio: e.target.value})} style={inputStyle} /></F>
              <F label="Fecha fin"><Input type="date" value={form.fecha_fin} onChange={e => setForm({...form, fecha_fin: e.target.value})} style={inputStyle} /></F>
            </div>
            <Button onClick={guardar} disabled={loading} className="gap-2 border-0" style={{ backgroundColor: 'oklch(0.50 0.22 24)', color: 'oklch(0.97 0.012 82)', fontFamily: 'var(--font-dm-sans)' }}>
              <Save className="h-4 w-4" />{loading ? 'Guardando…' : 'Guardar cupón'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
