'use client'

import { useEffect, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'

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

const TYPE_LABELS: Record<string, string> = {
  holiday: 'Congés annuels',
  sick: 'Arrêt maladie',
  other: 'Autre',
}

export default function TeamCalendar() {
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [sprints, setSprints] = useState<Sprint[]>([])

  useEffect(() => {
    Promise.all([
      fetch('/api/holidays').then(r => r.ok ? r.json() : []),
      fetch('/api/sprints').then(r => r.ok ? r.json() : []),
    ]).then(([hols, sps]) => {
      if (Array.isArray(hols)) setHolidays(hols)
      if (Array.isArray(sps)) setSprints(sps)
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

  const holidayEvents = holidays.map(h => ({
    id: `h-${h.id}`,
    title: `${h.employee.name} — ${TYPE_LABELS[h.type] ?? h.type}`,
    start: h.startDate,
    end: addOneDay(h.endDate),
    backgroundColor: h.employee.color,
    borderColor: h.employee.color,
    textColor: '#fff',
    extendedProps: { kind: 'holiday', note: h.note, _sort: 1 },
  }))

  const events = [...sprintEvents, ...holidayEvents]

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={events}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: '',
        }}
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
  )
}

function addOneDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}
