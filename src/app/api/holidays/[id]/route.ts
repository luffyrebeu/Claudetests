import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { startDate, endDate, type, note } = await request.json()
  const { id: idStr } = await params
  const id = Number(idStr)

  if (!startDate || !endDate || !type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (endDate < startDate) {
    return NextResponse.json(
      { error: 'End date must be on or after start date' },
      { status: 400 }
    )
  }

  try {
    const holiday = await prisma.holiday.update({
      where: { id },
      data: { startDate, endDate, type, note: note || null },
      include: { employee: true },
    })
    return NextResponse.json(holiday)
  } catch {
    return NextResponse.json({ error: 'Holiday not found' }, { status: 404 })
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params
  const id = Number(idStr)

  try {
    await prisma.holiday.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Holiday not found' }, { status: 404 })
  }
}
