import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { limiters, getIp } from '@/lib/ratelimit'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  const { success } = await limiters.admin.limit(getIp(req))
  if (!success) {
    return NextResponse.json({ error: 'Demasiados intentos. Espera un momento.' }, { status: 429 })
  }

  // Verificar sesión y que sea admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: perfil } = await supabase.from('perfiles').select('es_admin').eq('id', user.id).single()
  if (!perfil?.es_admin) return NextResponse.json({ error: 'Sin permisos de administrador' }, { status: 403 })

  try {
    const { email, password, nombre, telefono } = await req.json()
    if (!email || !password || !nombre) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message ?? 'Error al crear usuario' }, { status: 400 })
    }

    await supabaseAdmin.from('perfiles').update({
      nombre,
      telefono: telefono || null,
      rol: 'repartidor',
    }).eq('id', authData.user.id)

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Error interno' }, { status: 500 })
  }
}
