'use client'

import { useEffect, useState } from 'react'
import { workingDaysInRange } from '@/lib/capacity'

interface Sprint {
  id: number
  name: string
  startDate: string
  endDate: string
}

interface PublicHoliday {
  date: string
}

function formatDate(str: string): string {
  const [y, m, d] = str.split('-')
  return `${d}/${m}/${y}`
}

export default function CurrentSprintBanner({ refreshTrigger }: { refreshTrigger?: number }) {
  const [sprint, setSprint] = useState<Sprint | null>(null)
  const [publicHolidays, setPublicHolidays] = useState<PublicHoliday[]>([])

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    Promise.all([
      fetch('/api/sprints').then(r => r.ok ? r.json() : []),
      fetch('/api/public-holidays').then(r => r.ok ? r.json() : []),
    ]).then(([sprints, phs]) => {
      const current = (sprints as Sprint[]).find(
        s => s.startDate <= today && s.endDate >= today
      )
      setSprint(current ?? null)
      setPublicHolidays(Array.isArray(phs) ? phs : [])
    }).catch(() => {})
  }, [refreshTrigger])

  if (!sprint) return null

  const today = new Date().toISOString().split('T')[0]
  const phDates = new Set(publicHolidays.map(h => h.date))

  const totalDays     = workingDaysInRange(sprint.startDate, sprint.endDate, phDates)
  const daysElapsed   = workingDaysInRange(sprint.startDate, today, phDates)
  const daysRemaining = Math.max(0, totalDays - daysElapsed)
  const progress      = totalDays > 0 ? Math.round((daysElapsed / totalDays) * 100) : 0

  return (
    <div className="bg-blue-50 border-b border-blue-200 px-6 py-2">
      <div className="max-w-7xl mx-auto flex items-center gap-4 flex-wrap">
        <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full shrink-0">
          Sprint en cours
        </span>
        <span className="text-sm font-semibold text-blue-900">{sprint.name}</span>
        <span className="text-sm text-blue-600">
          {formatDate(sprint.startDate)} → {formatDate(sprint.endDate)}
        </span>
        <span className="text-sm text-blue-500">
          {daysRemaining} jour{daysRemaining !== 1 ? 's' : ''} ouvré{daysRemaining !== 1 ? 's' : ''} restant{daysRemaining !== 1 ? 's' : ''}
        </span>
        {/* Progress bar */}
        <div className="flex items-center gap-2 ml-auto">
          <div className="w-24 h-1.5 bg-blue-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-blue-500">{progress}%</span>
        </div>
      </div>
    </div>
  )
}
