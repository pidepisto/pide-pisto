'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, MapPin, Plus, Trash2, Check, Home, Briefcase, Star } from 'lucide-react'
import { useDirecciones } from '@/lib/hooks/useDirecciones'
import DireccionModal from '@/components/tienda/DireccionModal'
import type { DireccionGuardada } from '@/components/tienda/DireccionModal'
import { toast } from 'sonner'

const RED  = 'oklch(0.50 0.22 24)'
const BG   = 'oklch(0.97 0.012 82)'
const YEL  = 'oklch(0.76 0.14 80)'
const GRN  = 'oklch(0.55 0.18 145)'
const CARD: React.CSSProperties = { backgroundColor: 'oklch(1 0 0)', border: '1px solid oklch(0.90 0.02 75)', borderRadius: '1rem' }

const ALIAS_ICONOS: Record<string, React.ReactNode> = {
  Casa:    <Home     className="h-4 w-4" />,
  Trabajo: <Briefcase className="h-4 w-4" />,
  Otro:    <Star     className="h-4 w-4" />,
}

export default function DireccionesPage() {
  const { direcciones, activa, cargando, agregar, eliminar, seleccionarActiva } = useDirecciones()
  const [agregando, setAgregando] = useState(false)
  const [alias, setAlias]         = useState('Casa')

  const handleGuardar = async (dir: DireccionGuardada) => {
    await agregar({ ...dir, alias })
    setAgregando(false)
    toast.success('Dirección guardada')
  }

  const handleEliminar = async (id: string) => {
    await eliminar(id)
    toast.success('Dirección eliminada')
  }

  if (agregando) {
    return (
      <DireccionModal
        onGuardar={handleGuardar}
        onCerrar={() => setAgregando(false)}
        aliasExtra={
          <div className="flex flex-col gap-1.5">
            <label style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.875rem', color: 'oklch(0.35 0.03 30)', fontWeight: 600 }}>
              Nombre de la dirección
            </label>
            <div className="flex gap-2">
              {['Casa', 'Trabajo', 'Otro'].map((a) => (
                <button key={a} type="button" onClick={() => setAlias(a)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    backgroundColor: alias === a ? RED : 'oklch(0.92 0.02 82)',
                    color: alias === a ? 'oklch(0.97 0.012 82)' : 'oklch(0.35 0.03 30)',
                    border: alias === a ? 'none' : '1px solid oklch(0.85 0.03 70)',
                    fontFamily: 'var(--font-dm-sans)',
                  }}>
                  {ALIAS_ICONOS[a]}
                  {a}
                </button>
              ))}
            </div>
          </div>
        }
      />
    )
  }

  return (
    <div style={{ backgroundColor: BG, minHeight: '100vh' }}>
      <div className="flex items-center gap-3 px-4 pt-5 pb-4">
        <Link href="/cuenta">
          <button className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ border: '1px solid oklch(0.88 0.03 70)', backgroundColor: 'oklch(1 0 0)' }}>
            <ChevronLeft className="h-4 w-4" style={{ color: 'oklch(0.35 0.03 30)' }} />
          </button>
        </Link>
        <h1 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.8rem', letterSpacing: '0.05em', color: 'oklch(0.2 0.03 30)' }}>
          Mis direcciones
        </h1>
      </div>

      <div className="px-4 flex flex-col gap-4 pb-32 max-w-lg mx-auto">
        {cargando && (
          <p className="text-sm text-center py-12" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>Cargando…</p>
        )}

        {!cargando && direcciones.length === 0 && (
          <div className="flex flex-col items-center py-20 gap-4 text-center">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{ backgroundColor: `${RED}12`, border: `2px dashed ${RED}40` }}>
              <MapPin className="h-9 w-9" style={{ color: RED }} />
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.6rem', letterSpacing: '0.04em', color: 'oklch(0.2 0.03 30)' }}>
                Sin direcciones
              </p>
              <p className="text-sm mt-1" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
                Agrega tu primera dirección de entrega
              </p>
            </div>
          </div>
        )}

        {direcciones.map((dir) => {
          const esActiva = activa?.id === dir.id
          return (
            <div key={dir.id}
              className="rounded-2xl p-4 flex items-start gap-3 cursor-pointer transition-all active:scale-[0.99]"
              style={{
                backgroundColor: esActiva ? `${RED}06` : 'oklch(1 0 0)',
                border: `1.5px solid ${esActiva ? RED : 'oklch(0.88 0.03 70)'}`,
                borderRadius: '1rem',
              }}
              onClick={() => seleccionarActiva(dir.id)}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: esActiva ? RED : 'oklch(0.92 0.02 82)', color: esActiva ? 'oklch(0.97 0.012 82)' : RED }}>
                {ALIAS_ICONOS[dir.alias] ?? <MapPin className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-bold" style={{ color: 'oklch(0.2 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>
                    {dir.alias}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: dir.zona === 'Chalco' ? `${RED}15` : `${GRN}15`,
                      color: dir.zona === 'Chalco' ? RED : GRN,
                      fontFamily: 'var(--font-dm-sans)',
                    }}>
                    {dir.zona}
                  </span>
                  {esActiva && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${GRN}20`, color: GRN, fontFamily: 'var(--font-dm-sans)' }}>
                      Principal
                    </span>
                  )}
                </div>
                <p className="text-sm truncate" style={{ color: 'oklch(0.35 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>
                  {dir.calle} {dir.numero}, {dir.colonia}
                </p>
                <p className="text-xs" style={{ color: 'oklch(0.60 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
                  CP {dir.cp}{dir.referencia ? ` · ${dir.referencia}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {esActiva && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: GRN }}>
                    <Check className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
                <button onClick={(e) => { e.stopPropagation(); handleEliminar(dir.id) }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-red-50"
                  style={{ color: 'oklch(0.65 0.02 40)' }}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          )
        })}

        {/* Botón agregar */}
        {!cargando && (
          <button onClick={() => setAgregando(true)}
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm transition-all active:scale-[0.98]"
            style={{ backgroundColor: YEL, color: 'oklch(0.2 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>
            <Plus className="h-4 w-4" />
            Agregar nueva dirección
          </button>
        )}
      </div>
    </div>
  )
}
