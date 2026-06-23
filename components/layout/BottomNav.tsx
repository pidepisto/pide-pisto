'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingBag, Tag, Heart, User, Search } from 'lucide-react'

const TABS = [
  { href: '/catalogo',  icon: ShoppingBag, label: 'Catálogo' },
  { href: '/ofertas',   icon: Tag,         label: 'Ofertas'  },
  { href: '/favoritos', icon: Heart,       label: 'Favoritos'},
  { href: '/cuenta',    icon: User,        label: 'Cuenta'   },
]

const RED = 'oklch(0.50 0.22 24)'
const DIM = 'oklch(0.60 0.02 40)'

export default function BottomNav() {
  const onBuscar = () => window.dispatchEvent(new Event('pp-abrir-busqueda'))
  const pathname = usePathname()

  // No mostrar en rutas de admin, auth, checkout, detalle de pedido ni legales
  const ocultar = ['/admin', '/login', '/registro', '/checkout', '/carrito', '/terminos', '/privacidad'].some(r => pathname.startsWith(r))
    || /^\/pedidos\/.+/.test(pathname)
  if (ocultar) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
      style={{
        background: 'linear-gradient(to top, oklch(0.97 0.012 82) 85%, transparent)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div
        className="mx-3 mb-3 flex items-center rounded-2xl shadow-xl"
        style={{
          backgroundColor: 'oklch(1 0 0)',
          border: '1px solid oklch(0.90 0.02 75)',
          boxShadow: '0 8px 32px oklch(0 0 0 / 0.12)',
        }}
      >
        {TABS.map(({ href, icon: Icon, label }) => {
          const activo = pathname === href || (href === '/catalogo' && pathname === '/')
          return (
            <Link key={href} href={href} className="flex-1">
              <div className="flex flex-col items-center gap-0.5 py-3 px-1 transition-all">
                <Icon
                  className="h-[22px] w-[22px]"
                  style={{
                    color: activo ? RED : DIM,
                    fill: activo && label !== 'Catálogo' ? `${RED}20` : 'none',
                    strokeWidth: activo ? 2.2 : 1.7,
                  }}
                />
                <span
                  className="text-[10px] font-semibold"
                  style={{
                    color: activo ? RED : DIM,
                    fontFamily: 'var(--font-dm-sans)',
                  }}
                >
                  {label}
                </span>
                {activo && (
                  <div className="w-1 h-1 rounded-full" style={{ backgroundColor: RED }} />
                )}
              </div>
            </Link>
          )
        })}

        {/* Divisor */}
        <div className="w-px h-8 flex-shrink-0" style={{ backgroundColor: 'oklch(0.90 0.02 75)' }} />

        {/* Búsqueda */}
        <button
          onClick={onBuscar}
          className="flex-shrink-0 px-4 py-3 flex flex-col items-center gap-0.5 transition-all"
        >
          <Search className="h-[22px] w-[22px]" style={{ color: DIM, strokeWidth: 1.7 }} />
          <span className="text-[10px] font-semibold" style={{ color: DIM, fontFamily: 'var(--font-dm-sans)' }}>Buscar</span>
        </button>
      </div>
    </div>
  )
}
