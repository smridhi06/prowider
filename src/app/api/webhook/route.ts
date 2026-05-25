import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { eventId } = body

    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId is required' },
        { status: 400 }
      )
    }

    // Idempotency check
    const existing = await prisma.webhookEvent.findUnique({
      where: { id: eventId },
    })

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Event already processed — idempotent response',
        alreadyProcessed: true,
      })
    }

    // Reset all provider quotas
    await prisma.$transaction([
      prisma.provider.updateMany({
        data: { monthlyQuota: 10, leadsReceived: 0 },
      }),
      prisma.webhookEvent.create({
        data: { id: eventId },
      }),
    ])

    return NextResponse.json({
      success: true,
      message: 'Quota reset successfully',
      alreadyProcessed: false,
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}