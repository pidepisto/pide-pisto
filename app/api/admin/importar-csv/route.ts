import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const CATEGORIA_MAP: Record<string, string> = {
  'Tequila': 'Tequila', 'Tequilao': 'Tequila', '1800': 'Tequila',
  'Vodka': 'Vodka', 'Vodka ': 'Vodka',
  'Whisky': 'Whisky',
  'Ron': 'Ron', 'Ron ': 'Ron',
  'Brandy': 'Brandy',
  'Cerveza': 'Cerveza',
  'Refresco': 'Refresco',
  'Jugo': 'Jugo',
  'Suero': 'Suero',
  'Cigarros': 'Cigarros',
  'Hielo': 'Hielo',
  'Clamato': 'Clamato',
  'Boost': 'Energéticas',
  'Coca-cola Bacardi': 'Cocteles preparados',
  'Vaso rojo': 'Accesorios',
  'Sopa': 'Snacks',
  'Condones': 'Condones',
  'Encendedores': 'Accesorios',
  'Tequila+refresco de toronja+bolsa de hielos + 1 botana + 5 vasos': 'Combos',
  'vodka+sprite y  jugo+hielos+ 5 vasos + 3 paletas ': 'Combos',
  'Bacardi+coca+mineral+ hielos + 5 vaos + botana': 'Combos',
  'wisky+mineral+ginger+hielos+ 5 vasos+ botano': 'Combos',
  '12 cervezas+ 1 clamato+ 5 vaoss+2 sueros+ 2 maruchan ': 'Combos',
}

function limpiarPrecio(str: string | undefined): number | null {
  if (!str) return null
  const n = parseFloat(str.replace(/[$\s,]/g, ''))
  return isNaN(n) ? null : n
}

function slug(nombre: string) {
  return nombre.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export async function POST(req: NextRequest) {
  // Verificar admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  const { data: perfil } = await supabase.from('perfiles').select('es_admin').eq('id', user.id).single()
  if (!perfil?.es_admin) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const formData = await req.formData()
  const file = formData.get('csv') as File
  if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })

  const text = await file.text()
  const lineas = text.split('\n').map(l => l.split(','))

  // Saltar las primeras 5 filas (encabezados de ejemplo del template WooCommerce)
  const datos = lineas.slice(5).filter(cols => {
    const nombre = cols[3]?.trim()
    const precio = cols[20]?.trim()
    return nombre && nombre.length > 1 && precio && precio.replace(/[$\s]/g, '') !== ''
  })

  if (datos.length === 0) {
    return NextResponse.json({ error: 'No se encontraron productos en el CSV. Verifica el formato.' }, { status: 400 })
  }

  // Crear categorías
  const categoriasNombres = [...new Set(
    datos.map(c => CATEGORIA_MAP[c[1]?.trim()] ?? c[1]?.trim()).filter(Boolean)
  )]

  const catMap: Record<string, string> = {}
  for (let i = 0; i < categoriasNombres.length; i++) {
    const nombre = categoriasNombres[i]
    // Intentar insertar, ignorar si ya existe
    await admin.from('categorias').insert({ nombre, slug: slug(nombre), orden: i + 1 }).select()
    // Obtener id (ya sea nuevo o existente)
    const { data } = await admin.from('categorias').select('id').eq('nombre', nombre).single()
    if (data) catMap[nombre] = data.id
  }

  // Insertar productos
  let ok = 0, omitidos = 0
  const errores: string[] = []

  for (const cols of datos) {
    const categoriaRaw   = cols[1]?.trim() ?? ''
    const nombre         = cols[3]?.trim()
    const precioVenta    = limpiarPrecio(cols[20])
    const precioReg      = limpiarPrecio(cols[21])
    const categoriaNombre = CATEGORIA_MAP[categoriaRaw] ?? categoriaRaw
    const categoria_id   = catMap[categoriaNombre]

    if (!categoria_id || !nombre) { omitidos++; continue }

    const precio           = precioReg ?? precioVenta
    const precio_promocion = (precioReg && precioVenta && precioVenta < precioReg) ? precioVenta : null

    if (!precio) { omitidos++; continue }

    // Verificar si ya existe
    const { data: existe } = await admin.from('productos').select('id').eq('nombre', nombre).maybeSingle()
    if (existe) { omitidos++; continue }

    const { error } = await admin.from('productos').insert({
      nombre, descripcion: null, precio, precio_promocion,
      categoria_id, stock: 10, activo: true,
    })

    if (error) { errores.push(nombre); }
    else ok++
  }

  return NextResponse.json({
    ok: true,
    productos_importados: ok,
    omitidos,
    errores,
    categorias: Object.keys(catMap).length,
  })
}
