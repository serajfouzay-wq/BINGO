import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getContestGame } from '../lib/contestGames'
import type { BingoDuel, BingoTask } from '../types/database'

// The duel engine. One hook drives both sides of a contest card:
//
//   challenger — opens the card, picks the defender, creates the duel. Their
//                tile is crossed off when it resolves, win or lose, and earns
//                the card's normal points exactly like any other tile.
//   defender   — sees the incoming challenge, accepts, plays. Their own board is
//                never touched.
// On top of that the WINNER — either side — banks the card's contest bonus.
//
// Both phones subscribe to bingo_duels and re-fetch on visibility change,
// because iOS Safari kills websockets whenever the screen locks — the same
// failure that made the board look stuck before (see BingoDashHome).

export type DuelSide = 'challenger' | 'defender'

/** QR payload a team shows so another team can challenge it. */
export function duelQrValue(sectionId: string, teamId: string): string {
  return `bingodash-duel:${sectionId}:${teamId}`
}

/** Reads a scanned QR back. Returns null for anything that isn't one of ours. */
export function parseDuelQr(raw: string): { sectionId: string; teamId: string } | null {
  const parts = raw.trim().split(':')
  if (parts.length !== 3 || parts[0] !== 'bingodash-duel') return null
  if (!parts[1] || !parts[2]) return null
  return { sectionId: parts[1], teamId: parts[2] }
}

/** Short typed fallback for when the camera is unavailable. */
function makeCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000))
}

export function useBingoDuels(teamId: string | null, sectionId: string | null) {
  const [duels, setDuels] = useState<BingoDuel[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDuels = useCallback(async () => {
    if (!teamId) { setDuels([]); setLoading(false); return }
    const { data } = await supabase
      .from('bingo_duels')
      .select('*')
      .or(`challenger_team_id.eq.${teamId},defender_team_id.eq.${teamId}`)
      .order('created_at', { ascending: false })
    setDuels(data ?? [])
    setLoading(false)
  }, [teamId])

  useEffect(() => { void fetchDuels() }, [fetchDuels])

  // Scale note: this used to subscribe to EVERY row of bingo_duels and
  // re-fetch on each one. At a 700-player event that is one broadcast and one
  // query per phone per duel change. Now: two server-side filtered channels so
  // a phone only hears about duels it is actually in, and a short debounce so a
  // burst of updates collapses into a single fetch.
  useEffect(() => {
    if (!teamId) return
    let timer: ReturnType<typeof setTimeout> | null = null
    const nudge = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => { void fetchDuels() }, 250)
    }
    const channel = supabase
      .channel(`bingo-duels-${teamId}`)
      .on('postgres_changes',
          { event: '*', schema: 'public', table: 'bingo_duels', filter: `challenger_team_id=eq.${teamId}` }, nudge)
      .on('postgres_changes',
          { event: '*', schema: 'public', table: 'bingo_duels', filter: `defender_team_id=eq.${teamId}` }, nudge)
      .subscribe()
    return () => { if (timer) clearTimeout(timer); supabase.removeChannel(channel) }
  }, [teamId, fetchDuels])

  // Self-heal after a screen lock / backgrounded tab killed the socket.
  useEffect(() => {
    if (!teamId) return
    const resync = () => { if (document.visibilityState === 'visible') void fetchDuels() }
    document.addEventListener('visibilitychange', resync)
    window.addEventListener('focus', resync)
    return () => {
      document.removeEventListener('visibilitychange', resync)
      window.removeEventListener('focus', resync)
    }
  }, [teamId, fetchDuels])

  const sideOf = useCallback(
    (d: BingoDuel): DuelSide => (d.challenger_team_id === teamId ? 'challenger' : 'defender'),
    [teamId],
  )

  /** Challenges waiting for THIS team to accept. */
  const incoming = duels.filter(d => d.status === 'pending' && d.defender_team_id === teamId)
  /** The duel currently being played, either side. Only one runs at a time. */
  const active = duels.find(d => d.status === 'active') ?? null
  /** A challenge this team sent that nobody has accepted yet. */
  const outgoing = duels.find(d => d.status === 'pending' && d.challenger_team_id === teamId) ?? null

  const resultFor = useCallback(
    (taskId: string) => duels.find(d => d.task_id === taskId && d.status === 'done') ?? null,
    [duels],
  )

  // ── Actions ────────────────────────────────────────────────────────────────

  /** Challenger creates the duel and draws the shared setup. */
  const challenge = useCallback(async (task: BingoTask, defenderTeamId: string): Promise<{ error?: string }> => {
    if (!teamId || !sectionId) return { error: 'Not in a team yet.' }
    if (defenderTeamId === teamId) return { error: 'You can\'t challenge your own team.' }
    if (active) return { error: 'Finish your current duel first.' }

    const game = getContestGame(task.contest_game)
    const { error } = await supabase.from('bingo_duels').insert({
      section_id: sectionId,
      task_id: task.id,
      challenger_team_id: teamId,
      defender_team_id: defenderTeamId,
      game_key: game.key,
      status: 'pending',
      payload: game.draw(),   // drawn ONCE — both phones read this row
      bonus_points: task.contest_bonus ?? 0,
      code: makeCode(),
    })
    if (error) return { error: error.message }
    await fetchDuels()
    return {}
  }, [teamId, sectionId, active, fetchDuels])

  /** Defender accepts — this is what unlocks the clue on both phones. */
  const accept = useCallback(async (duelId: string) => {
    await supabase.from('bingo_duels')
      .update({ status: 'active', started_at: new Date().toISOString() })
      .eq('id', duelId).eq('status', 'pending')
    await fetchDuels()
  }, [fetchDuels])

  const decline = useCallback(async (duelId: string) => {
    await supabase.from('bingo_duels').update({ status: 'declined' }).eq('id', duelId).eq('status', 'pending')
    await fetchDuels()
  }, [fetchDuels])

  const cancel = useCallback(async (duelId: string) => {
    await supabase.from('bingo_duels').update({ status: 'cancelled' }).eq('id', duelId).in('status', ['pending', 'active'])
    await fetchDuels()
  }, [fetchDuels])

  /**
   * Marshal declares the winner. This is the only place duel scoring happens:
   *   • the challenger's tile is crossed off either way (they spent it) and
   *     earns its normal points, same as any other tile;
   *   • the winner — challenger or defender — banks the contest bonus, which
   *     lives on the duel row so a winning defender can score without their own
   *     board being touched.
   */
  /**
   * Marshal declares the winner. Resolution is server-side only:
   * resolve_duel() validates the per-duel referee code, crosses off the
   * challenger's tile, awards the sticker to the challenger and the bonus
   * to the winner, then burns the code. Players can no longer write the
   * winner directly — the anon UPDATE policy forbids it.
   */
  const resolve = useCallback(async (duel: BingoDuel, winnerTeamId: string, code: string) => {
    const { error } = await supabase.rpc('resolve_duel', {
      p_duel: duel.id, p_code: code, p_winner: winnerTeamId,
    })
    if (error) {
      const m = error.message || ''
      if (m.includes('BAD_CODE'))        return { error: 'Wrong referee code.' }
      if (m.includes('NO_CODE_ISSUED'))  return { error: 'No code issued yet — ask the marshal.' }
      if (m.includes('DUEL_NOT_ACTIVE')) return { error: 'This duel is no longer active.' }
      return { error: m }
    }
    await fetchDuels()
    return {}
  }, [fetchDuels])

  return {
    duels, loading, incoming, active, outgoing,
    sideOf, resultFor,
    challenge, accept, decline, cancel, resolve,
    refresh: fetchDuels,
  }
}

/**
 * Contest bonus each team earned by WINNING duels. Separate from tile points
 * because a winning defender has no tile to hang them on.
 */
export function duelBonusByTeam(duels: BingoDuel[]): Map<string, number> {
  const out = new Map<string, number>()
  for (const d of duels) {
    if (d.status !== 'done' || !d.winner_team_id) continue
    out.set(d.winner_team_id, (out.get(d.winner_team_id) ?? 0) + (d.bonus_points ?? 0))
  }
  return out
}
