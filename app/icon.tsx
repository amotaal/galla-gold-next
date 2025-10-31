// app/icon.tsx
// Dynamic Icon Generator for GALLA.GOLD
// Purpose: Generate app icons dynamically for PWA and mobile devices
// This file creates icons at different sizes (16x16, 32x32, 192x192, 512x512)

import { ImageResponse } from 'next/og';

// =============================================================================
// ICON CONFIGURATION
// =============================================================================

/**
 * Icon sizes to generate
 * - 16: Browser favicon
 * - 32: Browser favicon (retina)
 * - 192: PWA icon (Android)
 * - 512: PWA icon (Android, high res)
 */
export const size = {
  width: 192,
  height: 192,
};

export const contentType = 'image/png';

// =============================================================================
// ICON GENERATOR
// =============================================================================

/**
 * Generate app icon with GALLA.GOLD branding
 * Creates a golden "G" on dark background with subtle glow effect
 */
export default function Icon() {
  return new ImageResponse(
    (
      // Icon container with dark background
      <div
        style={{
          fontSize: 120,
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Golden glow effect behind the letter */}
        <div
          style={{
            position: 'absolute',
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 184, 0, 0.4) 0%, rgba(255, 184, 0, 0) 70%)',
            filter: 'blur(20px)',
          }}
        />
        
        {/* Main "G" letter */}
        <div
          style={{
            fontSize: 140,
            fontWeight: 900,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            background: 'linear-gradient(135deg, #FFD700 0%, #FFB800 50%, #FFA500 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            display: 'flex',
            textShadow: '0 0 40px rgba(255, 184, 0, 0.5)',
          }}
        >
          G
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}