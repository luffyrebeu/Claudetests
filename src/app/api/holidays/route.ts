import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const employeeId = searchParams.get('employeeId')

  const holidays = await prisma.holiday.findMany({
    where: employeeId ? { employeeId: Number(employeeId) } : undefined,
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
