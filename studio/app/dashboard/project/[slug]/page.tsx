'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Database, Table as TableIcon, Code, Shield, HardDrive, Radio, FileText } from 'lucide-react'
import Link from 'next/link'
import { Sidebar } from '@/components/Sidebar'
import api from '@/lib/api'

export default function ProjectOverview() {
  const params = useParams()
  const slug = params.slug as string || 'default'
  const [dbInfo, setDbInfo] = useState<any>(null)

  useEffect(() => {
    api.get(`/api/v1/auth/me`).catch(() => {})
  }, [])

  const features = [
    { href: `/dashboard/project/${slug}/tables`, icon: TableIcon, label: 'Table Editor', desc: 'Browse and edit your tables' },
    { href: `/dashboard/project/${slug}/sql`, icon: Code, label: 'SQL Editor', desc: 'Run SQL queries' },
    { href: `/dashboard/project/${slug}/database`, icon: Database, label: 'Database', desc: 'Schemas, extensions, roles' },
    { href: `/dashboard/project/${slug}/auth/users`, icon: Shield, label: 'Auth Users', desc: 'Manage authenticated users' },
    { href: `/dashboard/project/${slug}/storage`, icon: HardDrive, label: 'Storage', desc: 'File uploads and buckets' },
    { href: `/dashboard/project/${slug}/realtime`, icon: Radio, label: 'Realtime', desc: 'WebSocket subscriptions' },
    { href: `/dashboard/project/${slug}/api-docs`, icon: FileText, label: 'API Docs', desc: 'Auto-generated REST API' },
  ]

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050505]">
      <Sidebar projectSlug={slug} projectName="My Database" />
      <main className="lg:pl-20 p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">WoWSQL Self-Hosted</h1>
            <p className="text-zinc-500 dark:text-zinc-400">Your local PostgreSQL database with a full API layer</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href}>
                  <div className="bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-white/10 rounded-xl p-5 hover:border-blue-300 dark:hover:border-blue-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer h-full">
                    <Icon className="w-8 h-8 text-blue-500 dark:text-blue-400 mb-3" />
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">{item.label}</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{item.desc}</p>
                  </div>
                </Link>
              )
            })}
          </div>

          <div className="mt-8 bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">Connection Info</h2>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-zinc-500 dark:text-zinc-400">API Gateway:</span>
                <code className="ml-2 text-zinc-900 dark:text-white bg-zinc-100 dark:bg-white/5 px-2 py-0.5 rounded">http://localhost:8080</code>
              </div>
              <div>
                <span className="text-zinc-500 dark:text-zinc-400">REST API:</span>
                <code className="ml-2 text-zinc-900 dark:text-white bg-zinc-100 dark:bg-white/5 px-2 py-0.5 rounded">http://localhost:8080/rest/v1/</code>
              </div>
              <div>
                <span className="text-zinc-500 dark:text-zinc-400">Database:</span>
                <code className="ml-2 text-zinc-900 dark:text-white bg-zinc-100 dark:bg-white/5 px-2 py-0.5 rounded">localhost:5432</code>
              </div>
              <div>
                <span className="text-zinc-500 dark:text-zinc-400">Dashboard:</span>
                <code className="ml-2 text-zinc-900 dark:text-white bg-zinc-100 dark:bg-white/5 px-2 py-0.5 rounded">http://localhost:3000</code>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
