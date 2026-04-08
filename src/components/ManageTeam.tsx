'use client'

import { useState, useEffect } from 'react'

interface Employee {
  id: number
  name: string
  color: string
  workingDaysPerWeek: number
}

interface PublicHoliday {
  id: number
  date: string
  name: string
}

interface Props {
  onClose: () => void
}

function formatDate(str: string): string {
  const [y, m, d] = str.split('-')
  return `${d}/${m}/${y}`
}

export default function ManageTeam({ onClose }: Props) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [publicHolidays, setPublicHolidays] = useState<PublicHoliday[]>([])
  const [newName, setNewName] = useState('')
  const [newHolidayDate, setNewHolidayDate] = useState('')
  const [newHolidayName, setNewHolidayName] = useState('')
  const [employeeError, setEmployeeError] = useState('')
  const [holidayError, setHolidayError] = useState('')
  const [saving, setSaving] = useState(false)
  const [savingHoliday, setSavingHoliday] = useState(false)
  // track which employee's daysPerWeek is being edited
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
      body: JSON.stringify({ name: newName.trim() }),
    })
    setSaving(false)

    if (res.ok) {
      const emp = await res.json()
      setEmployees(prev => [...prev, emp].sort((a, b) => a.name.localeCompare(b.name)))
      setNewName('')
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

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-base font-semibold text-gray-900">Gérer l'équipe</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
            &times;
          </button>
        </div>

        {/* ── Team members ── */}
        <h3 className="text-sm font-medium text-gray-700 mb-2">Membres de l'équipe</h3>
        <ul className="mb-3 divide-y divide-gray-100 max-h-52 overflow-y-auto border border-gray-100 rounded-lg">
          {employees.map(e => (
            <li key={e.id} className="flex items-center gap-3 px-3 py-2">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
              <span className="text-sm text-gray-800 flex-1">{e.name}</span>
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
            <li className="py-4 text-center text-sm text-gray-400">No team members yet.</li>
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
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
          >
            Add
          </button>
        </form>
        {employeeError && <p className="text-sm text-red-600 mb-4">{employeeError}</p>}

        {/* ── Public holidays ── */}
        <div className="border-t border-gray-200 mt-5 pt-5">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Public holidays</h3>
          <ul className="mb-3 divide-y divide-gray-100 max-h-40 overflow-y-auto border border-gray-100 rounded-lg">
            {publicHolidays.map(h => (
              <li key={h.id} className="flex items-center gap-3 px-3 py-2">
                <span className="text-sm text-gray-500 shrink-0 w-20">{formatDate(h.date)}</span>
                <span className="text-sm text-gray-800 flex-1">{h.name}</span>
                <button
                  onClick={() => deletePublicHoliday(h.id)}
                  className="text-red-400 hover:text-red-600 text-xs shrink-0"
                >
                  Remove
                </button>
              </li>
            ))}
            {publicHolidays.length === 0 && (
              <li className="py-3 text-center text-sm text-gray-400">No public holidays.</li>
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
              placeholder="Name (e.g. 14 juillet)"
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={savingHoliday}
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
            >
              Add
            </button>
          </form>
          {holidayError && <p className="text-sm text-red-600">{holidayError}</p>}
        </div>
      </div>
    </div>
  )
}
