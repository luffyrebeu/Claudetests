import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { frenchPublicHolidays } from '@/lib/publicHolidays'

export async function POST(request: Request) {
  const { year } = await request.json()

  if (!year || typeof year !== 'number' || year < 2000 || year > 2100) {
    return NextResponse.json({ error: 'Année invalide' }, { status: 400 })
  }

  const holidays = frenchPublicHolidays(year)

  let inserted = 0
  for (const h of holidays) {
    const existing = await prisma.publicHoliday.findUnique({ where: { date: h.date } })
    if (!existing) {
      await prisma.publicHoliday.create({ data: h })
      inserted++
    }
  }

  return NextResponse.json({ inserted, total: holidays.length })
}
