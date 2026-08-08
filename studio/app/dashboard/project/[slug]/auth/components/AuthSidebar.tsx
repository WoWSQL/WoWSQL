'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Users, KeyRound, Shield, Lock, Clock, Gauge, Fingerprint,
  Link2, ShieldAlert, Webhook, ScrollText, Mail, BarChart3, AppWindow, Settings, SlidersHorizontal
} from 'lucide-react'

interface AuthSidebarProps {
  projectSlug: string
}

const sections = (slug: string) => [
  {
    label: 'MANAGE',
    items: [
      { href: `/dashboard/project/${slug}/auth/users`, icon: Users, label: 'Users' },
      { href: `/dashboard/project/${slug}/auth/providers`, icon: AppWindow, label: 'OAuth Apps' },
    ]
  },
  {
    label: 'NOTIFICATIONS',
    items: [
      { href: `/dashboard/project/${slug}/auth/emails`, icon: Mail, label: 'Email' },
    ]
  },
  {
    label: 'CONFIGURATION',
    items: [
      { href: `/dashboard/project/${slug}/auth/policies`, icon: Lock, label: 'Policies' },
      { href: `/dashboard/project/${slug}/auth/providers`, icon: KeyRound, label: 'Sign In / Providers', primary: true },
      { href: `/dashboard/project/${slug}/auth/sessions`, icon: Clock, label: 'Sessions' },
      { href: `/dashboard/project/${slug}/auth/rate-limits`, icon: Gauge, label: 'Rate Limits' },
      { href: `/dashboard/project/${slug}/auth/mfa`, icon: Fingerprint, label: 'Multi-Factor' },
      { href: `/dashboard/project/${slug}/auth/url-config`, icon: Link2, label: 'URL Configuration' },
      { href: `/dashboard/project/${slug}/auth/attack-protection`, icon: ShieldAlert, label: 'Attack Protection' },
      { href: `/dashboard/project/${slug}/auth/hooks`, icon: Webhook, label: 'Auth Hooks', badge: 'BETA' },
      { href: `/dashboard/project/${slug}/auth/audit-logs`, icon: ScrollText, label: 'Audit Logs' },
      { href: `/dashboard/project/${slug}/auth/performance`, icon: BarChart3, label: 'Performance' },
    ]
  },
  {
    label: 'SETTINGS',
    items: [
      { href: `/dashboard/project/${slug}/auth/config`, icon: SlidersHorizontal, label: 'Auth Settings' },
      { href: `/dashboard/project/${slug}/auth/disable`, icon: Settings, label: 'Disable Auth', danger: true },
    ]
  }
]

export function AuthSidebar({ projectSlug }: AuthSidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href.endsWith('/providers')) {
      return pathname === href || pathname.startsWith(href + '/')
    }
    return pathname === href || pathname.startsWith(href + '/')
  }

  const allSections = sections(projectSlug)

  return (
    <div className="w-56 flex-shrink-0 border-r border-border bg-card h-full overflow-y-auto custom-scrollbar">
      <div className="px-3 pt-5 pb-2">
        <div className="flex items-center gap-2 px-1">
          <Shield className="w-4 h-4 text-blue-400 shrink-0" />
          <h2 className="ui-page-title">Authentication</h2>
        </div>
      </div>

      <nav className="px-2 pb-5">
        {allSections.map((section) => (
          <div key={section.label} className="mb-3">
            <div className="px-2 mb-1 ui-label uppercase tracking-wider">
              {section.label}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                const isDanger = 'danger' in item && item.danger
                return (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    className={`
                      flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors duration-150
                      ${active
                        ? isDanger
                          ? 'bg-red-500/10 text-red-400 font-medium'
                          : 'bg-muted text-foreground font-medium'
                        : isDanger
                          ? 'text-red-400/70 hover:text-red-400 hover:bg-red-500/5'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
                      }
                    `}
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                    {'badge' in item && item.badge && (
                      <span className="ml-auto text-[9px] font-semibold bg-blue-500/15 text-blue-500 dark:text-blue-400 border border-blue-500/25 px-1.5 py-0.5 rounded-md">
                        {item.badge}
                      </span>
                    )}
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
