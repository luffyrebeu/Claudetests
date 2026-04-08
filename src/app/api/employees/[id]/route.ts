import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params
  const id = Number(idStr)
  const { workingDaysPerWeek } = await request.json()

  if (
    workingDaysPerWeek === undefined ||
    workingDaysPerWeek <= 0 ||
    workingDaysPerWeek > 5
  ) {
    return NextResponse.json(
      { error: 'workingDaysPerWeek must be between 0.5 and 5' },
      { status: 400 }
    )
  }

  try {
    const employee = await prisma.employee.update({
      where: { id },
      data: { workingDaysPerWeek: Number(workingDaysPerWeek) },
    })
    return NextResponse.json(employee)
  } catch {
    return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
  }
}
