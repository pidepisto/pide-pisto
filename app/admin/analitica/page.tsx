'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { fp } from '@/lib/utils'

type TopProd = { nombre: string; total: number }
type TopZona = { nombre: string; pedidos: number }
type HoraDist = { hora: number; pedidos: number }
type ClienteFrecuente = { nombre: string | null; telefono: string | null; pedidos: number; gasto: number }

const BDR = '1px solid oklch(0.88 0.03 70)'
const CARD = { backgroundColor: 'oklch(1 0 0)', border: BDR }

export default function AdminAnalitica() {
  const supabase = createClient()
  const [topProd, setTopProd] = useState<TopProd[]>([])
  const [topZonas, setTopZonas] = useState<TopZona[]>([])
  const [horas, setHoras] = useState<HoraDist[]>([])
  const [clientes, setClientes] = useState<ClienteFrecuente[]>([])

  useEffect(() => {
    const cargar = async () => {
      const hace30 = new Date(); hace30.setDate(hace30.getDate() - 30)
      const [{ data: items }, { data: pedidos }, { data: todosPedidos }] = await Promise.all([
        supabase.from('pedido_items').select('cantidad, producto:productos(nombre)'),
        supabase.from('pedidos').select('zona_id, zona:zonas(nombre), created_at, usuario_id, total, estado').gte('created_at', hace30.toISOString()),
        supabase.from('pedidos').select('usuario_id, total, estado, usuario:perfiles!pedidos_usuario_id_fkey(nombre, telefono)'),
      ])

      const prodMap: Record<string, number> = {}
      ;(items ?? []).forEach((i: any) => {
        const n = i.producto?.nombre ?? 'Desconocido'
        prodMap[n] = (prodMap[n] || 0) + i.cantidad
      })
      setTopProd(Object.entries(prodMap).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([nombre, total]) => ({ nombre, total })))

      const zonaMap: Record<string, number> = {}
      ;(pedidos ?? []).forEach((p: any) => {
        const n = p.zona?.nombre ?? 'Sin zona'
        zonaMap[n] = (zonaMap[n] || 0) + 1
      })
      setTopZonas(Object.entries(zonaMap).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([nombre, pedidos]) => ({ nombre, pedidos })))

      const horaMap: Record<number, number> = {}
      ;(pedidos ?? []).forEach((p: any) => {
        const h = new Date(p.created_at).getHours()
        horaMap[h] = (horaMap[h] || 0) + 1
      })
      setHoras(Array.from({ length: 24 }, (_, h) => ({ hora: h, pedidos: horaMap[h] || 0 })))

      const cliMap: Record<string, ClienteFrecuente> = {}
      ;(todosPedidos ?? []).forEach((p: any) => {
        if (!p.usuario_id || p.estado === 'cancelado') return
        if (!cliMap[p.usuario_id]) cliMap[p.usuario_id] = { nombre: p.usuario?.nombre ?? null, telefono: p.usuario?.telefono ?? null, pedidos: 0, gasto: 0 }
        cliMap[p.usuario_id].pedidos++
        cliMap[p.usuario_id].gasto += p.total
      })
      setClientes(Object.values(cliMap).sort((a, b) => b.pedidos - a.pedidos).slice(0, 8))
    }
    cargar()
  }, [])

  const maxProd = Math.max(...topProd.map(p => p.total), 1)
  const maxHora = Math.max(...horas.map(h => h.pedidos), 1)

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h1 style={{ fontFamily: 'var(--font-bebas)', fontSize: '2rem', letterSpacing: '0.04em', color: 'oklch(0.20 0.03 30)' }}>Analítica</h1>
        <p className="text-sm mt-0.5" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>Últimos 30 días</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Top productos */}
        <div className="rounded-2xl p-5 flex flex-col gap-4" style={CARD}>
          <h2 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.2rem', letterSpacing: '0.04em', color: 'oklch(0.20 0.03 30)' }}>Productos más vendidos</h2>
          <div className="flex flex-col gap-2.5">
            {topProd.map((p, i) => (
              <div key={p.nombre} className="flex items-center gap-3">
                <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '1rem', color: 'oklch(0.76 0.14 80)', minWidth: '1.2rem' }}>{i+1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate" style={{ color: 'oklch(0.25 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>{p.nombre}</p>
                  <div className="h-1.5 rounded-full mt-1 overflow-hidden" style={{ backgroundColor: 'oklch(0.90 0.02 70)' }}>
                    <div className="h-full rounded-full" style={{ backgroundColor: 'oklch(0.50 0.22 24)', width: `${(p.total / maxProd) * 100}%` }} />
                  </div>
                </div>
                <span className="text-sm font-semibold" style={{ color: 'oklch(0.45 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>{p.total}</span>
              </div>
            ))}
            {topProd.length === 0 && <p className="text-sm text-center py-4" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>Sin datos</p>}
          </div>
        </div>

        {/* Top zonas */}
        <div className="rounded-2xl p-5 flex flex-col gap-4" style={CARD}>
          <h2 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.2rem', letterSpacing: '0.04em', color: 'oklch(0.20 0.03 30)' }}>Zonas con más pedidos</h2>
          <div className="flex flex-col gap-2.5">
            {topZonas.map((z, i) => (
              <div key={z.nombre} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '1rem', color: 'oklch(0.45 0.15 145)', minWidth: '1.2rem' }}>{i+1}</span>
                  <span className="text-sm" style={{ color: 'oklch(0.25 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>{z.nombre}</span>
                </div>
                <span className="text-sm font-semibold px-2 py-0.5 rounded-lg" style={{ backgroundColor: 'oklch(0.55 0.18 145 / 0.1)', color: 'oklch(0.40 0.15 145)', fontFamily: 'var(--font-dm-sans)' }}>{z.pedidos}</span>
              </div>
            ))}
            {topZonas.length === 0 && <p className="text-sm text-center py-4" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>Sin datos</p>}
          </div>
        </div>
      </div>

      {/* Horas pico */}
      <div className="rounded-2xl p-5 flex flex-col gap-4" style={CARD}>
        <h2 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.2rem', letterSpacing: '0.04em', color: 'oklch(0.20 0.03 30)' }}>Horas pico</h2>
        <div className="flex items-end gap-1 h-28 overflow-x-auto">
          {horas.map(h => (
            <div key={h.hora} className="flex flex-col items-center gap-1 flex-shrink-0" style={{ minWidth: '28px' }}>
              <div className="w-full rounded-t-sm transition-all" title={`${h.pedidos} pedidos`}
                style={{ height: `${Math.max(2, (h.pedidos / maxHora) * 96)}px`, backgroundColor: h.pedidos > 0 ? 'oklch(0.76 0.14 80)' : 'oklch(0.90 0.02 70)' }} />
              <span className="text-[9px]" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>{h.hora}h</span>
            </div>
          ))}
        </div>
      </div>

      {/* Clientes frecuentes */}
      <div className="rounded-2xl overflow-hidden" style={{ border: BDR }}>
        <div className="grid grid-cols-4 px-4 py-2" style={{ backgroundColor: 'oklch(0.93 0.02 75)' }}>
          {['Cliente','Teléfono','Pedidos','Gasto total'].map(h => (
            <span key={h} className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'oklch(0.45 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>{h}</span>
          ))}
        </div>
        {clientes.length === 0 && (
          <p className="text-sm text-center py-8" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>Sin datos</p>
        )}
        {clientes.map((c, i) => (
          <div key={i} className="grid grid-cols-4 px-4 py-3 border-t" style={{ borderColor: 'oklch(0.90 0.02 70)', backgroundColor: i % 2 === 0 ? 'oklch(1 0 0)' : 'oklch(0.97 0.012 82)' }}>
            <span className="text-sm" style={{ color: 'oklch(0.25 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>{c.nombre ?? 'Anónimo'}</span>
            <span className="text-sm" style={{ color: 'oklch(0.45 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>{c.telefono ?? '—'}</span>
            <span className="text-sm" style={{ color: 'oklch(0.60 0.12 75)', fontFamily: 'var(--font-dm-sans)' }}>{c.pedidos}</span>
            <span className="text-sm font-semibold" style={{ color: 'oklch(0.40 0.15 145)', fontFamily: 'var(--font-dm-sans)' }}>{fp(c.gasto)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
