'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Clock, Truck, CheckCircle, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { fp, tiempoTranscurrido } from '@/lib/utils'

type PedidoResumen = {
  id: string
  estado: string
  total: number
  created_at: string
  en_camino_desde: string | null
}

const ESTADOS: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string; borde: string }> = {
  pendiente:  {
    label: 'Preparando tu pedido…',
    icon: <Clock className="h-4 w-4" />,
    color: 'oklch(0.35 0.08 70)',
    bg: 'oklch(0.76 0.14 80)',
    borde: 'oklch(0.65 0.14 80)',
  },
  confirmado: {
    label: 'Pedido confirmado',
    icon: <CheckCircle className="h-4 w-4" />,
    color: 'oklch(0.97 0.012 82)',
    bg: 'oklch(0.50 0.22 24)',
    borde: 'oklch(0.45 0.20 24)',
  },
  en_camino:  {
    label: '¡Tu pedido va en camino!',
    icon: <Truck className="h-4 w-4" />,
    color: 'oklch(0.97 0.012 82)',
    bg: 'oklch(0.45 0.15 145)',
    borde: 'oklch(0.40 0.14 145)',
  },
}

export default function PedidoActivo() {
  const supabase = createClient()
  const [pedido, setPedido] = useState<PedidoResumen | null>(null)

  useEffect(() => {
    let canal: ReturnType<typeof supabase.channel> | null = null

    const cargar = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('pedidos')
        .select('id, estado, total, created_at, en_camino_desde')
        .eq('usuario_id', user.id)
        .in('estado', ['pendiente', 'confirmado', 'en_camino'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (data) setPedido(data)

      // Escuchar cambios en tiempo real
      canal = supabase
        .channel('pedido-activo')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'pedidos', filter: `usuario_id=eq.${user.id}` },
          async () => {
            const { data: actualizado } = await supabase
              .from('pedidos')
              .select('id, estado, total, created_at, en_camino_desde')
              .eq('usuario_id', user.id)
              .in('estado', ['pendiente', 'confirmado', 'en_camino'])
              .order('created_at', { ascending: false })
              .limit(1)
              .single()

            setPedido(actualizado ?? null)
          }
        )
        .subscribe()
    }

    cargar()
    return () => { canal && supabase.removeChannel(canal) }
  }, [])

  if (!pedido) return null

  const cfg = ESTADOS[pedido.estado]
  if (!cfg) return null

  return (
    <Link href={`/pedidos/${pedido.id}`}>
      <div
        className="mx-4 mb-4 rounded-2xl overflow-hidden transition-all active:scale-[0.98]"
        style={{
          backgroundColor: cfg.bg,
          border: `1px solid ${cfg.borde}`,
          boxShadow: `0 4px 20px ${cfg.bg}60`,
        }}
      >
        <div className="flex items-center justify-between px-4 py-3.5">
          {/* Ícono + texto */}
          <div className="flex items-center gap-3">
            {/* Pulso animado */}
            <div className="relative flex-shrink-0">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: 'oklch(1 0 0 / 0.15)', color: cfg.color }}
              >
                {cfg.icon}
              </div>
              {pedido.estado === 'en_camino' && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-white animate-ping" />
              )}
            </div>

            <div className="flex flex-col leading-tight">
              <span className="text-xs font-medium opacity-70" style={{ color: cfg.color, fontFamily: 'var(--font-dm-sans)' }}>
                Pedido #{pedido.id.slice(-6).toUpperCase()}
              </span>
              <span className="text-sm font-bold" style={{ color: cfg.color, fontFamily: 'var(--font-dm-sans)' }}>
                {cfg.label}
              </span>
            </div>
          </div>

          {/* Total + flecha */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span
              style={{
                fontFamily: 'var(--font-bebas)',
                fontSize: '1.2rem',
                letterSpacing: '0.03em',
                color: cfg.color,
                opacity: 0.9,
              }}
            >
              {fp(pedido.total)}
            </span>
            <ChevronRight className="h-4 w-4" style={{ color: cfg.color, opacity: 0.7 }} />
          </div>
        </div>

        {/* Barra de progreso */}
        <div style={{ backgroundColor: 'oklch(0 0 0 / 0.1)', height: '3px' }}>
          <div
            className="h-full transition-all duration-700"
            style={{
              backgroundColor: 'oklch(1 0 0 / 0.5)',
              width: pedido.estado === 'pendiente' ? '33%' : pedido.estado === 'confirmado' ? '66%' : '90%',
            }}
          />
        </div>
      </div>
    </Link>
  )
}
