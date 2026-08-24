import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useBingoAuth } from '../hooks/useBingoAuth'
import type { BingoSection } from '../types/database'

// Shared events — two or more renters running one training day together.
//
// Isolation is still the default. Joining an event grants READ ONLY sight of
// the other members' contributed boards, plus a combined scoreboard that totals
// every team across every tenant in the event. Nobody can edit anyone else's
// data here; for shared control the crew pass is the (deliberately riskier)
// tool.

type EventRow = { id: string; name: string; code: string; created_by: string | null; archived: boolean }
type Score = {
  event_id: string; team_id: string; team_name: string
  section_id: string; section_name: string; tenant_id: string | null
  tile_points: number; duel_bonus: number; manual_bonus: number
  total_points: number; tiles_done: number
}

export function BingoDashEvents() {
  const { account } = useBingoAuth()
  const [events, setEvents] = useState<EventRow[]>([])
  const [active, setActive] = useState<string | null>(null)
  const [scores, setScores] = useState<Score[]>([])
  const [myBoards, setMyBoards] = useState<BingoSection[]>([])
  const [contributed, setContributed] = useState<Set<string>>(new Set())
  const [newName, setNewName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const loadEvents = useCallback(async () => {
    const { data } = await supabase.from('bingo_events').select('*').eq('archived', false).order('created_at', { ascending: false })
    setEvents((data as EventRow[]) ?? [])
    if (!active && data?.length) setActive(data[0].id)
  }, [active])

  const loadBoards = useCallback(async () => {
    const { data } = await supabase.from('bingo_sections').select('*').order('sort_order')
    setMyBoards((data as BingoSection[]) ?? [])
  }, [])

  const loadDetail = useCallback(async (eventId: string) => {
    const [{ data: sc }, { data: eb }] = await Promise.all([
      supabase.from('event_scoreboard').select('*').eq('event_id', eventId),
      supabase.from('bingo_event_boards').select('section_id').eq('event_id', eventId),
    ])
    setScores(((sc as Score[]) ?? []).sort((a, b) => b.total_points - a.total_points))
    setContributed(new Set((eb ?? []).map(r => r.section_id as string)))
  }, [])

  useEffect(() => { void loadEvents(); void loadBoards() }, [loadEvents, loadBoards])
  useEffect(() => { if (active) void loadDetail(active) }, [active, loadDetail])

  const create = async () => {
    setBusy(true); setMsg('')
    const { data, error } = await supabase.rpc('create_event', { p_name: newName })
    setBusy(false)
    if (error) { setMsg(error.message); return }
    setNewName(''); await loadEvents()
    if (data?.id) setActive(data.id)
  }

  const join = async () => {
    setBusy(true); setMsg('')
    const { error } = await supabase.rpc('join_event', { p_code: joinCode })
    setBusy(false)
    if (error) {
      setMsg(error.message.includes('INVALID_CODE') ? 'No event with that code.' : error.message)
      return
    }
    setJoinCode(''); setMsg('Joined.'); await loadEvents()
  }

  const toggleBoard = async (sectionId: string) => {
    if (!active) return
    if (contributed.has(sectionId)) {
      await supabase.from('bingo_event_boards').delete().eq('event_id', active).eq('section_id', sectionId)
    } else {
      await supabase.from('bingo_event_boards').insert({ event_id: active, section_id: sectionId, added_by: account?.id })
    }
    await loadDetail(active)
  }

  const activeEvent = events.find(e => e.id === active) ?? null
  const mine = (t: string | null) => t === account?.id || (account?.role === 'owner' && t === null)

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-violet-400">Bingo Dash</p>
            <h1 className="text-3xl font-black">Shared events</h1>
            <p className="text-white/50 text-sm mt-1">
              Run one training day with another trainer. You see each other's boards and a combined
              scoreboard — nobody can edit anyone else's.
            </p>
          </div>
          <Link to="/bingo-dash/admin" className="px-4 py-2 rounded-xl border border-white/20 text-sm font-bold hover:bg-white/5">
            ← Admin
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="rounded-3xl border-2 border-white/10 bg-white/5 p-5">
            <h2 className="font-black mb-3">Start an event</h2>
            <input value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="e.g. Nestlé KL — 15 Aug"
              className="w-full px-4 py-3 rounded-2xl border-2 border-white/15 bg-white/5 placeholder-white/25 focus:outline-none focus:border-violet-400/60 mb-3" />
            <button onClick={() => void create()} disabled={busy || !newName.trim()}
              className="w-full py-3 rounded-2xl bg-violet-500 font-black uppercase tracking-wide disabled:opacity-40 active:scale-95 transition-transform">
              Create
            </button>
          </div>

          <div className="rounded-3xl border-2 border-white/10 bg-white/5 p-5">
            <h2 className="font-black mb-3">Join with a code</h2>
            <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="6-character code" maxLength={6}
              className="w-full px-4 py-3 rounded-2xl border-2 border-white/15 bg-white/5 placeholder-white/25 font-mono tracking-widest text-center focus:outline-none focus:border-violet-400/60 mb-3" />
            <button onClick={() => void join()} disabled={busy || joinCode.length < 4}
              className="w-full py-3 rounded-2xl border-2 border-white/20 font-black uppercase tracking-wide disabled:opacity-40 hover:bg-white/5">
              Join
            </button>
          </div>
        </div>
        {msg && <p className="text-center text-sm text-white/60 mb-4">{msg}</p>}

        {events.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-5">
            {events.map(e => (
              <button key={e.id} onClick={() => setActive(e.id)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                  active === e.id ? 'bg-violet-500 text-white' : 'border border-white/20 text-white/70 hover:bg-white/5'}`}>
                {e.name}
              </button>
            ))}
          </div>
        )}

        {activeEvent && (
          <>
            <div className="rounded-3xl border-2 border-white/10 bg-white/5 p-5 mb-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-black">Invite code</h2>
                <span className="px-4 py-1.5 rounded-xl bg-violet-500/20 border border-violet-400/50 font-mono font-black tracking-[0.3em] text-violet-200">
                  {activeEvent.code}
                </span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Your boards in this event</p>
              <div className="flex flex-wrap gap-2">
                {myBoards.length === 0 && <p className="text-white/40 text-sm">No boards yet.</p>}
                {myBoards.map(b => (
                  <button key={b.id} onClick={() => void toggleBoard(b.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      contributed.has(b.id)
                        ? 'bg-emerald-500/20 border border-emerald-400/50 text-emerald-200'
                        : 'border border-white/20 text-white/60 hover:bg-white/5'}`}>
                    {contributed.has(b.id) ? '✓ ' : '+ '}{b.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border-2 border-white/10 bg-white/5 overflow-hidden">
              <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
                <h2 className="font-black">Combined scoreboard</h2>
                <span className="text-white/40 text-xs">{scores.length} teams · all boards in this event</span>
              </div>
              {scores.length === 0 ? (
                <p className="px-5 py-8 text-center text-white/40 text-sm">
                  No boards contributed yet. Add one above, and ask the other trainer to do the same.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-widest text-white/40">
                      <th className="text-left px-5 py-2">#</th>
                      <th className="text-left py-2">Team</th>
                      <th className="text-left py-2">Board</th>
                      <th className="text-right py-2">Tiles</th>
                      <th className="text-right py-2">Duel</th>
                      <th className="text-right px-5 py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scores.map((r, i) => (
                      <tr key={r.team_id} className={`border-t border-white/5 ${mine(r.tenant_id) ? '' : 'bg-white/[0.02]'}`}>
                        <td className="px-5 py-2.5 font-black text-white/40">{i + 1}</td>
                        <td className="py-2.5 font-bold">{r.team_name}</td>
                        <td className="py-2.5 text-white/50 text-xs">
                          {r.section_name}
                          {!mine(r.tenant_id) && <span className="ml-2 text-violet-300/70">· partner</span>}
                        </td>
                        <td className="py-2.5 text-right text-white/60">{r.tiles_done}</td>
                        <td className="py-2.5 text-right text-amber-300/80">{r.duel_bonus || '—'}</td>
                        <td className="px-5 py-2.5 text-right font-black">{r.total_points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
