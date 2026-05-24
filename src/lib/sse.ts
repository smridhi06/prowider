const clients = new Set<ReadableStreamDefaultController>()

export function notifyClients() {
  clients.forEach((controller) => {
    try {
      controller.enqueue('data: update\n\n')
    } catch {
      clients.delete(controller)
    }
  })
}

export function addClient(controller: ReadableStreamDefaultController) {
  clients.add(controller)
}

export function removeClient(controller: ReadableStreamDefaultController) {
  clients.delete(controller)
}