import { prisma } from '@/lib/prisma'
import { POOL_PROVIDERS } from '@/lib/allocation'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export async function POST() {
  try {
    // Create services
    const services = await Promise.all([
      prisma.service.upsert({
        where: { name: 'Service 1' },
        update: {},
        create: { name: 'Service 1' },
      }),
      prisma.service.upsert({
        where: { name: 'Service 2' },
        update: {},
        create: { name: 'Service 2' },
      }),
      prisma.service.upsert({
        where: { name: 'Service 3' },
        update: {},
        create: { name: 'Service 3' },
      }),
    ])

    // Create 8 providers
    const providers = await Promise.all(
      Array.from({ length: 8 }, (_, i) =>
        prisma.provider.upsert({
          where: { name: `Provider ${i + 1}` },
          update: {},
          create: { name: `Provider ${i + 1}` },
        })
      )
    )

    // Create pool entries
    for (const service of services) {
      const poolProviderIds = POOL_PROVIDERS[service.id] || []
      for (let i = 0; i < poolProviderIds.length; i++) {
        await prisma.pool.upsert({
          where: {
            serviceId_providerId: {
              serviceId: service.id,
              providerId: poolProviderIds[i],
            },
          },
          update: {},
          create: {
            serviceId: service.id,
            providerId: poolProviderIds[i],
            position: i,
          },
        })
      }

      // Initialize allocation state
      await prisma.allocationState.upsert({
        where: { serviceId: service.id },
        update: {},
        create: { serviceId: service.id, nextIndex: 0 },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      services: services.length,
      providers: providers.length,
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 })
  }
}