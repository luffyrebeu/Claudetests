import { easterDate, frenchPublicHolidays } from '@/lib/publicHolidays'

// Dates de Pâques vérifiées sur plusieurs années
const KNOWN_EASTER: Record<number, string> = {
  2020: '2020-04-12',
  2021: '2021-04-04',
  2022: '2022-04-17',
  2023: '2023-04-09',
  2024: '2024-03-31',
  2025: '2025-04-20',
  2026: '2026-04-05',
  2027: '2027-03-28',
}

function fmtDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

describe('easterDate', () => {
  test.each(Object.entries(KNOWN_EASTER))(
    'Pâques %s = %s',
    (yearStr, expected) => {
      expect(fmtDate(easterDate(Number(yearStr)))).toBe(expected)
    }
  )
})

describe('frenchPublicHolidays', () => {
  test('retourne exactement 11 jours pour chaque année', () => {
    for (const year of [2024, 2025, 2026, 2027]) {
      expect(frenchPublicHolidays(year)).toHaveLength(11)
    }
  })

  test('toutes les dates sont au format YYYY-MM-DD', () => {
    const re = /^\d{4}-\d{2}-\d{2}$/
    for (const h of frenchPublicHolidays(2026)) {
      expect(h.date).toMatch(re)
    }
  })

  test('jours fériés fixes 2026', () => {
    const holidays = frenchPublicHolidays(2026)
    const byName = Object.fromEntries(holidays.map(h => [h.name, h.date]))
    expect(byName["Jour de l'An"]).toBe('2026-01-01')
    expect(byName['Fête du Travail']).toBe('2026-05-01')
    expect(byName['Victoire 1945']).toBe('2026-05-08')
    expect(byName['Fête Nationale']).toBe('2026-07-14')
    expect(byName['Assomption']).toBe('2026-08-15')
    expect(byName['Toussaint']).toBe('2026-11-01')
    expect(byName['Armistice']).toBe('2026-11-11')
    expect(byName['Noël']).toBe('2026-12-25')
  })

  test('jours fériés mobiles 2026 (Pâques = 5 avril)', () => {
    const holidays = frenchPublicHolidays(2026)
    const byName = Object.fromEntries(holidays.map(h => [h.name, h.date]))
    expect(byName['Lundi de Pâques']).toBe('2026-04-06')   // Pâques + 1
    expect(byName['Ascension']).toBe('2026-05-14')          // Pâques + 39
    expect(byName['Lundi de Pentecôte']).toBe('2026-05-25') // Pâques + 50
  })

  test('jours fériés mobiles 2025 (Pâques = 20 avril)', () => {
    const holidays = frenchPublicHolidays(2025)
    const byName = Object.fromEntries(holidays.map(h => [h.name, h.date]))
    expect(byName['Lundi de Pâques']).toBe('2025-04-21')
    expect(byName['Ascension']).toBe('2025-05-29')
    expect(byName['Lundi de Pentecôte']).toBe('2025-06-09')
  })

  test('aucune date dupliquée', () => {
    const holidays = frenchPublicHolidays(2026)
    const dates = holidays.map(h => h.date)
    expect(new Set(dates).size).toBe(dates.length)
  })

  test('toutes les dates appartiennent à l\'année demandée', () => {
    for (const year of [2024, 2025, 2026]) {
      for (const h of frenchPublicHolidays(year)) {
        expect(h.date.startsWith(String(year))).toBe(true)
      }
    }
  })
})
