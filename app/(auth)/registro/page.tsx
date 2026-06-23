'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, UserPlus, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function RegistroPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({ nombre: '', email: '', password: '', telefono: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: form.email.trim().toLowerCase(),
      password: form.password,
      options: {
        data: { nombre: form.nombre.trim() },
      },
    })
    if (error) {
      toast.error(error.message === 'User already registered' ? 'Este correo ya está registrado' : 'Error al crear la cuenta')
      setLoading(false)
      return
    }
    // Actualizar teléfono si lo ingresó
    if (form.telefono) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('perfiles').update({ telefono: form.telefono.trim() }).eq('id', user.id)
      }
    }
    toast.success('¡Cuenta creada! Revisa tu correo para confirmar.')
    router.push('/catalogo')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'oklch(0.97 0.012 82)' }}>

      {/* Panel izquierdo — rojo */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ backgroundColor: 'oklch(0.50 0.22 24)' }}
      >
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, oklch(0.55 0.18 145) 0%, transparent 50%)' }}
        />
        <Link href="/" className="relative z-10 flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" style={{ color: 'oklch(0.97 0.012 82 / 0.7)' }} />
          <span className="text-sm" style={{ color: 'oklch(0.97 0.012 82 / 0.7)', fontFamily: 'var(--font-dm-sans)' }}>
            Volver al inicio
          </span>
        </Link>
        <div className="relative z-10">
          {/* Accent verde */}
          <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-5"
            style={{ backgroundColor: 'oklch(0.55 0.18 145)', color: 'oklch(0.97 0.012 82)', fontFamily: 'var(--font-dm-sans)' }}>
            Registro gratis
          </div>
          <h1
            className="leading-none mb-4"
            style={{
              fontFamily: 'var(--font-bebas)',
              letterSpacing: '0.03em',
              fontSize: 'clamp(3rem, 6vw, 5rem)',
              color: 'oklch(0.97 0.012 82)',
            }}
          >
            Únete a<br />Pide Pisto
          </h1>
          <p style={{ color: 'oklch(0.97 0.012 82 / 0.65)', fontFamily: 'var(--font-dm-sans)', maxWidth: '28ch' }}>
            Crea tu cuenta gratis y recibe tu primera orden en minutos.
          </p>

          {/* Beneficios con íconos */}
          <div className="flex flex-col gap-2 mt-8">
            {[
              { color: 'oklch(0.76 0.14 80)', text: 'Entrega en menos de 45 min' },
              { color: 'oklch(0.55 0.18 145)', text: 'Más de 100 productos' },
              { color: 'oklch(0.76 0.14 80)', text: 'Pago 100% seguro' },
            ].map((b) => (
              <div key={b.text} className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: b.color }} />
                <span className="text-sm" style={{ color: 'oklch(0.97 0.012 82 / 0.75)', fontFamily: 'var(--font-dm-sans)' }}>
                  {b.text}
                </span>
              </div>
            ))}
          </div>
        </div>
        <p className="relative z-10 text-xs" style={{ color: 'oklch(0.97 0.012 82 / 0.4)', fontFamily: 'var(--font-dm-sans)' }}>
          Solo para mayores de 18 años
        </p>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16">
        <div className="mx-auto w-full max-w-sm">

          <Link href="/" className="flex items-center gap-1.5 mb-8 lg:hidden">
            <ArrowLeft className="h-4 w-4" style={{ color: 'oklch(0.50 0.22 24)' }} />
            <span className="text-sm" style={{ color: 'oklch(0.50 0.22 24)', fontFamily: 'var(--font-dm-sans)' }}>Volver</span>
          </Link>

          <div className="mb-8">
            <h2
              className="leading-none mb-2"
              style={{
                fontFamily: 'var(--font-bebas)',
                letterSpacing: '0.04em',
                fontSize: '2.5rem',
                color: 'oklch(0.50 0.22 24)',
              }}
            >
              Crear cuenta
            </h2>
            <p className="text-sm" style={{ color: 'oklch(0.48 0.03 40)', fontFamily: 'var(--font-dm-sans)' }}>
              ¿Ya tienes cuenta?{' '}
              <Link href="/login"
                className="font-semibold underline underline-offset-2"
                style={{ color: 'oklch(0.50 0.22 24)' }}
              >
                Inicia sesión
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nombre" style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.875rem', color: 'oklch(0.35 0.03 30)' }}>
                Nombre completo
              </Label>
              <Input
                id="nombre"
                type="text"
                autoComplete="name"
                required
                placeholder="Juan Pérez"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.875rem', color: 'oklch(0.35 0.03 30)' }}>
                Correo electrónico
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                placeholder="tu@correo.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="telefono" style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.875rem', color: 'oklch(0.35 0.03 30)' }}>
                Teléfono <span style={{ color: 'oklch(0.55 0.02 40)' }}>(opcional)</span>
              </Label>
              <Input
                id="telefono"
                type="tel"
                autoComplete="tel"
                placeholder="55 1234 5678"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.875rem', color: 'oklch(0.35 0.03 30)' }}>
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  placeholder="Mínimo 8 caracteres"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="pr-10"
                  style={{ fontFamily: 'var(--font-dm-sans)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'oklch(0.55 0.02 40)' }}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <p className="text-xs leading-relaxed" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
              Al registrarte confirmas que tienes 18 años o más y aceptas nuestros términos de servicio.
            </p>

            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="mt-1 font-semibold gap-2 border-0"
              style={{
                backgroundColor: 'oklch(0.76 0.14 80)',
                color: 'oklch(0.2 0.03 30)',
                fontFamily: 'var(--font-dm-sans)',
              }}
            >
              {loading ? 'Creando cuenta...' : <><UserPlus className="h-4 w-4" /> Crear cuenta gratis</>}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
