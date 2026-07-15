import { NextRequest, NextResponse } from 'next/server'

// Intenta múltiples fuentes gratuitas de datos SEPOMEX
async function fetchColonias(cp: string): Promise<{ colonias: any[]; municipio: string | null; estado: string | null }> {
  // Fuente 1: icalialabs SEPOMEX
  try {
    const res = await fetch(
      `https://sepomex.icalialabs.com/api/v1/zip_codes?zip_code=${cp}&per_page=150`,
      { signal: AbortSignal.timeout(5000), next: { revalidate: 86400 } }
    )
    if (res.ok) {
      const data = await res.json()
      const zips: any[] = data.zip_codes ?? []
      if (zips.length > 0) {
        const colonias = zips
          .map(z => ({ nombre: z.d_asenta as string, tipo: z.d_tipo_asenta as string, municipio: z.D_mnpio as string, estado: z.d_estado as string }))
          .filter(c => c.nombre)
          .sort((a, b) => a.nombre.localeCompare(b.nombre))
        return { colonias, municipio: colonias[0]?.municipio ?? null, estado: colonias[0]?.estado ?? null }
      }
    }
  } catch {}

  // Fuente 2: copomex (requiere token, opcional)
  const token = process.env.COPOMEX_TOKEN
  if (token) {
    try {
      const res = await fetch(
        `https://api.copomex.com/query/info_cp/${cp}?type=simplified&token=${token}`,
        { signal: AbortSignal.timeout(5000), next: { revalidate: 86400 } }
      )
      if (res.ok) {
        const data = await res.json()
        const r = data.response
        if (r?.asentamiento?.length) {
          const municipio = r.municipio ?? null
          const estado    = r.estado    ?? null
          const colonias  = (r.asentamiento as string[])
            .map(nombre => ({ nombre, tipo: 'Colonia', municipio, estado }))
            .sort((a, b) => a.nombre.localeCompare(b.nombre))
          return { colonias, municipio, estado }
        }
      }
    } catch {}
  }

  return { colonias: [], municipio: null, estado: null }
}

export async function GET(req: NextRequest) {
  const cp = req.nextUrl.searchParams.get('cp')?.trim()
  if (!cp || cp.length !== 5 || !/^\d{5}$/.test(cp)) {
    return NextResponse.json({ colonias: [], municipio: null, estado: null })
  }
  const result = await fetchColonias(cp)
  return NextResponse.json(result)
}
