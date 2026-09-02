import { faceTransform, faceName, faceColor, TILES_PER_FACE } from '../lib/cubeFaces'
import type { BingoTask } from '../types/database'

// A slowly rotating cube for the projector.
//
// Rotation is CSS only and deliberately slow — this sits on a screen behind a
// facilitator for an hour, so it needs to read as alive without pulling focus
// or making anyone seasick. Players and the admin keep flat grids: hunting for
// a tile by rotating a cube on a phone is slower than scanning a grid, and at
// a live event slower is worse.

export function CubeBoard({ faces, size = 420, completedSlots }: {
  /** Tasks per face, indexed by face then position. */
  faces: (BingoTask | null)[][]
  size?: number
  /** Slot numbers already crossed off, so the cube shows real progress. */
  completedSlots: Set<number>
}) {
  return (
    <div className="grid place-items-center" style={{ perspective: size * 3 }}>
      <div
        className="relative cube-spin"
        style={{ width: size, height: size, transformStyle: 'preserve-3d' }}
      >
        {faces.map((tiles, f) => (
          <div
            key={f}
            className="absolute inset-0 rounded-2xl overflow-hidden"
            style={{
              transform: faceTransform(f, size),
              background: 'rgba(10,20,20,0.92)',
              border: `2px solid ${faceColor(f)}66`,
              boxShadow: `0 0 40px ${faceColor(f)}33`,
              backfaceVisibility: 'hidden',
            }}
          >
            <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest"
                 style={{ color: faceColor(f), background: `${faceColor(f)}18` }}>
              {faceName(f)}
            </div>
            <div className="grid grid-cols-5 gap-1 p-2" style={{ height: size - 28 }}>
              {Array.from({ length: TILES_PER_FACE }, (_, i) => {
                const t = tiles?.[i]
                const slot = f * TILES_PER_FACE + i
                const done = completedSlots.has(slot)
                return (
                  <div
                    key={i}
                    className="rounded-md grid place-items-center text-[7px] font-black leading-none text-center px-0.5 overflow-hidden"
                    style={{
                      background: !t ? 'rgba(255,255,255,0.04)'
                        : done ? `${t.hex_code}` : `${t.hex_code}33`,
                      border: `1px solid ${t ? `${t.hex_code}88` : 'rgba(255,255,255,0.08)'}`,
                      color: done ? '#fff' : 'rgba(255,255,255,0.55)',
                    }}
                  >
                    {done ? '✓' : t ? t.title.slice(0, 10) : ''}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
