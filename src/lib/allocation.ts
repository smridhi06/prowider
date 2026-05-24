import { prisma } from './prisma'

export const MANDATORY_ASSIGNMENTS: Record<number, number[]> = {
  1: [1],
  2: [5],
  3: [1, 4],
}

export const POOL_PROVIDERS: Record<number, number[]> = {
  1: [2, 3, 4],
  2: [6, 7, 8],
  3: [2, 3, 5, 6, 7, 8],
}

export async function assignProviders(
  leadId: number,
  serviceId: number
): Promise<void> {
  await prisma.$transaction(
    async (tx) => {
      const mandatory = MANDATORY_ASSIGNMENTS[serviceId] || []
      const pool = POOL_PROVIDERS[serviceId] || []
      const needed = 3 - mandatory.length

      // Get current allocation state
      const state = await tx.allocationState.findUnique({
        where: { serviceId },
      })
      let currentIndex = state?.nextIndex ?? 0

      // Get available pool providers (excluding mandatory, within quota)
      const availableProviders = await tx.provider.findMany({
        where: {
          id: { in: pool.filter((id) => !mandatory.includes(id)) },
          leadsReceived: { lt: 10 },
        },
        orderBy: { id: 'asc' },
      })

      // Round-robin selection
      const selected: number[] = []
      if (availableProviders.length > 0) {
        let idx = currentIndex % availableProviders.length
        let attempts = 0
        while (
          selected.length < needed &&
          attempts < availableProviders.length
        ) {
          const provider = availableProviders[idx % availableProviders.length]
          if (provider && !selected.includes(provider.id)) {
            selected.push(provider.id)
          }
          idx = (idx + 1) % availableProviders.length
          attempts++
        }
        currentIndex = (currentIndex + selected.length) % availableProviders.length
      }

      // Update allocation state
      await tx.allocationState.upsert({
        where: { serviceId },
        update: { nextIndex: currentIndex },
        create: { serviceId, nextIndex: currentIndex },
      })

      // Check mandatory provider quotas
      const validMandatory: number[] = []
      for (const id of mandatory) {
        const provider = await tx.provider.findUnique({ where: { id } })
        if (provider && provider.leadsReceived < 10) {
          validMandatory.push(id)
        }
      }

      const allAssigned = [...new Set([...validMandatory, ...selected])]

      // Create assignments and increment counters
      for (const providerId of allAssigned) {
        await tx.leadAssignment.create({
          data: { leadId, providerId },
        })
        await tx.provider.update({
          where: { id: providerId },
          data: { leadsReceived: { increment: 1 } },
        })
      }
    },
    {
      timeout: 30000, // 30 second timeout
      maxWait: 10000, // wait up to 10s to acquire transaction
    }
  )
}