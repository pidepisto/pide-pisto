'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, User, Phone, Lock, Eye, EyeOff, Check, Camera, Mail, Calendar, Users } from 'lucide-react'
import { toast } from 'sonner'
import type { Perfil } from '@/lib/types'

const RED  = 'oklch(0.50 0.22 24)'
const BG   = 'oklch(0.97 0.012 82)'
const CARD: React.CSSProperties = { backgroundColor: 'oklch(1 0 0)', border: '1px solid oklch(0.90 0.02 75)', borderRadius: '1rem' }
const TXT: React.CSSProperties  = { color: 'oklch(0.2 0.03 30)', fontFamily: 'var(--font-dm-sans)' }
const DIM: React.CSSProperties  = { color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: '0.75rem',
  border: '1px solid oklch(0.88 0.03 70)',
  backgroundColor: 'oklch(0.97 0.012 82)',
  color: 'oklch(0.2 0.03 30)',
  fontFamily: 'var(--font-dm-sans)',
  fontSize: '0.9375rem',
  outline: 'none',
}

function Campo({ label, icon: Icon, children }: { label: string; icon: any; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2" style={DIM}>
        <Icon className="h-3.5 w-3.5" />
        {label}
      </label>
      {children}
    </div>
  )
}

type Genero = 'masculino' | 'femenino' | 'no_binario' | 'por_definir'

const GENEROS: { value: Genero; label: string }[] = [
  { value: 'masculino',  label: 'Masculino'   },
  { value: 'femenino',   label: 'Femenino'    },
  { value: 'no_binario', label: 'No binario'  },
  { value: 'por_definir',label: 'Por definir' },
]

export default function EditarPerfilPage() {
  const supabase  = createClient()
  const router    = useRouter()
  const fileRef   = useRef<HTMLInputElement>(null)

  const [perfil,       setPerfil]       = useState<Perfil | null>(null)
  const [email,        setEmailState]   = useState('')
  const [nombre,       setNombre]       = useState('')
  const [telefono,     setTelefono]     = useState('')
  const [fechaNac,     setFechaNac]     = useState('')
  const [genero,       setGenero]       = useState<Genero>('por_definir')
  const [avatarUrl,    setAvatarUrl]    = useState<string | null>(null)
  const [avatarPreview,setAvatarPreview]= useState<string | null>(null)
  const [avatarFile,   setAvatarFile]   = useState<File | null>(null)
  const [guardando,    setGuardando]    = useState(false)
  const [showPwd,      setShowPwd]      = useState(false)
  const [pwdActual,    setPwdActual]    = useState('')
  const [pwdNuevo,     setPwdNuevo]     = useState('')
  const [pwdConfirm,   setPwdConfirm]   = useState('')
  const [cambiandoPwd, setCambiandoPwd] = useState(false)

  useEffect(() => {
    const cargar = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setEmailState(user.email ?? '')
      const { data } = await supabase.from('perfiles').select('*').eq('id', user.id).single()
      if (data) {
        setPerfil(data)
        setNombre(data.nombre ?? '')
        setTelefono(data.telefono ?? '')
        setFechaNac(data.fecha_nacimiento ?? '')
        setGenero(data.genero ?? 'por_definir')
        setAvatarUrl(data.avatar_url ?? null)
      }
    }
    cargar()
  }, [])

  const onAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Imagen máx. 2 MB'); return }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const guardarPerfil = async () => {
    if (!perfil) return
    if (!nombre.trim()) { toast.error('El nombre es obligatorio'); return }
    if (telefono && telefono.length !== 10) { toast.error('El teléfono debe tener 10 dígitos'); return }

    setGuardando(true)
    try {
      let nuevoAvatarUrl = avatarUrl

      if (avatarFile) {
        const ext  = avatarFile.name.split('.').pop()
        const path = `${perfil.id}/avatar.${ext}`
        const { error: upErr } = await supabase.storage
          .from('avatars')
          .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type })
        if (upErr) throw upErr
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
        nuevoAvatarUrl = `${publicUrl}?t=${Date.now()}`
      }

      const { error } = await supabase.from('perfiles').update({
        nombre:           nombre.trim(),
        telefono:         telefono.trim() || null,
        fecha_nacimiento: fechaNac || null,
        genero,
        avatar_url:       nuevoAvatarUrl,
      }).eq('id', perfil.id)

      if (error) throw error
      toast.success('Perfil actualizado')
      router.push('/cuenta')
    } catch {
      toast.error('Error al guardar el perfil')
    } finally {
      setGuardando(false)
    }
  }

  const cambiarPassword = async () => {
    if (pwdNuevo.length < 8)       { toast.error('Mínimo 8 caracteres'); return }
    if (pwdNuevo !== pwdConfirm)   { toast.error('Las contraseñas no coinciden'); return }

    setCambiandoPwd(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) { toast.error('Error de sesión'); setCambiandoPwd(false); return }

    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: user.email, password: pwdActual })
    if (signInErr) { toast.error('Contraseña actual incorrecta'); setCambiandoPwd(false); return }

    const { error } = await supabase.auth.updateUser({ password: pwdNuevo })
    setCambiandoPwd(false)
    if (error) { toast.error('Error al cambiar contraseña'); return }

    toast.success('Contraseña actualizada')
    setPwdActual(''); setPwdNuevo(''); setPwdConfirm('')
  }

  const imgSrc = avatarPreview ?? avatarUrl

  if (!perfil) return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: BG }}>
      <p className="text-sm" style={DIM}>Cargando…</p>
    </div>
  )

  return (
    <div style={{ backgroundColor: BG, minHeight: '100vh' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-4">
        <Link href="/cuenta">
          <button className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ border: '1px solid oklch(0.88 0.03 70)', backgroundColor: 'oklch(1 0 0)' }}>
            <ChevronLeft className="h-4 w-4" style={{ color: 'oklch(0.35 0.03 30)' }} />
          </button>
        </Link>
        <h1 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.8rem', letterSpacing: '0.05em', color: 'oklch(0.2 0.03 30)' }}>
          Editar perfil
        </h1>
      </div>

      <div className="px-4 flex flex-col gap-5 pb-32 max-w-lg mx-auto">

        {/* ── AVATAR ── */}
        <div className="flex flex-col items-center gap-2 py-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="relative w-24 h-24 rounded-full overflow-hidden transition-all active:scale-95 group"
            style={{ border: `3px solid ${RED}` }}
          >
            {imgSrc ? (
              <Image src={imgSrc} alt="Avatar" fill className="object-cover" sizes="96px" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"
                style={{ backgroundColor: 'oklch(0.50 0.22 24 / 0.12)' }}>
                <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '2.2rem', color: RED }}>
                  {(nombre || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            {/* overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity"
              style={{ backgroundColor: 'oklch(0 0 0 / 0.40)' }}>
              <Camera className="h-6 w-6 text-white" />
            </div>
          </button>
          <button onClick={() => fileRef.current?.click()} className="text-xs font-semibold" style={{ color: RED, fontFamily: 'var(--font-dm-sans)' }}>
            Cambiar foto
          </button>
          <p className="text-[11px]" style={DIM}>JPG o PNG, máx. 2 MB</p>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onAvatarChange} />
        </div>

        {/* ── DATOS PERSONALES ── */}
        <div className="rounded-2xl p-5 flex flex-col gap-4" style={CARD}>
          <p className="text-sm font-bold" style={TXT}>Datos personales</p>

          <Campo label="Nombre completo" icon={User}>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre completo"
              style={inputStyle}
              maxLength={80}
            />
          </Campo>

          <Campo label="Correo electrónico" icon={Mail}>
            <div className="relative">
              <input
                type="email"
                value={email}
                readOnly
                style={{ ...inputStyle, backgroundColor: 'oklch(0.93 0.015 75)', color: 'oklch(0.55 0.02 40)', cursor: 'default' }}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'oklch(0.88 0.03 70)', color: 'oklch(0.50 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
                No editable
              </span>
            </div>
          </Campo>

          <Campo label="Teléfono" icon={Phone}>
            <input
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10 dígitos (opcional)"
              style={inputStyle}
            />
            {telefono && telefono.length > 0 && telefono.length !== 10 && (
              <p className="text-xs mt-1" style={{ color: 'oklch(0.55 0.15 30)', fontFamily: 'var(--font-dm-sans)' }}>
                Ingresa los 10 dígitos
              </p>
            )}
          </Campo>

          <Campo label="Fecha de nacimiento" icon={Calendar}>
            <input
              type="date"
              value={fechaNac}
              onChange={(e) => setFechaNac(e.target.value)}
              max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              style={inputStyle}
            />
            <p className="text-[11px] mt-1" style={DIM}>Debes tener 18 años o más para usar la app</p>
          </Campo>

          <Campo label="Género" icon={Users}>
            <select
              value={genero}
              onChange={(e) => setGenero(e.target.value as Genero)}
              style={{ ...inputStyle, appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', paddingRight: '2.5rem' }}
            >
              {GENEROS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Campo>

          <button
            onClick={guardarPerfil}
            disabled={guardando}
            className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
            style={{ backgroundColor: RED, color: 'oklch(0.97 0.012 82)', fontFamily: 'var(--font-dm-sans)' }}
          >
            {guardando ? 'Guardando…' : <><Check className="h-4 w-4" /> Guardar cambios</>}
          </button>
        </div>

        {/* ── CAMBIAR CONTRASEÑA ── */}
        <div className="rounded-2xl p-5 flex flex-col gap-4" style={CARD}>
          <p className="text-sm font-bold" style={TXT}>Cambiar contraseña</p>

          {(['Contraseña actual', 'Nueva contraseña', 'Confirmar contraseña'] as const).map((label, i) => {
            const vals   = [pwdActual, pwdNuevo, pwdConfirm]
            const setters= [setPwdActual, setPwdNuevo, setPwdConfirm]
            const placeholders = ['••••••••', 'Mínimo 8 caracteres', 'Repite la nueva contraseña']
            return (
              <div key={label}>
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2" style={DIM}>
                  <Lock className="h-3.5 w-3.5" />
                  {label}
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={vals[i]}
                    onChange={(e) => setters[i](e.target.value)}
                    placeholder={placeholders[i]}
                    style={{ ...inputStyle, paddingRight: i === 0 ? '2.75rem' : undefined }}
                  />
                  {i === 0 && (
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'oklch(0.60 0.02 40)' }}>
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  )}
                </div>
                {i === 2 && pwdNuevo && pwdConfirm && pwdNuevo !== pwdConfirm && (
                  <p className="text-xs mt-1" style={{ color: RED, fontFamily: 'var(--font-dm-sans)' }}>Las contraseñas no coinciden</p>
                )}
              </div>
            )
          })}

          <button
            onClick={cambiarPassword}
            disabled={cambiandoPwd || !pwdActual || !pwdNuevo || !pwdConfirm}
            className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40"
            style={{ backgroundColor: 'oklch(0.92 0.02 82)', color: 'oklch(0.2 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}
          >
            {cambiandoPwd ? 'Actualizando…' : <><Lock className="h-4 w-4" /> Actualizar contraseña</>}
          </button>
        </div>

      </div>
    </div>
  )
}
