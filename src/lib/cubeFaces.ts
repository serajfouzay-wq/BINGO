// Cube board geometry.
//
// A session opens 1, 2 or 6 faces. Each face is an ordinary 5x5 with the
// existing bingo line rules — deliberately unchanged, so a cube board is
// "more board", not a different game nobody can explain to a room. Points
// scale simply because there are more faces to complete.
//
//   slot 0..24    -> face 0
//   slot 25..49   -> face 1
//   ...
//   slot 125..149 -> face 5

export const TILES_PER_FACE = 25
export const MAX_FACES = 6

export type FaceCount = 1 | 2 | 6

export const FACE_NAMES = [
  'Front', 'Back', 'Left', 'Right', 'Top', 'Bottom',
] as const

/** Colour per face so a player can tell at a glance which one they are on. */
export const FACE_COLORS = [
  '#0d9488', '#d97706', '#7c3aed', '#0ea5e9', '#dc2626', '#65a30d',
] as const

export function faceOf(slot: number): number {
  return Math.floor(slot / TILES_PER_FACE)
}

export function positionOnFace(slot: number): number {
  return slot % TILES_PER_FACE
}

export function slotFor(face: number, position: number): number {
  return face * TILES_PER_FACE + position
}

export function normaliseFaceCount(n: number | null | undefined): FaceCount {
  return n === 6 ? 6 : n === 2 ? 2 : 1
}

/** The face indices actually in play for a board. */
export function activeFaces(faceCount: number | null | undefined): number[] {
  return Array.from({ length: normaliseFaceCount(faceCount) }, (_, i) => i)
}

export function faceName(i: number): string {
  return FACE_NAMES[i] ?? `Face ${i + 1}`
}

export function faceColor(i: number): string {
  return FACE_COLORS[i] ?? '#6b7280'
}

/**
 * CSS transform placing a face of a cube of the given size. Used by the
 * projector's rotating cube; the admin and player use flat grids because
 * hunting for a tile by rotating a cube on a phone is slower than scanning.
 */
export function faceTransform(i: number, size: number): string {
  const d = size / 2
  switch (i) {
    case 0: return `translateZ(${d}px)`
    case 1: return `rotateY(180deg) translateZ(${d}px)`
    case 2: return `rotateY(-90deg) translateZ(${d}px)`
    case 3: return `rotateY(90deg) translateZ(${d}px)`
    case 4: return `rotateX(90deg) translateZ(${d}px)`
    default: return `rotateX(-90deg) translateZ(${d}px)`
  }
}
