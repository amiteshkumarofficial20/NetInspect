/**
 * Lightweight inline SVG dot-grid background.
 * Uses SVG <pattern> + <radialGradient> mask — no external assets, ~300B.
 * Creates the faint "world-map dot-grid" effect from the design reference.
 */
export function DotGridBackground({ className }: { className?: string }) {
  return (
    <svg
      className={`absolute inset-0 w-full h-full pointer-events-none ${className ?? ''}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        {/* Repeating dot pattern */}
        <pattern id="dotgrid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="#38bdf8" />
        </pattern>

        {/* Radial fade mask — brighter centre, fades to edges */}
        <radialGradient id="dotfade" cx="50%" cy="50%" r="55%" fx="50%" fy="50%">
          <stop offset="0%"   stopColor="white" stopOpacity="1" />
          <stop offset="60%"  stopColor="white" stopOpacity="0.6" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>

        <mask id="dotmask">
          <rect width="100%" height="100%" fill="url(#dotfade)" />
        </mask>
      </defs>

      {/* Dots rendered through the radial mask */}
      <rect
        width="100%"
        height="100%"
        fill="url(#dotgrid)"
        mask="url(#dotmask)"
        opacity="0.12"
      />
    </svg>
  );
}
