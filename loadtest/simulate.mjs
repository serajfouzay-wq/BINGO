// Load simulator for a live Bingo Dash event.
//
// Opens N concurrent Supabase clients, each behaving like one player's phone:
// subscribes to its team's scans, polls the board, and periodically completes
// a tile. Reports connection success, realtime latency and query timing so you
// can see where it degrades BEFORE 700 real people are in the room.
//
//   node loadtest/simulate.mjs --clients 200 --minutes 3
//
// Point it at the TEST project only.

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync('.env', 'utf8').split('\n').filter(Boolean)
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const URL = env.VITE_SUPABASE_URL
const KEY = env.VITE_SUPABASE_ANON_KEY
if (!URL || URL.includes('PASTE')) { console.error('No usable VITE_SUPABASE_URL in .env'); process.exit(1) }

const arg = (k, d) => {
  const i = process.argv.indexOf('--' + k)
  return i === -1 ? d : Number(process.argv[i + 1])
}
const CLIENTS = arg('clients', 100)
const MINUTES = arg('minutes', 2)

const stats = {
  connected: 0, failed: 0, events: 0, queries: 0, queryErrors: 0,
  latencies: [], queryMs: [],
}
const pct = (a, p) => {
  if (!a.length) return 0
  const s = [...a].sort((x, y) => x - y)
  return Math.round(s[Math.floor(s.length * p)] ?? 0)
}

console.log(`\nTarget: ${URL}`)
console.log(`Spinning up ${CLIENTS} clients for ${MINUTES} min...\n`)

// One real board + team to act against.
const probe = createClient(URL, KEY)
const { data: sections } = await probe.from('bingo_sections').select('id, name').limit(1)
const section = sections?.[0]
if (!section) { console.error('No board found. Seed one first.'); process.exit(1) }
const { data: teams } = await probe.from('bingo_teams').select('id, name').eq('section_id', section.id)
const { data: tasks } = await probe.from('bingo_tasks').select('id').eq('section_id', section.id)
if (!teams?.length || !tasks?.length) { console.error('Board has no teams or cards.'); process.exit(1) }
console.log(`Board "${section.name}" · ${teams.length} teams · ${tasks.length} cards\n`)

const clients = []
for (let i = 0; i < CLIENTS; i++) {
  const team = teams[i % teams.length]
  const sb = createClient(URL, KEY, { realtime: { params: { eventsPerSecond: 10 } } })
  const ch = sb.channel(`load-${i}`)
    .on('postgres_changes',
        { event: '*', schema: 'public', table: 'bingo_scans', filter: `team_id=eq.${team.id}` },
        (payload) => {
          stats.events++
          const t = payload.commit_timestamp ? Date.parse(payload.commit_timestamp) : null
          if (t) stats.latencies.push(Date.now() - t)
        })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') stats.connected++
      else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') stats.failed++
    })
  clients.push({ sb, ch, team })
  if (i % 25 === 24) { await new Promise(r => setTimeout(r, 200)) }  // stagger, as real arrivals do
}

// Each client behaves like a phone: reads the board, occasionally scores.
const tick = setInterval(async () => {
  const c = clients[Math.floor(Math.random() * clients.length)]
  const t0 = Date.now()
  try {
    await c.sb.from('bingo_scans').select('*').eq('team_id', c.team.id)
    stats.queryMs.push(Date.now() - t0)
    stats.queries++
    if (Math.random() < 0.25) {
      const task = tasks[Math.floor(Math.random() * tasks.length)]
      await c.sb.from('bingo_scans')
        .upsert({ team_id: c.team.id, task_id: task.id, completed: true,
                  completed_at: new Date().toISOString() }, { onConflict: 'team_id,task_id' })
    }
  } catch { stats.queryErrors++ }
}, 100)

const report = setInterval(() => {
  console.log(
    `connected ${stats.connected}/${CLIENTS}` +
    ` · failed ${stats.failed}` +
    ` · events ${stats.events}` +
    ` · queries ${stats.queries} (err ${stats.queryErrors})` +
    ` · query p50 ${pct(stats.queryMs, .5)}ms p95 ${pct(stats.queryMs, .95)}ms` +
    ` · realtime p95 ${pct(stats.latencies, .95)}ms`)
}, 5000)

setTimeout(async () => {
  clearInterval(tick); clearInterval(report)
  console.log('\n──────── RESULT ────────')
  console.log(`clients          ${CLIENTS}`)
  console.log(`connected        ${stats.connected}  (${Math.round(stats.connected / CLIENTS * 100)}%)`)
  console.log(`failed           ${stats.failed}`)
  console.log(`realtime events  ${stats.events}`)
  console.log(`queries          ${stats.queries}  errors ${stats.queryErrors}`)
  console.log(`query    p50/p95 ${pct(stats.queryMs, .5)} / ${pct(stats.queryMs, .95)} ms`)
  console.log(`realtime p50/p95 ${pct(stats.latencies, .5)} / ${pct(stats.latencies, .95)} ms`)
  console.log('\nRough guide: query p95 under 500ms and realtime p95 under 2s is healthy.')
  console.log('Connection failures mean you have hit the plan\'s concurrent limit.\n')
  for (const c of clients) await c.sb.removeChannel(c.ch)
  process.exit(0)
}, MINUTES * 60000)
