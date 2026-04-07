"use client"

import { useParams } from 'next/navigation'
import { useState, useCallback } from 'react'
import DashboardContent from '../../dashboard-content'

export default function CustomDashboardPage() {
  const params = useParams()
  const viewId = (params?.id as string) || '1'
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSync = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/qbo/sync', { method: 'POST' })
      if (res.ok) {
        window.location.reload()
      }
    } catch (e) {
      console.error('Sync failed:', e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return (
    <DashboardContent
      dashboardData={dashboardData}
      isLoading={isLoading}
      onSync={handleSync}
      viewId={viewId}
    />
  )
}
