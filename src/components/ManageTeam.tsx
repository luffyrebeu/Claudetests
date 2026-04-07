'use client'

import { useState, useEffect } from 'react'

interface Employee {
  id: number
  name: string
  color: string
}

interface Props {
  onClose: () => void
}

export default function ManageTeam({ onClose }: Props) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [newName, setNewName] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/employees')
      .then(r => r.json())
      .then(setEmployees)
  }, [])

  async function addEmployee(e: React.FormEvent) {
    e.preventDefault()
    setError('')
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
      setEmployees(prev =>
        [...prev, emp].sort((a, b) => a.name.localeCompare(b.name))
      )
      setNewName('')
    } else {
      const data = await res.json()
      setError(data.error ?? 'Could not add employee.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold text-gray-900">Manage Team</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <ul className="mb-4 divide-y divide-gray-100 max-h-64 overflow-y-auto">
          {employees.map(e => (
            <li key={e.id} className="flex items-center gap-3 py-2.5">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: e.color }}
              />
              <span className="text-sm text-gray-800">{e.name}</span>
            </li>
          ))}
          {employees.length === 0 && (
            <li className="py-4 text-center text-sm text-gray-400">
              No team members yet.
            </li>
          )}
        </ul>

        <form onSubmit={addEmployee} className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Full name"
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
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  )
}
