import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#8B1A1A',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
        }}
      >
        <span style={{ color: '#F7F3EC', fontSize: 72, fontWeight: 900, letterSpacing: '-3px', lineHeight: 1 }}>
          PP
        </span>
        <span style={{ color: '#F7F3EC', fontSize: 18, fontWeight: 600, letterSpacing: '3px', opacity: 0.85 }}>
          PIDE PISTO
        </span>
      </div>
    ),
    { ...size }
  )
}
