import api from '@/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

/** Server sizes eligible for the user's plan (free | pro | scale). */
export async function fetchServerSizesForPlan(planName: string) {
  const { data } = await api.get(
    `${API_URL}/api/v1/infrastructure/server-sizes${planName ? `?for_plan=${encodeURIComponent(planName)}` : ''}`
  )
  return data.server_sizes as Array<{
    id: string
    display_name: string
    min_plan: string
    price_monthly: number
    ram_mb: number
    storage_gb: number
    vcpu: number
    description?: string | null
  }>
}
