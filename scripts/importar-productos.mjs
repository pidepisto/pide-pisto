/**
 * Importar productos desde CSV al catálogo de Pide Pisto
 * Uso: node scripts/importar-productos.mjs
 *
 * Requiere en .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// ── Config ──────────────────────────────────────────────────────────────────

const CSV_PATH = process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '..', 'productos.csv')

// Cargar .env.local manualmente (maneja valores JWT que se parten en varias líneas)
const envFile = join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local')
const envRaw  = readFileSync(envFile, 'utf8')

// Unir líneas de continuación (líneas que no tienen '=' y no empiezan con '#')
const envLines = []
for (const line of envRaw.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  if (trimmed.includes('=')) {
    envLines.push(trimmed)
  } else if (envLines.length > 0) {
    // Continuación del valor anterior (JWT partido en varias líneas)
    envLines[envLines.length - 1] += trimmed
  }
}

const envVars = envLines.reduce((acc, l) => {
  const [k, ...v] = l.split('=')
  acc[k.trim()] = v.join('=').trim()
  return acc
}, {})

const SUPABASE_URL      = envVars['NEXT_PUBLIC_SUPABASE_URL']
const SERVICE_ROLE_KEY  = envVars['SUPABASE_SERVICE_ROLE_KEY']

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// ── Helpers ──────────────────────────────────────────────────────────────────

function limpiarPrecio(str) {
  if (!str) return null
  const n = parseFloat(str.replace(/[$\s,]/g, ''))
  return isNaN(n) ? null : n
}

function slug(nombre) {
  return nombre
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// ── Parsear CSV ──────────────────────────────────────────────────────────────

const csv = readFileSync(CSV_PATH, 'latin1') // el CSV tiene encoding latin1 (tildes)
const lineas = csv.split('\n').map(l => l.split(','))

// Saltar las primeras 5 filas (encabezados de ejemplo + instrucciones)
// Los datos reales empiezan en la fila 6 (índice 5)
const datos = lineas.slice(5).filter(cols => {
  const nombre = cols[3]?.trim()
  const precio = cols[20]?.trim()
  return nombre && nombre.length > 1 && precio && precio.replace(/[$\s]/g, '') !== ''
})

console.log(`📦 ${datos.length} productos encontrados en el CSV\n`)

// ── Categorías únicas ────────────────────────────────────────────────────────

const categoriasRaw = [...new Set(datos.map(c => c[1]?.trim()).filter(Boolean))]

// Mapear nombres de categoría del CSV a nombres más limpios
const CATEGORIA_MAP = {
  'Tequila':                    'Tequila',
  'Tequilao':                   'Tequila',
  'Vodka ':                     'Vodka',
  'Vodka':                      'Vodka',
  'Whisky':                     'Whisky',
  'Ron ':                       'Ron',
  'Ron':                        'Ron',
  'Brandy':                     'Brandy',
  'Cerveza':                    'Cerveza',
  'Refresco':                   'Refresco',
  'Jugo':                       'Jugo',
  'Suero':                      'Suero',
  'Cigarros':                   'Cigarros',
  'Hielo':                      'Hielo',
  'Clamato':                    'Clamato',
  'Boost':                      'Energéticas',
  'Coca-cola Bacardi':          'Cocteles preparados',
  'Vaso rojo':                  'Accesorios',
  'Sopa':                       'Snacks',
  'Condones':                   'Condones',
  'Encendedores':               'Accesorios',
  'Tequila+refresco de toronja+bolsa de hielos + 1 botana + 5 vasos': 'Combos',
  'vodka+sprite y  jugo+hielos+ 5 vasos + 3 paletas ': 'Combos',
  'Bacardi+coca+mineral+ hielos + 5 vaos + botana':    'Combos',
  'wisky+mineral+ginger+hielos+ 5 vasos+ botano':      'Combos',
  '12 cervezas+ 1 clamato+ 5 vaoss+2 sueros+ 2 maruchan ': 'Combos',
  '1800': 'Tequila',
}

const categoriasNombres = [...new Set(Object.values(CATEGORIA_MAP))]

// ── Insertar categorías ──────────────────────────────────────────────────────

console.log('📁 Creando categorías...')
const catMap = {}

for (let i = 0; i < categoriasNombres.length; i++) {
  const nombre = categoriasNombres[i]
  const { data, error } = await supabase
    .from('categorias')
    .upsert({ nombre, slug: slug(nombre), orden: i + 1 }, { onConflict: 'nombre' })
    .select('id')
    .single()

  if (error) {
    console.error(`  ❌ Error creando categoría "${nombre}":`, error.message)
  } else {
    catMap[nombre] = data.id
    console.log(`  ✅ ${nombre} (${data.id})`)
  }
}

// ── Insertar productos ───────────────────────────────────────────────────────

console.log('\n🛍️  Importando productos...')
let ok = 0, err = 0

for (const cols of datos) {
  const categoriaRaw = cols[1]?.trim() ?? ''
  const nombre       = cols[3]?.trim()
  const precioVenta  = limpiarPrecio(cols[20])
  const precioReg    = limpiarPrecio(cols[21])

  const categoriaNombre = CATEGORIA_MAP[categoriaRaw] ?? categoriaRaw
  const categoria_id    = catMap[categoriaNombre]

  if (!categoria_id) {
    console.warn(`  ⚠️  Sin categoría para "${nombre}" (raw: "${categoriaRaw}")`)
    err++
    continue
  }

  // precio = regular, precio_promocion = precio de venta (si hay descuento)
  const precio          = precioReg ?? precioVenta
  const precio_promocion = (precioReg && precioVenta && precioVenta < precioReg) ? precioVenta : null

  if (!precio) {
    console.warn(`  ⚠️  Sin precio para "${nombre}"`)
    err++
    continue
  }

  const { error } = await supabase.from('productos').insert({
    nombre,
    descripcion:      null,
    precio,
    precio_promocion,
    categoria_id,
    stock:            10,
    activo:           true,
  })

  if (error) {
    console.error(`  ❌ "${nombre}": ${error.message}`)
    err++
  } else {
    console.log(`  ✅ ${nombre} — $${precio}${precio_promocion ? ` (oferta $${precio_promocion})` : ''}`)
    ok++
  }
}

// ── Productos extra (imágenes sin entrada en el CSV) ────────────────────────
// Precio en 1 = pendiente de ajustar en el panel admin

const EXTRAS = [
  { nombre: 'Ron Bacardi blanco 1750ml',  categoria: 'Ron',               precio: 1 },
  { nombre: 'Ron Bacardi blanco 375ml',   categoria: 'Ron',               precio: 1 },
  { nombre: 'Bacardi lata 355ml',         categoria: 'Ron',               precio: 1 },
  { nombre: 'New Mix Paloma lata',        categoria: 'Cocteles preparados', precio: 1 },
  { nombre: 'New Mix Vampiro lata',       categoria: 'Cocteles preparados', precio: 1 },
  { nombre: 'Electrolit Fresa Kiwi',      categoria: 'Suero',             precio: 1 },
]

console.log('\n➕  Agregando productos extra...')
for (const p of EXTRAS) {
  const categoria_id = catMap[p.categoria]
  if (!categoria_id) { console.warn(`  ⚠️  Categoría "${p.categoria}" no encontrada`); err++; continue }

  const { error } = await supabase.from('productos').insert({
    nombre:       p.nombre,
    descripcion:  null,
    precio:       p.precio,
    categoria_id,
    stock:        10,
    activo:       false,
  })

  if (error) {
    console.error(`  ❌ "${p.nombre}": ${error.message}`)
    err++
  } else {
    console.log(`  ✅ ${p.nombre} (⚠️  precio pendiente — activar en admin)`)
    ok++
  }
}

console.log(`\n✨ Listo: ${ok} productos importados, ${err} errores`)
console.log('⚠️  Los 6 productos extra quedaron INACTIVOS — ponles precio en /admin/catalogo y actívalos')
