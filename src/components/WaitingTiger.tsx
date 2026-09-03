// The tiger on the waiting screen.
//
// A WebM video rather than an image: the animated WebP was transcoded to WebM
// somewhere in the download path, and WebM carries alpha anyway, so there is
// nothing to gain by fighting it back into an image format.
//
// muted + playsInline + autoPlay is the combination iOS Safari requires before
// it will play anything without a tap, which matters here because nobody is
// going to tap a background animation.

export function WaitingTiger({ leaving = false }: { leaving?: boolean }) {
  return (
    <div className="w-full flex justify-center overflow-hidden">
      <video
        src="/tiger/tiger-walk.webm"
        autoPlay
        loop
        muted
        playsInline
        className="w-[280px] sm:w-[360px] max-w-[80vw]"
        style={{
          transform: leaving ? 'translateX(180%)' : 'translateX(0)',
          transition: leaving ? 'transform 1.2s linear' : 'none',
        }}
      />
    </div>
  )
}
