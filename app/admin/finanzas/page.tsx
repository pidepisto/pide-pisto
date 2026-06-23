'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DollarSign, ShoppingBag, TrendingUp, XCircle } from 'lucide-react'

type Rango = '7d' | '30d' | '90d'
type DiaData = { dia: string; ingresos: number; pedidos: number }

export default function AdminFinanzas() {
  const supabase = createClient()
  const [rango, setRango] = useState<Rango>('7d')
  const [dias, setDias] = useState<DiaData[]>([])
  const [totales, setTotales] = useState({ ingresos: 0, pedidos: 0, ticket: 0, cancelados: 0 })

  useEffect(() => {
    const cargar = async () => {
      const dias_atras = rango === '7d' ? 7 : rango === '30d' ? 30 : 90
      const desde = new Date()
      desde.setDate(desde.getDate() - dias_atras)
      desde.setHours(0, 0, 0, 0)

      const { data } = await supabase.from('pedidos').select('total, estado, created_at').gte('created_at', desde.toISOString()).order('created_at')
      const pedidos = data ?? []

      const mapa: Record<string, DiaData> = {}
      pedidos.forEach(p => {
        const dia = p.created_at.slice(0, 10)
        if (!mapa[dia]) mapa[dia] = { dia, ingresos: 0, pedidos: 0 }
        mapa[dia].pedidos++
        if (p.estado !== 'cancelado') mapa[dia].ingresos += p.total
      })
      const arr = Object.values(mapa).sort((a, b) => a.dia.localeCompare(b.dia))
      setDias(arr)

      const validos = pedidos.filter(p => p.estado !== 'cancelado')
      const cancelados = pedidos.filter(p => p.estado === 'cancelado').length
      const ingresos = validos.reduce((a, p) => a + p.total, 0)
      setTotales({ ingresos, pedidos: pedidos.length, ticket: validos.length ? ingresos / validos.length : 0, cancelados })
    }
    cargar()
  }, [rango])

  const maxIngresos = Math.max(...dias.map(d => d.ingresos), 1)

  const KPIS = [
    { label: 'Ingresos', value: `$${totales.ingresos.toFixed(0)}`, sub: 'MXN', icon: <DollarSign className="h-4 w-4" />, color: 'oklch(0.55 0.18 145)' },
    { label: 'Pedidos', value: String(totales.pedidos), icon: <ShoppingBag className="h-4 w-4" />, color: 'oklch(0.50 0.22 24)' },
    { label: 'Ticket promedio', value: `$${totales.ticket.toFixed(0)}`, sub: 'MXN', icon: <TrendingUp className="h-4 w-4" />, color: 'oklch(0.76 0.14 80)' },
    { label: 'Cancelados', value: String(totales.cancelados), icon: <XCircle className="h-4 w-4" />, color: 'oklch(0.55 0.02 40)' },
  ]

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 style={{ fontFamily: 'var(--font-bebas)', fontSize: '2rem', letterSpacing: '0.04em', color: 'oklch(0.97 0.012 82)' }}>Finanzas</h1>
        <div className="flex gap-2">
          {(['7d','30d','90d'] as Rango[]).map(r => (
            <button key={r} onClick={() => setRango(r)} className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={{ backgroundColor: rango === r ? 'oklch(0.50 0.22 24)' : 'oklch(0.20 0.03 22)', color: rango === r ? 'oklch(0.97 0.012 82)' : 'oklch(0.60 0.02 40)', border: '1px solid oklch(1 0 0 / 0.06)', fontFamily: 'var(--font-dm-sans)' }}>
              {r === '7d' ? '7 días' : r === '30d' ? '30 días' : '90 días'}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPIS.map(({ label, value, sub, icon, color }) => (
          <div key={label} className="rounded-2xl p-5 flex flex-col gap-3" style={{ backgroundColor: 'oklch(0.18 0.03 22)', border: '1px solid oklch(1 0 0 / 0.06)' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>{label}</span>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}20`, color }}>{icon}</div>
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-bebas)', fontSize: '2rem', letterSpacing: '0.03em', color: 'oklch(0.97 0.012 82)' }}>{value}</p>
              {sub && <p className="text-xs" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>{sub}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Gráfica de barras por día */}
      <div className="rounded-2xl p-5 flex flex-col gap-4" style={{ backgroundColor: 'oklch(0.18 0.03 22)', border: '1px solid oklch(1 0 0 / 0.06)' }}>
        <h2 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.2rem', letterSpacing: '0.04em', color: 'oklch(0.97 0.012 82)' }}>Ingresos por día</h2>
        {dias.length === 0 && <p className="text-sm py-8 text-center" style={{ color: 'oklch(0.50 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>Sin datos en este período</p>}
        <div className="flex items-end gap-1.5 h-40 overflow-x-auto pb-2">
          {dias.map(d => (
            <div key={d.dia} className="flex flex-col items-center gap-1 flex-shrink-0" style={{ minWidth: rango === '90d' ? '8px' : rango === '30d' ? '18px' : '32px' }}>
              <div className="w-full rounded-t-md transition-all" title={`$${d.ingresos.toFixed(0)}`}
                style={{ height: `${Math.max(4, (d.ingresos / maxIngresos) * 128)}px`, backgroundColor: 'oklch(0.50 0.22 24)' }} />
              {rango === '7d' && (
                <span className="text-[9px]" style={{ color: 'oklch(0.50 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
                  {new Date(d.dia + 'T12:00').toLocaleDateString('es-MX', { weekday: 'short' })}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tabla de días */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid oklch(1 0 0 / 0.06)' }}>
        <div className="grid grid-cols-3 px-4 py-2" style={{ backgroundColor: 'oklch(0.16 0.03 22)' }}>
          {['Fecha','Pedidos','Ingresos'].map(h => (
            <span key={h} className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'oklch(0.50 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>{h}</span>
          ))}
        </div>
        {[...dias].reverse().slice(0, 14).map((d, i) => (
          <div key={d.dia} className="grid grid-cols-3 px-4 py-3 border-t" style={{ borderColor: 'oklch(1 0 0 / 0.04)', backgroundColor: i % 2 === 0 ? 'oklch(0.18 0.03 22)' : 'oklch(0.17 0.028 22)' }}>
            <span className="text-sm" style={{ color: 'oklch(0.75 0.01 82)', fontFamily: 'var(--font-dm-sans)' }}>
              {new Date(d.dia + 'T12:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
            </span>
            <span className="text-sm" style={{ color: 'oklch(0.75 0.01 82)', fontFamily: 'var(--font-dm-sans)' }}>{d.pedidos}</span>
            <span className="text-sm font-semibold" style={{ color: 'oklch(0.55 0.18 145)', fontFamily: 'var(--font-dm-sans)' }}>${d.ingresos.toFixed(0)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
