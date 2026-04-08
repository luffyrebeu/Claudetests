'use client'

import { useState, useEffect, useCallback } from 'react'
import HolidayForm from './HolidayForm'

interface Holiday {
  id: number
  startDate: string
  endDate: string
  type: string
  note: string | null
}

interface Props {
  employeeId: number
  onUpdate: () => void
}

const TYPE_LABELS: Record<string, string> = {
  holiday: 'Congés annuels',
  sick: 'Arrêt maladie',
  other: 'Autre',
}

function typeClass(type: string): string {
  switch (type) {
    case 'holiday':
      return 'bg-green-100 text-green-700'
    case 'sick':
      return 'bg-orange-100 text-orange-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

function formatDate(str: string): string {
  const [y, m, d] = str.split('-')
  return `${d}/${m}/${y}`
}

export default function MyHolidays({ employeeId, onUpdate }: Props) {
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Holiday | null>(null)

  const loadHolidays = useCallback(async () => {
    setLoading(true)
    const data = await fetch(`/api/holidays?employeeId=${employeeId}`).then(r => r.json())
    data.sort((a: Holiday, b: Holiday) => b.startDate.localeCompare(a.startDate))
    setHolidays(data)
    setLoading(false)
  }, [employeeId])

  useEffect(() => {
    loadHolidays()
  }, [loadHolidays])

  async function deleteHoliday(id: number) {
    if (!confirm('Supprimer cette absence ?')) return
    await fetch(`/api/holidays/${id}`, { method: 'DELETE' })
    loadHolidays()
    onUpdate()
  }

  function handleFormDone() {
    setShowForm(false)
    setEditing(null)
    loadHolidays()
    onUpdate()
  }

  if (loading) return <div className="py-8 text-center text-gray-400">Chargement…</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">Mes absences</h2>
        {!showForm && !editing && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + Ajouter une absence
          </button>
        )}
      </div>

      {(showForm || editing) && (
        <div className="mb-6">
          <HolidayForm
            employeeId={employeeId}
            holiday={editing}
            onDone={handleFormDone}
            onCancel={() => {
              setShowForm(false)
              setEditing(null)
            }}
          />
        </div>
      )}

      {holidays.length === 0 ? (
        <div className="text-center py-16 text-gray-400">Aucune absence.</div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Début</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Fin</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Note</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {holidays.map(h => (
                <tr key={h.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{formatDate(h.startDate)}</td>
                  <td className="px-4 py-3">{formatDate(h.endDate)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${typeClass(h.type)}`}
                    >
                      {TYPE_LABELS[h.type] ?? h.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{h.note ?? '—'}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => setEditing(h)}
                      className="text-blue-600 hover:underline mr-3"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => deleteHoliday(h.id)}
                      className="text-red-500 hover:underline"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
