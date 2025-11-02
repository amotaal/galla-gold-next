// /components/logo.tsx
// Animated Gold Logo Component
// Purpose: Consistent animated gold branding throughout the app

"use client";

import Image from "next/image";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex justify-center">
        <Image
          src="/gold-bars.gif"
          alt="GALLA.GOLD"
          width={40}
          height={40}
          unoptimized // Important for GIFs
        />
      </div>
      {/* Brand name with animated gold gradient */}
      <span className="text-2xl font-bold gold-shine bg-clip-text">
        GALLA.GOLD
      </span>
    </div>
  );
}

// Add this to globals.css if not already there:
/*
@keyframes shine {
  0%, 100% { transform: translateX(-100%); }
  50% { transform: translateX(400%); }
}
*/
