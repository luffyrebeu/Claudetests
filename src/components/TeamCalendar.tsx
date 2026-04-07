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
  employee: {
    id: number
    name: string
    color: string
  }
}

const TYPE_LABELS: Record<string, string> = {
  holiday: 'Annual Leave',
  sick: 'Sick Leave',
  other: 'Other',
}

export default function TeamCalendar() {
  const [holidays, setHolidays] = useState<Holiday[]>([])

  useEffect(() => {
    fetch('/api/holidays')
      .then(r => r.json())
      .then(setHolidays)
  }, [])

  const events = holidays.map(h => ({
    id: String(h.id),
    title: `${h.employee.name} — ${TYPE_LABELS[h.type] ?? h.type}`,
    start: h.startDate,
    // FullCalendar end is exclusive for all-day events
    end: addOneDay(h.endDate),
    backgroundColor: h.employee.color,
    borderColor: h.employee.color,
    textColor: '#fff',
    extendedProps: { note: h.note },
  }))

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
        eventDisplay="block"
        height="auto"
        eventContent={info => (
          <div
            className="px-1 py-0.5 text-xs truncate"
            title={
              info.event.extendedProps.note
                ? `${info.event.title} — ${info.event.extendedProps.note}`
                : info.event.title
            }
          >
            {info.event.title}
          </div>
        )}
      />
    </div>
  )
}

function addOneDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}
