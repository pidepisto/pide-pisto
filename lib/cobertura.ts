export type ZonaCobertura = 'Chalco' | 'Ixtapaluca'

export type ColoniaCobertura = {
  nombre: string
  cp: string
  zona: ZonaCobertura
}

export const COLONIAS_COBERTURA: ColoniaCobertura[] = [
  // ── CHALCO ──
  { nombre: 'Centro de Chalco', cp: '56600', zona: 'Chalco' },
  { nombre: 'Barrio San Juan', cp: '56600', zona: 'Chalco' },
  { nombre: 'Barrio San Miguel', cp: '56600', zona: 'Chalco' },
  { nombre: 'Barrio San Pedro', cp: '56600', zona: 'Chalco' },
  { nombre: 'Barrio La Asunción', cp: '56600', zona: 'Chalco' },
  { nombre: 'San Andrés Mixquic', cp: '56620', zona: 'Chalco' },
  { nombre: 'San Juan Tezompa', cp: '56615', zona: 'Chalco' },
  { nombre: 'San Marcos Huixtoco', cp: '56605', zona: 'Chalco' },
  { nombre: 'Santiago Zula', cp: '56612', zona: 'Chalco' },
  { nombre: 'Ayotzingo', cp: '56618', zona: 'Chalco' },
  { nombre: 'Xico', cp: '56610', zona: 'Chalco' },
  { nombre: 'Santa Catarina Ayotzingo', cp: '56619', zona: 'Chalco' },
  { nombre: 'San Martín Cuautlalpan', cp: '56608', zona: 'Chalco' },
  { nombre: 'Fraccionamiento las Flores', cp: '56600', zona: 'Chalco' },
  { nombre: 'Unidad Habitacional ISSSTE', cp: '56600', zona: 'Chalco' },
  { nombre: 'Lomas de Cocotitlán', cp: '56600', zona: 'Chalco' },
  { nombre: 'Los Laureles', cp: '56600', zona: 'Chalco' },
  { nombre: 'Ampliación San Marcos', cp: '56605', zona: 'Chalco' },
  { nombre: 'Rancho San Isidro', cp: '56612', zona: 'Chalco' },

  // ── IXTAPALUCA ──
  { nombre: 'Centro de Ixtapaluca', cp: '56580', zona: 'Ixtapaluca' },
  { nombre: 'Coatepec', cp: '56530', zona: 'Ixtapaluca' },
  { nombre: 'Los Reyes Ixtacala', cp: '56535', zona: 'Ixtapaluca' },
  { nombre: 'Tlalpizahuac', cp: '56570', zona: 'Ixtapaluca' },
  { nombre: 'San Francisco Acuautla', cp: '56553', zona: 'Ixtapaluca' },
  { nombre: 'Tlapacoya', cp: '56560', zona: 'Ixtapaluca' },
  { nombre: 'Santa Bárbara', cp: '56580', zona: 'Ixtapaluca' },
  { nombre: 'Citlalli', cp: '56583', zona: 'Ixtapaluca' },
  { nombre: 'Hacienda Real', cp: '56585', zona: 'Ixtapaluca' },
  { nombre: 'Ixtapaluca Izcalli', cp: '56584', zona: 'Ixtapaluca' },
  { nombre: 'Las Canteras', cp: '56582', zona: 'Ixtapaluca' },
  { nombre: 'El Molino', cp: '56586', zona: 'Ixtapaluca' },
  { nombre: 'Lomas de San Buenaventura', cp: '56581', zona: 'Ixtapaluca' },
  { nombre: 'San Buenaventura', cp: '56540', zona: 'Ixtapaluca' },
  { nombre: 'San Juan Tezompa Ixtapaluca', cp: '56555', zona: 'Ixtapaluca' },
  { nombre: 'Los Álamos', cp: '56587', zona: 'Ixtapaluca' },
  { nombre: 'Jardines de Ixtapaluca', cp: '56588', zona: 'Ixtapaluca' },
  { nombre: 'Ampliación Coatepec', cp: '56532', zona: 'Ixtapaluca' },
  { nombre: 'Ex Hacienda Coapa', cp: '56531', zona: 'Ixtapaluca' },
  { nombre: 'Villas de Ixtapaluca', cp: '56589', zona: 'Ixtapaluca' },
]

export function validarCobertura(colonia: string, cp: string): ColoniaCobertura | null {
  const coloniaLower = colonia.trim().toLowerCase()
  const cpLimpio = cp.trim()

  // Coincidencia exacta por nombre de colonia
  const porNombre = COLONIAS_COBERTURA.find(
    (c) => c.nombre.toLowerCase() === coloniaLower
  )
  if (porNombre) return porNombre

  // Coincidencia por CP
  const porCP = COLONIAS_COBERTURA.find((c) => c.cp === cpLimpio)
  if (porCP) return porCP

  // Coincidencia parcial por nombre (contiene)
  const parcial = COLONIAS_COBERTURA.find(
    (c) => c.nombre.toLowerCase().includes(coloniaLower) && coloniaLower.length >= 4
  )
  if (parcial) return parcial

  return null
}

export function buscarColonias(query: string): ColoniaCobertura[] {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return []
  return COLONIAS_COBERTURA.filter(
    (c) =>
      c.nombre.toLowerCase().includes(q) ||
      c.cp.includes(q)
  ).slice(0, 6)
}
