'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, KeyRound, Shield, Link2, ScrollText, Settings as SettingsIcon } from 'lucide-react'

interface AuthSidebarProps {
  projectSlug: string
}

const sections = (slug: string) => [
  {
    label: 'MANAGE',
    items: [
      { href: `/dashboard/project/${slug}/auth/users`, icon: Users, label: 'Users' },
    ]
  },
  {
    label: 'CONFIGURATION',
    items: [
      { href: `/dashboard/project/${slug}/auth/providers`, icon: KeyRound, label: 'Providers' },
      { href: `/dashboard/project/${slug}/auth/url-config`, icon: Link2, label: 'URL Configuration' },
      { href: `/dashboard/project/${slug}/auth/audit-logs`, icon: ScrollText, label: 'Audit Logs' },
    ]
  },
  {
    label: 'SETTINGS',
    items: [
      { href: `/dashboard/project/${slug}/auth/config`, icon: SettingsIcon, label: 'Auth Settings' },
    ]
  }
]

export function AuthSidebar({ projectSlug }: AuthSidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <div className="w-56 flex-shrink-0 border-r border-zinc-200 dark:border-white/10 bg-white dark:bg-black/40 h-full overflow-y-auto">
      <div className="px-4 pt-6 pb-3">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-400" />
          <h2 className="text-sm font-bold text-zinc-900 dark:text-white tracking-wide">Authentication</h2>
        </div>
      </div>

      <nav className="px-2 pb-6">
        {sections(projectSlug).map((section) => (
          <div key={section.label} className="mb-4">
            <div className="px-3 mb-1.5 text-[10px] font-semibold text-zinc-600 dark:text-white/40 uppercase tracking-[0.15em]">
              {section.label}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors duration-150
                      ${active
                        ? 'bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white font-medium'
                        : 'text-zinc-600 dark:text-white/60 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/5'
                      }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  )
}
