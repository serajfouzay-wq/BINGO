import { useEffect, useState } from 'react'

// Day-to-night forest for the waiting screen.
//
// Twenty frames cross-faded, one full day over four minutes. That pace suits
// the situation: players sit here for anything from one minute to twenty, so
// the scene should visibly change if you look up twice without ever being
// distracting enough to watch.
//
// Only two frames are mounted at a time and the next is prefetched, because
// 700 phones hit this screen at once on venue wifi and the first paint must
// not wait on 428KB of artwork.

const FRAMES = 20
const CYCLE_MS = 240_000
const STEP = CYCLE_MS / FRAMES
const src = (n: number) => `/forest/forest-${String(n).padStart(2, '0')}.webp`

export function DayNightForest() {
  const [i, setI] = useState(() => Math.floor(Math.random() * FRAMES))
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setI(v => (v + 1) % FRAMES), STEP)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const img = new Image()
    img.src = src((i + 1) % FRAMES)
  }, [i])

  useEffect(() => {
    const img = new Image()
    img.onload = () => setReady(true)
    img.src = src(i)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: '#0a1410' }}>
      {[0, 1].map(off => {
        const idx = (i + off) % FRAMES
        return (
          <div
            key={idx}
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${src(idx)})`,
              opacity: off === 0 && ready ? 1 : 0,
              transition: 'opacity 6s linear',
            }}
          />
        )
      })}

      {/* Vignette so white text stays readable whatever the sky is doing —
          the midday frames are bright enough to wash it out otherwise. */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 90% 70% at 50% 40%, transparent 20%, rgba(4,10,8,0.72) 100%)',
      }} />

      <div className="absolute inset-0 opacity-50 forest-flies" style={{
        backgroundImage:
          'radial-gradient(2px 2px at 22% 44%, #fde68a, transparent),' +
          'radial-gradient(1px 1px at 58% 30%, #bbf7d0, transparent),' +
          'radial-gradient(2px 2px at 74% 62%, #fcd34d, transparent),' +
          'radial-gradient(1px 1px at 38% 70%, #a7f3d0, transparent)',
        backgroundSize: '460px 460px',
      }} />
    </div>
  )
}
