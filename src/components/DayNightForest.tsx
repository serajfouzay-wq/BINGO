import { useEffect, useRef, useState } from 'react'

// Day-to-night forest for the waiting screen.
//
// Twenty frames over four minutes, true cross-fade. Two layers stay mounted
// for the whole life of the component and swap roles: the bottom one holds the
// current frame at full opacity while the top one fades the next frame in over
// it. An earlier version keyed the layers by frame index, so React unmounted
// the outgoing frame and mounted the incoming one at zero opacity — both were
// transparent for an instant and the background showed through as a black
// flash between every frame.
//
// Frames are prefetched one ahead because 700 phones hit this screen at once
// on venue wifi.

const FRAMES = 20
const CYCLE_MS = 60_000            // a full day in one minute
const STEP = CYCLE_MS / FRAMES
const FADE_MS = 2200               // fade must stay shorter than the 3s step
const src = (n: number) => `/forest/forest-${String(n).padStart(2, '0')}.webp`

export function DayNightForest() {
  const [base, setBase] = useState(() => Math.floor(Math.random() * FRAMES))
  const [incoming, setIncoming] = useState<number | null>(null)
  const [fade, setFade] = useState(0)
  const timers = useRef<number[]>([])

  useEffect(() => {
    const advance = () => {
      const next = (baseRef.current + 1) % FRAMES

      // Decode before showing it, so the fade never reveals a half-loaded image.
      const img = new Image()
      img.src = src(next)
      const start = () => {
        setIncoming(next)
        // One frame later, so the browser has painted it at opacity 0 and the
        // transition actually runs instead of snapping.
        requestAnimationFrame(() => requestAnimationFrame(() => setFade(1)))
        timers.current.push(window.setTimeout(() => {
          // Promote: the incoming frame becomes the base, then the top layer is
          // reset with no transition so it is ready for the next fade.
          setBase(next)
          setFade(0)
          setIncoming(null)
        }, FADE_MS))
      }
      if (img.complete) start()
      else { img.onload = start; img.onerror = start }
    }

    const id = window.setInterval(advance, STEP)
    return () => {
      clearInterval(id)
      timers.current.forEach(clearTimeout)
    }
  }, [])

  // Keep a ref in step so the interval always reads the current frame without
  // being torn down and rebuilt on every tick.
  const baseRef = useRef(base)
  useEffect(() => { baseRef.current = base }, [base])

  // Warm the next two frames.
  useEffect(() => {
    for (const n of [1, 2]) {
      const img = new Image()
      img.src = src((base + n) % FRAMES)
    }
  }, [base])

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: '#0a1410' }}>
      {/* Bottom layer: never fades, so there is always something opaque. */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${src(base)})` }}
      />
      {/* Top layer: the next frame fading in over the one below. */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: incoming === null ? 'none' : `url(${src(incoming)})`,
          opacity: fade,
          transition: fade === 1 ? `opacity ${FADE_MS}ms linear` : 'none',
        }}
      />

      {/* Vignette so white text stays readable whatever the sky is doing. */}
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
