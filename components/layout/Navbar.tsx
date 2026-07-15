'use client'

import Link from 'next/link'
import { ShoppingCart, User, LogOut, LayoutDashboard, Package, Tag, Heart, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCarrito } from '@/lib/store/carrito'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useEffect, useState } from 'react'
import type { Perfil } from '@/lib/types'

export default function Navbar() {
  const totalItems  = useCarrito((s) => s.totalItems)
  const abrirDrawer = useCarrito((s) => s.abrirDrawer)
  const router = useRouter()
  const supabase = createClient()
  const [perfil, setPerfil] = useState<Perfil | null>(null)

  useEffect(() => {
    const cargarPerfil = async (userId: string) => {
      const { data } = await supabase.from('perfiles').select('*').eq('id', userId).single()
      if (data) setPerfil(data)
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) cargarPerfil(user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) cargarPerfil(session.user.id)
      else setPerfil(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const cerrarSesion = async () => {
    await supabase.auth.signOut()
    setPerfil(null)
    router.push('/')
    router.refresh()
  }

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        backgroundColor: 'oklch(0.50 0.22 24)',
        borderBottom: '1px solid oklch(1 0 0 / 0.12)',
      }}
    >
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center">
          <span
            className="text-2xl tracking-widest"
            style={{ fontFamily: 'var(--font-bebas)', color: 'oklch(0.97 0.012 82)', letterSpacing: '0.08em' }}
          >
            Pide Pisto
          </span>
        </Link>

        {/* Desktop nav links — hidden on mobile (BottomNav handles mobile) */}
        <div className="hidden md:flex items-center gap-1">
          {[
            { href: '/catalogo',  label: 'Catálogo' },
            { href: '/ofertas',   label: 'Ofertas'  },
            { href: '/favoritos', label: 'Favoritos'},
          ].map(({ href, label }) => (
            <Link key={href} href={href}>
              <Button
                variant="ghost"
                size="sm"
                className="font-medium hover:bg-white/10"
                style={{ color: 'oklch(0.97 0.012 82 / 0.85)', fontFamily: 'var(--font-dm-sans)' }}
              >
                {label}
              </Button>
            </Link>
          ))}
          <button
            onClick={() => window.dispatchEvent(new Event('pp-abrir-busqueda'))}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            style={{ color: 'oklch(0.97 0.012 82 / 0.85)' }}
          >
            <Search className="h-[18px] w-[18px]" />
          </button>
        </div>

        <div className="flex items-center gap-1">

          {/* En mobile abre el drawer; en desktop navega a /carrito */}
          <button
            onClick={abrirDrawer}
            className="md:hidden relative p-2 rounded-lg hover:bg-white/10 transition-colors"
            style={{ color: 'oklch(0.97 0.012 82 / 0.85)' }}
          >
            <ShoppingCart className="h-[18px] w-[18px]" />
            {totalItems() > 0 && (
              <Badge
                className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full p-0 flex items-center justify-center text-[10px] border-0"
                style={{ backgroundColor: 'oklch(0.76 0.14 80)', color: 'oklch(0.2 0.03 30)' }}
              >
                {totalItems()}
              </Badge>
            )}
          </button>
          <Link href="/carrito" className="hidden md:block relative">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-white/10"
              style={{ color: 'oklch(0.97 0.012 82 / 0.85)' }}
            >
              <ShoppingCart className="h-[18px] w-[18px]" />
              {totalItems() > 0 && (
                <Badge
                  className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full p-0 flex items-center justify-center text-[10px] border-0"
                  style={{ backgroundColor: 'oklch(0.76 0.14 80)', color: 'oklch(0.2 0.03 30)' }}
                >
                  {totalItems()}
                </Badge>
              )}
            </Button>
          </Link>

          {perfil ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-white/10"
                  style={{ color: 'oklch(0.97 0.012 82 / 0.85)' }}
                >
                  <User className="h-[18px] w-[18px]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="border-border">
                <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">{perfil.nombre ?? 'Mi cuenta'}</div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/cuenta" className="flex items-center gap-2">
                    <User className="h-4 w-4" /> Mi cuenta
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/pedidos" className="flex items-center gap-2">
                    <Package className="h-4 w-4" /> Mis pedidos
                  </Link>
                </DropdownMenuItem>
                {perfil.es_admin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/admin/pedidos" className="flex items-center gap-2">
                        <LayoutDashboard className="h-4 w-4" /> Panel admin
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={cerrarSesion}
                  className="text-destructive focus:text-destructive cursor-pointer flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" /> Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button
                size="sm"
                className="ml-1 font-semibold border-0"
                style={{
                  backgroundColor: 'oklch(0.97 0.012 82)',
                  color: 'oklch(0.50 0.22 24)',
                  fontFamily: 'var(--font-dm-sans)',
                }}
              >
                Entrar
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
