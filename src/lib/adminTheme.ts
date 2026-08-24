// Admin theme tokens.
//
// Two decisions worth recording:
//
// LIGHT BY DEFAULT. The admin is read on a laptop under room lighting for
// long stretches while a facilitator edits content. Player and projector
// screens stay dark — those are glanced at on a phone or projected in a dim
// room, which is the opposite problem.
//
// TEAL + AMBER, not violet. Teal reads calm and professional rather than
// gamey, and it leaves amber genuinely distinct for live/active states — with
// violet everywhere, "this game is running" had no colour left to claim.

export type ThemeMode = 'light' | 'dark'

const KEY = 'bingo-admin-theme'

export function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light'
  const v = localStorage.getItem(KEY)
  return v === 'dark' ? 'dark' : 'light'
}

export function setStoredTheme(m: ThemeMode) {
  localStorage.setItem(KEY, m)
  document.documentElement.classList.toggle('admin-dark', m === 'dark')
}

export function applyStoredTheme() {
  document.documentElement.classList.toggle('admin-dark', getStoredTheme() === 'dark')
}
