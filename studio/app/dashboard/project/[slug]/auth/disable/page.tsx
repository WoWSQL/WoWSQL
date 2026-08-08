'use client'

import { useAuthLayout } from '../layout'
import { DisableAuth } from '../components/DisableAuth'
import { useRouter } from 'next/navigation'

export default function DisableAuthPage() {
  const router = useRouter()
  const { handleAuthDisabled } = useAuthLayout()

  const handleCancel = () => {
    router.back()
  }

  return <DisableAuth onDisabled={handleAuthDisabled} onCancel={handleCancel} />
}
