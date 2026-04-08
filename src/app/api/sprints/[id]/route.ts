import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params
  const id = Number(idStr)
  const { name, startDate, endDate } = await request.json()

  if (!name?.trim() || !startDate || !endDate) {
    return NextResponse.json({ error: 'name, startDate and endDate are required' }, { status: 400 })
  }
  if (endDate < startDate) {
    return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 })
  }

  try {
    const sprint = await prisma.sprint.update({
      where: { id },
      data: { name: name.trim(), startDate, endDate },
    })
    return NextResponse.json(sprint)
  } catch {
    return NextResponse.json({ error: 'Sprint not found' }, { status: 404 })
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params
  const id = Number(idStr)

  try {
    await prisma.sprint.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Sprint not found' }, { status: 404 })
  }
}
