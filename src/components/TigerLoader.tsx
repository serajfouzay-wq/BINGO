import { useEffect, useState } from 'react'

// Loading screen.
//
// Timing follows real progress rather than a fixed delay: the tiger sits while
// the app loads and only stands and leaves once it is ready. On a fast
// connection that is a brief sit and a quick exit; on venue wifi at a 700-person
// event it sits longer. Nobody is ever held up for the sake of the animation.
//
// The walk cycle itself is weak — the frames Flow produced never reach the
// opposite phase of the stride. It reads fine anyway because the tiger is also
// translating off-screen, and horizontal movement is what the eye actually
// reads as walking.

const FW = 300, FH = 200
const SIT_FRAMES  = 8      // cells 0-7
const WALK_FRAMES = 16     // cells 8-23
const SIT_MS = 140, WALK_MS = 70, EXIT_MS = 900

type Phase = 'sitting' | 'standing' | 'leaving'

export function TigerLoader({ ready, onDone, message = 'Getting things ready' }: {
  /** Flip to true when the app has what it needs; the tiger then stands and leaves. */
  ready: boolean
  onDone: () => void
  message?: string
}) {
  const [phase, setPhase] = useState<Phase>('sitting')
  const [frame, setFrame] = useState(0)
  const [x, setX] = useState(0)

  // Idle sit: hold on the first pose with an occasional small shift, so the
  // screen is alive without implying progress that is not happening.
  useEffect(() => {
    if (phase !== 'sitting') return
    const t = setInterval(() => setFrame(f => (f + 1) % 2), 900)
    return () => clearInterval(t)
  }, [phase])

  useEffect(() => { if (ready && phase === 'sitting') setPhase('standing') }, [ready, phase])

  // Stand up once, then hand over to the walk.
  useEffect(() => {
    if (phase !== 'standing') return
    let i = 0
    setFrame(0)
    const t = setInterval(() => {
      i += 1
      if (i >= SIT_FRAMES) { clearInterval(t); setPhase('leaving'); return }
      setFrame(i)
    }, SIT_MS)
    return () => clearInterval(t)
  }, [phase])

  // Walk out to the right, then tell the parent we are done.
  useEffect(() => {
    if (phase !== 'leaving') return
    let i = 0
    const legs = setInterval(() => {
      i += 1
      setFrame(SIT_FRAMES + (i % WALK_FRAMES))
    }, WALK_MS)
    requestAnimationFrame(() => setX(140))
    const end = setTimeout(() => { clearInterval(legs); onDone() }, EXIT_MS)
    return () => { clearInterval(legs); clearTimeout(end) }
  }, [phase, onDone])

  return (
    <div className="fixed inset-0 z-[200] overflow-hidden"
         style={{ background: '#0b1410' }}>
      {/* Jungle backdrop. Layered gradients rather than an image so it scales
          to any screen with nothing to download. */}
      <div className="absolute inset-0" style={{
        background:
          'radial-gradient(ellipse 90% 60% at 50% 110%, rgba(21,94,60,0.55), transparent 70%),' +
          'radial-gradient(ellipse 70% 50% at 15% 20%, rgba(13,148,136,0.18), transparent 65%),' +
          'radial-gradient(ellipse 60% 45% at 85% 15%, rgba(251,191,36,0.10), transparent 65%),' +
          'linear-gradient(180deg, #0d1f19 0%, #0b1410 60%, #070d0b 100%)',
      }} />

      {/* Drifting motes, so the scene breathes while the tiger waits. */}
      <div className="absolute inset-0 opacity-40 tiger-motes" style={{
        backgroundImage:
          'radial-gradient(2px 2px at 18% 30%, #fde68a, transparent),' +
          'radial-gradient(1px 1px at 62% 22%, #a7f3d0, transparent),' +
          'radial-gradient(2px 2px at 41% 72%, #fcd34d, transparent),' +
          'radial-gradient(1px 1px at 79% 58%, #6ee7b7, transparent),' +
          'radial-gradient(1px 1px at 28% 86%, #fde68a, transparent)',
        backgroundSize: '420px 420px',
      }} />

      <div className="relative h-full flex flex-col items-center justify-center gap-8 px-8">
        <div className="relative" style={{ width: FW, height: FH, maxWidth: '86vw' }}>
          <div
            style={{
              width: FW, height: FH,
              backgroundImage: 'url(/tiger/tiger-loader.png)',
              backgroundPosition: `-${frame * FW}px 0`,
              backgroundRepeat: 'no-repeat',
              imageRendering: 'pixelated',
              transform: `translateX(${x}%)`,
              transition: phase === 'leaving' ? `transform ${EXIT_MS}ms linear` : 'none',
            }}
          />
        </div>

        <div className="w-full max-w-xs">
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full rounded-full tiger-bar" style={{ background: '#fbbf24' }} />
          </div>
          <p className="text-center text-sm font-bold mt-4" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {phase === 'sitting' ? message : 'Here we go'}
          </p>
        </div>
      </div>
    </div>
  )
}
