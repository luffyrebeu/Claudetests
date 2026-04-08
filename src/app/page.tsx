'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import MyHolidays from '@/components/MyHolidays'
import NameSelector from '@/components/NameSelector'
import ManageTeam from '@/components/ManageTeam'

// FullCalendar uses browser APIs — disable SSR
const TeamCalendar = dynamic(() => import('@/components/TeamCalendar'), {
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-400">
      Loading calendar…
    </div>
  ),
})

type Tab = 'calendar' | 'my-holidays'

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('calendar')
  const [currentEmployeeId, setCurrentEmployeeId] = useState<number | null>(null)
  const [showManageTeam, setShowManageTeam] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const stored = localStorage.getItem('employeeId')
    if (stored) setCurrentEmployeeId(Number(stored))
  }, [])

  function handleSelectEmployee(id: number) {
    setCurrentEmployeeId(id)
    localStorage.setItem('employeeId', String(id))
  }

  function refresh() {
    setRefreshKey(k => k + 1)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Team Holidays</h1>
          <div className="flex items-center gap-4">
            <NameSelector
              currentEmployeeId={currentEmployeeId}
              onSelect={handleSelectEmployee}
              refreshTrigger={refreshKey}
            />
            <button
              onClick={() => setShowManageTeam(true)}
              className="text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2"
            >
              Manage team
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex gap-6">
            {(['calendar', 'my-holidays'] as Tab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'calendar' ? 'Team Calendar' : 'My Holidays'}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === 'calendar' && <TeamCalendar key={refreshKey} />}

        {activeTab === 'my-holidays' &&
          (currentEmployeeId ? (
            <MyHolidays
              employeeId={currentEmployeeId}
              onUpdate={refresh}
            />
          ) : (
            <div className="text-center py-16 text-gray-500">
              Select your name in the header to manage your holidays.
            </div>
          ))}
      </main>

      {showManageTeam && (
        <ManageTeam
          onClose={() => {
            setShowManageTeam(false)
            refresh()
          }}
        />
      )}
    </div>
  )
}
