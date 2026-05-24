import { prisma } from '@/lib/prisma'
import { assignProviders } from '@/lib/allocation'
import { notifyClients } from '@/lib/sse'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, phone, city, description, serviceId } = body

    if (!name || !phone || !city || !description || !serviceId) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    const existing = await prisma.lead.findUnique({
      where: { phone_serviceId: { phone, serviceId: Number(serviceId) } },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'You have already submitted a lead for this service' },
        { status: 409 }
      )
    }

    const lead = await prisma.lead.create({
      data: {
        name,
        phone,
        city,
        description,
        serviceId: Number(serviceId),
      },
    })

    await assignProviders(lead.id, Number(serviceId))
    notifyClients()

    return NextResponse.json({ success: true, leadId: lead.id }, { status: 201 })
  } catch (error: unknown) {
    console.error('Lead creation error:', error)
    if (
      error instanceof Error &&
      error.message.includes('Unique constraint')
    ) {
      return NextResponse.json(
        { error: 'Duplicate lead for this service' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    )
  }
}