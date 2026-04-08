import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const employeeId = searchParams.get('employeeId')
  const month = searchParams.get('month') // YYYY-MM

  let where: Record<string, unknown> = {}
  if (employeeId) where.employeeId = Number(employeeId)
  if (month) {
    const [y, m] = month.split('-').map(Number)
    const firstDay = `${month}-01`
    const lastDay = `${month}-${new Date(y, m, 0).getDate().toString().padStart(2, '0')}`
    // Absences that overlap with the month
    where = { ...where, startDate: { lte: lastDay }, endDate: { gte: firstDay } }
  }

  const holidays = await prisma.holiday.findMany({
    where: Object.keys(where).length ? where : undefined,
    include: { employee: true },
    orderBy: { startDate: 'asc' },
  })
  return NextResponse.json(holidays)
}

export async function POST(request: Request) {
  const { employeeId, startDate, endDate, type, note } = await request.json()

  if (!employeeId || !startDate || !endDate || !type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (endDate < startDate) {
    return NextResponse.json(
      { error: 'End date must be on or after start date' },
      { status: 400 }
    )
  }

  const holiday = await prisma.holiday.create({
    data: {
      employeeId: Number(employeeId),
      startDate,
      endDate,
      type,
      note: note || null,
    },
    include: { employee: true },
  })
  return NextResponse.json(holiday, { status: 201 })
}
