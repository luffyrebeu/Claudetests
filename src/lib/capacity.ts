// Count Mon–Fri days in a date range, excluding public holidays
export function workingDaysInRange(
  startDate: string,
  endDate: string,
  publicHolidayDates: Set<string>
): number {
  const from = new Date(startDate + 'T00:00:00')
  const to   = new Date(endDate   + 'T00:00:00')
  let count = 0
  const cur = new Date(from)
  while (cur <= to) {
    const dow = cur.getDay()
    const ds  = cur.toISOString().split('T')[0]
    if (dow > 0 && dow < 6 && !publicHolidayDates.has(ds)) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

// Count working days of an absence that overlap with a given range
export function absenceDaysInRange(
  absenceStart: string,
  absenceEnd: string,
  rangeStart: string,
  rangeEnd: string,
  publicHolidayDates: Set<string>
): number {
  const rStart = new Date(rangeStart   + 'T00:00:00')
  const rEnd   = new Date(rangeEnd     + 'T00:00:00')
  const aStart = new Date(absenceStart + 'T00:00:00')
  const aEnd   = new Date(absenceEnd   + 'T00:00:00')

  const from = aStart > rStart ? aStart : rStart
  const to   = aEnd   < rEnd   ? aEnd   : rEnd

  if (from > to) return 0

  let count = 0
  const cur = new Date(from)
  while (cur <= to) {
    const dow = cur.getDay()
    const ds  = cur.toISOString().split('T')[0]
    if (dow > 0 && dow < 6 && !publicHolidayDates.has(ds)) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

export function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}
