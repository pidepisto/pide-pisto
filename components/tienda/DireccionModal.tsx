'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, X, CheckCircle, XCircle, Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

export type DireccionGuardada = {
  calle: string
  numero: string
  colonia: string
  cp: string
  zona: string
  zona_id: string
  referencia?: string
}

type ColoniaResult = {
  id: string
  nombre: string
  codigo_postal: string
  municipio: string | null
  zona_id: string
  zona: { id: string; nombre: string }
}

type Props = {
  onGuardar: (dir: DireccionGuardada) => void
  onCerrar: () => void
  direccionActual?: DireccionGuardada | null
  aliasExtra?: React.ReactNode
}

export default function DireccionModal({ onGuardar, onCerrar, direccionActual, aliasExtra }: Props) {
  const supabase = createClient()
  const [calle,       setCalle]       = useState(direccionActual?.calle       ?? '')
  const [numero,      setNumero]      = useState(direccionActual?.numero      ?? '')
  const [colonia,     setColonia]     = useState(direccionActual?.colonia     ?? '')
  const [cp,          setCp]          = useState(direccionActual?.cp          ?? '')
  const [referencia,  setReferencia]  = useState(direccionActual?.referencia  ?? '')
  const [sugerencias, setSugerencias] = useState<ColoniaResult[]>([])
  const [cobertura,   setCobertura]   = useState<ColoniaResult | null>(null)
  const [sinCobertura,setSinCobertura]= useState(false)
  const [validado,    setValidado]    = useState(!!direccionActual)
  const [buscandoCp,  setBuscandoCp]  = useState(false)
  const coloniaRef = useRef<HTMLDivElement>(null)

  // Buscar colonias por nombre (autocompletado)
  useEffect(() => {
    if (colonia.length < 2 || validado) { setSugerencias([]); return }
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from('colonias')
        .select('id, nombre, codigo_postal, municipio, zona_id, zona:zonas(id, nombre)')
        .ilike('nombre', `%${colonia}%`)
        .eq('activa', true)
        .limit(8)
      setSugerencias((data ?? []) as any)
    }, 250)
    return () => clearTimeout(timeout)
  }, [colonia, validado])

  // Buscar colonias por CP
  const buscarPorCp = async (valor: string) => {
    if (valor.length !== 5) return
    setBuscandoCp(true)
    const { data } = await supabase
      .from('colonias')
      .select('id, nombre, codigo_postal, municipio, zona_id, zona:zonas(id, nombre)')
      .eq('codigo_postal', valor)
      .eq('activa', true)
      .order('nombre')
    setBuscandoCp(false)
    const resultados = (data ?? []) as any as ColoniaResult[]
    if (resultados.length === 1) {
      seleccionarColonia(resultados[0])
    } else if (resultados.length > 1) {
      setSugerencias(resultados)
    } else {
      setSinCobertura(true)
    }
  }

  const seleccionarColonia = (item: ColoniaResult) => {
    setColonia(item.nombre)
    setCp(item.codigo_postal)
    setCobertura(item)
    setSinCobertura(false)
    setValidado(true)
    setSugerencias([])
  }

  const handleColoniaChange = (val: string) => {
    setColonia(val)
    setValidado(false)
    setCobertura(null)
    setSinCobertura(false)
  }

  const handleCpChange = (val: string) => {
    const limpio = val.replace(/\D/g, '').slice(0, 5)
    setCp(limpio)
    setValidado(false)
    setCobertura(null)
    setSinCobertura(false)
    if (limpio.length === 5) buscarPorCp(limpio)
  }

  const handleGuardar = () => {
    if (!cobertura || !calle.trim() || !numero.trim()) return
    onGuardar({
      calle:     calle.trim(),
      numero:    numero.trim(),
      colonia:   cobertura.nombre,
      cp:        cobertura.codigo_postal,
      zona:      cobertura.zona.nombre,
      zona_id:   cobertura.zona.id,
      referencia: referencia.trim() || undefined,
    })
  }

  const listo = !!cobertura && calle.trim() && numero.trim()

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0" style={{ backgroundColor: 'oklch(0 0 0 / 0.5)' }} onClick={onCerrar} />

      <div className="relative w-full sm:max-w-md sm:mx-4 rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{ backgroundColor: 'oklch(0.97 0.012 82)', maxHeight: '92dvh', overflowY: 'auto' }}>

        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b"
          style={{ backgroundColor: 'oklch(0.97 0.012 82)', borderColor: 'oklch(0.88 0.03 70)' }}>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" style={{ color: 'oklch(0.50 0.22 24)' }} />
            <h2 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.5rem', letterSpacing: '0.04em', color: 'oklch(0.50 0.22 24)' }}>
              ¿A dónde te llevamos?
            </h2>
          </div>
          <button onClick={onCerrar} className="p-1.5 rounded-xl hover:bg-black/6 transition-colors">
            <X className="h-5 w-5" style={{ color: 'oklch(0.55 0.02 40)' }} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {aliasExtra}

          {/* CP — va primero para auto-rellenar colonia */}
          <div className="flex flex-col gap-1.5">
            <Label style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.875rem', color: 'oklch(0.35 0.03 30)', fontWeight: 600 }}>
              Código postal *
            </Label>
            <div className="relative">
              <Input
                placeholder="56600"
                value={cp}
                onChange={(e) => handleCpChange(e.target.value)}
                inputMode="numeric"
                maxLength={5}
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              />
              {buscandoCp && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" style={{ color: 'oklch(0.65 0.02 40)' }} />
              )}
            </div>
          </div>

          {/* Colonia con autocompletado */}
          <div className="flex flex-col gap-1.5" ref={coloniaRef}>
            <Label style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.875rem', color: 'oklch(0.35 0.03 30)', fontWeight: 600 }}>
              Colonia *
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'oklch(0.65 0.02 40)' }} />
              <Input
                placeholder="Escribe tu colonia…"
                value={colonia}
                onChange={(e) => handleColoniaChange(e.target.value)}
                className="pl-9"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              />
            </div>

            {/* Sugerencias */}
            {sugerencias.length > 0 && (
              <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'oklch(0.88 0.03 70)', backgroundColor: 'oklch(1 0 0)' }}>
                {sugerencias.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => seleccionarColonia(s)}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-black/4 transition-colors text-left border-b last:border-0"
                    style={{ borderColor: 'oklch(0.92 0.02 82)' }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'oklch(0.2 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>
                        {s.nombre}
                      </p>
                      <p className="text-xs" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
                        CP {s.codigo_postal}{s.municipio ? ` · ${s.municipio}` : ''}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                      style={{ backgroundColor: 'oklch(0.50 0.22 24 / 0.1)', color: 'oklch(0.50 0.22 24)', fontFamily: 'var(--font-dm-sans)' }}>
                      {s.zona.nombre}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Estado de cobertura */}
            {cobertura && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium"
                style={{ backgroundColor: 'oklch(0.55 0.18 145 / 0.1)', fontFamily: 'var(--font-dm-sans)' }}>
                <CheckCircle className="h-4 w-4 flex-shrink-0" style={{ color: 'oklch(0.45 0.15 145)' }} />
                <span style={{ color: 'oklch(0.35 0.12 145)' }}>
                  ¡Tenemos cobertura en <strong>{cobertura.zona.nombre}</strong>!
                </span>
              </div>
            )}

            {sinCobertura && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium"
                style={{ backgroundColor: 'oklch(0.50 0.22 24 / 0.08)', fontFamily: 'var(--font-dm-sans)' }}>
                <XCircle className="h-4 w-4 flex-shrink-0" style={{ color: 'oklch(0.50 0.22 24)' }} />
                <span style={{ color: 'oklch(0.40 0.18 24)' }}>
                  Por ahora no llegamos a esa zona. Pronto expandimos cobertura.
                </span>
              </div>
            )}
          </div>

          {/* Calle y número */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.875rem', color: 'oklch(0.35 0.03 30)', fontWeight: 600 }}>
                Calle *
              </Label>
              <Input placeholder="Av. Hidalgo" value={calle} onChange={(e) => setCalle(e.target.value)} style={{ fontFamily: 'var(--font-dm-sans)' }} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.875rem', color: 'oklch(0.35 0.03 30)', fontWeight: 600 }}>
                Número *
              </Label>
              <Input placeholder="123" value={numero} onChange={(e) => setNumero(e.target.value)} style={{ fontFamily: 'var(--font-dm-sans)' }} />
            </div>
          </div>

          {/* Referencia */}
          <div className="flex flex-col gap-1.5">
            <Label style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.875rem', color: 'oklch(0.35 0.03 30)', fontWeight: 600 }}>
              Referencia <span style={{ color: 'oklch(0.65 0.02 40)', fontWeight: 400 }}>(opcional)</span>
            </Label>
            <Input placeholder="Casa azul, entre calles…" value={referencia} onChange={(e) => setReferencia(e.target.value)} style={{ fontFamily: 'var(--font-dm-sans)' }} />
          </div>

          <Button size="lg" disabled={!listo} onClick={handleGuardar} className="mt-1 font-semibold border-0"
            style={{
              backgroundColor: listo ? 'oklch(0.50 0.22 24)' : 'oklch(0.88 0.03 70)',
              color: listo ? 'oklch(0.97 0.012 82)' : 'oklch(0.65 0.02 40)',
              fontFamily: 'var(--font-dm-sans)',
            }}>
            Confirmar dirección
          </Button>

          <p className="text-xs text-center" style={{ color: 'oklch(0.65 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
            Solo entregamos en las colonias registradas en nuestra cobertura
          </p>
        </div>
      </div>
    </div>
  )
}
