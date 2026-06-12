'use client'

import { useState } from 'react'
import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Table as TableIcon, Code, Database, Shield,
  HardDrive, Wifi, FileText, Menu, X, ChevronLeft, Radio, LogOut, Settings as SettingsIcon
} from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

interface SidebarProps {
  projectSlug: string
  projectName: string
}

export function Sidebar({ projectSlug, projectName }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path.includes('/auth')) {
      return pathname.startsWith(`/dashboard/project/${projectSlug}/auth`)
    }
    return pathname === path || pathname.startsWith(path + '/')
  }

  const isExpanded = isPinned || isHovering || isOpen

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.style.setProperty('--sidebar-width', '5rem')
    }
  }, [])

  const navItems = [
    { href: `/dashboard/project/${projectSlug}/tables`, icon: TableIcon, label: 'Table Editor' },
    { href: `/dashboard/project/${projectSlug}/sql`, icon: Code, label: 'SQL Editor' },
    { href: `/dashboard/project/${projectSlug}/api-docs`, icon: FileText, label: 'API Docs' },
  ]

  const serviceItems = [
    { href: `/dashboard/project/${projectSlug}/database`, icon: Database, label: 'Database' },
    { href: `/dashboard/project/${projectSlug}/auth/users`, icon: Shield, label: 'Auth Users' },
    { href: `/dashboard/project/${projectSlug}/realtime`, icon: Radio, label: 'Realtime' },
    { href: `/dashboard/project/${projectSlug}/storage`, icon: HardDrive, label: 'Storage' },
    { href: `/dashboard/project/${projectSlug}/settings`, icon: SettingsIcon, label: 'Settings' },
  ]

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 text-white shadow-sm"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className={`
          fixed left-0 top-0 h-screen bg-white dark:bg-[#050505]
          border-r border-zinc-200 dark:border-white/10 z-40 flex flex-col
          transition-[width] duration-300 ease-out overflow-hidden
          ${isOpen ? 'w-64' : 'w-0 lg:w-20'}
          ${isExpanded ? 'lg:w-64' : 'lg:w-20'}
        `}
      >
        <div className="flex-shrink-0 p-4 border-b border-zinc-200 dark:border-white/10">
          <div className={`flex items-center mb-3 ${isExpanded ? 'justify-between' : 'justify-center'}`}>
            <div className="flex items-center text-zinc-500 dark:text-zinc-400 p-1.5">
              <Database className="w-4 h-4 flex-shrink-0 text-blue-500" />
              {isExpanded && (
                <span className="text-sm ml-2 whitespace-nowrap font-medium text-zinc-900 dark:text-white">
                  WoWSQL
                </span>
              )}
            </div>
            {isExpanded && (
              <button
                onClick={() => setIsPinned(!isPinned)}
                className="hidden lg:block p-1.5 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
                title={isPinned ? "Unpin sidebar" : "Pin sidebar"}
              >
                <ChevronLeft className={`w-4 h-4 ${isPinned ? 'text-blue-500 dark:text-purple-400' : ''}`} />
              </button>
            )}
          </div>

          <div className="flex items-center justify-center">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-blue-600 dark:text-blue-400 font-bold text-xl uppercase">
                {projectName ? projectName.charAt(0) : 'W'}
              </span>
            </div>
            {isExpanded && (
              <div className="ml-3 overflow-hidden">
                <h2 className="font-semibold text-lg text-zinc-900 dark:text-white truncate whitespace-nowrap">{projectName || 'My Database'}</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Self-Hosted</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    relative flex items-center px-3 py-2.5 rounded-lg transition-colors duration-200
                    ${active
                      ? 'bg-zinc-200 text-zinc-900 dark:bg-white/10 dark:text-white font-medium'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/10'
                    }
                    ${!isExpanded ? 'justify-center' : ''}
                  `}
                  title={!isExpanded ? item.label : ''}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {isExpanded && (
                    <span className="ml-3 text-sm font-medium whitespace-nowrap">
                      {item.label}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>

          <div className="mt-6">
            {isExpanded && (
              <div className="px-3 mb-2 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Services
              </div>
            )}
            <div className="space-y-0.5">
              {serviceItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      relative flex items-center px-3 py-2.5 rounded-lg transition-colors duration-200
                      ${active
                        ? 'bg-zinc-200 text-zinc-900 dark:bg-white/10 dark:text-white font-medium'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/10'
                      }
                      ${!isExpanded ? 'justify-center' : ''}
                    `}
                    title={!isExpanded ? item.label : ''}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {isExpanded && (
                      <span className="ml-3 text-sm whitespace-nowrap">
                        {item.label}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-zinc-200 dark:border-white/10 flex flex-col gap-2">
          <div className="flex items-center overflow-hidden w-full" style={{ justifyContent: isExpanded ? 'flex-start' : 'center' }}>
            <ThemeToggle />
            {isExpanded && <span className="ml-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">Theme</span>}
          </div>
          <button
            onClick={async () => {
              try {
                const { default: api } = await import('@/lib/api')
                await api.post('/api/v1/auth/logout')
              } catch {}
              window.location.href = '/login'
            }}
            className={`flex items-center px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors duration-200 w-full ${!isExpanded ? 'justify-center' : ''}`}
            title={!isExpanded ? 'Logout' : ''}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {isExpanded && <span className="ml-3 text-sm font-medium whitespace-nowrap">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
