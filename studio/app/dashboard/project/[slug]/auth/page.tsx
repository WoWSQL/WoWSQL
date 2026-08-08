'use client'

import { PageSkeleton } from '@/components/Skeleton'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function AuthPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  useEffect(() => {
    router.replace(`/dashboard/project/${slug}/auth/providers`)
  }, [slug, router])

  return <PageSkeleton variant="form" />
}
