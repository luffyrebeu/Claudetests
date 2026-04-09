import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const pis = await prisma.programIncrement.findMany({
    orderBy: { startDate: 'asc' },
    include: {
      sprints: {
        orderBy: { startDate: 'asc' },
        select: { id: true, name: true, startDate: true, endDate: true, piId: true },
      },
    },
  })
  return NextResponse.json(pis)
}

export async function POST(request: Request) {
  const { name, startDate, endDate } = await request.json()

  if (!name?.trim() || !startDate || !endDate) {
    return NextResponse.json({ error: 'name, startDate and endDate are required' }, { status: 400 })
  }
  if (endDate < startDate) {
    return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 })
  }

  const pi = await prisma.programIncrement.create({
    data: { name: name.trim(), startDate, endDate },
    include: {
      sprints: {
        orderBy: { startDate: 'asc' },
        select: { id: true, name: true, startDate: true, endDate: true, piId: true },
      },
    },
  })
  return NextResponse.json(pi, { status: 201 })
}
