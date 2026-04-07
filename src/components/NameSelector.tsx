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
}

export default function NameSelector({ currentEmployeeId, onSelect }: Props) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/employees')
      .then(r => r.json())
      .then(data => {
        setEmployees(data)
        setLoading(false)
      })
  }, [])

  const current = employees.find(e => e.id === currentEmployeeId)

  if (loading) return <span className="text-sm text-gray-400">Loading…</span>

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">You are:</span>
      <select
        value={currentEmployeeId ?? ''}
        onChange={e => e.target.value && onSelect(Number(e.target.value))}
        className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Select your name…</option>
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
