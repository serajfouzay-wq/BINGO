// Pixel-art forest backdrop for the waiting screen.
//
// Drawn rather than photographed: a 2K jungle JPEG is a slow download for 700
// phones arriving on venue wifi at the same moment, which is precisely when
// this screen appears. Chunky rectangles at a few depths read as pixel art and
// cost nothing.

const TRUNK = ['#1d3326', '#24402f', '#2c4d39']
const CANOPY = ['#14261c', '#1a3325', '#22422f', '#2b5139']

/** Deterministic pseudo-random, so the forest is identical on every device in
 *  the room — a different layout per phone would look like a glitch. */
function rnd(seed: number) {
  let s = seed
  return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296 }
}

export function PixelForest() {
  const r = rnd(20260903)
  const layers = [0, 1, 2].map(depth => {
    const n = 6 + depth * 3
    return Array.from({ length: n }, (_, i) => {
      const x = (i + r() * 0.7) * (100 / n)
      const h = 42 + r() * 26 - depth * 8
      const w = 3.2 - depth * 0.7
      return { x, h, w, k: `${depth}-${i}` }
    })
  })

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: '#0a1a12' }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full"
           style={{ imageRendering: 'pixelated' }}>
        {/* Sky glow through the canopy */}
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#1c3b2a" />
            <stop offset="55%"  stopColor="#122519" />
            <stop offset="100%" stopColor="#0a1a12" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill="url(#sky)" />

        {/* Trees, far to near. Blocky rectangles only — no curves, so it stays
            in the pixel-art idiom at any size. */}
        {layers.map((trees, depth) => (
          <g key={depth} opacity={0.55 + depth * 0.22}>
            {trees.map(t => (
              <g key={t.k}>
                <rect x={t.x} y={100 - t.h} width={t.w} height={t.h} fill={TRUNK[depth]} />
                {[0, 1, 2].map(b => (
                  <rect
                    key={b}
                    x={t.x - 3.5 - depth * 0.6 + b * 0.5}
                    y={100 - t.h - 2 + b * 5}
                    width={10 + depth * 1.5 - b * 1.2}
                    height={5}
                    fill={CANOPY[(depth + b) % CANOPY.length]}
                  />
                ))}
              </g>
            ))}
          </g>
        ))}

        {/* Ground band the tiger stands on */}
        <rect x="0" y="88" width="100" height="12" fill="#16301f" />
        <rect x="0" y="88" width="100" height="1.2" fill="#255036" />
        {Array.from({ length: 22 }, (_, i) => (
          <rect key={i} x={i * 4.7 + (i % 3)} y={89.5 + (i % 4) * 1.6}
                width={2.2} height={1} fill="#1d4029" />
        ))}
      </svg>

      {/* Fireflies. Slow and few — this screen may sit for several minutes and
          anything busier becomes irritating rather than atmospheric. */}
      <div className="absolute inset-0 opacity-60 forest-flies" style={{
        backgroundImage:
          'radial-gradient(2px 2px at 22% 44%, #fde68a, transparent),' +
          'radial-gradient(1px 1px at 58% 30%, #bbf7d0, transparent),' +
          'radial-gradient(2px 2px at 74% 62%, #fcd34d, transparent),' +
          'radial-gradient(1px 1px at 38% 70%, #a7f3d0, transparent),' +
          'radial-gradient(1px 1px at 88% 38%, #fde68a, transparent)',
        backgroundSize: '460px 460px',
      }} />
    </div>
  )
}
