import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useBingoAuth } from '../hooks/useBingoAuth'

// A renter's own account page.
//
// Everything here is scoped to auth.uid() by my_account_summary, so a renter
// sees their own company, plan and usage and nothing about any other tenant.
// Limits are read-only: only the owner can raise them, via set_account_plan().

type Summary = {
  id: string
  email: string | null
  company_name: string | null
  contact_name: string | null
  phone: string | null
  display_name: string | null
  plan: string
  max_boards: number
  max_teams_per_board: number
  plan_expires_at: string | null
  status: string
  role: string
  boards_used: number
  active_crew_passes: number
}

export function BingoDashAccount() {
  const { isOwner } = useBingoAuth()
  const [s, setS] = useState<Summary | null>(null)
  const [company, setCompany] = useState('')
  const [contact, setContact] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    const { data } = await supabase.from('my_account_summary').select('*').maybeSingle()
    if (data) {
      const row = data as Summary
      setS(row)
      setCompany(row.company_name ?? '')
      setContact(row.contact_name ?? '')
      setPhone(row.phone ?? '')
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const save = async () => {
    setSaving(true); setMsg('')
    const { error } = await supabase.rpc('update_my_profile', {
      p_company: company, p_contact: contact, p_phone: phone, p_display: contact,
    })
    setSaving(false)
    setMsg(error ? error.message : 'Saved.')
    if (!error) await load()
  }

  if (!s) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400 font-bold animate-pulse">Loading...</p>
      </div>
    )
  }

  const boardsLeft = Math.max(0, s.max_boards - s.boards_used)
  const expired = s.plan_expires_at && new Date(s.plan_expires_at) < new Date()

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-violet-400">Bingo Dash</p>
            <h1 className="text-3xl font-black">My account</h1>
          </div>
          <Link to="/bingo-dash/admin"
                className="px-4 py-2 rounded-xl border border-white/20 text-sm font-bold hover:bg-white/5">
            ← Admin
          </Link>
        </div>

        {/* Plan + usage */}
        <div className="rounded-3xl border-2 border-white/10 bg-white/5 p-6 mb-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Plan</p>
              <p className="text-2xl font-black capitalize">{s.plan}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
              s.status === 'approved' ? 'bg-emerald-400/20 text-emerald-300' : 'bg-amber-400/20 text-amber-300'}`}>
              {s.status}
            </span>
          </div>

          {expired && (
            <p className="mb-4 p-3 rounded-2xl bg-red-500/15 border border-red-400/40 text-red-200 text-sm font-bold">
              Your plan expired. Contact the organiser to renew.
            </p>
          )}

          <div className="grid grid-cols-3 gap-3">
            <Stat label="Boards" value={`${s.boards_used} / ${s.max_boards}`}
                  sub={boardsLeft === 0 ? 'Limit reached' : `${boardsLeft} left`} />
            <Stat label="Teams per board" value={String(s.max_teams_per_board)} />
            <Stat label="Active crew passes" value={String(s.active_crew_passes)} />
          </div>

          {!isOwner && (
            <p className="text-white/40 text-xs mt-4">
              Need more boards or teams? Ask the organiser to raise your limits.
            </p>
          )}
        </div>

        {/* Profile */}
        <div className="rounded-3xl border-2 border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-black mb-4">Your details</h2>
          <Field label="Company" value={company} onChange={setCompany} placeholder="Acme Sdn Bhd" />
          <Field label="Contact name" value={contact} onChange={setContact} placeholder="Full name" />
          <Field label="Phone" value={phone} onChange={setPhone} placeholder="+60 12 345 6789" />
          <p className="text-white/40 text-xs mb-4">Sign-in email: {s.email ?? '—'}</p>
          <button onClick={() => void save()} disabled={saving}
                  className="w-full py-3 rounded-2xl bg-violet-500 font-black uppercase tracking-wide active:scale-95 transition-transform disabled:opacity-50">
            {saving ? 'Saving...' : 'Save details'}
          </button>
          {msg && <p className="text-center text-sm mt-3 text-white/60">{msg}</p>}
        </div>

        <div className="mt-5 flex gap-3">
          <Link to="/bingo-dash/crew"
                className="flex-1 py-3 rounded-2xl border border-white/20 text-center font-bold text-sm hover:bg-white/5">
            👥 Crew passes
          </Link>
          <Link to="/bingo-dash/admin"
                className="flex-1 py-3 rounded-2xl border border-white/20 text-center font-bold text-sm hover:bg-white/5">
            🎯 My boards
          </Link>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-black/30 border border-white/10 p-3">
      <p className="text-[9px] font-black uppercase tracking-widest text-white/40">{label}</p>
      <p className="text-xl font-black mt-1">{value}</p>
      {sub && <p className="text-[10px] text-white/40 mt-0.5">{sub}</p>}
    </div>
  )
}

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <label className="block mb-3">
      <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{label}</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full px-4 py-3 rounded-2xl border-2 border-white/15 bg-white/5 text-white placeholder-white/25 focus:outline-none focus:border-violet-400/60"
      />
    </label>
  )
}
