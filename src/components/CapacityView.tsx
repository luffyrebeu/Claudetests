'use client'

import { Fragment, useState, useEffect, useMemo } from 'react'
import { workingDaysInRange, absenceDaysInRange, fmt } from '@/lib/capacity'

interface Employee {
  id: number
  name: string
  color: string
  workingDaysPerWeek: number
  team: string
}

interface Holiday {
  id: number
  employeeId: number
  startDate: string
  endDate: string
}

interface PublicHoliday {
  id: number
  date: string
}

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

function lastDayOfMonth(year: number, month: number): string {
  const d = new Date(year, month, 0).getDate()
  return `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export default function CapacityView() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const [employees, setEmployees] = useState<Employee[]>([])
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [publicHolidays, setPublicHolidays] = useState<PublicHoliday[]>([])
  const [loading, setLoading] = useState(true)

  const monthStr  = `${year}-${String(month).padStart(2, '0')}`
  const rangeFrom = `${monthStr}-01`
  const rangeTo   = lastDayOfMonth(year, month)

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) } else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1) } else setMonth(m => m + 1)
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch('/api/employees').then(r => r.ok ? r.json() : []),
      fetch(`/api/holidays?from=${rangeFrom}&to=${rangeTo}`).then(r => r.ok ? r.json() : []),
      fetch('/api/public-holidays').then(r => r.ok ? r.json() : []),
    ]).then(([emps, hols, phs]) => {
      setEmployees(Array.isArray(emps) ? emps : [])
      setHolidays(Array.isArray(hols) ? hols : [])
      setPublicHolidays(Array.isArray(phs) ? phs : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [rangeFrom, rangeTo])

  const rows = useMemo(() => {
    const phDates = new Set(publicHolidays.map(h => h.date))
    const totalWorkingDays = workingDaysInRange(rangeFrom, rangeTo, phDates)

    return employees.map(emp => {
      const maxCapacity = totalWorkingDays * (emp.workingDaysPerWeek / 5)
      const absences = holidays
        .filter(h => h.employeeId === emp.id)
        .reduce((sum, h) => sum + absenceDaysInRange(h.startDate, h.endDate, rangeFrom, rangeTo, phDates), 0)
      const available = Math.max(0, maxCapacity - absences)
      return { emp, maxCapacity, absences, available }
    })
  }, [employees, holidays, publicHolidays, rangeFrom, rangeTo])

  const totals = useMemo(() => ({
    max: rows.reduce((s, r) => s + r.maxCapacity, 0),
    absences: rows.reduce((s, r) => s + r.absences, 0),
    available: rows.reduce((s, r) => s + r.available, 0),
  }), [rows])

  const phDates = new Set(publicHolidays.map(h => h.date))
  const totalWorkingDays = workingDaysInRange(rangeFrom, rangeTo, phDates)
  const monthPublicHolidays = publicHolidays.filter(h => h.date.startsWith(monthStr))

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-600">←</button>
        <h2 className="text-lg font-medium text-gray-900 w-44 text-center">
          {MONTH_NAMES[month - 1]} {year}
        </h2>
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-600">→</button>
        <span className="text-sm text-gray-400 ml-2">
          {totalWorkingDays} jours ouvrés
          {monthPublicHolidays.length > 0 && (
            <> · {monthPublicHolidays.length} jour{monthPublicHolidays.length > 1 ? 's' : ''} férié{monthPublicHolidays.length > 1 ? 's' : ''}</>
          )}
        </span>
      </div>

      {loading ? (
        <div className="py-8 text-center text-gray-400">Chargement…</div>
      ) : employees.length === 0 ? (
        <div className="py-8 text-center text-gray-400">
          Aucun membre dans l'équipe. Ajoutez des personnes via &ldquo;Gérer l'équipe&rdquo;.
        </div>
      ) : (
        <CapacityTable rows={rows} totals={totals} />
      )}
    </div>
  )
}

interface Row {
  emp: { id: number; name: string; color: string; workingDaysPerWeek: number; team: string }
  maxCapacity: number
  absences: number
  available: number
}

const TEAM_BADGE: Record<string, string> = {
  MOA: 'bg-amber-100 text-amber-700',
  MOE: 'bg-purple-100 text-purple-700',
  DS:  'bg-teal-100 text-teal-700',
}

const GROUPS: { key: string; label: string; headerCls: string; teams: string[] }[] = [
  { key: 'BD6', label: 'BD6',  headerCls: 'bg-indigo-50 text-indigo-800', teams: ['MOA', 'MOE'] },
  { key: 'DS',  label: 'DS',   headerCls: 'bg-teal-50 text-teal-800',     teams: ['DS'] },
]

function groupTotals(rows: Row[]) {
  return {
    max: rows.reduce((s, r) => s + r.maxCapacity, 0),
    absences: rows.reduce((s, r) => s + r.absences, 0),
    available: rows.reduce((s, r) => s + r.available, 0),
  }
}

export function CapacityTable({ rows, totals }: { rows: Row[]; totals: { max: number; absences: number; available: number } }) {
  const allGroupedTeams = GROUPS.flatMap(g => g.teams)
  const ungrouped = rows.filter(r => !allGroupedTeams.includes(r.emp.team))

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Personne</th>
            <th className="text-right px-4 py-3 font-medium text-gray-600">Capacité max</th>
            <th className="text-right px-4 py-3 font-medium text-gray-600">Absences</th>
            <th className="text-right px-4 py-3 font-medium text-gray-600">Disponible</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {GROUPS.map(group => {
            const groupRows = rows.filter(r => group.teams.includes(r.emp.team))
            if (groupRows.length === 0) return null
            const gt = groupTotals(groupRows)
            return (
              <Fragment key={group.key}>
                {/* Group header */}
                <tr className={group.headerCls}>
                  <td colSpan={4} className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider">
                    {group.label}
                  </td>
                </tr>
                {/* Member rows */}
                {groupRows.map(({ emp, maxCapacity, absences, available }) => (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: emp.color }} />
                        <span className="text-gray-800">{emp.name}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${TEAM_BADGE[emp.team] ?? 'bg-gray-100 text-gray-600'}`}>
                          {emp.team}
                        </span>
                        <span className="text-xs text-gray-400">({emp.workingDaysPerWeek}j/sem)</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{fmt(maxCapacity)}</td>
                    <td className="px-4 py-3 text-right text-orange-600">
                      {absences > 0 ? `-${fmt(absences)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      <span className={available < maxCapacity * 0.5 ? 'text-red-600' : 'text-green-700'}>
                        {fmt(available)}
                      </span>
                    </td>
                  </tr>
                ))}
                {/* Group subtotal */}
                <tr className="bg-gray-50 border-t border-gray-200">
                  <td className="px-4 py-2 pl-8 text-xs font-semibold text-gray-600">
                    Sous-total {group.label}
                  </td>
                  <td className="px-4 py-2 text-right text-xs font-semibold text-gray-700">{fmt(gt.max)}</td>
                  <td className="px-4 py-2 text-right text-xs font-semibold text-orange-600">
                    {gt.absences > 0 ? `-${fmt(gt.absences)}` : '—'}
                  </td>
                  <td className="px-4 py-2 text-right text-xs font-bold text-gray-900">{fmt(gt.available)}</td>
                </tr>
              </Fragment>
            )
          })}
          {/* Ungrouped employees (no team or unknown team) */}
          {ungrouped.map(({ emp, maxCapacity, absences, available }) => (
            <tr key={emp.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: emp.color }} />
                  <span className="text-gray-800">{emp.name}</span>
                  <span className="text-xs text-gray-400">({emp.workingDaysPerWeek}j/sem)</span>
                </div>
              </td>
              <td className="px-4 py-3 text-right text-gray-700">{fmt(maxCapacity)}</td>
              <td className="px-4 py-3 text-right text-orange-600">
                {absences > 0 ? `-${fmt(absences)}` : '—'}
              </td>
              <td className="px-4 py-3 text-right font-semibold">
                <span className={available < maxCapacity * 0.5 ? 'text-red-600' : 'text-green-700'}>
                  {fmt(available)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t-2 border-gray-300 bg-gray-50">
          <tr>
            <td className="px-4 py-3 font-semibold text-gray-800">Total équipe</td>
            <td className="px-4 py-3 text-right font-semibold text-gray-700">{fmt(totals.max)}</td>
            <td className="px-4 py-3 text-right font-semibold text-orange-600">
              {totals.absences > 0 ? `-${fmt(totals.absences)}` : '—'}
            </td>
            <td className="px-4 py-3 text-right font-bold text-gray-900">{fmt(totals.available)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
