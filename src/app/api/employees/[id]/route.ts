import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const VALID_TEAMS = ['MOA', 'MOE', 'DS']
const VALID_CONTRACT_TYPES = ['interne', 'prestataire']

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params
  const id = Number(idStr)

  try {
    await prisma.holiday.deleteMany({ where: { employeeId: id } })
    await prisma.employee.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params
  const id = Number(idStr)
  const body = await request.json()

  const data: { workingDaysPerWeek?: number; team?: string; contractType?: string } = {}

  if (body.workingDaysPerWeek !== undefined) {
    const days = Number(body.workingDaysPerWeek)
    if (days <= 0 || days > 5) {
      return NextResponse.json(
        { error: 'workingDaysPerWeek must be between 0.5 and 5' },
        { status: 400 }
      )
    }
    data.workingDaysPerWeek = days
  }

  if (body.team !== undefined) {
    if (!VALID_TEAMS.includes(body.team)) {
      return NextResponse.json(
        { error: 'team must be MOA, MOE or DS' },
        { status: 400 }
      )
    }
    data.team = body.team
  }

  if (body.contractType !== undefined) {
    if (!VALID_CONTRACT_TYPES.includes(body.contractType)) {
      return NextResponse.json(
        { error: 'contractType must be interne or prestataire' },
        { status: 400 }
      )
    }
    data.contractType = body.contractType
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  try {
    const employee = await prisma.employee.update({ where: { id }, data })
    return NextResponse.json(employee)
  } catch {
    return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
  }
}
