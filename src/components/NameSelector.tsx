'use client'

import { useState, useEffect } from 'react'

interface Employee {
  id: number
  name: string
  color: string
}

interface Props {
  currentEmployeeId: number | null
  onSelect: (id: number) => void
  refreshTrigger?: number
}

export default function NameSelector({ currentEmployeeId, onSelect, refreshTrigger }: Props) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch('/api/employees')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data)) setEmployees(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [refreshTrigger])

  const current = employees.find(e => e.id === currentEmployeeId)

  if (loading) return <span className="text-sm text-gray-400">Chargement…</span>

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">Vous êtes :</span>
      <select
        value={currentEmployeeId ?? ''}
        onChange={e => e.target.value && onSelect(Number(e.target.value))}
        className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Sélectionnez votre nom…</option>
        {employees.map(e => (
          <option key={e.id} value={e.id}>
            {e.name}
          </option>
        ))}
      </select>
      {current && (
        <span
          className="w-3 h-3 rounded-full inline-block shrink-0"
          style={{ backgroundColor: current.color }}
        />
      )}
    </div>
  )
}
