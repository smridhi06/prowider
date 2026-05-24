'use client'

import { useState, useEffect, useCallback } from 'react'

interface Lead {
  id: number
  name: string
  phone: string
  city: string
  description: string
  createdAt: string
  service: { name: string }
}

interface Provider {
  id: number
  name: string
  monthlyQuota: number
  leadsReceived: number
  leadAssignments: { lead: Lead }[]
}

export default function Dashboard() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard')
      const data = await res.json()
      setProviders(data)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Dashboard fetch error:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()

    // SSE for real-time updates
    const eventSource = new EventSource('/api/events')
    eventSource.onmessage = (e) => {
      if (e.data === 'update') fetchData()
    }
    eventSource.onerror = () => eventSource.close()

    return () => eventSource.close()
  }, [fetchData])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Provider Dashboard</h1>
          <span className="text-xs text-gray-400">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {providers.map((provider) => (
            <div key={provider.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex justify-between items-start mb-3">
                <h2 className="font-semibold text-gray-800">{provider.name}</h2>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  provider.leadsReceived >= 10
                    ? 'bg-red-100 text-red-600'
                    : 'bg-green-100 text-green-600'
                }`}>
                  {10 - provider.leadsReceived} left
                </span>
              </div>

              <div className="text-sm text-gray-500 mb-3">
                <span className="font-medium text-gray-700">{provider.leadsReceived}</span> leads received
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {provider.leadAssignments.length === 0 ? (
                  <p className="text-xs text-gray-400">No leads yet</p>
                ) : (
                  provider.leadAssignments.map(({ lead }) => (
                    <div key={lead.id} className="bg-gray-50 rounded-lg p-2 text-xs">
                      <div className="font-medium text-gray-700">{lead.name}</div>
                      <div className="text-gray-500">{lead.service.name} · {lead.city}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}