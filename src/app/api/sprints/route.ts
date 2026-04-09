import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const sprints = await prisma.sprint.findMany({
    orderBy: { startDate: 'asc' },
    include: { pi: { select: { id: true, name: true } } },
  })
  return NextResponse.json(sprints)
}

export async function POST(request: Request) {
  const { name, startDate, endDate, piId } = await request.json()

  if (!name?.trim() || !startDate || !endDate) {
    return NextResponse.json({ error: 'name, startDate and endDate are required' }, { status: 400 })
  }
  if (endDate < startDate) {
    return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 })
  }

  const sprint = await prisma.sprint.create({
    data: { name: name.trim(), startDate, endDate, piId: piId ?? null },
    include: { pi: { select: { id: true, name: true } } },
  })
  return NextResponse.json(sprint, { status: 201 })
}
