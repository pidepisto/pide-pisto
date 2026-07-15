'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import {
  Package, HeadphonesIcon, CreditCard, Gift, Star, MapPin,
  Bell, FileText, Shield, ChevronRight, LogOut, LayoutDashboard, Pencil, Coins
} from 'lucide-react'
import type { Perfil } from '@/lib/types'
import { fp } from '@/lib/utils'

const RED  = 'oklch(0.50 0.22 24)'
const YEL  = 'oklch(0.76 0.14 80)'
const BG   = 'oklch(0.97 0.012 82)'
const CARD: React.CSSProperties = { backgroundColor: 'oklch(1 0 0)', border: '1px solid oklch(0.90 0.02 75)', borderRadius: '1rem' }
const TXT: React.CSSProperties  = { color: 'oklch(0.2 0.03 30)',  fontFamily: 'var(--font-dm-sans)' }
const DIM: React.CSSProperties  = { color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }

type Seccion = {
  titulo?: string
  items: {
    icon: any; label: string; href?: string
    target?: string; valor?: string; color?: string; onClick?: () => void
  }[]
}

const estadoLabel: Record<string, string> = {
  pendiente: 'Pendiente', confirmado: 'Confirmado', en_camino: 'En camino',
  entregado: 'Entregado', cancelado: 'Cancelado',
}
const estadoColor: Record<string, string> = {
  pendiente: YEL, confirmado: RED, en_camino: 'oklch(0.45 0.15 145)',
  entregado: 'oklch(0.45 0.15 145)', cancelado: 'oklch(0.55 0.02 40)',
}

export default function CuentaPage() {
  const supabase = createClient()
  const router   = useRouter()
  const [perfil,  setPerfil]  = useState<Perfil | null>(null)
  const [pedidos, setPedidos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const [{ data: p }, { data: ped }] = await Promise.all([
        supabase.from('perfiles').select('*').eq('id', user.id).single(),
        supabase.from('pedidos').select('id, estado, total, created_at').eq('usuario_id', user.id).order('created_at', { ascending: false }).limit(3),
      ])
      setPerfil(p)
      setPedidos(ped ?? [])
      setLoading(false)
    }
    cargar()
  }, [])

  const cerrar = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const SECCIONES: Seccion[] = [
    {
      titulo: 'Beneficios',
      items: [
        { icon: Coins,  label: 'Créditos', href: '/cuenta/cupones',  valor: '$0.00' },
        { icon: Gift,   label: 'Cupones',  href: '/cuenta/cupones'   },
        { icon: Star,   label: 'Loyalty',  href: '/cuenta/loyalty'   },
      ],
    },
    {
      titulo: 'Mi cuenta',
      items: [
        { icon: Package,        label: 'Mis pedidos',     href: '/pedidos'              },
        { icon: MapPin,         label: 'Direcciones',     href: '/cuenta/direcciones'   },
        { icon: CreditCard,     label: 'Métodos de pago', href: '/cuenta/metodos-pago'  },
        { icon: Bell,           label: 'Notificaciones',  href: '/cuenta/notificaciones'},
        { icon: HeadphonesIcon, label: 'Ayuda',           href: `https://wa.me/521XXXXXXXXXX?text=Hola%2C%20necesito%20ayuda`, target: '_blank' },
        ...(perfil?.es_admin ? [{ icon: LayoutDashboard, label: 'Panel admin', href: '/admin', color: RED }] : []),
      ],
    },
    {
      titulo: 'Más información',
      items: [
        { icon: FileText, label: 'Términos y Condiciones', href: '/terminos'   },
        { icon: Shield,   label: 'Política de Privacidad', href: '/privacidad' },
      ],
    },
  ]

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]" style={{ backgroundColor: BG }}>
      <p className="text-sm" style={DIM}>Cargando…</p>
    </div>
  )

  /* ── Sin sesión ── */
  if (!perfil) return (
    <div>
      <div className="px-4 pt-5 pb-4 border-b md:hidden" style={{ borderColor: 'oklch(0.88 0.03 70)' }}>
        <h1 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.8rem', letterSpacing: '0.05em', color: 'oklch(0.2 0.03 30)' }}>Cuenta</h1>
      </div>
      <div className="flex flex-col items-center py-20 px-8 gap-5 max-w-sm mx-auto">
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'oklch(0.92 0.02 82)' }}>
          <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.5rem', color: 'oklch(0.70 0.02 40)' }}>?</span>
        </div>
        <div className="text-center">
          <p style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.5rem', letterSpacing: '0.04em', color: 'oklch(0.2 0.03 30)' }}>Inicia sesión</p>
          <p className="text-sm mt-1" style={DIM}>Para ver tus pedidos y beneficios</p>
        </div>
        <Link href="/login" className="w-full">
          <button className="w-full py-3.5 rounded-2xl text-sm font-semibold" style={{ backgroundColor: RED, color: 'oklch(0.97 0.012 82)', fontFamily: 'var(--font-dm-sans)' }}>
            Entrar
          </button>
        </Link>
        <Link href="/registro" className="w-full">
          <button className="w-full py-3.5 rounded-2xl text-sm font-semibold border" style={{ backgroundColor: 'transparent', color: RED, borderColor: RED, fontFamily: 'var(--font-dm-sans)' }}>
            Crear cuenta
          </button>
        </Link>
      </div>
    </div>
  )

  /* ── Sesión activa ── */
  return (
    <div className="pb-32 md:pb-4">

      {/* ── Título solo en móvil ── */}
      <h1 className="md:hidden px-4 pt-5 mb-4"
        style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.8rem', letterSpacing: '0.05em', color: 'oklch(0.2 0.03 30)' }}>
        Cuenta
      </h1>

      {/* ── MÓVIL SOLO: tarjeta de perfil + accesos rápidos ── */}
      <div className="md:hidden px-4 flex flex-col gap-4 mb-5">

        {/* Tarjeta de perfil */}
        <div className="rounded-2xl p-5 flex flex-col items-center gap-3 text-center" style={CARD}>
          <div className="relative w-20 h-20 rounded-full overflow-hidden flex-shrink-0" style={{ border: `3px solid ${RED}` }}>
            {perfil.avatar_url ? (
              <Image src={perfil.avatar_url} alt={perfil.nombre ?? 'Avatar'} fill className="object-cover" sizes="80px" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'oklch(0.50 0.22 24 / 0.12)' }}>
                <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.8rem', color: RED }}>
                  {(perfil.nombre ?? 'U').charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div>
            <p className="text-base font-bold" style={TXT}>{perfil.nombre ?? 'Mi cuenta'}</p>
            {perfil.es_admin && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${RED}15`, color: RED, fontFamily: 'var(--font-dm-sans)' }}>
                Admin
              </span>
            )}
          </div>
          <Link href="/cuenta/editar" className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-colors hover:bg-black/5" style={{ color: RED, fontFamily: 'var(--font-dm-sans)', border: `1px solid ${RED}30` }}>
            <Pencil className="h-3.5 w-3.5" /> Editar perfil
          </Link>
        </div>

        {/* Accesos rápidos */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Package,        label: 'Pedidos', href: '/pedidos'             },
            { icon: HeadphonesIcon, label: 'Ayuda',   href: `https://wa.me/521XXXXXXXXXX`, target: '_blank' },
            { icon: CreditCard,     label: 'Pagos',   href: '/cuenta/metodos-pago' },
          ].map(({ icon: Icon, label, href, target }) => (
            <Link key={label} href={href} target={target as any}>
              <div className="rounded-xl p-3 flex flex-col items-center gap-1.5 transition-all hover:bg-black/5 active:scale-95 cursor-pointer" style={CARD}>
                <Icon className="h-5 w-5" style={{ color: RED, strokeWidth: 1.6 }} />
                <span className="text-[11px] font-semibold text-center leading-tight" style={TXT}>{label}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Cerrar sesión móvil */}
        <button onClick={cerrar}
          className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm"
          style={{ backgroundColor: 'oklch(0.92 0.02 82)', color: 'oklch(0.2 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>
          <LogOut className="h-4 w-4" /> Cerrar sesión
        </button>
      </div>

      {/* ── CONTENIDO (visible en móvil y desktop) ── */}
      <div className="px-4 md:px-0 flex flex-col gap-5">

        {/* Últimos pedidos */}
        {pedidos.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-base font-bold" style={TXT}>Últimos pedidos</p>
              <Link href="/pedidos">
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ backgroundColor: 'oklch(0.92 0.02 82)', color: 'oklch(0.35 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>
                  Ver todos
                </span>
              </Link>
            </div>
            <div className="rounded-2xl overflow-hidden" style={CARD}>
              {pedidos.map((p, i) => (
                <div key={p.id}>
                  {i > 0 && <div className="h-px mx-4" style={{ backgroundColor: 'oklch(0.93 0.015 75)' }} />}
                  <Link href={`/pedidos/${p.id}`}>
                    <div className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-black/3 active:bg-black/5">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${estadoColor[p.estado]}15` }}>
                        <Package className="h-5 w-5" style={{ color: estadoColor[p.estado], strokeWidth: 1.6 }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={TXT}>#{p.id.slice(-6).toUpperCase()}</p>
                        <p className="text-xs font-medium" style={{ color: estadoColor[p.estado], fontFamily: 'var(--font-dm-sans)' }}>
                          {estadoLabel[p.estado]}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p style={{ color: RED, fontFamily: 'var(--font-bebas)', fontSize: '1rem', letterSpacing: '0.02em' }}>{fp(p.total)}</p>
                        <p className="text-xs" style={DIM}>{new Date(p.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: 'oklch(0.70 0.02 40)' }} />
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Secciones */}
        {SECCIONES.map((sec) => (
          <div key={sec.titulo}>
            {sec.titulo && <p className="text-base font-bold mb-3" style={TXT}>{sec.titulo}</p>}
            <div className="rounded-2xl overflow-hidden" style={CARD}>
              {sec.items.map((item, i) => {
                const color = item.color ?? 'oklch(0.2 0.03 30)'
                const content = (
                  <div className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-black/3 active:bg-black/5">
                    <item.icon className="h-[18px] w-[18px] flex-shrink-0" style={{ color, strokeWidth: 1.7 }} />
                    <span className="flex-1 text-sm font-medium" style={{ ...TXT, color }}>{item.label}</span>
                    {item.valor
                      ? <span className="text-sm font-semibold" style={{ color: 'oklch(0.40 0.03 30)', fontFamily: 'var(--font-dm-sans)' }}>{item.valor}</span>
                      : <ChevronRight className="h-4 w-4" style={{ color: 'oklch(0.70 0.02 40)' }} />
                    }
                  </div>
                )
                return (
                  <div key={item.label}>
                    {i > 0 && <div className="h-px mx-4" style={{ backgroundColor: 'oklch(0.93 0.015 75)' }} />}
                    {item.href
                      ? <Link href={item.href} target={item.target}>{content}</Link>
                      : <button className="w-full text-left" onClick={item.onClick}>{content}</button>}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        <div className="text-center pb-2">
          <p className="text-xs" style={DIM}>Pide Pisto · Chalco e Ixtapaluca, MX</p>
          <p className="text-xs mt-0.5" style={{ color: 'oklch(0.65 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>Hecho con amor en México</p>
        </div>
      </div>
    </div>
  )
}
