'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, ShoppingBag, Package, Users,
  DollarSign, BarChart2, Tag, Settings, Menu, X, LogOut
} from 'lucide-react'

const NAV = [
  { href: '/admin',              icon: LayoutDashboard, label: 'Dashboard'     },
  { href: '/admin/pedidos',      icon: ShoppingBag,     label: 'Pedidos'       },
  { href: '/admin/catalogo',     icon: Package,         label: 'Catálogo'      },
  { href: '/admin/repartidores', icon: Users,           label: 'Repartidores'  },
  { href: '/admin/finanzas',     icon: DollarSign,      label: 'Finanzas'      },
  { href: '/admin/analitica',    icon: BarChart2,       label: 'Analítica'     },
  { href: '/admin/cupones',      icon: Tag,             label: 'Cupones'       },
  { href: '/admin/configuracion',icon: Settings,        label: 'Configuración' },
]

// Colores del sidebar (oscuro cálido)
const S = {
  bg:       'oklch(0.20 0.05 25)',
  border:   'oklch(1 0 0 / 0.08)',
  active:   'oklch(0.50 0.22 24)',
  hover:    'oklch(1 0 0 / 0.07)',
  text:     'oklch(0.80 0.02 50)',
  textDim:  'oklch(0.55 0.03 40)',
  logo:     'oklch(0.97 0.012 82)',
  badge:    'oklch(0.76 0.14 80)',
  badgeFg:  'oklch(0.20 0.04 30)',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [nombre, setNombre] = useState('')
  const [rol,    setRol]    = useState('')
  const [open,   setOpen]   = useState(false)

  useEffect(() => {
    const verificar = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('perfiles').select('nombre, rol, es_admin').eq('id', user.id).single()
      if (!data || (!data.es_admin && !['super_admin','gerente','inventario'].includes(data.rol))) {
        router.push('/'); return
      }
      setNombre(data.nombre ?? 'Admin')
      setRol(data.rol ?? 'super_admin')
    }
    verificar()
  }, [])

  const cerrar = async () => { await supabase.auth.signOut(); router.push('/login') }

  const SidebarContent = () => (
    <aside className="flex flex-col h-full" style={{ backgroundColor: S.bg, width: 224, minWidth: 224 }}>
      {/* Logo */}
      <div className="px-5 py-5 border-b" style={{ borderColor: S.border }}>
        <Link href="/" className="flex flex-col gap-1">
          <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.5rem', letterSpacing: '0.07em', color: S.logo }}>
            Pide Pisto
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full self-start uppercase tracking-wider"
            style={{ backgroundColor: S.badge, color: S.badgeFg }}>
            Admin
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {NAV.map(({ href, icon: Icon, label }) => {
          const activo = pathname === href || (href !== '/admin' && pathname.startsWith(href))
          return (
            <Link key={href} href={href} onClick={() => setOpen(false)}>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                style={{
                  backgroundColor: activo ? S.active : 'transparent',
                  color: activo ? 'oklch(0.97 0.012 82)' : S.text,
                }}>
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.875rem', fontWeight: activo ? 600 : 400 }}>
                  {label}
                </span>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Usuario */}
      <div className="px-3 py-4 border-t" style={{ borderColor: S.border }}>
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: S.active }}>
            <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '1rem', color: 'oklch(0.97 0.012 82)' }}>
              {nombre.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: S.logo, fontFamily: 'var(--font-dm-sans)' }}>{nombre}</p>
            <p className="text-xs capitalize" style={{ color: S.textDim, fontFamily: 'var(--font-dm-sans)' }}>{rol.replace('_',' ')}</p>
          </div>
        </div>
        <button onClick={cerrar}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-colors text-sm"
          style={{ color: S.textDim, fontFamily: 'var(--font-dm-sans)' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = S.hover)}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
          <LogOut className="h-4 w-4" /> Cerrar sesión
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'oklch(0.95 0.015 75)' }}>
      {/* Desktop */}
      <div className="hidden md:flex flex-shrink-0"><SidebarContent /></div>

      {/* Mobile overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative z-10"><SidebarContent /></div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar mobile */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
          style={{ backgroundColor: S.bg, borderColor: S.border }}>
          <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.3rem', letterSpacing: '0.06em', color: S.logo }}>Pide Pisto</span>
          <button onClick={() => setOpen(true)} style={{ color: S.text }}><Menu className="h-5 w-5" /></button>
        </div>

        <main className="flex-1 overflow-y-auto" style={{ backgroundColor: 'oklch(0.95 0.015 75)' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
