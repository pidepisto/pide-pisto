'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Search, Plus, Trash2, MapPin, CheckSquare, Square, Loader2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { COLONIAS_COBERTURA } from '@/lib/cobertura'

type Zona     = { id: string; nombre: string; activa: boolean }
type Colonia  = { id: string; nombre: string; codigo_postal: string; municipio: string | null }
type Sugerida = { nombre: string; tipo: string; municipio: string; estado: string }

const RED = 'oklch(0.50 0.22 24)'
const BDR = '1px solid oklch(0.88 0.03 70)'
const inp = { backgroundColor: 'oklch(0.97 0.012 82)', color: 'oklch(0.20 0.03 30)', border: BDR, fontFamily: 'var(--font-dm-sans)' }

export default function ZonaColoniasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }   = use(params)
  const router   = useRouter()
  const supabase = createClient()

  const [zona,         setZona]         = useState<Zona | null>(null)
  const [colonias,     setColonias]     = useState<Colonia[]>([])
  const [cp,           setCp]           = useState('')
  const [buscando,     setBuscando]     = useState(false)
  const [sugeridas,    setSugeridas]    = useState<Sugerida[]>([])
  const [municipioCP,  setMunicipioCP]  = useState('')
  const [selec,        setSelec]        = useState<Set<string>>(new Set())
  const [guardando,    setGuardando]    = useState(false)
  const [filtro,       setFiltro]       = useState('')
  const [importando,   setImportando]   = useState(false)

  const cargar = async () => {
    const [{ data: z }, { data: c }] = await Promise.all([
      supabase.from('zonas').select('id, nombre, activa').eq('id', id).single(),
      supabase.from('colonias').select('*').eq('zona_id', id).order('codigo_postal').order('nombre'),
    ])
    if (!z) { router.push('/admin/zonas'); return }
    setZona(z as Zona)
    setColonias((c ?? []) as Colonia[])
  }
  useEffect(() => { cargar() }, [id])

  /* ── Buscar por CP ── */
  const buscarCP = async () => {
    if (cp.length !== 5) { toast.error('Ingresa un CP de 5 dígitos'); return }
    setBuscando(true); setSugeridas([]); setSelec(new Set())
    try {
      const res  = await fetch(`/api/cp?cp=${cp}`)
      const data = await res.json()
      setSugeridas(data.colonias ?? [])
      setMunicipioCP(data.municipio ?? '')
      if (!(data.colonias ?? []).length) toast('No se encontraron colonias para ese CP — puedes agregarla manualmente')
    } catch { toast.error('Error al consultar el código postal') }
    setBuscando(false)
  }

  const toggleSelec = (nombre: string) => setSelec(prev => { const n = new Set(prev); n.has(nombre) ? n.delete(nombre) : n.add(nombre); return n })
  const seleccionarNuevas = () => {
    const exist = new Set(colonias.map(c => c.nombre))
    setSelec(new Set(sugeridas.filter(s => !exist.has(s.nombre)).map(s => s.nombre)))
  }

  const agregarSeleccionadas = async () => {
    if (!selec.size) { toast('Selecciona al menos una'); return }
    setGuardando(true)
    const exist  = new Set(colonias.map(c => c.nombre))
    const nuevas = sugeridas
      .filter(s => selec.has(s.nombre) && !exist.has(s.nombre))
      .map(s => ({ zona_id: id, codigo_postal: cp, nombre: s.nombre, municipio: s.municipio || municipioCP || null }))
    if (!nuevas.length) { toast('Todas las seleccionadas ya existen'); setGuardando(false); return }
    const { error } = await supabase.from('colonias').insert(nuevas)
    if (error) { toast.error('Error al guardar'); setGuardando(false); return }
    toast.success(`${nuevas.length} colonia${nuevas.length !== 1 ? 's' : ''} agregada${nuevas.length !== 1 ? 's' : ''}`)
    setSugeridas([]); setSelec(new Set()); setCp(''); cargar()
    setGuardando(false)
  }

  /* ── Importar predefinidas ── */
  const importarPredefinidas = async () => {
    if (!zona) return
    setImportando(true)

    // Buscar colonias del archivo cobertura.ts que coincidan con el nombre de la zona
    const nombreZona = zona.nombre.toLowerCase()
    const candidatas = COLONIAS_COBERTURA.filter(c =>
      c.zona.toLowerCase().includes(nombreZona) || nombreZona.includes(c.zona.toLowerCase())
    )

    if (!candidatas.length) {
      toast(`No hay colonias predefinidas que coincidan con "${zona.nombre}".\nPrueba renombrar la zona a "Chalco" o "Ixtapaluca"`)
      setImportando(false)
      return
    }

    const exist  = new Set(colonias.map(c => c.nombre))
    const nuevas = candidatas
      .filter(c => !exist.has(c.nombre))
      .map(c => ({ zona_id: id, codigo_postal: c.cp, nombre: c.nombre, municipio: null }))

    if (!nuevas.length) { toast('Todas las colonias predefinidas ya están importadas'); setImportando(false); return }

    const { error } = await supabase.from('colonias').insert(nuevas)
    if (error) { toast.error('Error al importar'); setImportando(false); return }
    toast.success(`${nuevas.length} colonia${nuevas.length !== 1 ? 's' : ''} importada${nuevas.length !== 1 ? 's' : ''}`)
    cargar()
    setImportando(false)
  }

  /* ── Agregar manual ── */
  const [manualNombre, setManualNombre] = useState('')
  const [manualCp,     setManualCp]     = useState('')
  const agregarManual = async () => {
    if (!manualNombre.trim() || manualCp.length !== 5) return
    const { error } = await supabase.from('colonias').insert({ zona_id: id, codigo_postal: manualCp, nombre: manualNombre.trim(), municipio: null })
    if (error) { toast.error('Error'); return }
    toast.success('Colonia agregada')
    setManualNombre(''); cargar()
  }

  const eliminar = async (cId: string, nombre: string) => {
    await supabase.from('colonias').delete().eq('id', cId)
    toast.success(`${nombre} eliminada`); cargar()
  }

  // Agrupadas por CP
  const porCP = colonias.reduce<Record<string, Colonia[]>>((acc, c) => { ;(acc[c.codigo_postal] ??= []).push(c); return acc }, {})
  const filtradas = filtro ? colonias.filter(c => c.nombre.toLowerCase().includes(filtro.toLowerCase()) || c.codigo_postal.includes(filtro)) : null
  const exist = new Set(colonias.map(c => c.nombre))

  // Cuántas predefinidas hay para esta zona
  const predefinidas = zona ? COLONIAS_COBERTURA.filter(c => {
    const n = zona.nombre.toLowerCase()
    return c.zona.toLowerCase().includes(n) || n.includes(c.zona.toLowerCase())
  }) : []
  const sinImportar = predefinidas.filter(c => !exist.has(c.nombre)).length

  if (!zona) return (
    <div className="p-6 flex items-center gap-2" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
      <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
    </div>
  )

  return (
    <div className="p-6 flex flex-col gap-6 max-w-3xl">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/admin/zonas')}
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-black/5"
          style={{ backgroundColor: 'oklch(0.92 0.02 70)', color: 'oklch(0.35 0.02 40)' }}>
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 style={{ fontFamily: 'var(--font-bebas)', fontSize: '2rem', letterSpacing: '0.04em', color: 'oklch(0.20 0.03 30)', lineHeight: 1 }}>
            {zona.nombre}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
            {colonias.length} colonia{colonias.length !== 1 ? 's' : ''} registrada{colonias.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* ── BANNER IMPORTAR PREDEFINIDAS ── */}
      {sinImportar > 0 && (
        <div className="rounded-2xl p-4 flex items-center gap-4" style={{ backgroundColor: `${RED}08`, border: `1px solid ${RED}30` }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${RED}15` }}>
            <Download className="h-5 w-5" style={{ color: RED }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: 'oklch(0.20 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>
              {sinImportar} colonia{sinImportar !== 1 ? 's' : ''} predefinida{sinImportar !== 1 ? 's' : ''} disponible{sinImportar !== 1 ? 's' : ''}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'oklch(0.50 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
              Importa automáticamente las colonias del catálogo inicial de {zona.nombre}
            </p>
          </div>
          <Button onClick={importarPredefinidas} disabled={importando} className="border-0 gap-2 flex-shrink-0"
            style={{ backgroundColor: RED, color: 'oklch(0.97 0.012 82)', fontFamily: 'var(--font-dm-sans)' }}>
            {importando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Importar {sinImportar}
          </Button>
        </div>
      )}

      {/* ── BUSCAR POR CP ── */}
      <div className="rounded-2xl p-5 flex flex-col gap-4" style={{ backgroundColor: 'oklch(1 0 0)', border: BDR }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.2rem', letterSpacing: '0.04em', color: 'oklch(0.20 0.03 30)' }}>
            Agregar por código postal
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
            Ingresa un CP para obtener las colonias de SEPOMEX y selecciona las que pertenecen a esta zona
          </p>
        </div>

        <div className="flex gap-2">
          <Input value={cp} onChange={e => setCp(e.target.value.replace(/\D/g, '').slice(0, 5))}
            onKeyDown={e => e.key === 'Enter' && buscarCP()}
            placeholder="Ej: 56600" inputMode="numeric" maxLength={5} style={inp} />
          <Button onClick={buscarCP} disabled={buscando || cp.length !== 5} className="border-0 gap-2 flex-shrink-0"
            style={{ backgroundColor: RED, color: 'oklch(0.97 0.012 82)', fontFamily: 'var(--font-dm-sans)' }}>
            {buscando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Buscar
          </Button>
        </div>

        {sugeridas.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold" style={{ color: 'oklch(0.45 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
                {sugeridas.length} colonias · CP {cp}{municipioCP ? ` · ${municipioCP}` : ''}
              </p>
              <button onClick={seleccionarNuevas} className="text-xs font-semibold px-2 py-1 rounded-lg"
                style={{ color: RED, fontFamily: 'var(--font-dm-sans)', backgroundColor: `${RED}10` }}>
                Seleccionar nuevas
              </button>
            </div>
            <div className="rounded-xl overflow-hidden border max-h-64 overflow-y-auto" style={{ borderColor: 'oklch(0.88 0.03 70)' }}>
              {sugeridas.map(s => {
                const esExist = exist.has(s.nombre)
                const esSel   = selec.has(s.nombre)
                return (
                  <button key={s.nombre} onClick={() => !esExist && toggleSelec(s.nombre)} disabled={esExist}
                    className="w-full flex items-center gap-3 px-4 py-2.5 border-b last:border-0 transition-colors text-left"
                    style={{ borderColor: 'oklch(0.92 0.02 70)', backgroundColor: esExist ? 'oklch(0.96 0.01 82)' : esSel ? `${RED}06` : 'oklch(1 0 0)', cursor: esExist ? 'default' : 'pointer' }}>
                    {esExist  ? <CheckSquare className="h-4 w-4 flex-shrink-0" style={{ color: 'oklch(0.70 0.02 40)' }} />
                    : esSel   ? <CheckSquare className="h-4 w-4 flex-shrink-0" style={{ color: RED }} />
                              : <Square      className="h-4 w-4 flex-shrink-0" style={{ color: 'oklch(0.75 0.02 40)' }} />}
                    <span className="text-sm flex-1" style={{ color: esExist ? 'oklch(0.65 0.02 40)' : 'oklch(0.20 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>
                      {s.nombre}
                    </span>
                    {esExist && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'oklch(0.90 0.02 70)', color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>Ya existe</span>}
                  </button>
                )
              })}
            </div>
            {selec.size > 0 && (
              <Button onClick={agregarSeleccionadas} disabled={guardando} className="border-0 gap-2 self-start"
                style={{ backgroundColor: RED, color: 'oklch(0.97 0.012 82)', fontFamily: 'var(--font-dm-sans)' }}>
                {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Agregar {selec.size} seleccionada{selec.size !== 1 ? 's' : ''}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ── AGREGAR MANUAL ── */}
      <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ backgroundColor: 'oklch(1 0 0)', border: BDR }}>
        <p className="text-sm font-semibold" style={{ color: 'oklch(0.20 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>Agregar manualmente</p>
        <div className="flex gap-2">
          <Input value={manualCp} onChange={e => setManualCp(e.target.value.replace(/\D/g, '').slice(0, 5))}
            placeholder="CP" inputMode="numeric" maxLength={5} style={{ ...inp, width: 90, flexShrink: 0 }} />
          <Input value={manualNombre} onChange={e => setManualNombre(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && agregarManual()}
            placeholder="Nombre de la colonia…" style={inp} />
          <Button onClick={agregarManual} disabled={!manualNombre.trim() || manualCp.length !== 5}
            className="border-0 flex-shrink-0" style={{ backgroundColor: RED, color: 'oklch(0.97 0.012 82)' }}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ── LISTA ── */}
      {colonias.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.2rem', letterSpacing: '0.04em', color: 'oklch(0.20 0.03 30)' }}>
              Colonias registradas
            </h2>
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" style={{ color: 'oklch(0.65 0.02 40)' }} />
              <Input value={filtro} onChange={e => setFiltro(e.target.value)} placeholder="Filtrar…"
                className="pl-8 h-8 text-xs" style={inp} />
            </div>
          </div>

          {filtradas ? (
            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'oklch(1 0 0)', border: BDR }}>
              {filtradas.length === 0 && <p className="text-sm text-center py-8" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>Sin resultados</p>}
              {filtradas.map(c => (
                <div key={c.id} className="flex items-center justify-between px-4 py-3 border-b last:border-0" style={{ borderColor: 'oklch(0.92 0.02 70)' }}>
                  <div>
                    <p className="text-sm" style={{ color: 'oklch(0.20 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>{c.nombre}</p>
                    <p className="text-xs" style={{ color: 'oklch(0.60 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>CP {c.codigo_postal}{c.municipio ? ` · ${c.municipio}` : ''}</p>
                  </div>
                  <button onClick={() => eliminar(c.id, c.nombre)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50" style={{ color: 'oklch(0.55 0.12 24)' }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            Object.entries(porCP).map(([cpG, items]) => (
              <div key={cpG} className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'oklch(1 0 0)', border: BDR }}>
                <div className="px-4 py-2 flex items-center gap-2 border-b" style={{ borderColor: 'oklch(0.92 0.02 70)', backgroundColor: 'oklch(0.96 0.01 82)' }}>
                  <MapPin className="h-3.5 w-3.5" style={{ color: RED }} />
                  <span className="text-xs font-bold" style={{ color: 'oklch(0.35 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>CP {cpG}</span>
                  {items[0]?.municipio && <span className="text-xs ml-auto" style={{ color: 'oklch(0.60 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>{items[0].municipio}</span>}
                  <span className="text-xs" style={{ color: 'oklch(0.65 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>{items.length} col.</span>
                </div>
                {items.map(c => (
                  <div key={c.id} className="flex items-center justify-between px-4 py-2.5 border-b last:border-0" style={{ borderColor: 'oklch(0.93 0.01 82)' }}>
                    <p className="text-sm" style={{ color: 'oklch(0.20 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>{c.nombre}</p>
                    <button onClick={() => eliminar(c.id, c.nombre)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50" style={{ color: 'oklch(0.55 0.12 24)' }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}

      {colonias.length === 0 && sinImportar === 0 && (
        <div className="flex flex-col items-center py-16 gap-3 rounded-2xl" style={{ border: `2px dashed oklch(0.85 0.03 70)` }}>
          <MapPin className="h-8 w-8" style={{ color: 'oklch(0.75 0.02 40)' }} />
          <p className="text-sm text-center" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
            Aún no hay colonias.<br />Busca por CP o agrega manualmente.
          </p>
        </div>
      )}
    </div>
  )
}
