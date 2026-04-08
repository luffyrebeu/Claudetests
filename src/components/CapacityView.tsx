'use client'

import { useState, useEffect, useMemo } from 'react'
import { workingDaysInRange, absenceDaysInRange, fmt } from '@/lib/capacity'

interface Employee {
  id: number
  name: string
  color: string
  workingDaysPerWeek: number
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
          Aucun membre dans l'équipe. Ajoutez des personnes via "Manage team".
        </div>
      ) : (
        <CapacityTable rows={rows} totals={totals} />
      )}
    </div>
  )
}

interface Row { emp: { id: number; name: string; color: string; workingDaysPerWeek: number }; maxCapacity: number; absences: number; available: number }

export function CapacityTable({ rows, totals }: { rows: Row[]; totals: { max: number; absences: number; available: number } }) {
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
          {rows.map(({ emp, maxCapacity, absences, available }) => (
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
