'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Save, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

type Zona = { id: string; nombre: string; activa: boolean }
type Config = { nombre_negocio: string; telefono_negocio: string; hora_apertura: string; hora_cierre: string; tiempo_entrega_min: string; pedido_minimo: string; costo_envio: string }
const CONFIG_VACIA: Config = { nombre_negocio: 'Pide Pisto', telefono_negocio: '', hora_apertura: '10:00', hora_cierre: '23:00', tiempo_entrega_min: '30', pedido_minimo: '0', costo_envio: '0' }

export default function AdminConfiguracion() {
  const supabase = createClient()
  const [zonas, setZonas] = useState<Zona[]>([])
  const [config, setConfig] = useState<Config>(CONFIG_VACIA)
  const [nuevaZona, setNuevaZona] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingConfig, setLoadingConfig] = useState(false)

  const cargar = async () => {
    const { data } = await supabase.from('zonas').select('*').order('nombre')
    setZonas((data ?? []) as any)
    const { data: cfg } = await supabase.from('configuracion').select('*').single()
    if (cfg) setConfig({ nombre_negocio: cfg.nombre_negocio ?? 'Pide Pisto', telefono_negocio: cfg.telefono_negocio ?? '', hora_apertura: cfg.hora_apertura ?? '10:00', hora_cierre: cfg.hora_cierre ?? '23:00', tiempo_entrega_min: String(cfg.tiempo_entrega_min ?? 30), pedido_minimo: String(cfg.pedido_minimo ?? 0), costo_envio: String(cfg.costo_envio ?? 0) })
  }
  useEffect(() => { cargar() }, [])

  const guardarConfig = async () => {
    setLoadingConfig(true)
    const payload = { nombre_negocio: config.nombre_negocio, telefono_negocio: config.telefono_negocio, hora_apertura: config.hora_apertura, hora_cierre: config.hora_cierre, tiempo_entrega_min: parseInt(config.tiempo_entrega_min), pedido_minimo: parseFloat(config.pedido_minimo), costo_envio: parseFloat(config.costo_envio) }
    const { count } = await supabase.from('configuracion').select('*', { count: 'exact', head: true })
    if ((count ?? 0) > 0) await supabase.from('configuracion').update(payload)
    else await supabase.from('configuracion').insert(payload)
    toast.success('Configuración guardada')
    setLoadingConfig(false)
  }

  const agregarZona = async () => {
    if (!nuevaZona.trim()) return
    setLoading(true)
    await supabase.from('zonas').insert({ nombre: nuevaZona.trim(), activa: true })
    setNuevaZona(''); cargar(); toast.success('Zona agregada')
    setLoading(false)
  }

  const toggleZona = async (z: Zona) => {
    await supabase.from('zonas').update({ activa: !z.activa }).eq('id', z.id)
    toast.success(z.activa ? 'Zona desactivada' : 'Zona activada')
    cargar()
  }

  const inputStyle = { backgroundColor: 'oklch(0.22 0.03 22)', color: 'oklch(0.85 0.01 82)', border: '1px solid oklch(1 0 0 / 0.1)', fontFamily: 'var(--font-dm-sans)' }
  const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>{label}</label>
      {children}
    </div>
  )

  return (
    <div className="p-6 flex flex-col gap-6 max-w-2xl">
      <h1 style={{ fontFamily: 'var(--font-bebas)', fontSize: '2rem', letterSpacing: '0.04em', color: 'oklch(0.97 0.012 82)' }}>Configuración</h1>

      {/* Datos del negocio */}
      <div className="rounded-2xl p-5 flex flex-col gap-4" style={{ backgroundColor: 'oklch(0.18 0.03 22)', border: '1px solid oklch(1 0 0 / 0.06)' }}>
        <h2 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.2rem', letterSpacing: '0.04em', color: 'oklch(0.97 0.012 82)' }}>Datos del negocio</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <F label="Nombre del negocio"><Input value={config.nombre_negocio} onChange={e => setConfig({...config, nombre_negocio: e.target.value})} style={inputStyle} /></F>
          <F label="Teléfono de contacto"><Input value={config.telefono_negocio} onChange={e => setConfig({...config, telefono_negocio: e.target.value})} placeholder="55 1234 5678" style={inputStyle} /></F>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <F label="Hora apertura"><Input type="time" value={config.hora_apertura} onChange={e => setConfig({...config, hora_apertura: e.target.value})} style={inputStyle} /></F>
          <F label="Hora cierre"><Input type="time" value={config.hora_cierre} onChange={e => setConfig({...config, hora_cierre: e.target.value})} style={inputStyle} /></F>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <F label="Tiempo entrega (min)"><Input type="number" value={config.tiempo_entrega_min} onChange={e => setConfig({...config, tiempo_entrega_min: e.target.value})} style={inputStyle} /></F>
          <F label="Pedido mínimo ($)"><Input type="number" value={config.pedido_minimo} onChange={e => setConfig({...config, pedido_minimo: e.target.value})} style={inputStyle} /></F>
          <F label="Costo envío ($)"><Input type="number" value={config.costo_envio} onChange={e => setConfig({...config, costo_envio: e.target.value})} style={inputStyle} /></F>
        </div>
        <Button onClick={guardarConfig} disabled={loadingConfig} className="gap-2 border-0 self-start" style={{ backgroundColor: 'oklch(0.50 0.22 24)', color: 'oklch(0.97 0.012 82)', fontFamily: 'var(--font-dm-sans)' }}>
          <Save className="h-4 w-4" />{loadingConfig ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </div>

      {/* Zonas de cobertura */}
      <div className="rounded-2xl p-5 flex flex-col gap-4" style={{ backgroundColor: 'oklch(0.18 0.03 22)', border: '1px solid oklch(1 0 0 / 0.06)' }}>
        <h2 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.2rem', letterSpacing: '0.04em', color: 'oklch(0.97 0.012 82)' }}>Zonas de cobertura</h2>
        <div className="flex gap-2">
          <Input value={nuevaZona} onChange={e => setNuevaZona(e.target.value)} onKeyDown={e => e.key === 'Enter' && agregarZona()} placeholder="Nueva zona…" style={inputStyle} />
          <Button onClick={agregarZona} disabled={loading} className="border-0 flex-shrink-0" style={{ backgroundColor: 'oklch(0.50 0.22 24)', color: 'oklch(0.97 0.012 82)' }}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          {zonas.map(z => (
            <div key={z.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ backgroundColor: 'oklch(0.22 0.03 22)' }}>
              <span className="text-sm" style={{ color: z.activa ? 'oklch(0.80 0.01 82)' : 'oklch(0.50 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>{z.nombre}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: z.activa ? 'oklch(0.55 0.18 145 / 0.15)' : 'oklch(0.55 0.02 40 / 0.15)', color: z.activa ? 'oklch(0.45 0.15 145)' : 'oklch(0.50 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
                  {z.activa ? 'Activa' : 'Inactiva'}
                </span>
                <button onClick={() => toggleZona(z)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors" style={{ color: 'oklch(0.55 0.02 40)' }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
