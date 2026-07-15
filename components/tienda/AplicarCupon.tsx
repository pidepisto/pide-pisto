'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Tag, X, CheckCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { Cupon } from '@/lib/types'
import { fp } from '@/lib/utils'

interface Props {
  subtotal: number
  onAplicar: (cupon: Cupon, descuento: number) => void
  onRemover: () => void
  cuponAplicado: Cupon | null
}

export function AplicarCupon({ subtotal, onAplicar, onRemover, cuponAplicado }: Props) {
  const supabase = createClient()
  const [codigo, setCodigo] = useState('')
  const [loading, setLoading] = useState(false)

  const calcularDescuento = (c: Cupon, sub: number): number => {
    if (c.tipo === 'porcentaje') return Math.round((sub * c.valor) / 100 * 100) / 100
    return Math.min(c.valor, sub)
  }

  const aplicar = async () => {
    if (!codigo.trim()) return
    setLoading(true)
    const { data, error } = await supabase.from('cupones').select('*').eq('codigo', codigo.toUpperCase().trim()).eq('activo', true).single()
    if (error || !data) { toast.error('Cupón no válido o inactivo'); setLoading(false); return }

    const cupon = data as Cupon
    const ahora = new Date()
    if (cupon.fecha_fin && new Date(cupon.fecha_fin) < ahora) { toast.error('Este cupón ha expirado'); setLoading(false); return }
    if (new Date(cupon.fecha_inicio) > ahora) { toast.error('Este cupón aún no está disponible'); setLoading(false); return }
    if (cupon.limite_usos !== null && cupon.usos_actuales >= cupon.limite_usos) { toast.error('Este cupón ya alcanzó su límite de usos'); setLoading(false); return }
    if (subtotal < cupon.minimo_compra) { toast.error(`Compra mínima de ${fp(cupon.minimo_compra)} para usar este cupón`); setLoading(false); return }

    const descuento = calcularDescuento(cupon, subtotal)
    onAplicar(cupon, descuento)
    toast.success(`Cupón aplicado: -${fp(descuento)}`)
    setCodigo('')
    setLoading(false)
  }

  if (cuponAplicado) {
    const descuento = calcularDescuento(cuponAplicado, subtotal)
    return (
      <div className="flex items-center justify-between rounded-2xl px-4 py-3" style={{ backgroundColor: 'oklch(0.55 0.18 145 / 0.1)', border: '1px solid oklch(0.55 0.18 145 / 0.3)' }}>
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4" style={{ color: 'oklch(0.45 0.15 145)' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: 'oklch(0.45 0.15 145)', fontFamily: 'var(--font-dm-sans)' }}>{cuponAplicado.codigo}</p>
            {cuponAplicado.descripcion && <p className="text-xs" style={{ color: 'oklch(0.55 0.18 145)', fontFamily: 'var(--font-dm-sans)' }}>{cuponAplicado.descripcion}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold" style={{ color: 'oklch(0.45 0.15 145)', fontFamily: 'var(--font-dm-sans)' }}>-{fp(descuento)}</span>
          <button onClick={onRemover} className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors" style={{ color: 'oklch(0.55 0.18 145)' }}>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'oklch(0.55 0.02 40)' }} />
        <Input
          value={codigo}
          onChange={e => setCodigo(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && aplicar()}
          placeholder="Código de cupón"
          className="pl-9 h-11"
          style={{ backgroundColor: 'oklch(0.95 0.01 82)', color: 'oklch(0.2 0.03 30)', border: '1px solid oklch(0.88 0.03 70)', fontFamily: 'var(--font-dm-sans)', fontSize: '0.875rem' }}
        />
      </div>
      <button
        onClick={aplicar}
        disabled={loading || !codigo.trim()}
        className="flex-shrink-0 px-4 h-11 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-40"
        style={{ backgroundColor: 'oklch(0.50 0.22 24)', color: 'oklch(0.97 0.012 82)', fontFamily: 'var(--font-dm-sans)' }}
      >
        {loading ? '…' : 'Aplicar'}
      </button>
    </div>
  )
}
