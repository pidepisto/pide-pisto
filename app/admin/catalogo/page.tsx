'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Power, Save, X, ImagePlus, Loader2, Eye, EyeOff, Tag, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import type { Banner, Producto, Categoria } from '@/lib/types'
import { fp } from '@/lib/utils'

/* ── Estilos compartidos ── */
const inputStyle = { backgroundColor: 'oklch(0.97 0.012 82)', color: 'oklch(0.20 0.03 30)', border: '1px solid oklch(0.88 0.03 70)', fontFamily: 'var(--font-dm-sans)' }
const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold" style={{ color: 'oklch(0.35 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>{label}</label>
    {children}
  </div>
)

type ProductoForm = {
  nombre: string; descripcion: string; precio: string; precio_promocion: string
  stock: string; categoria_id: string; imagen_url: string
}
const PROD_VACIO: ProductoForm = {
  nombre: '', descripcion: '', precio: '', precio_promocion: '',
  stock: '', categoria_id: '', imagen_url: '',
}

type CatForm = { nombre: string; slug: string; orden: string }
const CAT_VACIO: CatForm = { nombre: '', slug: '', orden: '' }

type BannerForm = {
  titulo: string; subtitulo: string; badge_texto: string; badge_color: string
  boton_texto: string; boton_url: string; color_fondo: string; color_texto: string; orden: string
}
const BANNER_VACIO: BannerForm = {
  titulo: '', subtitulo: '', badge_texto: '', badge_color: '#CC2200',
  boton_texto: '', boton_url: '', color_fondo: '#1a1a2e', color_texto: '#ffffff', orden: '0',
}

type Tab = 'productos' | 'categorias' | 'banners'

const RED = 'oklch(0.50 0.22 24)'
const GRN = 'oklch(0.45 0.15 145)'
const YEL = 'oklch(0.76 0.14 80)'

export default function AdminCatalogo() {
  const supabase     = createClient()
  const fileRef      = useRef<HTMLInputElement>(null)   // categorías
  const bannerFileRef= useRef<HTMLInputElement>(null)   // banners
  const prodFileRef  = useRef<HTMLInputElement>(null)   // productos

  const [tab, setTab]             = useState<Tab>('productos')
  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCats]     = useState<Categoria[]>([])
  const [banners, setBanners]     = useState<Banner[]>([])

  /* Producto modal */
  const [modalProd,    setModalProd]    = useState(false)
  const [editProd,     setEditProd]     = useState<Producto | null>(null)
  const [formProd,     setFormProd]     = useState<ProductoForm>(PROD_VACIO)
  const [loadProd,     setLoadProd]     = useState(false)
  const [prodImgFile,  setProdImgFile]  = useState<File | null>(null)
  const [prodImgPrev,  setProdImgPrev]  = useState<string | null>(null)
  const [uploadingProd,setUploadingProd]= useState(false)

  /* Categoría modal */
  const [modalCat,     setModalCat]     = useState(false)
  const [editCat,      setEditCat]      = useState<Categoria | null>(null)
  const [formCat,      setFormCat]      = useState<CatForm>(CAT_VACIO)
  const [loadCat,      setLoadCat]      = useState(false)
  const [catImgFile,   setCatImgFile]   = useState<File | null>(null)
  const [catImgPrev,   setCatImgPrev]   = useState<string | null>(null)
  const [uploadingCat, setUploadingCat] = useState(false)

  /* Banner modal */
  const [modalBanner,     setModalBanner]     = useState(false)
  const [editBanner,      setEditBanner]      = useState<Banner | null>(null)
  const [formBanner,      setFormBanner]      = useState<BannerForm>(BANNER_VACIO)
  const [loadBanner,      setLoadBanner]      = useState(false)
  const [bannerImgFile,   setBannerImgFile]   = useState<File | null>(null)
  const [bannerImgPrev,   setBannerImgPrev]   = useState<string | null>(null)
  const [uploadingBanner, setUploadingBanner] = useState(false)

  const cargar = async () => {
    const [{ data: prods }, { data: cats }, { data: bans }] = await Promise.all([
      supabase.from('productos').select('*, categoria:categorias(*)').order('nombre'),
      supabase.from('categorias').select('*').order('orden'),
      supabase.from('banners').select('*').order('orden'),
    ])
    setProductos((prods ?? []) as any)
    setCats((cats ?? []) as any)
    setBanners((bans ?? []) as any)
  }
  useEffect(() => { cargar() }, [])

  /* ── Productos ── */
  const abrirNuevoProd = () => {
    setEditProd(null); setFormProd(PROD_VACIO)
    setProdImgFile(null); setProdImgPrev(null); setModalProd(true)
  }
  const abrirEditarProd = (p: Producto) => {
    setEditProd(p)
    setFormProd({
      nombre: p.nombre, descripcion: p.descripcion ?? '',
      precio: String(p.precio), precio_promocion: p.precio_promocion ? String(p.precio_promocion) : '',
      stock: String(p.stock), categoria_id: p.categoria_id, imagen_url: p.imagen_url ?? '',
    })
    setProdImgFile(null); setProdImgPrev(p.imagen_url ?? null); setModalProd(true)
  }
  const guardarProd = async () => {
    if (!formProd.nombre || !formProd.precio || !formProd.categoria_id) {
      toast.error('Completa los campos requeridos'); return
    }
    setLoadProd(true)
    let imagen_url = formProd.imagen_url || editProd?.imagen_url || null

    if (prodImgFile) {
      setUploadingProd(true)
      const ext  = prodImgFile.name.split('.').pop()
      const path = `${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('productos').upload(path, prodImgFile, { upsert: true, contentType: prodImgFile.type })
      if (error) { toast.error(`Error al subir imagen: ${error.message}`); setLoadProd(false); setUploadingProd(false); return }
      imagen_url = `${supabase.storage.from('productos').getPublicUrl(path).data.publicUrl}?t=${Date.now()}`
      setUploadingProd(false)
    }

    const payload = {
      nombre:           formProd.nombre.trim(),
      descripcion:      formProd.descripcion || null,
      precio:           parseFloat(formProd.precio),
      precio_promocion: formProd.precio_promocion ? parseFloat(formProd.precio_promocion) : null,
      stock:            parseInt(formProd.stock) || 0,
      categoria_id:     formProd.categoria_id,
      imagen_url,
    }
    if (editProd) { await supabase.from('productos').update(payload).eq('id', editProd.id); toast.success('Producto actualizado') }
    else          { await supabase.from('productos').insert(payload); toast.success('Producto creado') }
    setModalProd(false); cargar(); setLoadProd(false)
  }
  const toggleActivo = async (p: Producto) => {
    await supabase.from('productos').update({ activo: !p.activo }).eq('id', p.id)
    toast.success(p.activo ? 'Desactivado' : 'Activado'); cargar()
  }
  const eliminarProd = async (p: Producto) => {
    if (!confirm(`¿Eliminar "${p.nombre}"? Esta acción no se puede deshacer.`)) return
    const { error } = await supabase.from('productos').delete().eq('id', p.id)
    if (error) { toast.error('No se pudo eliminar el producto'); return }
    toast.success('Producto eliminado'); cargar()
  }

  /* ── Categorías ── */
  const abrirNuevaCat = () => { setEditCat(null); setFormCat(CAT_VACIO); setCatImgFile(null); setCatImgPrev(null); setModalCat(true) }
  const abrirEditarCat = (c: Categoria) => {
    setEditCat(c); setFormCat({ nombre: c.nombre, slug: c.slug, orden: String(c.orden) })
    setCatImgPrev(c.imagen_url); setCatImgFile(null); setModalCat(true)
  }
  const guardarCat = async () => {
    if (!formCat.nombre) { toast.error('El nombre es requerido'); return }
    setLoadCat(true)
    const slug = formCat.slug || formCat.nombre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    let imagen_url = editCat?.imagen_url ?? null
    if (catImgFile) {
      setUploadingCat(true)
      const ext = catImgFile.name.split('.').pop()
      const { error } = await supabase.storage.from('categorias').upload(`${slug}.${ext}`, catImgFile, { upsert: true })
      if (error) { toast.error('Error al subir imagen'); setLoadCat(false); setUploadingCat(false); return }
      imagen_url = `${supabase.storage.from('categorias').getPublicUrl(`${slug}.${ext}`).data.publicUrl}?t=${Date.now()}`
      setUploadingCat(false)
    }
    const payload = { nombre: formCat.nombre.trim(), slug, orden: parseInt(formCat.orden) || 0, imagen_url }
    if (editCat) { await supabase.from('categorias').update(payload).eq('id', editCat.id); toast.success('Categoría actualizada') }
    else         { await supabase.from('categorias').insert(payload); toast.success('Categoría creada') }
    setModalCat(false); cargar(); setLoadCat(false)
  }
  const eliminarCat = async (c: Categoria) => {
    const { error } = await supabase.from('categorias').delete().eq('id', c.id)
    if (error) { toast.error('No se puede eliminar (tiene productos)'); return }
    toast.success('Categoría eliminada'); cargar()
  }

  /* ── Banners ── */
  const abrirNuevoBanner = () => { setEditBanner(null); setFormBanner(BANNER_VACIO); setBannerImgFile(null); setBannerImgPrev(null); setModalBanner(true) }
  const abrirEditarBanner = (b: Banner) => {
    setEditBanner(b)
    setFormBanner({ titulo: b.titulo, subtitulo: b.subtitulo ?? '', badge_texto: b.badge_texto ?? '', badge_color: b.badge_color, boton_texto: b.boton_texto ?? '', boton_url: b.boton_url ?? '', color_fondo: b.color_fondo, color_texto: b.color_texto, orden: String(b.orden) })
    setBannerImgPrev(b.imagen_url); setBannerImgFile(null); setModalBanner(true)
  }
  const guardarBanner = async () => {
    if (!formBanner.titulo && !bannerImgFile && !editBanner?.imagen_url) { toast.error('Agrega al menos un título o una imagen'); return }
    setLoadBanner(true)
    let imagen_url = editBanner?.imagen_url ?? null
    if (bannerImgFile) {
      setUploadingBanner(true)
      const ext  = bannerImgFile.name.split('.').pop()
      const path = `banner-${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('banners').upload(path, bannerImgFile, { upsert: true })
      if (error) { toast.error('Error al subir imagen'); setLoadBanner(false); setUploadingBanner(false); return }
      imagen_url = `${supabase.storage.from('banners').getPublicUrl(path).data.publicUrl}?t=${Date.now()}`
      setUploadingBanner(false)
    }
    const payload = {
      titulo: formBanner.titulo.trim(), subtitulo: formBanner.subtitulo || null,
      badge_texto: formBanner.badge_texto || null, badge_color: formBanner.badge_color,
      boton_texto: formBanner.boton_texto || null, boton_url: formBanner.boton_url || null,
      color_fondo: formBanner.color_fondo, color_texto: formBanner.color_texto,
      imagen_url, orden: parseInt(formBanner.orden) || 0,
    }
    if (editBanner) { await supabase.from('banners').update(payload).eq('id', editBanner.id); toast.success('Banner actualizado') }
    else            { await supabase.from('banners').insert(payload); toast.success('Banner creado') }
    setModalBanner(false); cargar(); setLoadBanner(false)
  }
  const toggleBanner = async (b: Banner) => {
    await supabase.from('banners').update({ activo: !b.activo }).eq('id', b.id)
    toast.success(b.activo ? 'Banner oculto' : 'Banner visible'); cargar()
  }
  const eliminarBanner = async (b: Banner) => {
    await supabase.from('banners').delete().eq('id', b.id)
    toast.success('Banner eliminado'); cargar()
  }

  const TABS: Tab[] = ['productos', 'categorias', 'banners']

  return (
    <div className="p-6 flex flex-col gap-5">

      {/* Tabs + acción */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ backgroundColor: 'oklch(0.91 0.02 75)', border: '1px solid oklch(0.88 0.03 70)' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all"
              style={{ fontFamily: 'var(--font-dm-sans)', backgroundColor: tab === t ? RED : 'transparent', color: tab === t ? 'oklch(0.97 0.012 82)' : 'oklch(0.40 0.02 40)' }}>
              {t}
            </button>
          ))}
        </div>
        {tab === 'productos'  && <Button onClick={abrirNuevoProd}   className="gap-2 border-0" style={{ backgroundColor: RED, color: 'oklch(0.97 0.012 82)', fontFamily: 'var(--font-dm-sans)' }}><Plus className="h-4 w-4" /> Nuevo producto</Button>}
        {tab === 'categorias' && <Button onClick={abrirNuevaCat}    className="gap-2 border-0" style={{ backgroundColor: RED, color: 'oklch(0.97 0.012 82)', fontFamily: 'var(--font-dm-sans)' }}><Plus className="h-4 w-4" /> Nueva categoría</Button>}
        {tab === 'banners'    && <Button onClick={abrirNuevoBanner} className="gap-2 border-0" style={{ backgroundColor: RED, color: 'oklch(0.97 0.012 82)', fontFamily: 'var(--font-dm-sans)' }}><Plus className="h-4 w-4" /> Nuevo banner</Button>}
      </div>

      {/* ── LISTA DE PRODUCTOS ── */}
      {tab === 'productos' && (
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'oklch(1 0 0)', border: '1px solid oklch(0.88 0.03 70)' }}>
          {productos.length === 0 && (
            <p className="text-sm text-center py-12" style={{ color: 'oklch(0.50 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>Sin productos. Crea el primero.</p>
          )}
          {productos.map((p, i) => (
            <div key={p.id}>
              {i > 0 && <div className="h-px mx-4" style={{ backgroundColor: 'oklch(0.90 0.02 70)' }} />}
            <div
              className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-black/[0.02]"
              style={{ opacity: p.activo ? 1 : 0.45 }}>

              {/* Imagen */}
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 relative"
                style={{ backgroundColor: 'oklch(0.93 0.02 80)', border: '1px solid oklch(0.88 0.03 70)' }}>
                {p.imagen_url
                  ? <Image src={p.imagen_url} alt={p.nombre} fill className="object-cover" sizes="64px" />
                  : <div className="w-full h-full flex items-center justify-center">
                      <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.6rem', color: 'oklch(0.65 0.03 40)' }}>
                        {p.nombre.charAt(0)}
                      </span>
                    </div>
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold" style={{ color: 'oklch(0.20 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>
                    {p.nombre}
                  </p>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: 'oklch(0.90 0.02 70)', color: 'oklch(0.45 0.03 40)', fontFamily: 'var(--font-dm-sans)' }}>
                    {(p.categoria as any)?.nombre}
                  </span>
                  {p.precio_promocion && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: `${YEL}20`, color: YEL, fontFamily: 'var(--font-dm-sans)' }}>
                      PROMO
                    </span>
                  )}
                </div>
                {p.descripcion && (
                  <p className="text-xs mt-0.5 truncate" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
                    {p.descripcion}
                  </p>
                )}
              </div>

              {/* Stock */}
              <div className="flex-shrink-0 hidden sm:flex items-center">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                  style={{
                    backgroundColor: p.stock > 10 ? 'oklch(0.45 0.15 145 / 0.15)' : p.stock > 0 ? 'oklch(0.76 0.14 80 / 0.15)' : 'oklch(0.50 0.22 24 / 0.15)',
                    color: p.stock > 10 ? GRN : p.stock > 0 ? 'oklch(0.60 0.10 75)' : RED,
                    fontFamily: 'var(--font-dm-sans)',
                  }}>
                  {p.stock} pzs
                </span>
              </div>

              {/* Precio */}
              <div className="text-right flex-shrink-0 w-28">
                {p.precio_promocion ? (
                  <>
                    <p style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.15rem', letterSpacing: '0.03em', color: YEL, lineHeight: 1.1 }}>
                      {fp(p.precio_promocion)}
                    </p>
                    <p className="line-through text-xs mt-0.5" style={{ color: 'oklch(0.40 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
                      {fp(p.precio)}
                    </p>
                  </>
                ) : (
                  <p style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.15rem', letterSpacing: '0.03em', color: RED }}>
                    {fp(p.precio)}
                  </p>
                )}
              </div>

              {/* Acciones */}
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => abrirEditarProd(p)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-black/5"
                  style={{ backgroundColor: 'oklch(0.91 0.02 70)', color: 'oklch(0.45 0.02 40)' }}
                  title="Editar">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => toggleActivo(p)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                  style={{ backgroundColor: p.activo ? 'oklch(0.45 0.15 145 / 0.12)' : 'oklch(0.91 0.02 70)', color: p.activo ? GRN : 'oklch(0.55 0.02 40)' }}
                  title={p.activo ? 'Desactivar' : 'Activar'}>
                  <Power className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => eliminarProd(p)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-black/5"
                  style={{ backgroundColor: `${RED}10`, color: RED }}
                  title="Eliminar">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Categorías ── */}
      {tab === 'categorias' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {categorias.map((c) => (
            <div key={c.id} className="rounded-2xl overflow-hidden flex flex-col"
              style={{ backgroundColor: 'oklch(1 0 0)', border: '1px solid oklch(0.88 0.03 70)' }}>
              <div className="w-full h-28 flex items-center justify-center relative" style={{ backgroundColor: 'oklch(0.93 0.02 80)' }}>
                {c.imagen_url ? <Image src={c.imagen_url} alt={c.nombre} fill className="object-cover" /> : <span className="text-4xl" style={{ color: 'oklch(0.65 0.03 40)' }}>{c.nombre.charAt(0)}</span>}
              </div>
              <div className="p-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'oklch(0.20 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>{c.nombre}</p>
                  <p className="text-[10px]" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>Orden: {c.orden}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => abrirEditarCat(c)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-black/5" style={{ color: 'oklch(0.50 0.02 40)' }}><Pencil className="h-3 w-3" /></button>
                  <button onClick={() => eliminarCat(c)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-black/5" style={{ color: 'oklch(0.50 0.02 40)' }}><X className="h-3 w-3" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Banners ── */}
      {tab === 'banners' && (
        <div className="flex flex-col gap-3">
          {banners.length === 0 && (
            <p className="text-sm text-center py-10" style={{ color: 'oklch(0.50 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>Sin banners. Crea el primero.</p>
          )}
          {banners.map((b) => (
            <div key={b.id} className="rounded-2xl overflow-hidden flex gap-0"
              style={{ backgroundColor: 'oklch(1 0 0)', border: '1px solid oklch(0.88 0.03 70)', opacity: b.activo ? 1 : 0.5 }}>
              <div className="w-28 h-20 flex-shrink-0 relative flex items-center justify-center rounded-l-2xl overflow-hidden" style={{ backgroundColor: b.color_fondo }}>
                {b.imagen_url && <Image src={b.imagen_url} alt={b.titulo} fill className="object-cover" />}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, oklch(0 0 0 / 0.5), transparent)' }} />
                {b.badge_texto && <span className="absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: b.badge_color, color: '#fff', fontFamily: 'var(--font-dm-sans)' }}>{b.badge_texto}</span>}
                <p className="absolute bottom-1.5 left-1.5 right-1.5 text-[10px] font-bold leading-tight" style={{ color: b.color_texto, fontFamily: 'var(--font-bebas)', letterSpacing: '0.03em' }}>{b.titulo}</p>
              </div>
              <div className="flex-1 p-3 flex items-center gap-2 min-w-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'oklch(0.20 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>{b.titulo}</p>
                  {b.subtitulo && <p className="text-xs truncate mt-0.5" style={{ color: 'oklch(0.50 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>{b.subtitulo}</p>}
                  <p className="text-[10px] mt-1" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>Orden: {b.orden}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => abrirEditarBanner(b)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-black/5" style={{ color: 'oklch(0.50 0.02 40)' }}><Pencil className="h-3 w-3" /></button>
                  <button onClick={() => toggleBanner(b)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-black/5" style={{ color: b.activo ? GRN : 'oklch(0.55 0.02 40)' }}>
                    {b.activo ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  </button>
                  <button onClick={() => eliminarBanner(b)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-black/5" style={{ color: 'oklch(0.50 0.02 40)' }}><X className="h-3 w-3" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal Producto ── */}
      {modalProd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModalProd(false)} />
          <div className="relative w-full max-w-md rounded-2xl p-6 flex flex-col gap-4 overflow-y-auto max-h-[90vh]"
            style={{ backgroundColor: 'oklch(1 0 0)', border: '1px solid oklch(0.88 0.03 70)', boxShadow: '0 8px 40px oklch(0 0 0 / 0.15)' }}>
            <div className="flex items-center justify-between">
              <h2 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.5rem', letterSpacing: '0.04em', color: 'oklch(0.20 0.03 30)' }}>
                {editProd ? 'Editar producto' : 'Nuevo producto'}
              </h2>
              <button onClick={() => setModalProd(false)} style={{ color: 'oklch(0.55 0.02 40)' }}><X className="h-5 w-5" /></button>
            </div>

            {/* Foto del producto */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold" style={{ color: 'oklch(0.35 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>Foto del producto</label>
              <input ref={prodFileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  if (f.size > 3 * 1024 * 1024) { toast.error('Imagen máx. 3 MB'); return }
                  setProdImgFile(f); setProdImgPrev(URL.createObjectURL(f))
                }} />
              <button type="button" onClick={() => prodFileRef.current?.click()}
                className="w-full h-36 rounded-2xl flex flex-col items-center justify-center gap-2 overflow-hidden relative transition-opacity hover:opacity-80"
                style={{ border: '2px dashed oklch(0.80 0.03 70)', backgroundColor: 'oklch(0.96 0.01 82)' }}>
                {prodImgPrev ? (
                  <>
                    <Image src={prodImgPrev} alt="preview" fill className="object-cover rounded-2xl" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-2xl"
                      style={{ backgroundColor: 'oklch(0 0 0 / 0.55)' }}>
                      <div className="flex flex-col items-center gap-1">
                        <ImagePlus className="h-6 w-6 text-white" />
                        <span className="text-xs text-white font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>Cambiar foto</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <ImagePlus className="h-7 w-7" style={{ color: 'oklch(0.60 0.02 40)' }} />
                    <span className="text-xs" style={{ color: 'oklch(0.60 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>Subir foto · JPG, PNG o WEBP, máx 3 MB</span>
                  </>
                )}
              </button>
            </div>

            <F label="Nombre *">
              <Input value={formProd.nombre} onChange={e => setFormProd({...formProd, nombre: e.target.value})} placeholder="Corona 355ml" style={inputStyle} />
            </F>
            <F label="Descripción">
              <Input value={formProd.descripcion} onChange={e => setFormProd({...formProd, descripcion: e.target.value})} placeholder="Descripción breve" style={inputStyle} />
            </F>

            {/* Precios */}
            <div className="grid grid-cols-2 gap-3">
              <F label="Precio regular * (MXN)">
                <Input type="number" value={formProd.precio} onChange={e => setFormProd({...formProd, precio: e.target.value})} placeholder="0.00" style={inputStyle} />
              </F>
              <F label="Precio promo (MXN)">
                <div className="relative">
                  <Input type="number" value={formProd.precio_promocion} onChange={e => setFormProd({...formProd, precio_promocion: e.target.value})} placeholder="Opcional" style={{ ...inputStyle, paddingLeft: '2rem' }} />
                  <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: YEL }} />
                </div>
              </F>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <F label="Stock">
                <Input type="number" value={formProd.stock} onChange={e => setFormProd({...formProd, stock: e.target.value})} placeholder="0" style={inputStyle} />
              </F>
              <F label="Categoría *">
                <select value={formProd.categoria_id} onChange={e => setFormProd({...formProd, categoria_id: e.target.value})} className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={inputStyle}>
                  <option value="">Seleccionar…</option>
                  {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </F>
            </div>

            {formProd.precio_promocion && formProd.precio && parseFloat(formProd.precio_promocion) >= parseFloat(formProd.precio) && (
              <p className="text-xs" style={{ color: YEL, fontFamily: 'var(--font-dm-sans)' }}>
                ⚠ El precio promo debe ser menor al precio regular
              </p>
            )}

            <Button onClick={guardarProd} disabled={loadProd || uploadingProd} className="gap-2 border-0 mt-1" style={{ backgroundColor: RED, color: 'oklch(0.97 0.012 82)', fontFamily: 'var(--font-dm-sans)' }}>
              {(loadProd || uploadingProd) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {uploadingProd ? 'Subiendo imagen…' : loadProd ? 'Guardando…' : 'Guardar producto'}
            </Button>
          </div>
        </div>
      )}

      {/* ── Modal Categoría ── */}
      {modalCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModalCat(false)} />
          <div className="relative w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4"
            style={{ backgroundColor: 'oklch(1 0 0)', border: '1px solid oklch(0.88 0.03 70)', boxShadow: '0 8px 40px oklch(0 0 0 / 0.15)' }}>
            <div className="flex items-center justify-between">
              <h2 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.5rem', letterSpacing: '0.04em', color: 'oklch(0.20 0.03 30)' }}>{editCat ? 'Editar categoría' : 'Nueva categoría'}</h2>
              <button onClick={() => setModalCat(false)} style={{ color: 'oklch(0.55 0.02 40)' }}><X className="h-5 w-5" /></button>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold" style={{ color: 'oklch(0.35 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>Foto</label>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setCatImgFile(f); setCatImgPrev(URL.createObjectURL(f)) } }} />
              <button onClick={() => fileRef.current?.click()}
                className="w-full h-28 rounded-2xl flex flex-col items-center justify-center gap-2 overflow-hidden relative"
                style={{ border: '2px dashed oklch(0.80 0.03 70)', backgroundColor: 'oklch(0.96 0.01 82)' }}>
                {catImgPrev ? <Image src={catImgPrev} alt="preview" fill className="object-cover rounded-2xl" /> : <><ImagePlus className="h-6 w-6" style={{ color: 'oklch(0.60 0.02 40)' }} /><span className="text-xs" style={{ color: 'oklch(0.60 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>Subir foto</span></>}
                {catImgPrev && <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity" style={{ backgroundColor: 'oklch(0 0 0 / 0.5)', borderRadius: '1rem' }}><ImagePlus className="h-6 w-6 text-white" /></div>}
              </button>
            </div>
            <F label="Nombre *"><Input value={formCat.nombre} onChange={e => setFormCat({...formCat, nombre: e.target.value})} placeholder="Cerveza" style={inputStyle} /></F>
            <F label="Slug (auto)"><Input value={formCat.slug} onChange={e => setFormCat({...formCat, slug: e.target.value})} placeholder="cerveza" style={inputStyle} /></F>
            <F label="Orden"><Input type="number" value={formCat.orden} onChange={e => setFormCat({...formCat, orden: e.target.value})} placeholder="1" style={inputStyle} /></F>
            <Button onClick={guardarCat} disabled={loadCat} className="gap-2 border-0" style={{ backgroundColor: RED, color: 'oklch(0.97 0.012 82)', fontFamily: 'var(--font-dm-sans)' }}>
              {(loadCat || uploadingCat) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {uploadingCat ? 'Subiendo…' : loadCat ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        </div>
      )}

      {/* ── Modal Banner ── */}
      {modalBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModalBanner(false)} />
          <div className="relative w-full max-w-md rounded-2xl p-6 flex flex-col gap-4 overflow-y-auto max-h-[90vh]"
            style={{ backgroundColor: 'oklch(1 0 0)', border: '1px solid oklch(0.88 0.03 70)', boxShadow: '0 8px 40px oklch(0 0 0 / 0.15)' }}>
            <div className="flex items-center justify-between">
              <h2 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.5rem', letterSpacing: '0.04em', color: 'oklch(0.20 0.03 30)' }}>{editBanner ? 'Editar banner' : 'Nuevo banner'}</h2>
              <button onClick={() => setModalBanner(false)} style={{ color: 'oklch(0.55 0.02 40)' }}><X className="h-5 w-5" /></button>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold" style={{ color: 'oklch(0.35 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>Imagen de fondo / decorativa</label>
              <input ref={bannerFileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setBannerImgFile(f); setBannerImgPrev(URL.createObjectURL(f)) } }} />
              <button onClick={() => bannerFileRef.current?.click()}
                className="w-full rounded-2xl overflow-hidden relative flex items-center justify-center"
                style={{ aspectRatio: '16/6', border: '2px dashed oklch(1 0 0 / 0.15)', backgroundColor: bannerImgPrev ? 'transparent' : formBanner.color_fondo }}>
                {bannerImgPrev ? <Image src={bannerImgPrev} alt="preview" fill className="object-cover" /> : <div className="flex flex-col items-center gap-2"><ImagePlus className="h-6 w-6" style={{ color: 'oklch(0.55 0.02 40)' }} /><span className="text-xs" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>Subir imagen</span></div>}
                {bannerImgPrev && <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity" style={{ backgroundColor: 'oklch(0 0 0 / 0.5)' }}><ImagePlus className="h-6 w-6 text-white" /></div>}
                {!bannerImgPrev && formBanner.titulo && (
                  <div className="absolute inset-0 flex flex-col justify-center px-4 gap-1">
                    {formBanner.badge_texto && <span className="self-start text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: formBanner.badge_color, color: '#fff', fontFamily: 'var(--font-dm-sans)' }}>{formBanner.badge_texto}</span>}
                    <p style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.2rem', color: formBanner.color_texto, letterSpacing: '0.04em' }}>{formBanner.titulo}</p>
                  </div>
                )}
              </button>
            </div>
            <F label="Título"><Input value={formBanner.titulo} onChange={e => setFormBanner({...formBanner, titulo: e.target.value})} placeholder="¡Promo de fin de semana!" style={inputStyle} /></F>
            <F label="Subtítulo"><Input value={formBanner.subtitulo} onChange={e => setFormBanner({...formBanner, subtitulo: e.target.value})} placeholder="Desc en cervezas y más" style={inputStyle} /></F>
            <div className="grid grid-cols-2 gap-3">
              <F label="Badge texto"><Input value={formBanner.badge_texto} onChange={e => setFormBanner({...formBanner, badge_texto: e.target.value})} placeholder="PROMO" style={inputStyle} /></F>
              <F label="Color badge">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ ...inputStyle, padding: '0.375rem 0.75rem' }}>
                  <input type="color" value={formBanner.badge_color} onChange={e => setFormBanner({...formBanner, badge_color: e.target.value})} className="w-6 h-6 rounded border-0 bg-transparent" />
                  <span className="text-xs" style={{ color: 'oklch(0.45 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>{formBanner.badge_color}</span>
                </div>
              </F>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <F label="Color fondo">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ ...inputStyle, padding: '0.375rem 0.75rem' }}>
                  <input type="color" value={formBanner.color_fondo} onChange={e => setFormBanner({...formBanner, color_fondo: e.target.value})} className="w-6 h-6 rounded border-0 bg-transparent" />
                  <span className="text-xs" style={{ color: 'oklch(0.45 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>{formBanner.color_fondo}</span>
                </div>
              </F>
              <F label="Color texto">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ ...inputStyle, padding: '0.375rem 0.75rem' }}>
                  <input type="color" value={formBanner.color_texto} onChange={e => setFormBanner({...formBanner, color_texto: e.target.value})} className="w-6 h-6 rounded border-0 bg-transparent" />
                  <span className="text-xs" style={{ color: 'oklch(0.45 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>{formBanner.color_texto}</span>
                </div>
              </F>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <F label="Texto del botón"><Input value={formBanner.boton_texto} onChange={e => setFormBanner({...formBanner, boton_texto: e.target.value})} placeholder="Ver ofertas" style={inputStyle} /></F>
              <F label="Orden"><Input type="number" value={formBanner.orden} onChange={e => setFormBanner({...formBanner, orden: e.target.value})} placeholder="0" style={inputStyle} /></F>
            </div>
            <F label="URL del botón"><Input value={formBanner.boton_url} onChange={e => setFormBanner({...formBanner, boton_url: e.target.value})} placeholder="/ofertas" style={inputStyle} /></F>
            <Button onClick={guardarBanner} disabled={loadBanner} className="gap-2 border-0" style={{ backgroundColor: RED, color: 'oklch(0.97 0.012 82)', fontFamily: 'var(--font-dm-sans)' }}>
              {(loadBanner || uploadingBanner) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {uploadingBanner ? 'Subiendo imagen…' : loadBanner ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
