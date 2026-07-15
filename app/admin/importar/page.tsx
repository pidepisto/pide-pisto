'use client'

import { useRef, useState } from 'react'
import { Upload, CheckCircle, XCircle, FileSpreadsheet, AlertCircle, ImagePlus } from 'lucide-react'

const RED  = 'oklch(0.50 0.22 24)'
const GRN  = 'oklch(0.45 0.15 145)'
const YEL  = 'oklch(0.55 0.10 80)'
const CARD: React.CSSProperties = { backgroundColor: 'oklch(1 0 0)', border: '1px solid oklch(0.87 0.03 70)', borderRadius: '1rem' }
const TXT: React.CSSProperties  = { color: 'oklch(0.2 0.03 30)',  fontFamily: 'var(--font-dm-sans)' }
const DIM: React.CSSProperties  = { color: 'oklch(0.48 0.03 40)', fontFamily: 'var(--font-dm-sans)' }

type ResultadoCSV = { productos_importados: number; omitidos: number; categorias: number; errores: string[] }
type ResultadoImg = { subidas: number; actualizadas: number; sin_mapeo: string[]; errores: string[] }

// ── Sección CSV ──────────────────────────────────────────────────────────────

function SeccionCSV() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [archivo,     setArchivo]     = useState<File | null>(null)
  const [cargando,    setCargando]    = useState(false)
  const [resultado,   setResultado]   = useState<ResultadoCSV | null>(null)
  const [error,       setError]       = useState<string | null>(null)
  const [arrastrando, setArrastrando] = useState(false)

  const seleccionar = (file: File) => {
    if (!file.name.endsWith('.csv')) { setError('Solo se aceptan archivos .csv'); return }
    setArchivo(file); setResultado(null); setError(null)
  }

  const importar = async () => {
    if (!archivo) return
    setCargando(true); setError(null); setResultado(null)
    const form = new FormData()
    form.append('csv', archivo)
    const res  = await fetch('/api/admin/importar-csv', { method: 'POST', body: form })
    const data = await res.json()
    if (!res.ok) setError(data.error ?? 'Error al importar')
    else setResultado(data)
    setCargando(false)
  }

  return (
    <div className="rounded-2xl p-5 flex flex-col gap-5" style={CARD}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${RED}12` }}>
          <FileSpreadsheet className="h-5 w-5" style={{ color: RED }} />
        </div>
        <div>
          <p className="font-bold text-sm" style={TXT}>Importar productos (CSV)</p>
          <p className="text-xs" style={DIM}>Columna 2: categoría · Columna 4: nombre · Columna 21: precio</p>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setArrastrando(true) }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={e => { e.preventDefault(); setArrastrando(false); const f = e.dataTransfer.files[0]; if (f) seleccionar(f) }}
        className="rounded-xl flex flex-col items-center justify-center gap-3 py-10 cursor-pointer transition-all"
        style={{
          border: `2px dashed ${arrastrando ? RED : archivo ? GRN : 'oklch(0.82 0.03 70)'}`,
          backgroundColor: arrastrando ? `${RED}05` : archivo ? `${GRN}05` : 'oklch(0.97 0.01 82)',
        }}
      >
        <input ref={inputRef} type="file" accept=".csv" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) seleccionar(f) }} />
        {archivo ? (
          <>
            <FileSpreadsheet className="h-8 w-8" style={{ color: GRN }} />
            <div className="text-center">
              <p className="text-sm font-semibold" style={{ ...TXT, color: GRN }}>{archivo.name}</p>
              <p className="text-xs mt-0.5" style={DIM}>{(archivo.size / 1024).toFixed(1)} KB</p>
            </div>
            <button onClick={e => { e.stopPropagation(); setArchivo(null) }}
              className="text-xs px-3 py-1 rounded-lg" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)', border: '1px solid oklch(0.85 0.02 70)' }}>
              Cambiar
            </button>
          </>
        ) : (
          <>
            <Upload className="h-7 w-7" style={{ color: 'oklch(0.65 0.02 40)' }} />
            <p className="text-sm" style={DIM}>Arrastra tu CSV o haz clic</p>
          </>
        )}
      </div>

      {error && (
        <div className="rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: `${RED}08`, border: `1px solid ${RED}40` }}>
          <XCircle className="h-4 w-4 flex-shrink-0" style={{ color: RED }} />
          <p className="text-sm" style={{ color: RED, fontFamily: 'var(--font-dm-sans)' }}>{error}</p>
        </div>
      )}

      {resultado && (
        <div className="rounded-xl p-4 flex flex-col gap-3" style={{ backgroundColor: `${GRN}08`, border: `1px solid ${GRN}40` }}>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" style={{ color: GRN }} />
            <p className="text-sm font-semibold" style={{ color: GRN, fontFamily: 'var(--font-dm-sans)' }}>¡Importación completada!</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Nuevos',      value: resultado.productos_importados, color: GRN },
              { label: 'Omitidos',    value: resultado.omitidos,             color: 'oklch(0.55 0.02 40)' },
              { label: 'Categorías',  value: resultado.categorias,           color: RED },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-lg p-2.5 text-center" style={{ backgroundColor: 'oklch(1 0 0)', border: '1px solid oklch(0.88 0.03 70)' }}>
                <p style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.7rem', letterSpacing: '0.03em', color, lineHeight: 1 }}>{value}</p>
                <p className="text-[10px] mt-0.5" style={DIM}>{label}</p>
              </div>
            ))}
          </div>
          {resultado.errores.length > 0 && (
            <div className="rounded-lg p-2.5" style={{ backgroundColor: `${RED}08` }}>
              <p className="text-xs font-semibold mb-1" style={{ color: RED, fontFamily: 'var(--font-dm-sans)' }}>Con error:</p>
              {resultado.errores.map(e => <p key={e} className="text-xs" style={DIM}>• {e}</p>)}
            </div>
          )}
        </div>
      )}

      <button onClick={importar} disabled={!archivo || cargando}
        className="w-full h-12 rounded-xl text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-40"
        style={{ backgroundColor: RED, color: 'oklch(0.97 0.012 82)', fontFamily: 'var(--font-dm-sans)' }}>
        {cargando ? 'Importando…' : 'Importar productos'}
      </button>
    </div>
  )
}

// ── Sección Imágenes ─────────────────────────────────────────────────────────

function SeccionImagenes() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [archivos,    setArchivos]    = useState<File[]>([])
  const [cargando,    setCargando]    = useState(false)
  const [resultado,   setResultado]   = useState<ResultadoImg | null>(null)
  const [error,       setError]       = useState<string | null>(null)
  const [arrastrando, setArrastrando] = useState(false)
  const [progreso,    setProgreso]    = useState(0)

  const EXTS = ['image/jpeg', 'image/png', 'image/webp']

  const seleccionar = (files: FileList | null) => {
    if (!files) return
    const validos = Array.from(files).filter(f => EXTS.includes(f.type))
    if (!validos.length) { setError('Solo se aceptan imágenes JPG, PNG o WEBP'); return }
    setArchivos(validos); setResultado(null); setError(null)
  }

  const subir = async () => {
    if (!archivos.length) return
    setCargando(true); setError(null); setResultado(null); setProgreso(0)

    // Subir en lotes de 10 para no saturar
    const LOTE  = 10
    let subidas = 0, actualizadas = 0
    const sinMapeo: string[] = [], errores: string[] = []

    for (let i = 0; i < archivos.length; i += LOTE) {
      const lote = archivos.slice(i, i + LOTE)
      const form = new FormData()
      lote.forEach(f => form.append('imagenes', f))

      const res  = await fetch('/api/admin/importar-imagenes', { method: 'POST', body: form })
      const data = await res.json()

      if (res.ok) {
        subidas      += data.subidas      ?? 0
        actualizadas += data.actualizadas ?? 0
        sinMapeo.push(...(data.sin_mapeo  ?? []))
        errores.push(...(data.errores     ?? []))
      }
      setProgreso(Math.round(((i + lote.length) / archivos.length) * 100))
    }

    setResultado({ subidas, actualizadas, sin_mapeo: sinMapeo, errores })
    setCargando(false)
  }

  return (
    <div className="rounded-2xl p-5 flex flex-col gap-5" style={CARD}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'oklch(0.55 0.15 280 / 0.12)' }}>
          <ImagePlus className="h-5 w-5" style={{ color: 'oklch(0.45 0.18 280)' }} />
        </div>
        <div>
          <p className="font-bold text-sm" style={TXT}>Subir imágenes de productos</p>
          <p className="text-xs" style={DIM}>JPG, PNG o WEBP · Se asignan automáticamente por nombre de archivo</p>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setArrastrando(true) }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={e => { e.preventDefault(); setArrastrando(false); seleccionar(e.dataTransfer.files) }}
        className="rounded-xl flex flex-col items-center justify-center gap-3 py-10 cursor-pointer transition-all"
        style={{
          border: `2px dashed ${arrastrando ? 'oklch(0.45 0.18 280)' : archivos.length ? GRN : 'oklch(0.82 0.03 70)'}`,
          backgroundColor: arrastrando ? 'oklch(0.55 0.15 280 / 0.05)' : archivos.length ? `${GRN}05` : 'oklch(0.97 0.01 82)',
        }}
      >
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
          onChange={e => seleccionar(e.target.files)} />
        {archivos.length ? (
          <>
            <ImagePlus className="h-8 w-8" style={{ color: GRN }} />
            <div className="text-center">
              <p className="text-sm font-semibold" style={{ ...TXT, color: GRN }}>{archivos.length} imágenes seleccionadas</p>
              <p className="text-xs mt-0.5" style={DIM}>{(archivos.reduce((s, f) => s + f.size, 0) / 1024 / 1024).toFixed(1)} MB en total</p>
            </div>
            <button onClick={e => { e.stopPropagation(); setArchivos([]) }}
              className="text-xs px-3 py-1 rounded-lg" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)', border: '1px solid oklch(0.85 0.02 70)' }}>
              Cambiar
            </button>
          </>
        ) : (
          <>
            <Upload className="h-7 w-7" style={{ color: 'oklch(0.65 0.02 40)' }} />
            <p className="text-sm" style={DIM}>Arrastra todas las imágenes o haz clic</p>
            <p className="text-xs" style={{ ...DIM, opacity: 0.7 }}>Puedes seleccionar varias a la vez</p>
          </>
        )}
      </div>

      {/* Barra de progreso */}
      {cargando && (
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-xs" style={DIM}>
            <span>Subiendo imágenes…</span><span>{progreso}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'oklch(0.90 0.02 75)' }}>
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progreso}%`, backgroundColor: GRN }} />
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: `${RED}08`, border: `1px solid ${RED}40` }}>
          <XCircle className="h-4 w-4 flex-shrink-0" style={{ color: RED }} />
          <p className="text-sm" style={{ color: RED, fontFamily: 'var(--font-dm-sans)' }}>{error}</p>
        </div>
      )}

      {resultado && (
        <div className="rounded-xl p-4 flex flex-col gap-3" style={{ backgroundColor: `${GRN}08`, border: `1px solid ${GRN}40` }}>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" style={{ color: GRN }} />
            <p className="text-sm font-semibold" style={{ color: GRN, fontFamily: 'var(--font-dm-sans)' }}>¡Imágenes subidas!</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Subidas a Storage',      value: resultado.subidas,      color: GRN },
              { label: 'Productos actualizados', value: resultado.actualizadas,  color: RED },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-lg p-2.5 text-center" style={{ backgroundColor: 'oklch(1 0 0)', border: '1px solid oklch(0.88 0.03 70)' }}>
                <p style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.7rem', letterSpacing: '0.03em', color, lineHeight: 1 }}>{value}</p>
                <p className="text-[10px] mt-0.5" style={DIM}>{label}</p>
              </div>
            ))}
          </div>
          {resultado.sin_mapeo.length > 0 && (
            <div className="rounded-lg p-2.5" style={{ backgroundColor: `${YEL}10`, border: `1px solid ${YEL}40` }}>
              <div className="flex items-center gap-1.5 mb-1">
                <AlertCircle className="h-3.5 w-3.5" style={{ color: YEL }} />
                <p className="text-xs font-semibold" style={{ color: 'oklch(0.40 0.08 70)', fontFamily: 'var(--font-dm-sans)' }}>
                  Subidas pero sin producto asignado ({resultado.sin_mapeo.length}):
                </p>
              </div>
              {resultado.sin_mapeo.map(f => <p key={f} className="text-xs" style={DIM}>• {f}</p>)}
            </div>
          )}
          {resultado.errores.length > 0 && (
            <div className="rounded-lg p-2.5" style={{ backgroundColor: `${RED}08` }}>
              <p className="text-xs font-semibold mb-1" style={{ color: RED, fontFamily: 'var(--font-dm-sans)' }}>Con error:</p>
              {resultado.errores.map(f => <p key={f} className="text-xs" style={DIM}>• {f}</p>)}
            </div>
          )}
        </div>
      )}

      <button onClick={subir} disabled={!archivos.length || cargando}
        className="w-full h-12 rounded-xl text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-40"
        style={{ backgroundColor: 'oklch(0.45 0.18 280)', color: 'oklch(0.97 0.012 82)', fontFamily: 'var(--font-dm-sans)' }}>
        {cargando ? `Subiendo… ${progreso}%` : `Subir ${archivos.length ? `${archivos.length} imágenes` : 'imágenes'}`}
      </button>
    </div>
  )
}

// ── Página principal ─────────────────────────────────────────────────────────

export default function ImportarPage() {
  return (
    <div className="p-5 flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 style={{ fontFamily: 'var(--font-bebas)', fontSize: '2rem', letterSpacing: '0.05em', color: 'oklch(0.2 0.03 30)', lineHeight: 1 }}>
          Importar catálogo
        </h1>
        <p className="text-sm mt-1" style={{ color: 'oklch(0.48 0.03 40)', fontFamily: 'var(--font-dm-sans)' }}>
          Primero importa los productos con el CSV, luego sube las imágenes
        </p>
      </div>

      <SeccionCSV />
      <SeccionImagenes />
    </div>
  )
}
