'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Package, HeadphonesIcon, CreditCard, Gift, Star,
  MapPin, Bell, LogOut, LayoutDashboard, Pencil, ChevronLeft,
} from 'lucide-react'
import type { Perfil } from '@/lib/types'

const RED  = 'oklch(0.50 0.22 24)'
const CARD: React.CSSProperties = { backgroundColor: 'oklch(1 0 0)', border: '1px solid oklch(0.90 0.02 75)', borderRadius: '1rem' }
const TXT: React.CSSProperties  = { color: 'oklch(0.2 0.03 30)',  fontFamily: 'var(--font-dm-sans)' }
const DIM: React.CSSProperties  = { color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }

const BASE_NAV = [
  { icon: Package,        label: 'Mis pedidos',     href: '/pedidos'               },
  { icon: MapPin,         label: 'Direcciones',      href: '/cuenta/direcciones'    },
  { icon: CreditCard,     label: 'Métodos de pago',  href: '/cuenta/metodos-pago'   },
  { icon: Bell,           label: 'Notificaciones',   href: '/cuenta/notificaciones' },
  { icon: Gift,           label: 'Cupones',          href: '/cuenta/cupones'        },
  { icon: Star,           label: 'Loyalty',          href: '/cuenta/loyalty'        },
]

export default function CuentaSidebar() {
  const supabase = createClient()
  const router   = useRouter()
  const pathname = usePathname()
  const [perfil, setPerfil] = useState<Perfil | null>(null)

  useEffect(() => {
    const cargar = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('perfiles').select('*').eq('id', user.id).single()
      if (data) setPerfil(data)
    }
    cargar()
  }, [])

  const cerrar = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!perfil) return null

  const nav = [
    ...BASE_NAV,
    ...(perfil.es_admin ? [{ icon: LayoutDashboard, label: 'Panel admin', href: '/admin' }] : []),
  ]

  const enSubpage = pathname !== '/cuenta'

  return (
    <div className="flex flex-col gap-4">

      {/* Flecha de regreso — solo en subpages */}
      {enSubpage && (
        <Link href="/cuenta" className="flex items-center gap-2 text-sm font-semibold w-fit transition-colors hover:opacity-70"
          style={{ color: 'oklch(0.35 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>
          <ChevronLeft className="h-4 w-4" />
          Mi cuenta
        </Link>
      )}

      {/* Tarjeta de perfil */}
      <div className="rounded-2xl p-5 flex flex-col items-center gap-3 text-center" style={CARD}>
        <div className="relative w-20 h-20 rounded-full overflow-hidden flex-shrink-0"
          style={{ border: `3px solid ${RED}` }}>
          {perfil.avatar_url ? (
            <Image src={perfil.avatar_url} alt={perfil.nombre ?? 'Avatar'} fill className="object-cover" sizes="80px" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"
              style={{ backgroundColor: 'oklch(0.50 0.22 24 / 0.12)' }}>
              <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.8rem', color: RED }}>
                {(perfil.nombre ?? 'U').charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <div>
          <p className="text-base font-bold" style={TXT}>{perfil.nombre ?? 'Mi cuenta'}</p>
          {perfil.es_admin && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${RED}15`, color: RED, fontFamily: 'var(--font-dm-sans)' }}>
              Admin
            </span>
          )}
        </div>
        <Link href="/cuenta/editar"
          className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-colors hover:bg-black/5"
          style={{ color: RED, fontFamily: 'var(--font-dm-sans)', border: `1px solid ${RED}30` }}>
          <Pencil className="h-3.5 w-3.5" /> Editar perfil
        </Link>
      </div>

      {/* Nav links */}
      <div className="rounded-2xl overflow-hidden" style={CARD}>
        {nav.map(({ icon: Icon, label, href }, i) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <div key={href}>
              {i > 0 && <div className="h-px mx-4" style={{ backgroundColor: 'oklch(0.93 0.015 75)' }} />}
              <Link href={href}>
                <div className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-black/3"
                  style={{ backgroundColor: active ? `${RED}08` : 'transparent' }}>
                  <Icon className="h-4 w-4 flex-shrink-0" strokeWidth={1.7}
                    style={{ color: active ? RED : 'oklch(0.55 0.02 40)' }} />
                  <span className="text-sm" style={{ ...TXT, color: active ? RED : 'oklch(0.2 0.03 30)', fontWeight: active ? 600 : 500 }}>
                    {label}
                  </span>
                </div>
              </Link>
            </div>
          )
        })}
      </div>

      {/* Cerrar sesión */}
      <button
        onClick={cerrar}
        className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm transition-all hover:bg-black/5"
        style={{ backgroundColor: 'oklch(0.92 0.02 82)', color: 'oklch(0.2 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}
      >
        <LogOut className="h-4 w-4" /> Cerrar sesión
      </button>
    </div>
  )
}
