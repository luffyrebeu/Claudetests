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
    const pi = await prisma.programIncrement.update({
      where: { id },
      data: { name: name.trim(), startDate, endDate },
      include: {
        sprints: {
          orderBy: { startDate: 'asc' },
          select: { id: true, name: true, startDate: true, endDate: true, piId: true },
        },
      },
    })
    return NextResponse.json(pi)
  } catch {
    return NextResponse.json({ error: 'PI not found' }, { status: 404 })
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params
  const id = Number(idStr)

  try {
    // Detach sprints before deleting PI
    await prisma.sprint.updateMany({ where: { piId: id }, data: { piId: null } })
    await prisma.programIncrement.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'PI not found' }, { status: 404 })
  }
}
