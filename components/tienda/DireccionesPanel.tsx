'use client'

import { useState } from 'react'
import { MapPin, Plus, Trash2, Check, X, Home, Briefcase, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import DireccionModal from './DireccionModal'
import { useDirecciones, type Direccion } from '@/lib/hooks/useDirecciones'
import type { DireccionGuardada } from './DireccionModal'
import { toast } from 'sonner'

type Props = {
  onCerrar: () => void
}

const ALIAS_ICONOS: Record<string, React.ReactNode> = {
  Casa: <Home className="h-4 w-4" />,
  Trabajo: <Briefcase className="h-4 w-4" />,
  Otro: <Star className="h-4 w-4" />,
}

export default function DireccionesPanel({ onCerrar }: Props) {
  const { direcciones, activa, cargando, agregar, eliminar, seleccionarActiva } = useDirecciones()
  const [agregando, setAgregando] = useState(false)
  const [alias, setAlias] = useState('Casa')

  const handleGuardar = async (dir: DireccionGuardada) => {
    await agregar({ ...dir, alias })
    setAgregando(false)
    toast.success('Dirección guardada')
  }

  const handleEliminar = async (id: string) => {
    await eliminar(id)
    toast.success('Dirección eliminada')
  }

  const handleSeleccionar = async (id: string) => {
    await seleccionarActiva(id)
    onCerrar()
  }

  if (agregando) {
    return (
      <>
        {/* Selector de alias antes del modal */}
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
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAlias(a)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
                    style={{
                      backgroundColor: alias === a ? 'oklch(0.50 0.22 24)' : 'oklch(0.92 0.02 82)',
                      color: alias === a ? 'oklch(0.97 0.012 82)' : 'oklch(0.35 0.03 30)',
                      border: alias === a ? 'none' : '1px solid oklch(0.85 0.03 70)',
                      fontFamily: 'var(--font-dm-sans)',
                    }}
                  >
                    {ALIAS_ICONOS[a]}
                    {a}
                  </button>
                ))}
              </div>
            </div>
          }
        />
      </>
    )
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0" style={{ backgroundColor: 'oklch(0 0 0 / 0.5)' }} onClick={onCerrar} />

      {/* Panel */}
      <div
        className="relative w-full sm:max-w-md sm:mx-4 rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{ backgroundColor: 'oklch(0.97 0.012 82)', maxHeight: '85dvh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: 'oklch(0.88 0.03 70)' }}
        >
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" style={{ color: 'oklch(0.50 0.22 24)' }} />
            <h2 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.5rem', letterSpacing: '0.04em', color: 'oklch(0.50 0.22 24)' }}>
              Mis direcciones
            </h2>
          </div>
          <button onClick={onCerrar} className="p-1.5 rounded-xl hover:bg-black/6 transition-colors">
            <X className="h-5 w-5" style={{ color: 'oklch(0.55 0.02 40)' }} />
          </button>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
          {cargando && (
            <p className="text-sm text-center py-8" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
              Cargando…
            </p>
          )}

          {!cargando && direcciones.length === 0 && (
            <div className="text-center py-10">
              <MapPin className="h-10 w-10 mx-auto mb-3" style={{ color: 'oklch(0.85 0.03 70)' }} />
              <p style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.3rem', letterSpacing: '0.04em', color: 'oklch(0.50 0.22 24)' }}>
                Sin direcciones guardadas
              </p>
              <p className="text-sm mt-1" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
                Agrega tu primera dirección de entrega
              </p>
            </div>
          )}

          {direcciones.map((dir) => {
            const esActiva = activa?.id === dir.id
            return (
              <div
                key={dir.id}
                className="rounded-2xl p-4 flex items-start gap-3 transition-all cursor-pointer"
                style={{
                  backgroundColor: esActiva ? 'oklch(0.50 0.22 24 / 0.06)' : 'oklch(1 0 0)',
                  border: `1.5px solid ${esActiva ? 'oklch(0.50 0.22 24)' : 'oklch(0.88 0.03 70)'}`,
                }}
                onClick={() => handleSeleccionar(dir.id)}
              >
                {/* Icono alias */}
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{
                    backgroundColor: esActiva ? 'oklch(0.50 0.22 24)' : 'oklch(0.92 0.02 82)',
                    color: esActiva ? 'oklch(0.97 0.012 82)' : 'oklch(0.50 0.22 24)',
                  }}
                >
                  {ALIAS_ICONOS[dir.alias] ?? <MapPin className="h-4 w-4" />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-bold" style={{ color: 'oklch(0.2 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>
                      {dir.alias}
                    </span>
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: dir.zona === 'Chalco' ? 'oklch(0.50 0.22 24 / 0.1)' : 'oklch(0.55 0.18 145 / 0.1)',
                        color: dir.zona === 'Chalco' ? 'oklch(0.50 0.22 24)' : 'oklch(0.45 0.15 145)',
                        fontFamily: 'var(--font-dm-sans)',
                      }}
                    >
                      {dir.zona}
                    </span>
                  </div>
                  <p className="text-sm truncate" style={{ color: 'oklch(0.35 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>
                    {dir.calle} {dir.numero}, {dir.colonia}
                  </p>
                  <p className="text-xs" style={{ color: 'oklch(0.60 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
                    CP {dir.cp}{dir.referencia ? ` · ${dir.referencia}` : ''}
                  </p>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {esActiva && (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: 'oklch(0.55 0.18 145)' }}
                    >
                      <Check className="h-3.5 w-3.5" style={{ color: 'oklch(0.97 0.012 82)' }} />
                    </div>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEliminar(dir.id) }}
                    className="w-7 h-7 rounded-xl flex items-center justify-center hover:bg-red-50 transition-colors"
                    style={{ color: 'oklch(0.65 0.02 40)' }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer — agregar nueva */}
        <div className="px-5 py-4 border-t flex-shrink-0" style={{ borderColor: 'oklch(0.88 0.03 70)' }}>
          <Button
            onClick={() => setAgregando(true)}
            className="w-full gap-2 font-semibold border-0"
            style={{
              backgroundColor: 'oklch(0.76 0.14 80)',
              color: 'oklch(0.2 0.03 30)',
              fontFamily: 'var(--font-dm-sans)',
            }}
          >
            <Plus className="h-4 w-4" />
            Agregar nueva dirección
          </Button>
        </div>
      </div>
    </div>
  )
}
