import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getNextColor } from '@/lib/colors'

export async function GET() {
  const employees = await prisma.employee.findMany({
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(employees)
}

export async function POST(request: Request) {
  const { name, team, contractType } = await request.json()

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }
  if (team && !['MOA', 'MOE', 'DS'].includes(team)) {
    return NextResponse.json({ error: 'team must be MOA, MOE or DS' }, { status: 400 })
  }
  if (contractType && !['interne', 'prestataire'].includes(contractType)) {
    return NextResponse.json({ error: 'contractType must be interne or prestataire' }, { status: 400 })
  }

  const existing = await prisma.employee.findMany({ select: { color: true } })
  const usedColors = existing.map(e => e.color)
  const color = getNextColor(usedColors)

  try {
    const employee = await prisma.employee.create({
      data: { name: name.trim(), color, team: team ?? 'MOA', contractType: contractType ?? 'interne' },
    })
    return NextResponse.json(employee, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Name already exists' }, { status: 409 })
  }
}
