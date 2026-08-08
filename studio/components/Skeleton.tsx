'use client'

import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Sidebar } from '@/components/Sidebar'

/** Base shimmer block */
export function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('skeleton', className)}
      aria-hidden="true"
      {...props}
    />
  )
}

/** Card shell used inside layout-faithful skeletons (prevents collapse) */
function SkeletonCard({
  className,
  children,
}: {
  className?: string
  children?: ReactNode
}) {
  return (
    <div
      className={cn(
        'rounded-md border border-zinc-300 dark:border-white/10 bg-white dark:bg-[#0a0a0f] p-5 min-w-0',
        className,
      )}
    >
      {children}
    </div>
  )
}

/**
 * Project overview skeleton — mirrors the real overview page:
 * header → 3 top cards → 6 info cards → slow queries panel
 */
export function SkeletonProjectOverview({ className }: { className?: string }) {
  return (
    <div
      className={cn('w-full min-w-0 animate-in fade-in duration-300', className)}
      role="status"
      aria-label="Loading project"
    >
      {/* Header — title + API URL */}
      <div className="mb-8">
        <Skeleton className="h-8 w-44 sm:w-56 rounded-md" />
        <div className="flex items-center gap-3 mt-3">
          <Skeleton className="h-4 w-64 sm:w-80 max-w-full rounded-md" />
          <Skeleton className="h-6 w-6 rounded-md shrink-0" />
        </div>
      </div>

      {/* Status + Primary DB + Resources */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <SkeletonCard className="min-h-[120px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <Skeleton className="h-9 w-9 rounded-md shrink-0" />
              <div className="space-y-2 min-w-0">
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            <div className="space-y-2 text-right shrink-0">
              <Skeleton className="h-3 w-16 ml-auto" />
              <Skeleton className="h-4 w-14 ml-auto" />
            </div>
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-3 w-16" />
          </div>
        </SkeletonCard>

        <SkeletonCard className="min-h-[120px]">
          <div className="flex items-center gap-3 mb-3">
            <Skeleton className="h-9 w-9 rounded-md shrink-0" />
            <div className="space-y-2 flex-1 min-w-0">
              <Skeleton className="h-4 w-36 max-w-full" />
              <Skeleton className="h-3 w-40 max-w-full" />
            </div>
            <Skeleton className="h-5 w-5 rounded-md shrink-0" />
          </div>
          <Skeleton className="h-3 w-48 max-w-full mb-2" />
          <Skeleton className="h-3 w-28" />
        </SkeletonCard>

        <SkeletonCard className="min-h-[120px]">
          <Skeleton className="h-3 w-20 mb-4" />
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-2.5 w-10" />
              </div>
            ))}
          </div>
        </SkeletonCard>
      </div>

      {/* Quick info cards — Tables, DB Size, etc. */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} className="min-h-[88px] py-4">
            <Skeleton className="h-3 w-16 mb-3" />
            <Skeleton className="h-6 w-12" />
          </SkeletonCard>
        ))}
      </div>

      {/* Slow Queries & Recommendations panel */}
      <SkeletonCard className="p-6 lg:p-8 mb-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="space-y-2 min-w-0 flex-1">
            <Skeleton className="h-5 w-56 max-w-full" />
            <Skeleton className="h-3 w-72 max-w-full" />
          </div>
          <Skeleton className="h-4 w-28 shrink-0 hidden sm:block" />
        </div>

        <Skeleton className="h-11 w-full rounded-md mb-6" />

        <div className="space-y-0 border border-zinc-300 dark:border-white/10 rounded-md overflow-hidden">
          <div className="grid grid-cols-12 gap-3 px-4 py-3 border-b border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.02]">
            <Skeleton className="h-3 w-12 col-span-2" />
            <Skeleton className="h-3 w-10 col-span-2" />
            <Skeleton className="h-3 w-12 col-span-2" />
            <Skeleton className="h-3 w-16 col-span-6" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-12 gap-3 px-4 py-3.5 border-b border-zinc-100 dark:border-white/[0.04] last:border-0"
            >
              <Skeleton className="h-3.5 w-10 col-span-2" />
              <Skeleton className="h-3.5 w-8 col-span-2" />
              <Skeleton className="h-3.5 w-10 col-span-2" />
              <Skeleton className="h-3.5 w-full col-span-6" />
            </div>
          ))}
        </div>
      </SkeletonCard>

      <span className="sr-only">Loading…</span>
    </div>
  )
}

/** Generic content skeleton (settings-like pages without fake search) */
export function SkeletonContent({ className }: { className?: string }) {
  return (
    <div
      className={cn('w-full min-w-0 space-y-6 animate-in fade-in duration-300', className)}
      role="status"
      aria-label="Loading"
    >
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 max-w-[70%]" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <SkeletonCard className="min-h-[120px]">
          <Skeleton className="h-4 w-24 mb-4" />
          <Skeleton className="h-7 w-16 mb-2" />
          <Skeleton className="h-3 w-32" />
        </SkeletonCard>
        <SkeletonCard className="min-h-[120px]">
          <Skeleton className="h-4 w-24 mb-4" />
          <Skeleton className="h-7 w-20 mb-2" />
          <Skeleton className="h-3 w-28" />
        </SkeletonCard>
        <SkeletonCard className="min-h-[120px] sm:col-span-2 lg:col-span-1">
          <Skeleton className="h-4 w-24 mb-4" />
          <Skeleton className="h-7 w-14 mb-2" />
          <Skeleton className="h-3 w-36" />
        </SkeletonCard>
      </div>

      <SkeletonCard className="min-h-[200px] p-6">
        <div className="flex justify-between mb-5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-md" />
          ))}
        </div>
      </SkeletonCard>

      <span className="sr-only">Loading…</span>
    </div>
  )
}

/** Project cards grid — for Projects dashboard list */
export function SkeletonCards({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 animate-in fade-in duration-300"
      role="status"
      aria-label="Loading"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-md border border-gray-300 dark:border-white/[0.06] bg-white dark:bg-[#0a0a0f] p-5 space-y-4 min-w-0"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2 flex-1 min-w-0">
              <Skeleton className="h-5 w-[75%]" />
              <Skeleton className="h-3.5 w-1/2" />
            </div>
            <Skeleton className="h-6 w-16 rounded-md shrink-0" />
          </div>
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-2/3" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md shrink-0" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  )
}

/** Form / settings content skeleton */
export function SkeletonForm({ className }: { className?: string }) {
  return (
    <div
      className={cn('w-full max-w-3xl min-w-0 space-y-6 animate-in fade-in duration-300', className)}
      role="status"
      aria-label="Loading"
    >
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="rounded-md border border-gray-300 dark:border-white/[0.06] bg-white dark:bg-[#0a0a0f] p-6 space-y-5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-24 w-full rounded-md" />
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  )
}

/** Skeleton rows for use inside an existing <tbody> */
export function SkeletonTableRows({
  rows = 5,
  cols = 4,
}: {
  rows?: number
  cols?: number
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          <td colSpan={cols} className="px-4 py-3">
            <Skeleton className="h-4 w-full rounded-md" />
          </td>
        </tr>
      ))}
    </>
  )
}

/** Table / list skeleton */
export function SkeletonTable({ rows = 6 }: { rows?: number }) {
  return (
    <div
      className="w-full min-w-0 space-y-3 animate-in fade-in duration-300"
      role="status"
      aria-label="Loading"
    >
      <div className="flex items-center justify-between gap-4 mb-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-9 w-28 rounded-md shrink-0" />
      </div>
      <Skeleton className="h-10 w-full rounded-md" />
      <div className="rounded-md border border-gray-300 dark:border-white/[0.06] overflow-hidden divide-y divide-gray-100 dark:divide-white/[0.06]">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 min-w-0">
            <Skeleton className="h-4 w-1/4 shrink-0" />
            <Skeleton className="h-4 w-1/5 shrink-0" />
            <Skeleton className="h-4 w-1/6 shrink-0" />
            <Skeleton className="h-4 w-16 ml-auto shrink-0" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  )
}

/** Editor layout: left list + main pane (tables / SQL / procedures) */
export function SkeletonEditor() {
  return (
    <div
      className="flex h-full min-h-[60vh] w-full min-w-0 animate-in fade-in duration-300"
      role="status"
      aria-label="Loading"
    >
      <div className="w-64 shrink-0 border-r border-gray-300 dark:border-white/[0.06] p-4 space-y-3 hidden sm:block">
        <Skeleton className="h-9 w-full rounded-md" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full rounded-md" />
        ))}
      </div>
      <div className="flex-1 p-4 sm:p-6 space-y-4 min-w-0 overflow-hidden">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-7 w-48 max-w-[50%]" />
          <div className="flex gap-2 shrink-0">
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-[320px] w-full rounded-md" />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  )
}

type PageSkeletonVariant =
  | 'dashboard'
  | 'project'
  | 'project-content'
  | 'settings'
  | 'stats'
  | 'chat'
  | 'auth-shell'
  | 'wizard'
  | 'profile'
  | 'content'
  | 'form'
  | 'table'
  | 'editor'
  | 'auth'
  | 'centered'

interface PageSkeletonProps {
  variant?: PageSkeletonVariant
  projectSlug?: string
  projectName?: string
  className?: string
}

/** Sidebar + generic content (storage, team, realtime, s3, etc.) */
function ProjectShell({
  projectSlug,
  projectName,
  children,
  className,
  mainClassName = 'relative z-10 p-6 lg:p-8 transition-all duration-300 min-w-0',
}: {
  projectSlug: string
  projectName?: string
  children: ReactNode
  className?: string
  mainClassName?: string
}) {
  return (
    <div
      className={cn(
        'min-h-screen bg-white dark:bg-[#0a0a0f] overflow-x-hidden transition-colors duration-300',
        className,
      )}
    >
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>
      <Sidebar projectSlug={projectSlug} projectName={projectName || ''} />
      <main className={mainClassName} style={{ marginLeft: 'var(--sidebar-width, 0px)' }}>
        {children}
      </main>
    </div>
  )
}

function SkeletonStats() {
  return (
    <div className="w-full min-w-0 animate-in fade-in duration-300" role="status" aria-label="Loading">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="space-y-2 min-w-0">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-9 w-28 rounded-md shrink-0" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-md border border-zinc-300 dark:border-white/10 bg-white dark:bg-[#0a0a0f] p-5 min-h-[100px] space-y-3"
          >
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <div className="rounded-md border border-zinc-300 dark:border-white/10 bg-white dark:bg-[#0a0a0f] p-5 min-h-[220px]">
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-40 w-full rounded-md" />
        </div>
        <div className="rounded-md border border-zinc-300 dark:border-white/10 bg-white dark:bg-[#0a0a0f] p-5 min-h-[220px]">
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-40 w-full rounded-md" />
        </div>
      </div>
      <div className="rounded-md border border-zinc-300 dark:border-white/10 bg-white dark:bg-[#0a0a0f] p-5 space-y-3">
        <Skeleton className="h-5 w-40 mb-2" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-md" />
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  )
}

function SkeletonChat() {
  return (
    <div className="h-[calc(100vh-3rem)] flex flex-col min-w-0 animate-in fade-in duration-300" role="status" aria-label="Loading">
      <div className="rounded-md border border-zinc-300 dark:border-white/10 bg-white dark:bg-[#0a0a0f] flex-1 flex flex-col overflow-hidden min-h-0">
        <div className="flex items-center justify-between p-5 border-b border-zinc-300 dark:border-white/10 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="space-y-2 min-w-0">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-40 max-w-full" />
            </div>
          </div>
          <Skeleton className="h-9 w-24 rounded-md shrink-0" />
        </div>
        <div className="flex-1 p-5 space-y-4 overflow-hidden">
          <Skeleton className="h-16 w-[70%] max-w-md rounded-md" />
          <Skeleton className="h-20 w-[75%] max-w-lg rounded-md ml-auto" />
          <Skeleton className="h-14 w-[60%] max-w-sm rounded-md" />
        </div>
        <div className="p-4 border-t border-zinc-300 dark:border-white/10">
          <Skeleton className="h-12 w-full rounded-md" />
        </div>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  )
}

function SkeletonWizard() {
  return (
    <div className="w-full max-w-3xl mx-auto min-w-0 space-y-6 animate-in fade-in duration-300" role="status" aria-label="Loading">
      <div className="text-center space-y-3">
        <Skeleton className="h-8 w-56 mx-auto" />
        <Skeleton className="h-4 w-72 max-w-full mx-auto" />
      </div>
      <div className="flex justify-center gap-2 mb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-2 w-16 rounded-full" />
        ))}
      </div>
      <div className="rounded-md border border-zinc-300 dark:border-white/10 bg-white dark:bg-[#0a0a0f] p-6 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-2 min-w-0">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56 max-w-full" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  )
}

/**
 * Unified full-page / section loading skeleton.
 * Layouts mirror real pages to avoid collapse / layout shift.
 */
export function PageSkeleton({
  variant = 'content',
  projectSlug,
  projectName = '',
  className,
}: PageSkeletonProps) {
  if (variant === 'dashboard') {
    return (
      <div className={cn('py-2 w-full min-w-0', className)}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div className="space-y-2 min-w-0">
            <Skeleton className="h-8 w-44" />
            <Skeleton className="h-4 w-56 max-w-full" />
          </div>
          <Skeleton className="h-10 w-36 rounded-md shrink-0" />
        </div>
        <SkeletonCards />
      </div>
    )
  }

  if (variant === 'profile') {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0f] transition-colors duration-300">
        <div className="border-b border-gray-300 dark:border-white/[0.06]">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <Skeleton className="h-9 w-36 shrink-0" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-md shrink-0" />
              <Skeleton className="h-9 w-24 rounded-md shrink-0" />
            </div>
          </div>
        </div>
        <main className="container mx-auto px-4 py-8 max-w-4xl min-w-0">
          <div className="space-y-2 mb-6">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </div>
          <div className="flex flex-wrap gap-2 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-28 rounded-md" />
            ))}
          </div>
          <SkeletonForm className="max-w-none" />
        </main>
      </div>
    )
  }

  if (variant === 'project' && projectSlug) {
    return (
      <ProjectShell projectSlug={projectSlug} projectName={projectName} className={className} mainClassName="relative z-10 p-6 lg:p-10 transition-all duration-300 min-w-0">
        <SkeletonProjectOverview />
      </ProjectShell>
    )
  }

  if (variant === 'project-content' && projectSlug) {
    return (
      <ProjectShell projectSlug={projectSlug} projectName={projectName} className={className}>
        <SkeletonContent />
      </ProjectShell>
    )
  }

  if (variant === 'settings' && projectSlug) {
    return (
      <div className={cn('min-h-screen bg-white dark:bg-[#0a0a0f] overflow-hidden transition-colors duration-300', className)}>
        <Sidebar projectSlug={projectSlug} projectName={projectName} />
        <main className="relative z-10 h-screen min-w-0" style={{ marginLeft: 'var(--sidebar-width, 0px)' }}>
          <div className="flex h-full min-w-0">
            <div className="w-64 shrink-0 border-r border-zinc-300 dark:border-white/10 p-4 space-y-3 hidden md:block">
              <Skeleton className="h-6 w-28 mb-4" />
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full rounded-md" />
              ))}
            </div>
            <div className="flex-1 p-6 lg:p-8 overflow-y-auto min-w-0">
              <SkeletonForm className="max-w-2xl" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (variant === 'stats' && projectSlug) {
    return (
      <ProjectShell projectSlug={projectSlug} projectName={projectName} className={className}>
        <SkeletonStats />
      </ProjectShell>
    )
  }

  if (variant === 'chat' && projectSlug) {
    return (
      <ProjectShell projectSlug={projectSlug} projectName={projectName} className={className} mainClassName="relative z-10 p-6 transition-all duration-300 min-w-0 h-screen">
        <SkeletonChat />
      </ProjectShell>
    )
  }

  if (variant === 'auth-shell' && projectSlug) {
    return (
      <div className={cn('min-h-screen bg-white dark:bg-[#0a0a0f] overflow-hidden transition-colors duration-300', className)}>
        <Sidebar projectSlug={projectSlug} projectName={projectName} />
        <div className="relative z-10 flex h-screen min-w-0" style={{ marginLeft: 'var(--sidebar-width, 0px)' }}>
          <div className="w-56 shrink-0 border-r border-zinc-300 dark:border-white/10 p-4 space-y-2 hidden lg:block">
            <Skeleton className="h-5 w-24 mb-3" />
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-md" />
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-6 lg:p-8 min-w-0">
            <SkeletonForm />
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'wizard') {
    return (
      <div className={cn('min-h-screen bg-white dark:bg-[#0a0a0f] flex items-center justify-center p-4 sm:p-8 transition-colors duration-300', className)}>
        <SkeletonWizard />
      </div>
    )
  }

  if (variant === 'editor' && projectSlug) {
    return (
      <div className="h-screen bg-white dark:bg-[#0a0a0f] overflow-hidden transition-colors duration-300">
        <Sidebar projectSlug={projectSlug} projectName={projectName} />
        <div
          className="relative z-10 h-full overflow-hidden min-w-0"
          style={{ marginLeft: 'var(--sidebar-width, 0px)' }}
        >
          <SkeletonEditor />
        </div>
      </div>
    )
  }

  if (variant === 'auth') {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0f] flex items-center justify-center p-4 transition-colors duration-300">
        <div className="w-full max-w-md space-y-5 min-w-0">
          <div className="flex justify-center">
            <Skeleton className="h-10 w-40" />
          </div>
          <div className="rounded-md border border-gray-300 dark:border-white/[0.08] bg-white dark:bg-[#0c0c14] p-8 space-y-4">
            <Skeleton className="h-6 w-40 mx-auto" />
            <Skeleton className="h-4 w-56 max-w-full mx-auto" />
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'centered') {
    return (
      <div
        className={cn(
          'min-h-screen bg-white dark:bg-[#0a0a0f] flex items-center justify-center p-4 sm:p-8 transition-colors duration-300',
          className,
        )}
      >
        <div className="w-full max-w-3xl min-w-0">
          <SkeletonContent />
        </div>
      </div>
    )
  }

  if (variant === 'form') {
    return (
      <div className={cn('p-6 lg:p-8 min-w-0', className)}>
        <SkeletonForm />
      </div>
    )
  }

  if (variant === 'table') {
    return (
      <div className={cn('p-6 lg:p-8 min-w-0', className)}>
        <SkeletonTable />
      </div>
    )
  }

  return (
    <div className={cn('p-4 sm:p-6 lg:p-8 w-full min-w-0', className)}>
      <SkeletonContent />
    </div>
  )
}

