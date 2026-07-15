'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Save, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

type Config = { nombre_negocio: string; telefono_negocio: string; hora_apertura: string; hora_cierre: string; tiempo_entrega_min: string; pedido_minimo: string; costo_envio: string; mp_access_token: string }
const CONFIG_VACIA: Config = { nombre_negocio: 'Pide Pisto', telefono_negocio: '', hora_apertura: '10:00', hora_cierre: '23:00', tiempo_entrega_min: '30', pedido_minimo: '0', costo_envio: '0', mp_access_token: '' }

const BDR = '1px solid oklch(0.88 0.03 70)'
const inputStyle = { backgroundColor: 'oklch(0.97 0.012 82)', color: 'oklch(0.20 0.03 30)', border: BDR, fontFamily: 'var(--font-dm-sans)' }

const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold" style={{ color: 'oklch(0.45 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>{label}</label>
    {children}
  </div>
)

export default function AdminConfiguracion() {
  const supabase = createClient()
  const [config, setConfig] = useState<Config>(CONFIG_VACIA)
  const [loadingConfig, setLoadingConfig] = useState(false)
  const [verToken,      setVerToken]      = useState(false)
  const [loadingToken,  setLoadingToken]  = useState(false)

  const cargar = async () => {
    const { data: cfg } = await supabase.from('configuracion').select('*').single()
    if (cfg) setConfig({ nombre_negocio: cfg.nombre_negocio ?? 'Pide Pisto', telefono_negocio: cfg.telefono_negocio ?? '', hora_apertura: cfg.hora_apertura ?? '10:00', hora_cierre: cfg.hora_cierre ?? '23:00', tiempo_entrega_min: String(cfg.tiempo_entrega_min ?? 30), pedido_minimo: String(cfg.pedido_minimo ?? 0), costo_envio: String(cfg.costo_envio ?? 0), mp_access_token: cfg.mp_access_token ?? '' })
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

  const guardarToken = async () => {
    if (!config.mp_access_token.trim()) { toast.error('Pega tu Access Token de MercadoPago'); return }
    setLoadingToken(true)
    const { count } = await supabase.from('configuracion').select('*', { count: 'exact', head: true })
    if ((count ?? 0) > 0) await supabase.from('configuracion').update({ mp_access_token: config.mp_access_token.trim() })
    else await supabase.from('configuracion').insert({ mp_access_token: config.mp_access_token.trim() })
    toast.success('Access Token guardado')
    setLoadingToken(false)
  }

  return (
    <div className="p-6 flex flex-col gap-6 max-w-2xl">
      <h1 style={{ fontFamily: 'var(--font-bebas)', fontSize: '2rem', letterSpacing: '0.04em', color: 'oklch(0.20 0.03 30)' }}>Configuración</h1>

      <div className="rounded-2xl p-5 flex flex-col gap-4" style={{ backgroundColor: 'oklch(1 0 0)', border: BDR }}>
        <h2 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.2rem', letterSpacing: '0.04em', color: 'oklch(0.20 0.03 30)' }}>Datos del negocio</h2>
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

      {/* ── MercadoPago ── */}
      <div className="rounded-2xl p-5 flex flex-col gap-4" style={{ backgroundColor: 'oklch(1 0 0)', border: BDR }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'oklch(0.60 0.20 255 / 0.12)' }}>
            <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '0.85rem', letterSpacing: '0.03em', color: 'oklch(0.40 0.20 255)' }}>MP</span>
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.2rem', letterSpacing: '0.04em', color: 'oklch(0.20 0.03 30)' }}>MercadoPago</h2>
            <p className="text-xs" style={{ color: 'oklch(0.50 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
              Pega tu Access Token de producción para habilitar pagos en línea
            </p>
          </div>
        </div>

        {/* Estado */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: config.mp_access_token ? 'oklch(0.45 0.15 145 / 0.08)' : 'oklch(0.50 0.22 24 / 0.07)', border: `1px solid ${config.mp_access_token ? 'oklch(0.45 0.15 145 / 0.3)' : 'oklch(0.50 0.22 24 / 0.25)'}` }}>
          {config.mp_access_token
            ? <><CheckCircle className="h-4 w-4 flex-shrink-0" style={{ color: 'oklch(0.45 0.15 145)' }} /><span className="text-xs font-semibold" style={{ color: 'oklch(0.35 0.12 145)', fontFamily: 'var(--font-dm-sans)' }}>Conectado — pagos en línea activos</span></>
            : <><XCircle   className="h-4 w-4 flex-shrink-0" style={{ color: 'oklch(0.50 0.22 24)' }}  /><span className="text-xs font-semibold" style={{ color: 'oklch(0.45 0.15 24)',  fontFamily: 'var(--font-dm-sans)' }}>Sin configurar — los clientes no podrán pagar en línea</span></>
          }
        </div>

        <F label="Access Token de producción">
          <div className="relative">
            <Input
              type={verToken ? 'text' : 'password'}
              value={config.mp_access_token}
              onChange={e => setConfig({ ...config, mp_access_token: e.target.value })}
              placeholder="APP_USR-..."
              style={{ ...inputStyle, paddingRight: '2.5rem', fontFamily: 'monospace', fontSize: '0.8rem' }}
            />
            <button type="button" onClick={() => setVerToken(v => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2"
              style={{ color: 'oklch(0.55 0.02 40)' }}>
              {verToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </F>

        <div className="rounded-xl p-3 text-xs flex flex-col gap-1" style={{ backgroundColor: 'oklch(0.95 0.01 80)', color: 'oklch(0.45 0.03 40)', fontFamily: 'var(--font-dm-sans)' }}>
          <p className="font-semibold">¿Dónde encuentro mi Access Token?</p>
          <p>1. Entra a mercadopago.com.mx con tu cuenta de negocio</p>
          <p>2. Ve a <strong>Tu negocio → Configuración → Credenciales</strong></p>
          <p>3. Selecciona <strong>Producción</strong> y copia el <strong>Access Token</strong></p>
        </div>

        <Button onClick={guardarToken} disabled={loadingToken} className="gap-2 border-0 self-start" style={{ backgroundColor: 'oklch(0.40 0.20 255)', color: 'oklch(0.97 0.012 82)', fontFamily: 'var(--font-dm-sans)' }}>
          <Save className="h-4 w-4" />{loadingToken ? 'Guardando…' : 'Guardar Access Token'}
        </Button>
      </div>
    </div>
  )
}
