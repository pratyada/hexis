import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { clientCode: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {}

  const clients = await prisma.client.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { cases: true, documents: true } },
    },
  })

  return NextResponse.json({ clients })
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()

    if (!body.name || !body.phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 })
    }

    const count = await prisma.client.count()
    const clientCode = `HX-CLI-${String(count + 1).padStart(3, '0')}`

    const client = await prisma.client.create({
      data: {
        clientCode,
        name: body.name,
        nameHindi: body.nameHindi || undefined,
        email: body.email || undefined,
        phone: body.phone,
        alternatePhone: body.alternatePhone || undefined,
        address: body.address || undefined,
        city: body.city || undefined,
        state: body.state || 'Delhi',
        pincode: body.pincode || undefined,
        pan: body.pan || undefined,
        aadhaar: body.aadhaar || undefined,
        occupation: body.occupation || undefined,
        clientType: body.clientType || 'INDIVIDUAL',
        companyName: body.companyName || undefined,
        gstin: body.gstin || undefined,
        notes: body.notes || undefined,
      },
    })

    return NextResponse.json({ client }, { status: 201 })
  } catch (error) {
    console.error('Create client error:', error)
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
  }
}
