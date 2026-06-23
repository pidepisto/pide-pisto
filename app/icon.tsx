import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#8B1A1A',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ color: '#F7F3EC', fontSize: 18, fontWeight: 900, letterSpacing: '-1px' }}>
          PP
        </span>
      </div>
    ),
    { ...size }
  )
}
