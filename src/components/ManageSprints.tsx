'use client'

import { useState, useEffect } from 'react'

interface Sprint {
  id: number
  name: string
  startDate: string
  endDate: string
}

interface Props {
  onClose: () => void
}

function formatDate(str: string): string {
  const [y, m, d] = str.split('-')
  return `${d}/${m}/${y}`
}

const EMPTY_FORM = { name: '', startDate: '', endDate: '' }

export default function ManageSprints({ onClose }: Props) {
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editing, setEditing] = useState<Sprint | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/sprints').then(r => r.json()).then(setSprints)
  }, [])

  function startEdit(sprint: Sprint) {
    setEditing(sprint)
    setForm({ name: sprint.name, startDate: sprint.startDate, endDate: sprint.endDate })
    setError('')
  }

  function cancelEdit() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const { name, startDate, endDate } = form

    if (!name.trim() || !startDate || !endDate) {
      setError('Tous les champs sont requis.')
      return
    }
    if (endDate < startDate) {
      setError('La date de fin doit être après la date de début.')
      return
    }

    setSaving(true)
    const url = editing ? `/api/sprints/${editing.id}` : '/api/sprints'
    const method = editing ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), startDate, endDate }),
    })
    setSaving(false)

    if (res.ok) {
      const saved: Sprint = await res.json()
      setSprints(prev => {
        const updated = editing
          ? prev.map(s => (s.id === saved.id ? saved : s))
          : [...prev, saved]
        return updated.sort((a, b) => a.startDate.localeCompare(b.startDate))
      })
      cancelEdit()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Erreur lors de la sauvegarde.')
    }
  }

  async function deleteSprint(id: number) {
    if (!confirm('Supprimer ce sprint ?')) return
    await fetch(`/api/sprints/${id}`, { method: 'DELETE' })
    setSprints(prev => prev.filter(s => s.id !== id))
    if (editing?.id === id) cancelEdit()
  }

  const today = new Date().toISOString().split('T')[0]

  function sprintStatus(s: Sprint): { label: string; cls: string } {
    if (s.endDate < today) return { label: 'Passé', cls: 'bg-gray-100 text-gray-500' }
    if (s.startDate <= today) return { label: 'En cours', cls: 'bg-green-100 text-green-700' }
    return { label: 'À venir', cls: 'bg-blue-100 text-blue-700' }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-base font-semibold text-gray-900">Manage Sprints</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        {/* Sprint list */}
        <ul className="mb-5 divide-y divide-gray-100 max-h-64 overflow-y-auto border border-gray-100 rounded-lg">
          {sprints.map(s => {
            const { label, cls } = sprintStatus(s)
            return (
              <li key={s.id} className="flex items-center gap-3 px-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800 truncate">{s.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 ${cls}`}>{label}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {formatDate(s.startDate)} → {formatDate(s.endDate)}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => startEdit(s)} className="text-blue-600 hover:underline text-xs">
                    Modifier
                  </button>
                  <button onClick={() => deleteSprint(s.id)} className="text-red-500 hover:underline text-xs">
                    Supprimer
                  </button>
                </div>
              </li>
            )
          })}
          {sprints.length === 0 && (
            <li className="py-4 text-center text-sm text-gray-400">Aucun sprint créé.</li>
          )}
        </ul>

        {/* Add / Edit form */}
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          {editing ? `Modifier "${editing.name}"` : 'Nouveau sprint'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Nom du sprint (ex: Sprint 12)"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Début</label>
              <input
                type="date"
                value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Fin</label>
              <input
                type="date"
                value={form.endDate}
                min={form.startDate}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Sauvegarde…' : editing ? 'Enregistrer' : 'Créer le sprint'}
            </button>
            {editing && (
              <button
                type="button"
                onClick={cancelEdit}
                className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                Annuler
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
