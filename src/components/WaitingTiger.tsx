// The tiger on the waiting screen.
//
// An animated WebP rather than a sprite sheet, so the artwork is exactly the
// animation as supplied. The source GIF was 47MB across 240 frames — fine on a
// desktop, hopeless for a room of phones joining at once — so it is trimmed to
// the single 16-frame stride that repeats, cropped to the subject, and
// re-encoded with alpha.

export function WaitingTiger({ leaving = false }: { leaving?: boolean }) {
  return (
    <div className="w-full flex justify-center overflow-hidden">
      <img
        src="/tiger/tiger-walk.webp"
        alt=""
        className="w-[280px] sm:w-[360px] max-w-[80vw]"
        style={{
          transform: leaving ? 'translateX(180%)' : 'translateX(0)',
          transition: leaving ? 'transform 1.2s linear' : 'none',
        }}
      />
    </div>
  )
}
