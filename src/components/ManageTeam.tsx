'use client'

import { useState, useEffect } from 'react'

interface Employee {
  id: number
  name: string
  color: string
  workingDaysPerWeek: number
  team: string
  contractType: string
}

interface PublicHoliday {
  id: number
  date: string
  name: string
}

interface Props {
  onClose: () => void
}

const TEAMS = ['MOA', 'MOE', 'DS'] as const
const CONTRACT_TYPES = ['interne', 'prestataire'] as const

const TEAM_COLORS: Record<string, string> = {
  MOA: 'bg-amber-100 text-amber-700',
  MOE: 'bg-purple-100 text-purple-700',
  DS:  'bg-teal-100 text-teal-700',
}

function formatDate(str: string): string {
  const [y, m, d] = str.split('-')
  return `${d}/${m}/${y}`
}

export default function ManageTeam({ onClose }: Props) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [publicHolidays, setPublicHolidays] = useState<PublicHoliday[]>([])
  const [newName, setNewName] = useState('')
  const [newTeam, setNewTeam] = useState<string>('MOA')
  const [newContractType, setNewContractType] = useState<string>('interne')
  const [newHolidayDate, setNewHolidayDate] = useState('')
  const [newHolidayName, setNewHolidayName] = useState('')
  const [employeeError, setEmployeeError] = useState('')
  const [holidayError, setHolidayError] = useState('')
  const [saving, setSaving] = useState(false)
  const [savingHoliday, setSavingHoliday] = useState(false)
  const [seedingYear, setSeedingYear] = useState<number | null>(null)
  const [seedMessage, setSeedMessage] = useState('')
  const [editingDays, setEditingDays] = useState<Record<number, string>>({})

  useEffect(() => {
    fetch('/api/employees').then(r => r.json()).then(setEmployees)
    fetch('/api/public-holidays').then(r => r.json()).then(setPublicHolidays)
  }, [])

  async function addEmployee(e: React.FormEvent) {
    e.preventDefault()
    setEmployeeError('')
    if (!newName.trim()) return

    setSaving(true)
    const res = await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), team: newTeam, contractType: newContractType }),
    })
    setSaving(false)

    if (res.ok) {
      const emp = await res.json()
      setEmployees(prev => [...prev, emp].sort((a, b) => a.name.localeCompare(b.name)))
      setNewName('')
      setNewContractType('interne')
    } else {
      const data = await res.json()
      setEmployeeError(data.error ?? "Impossible d'ajouter ce membre.")
    }
  }

  async function updateDaysPerWeek(id: number, value: string) {
    const days = parseFloat(value)
    if (isNaN(days) || days <= 0 || days > 5) return

    await fetch(`/api/employees/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workingDaysPerWeek: days }),
    })
    setEmployees(prev =>
      prev.map(e => (e.id === id ? { ...e, workingDaysPerWeek: days } : e))
    )
    setEditingDays(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  async function updateTeam(id: number, team: string) {
    await fetch(`/api/employees/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ team }),
    })
    setEmployees(prev => prev.map(e => (e.id === id ? { ...e, team } : e)))
  }

  async function updateContractType(id: number, contractType: string) {
    await fetch(`/api/employees/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contractType }),
    })
    setEmployees(prev => prev.map(e => (e.id === id ? { ...e, contractType } : e)))
  }

  async function addPublicHoliday(e: React.FormEvent) {
    e.preventDefault()
    setHolidayError('')
    if (!newHolidayDate || !newHolidayName.trim()) return

    setSavingHoliday(true)
    const res = await fetch('/api/public-holidays', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: newHolidayDate, name: newHolidayName.trim() }),
    })
    setSavingHoliday(false)

    if (res.ok) {
      const ph = await res.json()
      setPublicHolidays(prev => [...prev, ph].sort((a, b) => a.date.localeCompare(b.date)))
      setNewHolidayDate('')
      setNewHolidayName('')
    } else {
      const data = await res.json()
      setHolidayError(data.error ?? "Impossible d'ajouter ce jour férié.")
    }
  }

  async function deletePublicHoliday(id: number) {
    await fetch(`/api/public-holidays/${id}`, { method: 'DELETE' })
    setPublicHolidays(prev => prev.filter(h => h.id !== id))
  }

  async function seedYear(year: number) {
    setSeedingYear(year)
    setSeedMessage('')
    const res = await fetch('/api/public-holidays/seed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year }),
    })
    setSeedingYear(null)
    if (res.ok) {
      const data = await res.json()
      const refreshed = await fetch('/api/public-holidays').then(r => r.json())
      setPublicHolidays(refreshed)
      setSeedMessage(
        data.inserted === 0
          ? `Les jours fériés ${year} sont déjà présents.`
          : `${data.inserted} jour${data.inserted > 1 ? 's' : ''} férié${data.inserted > 1 ? 's' : ''} ${year} importé${data.inserted > 1 ? 's' : ''}.`
      )
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-base font-semibold text-gray-900">Gérer l'équipe</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
            &times;
          </button>
        </div>

        {/* ── Membres ── */}
        <h3 className="text-sm font-medium text-gray-700 mb-2">Membres de l'équipe</h3>
        <ul className="mb-3 divide-y divide-gray-100 max-h-56 overflow-y-auto border border-gray-100 rounded-lg">
          {employees.map(e => (
            <li key={e.id} className="flex items-center gap-2 px-3 py-2">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
              <span className="text-sm text-gray-800 flex-1 truncate">{e.name}</span>
              <select
                value={e.team}
                onChange={ev => updateTeam(e.id, ev.target.value)}
                className={`text-xs border border-gray-200 rounded px-1.5 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium shrink-0 ${TEAM_COLORS[e.team] ?? ''}`}
              >
                {TEAMS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <select
                value={e.contractType}
                onChange={ev => updateContractType(e.id, ev.target.value)}
                className="text-xs border border-gray-200 rounded px-1.5 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 shrink-0"
              >
                {CONTRACT_TYPES.map(c => (
                  <option key={c} value={c}>{c === 'prestataire' ? 'Prest.' : 'Int.'}</option>
                ))}
              </select>
              <div className="flex items-center gap-1 shrink-0">
                <input
                  type="number"
                  min={0.5}
                  max={5}
                  step={0.5}
                  value={editingDays[e.id] ?? e.workingDaysPerWeek}
                  onChange={ev =>
                    setEditingDays(prev => ({ ...prev, [e.id]: ev.target.value }))
                  }
                  onBlur={ev => updateDaysPerWeek(e.id, ev.target.value)}
                  className="w-14 text-sm text-right border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-400">j/sem</span>
              </div>
            </li>
          ))}
          {employees.length === 0 && (
            <li className="py-4 text-center text-sm text-gray-400">Aucun membre pour l'instant.</li>
          )}
        </ul>

        <form onSubmit={addEmployee} className="flex gap-2 mb-1">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Nom complet"
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={newTeam}
            onChange={e => setNewTeam(e.target.value)}
            className="border border-gray-300 rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TEAMS.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            value={newContractType}
            onChange={e => setNewContractType(e.target.value)}
            className="border border-gray-300 rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CONTRACT_TYPES.map(c => (
              <option key={c} value={c}>{c === 'prestataire' ? 'Prest.' : 'Int.'}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
          >
            Ajouter
          </button>
        </form>
        {employeeError && <p className="text-sm text-red-600 mb-4">{employeeError}</p>}

        {/* ── Jours fériés ── */}
        <div className="border-t border-gray-200 mt-5 pt-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Jours fériés</h3>
            <div className="flex gap-1.5">
              {[new Date().getFullYear(), new Date().getFullYear() + 1].map(year => (
                <button
                  key={year}
                  onClick={() => seedYear(year)}
                  disabled={seedingYear === year}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded disabled:opacity-50"
                >
                  {seedingYear === year ? '…' : `Importer ${year}`}
                </button>
              ))}
            </div>
          </div>
          {seedMessage && <p className="text-xs text-green-700 mb-2">{seedMessage}</p>}
          <ul className="mb-3 divide-y divide-gray-100 max-h-40 overflow-y-auto border border-gray-100 rounded-lg">
            {publicHolidays.map(h => (
              <li key={h.id} className="flex items-center gap-3 px-3 py-2">
                <span className="text-sm text-gray-500 shrink-0 w-20">{formatDate(h.date)}</span>
                <span className="text-sm text-gray-800 flex-1">{h.name}</span>
                <button
                  onClick={() => deletePublicHoliday(h.id)}
                  className="text-red-400 hover:text-red-600 text-xs shrink-0"
                >
                  Supprimer
                </button>
              </li>
            ))}
            {publicHolidays.length === 0 && (
              <li className="py-3 text-center text-sm text-gray-400">Aucun jour férié.</li>
            )}
          </ul>

          <form onSubmit={addPublicHoliday} className="flex gap-2 mb-1">
            <input
              type="date"
              value={newHolidayDate}
              onChange={e => setNewHolidayDate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={newHolidayName}
              onChange={e => setNewHolidayName(e.target.value)}
              placeholder="Ex: 14 juillet"
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={savingHoliday}
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
            >
              Ajouter
            </button>
          </form>
          {holidayError && <p className="text-sm text-red-600">{holidayError}</p>}
        </div>
      </div>
    </div>
  )
}
