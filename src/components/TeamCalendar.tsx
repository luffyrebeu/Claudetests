'use client'

import { useEffect, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import frLocale from '@fullcalendar/core/locales/fr'
import type { EventClickArg } from '@fullcalendar/core'

interface Holiday {
  id: number
  startDate: string
  endDate: string
  type: string
  note: string | null
  employee: { id: number; name: string; color: string }
}

interface Sprint {
  id: number
  name: string
  startDate: string
  endDate: string
}

interface PublicHoliday {
  id: number
  date: string
  name: string
}

const TYPE_LABELS: Record<string, string> = {
  holiday: 'Congés annuels',
  sick: 'Arrêt maladie',
  other: 'Autre',
}

interface Props {
  onUpdate?: () => void
}

export default function TeamCalendar({ onUpdate }: Props) {
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [publicHolidays, setPublicHolidays] = useState<PublicHoliday[]>([])
  const [confirmHoliday, setConfirmHoliday] = useState<Holiday | null>(null)
  const [editStart, setEditStart] = useState('')
  const [editEnd, setEditEnd] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/holidays').then(r => r.ok ? r.json() : []),
      fetch('/api/sprints').then(r => r.ok ? r.json() : []),
      fetch('/api/public-holidays').then(r => r.ok ? r.json() : []),
    ]).then(([hols, sps, phs]) => {
      if (Array.isArray(hols)) setHolidays(hols)
      if (Array.isArray(sps)) setSprints(sps)
      if (Array.isArray(phs)) setPublicHolidays(phs)
    }).catch(() => {})
  }, [])

  const today = new Date().toISOString().split('T')[0]

  const sprintEvents = sprints.flatMap(s => {
    const isCurrent = s.startDate <= today && s.endDate >= today
    return [
      // Shaded background for the entire sprint period
      {
        id: `sprint-bg-${s.id}`,
        start: s.startDate,
        end: addOneDay(s.endDate),
        display: 'background',
        backgroundColor: isCurrent ? '#dbeafe' : '#f1f5f9',
        extendedProps: { kind: 'sprint-bg', _sort: -1 },
      },
      // Label spanning the full sprint period
      {
        id: `sprint-label-${s.id}`,
        title: s.name,
        start: s.startDate,
        end: addOneDay(s.endDate),
        allDay: true,
        backgroundColor: isCurrent ? '#bfdbfe' : '#e2e8f0',
        borderColor:     isCurrent ? '#93c5fd' : '#cbd5e1',
        textColor:       isCurrent ? '#1e40af' : '#475569',
        extendedProps: { kind: 'sprint-label', isCurrent, _sort: 0 },
      },
    ]
  })

  const publicHolidayEvents = publicHolidays.flatMap(ph => [
    {
      id: `ph-bg-${ph.id}`,
      start: ph.date,
      end: addOneDay(ph.date),
      display: 'background',
      backgroundColor: '#fee2e2',
      extendedProps: { kind: 'ph-bg', _sort: -2 },
    },
    {
      id: `ph-label-${ph.id}`,
      title: ph.name,
      start: ph.date,
      end: addOneDay(ph.date),
      allDay: true,
      backgroundColor: '#fecaca',
      borderColor: '#fca5a5',
      textColor: '#991b1b',
      extendedProps: { kind: 'ph-label', _sort: 0 },
    },
  ])

  const holidayEvents = holidays.map(h => ({
    id: `h-${h.id}`,
    title: `${h.employee.name} — ${TYPE_LABELS[h.type] ?? h.type}`,
    start: h.startDate,
    end: addOneDay(h.endDate),
    backgroundColor: h.employee.color,
    borderColor: h.employee.color,
    textColor: '#fff',
    extendedProps: { kind: 'holiday', holidayId: h.id, note: h.note, _sort: 1 },
  }))

  const events = [...sprintEvents, ...publicHolidayEvents, ...holidayEvents]

  function handleEventClick(info: EventClickArg) {
    if (info.event.extendedProps.kind !== 'holiday') return
    const hId = info.event.extendedProps.holidayId as number
    const found = holidays.find(h => h.id === hId)
    if (found) {
      setConfirmHoliday(found)
      setEditStart(found.startDate)
      setEditEnd(found.endDate)
    }
  }

  async function handleDelete() {
    if (!confirmHoliday) return
    setDeleting(true)
    try {
      await fetch(`/api/holidays/${confirmHoliday.id}`, { method: 'DELETE' })
      setHolidays(prev => prev.filter(h => h.id !== confirmHoliday.id))
      setConfirmHoliday(null)
      onUpdate?.()
    } finally {
      setDeleting(false)
    }
  }

  async function handleSave() {
    if (!confirmHoliday) return
    setSaving(true)
    try {
      const res = await fetch(`/api/holidays/${confirmHoliday.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate: editStart, endDate: editEnd, type: confirmHoliday.type, note: confirmHoliday.note }),
      })
      if (res.ok) {
        setHolidays(prev => prev.map(h =>
          h.id === confirmHoliday.id ? { ...h, startDate: editStart, endDate: editEnd } : h
        ))
        setConfirmHoliday(null)
        onUpdate?.()
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={events}
        locale={frLocale}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: '',
        }}
        eventClick={handleEventClick}
        eventOrder="_sort,start,-duration,allDay,title"
        height="auto"
        eventContent={info => {
          const { kind, note, isCurrent } = info.event.extendedProps

          if (kind === 'sprint-label') {
            return (
              <div
                className={`px-1.5 py-0.5 text-xs truncate ${isCurrent ? 'font-semibold' : 'font-medium'}`}
                title={info.event.title}
              >
                {info.event.title}
              </div>
            )
          }

          if (kind === 'ph-label') {
            return (
              <div
                className="px-1.5 py-0.5 text-xs font-medium truncate"
                title={info.event.title}
              >
                {info.event.title}
              </div>
            )
          }

          return (
            <div
              className="px-1 py-0.5 text-xs truncate"
              title={note ? `${info.event.title} — ${note}` : info.event.title}
            >
              {info.event.title}
            </div>
          )
        }}
      />
    </div>

    {confirmHoliday && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 w-96">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">
              Absence — {confirmHoliday.employee.name}
            </h3>
            <button
              onClick={() => setConfirmHoliday(null)}
              disabled={deleting || saving}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50 text-lg leading-none"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>
          <div className="space-y-3 text-sm text-gray-700 mb-6">
            <p><span className="font-medium">Type :</span> {TYPE_LABELS[confirmHoliday.type] ?? confirmHoliday.type}</p>
            <div>
              <label className="block font-medium mb-1">Du</label>
              <input
                type="date"
                value={editStart}
                onChange={e => setEditStart(e.target.value)}
                disabled={deleting || saving}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Au</label>
              <input
                type="date"
                value={editEnd}
                min={editStart}
                onChange={e => setEditEnd(e.target.value)}
                disabled={deleting || saving}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
            {confirmHoliday.note && (
              <p><span className="font-medium">Note :</span> {confirmHoliday.note}</p>
            )}
          </div>
          <div className="flex items-center justify-between">
            <button
              onClick={handleDelete}
              disabled={deleting || saving}
              className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50"
            >
              {deleting ? 'Suppression…' : 'Supprimer'}
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmHoliday(null)}
                disabled={deleting || saving}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={deleting || saving || !editStart || !editEnd || editEnd < editStart}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Sauvegarde…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  )
}

function addOneDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}
