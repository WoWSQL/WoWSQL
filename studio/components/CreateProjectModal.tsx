'use client'

import { X } from 'lucide-react'
import CreateProjectForm from './CreateProjectForm'
import { useRouter } from 'next/navigation'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const router = useRouter()

  if (!isOpen) return null

  const handleSuccess = (project: any) => {
    onClose()
    router.push(`/dashboard/project/${project.slug}`)
    router.refresh()
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <style dangerouslySetInnerHTML={{__html: `
        .modal-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .modal-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .modal-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .modal-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}} />
      <div className="glass-card rounded-2xl p-6 sm:p-8 max-w-3xl w-full border border-zinc-200 dark:border-white/5 bg-gradient-to-br from-white/[0.02] to-white/[0.01] transition-all duration-300 shadow-xl shadow-black/40 my-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-white">Create a New Project</h2>
            <p className="text-zinc-500 dark:text-white/50 text-xs sm:text-sm mt-1">
              Each project gets its own PostgreSQL database with configurable resources
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 dark:text-white/50 hover:text-zinc-900 dark:text-white transition-colors p-2 hover:bg-white/[0.05] rounded-lg"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto pr-2 modal-scroll">
          <CreateProjectForm 
            onSuccess={handleSuccess} 
            onCancel={onClose}
            showCancelButton={true}
            isModal={true}
          />
        </div>
      </div>
    </div>
  )
}
