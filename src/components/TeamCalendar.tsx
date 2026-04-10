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
  const [deleting, setDeleting] = useState(false)

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
    if (found) setConfirmHoliday(found)
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
        <div className="bg-white rounded-lg shadow-xl p-6 w-80">
          <h3 className="font-semibold text-gray-900 mb-4">Supprimer cette absence ?</h3>
          <div className="space-y-1 text-sm text-gray-700 mb-6">
            <p><span className="font-medium">Employé :</span> {confirmHoliday.employee.name}</p>
            <p><span className="font-medium">Type :</span> {TYPE_LABELS[confirmHoliday.type] ?? confirmHoliday.type}</p>
            <p><span className="font-medium">Du :</span> {fmtDate(confirmHoliday.startDate)}</p>
            <p><span className="font-medium">Au :</span> {fmtDate(confirmHoliday.endDate)}</p>
            {confirmHoliday.note && (
              <p><span className="font-medium">Note :</span> {confirmHoliday.note}</p>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setConfirmHoliday(null)}
              disabled={deleting}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? 'Suppression…' : 'Supprimer'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}

function fmtDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

function addOneDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}
