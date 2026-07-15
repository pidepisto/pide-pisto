import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

// Mapa: nombre de archivo (sin extensión) → nombre exacto del producto en DB
const MAPA: Record<string, string> = {
  'Tequila-José-Cuervo-Tradicional-Plata-Botella-950ml': 'Tequila José Cuervo Tradicional Plata',
  'Tequila-José-Cuervo-Reposado-900ml':                  'Tequila José Cuervo Reposado',
  'Tequila-José-Cuervo-Especial-Botella-695ml':          'Tequila José Cuervo Especial',
  'Tequila-Gran-Centenario-Azul-Reposado-Botella-950ml': 'Tequila Gran Centenario Azul Reposado',
  'Tequila-Hornitos-Reposado-Botella-700ml':             'Tequila Hornitos Reposado',
  'Tequila-Gran-Centenario-Ultra-Cristal-Botella-695ml': 'Tequila Gran Centenario Ultra Cristal',
  'Tequila-1800-Botella-700ml':                          '1800',
  'Vodka-Smirnoff-Tamarindo-Botella-750ml':              'Vodka Smirnoff Tamarindo',
  'Vodka-Smirnoff-Raspberry-Botella-750ml':              'Vodka Smirnoff Raspberry',
  'vodka-Absolut-Azul-Botella-750ml':                    'Vodka Absolut Azul',
  'vodka-Absolut-Mango-Botella-750ml':                   'Vodka Absolut Mango',
  'vodka-Absolut-Raspberri-Botella-750ml':               'Vodka Absolut Raspberri',
  'Jim-Beam':                                            'Jim Beam Bourbon',
  'Red-Label':                                           'Johnnie Walker Red Label',
  'Ballantines':                                         'Whisky Escocés Ballantines',
  'Black&White':                                         'Whisky Black & white',
  'Passport-Scotch':                                     'Whisky Passport',
  'J&B':                                                 'Whisky J&B',
  "William-Lawson's-700ml":                              'Whisky William Lawsons',
  'Ron-Appleton-Estate-Signature-750ml':                 'Ron Appleton Estate Signature',
  'Capitán-Morgan-700ml':                                'Ron Capitán Morgan Spiced Gold',
  'Matusalem':                                           'Ron Matusalem Clásico',
  'Malibu-750ml':                                        'Ron Malibu',
  'Bacardi-Raspberry-750ml':                             'Ron Bacardi Raspberry',
  'Bacardi-Mango-Chile-750ml':                           'Ron Bacardi Mango Chile',
  'Bacardi-700ml':                                       'Ron Bacardi blanco',
  'Bacardi-1750ml':                                      'Ron Bacardi blanco 1750ml',
  'Bacardi-375ml':                                       'Ron Bacardi blanco 375ml',
  'Bacardi-lata-355Ml':                                  'Bacardi lata 355ml',
  'Presidente-700ml':                                    'Brandy Presidente',
  'Torres-5':                                            'Brandy Torres 5',
  'Torres-10':                                           'Brandy Torres 10',
  'Torres-15':                                           'Brandy torres 15',
  'Modelo-lata-473ml':                                   'Modelo lata',
  'Tecate-lata-473ml':                                   'Tecate laton',
  'Corona-ligth-Lata-355ml':                             'Corona ligth',
  'Indio-Lata-473ml':                                    'Indio Laton',
  'Dos-Equis-Lata-473ml':                                'xx lager laton',
  'Heineken-0.0-Lata-355ml':                             'Heineken 0',
  'Sol-Clamato-Lata-473ml':                              'sol clamato',
  'New-Mix-Paloma-Lata-473ml':                           'New Mix Paloma lata',
  'New-Mix-Vampiro-Lata-473ml':                          'New Mix Vampiro lata',
  'Electroli-Ponche-de-Frutas':                          'Electrolit ponche de frutas',
  'Electrolit-Fresa':                                    'Electrolit fresa',
  'Electrolit-Fresa-Kiwi':                               'Electrolit Fresa Kiwi',
  'Electrolit-Manzana':                                  'Electrolit Manzana',
  'Electrolit-Uva':                                      'Suero x uva mora',
  'Electrolit-Mora-Azul':                                'Suero x mora azul',
  '7up-3LT':                                             '7 up',
  'Coca-Cola-3LT':                                       'Coca-cola',
  'Sprite-3LT':                                          'Sprite',
  'Manzanita-Sol—3LT':                                   'Manzanita sol',
  'Mundet-3LT':                                          'Mundet',
  'Squirt-3LT':                                          'squirt',
  'Peñafiel-Agua-Mineral-2LT':                           'Agua mineral',
  'Peñafiel-Naranjada-2LT':                              'Peñafiel de Naranjada',
  'Jumex-Arándano-960ml':                                'Jumex Arandano',
  'Ocean-Spray-Arándanos-1lt':                           'Ocean spray aranadano',
  'Bolsa-De-Hielos':                                     'Bolsa de hielo',
  'Boost-470ML':                                         'Boost',
  'Clamato':                                             'Clamato',
  'Encendedor':                                          'Encendedores',
  'Maruchan-Con-Camaron':                                'Maruchan',
  'Prudence':                                            'Condones prudence',
  'Vaso':                                                'Vaso rojo',
  'Cigarros-Malboro-Rojo-Cajetilla':                     'Malboro rojo',
  'Cigarros-Pall-Mall-Alaska-Cajetilla':                 'PALL ALASKA',
  'Cigarros-Pall-Mall-Mykonos-Cajetilla':                'PALL MALL ARUBA',
}

const BUCKET = 'productos'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  const { data: perfil } = await supabase.from('perfiles').select('es_admin').eq('id', user.id).single()
  if (!perfil?.es_admin) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Crear bucket si no existe
  await admin.storage.createBucket(BUCKET, { public: true })

  const formData = await req.formData()
  const archivos = formData.getAll('imagenes') as File[]

  if (!archivos.length) return NextResponse.json({ error: 'No se recibieron imágenes' }, { status: 400 })

  let subidas = 0, actualizadas = 0
  const sinMapeo: string[] = []
  const errores:  string[] = []

  for (const archivo of archivos) {
    const sinExt  = archivo.name.replace(/\.[^.]+$/, '')
    const producto = MAPA[sinExt]
    const bytes    = await archivo.arrayBuffer()
    const buffer   = Buffer.from(bytes)
    const mime     = archivo.type || 'image/png'
    const storePath = `catalogo/${archivo.name}`

    const { error: upErr } = await admin.storage
      .from(BUCKET)
      .upload(storePath, buffer, { contentType: mime, upsert: true })

    if (upErr) { errores.push(archivo.name); continue }
    subidas++

    if (!producto) { sinMapeo.push(archivo.name); continue }

    const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(storePath)

    const { error: dbErr } = await admin.from('productos')
      .update({ imagen_url: publicUrl })
      .eq('nombre', producto)

    if (dbErr) errores.push(archivo.name)
    else actualizadas++
  }

  return NextResponse.json({ ok: true, subidas, actualizadas, sin_mapeo: sinMapeo, errores })
}
