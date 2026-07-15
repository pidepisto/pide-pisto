'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Clock, Truck, PackageCheck, XCircle, CheckCircle, ChevronRight, Package } from 'lucide-react'
import Link from 'next/link'
import { SkeletonPedidoCard } from '@/components/ui/Skeleton'
import { fp } from '@/lib/utils'

const RED = 'oklch(0.50 0.22 24)'
const YEL = 'oklch(0.76 0.14 80)'
const GRN = 'oklch(0.55 0.18 145)'
const BG  = 'oklch(0.97 0.012 82)'

const ESTADOS: Record<string, { label: string; Icon: any; color: string; bg: string }> = {
  pendiente:  { label: 'Pendiente',  Icon: Clock,        color: 'oklch(0.45 0.10 70)', bg: `${YEL}25` },
  confirmado: { label: 'Confirmado', Icon: CheckCircle,  color: RED,                    bg: `${RED}12` },
  en_camino:  { label: 'En camino',  Icon: Truck,        color: GRN,                    bg: `${GRN}15` },
  entregado:  { label: 'Entregado',  Icon: PackageCheck, color: GRN,                    bg: `${GRN}15` },
  cancelado:  { label: 'Cancelado',  Icon: XCircle,      color: 'oklch(0.55 0.02 40)', bg: 'oklch(0.90 0.02 75)' },
}

type PedidoRow = { id: string; estado: string; total: number; created_at: string; items_count: number }

function Tarjeta({ p }: { p: PedidoRow }) {
  const cfg = ESTADOS[p.estado] ?? ESTADOS.pendiente
  return (
    <Link href={`/pedidos/${p.id}`}>
      <div className="rounded-2xl p-4 flex items-center gap-4 transition-all active:scale-[0.99]"
        style={{ backgroundColor: 'oklch(1 0 0)', border: '1px solid oklch(0.88 0.03 70)', boxShadow: '0 2px 8px oklch(0 0 0 / 0.04)' }}>
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: cfg.bg }}>
          <cfg.Icon className="h-4.5 w-4.5" style={{ color: cfg.color, strokeWidth: 1.8 }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-bold" style={{ color: 'oklch(0.2 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>
              #{p.id.slice(-6).toUpperCase()}
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: cfg.bg, color: cfg.color, fontFamily: 'var(--font-dm-sans)' }}>
              {cfg.label}
            </span>
          </div>
          <p className="text-xs" style={{ color: 'oklch(0.60 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
            {p.items_count} producto{p.items_count !== 1 ? 's' : ''} ·{' '}
            {new Date(p.created_at).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.3rem', letterSpacing: '0.03em', color: RED }}>
            {fp(p.total)}
          </span>
          <ChevronRight className="h-4 w-4" style={{ color: 'oklch(0.70 0.02 40)' }} />
        </div>
      </div>
    </Link>
  )
}

export default function PedidosPage() {
  const router   = useRouter()
  const supabase = createClient()
  const [pedidos,  setPedidos]  = useState<PedidoRow[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('pedidos')
        .select('id, estado, total, created_at, pedido_items(id)')
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false })

      setPedidos((data ?? []).map((p: any) => ({
        id:          p.id,
        estado:      p.estado,
        total:       p.total,
        created_at:  p.created_at,
        items_count: p.pedido_items?.length ?? 0,
      })))
      setCargando(false)
    }
    cargar()
  }, [])

  const activos    = pedidos.filter(p => !['entregado','cancelado'].includes(p.estado))
  const anteriores = pedidos.filter(p =>  ['entregado','cancelado'].includes(p.estado))

  return (
    <div style={{ backgroundColor: BG, minHeight: '100vh' }}>
      <div className="px-4 pt-5 pb-4 flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${RED}12` }}>
          <Package className="h-4 w-4" style={{ color: RED }} />
        </div>
        <h1 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.8rem', letterSpacing: '0.05em', color: 'oklch(0.2 0.03 30)' }}>
          Mis pedidos
        </h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-32 md:pb-10 flex flex-col gap-6">
        {cargando && (
          <div className="flex flex-col gap-3 pt-2">
            {[1,2,3].map(i => <SkeletonPedidoCard key={i} />)}
          </div>
        )}

        {!cargando && pedidos.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-20">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{ backgroundColor: `${RED}12`, border: `2px dashed ${RED}50` }}>
              <Package className="h-9 w-9" style={{ color: RED }} />
            </div>
            <div className="text-center">
              <p style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.5rem', letterSpacing: '0.04em', color: 'oklch(0.2 0.03 30)' }}>
                Sin pedidos aún
              </p>
              <p className="text-sm mt-1" style={{ color: 'oklch(0.60 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
                Tu historial aparecerá aquí
              </p>
            </div>
            <Link href="/catalogo">
              <button className="px-6 py-3 rounded-2xl text-sm font-semibold"
                style={{ backgroundColor: RED, color: 'oklch(0.97 0.012 82)', fontFamily: 'var(--font-dm-sans)' }}>
                Ver catálogo
              </button>
            </Link>
          </div>
        )}

        {activos.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
              En curso
            </p>
            <div className="flex flex-col gap-3">
              {activos.map(p => <Tarjeta key={p.id} p={p} />)}
            </div>
          </div>
        )}

        {anteriores.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
              Anteriores
            </p>
            <div className="flex flex-col gap-3">
              {anteriores.map(p => <Tarjeta key={p.id} p={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
