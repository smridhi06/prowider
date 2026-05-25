import { prisma } from '@/lib/prisma'
import { assignProviders } from '@/lib/allocation'
import { notifyClients } from '@/lib/sse'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export async function POST() {
  try {
    const services = await prisma.service.findMany()
    const timestamp = Date.now()
    const results = []

    // Sequential to avoid concurrent transaction conflicts on Neon
    for (let i = 0; i < 10; i++) {
      try {
        const service = services[i % services.length]
        const lead = await prisma.lead.create({
          data: {
            name: `Test User ${i + 1}`,
            phone: `test_${timestamp}_${i}`,
            city: 'Test City',
            description: `Concurrent test lead ${i + 1}`,
            serviceId: service.id,
          },
        })
        await assignProviders(lead.id, service.id)
        results.push(lead.id)
      } catch (err) {
        console.error(`Lead ${i + 1} failed:`, err)
      }
    }

    notifyClients()

    return NextResponse.json({
      success: true,
      message: `${results.length}/10 leads created`,
      leadIds: results,
    })
  } catch (error) {
    console.error('Test error:', error)
    return NextResponse.json({ error: 'Test failed' }, { status: 500 })
  }
}