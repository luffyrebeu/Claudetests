'use client'

import { useState, useEffect, useMemo } from 'react'
import { workingDaysInRange, absenceDaysInRange } from '@/lib/capacity'
import { CapacityTable } from './CapacityView'

interface SprintSummary {
  id: number
  name: string
  startDate: string
  endDate: string
}

interface PI {
  id: number
  name: string
  startDate: string
  endDate: string
  sprints: SprintSummary[]
}

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

function formatDate(str: string): string {
  const [y, m, d] = str.split('-')
  return `${d}/${m}/${y}`
}

function piStatus(pi: PI, today: string): 'past' | 'current' | 'future' {
  if (pi.endDate < today) return 'past'
  if (pi.startDate <= today) return 'current'
  return 'future'
}

const STATUS_STYLES = {
  past:    'bg-gray-100 text-gray-500',
  current: 'bg-green-100 text-green-700',
  future:  'bg-blue-100 text-blue-700',
}
const STATUS_LABELS = { past: 'Passé', current: 'En cours', future: 'À venir' }

export default function PIView() {
  const today = new Date().toISOString().split('T')[0]

  const [pis, setPIs] = useState<PI[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [publicHolidays, setPublicHolidays] = useState<PublicHoliday[]>([])
  const [loadingBase, setLoadingBase] = useState(true)
  const [loadingHolidays, setLoadingHolidays] = useState(false)

  useEffect(() => {
    setLoadingBase(true)
    Promise.all([
      fetch('/api/pi').then(r => r.ok ? r.json() : []),
      fetch('/api/employees').then(r => r.ok ? r.json() : []),
      fetch('/api/public-holidays').then(r => r.ok ? r.json() : []),
    ]).then(([piList, emps, phs]) => {
      const sorted: PI[] = Array.isArray(piList) ? piList : []
      setPIs(sorted)
      setEmployees(Array.isArray(emps) ? emps : [])
      setPublicHolidays(Array.isArray(phs) ? phs : [])
      // Auto-select current PI, then next, then last
      const current = sorted.find(p => p.startDate <= today && p.endDate >= today)
      const next = sorted.find(p => p.startDate > today)
      setSelectedId(current?.id ?? next?.id ?? sorted[sorted.length - 1]?.id ?? null)
      setLoadingBase(false)
    }).catch(() => setLoadingBase(false))
  }, [today])

  const selectedPI = pis.find(p => p.id === selectedId) ?? null

  useEffect(() => {
    if (!selectedPI) return
    setLoadingHolidays(true)
    fetch(`/api/holidays?from=${selectedPI.startDate}&to=${selectedPI.endDate}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        setHolidays(Array.isArray(data) ? data : [])
        setLoadingHolidays(false)
      })
      .catch(() => setLoadingHolidays(false))
  }, [selectedPI?.id])

  const rows = useMemo(() => {
    if (!selectedPI) return []
    const phDates = new Set(publicHolidays.map(h => h.date))
    const total = workingDaysInRange(selectedPI.startDate, selectedPI.endDate, phDates)

    return employees.map(emp => {
      const maxCapacity = total * (emp.workingDaysPerWeek / 5)
      const absences = holidays
        .filter(h => h.employeeId === emp.id)
        .reduce((sum, h) =>
          sum + absenceDaysInRange(h.startDate, h.endDate, selectedPI.startDate, selectedPI.endDate, phDates), 0)
      const available = Math.max(0, maxCapacity - absences)
      return { emp, maxCapacity, absences, available }
    })
  }, [employees, holidays, publicHolidays, selectedPI])

  const totals = useMemo(() => ({
    max: rows.reduce((s, r) => s + r.maxCapacity, 0),
    absences: rows.reduce((s, r) => s + r.absences, 0),
    available: rows.reduce((s, r) => s + r.available, 0),
  }), [rows])

  if (loadingBase) {
    return <div className="py-8 text-center text-gray-400">Chargement…</div>
  }

  if (pis.length === 0) {
    return (
      <div className="py-16 text-center text-gray-400">
        Aucun PI créé. Utilisez &ldquo;Gérer les sprints&rdquo; pour en ajouter.
      </div>
    )
  }

  const phDates = new Set(publicHolidays.map(h => h.date))
  const piWorkingDays = selectedPI
    ? workingDaysInRange(selectedPI.startDate, selectedPI.endDate, phDates)
    : 0

  return (
    <div className="flex gap-6">
      {/* PI list */}
      <aside className="w-64 shrink-0">
        <ul className="space-y-1">
          {pis.map(p => {
            const status = piStatus(p, today)
            const isSelected = p.id === selectedId
            return (
              <li key={p.id}>
                <button
                  onClick={() => setSelectedId(p.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                    isSelected
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-800 truncate mb-0.5">{p.name}</div>
                  <div className="text-xs text-gray-400">{formatDate(p.startDate)} → {formatDate(p.endDate)}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${STATUS_STYLES[status]}`}>
                      {STATUS_LABELS[status]}
                    </span>
                    <span className="text-xs text-gray-400">
                      {p.sprints.length} sprint{p.sprints.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {selectedPI ? (
          <>
            <div className="mb-3">
              <h2 className="text-lg font-semibold text-gray-900">{selectedPI.name}</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {formatDate(selectedPI.startDate)} → {formatDate(selectedPI.endDate)}
                {' · '}{piWorkingDays} jour{piWorkingDays > 1 ? 's' : ''} ouvré{piWorkingDays > 1 ? 's' : ''}
              </p>
            </div>

            {/* Sprints in this PI */}
            {selectedPI.sprints.length > 0 ? (
              <div className="mb-4 flex flex-wrap gap-1.5">
                {selectedPI.sprints.map(s => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1 bg-blue-50 border border-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full"
                  >
                    {s.name}
                    <span className="text-blue-400">({formatDate(s.startDate)} → {formatDate(s.endDate)})</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 mb-4">Aucun sprint rattaché à ce PI.</p>
            )}

            {loadingHolidays ? (
              <div className="py-8 text-center text-gray-400">Chargement…</div>
            ) : employees.length === 0 ? (
              <div className="py-8 text-center text-gray-400">
                Aucun membre. Ajoutez des personnes via &ldquo;Gérer l'équipe&rdquo;.
              </div>
            ) : (
              <CapacityTable rows={rows} totals={totals} />
            )}
          </>
        ) : (
          <div className="py-8 text-center text-gray-400">Sélectionnez un PI.</div>
        )}
      </div>
    </div>
  )
}
