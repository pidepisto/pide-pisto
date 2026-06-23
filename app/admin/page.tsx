'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ShoppingBag, DollarSign, Users, TrendingUp, Clock, CheckCircle, Truck, PackageCheck } from 'lucide-react'

const RED = 'oklch(0.50 0.22 24)'
const YEL = 'oklch(0.76 0.14 80)'
const GRN = 'oklch(0.45 0.15 145)'
const TXT = { color: 'oklch(0.2 0.03 30)',  fontFamily: 'var(--font-dm-sans)' }
const DIM = { color: 'oklch(0.48 0.03 40)', fontFamily: 'var(--font-dm-sans)' }
const CARD = { backgroundColor: 'oklch(1 0 0)', border: '1px solid oklch(0.87 0.03 70)', borderRadius: '1rem' }

type Stats = {
  pedidosHoy: number; ingresosHoy: number; pedidosActivos: number; ticketPromedio: number
  pedidosPorEstado: Record<string, number>; topProductos: { nombre: string; total: number }[]
}

function KPI({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-3" style={CARD}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider" style={DIM}>{label}</span>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}18`, color }}>{icon}</div>
      </div>
      <div>
        <p style={{ fontFamily: 'var(--font-bebas)', fontSize: '2rem', letterSpacing: '0.03em', color: 'oklch(0.2 0.03 30)' }}>{value}</p>
        {sub && <p className="text-xs mt-0.5" style={DIM}>{sub}</p>}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const supabase = createClient()
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    const cargar = async () => {
      const hoy = new Date(); hoy.setHours(0,0,0,0)
      const [{ data: pedidosHoy }, { data: todos }, { data: items }] = await Promise.all([
        supabase.from('pedidos').select('total, estado').gte('created_at', hoy.toISOString()),
        supabase.from('pedidos').select('estado'),
        supabase.from('pedido_items').select('cantidad, productos(nombre)'),
      ])
      const ingresosHoy = (pedidosHoy ?? []).filter(p => p.estado !== 'cancelado').reduce((a, p) => a + p.total, 0)
      const activos = (todos ?? []).filter(p => ['pendiente','confirmado','en_camino'].includes(p.estado)).length
      const porEstado = (todos ?? []).reduce((a: Record<string,number>, p) => { a[p.estado] = (a[p.estado]||0)+1; return a }, {})
      const prodMap: Record<string,number> = {}
      ;(items ?? []).forEach((i: any) => { const n = i.productos?.nombre ?? '?'; prodMap[n] = (prodMap[n]||0) + i.cantidad })
      const top = Object.entries(prodMap).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([nombre,total])=>({nombre,total}))
      setStats({ pedidosHoy: (pedidosHoy??[]).length, ingresosHoy, pedidosActivos: activos, ticketPromedio: (pedidosHoy??[]).length ? ingresosHoy/(pedidosHoy??[]).length : 0, pedidosPorEstado: porEstado, topProductos: top })
    }
    cargar()
    const t = setInterval(cargar, 30000)
    return () => clearInterval(t)
  }, [])

  const estados = [
    { key:'pendiente',  label:'Pendientes',  icon:<Clock className="h-4 w-4"/>,        color: YEL },
    { key:'confirmado', label:'Confirmados', icon:<CheckCircle className="h-4 w-4"/>,  color: RED },
    { key:'en_camino',  label:'En camino',   icon:<Truck className="h-4 w-4"/>,        color: GRN },
    { key:'entregado',  label:'Entregados',  icon:<PackageCheck className="h-4 w-4"/>, color: GRN },
  ]

  return (
    <div className="p-5 flex flex-col gap-6">
      <div>
        <h1 style={{ fontFamily:'var(--font-bebas)', fontSize:'2rem', letterSpacing:'0.05em', color:'oklch(0.2 0.03 30)' }}>Dashboard</h1>
        <p className="text-sm" style={DIM}>{new Date().toLocaleDateString('es-MX',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI icon={<ShoppingBag className="h-4 w-4"/>}  label="Pedidos hoy"     value={String(stats?.pedidosHoy??0)}                color={RED} />
        <KPI icon={<DollarSign className="h-4 w-4"/>}   label="Ingresos hoy"    value={`$${(stats?.ingresosHoy??0).toFixed(0)}`}   sub="MXN" color={GRN} />
        <KPI icon={<TrendingUp className="h-4 w-4"/>}   label="Ticket promedio" value={`$${(stats?.ticketPromedio??0).toFixed(0)}`} sub="MXN" color={YEL} />
        <KPI icon={<Users className="h-4 w-4"/>}        label="Activos ahora"   value={String(stats?.pedidosActivos??0)}            color="oklch(0.55 0.15 280)" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl p-5 flex flex-col gap-4" style={CARD}>
          <h2 style={{ fontFamily:'var(--font-bebas)', fontSize:'1.2rem', letterSpacing:'0.04em', color:'oklch(0.2 0.03 30)' }}>Estado de pedidos</h2>
          <div className="flex flex-col gap-3">
            {estados.map(({key,label,icon,color})=>(
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5" style={{color}}>
                  {icon}
                  <span className="text-sm" style={{fontFamily:'var(--font-dm-sans)',color:'oklch(0.35 0.03 30)'}}>{label}</span>
                </div>
                <span style={{fontFamily:'var(--font-bebas)',fontSize:'1.3rem',letterSpacing:'0.03em',color}}>{stats?.pedidosPorEstado[key]??0}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl p-5 flex flex-col gap-4" style={CARD}>
          <h2 style={{ fontFamily:'var(--font-bebas)', fontSize:'1.2rem', letterSpacing:'0.04em', color:'oklch(0.2 0.03 30)' }}>Top productos</h2>
          <div className="flex flex-col gap-2.5">
            {(stats?.topProductos??[]).length===0 && <p className="text-sm" style={DIM}>Sin datos aún</p>}
            {(stats?.topProductos??[]).map((p,i)=>(
              <div key={p.nombre} className="flex items-center gap-3">
                <span style={{fontFamily:'var(--font-bebas)',fontSize:'1rem',color:YEL,minWidth:'1.2rem'}}>{i+1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate" style={TXT}>{p.nombre}</p>
                  <div className="h-1.5 rounded-full mt-1 overflow-hidden" style={{backgroundColor:'oklch(0.90 0.02 75)'}}>
                    <div className="h-full rounded-full" style={{backgroundColor:RED,width:`${Math.min(100,(p.total/((stats?.topProductos[0]?.total??1)))*100)}%`}} />
                  </div>
                </div>
                <span className="text-sm font-semibold" style={DIM}>{p.total}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
