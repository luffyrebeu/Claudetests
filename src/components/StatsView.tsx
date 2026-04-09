'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { workingDaysInRange, absenceDaysInRange, fmt } from '@/lib/capacity'

interface Employee {
  id: number
  name: string
  color: string
  workingDaysPerWeek: number
  team: string
}

interface Sprint {
  id: number
  name: string
  startDate: string
  endDate: string
  piId: number | null
}

interface PIData {
  id: number
  name: string
  startDate: string
  endDate: string
  sprints: Sprint[]
}

interface Holiday {
  id: number
  employeeId: number
  startDate: string
  endDate: string
  type: string
}

interface PublicHoliday {
  id: number
  date: string
}

const BD6_TEAMS = ['MOA', 'MOE']

function computeRangeStats(
  startDate: string,
  endDate: string,
  employees: Employee[],
  holidays: Holiday[],
  phDates: Set<string>
) {
  const workingDays = workingDaysInRange(startDate, endDate, phDates)
  let max = 0, absences = 0, bd6Max = 0, bd6Abs = 0, dsMax = 0, dsAbs = 0

  const rangeHols = holidays.filter(h => h.startDate <= endDate && h.endDate >= startDate)

  for (const emp of employees) {
    const empMax = workingDays * (emp.workingDaysPerWeek / 5)
    const empAbs = rangeHols
      .filter(h => h.employeeId === emp.id)
      .reduce((s, h) => s + absenceDaysInRange(h.startDate, h.endDate, startDate, endDate, phDates), 0)

    max += empMax
    absences += empAbs

    if (BD6_TEAMS.includes(emp.team)) { bd6Max += empMax; bd6Abs += empAbs }
    else if (emp.team === 'DS')        { dsMax  += empMax; dsAbs  += empAbs }
  }

  const available    = Math.max(0, max - absences)
  const bd6Available = Math.max(0, bd6Max - bd6Abs)
  const dsAvailable  = Math.max(0, dsMax  - dsAbs)
  const pct = max > 0 ? Math.round((available / max) * 100) : 0

  return { max, absences, available, pct, workingDays, bd6Max, bd6Available, dsMax, dsAvailable }
}

function trunc(s: string, n = 12) {
  return s.length > n ? s.slice(0, n) + '…' : s
}

// ── Custom tooltip ─────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: {color: string; name: string; value: number}[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-xl p-3 text-sm min-w-[180px]">
      <p className="font-semibold text-gray-900 pb-1.5 mb-1.5 border-b border-gray-100">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: p.color }} />
            <span className="text-gray-500">{p.name}</span>
          </div>
          <span className="font-semibold text-gray-900">
            {p.name === '% Dispo' ? `${p.value}%` : `${fmt(p.value)} j`}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── KPI card ───────────────────────────────────────────────────────────────────

type Accent = 'blue' | 'green' | 'orange' | 'indigo' | 'teal'

const ACCENT_CLS: Record<Accent, string> = {
  blue:   'bg-blue-50   border-blue-100   text-blue-700',
  green:  'bg-emerald-50 border-emerald-100 text-emerald-700',
  orange: 'bg-amber-50  border-amber-100  text-amber-700',
  indigo: 'bg-indigo-50 border-indigo-100 text-indigo-700',
  teal:   'bg-teal-50   border-teal-100   text-teal-700',
}

function KPICard({ label, value, sub, accent = 'blue' }: { label: string; value: string; sub?: string; accent?: Accent }) {
  return (
    <div className={`rounded-xl border p-4 ${ACCENT_CLS[accent]}`}>
      <p className="text-xs font-medium uppercase tracking-wider opacity-60 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs opacity-50 mt-0.5">{sub}</p>}
    </div>
  )
}

// ── Chart wrapper ──────────────────────────────────────────────────────────────

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-800 mb-5">{title}</h3>
      {children}
    </div>
  )
}

// ── Axis defaults ──────────────────────────────────────────────────────────────

const TICK = { fontSize: 11, fill: '#9ca3af' }
const GRID = { strokeDasharray: '3 3', stroke: '#f3f4f6', vertical: false as const }

// ── Main component ─────────────────────────────────────────────────────────────

export default function StatsView() {
  const [section, setSection] = useState<'sprints' | 'pi'>('sprints')
  const [employees, setEmployees]       = useState<Employee[]>([])
  const [sprints, setSprints]           = useState<Sprint[]>([])
  const [pis, setPIs]                   = useState<PIData[]>([])
  const [holidays, setHolidays]         = useState<Holiday[]>([])
  const [publicHolidays, setPH]         = useState<PublicHoliday[]>([])
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch('/api/employees').then(r => r.ok ? r.json() : []),
      fetch('/api/sprints').then(r => r.ok ? r.json() : []),
      fetch('/api/pi').then(r => r.ok ? r.json() : []),
      fetch('/api/holidays').then(r => r.ok ? r.json() : []),
      fetch('/api/public-holidays').then(r => r.ok ? r.json() : []),
    ]).then(([emps, sps, piList, hols, phs]) => {
      setEmployees(Array.isArray(emps)   ? emps   : [])
      setSprints(Array.isArray(sps)      ? sps    : [])
      setPIs(Array.isArray(piList)       ? piList : [])
      setHolidays(Array.isArray(hols)    ? hols   : [])
      setPH(Array.isArray(phs)           ? phs    : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const phDates = useMemo(() => new Set(publicHolidays.map(h => h.date)), [publicHolidays])

  const sprintData = useMemo(() =>
    sprints.map(s => {
      const st = computeRangeStats(s.startDate, s.endDate, employees, holidays, phDates)
      return { ...st, id: s.id, shortName: trunc(s.name), name: s.name }
    }),
    [sprints, employees, holidays, phDates]
  )

  const piData = useMemo(() =>
    pis.map(pi => {
      const st = computeRangeStats(pi.startDate, pi.endDate, employees, holidays, phDates)
      return { ...st, id: pi.id, shortName: trunc(pi.name, 14), name: pi.name, sprintCount: pi.sprints.length }
    }),
    [pis, employees, holidays, phDates]
  )

  const sprintKPIs = useMemo(() => {
    const n = sprintData.length
    if (!n) return { count: 0, avgPct: 0, totalAbs: 0, totalMax: 0 }
    return {
      count:    n,
      avgPct:   Math.round(sprintData.reduce((s, r) => s + r.pct, 0) / n),
      totalAbs: sprintData.reduce((s, r) => s + r.absences, 0),
      totalMax: sprintData.reduce((s, r) => s + r.max, 0),
    }
  }, [sprintData])

  const piKPIs = useMemo(() => {
    const n = piData.length
    if (!n) return { count: 0, bestPct: 0, totalAbs: 0, totalMax: 0 }
    return {
      count:    n,
      bestPct:  Math.max(...piData.map(r => r.pct)),
      totalAbs: piData.reduce((s, r) => s + r.absences, 0),
      totalMax: piData.reduce((s, r) => s + r.max, 0),
    }
  }, [piData])

  const showTeamChart = employees.some(e => BD6_TEAMS.includes(e.team)) && employees.some(e => e.team === 'DS')
  const marginBottom  = { top: 5, right: 44, left: 0, bottom: 30 }

  if (loading) return <div className="py-12 text-center text-gray-400">Chargement…</div>

  return (
    <div className="space-y-6">
      {/* Section toggle */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(['sprints', 'pi'] as const).map(s => (
          <button
            key={s}
            onClick={() => setSection(s)}
            className={`px-5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              section === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {s === 'sprints' ? 'Sprints' : 'PI Planning'}
          </button>
        ))}
      </div>

      {/* ── SPRINTS ──────────────────────────────────────────────────────────── */}
      {section === 'sprints' && (
        sprintData.length === 0 ? (
          <div className="py-16 text-center text-gray-400">Aucun sprint créé.</div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4">
              <KPICard label="Sprints analysés"    value={String(sprintKPIs.count)}   accent="blue" />
              <KPICard label="Taux dispo moyen"    value={`${sprintKPIs.avgPct}%`}    sub="disponible / capacité max" accent="green" />
              <KPICard label="Total absences"      value={`${fmt(sprintKPIs.totalAbs)} j`}
                       sub={`sur ${fmt(sprintKPIs.totalMax)} j max`} accent="orange" />
            </div>

            <ChartCard title="Évolution de la capacité par sprint">
              <ResponsiveContainer width="100%" height={290}>
                <ComposedChart data={sprintData} margin={marginBottom}>
                  <CartesianGrid {...GRID} />
                  <XAxis dataKey="shortName" tick={TICK} angle={-30} textAnchor="end" interval={0} height={52} />
                  <YAxis yAxisId="l" tick={TICK} width={42} />
                  <YAxis yAxisId="r" orientation="right" tickFormatter={v => `${v}%`} tick={TICK} domain={[0, 100]} width={42} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  <Bar yAxisId="l" dataKey="available" name="Disponible" stackId="a" fill="#10b981" maxBarSize={56} />
                  <Bar yAxisId="l" dataKey="absences"  name="Absences"   stackId="a" fill="#f59e0b" radius={[4,4,0,0]} maxBarSize={56} />
                  <Line yAxisId="r" type="monotone" dataKey="pct" name="% Dispo"
                    stroke="#6366f1" strokeWidth={2.5}
                    dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }}
                    activeDot={{ r: 6 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>

            {showTeamChart && (
              <ChartCard title="Disponibilité BD6 vs DS par sprint">
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={sprintData} margin={marginBottom}>
                    <CartesianGrid {...GRID} />
                    <XAxis dataKey="shortName" tick={TICK} angle={-30} textAnchor="end" interval={0} height={52} />
                    <YAxis tick={TICK} width={42} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                    <Bar dataKey="bd6Available" name="BD6 disponible" fill="#6366f1" radius={[4,4,0,0]} maxBarSize={48} />
                    <Bar dataKey="dsAvailable"  name="DS disponible"  fill="#0d9488" radius={[4,4,0,0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}
          </>
        )
      )}

      {/* ── PI PLANNING ──────────────────────────────────────────────────────── */}
      {section === 'pi' && (
        piData.length === 0 ? (
          <div className="py-16 text-center text-gray-400">Aucun PI créé.</div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4">
              <KPICard label="PIs analysés"        value={String(piKPIs.count)}      accent="indigo" />
              <KPICard label="Meilleur taux dispo" value={`${piKPIs.bestPct}%`}      accent="green" />
              <KPICard label="Total absences"      value={`${fmt(piKPIs.totalAbs)} j`}
                       sub={`sur ${fmt(piKPIs.totalMax)} j max`} accent="orange" />
            </div>

            <ChartCard title="Capacité par PI">
              <ResponsiveContainer width="100%" height={290}>
                <ComposedChart data={piData} margin={marginBottom}>
                  <CartesianGrid {...GRID} />
                  <XAxis dataKey="shortName" tick={TICK} angle={-20} textAnchor="end" interval={0} height={52} />
                  <YAxis yAxisId="l" tick={TICK} width={42} />
                  <YAxis yAxisId="r" orientation="right" tickFormatter={v => `${v}%`} tick={TICK} domain={[0, 100]} width={42} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  <Bar yAxisId="l" dataKey="available" name="Disponible" stackId="a" fill="#10b981" maxBarSize={64} />
                  <Bar yAxisId="l" dataKey="absences"  name="Absences"   stackId="a" fill="#f59e0b" radius={[4,4,0,0]} maxBarSize={64} />
                  <Line yAxisId="r" type="monotone" dataKey="pct" name="% Dispo"
                    stroke="#6366f1" strokeWidth={2.5}
                    dot={{ r: 5, fill: '#6366f1', strokeWidth: 0 }}
                    activeDot={{ r: 7 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>

            {showTeamChart && (
              <ChartCard title="Disponibilité BD6 vs DS par PI">
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={piData} margin={marginBottom}>
                    <CartesianGrid {...GRID} />
                    <XAxis dataKey="shortName" tick={TICK} angle={-20} textAnchor="end" interval={0} height={52} />
                    <YAxis tick={TICK} width={42} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                    <Bar dataKey="bd6Available" name="BD6 disponible" fill="#6366f1" radius={[4,4,0,0]} maxBarSize={60} />
                    <Bar dataKey="dsAvailable"  name="DS disponible"  fill="#0d9488" radius={[4,4,0,0]} maxBarSize={60} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}
          </>
        )
      )}
    </div>
  )
}
