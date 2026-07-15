/**
 * Subir imágenes de productos a Supabase Storage y actualizar imagen_url
 * Uso: node scripts/subir-imagenes.mjs "C:\ruta\a\carpeta\imagenes"
 *
 * Requiere en .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join, extname } from 'path'

// ── Config ──────────────────────────────────────────────────────────────────

const CARPETA = process.argv[2] ?? 'C:\\Users\\AMD PC\\Downloads\\Pide Pisto'
const BUCKET  = 'productos'  // nombre del bucket en Supabase Storage

// Cargar .env.local (maneja JWT partidos en varias líneas)
const envFile = join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local')
const envRaw  = readFileSync(envFile, 'utf8')
const envLines = []
for (const line of envRaw.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  if (trimmed.includes('=')) envLines.push(trimmed)
  else if (envLines.length > 0) envLines[envLines.length - 1] += trimmed
}
const envVars = envLines.reduce((acc, l) => {
  const [k, ...v] = l.split('=')
  acc[k.trim()] = v.join('=').trim()
  return acc
}, {})

const SUPABASE_URL     = envVars['NEXT_PUBLIC_SUPABASE_URL']
const SERVICE_ROLE_KEY = envVars['SUPABASE_SERVICE_ROLE_KEY']

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// ── Mapa imagen → nombre exacto del producto en la DB ───────────────────────
// Clave: nombre del archivo sin extensión
// Valor: nombre del producto tal como está en la tabla `productos`

const MAPA = {
  // Tequilas
  'Tequila-José-Cuervo-Tradicional-Plata-Botella-950ml':  'Tequila José Cuervo Tradicional Plata',
  'Tequila-José-Cuervo-Reposado-900ml':                   'Tequila José Cuervo Reposado',
  'Tequila-José-Cuervo-Especial-Botella-695ml':           'Tequila José Cuervo Especial',
  'Tequila-Gran-Centenario-Azul-Reposado-Botella-950ml':  'Tequila Gran Centenario Azul Reposado',
  'Tequila-Hornitos-Reposado-Botella-700ml':              'Tequila Hornitos Reposado',
  'Tequila-Gran-Centenario-Ultra-Cristal-Botella-695ml':  'Tequila Gran Centenario Ultra Cristal',
  'Tequila-1800-Botella-700ml':                           '1800',

  // Vodkas
  'Vodka-Smirnoff-Tamarindo-Botella-750ml': 'Vodka Smirnoff Tamarindo',
  'Vodka-Smirnoff-Raspberry-Botella-750ml': 'Vodka Smirnoff Raspberry',
  'vodka-Absolut-Azul-Botella-750ml':       'Vodka Absolut Azul',
  'vodka-Absolut-Mango-Botella-750ml':      'Vodka Absolut Mango',
  'vodka-Absolut-Raspberri-Botella-750ml':  'Vodka Absolut Raspberri',

  // Whiskies
  'Jim-Beam':            'Jim Beam Bourbon',
  'Red-Label':           'Johnnie Walker Red Label',
  'Ballantines':         'Whisky Escocés Ballantines',
  'Black&White':         'Whisky Black & white',
  'Passport-Scotch':     'Whisky Passport',
  'J&B':                 'Whisky J&B',
  "William-Lawson's-700ml": 'Whisky William Lawsons',

  // Rones
  'Ron-Appleton-Estate-Signature-750ml': 'Ron Appleton Estate Signature',
  'Capitán-Morgan-700ml':                'Ron Capitán Morgan Spiced Gold',
  'Matusalem':                           'Ron Matusalem Clásico',
  'Malibu-750ml':                        'Ron Malibu',
  'Bacardi-Raspberry-750ml':             'Ron Bacardi Raspberry',
  'Bacardi-Mango-Chile-750ml':           'Ron Bacardi Mango Chile',
  'Bacardi-700ml':                       'Ron Bacardi blanco',

  // Brandies
  'Presidente-700ml': 'Brandy Presidente',
  'Torres-5':         'Brandy Torres 5',
  'Torres-10':        'Brandy Torres 10',
  'Torres-15':        'Brandy torres 15',

  // Cervezas
  'Modelo-lata-473ml':        'Modelo lata',
  'Tecate-lata-473ml':        'Tecate laton',
  'Corona-ligth-Lata-355ml':  'Corona ligth',
  'Indio-Lata-473ml':         'Indio Laton',
  'Dos-Equis-Lata-473ml':     'xx lager laton',
  'Heineken-0.0-Lata-355ml':  'Heineken 0',
  'Sol-Clamato-Lata-473ml':   'sol clamato',

  // Sueros / Electrolitos
  'Electroli-Ponche-de-Frutas': 'Electrolit ponche de frutas',
  'Electrolit-Fresa':           'Electrolit fresa',
  'Electrolit-Manzana':         'Electrolit Manzana',
  'Electrolit-Uva':             'Suero x uva mora',
  'Electrolit-Mora-Azul':       'Suero x mora azul',

  // Refrescos
  '7up-3LT':              '7 up',
  'Coca-Cola-3LT':        'Coca-cola',
  'Sprite-3LT':           'Sprite',
  'Manzanita-Sol—3LT':    'Manzanita sol',
  'Mundet-3LT':           'Mundet',
  'Squirt-3LT':           'squirt',
  'Peñafiel-Agua-Mineral-2LT':  'Agua mineral',
  'Peñafiel-Naranjada-2LT':     'Peñafiel de Naranjada',

  // Jugos
  'Jumex-Arándano-960ml':      'Jumex Arandano',
  'Ocean-Spray-Arándanos-1lt': 'Ocean spray aranadano',

  // Bacardi tamaños extra
  'Bacardi-1750ml':   'Ron Bacardi blanco 1750ml',
  'Bacardi-375ml':    'Ron Bacardi blanco 375ml',
  'Bacardi-lata-355Ml': 'Bacardi lata 355ml',

  // New Mix
  'New-Mix-Paloma-Lata-473ml':  'New Mix Paloma lata',
  'New-Mix-Vampiro-Lata-473ml': 'New Mix Vampiro lata',

  // Electrolit sabor extra
  'Electrolit-Fresa-Kiwi': 'Electrolit Fresa Kiwi',

  // Otros
  'Bolsa-De-Hielos':                  'Bolsa de hielo',
  'Boost-470ML':                      'Boost',
  'Clamato':                          'Clamato',
  'Encendedor':                       'Encendedores',
  'Maruchan-Con-Camaron':             'Maruchan',
  'Prudence':                         'Condones prudence',
  'Vaso':                             'Vaso rojo',
  'Cigarros-Malboro-Rojo-Cajetilla':  'Malboro rojo',
  'Cigarros-Pall-Mall-Alaska-Cajetilla': 'PALL ALASKA',
  'Cigarros-Pall-Mall-Mykonos-Cajetilla': 'PALL MALL ARUBA',
}

// ── Crear bucket si no existe ────────────────────────────────────────────────

const { error: bucketErr } = await supabase.storage.createBucket(BUCKET, { public: true })
if (bucketErr && !bucketErr.message.includes('already exists')) {
  console.error('❌ Error creando bucket:', bucketErr.message)
  process.exit(1)
}
console.log(`🪣 Bucket "${BUCKET}" listo\n`)

// ── Leer archivos de la carpeta ──────────────────────────────────────────────

const EXTS = ['.jpg', '.jpeg', '.png', '.webp']
const archivos = readdirSync(CARPETA).filter(f => EXTS.includes(extname(f).toLowerCase()))
console.log(`🖼️  ${archivos.length} imágenes encontradas\n`)

let subidas = 0, actualizadas = 0, omitidas = 0

for (const archivo of archivos) {
  const sinExt      = archivo.replace(/\.[^.]+$/, '')
  const productoNombre = MAPA[sinExt]

  if (!productoNombre) {
    console.log(`  ⚪ Sin mapeo: "${archivo}" — se sube pero no se asigna a ningún producto`)
  }

  // Subir imagen al bucket
  const ruta      = join(CARPETA, archivo)
  const contenido = readFileSync(ruta)
  const ext       = extname(archivo).toLowerCase().replace('.', '')
  const mime      = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'png' ? 'image/png' : 'image/webp'
  const storePath = `catalogo/${archivo}`

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(storePath, contenido, { contentType: mime, upsert: true })

  if (upErr) {
    console.error(`  ❌ Error subiendo "${archivo}": ${upErr.message}`)
    omitidas++
    continue
  }

  subidas++

  if (!productoNombre) { omitidas++; continue }

  // Obtener URL pública
  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storePath)

  // Actualizar imagen_url en la DB
  const { error: dbErr } = await supabase
    .from('productos')
    .update({ imagen_url: publicUrl })
    .eq('nombre', productoNombre)

  if (dbErr) {
    console.error(`  ❌ Error actualizando "${productoNombre}": ${dbErr.message}`)
    omitidas++
  } else {
    console.log(`  ✅ "${productoNombre}"`)
    actualizadas++
  }
}

console.log(`\n✨ Listo:`)
console.log(`   ${subidas} imágenes subidas a Storage`)
console.log(`   ${actualizadas} productos actualizados`)
console.log(omitidas > 0 ? `   ${omitidas} omitidos (ver arriba)` : '')
