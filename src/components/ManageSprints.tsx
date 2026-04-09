'use client'

import { useState, useEffect } from 'react'

interface PI {
  id: number
  name: string
  startDate: string
  endDate: string
}

interface Sprint {
  id: number
  name: string
  startDate: string
  endDate: string
  piId: number | null
}

interface Props {
  onClose: () => void
}

function formatDate(str: string): string {
  const [y, m, d] = str.split('-')
  return `${d}/${m}/${y}`
}

const EMPTY_SPRINT_FORM = { name: '', startDate: '', endDate: '', piId: '' }
const EMPTY_PI_FORM = { name: '', startDate: '', endDate: '' }

const today = new Date().toISOString().split('T')[0]

function sprintStatus(s: Sprint): { label: string; cls: string } {
  if (s.endDate < today) return { label: 'Passé', cls: 'bg-gray-100 text-gray-500' }
  if (s.startDate <= today) return { label: 'En cours', cls: 'bg-green-100 text-green-700' }
  return { label: 'À venir', cls: 'bg-blue-100 text-blue-700' }
}

function piStatus(p: PI): { label: string; cls: string } {
  if (p.endDate < today) return { label: 'Passé', cls: 'bg-gray-100 text-gray-500' }
  if (p.startDate <= today) return { label: 'En cours', cls: 'bg-green-100 text-green-700' }
  return { label: 'À venir', cls: 'bg-blue-100 text-blue-700' }
}

export default function ManageSprints({ onClose }: Props) {
  const [pis, setPIs] = useState<PI[]>([])
  const [sprints, setSprints] = useState<Sprint[]>([])

  // Sprint form state
  const [sprintForm, setSprintForm] = useState(EMPTY_SPRINT_FORM)
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null)
  const [sprintError, setSprintError] = useState('')
  const [savingSprint, setSavingSprint] = useState(false)

  // PI form state
  const [piForm, setPIForm] = useState(EMPTY_PI_FORM)
  const [editingPI, setEditingPI] = useState<PI | null>(null)
  const [piError, setPIError] = useState('')
  const [savingPI, setSavingPI] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/pi').then(r => r.ok ? r.json() : []),
      fetch('/api/sprints').then(r => r.ok ? r.json() : []),
    ]).then(([piList, sprintList]) => {
      if (Array.isArray(piList)) setPIs(piList)
      if (Array.isArray(sprintList)) setSprints(sprintList)
    })
  }, [])

  // ── Sprint handlers ──

  function startEditSprint(sprint: Sprint) {
    setEditingSprint(sprint)
    setSprintForm({
      name: sprint.name,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      piId: sprint.piId ? String(sprint.piId) : '',
    })
    setSprintError('')
  }

  function cancelEditSprint() {
    setEditingSprint(null)
    setSprintForm(EMPTY_SPRINT_FORM)
    setSprintError('')
  }

  async function handleSprintSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSprintError('')
    const { name, startDate, endDate, piId } = sprintForm

    if (!name.trim() || !startDate || !endDate) {
      setSprintError('Tous les champs sont requis.')
      return
    }
    if (endDate < startDate) {
      setSprintError('La date de fin doit être après la date de début.')
      return
    }

    setSavingSprint(true)
    const url = editingSprint ? `/api/sprints/${editingSprint.id}` : '/api/sprints'
    const method = editingSprint ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        startDate,
        endDate,
        piId: piId ? Number(piId) : null,
      }),
    })
    setSavingSprint(false)

    if (res.ok) {
      const saved: Sprint = await res.json()
      setSprints(prev => {
        const updated = editingSprint
          ? prev.map(s => (s.id === saved.id ? saved : s))
          : [...prev, saved]
        return updated.sort((a, b) => a.startDate.localeCompare(b.startDate))
      })
      cancelEditSprint()
    } else {
      const data = await res.json()
      setSprintError(data.error ?? 'Erreur lors de la sauvegarde.')
    }
  }

  async function deleteSprint(id: number) {
    if (!confirm('Supprimer ce sprint ?')) return
    await fetch(`/api/sprints/${id}`, { method: 'DELETE' })
    setSprints(prev => prev.filter(s => s.id !== id))
    if (editingSprint?.id === id) cancelEditSprint()
  }

  // ── PI handlers ──

  function startEditPI(pi: PI) {
    setEditingPI(pi)
    setPIForm({ name: pi.name, startDate: pi.startDate, endDate: pi.endDate })
    setPIError('')
  }

  function cancelEditPI() {
    setEditingPI(null)
    setPIForm(EMPTY_PI_FORM)
    setPIError('')
  }

  async function handlePISubmit(e: React.FormEvent) {
    e.preventDefault()
    setPIError('')
    const { name, startDate, endDate } = piForm

    if (!name.trim() || !startDate || !endDate) {
      setPIError('Tous les champs sont requis.')
      return
    }
    if (endDate < startDate) {
      setPIError('La date de fin doit être après la date de début.')
      return
    }

    setSavingPI(true)
    const url = editingPI ? `/api/pi/${editingPI.id}` : '/api/pi'
    const method = editingPI ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), startDate, endDate }),
    })
    setSavingPI(false)

    if (res.ok) {
      const saved: PI = await res.json()
      setPIs(prev => {
        const updated = editingPI
          ? prev.map(p => (p.id === saved.id ? saved : p))
          : [...prev, saved]
        return updated.sort((a, b) => a.startDate.localeCompare(b.startDate))
      })
      cancelEditPI()
    } else {
      const data = await res.json()
      setPIError(data.error ?? 'Erreur lors de la sauvegarde.')
    }
  }

  async function deletePI(id: number) {
    if (!confirm('Supprimer ce PI ? Les sprints rattachés seront détachés.')) return
    await fetch(`/api/pi/${id}`, { method: 'DELETE' })
    setPIs(prev => prev.filter(p => p.id !== id))
    setSprints(prev => prev.map(s => s.piId === id ? { ...s, piId: null } : s))
    if (editingPI?.id === id) cancelEditPI()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-base font-semibold text-gray-900">Gérer les sprints & PIs</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        {/* ── Programme Increments ── */}
        <h3 className="text-sm font-medium text-gray-700 mb-2">Programme Increments (PI)</h3>
        <ul className="mb-4 divide-y divide-gray-100 max-h-48 overflow-y-auto border border-gray-100 rounded-lg">
          {pis.map(p => {
            const { label, cls } = piStatus(p)
            return (
              <li key={p.id} className="flex items-center gap-3 px-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800 truncate">{p.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 ${cls}`}>{label}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {formatDate(p.startDate)} → {formatDate(p.endDate)}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => startEditPI(p)} className="text-blue-600 hover:underline text-xs">Modifier</button>
                  <button onClick={() => deletePI(p.id)} className="text-red-500 hover:underline text-xs">Supprimer</button>
                </div>
              </li>
            )
          })}
          {pis.length === 0 && (
            <li className="py-4 text-center text-sm text-gray-400">Aucun PI créé.</li>
          )}
        </ul>

        <h3 className="text-sm font-medium text-gray-700 mb-2">
          {editingPI ? `Modifier "${editingPI.name}"` : 'Nouveau PI'}
        </h3>
        <form onSubmit={handlePISubmit} className="space-y-3 mb-6">
          <input
            type="text"
            value={piForm.name}
            onChange={e => setPIForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Nom du PI (ex: PI 2025.Q1)"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Début</label>
              <input
                type="date"
                value={piForm.startDate}
                onChange={e => setPIForm(f => ({ ...f, startDate: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Fin</label>
              <input
                type="date"
                value={piForm.endDate}
                min={piForm.startDate}
                onChange={e => setPIForm(f => ({ ...f, endDate: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          {piError && <p className="text-sm text-red-600">{piError}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={savingPI}
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {savingPI ? 'Sauvegarde…' : editingPI ? 'Enregistrer' : 'Créer le PI'}
            </button>
            {editingPI && (
              <button
                type="button"
                onClick={cancelEditPI}
                className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                Annuler
              </button>
            )}
          </div>
        </form>

        {/* ── Sprints ── */}
        <div className="border-t border-gray-200 pt-5">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Sprints</h3>
          <ul className="mb-4 divide-y divide-gray-100 max-h-48 overflow-y-auto border border-gray-100 rounded-lg">
            {sprints.map(s => {
              const { label, cls } = sprintStatus(s)
              const pi = pis.find(p => p.id === s.piId)
              return (
                <li key={s.id} className="flex items-center gap-3 px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800 truncate">{s.name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 ${cls}`}>{label}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {formatDate(s.startDate)} → {formatDate(s.endDate)}
                      {pi && <span className="ml-2 text-blue-500">{pi.name}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => startEditSprint(s)} className="text-blue-600 hover:underline text-xs">Modifier</button>
                    <button onClick={() => deleteSprint(s.id)} className="text-red-500 hover:underline text-xs">Supprimer</button>
                  </div>
                </li>
              )
            })}
            {sprints.length === 0 && (
              <li className="py-4 text-center text-sm text-gray-400">Aucun sprint créé.</li>
            )}
          </ul>

          <h3 className="text-sm font-medium text-gray-700 mb-2">
            {editingSprint ? `Modifier "${editingSprint.name}"` : 'Nouveau sprint'}
          </h3>
          <form onSubmit={handleSprintSubmit} className="space-y-3">
            <input
              type="text"
              value={sprintForm.name}
              onChange={e => setSprintForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Nom du sprint (ex: Sprint 12)"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Début</label>
                <input
                  type="date"
                  value={sprintForm.startDate}
                  onChange={e => setSprintForm(f => ({ ...f, startDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Fin</label>
                <input
                  type="date"
                  value={sprintForm.endDate}
                  min={sprintForm.startDate}
                  onChange={e => setSprintForm(f => ({ ...f, endDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">PI <span className="text-gray-400 font-normal">(optionnel)</span></label>
              <select
                value={sprintForm.piId}
                onChange={e => setSprintForm(f => ({ ...f, piId: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Aucun PI —</option>
                {pis.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            {sprintError && <p className="text-sm text-red-600">{sprintError}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={savingSprint}
                className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {savingSprint ? 'Sauvegarde…' : editingSprint ? 'Enregistrer' : 'Créer le sprint'}
              </button>
              {editingSprint && (
                <button
                  type="button"
                  onClick={cancelEditSprint}
                  className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  Annuler
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
