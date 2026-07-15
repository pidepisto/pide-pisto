'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Bike, LogOut } from 'lucide-react'

const RED = 'oklch(0.50 0.22 24)'

export default function RepartidorLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const supabase = createClient()
  const [nombre, setNombre] = useState('')
  const [listo,  setListo]  = useState(false)

  useEffect(() => {
    const verificar = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: perfil } = await supabase.from('perfiles').select('nombre, rol, es_admin').eq('id', user.id).single()
      if (!perfil || (perfil.rol !== 'repartidor' && !perfil.es_admin)) {
        router.push('/')
        return
      }
      setNombre(perfil.nombre ?? 'Repartidor')
      setListo(true)
    }
    verificar()
  }, [])

  const cerrar = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!listo) return null

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'oklch(0.97 0.012 82)' }}>
      {/* Header */}
      <div className="sticky top-0 z-30 border-b px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: 'oklch(1 0 0)', borderColor: 'oklch(0.88 0.03 70)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${RED}15` }}>
            <Bike className="h-4 w-4" style={{ color: RED }} />
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.2rem', letterSpacing: '0.06em', color: 'oklch(0.2 0.03 30)', lineHeight: 1 }}>
              Pide Pisto
            </p>
            <p className="text-[10px] font-semibold" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
              {nombre}
            </p>
          </div>
        </div>
        <button onClick={cerrar} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
          style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)', border: '1px solid oklch(0.88 0.03 70)' }}>
          <LogOut className="h-3.5 w-3.5" /> Salir
        </button>
      </div>

      <main>{children}</main>
    </div>
  )
}
