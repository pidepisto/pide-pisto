'use client'

import { MapPin, ChevronDown } from 'lucide-react'
import DireccionesPanel from './DireccionesPanel'
import { useDirecciones } from '@/lib/hooks/useDirecciones'
import { useState } from 'react'

export default function SelectorZona() {
  const { activa } = useDirecciones()
  const [panelAbierto, setPanelAbierto] = useState(false)

  return (
    <>
      <button
        onClick={() => setPanelAbierto(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors hover:bg-black/5 flex-shrink-0"
        style={{ fontFamily: 'var(--font-dm-sans)' }}
      >
        <MapPin className="h-4 w-4 flex-shrink-0" style={{ color: 'oklch(0.50 0.22 24)' }} />
        <div className="flex flex-col items-start leading-tight text-left">
          <span className="text-[10px] font-medium" style={{ color: 'oklch(0.55 0.02 40)' }}>
            Entregar en
          </span>
          <span className="text-sm font-semibold max-w-[160px] truncate" style={{ color: 'oklch(0.2 0.03 30)' }}>
            {activa ? `${activa.alias} · ${activa.colonia}` : 'Agregar dirección'}
          </span>
        </div>
        <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'oklch(0.55 0.02 40)' }} />
      </button>

      {panelAbierto && (
        <DireccionesPanel onCerrar={() => setPanelAbierto(false)} />
      )}
    </>
  )
}
