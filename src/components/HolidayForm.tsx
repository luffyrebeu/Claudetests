'use client'

import { useState } from 'react'

interface Holiday {
  id: number
  startDate: string
  endDate: string
  type: string
  note: string | null
}

interface Props {
  employeeId: number
  holiday: Holiday | null
  onDone: () => void
  onCancel: () => void
}

export default function HolidayForm({ employeeId, holiday, onDone, onCancel }: Props) {
  const [startDate, setStartDate] = useState(holiday?.startDate ?? '')
  const [endDate, setEndDate] = useState(holiday?.endDate ?? '')
  const [type, setType] = useState(holiday?.type ?? 'holiday')
  const [note, setNote] = useState(holiday?.note ?? '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!startDate || !endDate) {
      setError('Les dates de début et de fin sont requises.')
      return
    }
    if (endDate < startDate) {
      setError('La date de fin doit être égale ou postérieure à la date de début.')
      return
    }

    setSaving(true)
    const body = { employeeId, startDate, endDate, type, note: note || null }

    const res = holiday
      ? await fetch(`/api/holidays/${holiday.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      : await fetch('/api/holidays', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

    setSaving(false)

    if (res.ok) {
      onDone()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Une erreur s\'est produite.')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm max-w-lg"
    >
      <h3 className="text-base font-medium text-gray-900 mb-4">
        {holiday ? 'Modifier l\'absence' : 'Ajouter une absence'}
      </h3>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date de début
          </label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date de fin
          </label>
          <input
            type="date"
            value={endDate}
            min={startDate}
            onChange={e => setEndDate(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
        <select
          value={type}
          onChange={e => setType(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="holiday">Congés annuels</option>
          <option value="sick">Arrêt maladie</option>
          <option value="other">Autre</option>
        </select>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Note <span className="text-gray-400 font-normal">(facultatif)</span>
        </label>
        <input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="ex. Vacances en famille, Rendez-vous médical…"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Sauvegarde…' : holiday ? 'Enregistrer' : 'Ajouter l\'absence'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
        >
          Annuler
        </button>
      </div>
    </form>
  )
}
