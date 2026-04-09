export function easterDate(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

function addDays(d: Date, days: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + days)
  return r
}

function fmtDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function fixed(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function frenchPublicHolidays(year: number): { date: string; name: string }[] {
  const easter = easterDate(year)
  return [
    { date: fixed(year, 1, 1),               name: "Jour de l'An" },
    { date: fmtDate(addDays(easter, 1)),      name: 'Lundi de Pâques' },
    { date: fixed(year, 5, 1),               name: 'Fête du Travail' },
    { date: fixed(year, 5, 8),               name: 'Victoire 1945' },
    { date: fmtDate(addDays(easter, 39)),     name: 'Ascension' },
    { date: fmtDate(addDays(easter, 50)),     name: 'Lundi de Pentecôte' },
    { date: fixed(year, 7, 14),              name: 'Fête Nationale' },
    { date: fixed(year, 8, 15),              name: 'Assomption' },
    { date: fixed(year, 11, 1),              name: 'Toussaint' },
    { date: fixed(year, 11, 11),             name: 'Armistice' },
    { date: fixed(year, 12, 25),             name: 'Noël' },
  ]
}
