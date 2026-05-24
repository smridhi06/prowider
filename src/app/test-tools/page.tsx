'use client'

import { useState } from 'react'

export default function TestTools() {
  const [log, setLog] = useState<string[]>([])
  const [loading, setLoading] = useState<string | null>(null)

  const addLog = (msg: string) =>
    setLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev])

  const resetQuota = async (times = 1) => {
    setLoading('reset')
    const eventId = `evt_${Date.now()}`
    for (let i = 0; i < times; i++) {
      const res = await fetch('/api/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      })
      const data = await res.json()
      addLog(
        `Webhook call ${i + 1}: ${
          data.alreadyProcessed ? 'IDEMPOTENT — skipped' : 'Quota reset'
        }`
      )
    }
    setLoading(null)
  }

  const generate10Leads = async () => {
    setLoading('generate')
    addLog('Generating 10 concurrent leads...')
    const res = await fetch('/api/test', { method: 'POST' })
    const data = await res.json()
    addLog(data.success ? '10 leads created successfully' : `Error: ${data.error}`)
    setLoading(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Test Tools</h1>
        <p className="text-sm text-gray-500 mb-6">
          Webhook simulation and concurrency testing panel
        </p>

        <div className="space-y-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h2 className="font-semibold text-gray-700 mb-1">Reset Provider Quota</h2>
            <p className="text-xs text-gray-400 mb-3">
              Simulates payment webhook. Same eventId = idempotent.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => resetQuota(1)}
                disabled={!!loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                Reset Quota (1x)
              </button>
              <button
                onClick={() => resetQuota(5)}
                disabled={!!loading}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50"
              >
                Call Webhook 5x (test idempotency)
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h2 className="font-semibold text-gray-700 mb-1">Concurrency Test</h2>
            <p className="text-xs text-gray-400 mb-3">
              Creates 10 leads simultaneously to test allocation under load.
            </p>
            <button
              onClick={generate10Leads}
              disabled={!!loading}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-700 disabled:opacity-50"
            >
              {loading === 'generate' ? 'Generating...' : 'Generate 10 Leads'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-700 mb-3">Activity Log</h2>
          <div className="space-y-1 max-h-64 overflow-y-auto font-mono text-xs">
            {log.length === 0 ? (
              <p className="text-gray-400">No activity yet...</p>
            ) : (
              log.map((entry, i) => (
                <div key={i} className="text-gray-600">{entry}</div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}