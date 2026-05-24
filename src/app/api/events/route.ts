import { addClient, removeClient } from '../leads/route'

export const dynamic = 'force-dynamic'

export async function GET() {
  let controller: ReadableStreamDefaultController

  const stream = new ReadableStream({
    start(c) {
      controller = c
      addClient(controller)
      controller.enqueue('data: connected\n\n')
    },
    cancel() {
      removeClient(controller)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}