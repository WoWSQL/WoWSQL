'use client'

import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'

interface ProjectLayoutProps {
  children: ReactNode
  projectSlug: string
  projectName: string
}

export function ProjectLayout({ children, projectSlug, projectName }: ProjectLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20">
      <Sidebar projectSlug={projectSlug} projectName={projectName} />
      <main
        className="transition-all duration-300 relative z-0"
        style={{ paddingLeft: 'var(--sidebar-width, 0px)' }}
      >
        {children}
      </main>
    </div>
  )
}
