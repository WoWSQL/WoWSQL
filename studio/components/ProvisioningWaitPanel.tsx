'use client'

import { useEffect, useState } from 'react'
import { Database, BookOpen, Terminal, Zap, Shield, Globe, ArrowRight, CheckCircle2 } from 'lucide-react'

interface ProvisioningWaitPanelProps {
  slug: string
  projectName: string
}

const DOC_CARDS = [
  {
    icon: Terminal,
    title: 'Connect via psql',
    desc: 'Use the standard PostgreSQL CLI or any SQL client with your connection string.',
    tag: 'Quickstart',
    color: 'text-emerald-500 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    border: 'border-emerald-200 dark:border-emerald-500/20',
  },
  {
    icon: Zap,
    title: 'REST API',
    desc: 'Query your database over HTTPS using PostgREST — no backend code needed.',
    tag: 'Auto-generated',
    color: 'text-blue-500 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    border: 'border-blue-200 dark:border-blue-500/20',
  },
  {
    icon: Shield,
    title: 'Row Level Security',
    desc: 'Define fine-grained access policies so every user only sees their own data.',
    tag: 'Security',
    color: 'text-violet-500 dark:text-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-500/10',
    border: 'border-violet-200 dark:border-violet-500/20',
  },
  {
    icon: Globe,
    title: 'Authentication',
    desc: 'Add email/password, magic links, or OAuth providers with a few clicks.',
    tag: 'Auth',
    color: 'text-amber-500 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    border: 'border-amber-200 dark:border-amber-500/20',
  },
]

const STEPS = [
  { label: 'Allocating compute resources', done: true },
  { label: 'Initialising PostgreSQL cluster', done: true },
  { label: 'Applying network configuration', done: false },
  { label: 'Running health checks', done: false },
]

export function ProvisioningWaitPanel({ slug, projectName }: ProvisioningWaitPanelProps) {
  const [elapsed, setElapsed] = useState(0)
  const [stepIdx, setStepIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (elapsed > 0 && elapsed % 8 === 0 && stepIdx < STEPS.length - 1) {
      setStepIdx((i) => i + 1)
    }
  }, [elapsed, stepIdx])

  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60
  const elapsedStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-[#050505] overflow-y-auto">
      {/* Subtle animated background */}
      <div className="fixed inset-0 pointer-events-none select-none overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000006_1px,transparent_1px),linear-gradient(to_bottom,#00000006_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:3rem_3rem]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-gradient-to-b from-blue-100/60 via-violet-100/40 to-transparent dark:from-blue-900/20 dark:via-violet-900/10 dark:to-transparent blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-start min-h-screen px-4 py-16 sm:py-20">

        {/* Brand mark */}
        <div className="flex items-center gap-2.5 mb-12 opacity-80">
          <Database className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
          <span className="text-sm font-medium text-zinc-400 dark:text-zinc-500 tracking-wide">WowSQL</span>
        </div>

        {/* Central spinner */}
        <div className="relative mb-10">
          {/* Outer glow ring */}
          <div className="absolute -inset-4 rounded-full bg-gradient-to-br from-blue-400/20 via-violet-400/15 to-cyan-400/10 dark:from-blue-500/15 dark:via-violet-500/10 dark:to-cyan-500/10 blur-xl animate-pulse" />
          {/* Spinning ring */}
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 -rotate-90 animate-spin" style={{ animationDuration: '2s' }} viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="32" fill="none" stroke="currentColor"
                className="text-zinc-100 dark:text-zinc-800" strokeWidth="4" />
              <circle cx="40" cy="40" r="32" fill="none"
                stroke="url(#provGrad)" strokeWidth="4"
                strokeLinecap="round" strokeDasharray="60 141" />
              <defs>
                <linearGradient id="provGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Database className="w-8 h-8 text-zinc-700 dark:text-zinc-300" />
            </div>
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-900 dark:text-white text-center mb-3 tracking-tight">
          Creating your space
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-base text-center max-w-sm leading-relaxed mb-2">
          We&apos;re spinning up a dedicated Postgres database for{' '}
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">{projectName}</span>.
          This usually takes 1–3 minutes.
        </p>
        <p className="text-xs text-zinc-400 dark:text-zinc-600 mb-10">
          Time elapsed: <span className="font-mono">{elapsedStr}</span>
        </p>

        {/* Step progress */}
        <div className="w-full max-w-sm mb-14 space-y-2.5">
          {STEPS.map((step, i) => {
            const isDone = i < stepIdx
            const isActive = i === stepIdx
            return (
              <div
                key={step.label}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-500 ${
                  isDone
                    ? 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20'
                    : isActive
                    ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20'
                    : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0" />
                ) : isActive ? (
                  <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-zinc-300 dark:border-zinc-700 flex-shrink-0" />
                )}
                <span
                  className={`text-sm ${
                    isDone
                      ? 'text-green-700 dark:text-green-300'
                      : isActive
                      ? 'text-blue-700 dark:text-blue-300 font-medium'
                      : 'text-zinc-400 dark:text-zinc-600'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Divider + "while you wait" */}
        <div className="w-full max-w-2xl mb-8">
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
            <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 dark:text-zinc-600 uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" />
              While you wait
            </div>
            <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </div>

        {/* Doc cards */}
        <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 mb-16">
          {DOC_CARDS.map((card) => {
            const Icon = card.icon
            return (
              <div
                key={card.title}
                className={`group rounded-2xl border p-5 cursor-default transition-all duration-200 hover:shadow-md ${card.bg} ${card.border}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-xl ${card.bg} ${card.border} border`}>
                    <Icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${card.bg} ${card.color} border ${card.border}`}>
                    {card.tag}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">{card.title}</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{card.desc}</p>
              </div>
            )
          })}
        </div>

        {/* Footer note */}
        <p className="text-xs text-zinc-400 dark:text-zinc-600 text-center max-w-xs">
          Don&apos;t close this tab — the page will automatically refresh once your database is ready.
        </p>
        <p className="text-xs text-zinc-300 dark:text-zinc-700 text-center font-mono mt-2">
          {slug}
        </p>
      </div>
    </div>
  )
}
