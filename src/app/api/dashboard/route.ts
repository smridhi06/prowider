import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const providers = await prisma.provider.findMany({
      orderBy: { id: 'asc' },
      include: {
        leadAssignments: {
          include: {
            lead: {
              include: { service: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    // Sync leadsReceived with actual assignment count
    const synced = providers.map((p) => ({
      ...p,
      leadsReceived: p.leadAssignments.length,
    }))

    return NextResponse.json(synced)
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard' },
      { status: 500 }
    )
  }
}