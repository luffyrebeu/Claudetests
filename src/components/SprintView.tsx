'use client'

import { useState, useEffect, useMemo } from 'react'
import { workingDaysInRange, absenceDaysInRange, fmt } from '@/lib/capacity'
import { CapacityTable } from './CapacityView'

interface Sprint {
  id: number
  name: string
  startDate: string
  endDate: string
}

interface Employee {
  id: number
  name: string
  color: string
  workingDaysPerWeek: number
  team: string
  contractType: string
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

function sprintStatus(s: Sprint, today: string): 'past' | 'current' | 'future' {
  if (s.endDate < today) return 'past'
  if (s.startDate <= today) return 'current'
  return 'future'
}

const STATUS_STYLES = {
  past:    'bg-gray-100 text-gray-500',
  current: 'bg-green-100 text-green-700',
  future:  'bg-blue-100 text-blue-700',
}
const STATUS_LABELS = { past: 'Passé', current: 'En cours', future: 'À venir' }

function defaultSprintId(sprints: Sprint[], today: string): number | null {
  const current = sprints.find(s => s.startDate <= today && s.endDate >= today)
  if (current) return current.id
  const next = sprints.find(s => s.startDate > today)
  if (next) return next.id
  return sprints[sprints.length - 1]?.id ?? null
}

export default function SprintView() {
  const today = new Date().toISOString().split('T')[0]

  const [sprints, setSprints] = useState<Sprint[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [publicHolidays, setPublicHolidays] = useState<PublicHoliday[]>([])
  const [loadingBase, setLoadingBase] = useState(true)
  const [loadingHolidays, setLoadingHolidays] = useState(false)

  // Load sprints, employees, public holidays once
  useEffect(() => {
    setLoadingBase(true)
    Promise.all([
      fetch('/api/sprints').then(r => r.ok ? r.json() : []),
      fetch('/api/employees').then(r => r.ok ? r.json() : []),
      fetch('/api/public-holidays').then(r => r.ok ? r.json() : []),
    ]).then(([sps, emps, phs]) => {
      const sorted: Sprint[] = Array.isArray(sps) ? sps : []
      setSprints(sorted)
      setEmployees(Array.isArray(emps) ? emps : [])
      setPublicHolidays(Array.isArray(phs) ? phs : [])
      setSelectedId(defaultSprintId(sorted, today))
      setLoadingBase(false)
    }).catch(() => setLoadingBase(false))
  }, [today])

  const selectedSprint = sprints.find(s => s.id === selectedId) ?? null

  // Load holidays whenever the selected sprint changes
  useEffect(() => {
    if (!selectedSprint) return
    setLoadingHolidays(true)
    fetch(`/api/holidays?from=${selectedSprint.startDate}&to=${selectedSprint.endDate}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        setHolidays(Array.isArray(data) ? data : [])
        setLoadingHolidays(false)
      })
      .catch(() => setLoadingHolidays(false))
  }, [selectedSprint?.id])

  const rows = useMemo(() => {
    if (!selectedSprint) return []
    const phDates = new Set(publicHolidays.map(h => h.date))
    const total = workingDaysInRange(selectedSprint.startDate, selectedSprint.endDate, phDates)

    return employees.map(emp => {
      const maxCapacity = total * (emp.workingDaysPerWeek / 5)
      const absences = holidays
        .filter(h => h.employeeId === emp.id)
        .reduce((sum, h) =>
          sum + absenceDaysInRange(h.startDate, h.endDate, selectedSprint.startDate, selectedSprint.endDate, phDates), 0)
      const available = Math.max(0, maxCapacity - absences)
      return { emp, maxCapacity, absences, available }
    })
  }, [employees, holidays, publicHolidays, selectedSprint])

  const totals = useMemo(() => ({
    max: rows.reduce((s, r) => s + r.maxCapacity, 0),
    absences: rows.reduce((s, r) => s + r.absences, 0),
    available: rows.reduce((s, r) => s + r.available, 0),
  }), [rows])

  if (loadingBase) {
    return <div className="py-8 text-center text-gray-400">Chargement…</div>
  }

  if (sprints.length === 0) {
    return (
      <div className="py-16 text-center text-gray-400">
        Aucun sprint créé. Utilisez "Manage sprints" pour en ajouter.
      </div>
    )
  }

  const phDates = new Set(publicHolidays.map(h => h.date))
  const sprintWorkingDays = selectedSprint
    ? workingDaysInRange(selectedSprint.startDate, selectedSprint.endDate, phDates)
    : 0

  return (
    <div className="flex gap-6">
      {/* Sprint list */}
      <aside className="w-64 shrink-0">
        <ul className="space-y-1">
          {sprints.map(s => {
            const status = sprintStatus(s, today)
            const isSelected = s.id === selectedId
            return (
              <li key={s.id}>
                <button
                  onClick={() => setSelectedId(s.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                    isSelected
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-gray-800 truncate">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{formatDate(s.startDate)} → {formatDate(s.endDate)}</span>
                  </div>
                  <span className={`inline-block mt-1 text-xs px-1.5 py-0.5 rounded-full font-medium ${STATUS_STYLES[status]}`}>
                    {STATUS_LABELS[status]}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </aside>

      {/* Capacity table */}
      <div className="flex-1 min-w-0">
        {selectedSprint ? (
          <>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{selectedSprint.name}</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {formatDate(selectedSprint.startDate)} → {formatDate(selectedSprint.endDate)}
                {' · '}{sprintWorkingDays} jour{sprintWorkingDays > 1 ? 's' : ''} ouvré{sprintWorkingDays > 1 ? 's' : ''}
              </p>
            </div>

            {loadingHolidays ? (
              <div className="py-8 text-center text-gray-400">Chargement…</div>
            ) : employees.length === 0 ? (
              <div className="py-8 text-center text-gray-400">
                Aucun membre. Ajoutez des personnes via "Manage team".
              </div>
            ) : (
              <CapacityTable rows={rows} totals={totals} />
            )}
          </>
        ) : (
          <div className="py-8 text-center text-gray-400">Sélectionnez un sprint.</div>
        )}
      </div>
    </div>
  )
}
