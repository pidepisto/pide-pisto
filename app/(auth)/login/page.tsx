'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, LogIn, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email.trim().toLowerCase(),
      password: form.password,
    })
    if (error) {
      toast.error('Correo o contraseña incorrectos')
      setLoading(false)
      return
    }
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
          style={{ backgroundImage: 'radial-gradient(circle at 30% 70%, oklch(0.76 0.14 80) 0%, transparent 50%)' }}
        />
        <Link href="/" className="relative z-10 flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" style={{ color: 'oklch(0.97 0.012 82 / 0.7)' }} />
          <span className="text-sm" style={{ color: 'oklch(0.97 0.012 82 / 0.7)', fontFamily: 'var(--font-dm-sans)' }}>
            Volver al inicio
          </span>
        </Link>
        <div className="relative z-10">
          {/* Accent amarillo */}
          <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-5"
            style={{ backgroundColor: 'oklch(0.76 0.14 80)', color: 'oklch(0.2 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>
            Chalco · Ixtapaluca
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
            Bienvenido<br />de vuelta
          </h1>
          <p style={{ color: 'oklch(0.97 0.012 82 / 0.65)', fontFamily: 'var(--font-dm-sans)', maxWidth: '28ch' }}>
            Tu bebida favorita a un pedido de distancia.
          </p>

          {/* Stats con acento verde */}
          <div className="flex gap-4 mt-8">
            {[
              { val: '45 min', label: 'Entrega' },
              { val: '100+', label: 'Productos' },
            ].map((s) => (
              <div key={s.label} className="glass-on-red rounded-xl px-4 py-3">
                <div style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.5rem', letterSpacing: '0.04em', color: 'oklch(0.76 0.14 80)' }}>
                  {s.val}
                </div>
                <div className="text-xs" style={{ color: 'oklch(0.97 0.012 82 / 0.6)', fontFamily: 'var(--font-dm-sans)' }}>
                  {s.label}
                </div>
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

          {/* Mobile: volver */}
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
              Iniciar sesión
            </h2>
            <p className="text-sm" style={{ color: 'oklch(0.48 0.03 40)', fontFamily: 'var(--font-dm-sans)' }}>
              ¿No tienes cuenta?{' '}
              <Link href="/registro"
                className="font-semibold underline underline-offset-2"
                style={{ color: 'oklch(0.50 0.22 24)' }}
              >
                Regístrate gratis
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
              <Label htmlFor="password" style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.875rem', color: 'oklch(0.35 0.03 30)' }}>
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
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
              {loading ? 'Entrando...' : <><LogIn className="h-4 w-4" /> Entrar</>}
            </Button>

            {/* Divisor con verde */}
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px" style={{ backgroundColor: 'oklch(0.85 0.03 70)' }} />
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'oklch(0.55 0.18 145 / 0.12)', color: 'oklch(0.45 0.15 145)', fontFamily: 'var(--font-dm-sans)' }}>
                Entrega en tu zona
              </span>
              <div className="flex-1 h-px" style={{ backgroundColor: 'oklch(0.85 0.03 70)' }} />
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
