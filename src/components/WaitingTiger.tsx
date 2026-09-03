import { useEffect, useState } from 'react'

// The tiger on the waiting screen.
//
// It sits for as long as the wait lasts — which may be a minute or twenty —
// and only stands and leaves when the board actually goes live. The sit is
// therefore the important pose, and it is the one Flow drew best.
//
// The walk cycle is weak: the frames never reach the opposite phase of the
// stride. It reads fine because the tiger is also translating off-screen, and
// horizontal movement is what the eye reads as walking.

const FW = 300, FH = 200
const SIT_END = 8       // cells 0-7 are sit -> stand
const WALK_END = 24     // cells 8-23 are the walk

export function WaitingTiger({ leaving = false }: { leaving?: boolean }) {
  const [frame, setFrame] = useState(0)
  const [gone, setGone] = useState(false)

  // Idle: a slow shift between the two seated poses. Anything faster reads as
  // fidgeting on a screen that may be up for a long time.
  useEffect(() => {
    if (leaving) return
    const t = setInterval(() => setFrame(f => (f === 0 ? 1 : 0)), 2600)
    return () => clearInterval(t)
  }, [leaving])

  useEffect(() => {
    if (!leaving) return
    let i = 0
    const stand = setInterval(() => {
      i += 1
      if (i >= SIT_END) {
        clearInterval(stand)
        let w = SIT_END
        const walk = setInterval(() => {
          w = w + 1 >= WALK_END ? SIT_END : w + 1
          setFrame(w)
        }, 70)
        setGone(true)
        setTimeout(() => clearInterval(walk), 1100)
        return
      }
      setFrame(i)
    }, 130)
    return () => clearInterval(stand)
  }, [leaving])

  return (
    <div className="w-full flex justify-center overflow-hidden" style={{ height: FH }}>
      <div
        style={{
          width: FW, height: FH,
          backgroundImage: 'url(/tiger/tiger-loader.png)',
          backgroundPosition: `-${frame * FW}px 0`,
          backgroundRepeat: 'no-repeat',
          imageRendering: 'pixelated',
          transform: gone ? 'translateX(150%)' : 'translateX(0)',
          transition: gone ? 'transform 1.1s linear' : 'none',
        }}
      />
    </div>
  )
}
