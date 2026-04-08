import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const holidays = await prisma.publicHoliday.findMany({
    orderBy: { date: 'asc' },
  })
  return NextResponse.json(holidays)
}

export async function POST(request: Request) {
  const { date, name } = await request.json()

  if (!date || !name?.trim()) {
    return NextResponse.json({ error: 'Date and name are required' }, { status: 400 })
  }

  try {
    const holiday = await prisma.publicHoliday.create({
      data: { date, name: name.trim() },
    })
    return NextResponse.json(holiday, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'A holiday already exists on this date' }, { status: 409 })
  }
}
