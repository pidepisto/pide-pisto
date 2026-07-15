'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2, MapPin, X, Save, Power, AlertTriangle, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { fp } from '@/lib/utils'

type Zona = {
  id: string
  nombre: string
  descripcion: string | null
  activa: boolean
  costo_envio: number
  envio_gratis_desde: number | null
}

type Form = {
  nombre: string
  descripcion: string
  costo_envio: string
  envio_gratis_desde: string
  activa: boolean
}

const FORM_VACIO: Form = { nombre: '', descripcion: '', costo_envio: '0', envio_gratis_desde: '', activa: true }

const RED  = 'oklch(0.50 0.22 24)'
const GRN  = 'oklch(0.55 0.18 145)'
const BDR  = '1px solid oklch(0.88 0.03 70)'
const inputStyle = {
  backgroundColor: 'oklch(0.97 0.012 82)',
  color: 'oklch(0.20 0.03 30)',
  border: BDR,
  fontFamily: 'var(--font-dm-sans)',
}

const F = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-baseline justify-between">
      <label className="text-xs font-semibold" style={{ color: 'oklch(0.35 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>{label}</label>
      {hint && <span className="text-[10px]" style={{ color: 'oklch(0.60 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>{hint}</span>}
    </div>
    {children}
  </div>
)

export default function AdminZonas() {
  const supabase = createClient()
  const router   = useRouter()
  const [zonas, setZonas]           = useState<Zona[]>([])
  const [coloniasCount, setColoniasCount] = useState<Record<string, number>>({})
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState<Zona | null>(null)
  const [form, setForm] = useState<Form>(FORM_VACIO)
  const [loading, setLoading] = useState(false)
  const [confirmarBorrar, setConfirmarBorrar] = useState<Zona | null>(null)
  const [pedidosZona, setPedidosZona] = useState(0)

  const cargar = async () => {
    const [{ data: z }, { data: c }] = await Promise.all([
      supabase.from('zonas').select('*').order('nombre'),
      supabase.from('colonias').select('zona_id'),
    ])
    setZonas((z ?? []) as Zona[])
    const counts: Record<string, number> = {}
    ;(c ?? []).forEach((row: any) => { counts[row.zona_id] = (counts[row.zona_id] ?? 0) + 1 })
    setColoniasCount(counts)
  }
  useEffect(() => { cargar() }, [])

  const abrirNueva = () => {
    setEditando(null)
    setForm(FORM_VACIO)
    setModal(true)
  }

  const abrirEditar = (z: Zona) => {
    setEditando(z)
    setForm({
      nombre: z.nombre,
      descripcion: z.descripcion ?? '',
      costo_envio: String(z.costo_envio),
      envio_gratis_desde: z.envio_gratis_desde != null ? String(z.envio_gratis_desde) : '',
      activa: z.activa,
    })
    setModal(true)
  }

  const guardar = async () => {
    if (!form.nombre.trim()) { toast.error('El nombre es requerido'); return }
    setLoading(true)
    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      costo_envio: parseFloat(form.costo_envio) || 0,
      envio_gratis_desde: form.envio_gratis_desde ? parseFloat(form.envio_gratis_desde) : null,
      activa: form.activa,
    }
    if (editando) {
      await supabase.from('zonas').update(payload).eq('id', editando.id)
      toast.success('Zona actualizada')
    } else {
      await supabase.from('zonas').insert(payload)
      toast.success('Zona creada')
    }
    setModal(false)
    cargar()
    setLoading(false)
  }

  const toggleActiva = async (z: Zona) => {
    await supabase.from('zonas').update({ activa: !z.activa }).eq('id', z.id)
    toast.success(z.activa ? `${z.nombre} desactivada` : `${z.nombre} activada`)
    cargar()
  }

  const pedirConfirmacionBorrar = async (z: Zona) => {
    const { count } = await supabase.from('pedidos').select('*', { count: 'exact', head: true }).eq('zona_id', z.id)
    setPedidosZona(count ?? 0)
    setConfirmarBorrar(z)
  }

  const eliminar = async () => {
    if (!confirmarBorrar) return
    await supabase.from('zonas').delete().eq('id', confirmarBorrar.id)
    toast.success(`${confirmarBorrar.nombre} eliminada`)
    setConfirmarBorrar(null)
    cargar()
  }

  return (
    <div className="p-6 flex flex-col gap-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 style={{ fontFamily: 'var(--font-bebas)', fontSize: '2rem', letterSpacing: '0.04em', color: 'oklch(0.20 0.03 30)' }}>
            Zonas de cobertura
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
            {zonas.length} zona{zonas.length !== 1 ? 's' : ''} registrada{zonas.length !== 1 ? 's' : ''}
            {zonas.filter(z => z.activa).length > 0 && ` · ${zonas.filter(z => z.activa).length} activa${zonas.filter(z => z.activa).length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button onClick={abrirNueva} className="border-0 gap-2 flex-shrink-0"
          style={{ backgroundColor: RED, color: 'oklch(0.97 0.012 82)', fontFamily: 'var(--font-dm-sans)' }}>
          <Plus className="h-4 w-4" /> Nueva zona
        </Button>
      </div>

      {/* Lista vacía */}
      {zonas.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl"
          style={{ border: `2px dashed oklch(0.85 0.03 70)` }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${RED}10` }}>
            <MapPin className="h-6 w-6" style={{ color: RED }} />
          </div>
          <div className="text-center">
            <p className="font-semibold" style={{ color: 'oklch(0.25 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>Sin zonas de cobertura</p>
            <p className="text-sm mt-0.5" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>Crea tu primera zona para empezar a recibir pedidos</p>
          </div>
          <Button onClick={abrirNueva} className="border-0 gap-2"
            style={{ backgroundColor: RED, color: 'oklch(0.97 0.012 82)', fontFamily: 'var(--font-dm-sans)' }}>
            <Plus className="h-4 w-4" /> Crear primera zona
          </Button>
        </div>
      )}

      {/* Tarjetas de zonas */}
      <div className="flex flex-col gap-3">
        {zonas.map(z => (
          <div key={z.id} className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: 'oklch(1 0 0)', border: BDR, opacity: z.activa ? 1 : 0.6 }}>
            {/* Franja de color */}
            <div className="h-1 w-full" style={{ backgroundColor: z.activa ? RED : 'oklch(0.85 0.03 70)' }} />

            <div className="p-4 flex flex-col gap-3">
              {/* Fila principal */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: z.activa ? `${RED}10` : 'oklch(0.92 0.02 70)' }}>
                    <MapPin className="h-4 w-4" style={{ color: z.activa ? RED : 'oklch(0.60 0.02 40)' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold" style={{ color: 'oklch(0.20 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>{z.nombre}</p>
                    {z.descripcion && (
                      <p className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>{z.descripcion}</p>
                    )}
                  </div>
                </div>
                {/* Acciones */}
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => toggleActiva(z)}
                    className="text-xs font-medium px-2.5 py-1 rounded-lg transition-colors"
                    style={{ backgroundColor: z.activa ? 'oklch(0.45 0.15 145 / 0.12)' : 'oklch(0.92 0.02 70)', color: z.activa ? 'oklch(0.38 0.14 145)' : 'oklch(0.50 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
                    {z.activa ? 'Activa' : 'Inactiva'}
                  </button>
                  <button onClick={() => abrirEditar(z)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                    style={{ backgroundColor: 'oklch(0.92 0.02 70)', color: 'oklch(0.40 0.02 40)' }}
                    title="Editar">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => pedirConfirmacionBorrar(z)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-red-50"
                    style={{ backgroundColor: 'oklch(0.92 0.02 70)', color: 'oklch(0.55 0.12 24)' }}
                    title="Eliminar">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Colonias */}
              <button
                onClick={() => router.push(`/admin/zonas/${z.id}`)}
                className="flex items-center justify-between px-3 py-2 rounded-xl transition-colors hover:bg-black/4"
                style={{ backgroundColor: 'oklch(0.96 0.01 82)' }}>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" style={{ color: RED }} />
                  <span className="text-sm font-medium" style={{ color: 'oklch(0.25 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
                    {coloniasCount[z.id] ?? 0} colonia{(coloniasCount[z.id] ?? 0) !== 1 ? 's' : ''} registrada{(coloniasCount[z.id] ?? 0) !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs" style={{ color: RED, fontFamily: 'var(--font-dm-sans)' }}>Gestionar</span>
                  <ChevronRight className="h-3.5 w-3.5" style={{ color: RED }} />
                </div>
              </button>

              {/* Métricas de envío */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t" style={{ borderColor: 'oklch(0.92 0.02 70)' }}>
                <div className="rounded-xl px-3 py-2" style={{ backgroundColor: 'oklch(0.96 0.01 82)' }}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>Costo de envío</p>
                  <p style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.15rem', letterSpacing: '0.03em', color: RED, lineHeight: 1.2 }}>
                    {z.costo_envio === 0 ? 'Gratis' : fp(z.costo_envio)}
                  </p>
                </div>
                <div className="rounded-xl px-3 py-2" style={{ backgroundColor: 'oklch(0.96 0.01 82)' }}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>Envío gratis desde</p>
                  <p style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.15rem', letterSpacing: '0.03em', color: z.envio_gratis_desde != null ? GRN : 'oklch(0.65 0.02 40)', lineHeight: 1.2 }}>
                    {z.envio_gratis_desde != null ? fp(z.envio_gratis_desde) : 'No aplica'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── MODAL CREAR / EDITAR ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModal(false)} />
          <div className="relative w-full max-w-md rounded-2xl flex flex-col gap-5 overflow-y-auto max-h-[90vh]"
            style={{ backgroundColor: 'oklch(1 0 0)', border: BDR, boxShadow: '0 8px 40px oklch(0 0 0 / 0.15)' }}>
            {/* Cabecera modal */}
            <div className="flex items-center justify-between px-6 pt-5">
              <h2 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.5rem', letterSpacing: '0.04em', color: 'oklch(0.20 0.03 30)' }}>
                {editando ? 'Editar zona' : 'Nueva zona'}
              </h2>
              <button onClick={() => setModal(false)} style={{ color: 'oklch(0.55 0.02 40)' }}><X className="h-5 w-5" /></button>
            </div>

            <div className="flex flex-col gap-4 px-6 pb-6">
              <F label="Nombre de la zona *">
                <Input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})}
                  placeholder="Ej: Centro Chalco, Col. Metropolitana…" style={inputStyle} />
              </F>

              <F label="Descripción / notas internas" hint="Solo visible para admins">
                <textarea
                  value={form.descripcion}
                  onChange={e => setForm({...form, descripcion: e.target.value})}
                  placeholder="Ej: Incluye las calles de la av. principal hasta el mercado"
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
                  style={inputStyle}
                />
              </F>

              <div className="grid grid-cols-2 gap-3">
                <F label="Costo de envío ($)" hint="0 = gratis siempre">
                  <Input type="number" min="0" step="5"
                    value={form.costo_envio}
                    onChange={e => setForm({...form, costo_envio: e.target.value})}
                    placeholder="0" style={inputStyle} />
                </F>
                <F label="Gratis desde ($)" hint="Dejar vacío = nunca">
                  <Input type="number" min="0" step="50"
                    value={form.envio_gratis_desde}
                    onChange={e => setForm({...form, envio_gratis_desde: e.target.value})}
                    placeholder="Sin mínimo" style={inputStyle} />
                </F>
              </div>

              {/* Preview de envío */}
              {(form.costo_envio || form.envio_gratis_desde) && (
                <div className="rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: 'oklch(0.96 0.01 82)', color: 'oklch(0.35 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
                  {parseFloat(form.costo_envio) === 0
                    ? '✓ El cliente no paga envío en esta zona'
                    : form.envio_gratis_desde
                      ? `Envío ${fp(parseFloat(form.costo_envio) || 0)} · gratis a partir de ${fp(parseFloat(form.envio_gratis_desde))}`
                      : `Envío ${fp(parseFloat(form.costo_envio) || 0)} · sin envío gratis`
                  }
                </div>
              )}

              {/* Toggle activa */}
              <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ backgroundColor: 'oklch(0.96 0.01 82)' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'oklch(0.25 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>Zona activa</p>
                  <p className="text-xs" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>Los clientes pueden seleccionarla al pedir</p>
                </div>
                <button onClick={() => setForm({...form, activa: !form.activa})}
                  className="w-11 h-6 rounded-full transition-colors relative"
                  style={{ backgroundColor: form.activa ? RED : 'oklch(0.80 0.02 70)' }}>
                  <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                    style={{ left: form.activa ? '1.375rem' : '0.125rem' }} />
                </button>
              </div>

              <Button onClick={guardar} disabled={loading} className="gap-2 border-0"
                style={{ backgroundColor: RED, color: 'oklch(0.97 0.012 82)', fontFamily: 'var(--font-dm-sans)' }}>
                <Save className="h-4 w-4" />{loading ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear zona'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CONFIRMAR BORRADO ── */}
      {confirmarBorrar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmarBorrar(null)} />
          <div className="relative w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4"
            style={{ backgroundColor: 'oklch(1 0 0)', border: BDR, boxShadow: '0 8px 40px oklch(0 0 0 / 0.15)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'oklch(0.50 0.22 24 / 0.10)' }}>
                <AlertTriangle className="h-5 w-5" style={{ color: RED }} />
              </div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.2rem', letterSpacing: '0.03em', color: 'oklch(0.20 0.03 30)' }}>
                  Eliminar zona
                </h3>
                <p className="text-sm" style={{ color: 'oklch(0.45 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
                  {confirmarBorrar.nombre}
                </p>
              </div>
            </div>

            {pedidosZona > 0 && (
              <div className="rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: 'oklch(0.50 0.22 24 / 0.08)', color: 'oklch(0.40 0.15 24)', fontFamily: 'var(--font-dm-sans)' }}>
                ⚠️ Esta zona tiene <strong>{pedidosZona} pedido{pedidosZona !== 1 ? 's' : ''}</strong> registrado{pedidosZona !== 1 ? 's' : ''}. Los pedidos existentes no se borrarán pero quedarán sin zona asignada.
              </div>
            )}

            <p className="text-sm" style={{ color: 'oklch(0.45 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
              Esta acción no se puede deshacer. ¿Continuar?
            </p>

            <div className="flex gap-2">
              <button onClick={() => setConfirmarBorrar(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{ backgroundColor: 'oklch(0.92 0.02 70)', color: 'oklch(0.35 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
                Cancelar
              </button>
              <button onClick={eliminar}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{ backgroundColor: RED, color: 'oklch(0.97 0.012 82)', fontFamily: 'var(--font-dm-sans)' }}>
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
