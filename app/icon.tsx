// app/icon.tsx
// Purpose: Generate app icons dynamically using Next.js ImageResponse
// This creates the /icon-192.png and /icon-512.png routes

import { ImageResponse } from 'next/og'

// Image metadata
export const runtime = 'edge'
export const size = {
  width: 512,
  height: 512,
}
export const contentType = 'image/png'

// Icon generation
export default async function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 256,
          background: 'linear-gradient(135deg, #FFB800 0%, #FFA500 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#000',
          fontWeight: 'bold',
          fontFamily: 'system-ui, sans-serif',
          boxShadow: 'inset 0 0 60px rgba(0,0,0,0.2)',
        }}
      >
        G
      </div>
    ),
    {
      ...size,
    }
  )
}
