'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Book,
  Code,
  Copy,
  Check,
  ExternalLink,
  Database,
  Key,
  Search,
  ChevronRight,
  Zap,
  Shield,
  Globe,
  FileCode,
  Terminal,
  ArrowRight
} from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { Button } from '@/components/Button'
import api from '@/lib/api'
import { API_URL } from '@/lib/constants'

interface Project {
  id: number
  name: string
  slug: string
  description?: string
  db_name: string
  /** Regional project API URL e.g. https://{slug}.data-{region}.wowsql.com */
  api_endpoint?: string
  project_url?: string
  rest_url?: string
}

interface ApiKeys {
  project_url: string
  project_slug: string
  service_role_key: string
  anon_key: string
  api_endpoint: string
  rest_url?: string
}

export default function ApiDocsPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [project, setProject] = useState<Project | null>(null)
  const [apiKeys, setApiKeys] = useState<ApiKeys | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<string>('getting-started')

  useEffect(() => {
    loadProject()
    loadApiKeys()
  }, [slug])

  const loadProject = async () => {
    try {
      const response = await api.get(`/api/v1/projects/${slug}`)
      setProject(response.data)
    } catch (err) {
      console.error('Failed to load project')
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const loadApiKeys = async () => {
    try {
      const response = await api.get(`/api/v1/projects/${slug}/api-keys`)
      setApiKeys(response.data)
    } catch (err) {
      console.error('Failed to load API keys')
    }
  }

  const copyToClipboard = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading || !project) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#000000] flex items-center justify-center transition-colors duration-300">
        <p className="text-zinc-900 dark:text-white">Loading API documentation...</p>
      </div>
    )
  }

  // Use API-provided regional endpoint when available; otherwise derive from API_URL
  const projectUrl = project.rest_url || project.api_endpoint || project.project_url || (() => {
    const apiDomain = API_URL.replace('https://', '').replace('http://', '').replace('apis.', '').replace(':8000', '').split('/')[0]
    return `https://${project.slug}.${apiDomain}`
  })()

  const sections = [
    { id: 'getting-started', name: 'Getting Started', icon: Zap },
    { id: 'authentication', name: 'Authentication', icon: Key },
    { id: 'rest-api', name: 'REST API', icon: Globe },
    { id: 'query-data', name: 'Query Data', icon: Database },
    { id: 'insert-data', name: 'Insert Data', icon: FileCode },
    { id: 'update-data', name: 'Update Data', icon: Code },
    { id: 'delete-data', name: 'Delete Data', icon: Terminal },
    { id: 'filters', name: 'Filters & Operators', icon: Search },
    { id: 'client-sdks', name: 'Client SDKs', icon: Book }
  ]

  const CodeBlock = ({ code, language = 'bash' }: { code: string; language?: string }) => (
    <div className="relative">
      <pre className="bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/20 rounded-lg p-4 overflow-x-auto">
        <code className="text-sm text-zinc-600 dark:text-white/90 font-mono">{code}</code>
      </pre>
      <button
        onClick={() => copyToClipboard(code, code)}
        className="absolute top-3 right-3 p-2 hover:bg-zinc-200 dark:hover:bg-zinc-100 dark:bg-white/10 rounded-md text-zinc-600 dark:text-white/60 hover:text-zinc-900 dark:hover:text-zinc-900 dark:text-white transition border border-zinc-200 dark:border-white/20"
      >
        {copied === code ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#000000] overflow-hidden flex transition-colors duration-300">
      {/* Animated Background */}
            <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000010_1px,transparent_1px),linear-gradient(to_bottom,#00000010_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(0,0,0,0.8)_70%,transparent_100%)] dark:[mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(255,255,255,0.8)_70%,transparent_100%)] animate-grid-flow" />
      </div>

      {/* Sidebar */}
      <Sidebar projectSlug={slug} projectName={project.name} />

      {/* Main Content */}
      <main className="relative z-10 flex-1 transition-all duration-300" style={{ marginLeft: 'var(--sidebar-width, 0px)' }}>
        <div className="flex h-screen">
          {/* Documentation Sidebar */}
          <div className="w-64 glass-card border-r border-zinc-200 dark:border-white/10 flex flex-col overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-zinc-200 dark:border-white/10">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center space-x-2">
                <Book className="w-5 h-5 text-purple-400" />
                <span>API Docs</span>
              </h2>
            </div>

            {/* Navigation */}
            <div className="flex-1 p-4">
              <nav className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition flex items-center space-x-2 ${activeSection === section.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-zinc-600 dark:text-white/60 hover:bg-zinc-200 dark:hover:bg-zinc-100 dark:bg-white/10 hover:text-zinc-900 dark:hover:text-zinc-900 dark:text-white'
                        }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{section.name}</span>
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Footer Links */}
            <div className="p-4 border-t border-zinc-200 dark:border-white/10">
              <Link
                href={`/dashboard/project/${slug}/settings`}
                className="block px-3 py-2 text-sm text-zinc-600 dark:text-white/60 hover:text-zinc-900 dark:hover:text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-100 dark:bg-white/10 rounded-md transition"
              >
                <div className="flex items-center space-x-2">
                  <Key className="w-4 h-4" />
                  <span>API Keys</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Main Documentation Content */}
          <div className="flex-1 overflow-y-auto bg-black">
            <div className="p-8 max-w-5xl">
              {/* Getting Started */}
              {activeSection === 'getting-started' && (
                <div className="space-y-8 animate-fade-in-up">
                  <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Getting Started</h1>
                    <p className="text-zinc-600 dark:text-white/60">Learn how to integrate with the WoWSQL API</p>
                  </div>

                  {/* API Endpoint */}
                  <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6 hover:border-zinc-200 dark:border-white/10 transition-all duration-300">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4 flex items-center space-x-2">
                      <Globe className="w-5 h-5 text-blue-400" />
                      <span>Your API Endpoint</span>
                    </h2>
                    <div className="bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/20 rounded-lg p-4">
                      <p className="text-sm text-zinc-600 dark:text-white/60 mb-2">Base URL</p>
                      <div className="flex items-center justify-between">
                        <code className="text-blue-400 font-mono text-lg">{projectUrl}</code>
                        <button
                          onClick={() => copyToClipboard(projectUrl, 'endpoint')}
                          className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-100 dark:bg-white/10 rounded-md text-zinc-600 dark:text-white/60 hover:text-zinc-900 dark:hover:text-zinc-900 dark:text-white transition"
                        >
                          {copied === 'endpoint' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quick Example */}
                  <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6 hover:border-zinc-200 dark:border-white/10 transition-all duration-300">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">Quick Example</h2>
                    <p className="text-zinc-600 dark:text-white/60 mb-4">Make your first API request to fetch data from a table:</p>
                    <CodeBlock code={`curl -X POST ${projectUrl}/db/tables/users/query \\
  -H "Authorization: Bearer YOUR_ANON_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"limit": 10}'`} />
                  </div>

                  {/* Features */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6 hover:border-green-500/30 transition-all duration-300">
                      <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-4">
                        <Zap className="w-6 h-6 text-green-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">RESTful API</h3>
                      <p className="text-zinc-600 dark:text-white/60 text-sm">
                        Full CRUD operations via REST endpoints for all your database tables
                      </p>
                    </div>

                    <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6 hover:border-zinc-200 dark:border-white/10 transition-all duration-300">
                      <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
                        <Shield className="w-6 h-6 text-blue-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">Secure by Default</h3>
                      <p className="text-zinc-600 dark:text-white/60 text-sm">
                        API key authentication protects your data from unauthorized access
                      </p>
                    </div>

                    <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6 hover:border-zinc-200 dark:border-white/10 transition-all duration-300">
                      <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4">
                        <Code className="w-6 h-6 text-purple-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">Client SDKs</h3>
                      <p className="text-zinc-600 dark:text-white/60 text-sm">
                        Python and TypeScript SDKs available for easy integration
                      </p>
                    </div>

                    <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6 hover:border-orange-500/30 transition-all duration-300">
                      <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center mb-4">
                        <FileCode className="w-6 h-6 text-orange-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">JSON Format</h3>
                      <p className="text-zinc-600 dark:text-white/60 text-sm">
                        All requests and responses use standard JSON format
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Authentication */}
              {activeSection === 'authentication' && (
                <div className="space-y-8 animate-fade-in-up">
                  <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Authentication</h1>
                    <p className="text-zinc-600 dark:text-white/60">Secure your API requests with authentication keys</p>
                  </div>

                  {/* API Keys */}
                  <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6 hover:border-zinc-200 dark:border-white/10 transition-all duration-300">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">API Keys</h2>
                    <p className="text-zinc-600 dark:text-white/60 mb-6">
                      WoWSQL uses API keys to authenticate requests. You have two types of keys:
                    </p>

                    <div className="space-y-4">
                      {/* Anonymous Key */}
                      <div className="bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/20 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded font-mono">anon</span>
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">public</span>
                        </div>
                        <p className="text-zinc-900 dark:text-white font-semibold mb-2">Anonymous Key</p>
                        <p className="text-zinc-600 dark:text-white/60 text-sm mb-3">
                          Safe to use in browsers and mobile apps. Suitable for read operations.
                        </p>
                        {apiKeys?.anon_key && (
                          <div className="bg-white dark:bg-black/30 rounded p-3">
                            <code className="text-xs text-zinc-600 dark:text-white/80 font-mono break-all">{apiKeys.anon_key}</code>
                          </div>
                        )}
                      </div>

                      {/* Service Role Key */}
                      <div className="bg-zinc-100 dark:bg-white/5 border border-red-500/30 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="px-2 py-1 bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-white/70 text-xs rounded font-mono">service_role</span>
                          <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded font-semibold">secret</span>
                        </div>
                        <p className="text-zinc-900 dark:text-white font-semibold mb-2">Service Role Key</p>
                        <p className="text-zinc-600 dark:text-white/60 text-sm mb-3">
                          Full database access. Never expose in client-side code. Use only on servers.
                        </p>
                        <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
                          <p className="text-xs text-red-300">
                            ⚠️ Keep this key secret. Only use in backend/server environments.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <Link href={`/dashboard/project/${slug}/settings?tab=api-keys`}>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                          <Key className="w-4 h-4 mr-2" />
                          Manage API Keys
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Usage Example */}
                  <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">Using API Keys</h2>
                    <p className="text-zinc-600 dark:text-white/60 mb-4">Include your API key in the Authorization header:</p>
                    <CodeBlock code={`# Using Anonymous Key (client-side)
curl -X POST ${projectUrl}/db/tables/products/query \\
  -H "Authorization: Bearer ${apiKeys?.anon_key || 'YOUR_ANON_KEY'}" \\
  -H "Content-Type: application/json" \\
  -d '{"limit": 10}'

# Using Service Role Key (server-side only)
curl -X POST ${projectUrl}/db/tables/users/insert \\
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"email": "user@example.com", "name": "John"}'`} />
                  </div>
                </div>
              )}

              {/* REST API Overview */}
              {activeSection === 'rest-api' && (
                <div className="space-y-8 animate-fade-in-up">
                  <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">REST API</h1>
                    <p className="text-zinc-600 dark:text-white/60">Complete reference for all API endpoints</p>
                  </div>

                  {/* Base URL */}
                  <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">Base URL</h2>
                    <div className="bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/20 rounded-lg p-4">
                      <code className="text-blue-400 font-mono">{projectUrl}</code>
                    </div>
                  </div>

                  {/* Endpoints */}
                  <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-6">Available Endpoints</h2>

                    <div className="space-y-4">
                      {[
                        { method: 'POST', path: '/db/tables/{table}/query', desc: 'Query data from a table' },
                        { method: 'POST', path: '/db/tables/{table}/insert', desc: 'Insert new records' },
                        { method: 'POST', path: '/db/tables/{table}/update', desc: 'Update existing records' },
                        { method: 'POST', path: '/db/tables/{table}/delete', desc: 'Delete records' },
                        { method: 'GET', path: '/db/tables', desc: 'List all tables' },
                        { method: 'GET', path: '/db/tables/{table}/schema', desc: 'Get table schema' }
                      ].map((endpoint, idx) => (
                        <div key={idx} className="bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/20 rounded-lg p-4 hover:border-zinc-200 dark:border-white/30 transition">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${endpoint.method === 'GET'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-blue-500/20 text-blue-400'
                              }`}>
                              {endpoint.method}
                            </span>
                            <code className="text-zinc-600 dark:text-white/90 font-mono text-sm">{endpoint.path}</code>
                          </div>
                          <p className="text-zinc-600 dark:text-white/60 text-sm">{endpoint.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Common Headers */}
                  <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">Common Headers</h2>
                    <div className="space-y-3">
                      <div className="bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/20 rounded-lg p-3">
                        <code className="text-sm text-zinc-600 dark:text-white/90 font-mono">Authorization: Bearer YOUR_API_KEY</code>
                        <p className="text-zinc-600 dark:text-white/60 text-xs mt-1">Required for authentication</p>
                      </div>
                      <div className="bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/20 rounded-lg p-3">
                        <code className="text-sm text-zinc-600 dark:text-white/90 font-mono">Content-Type: application/json</code>
                        <p className="text-zinc-600 dark:text-white/60 text-xs mt-1">Required for POST requests</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Query Data */}
              {activeSection === 'query-data' && (
                <div className="space-y-8 animate-fade-in-up">
                  <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Query Data</h1>
                    <p className="text-zinc-600 dark:text-white/60">Fetch data from your database tables</p>
                  </div>

                  {/* Basic Query */}
                  <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">Basic Query</h2>
                    <p className="text-zinc-600 dark:text-white/60 mb-4">Fetch all records from a table:</p>
                    <CodeBlock code={`POST ${projectUrl}/db/tables/users/query

{
  "limit": 10
}`} />
                  </div>

                  {/* Select Specific Columns */}
                  <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">Select Specific Columns</h2>
                    <CodeBlock code={`POST ${projectUrl}/db/tables/users/query

{
  "select": ["id", "name", "email"],
  "limit": 20
}`} />
                  </div>

                  {/* With Filters */}
                  <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">Query with Filters</h2>
                    <CodeBlock code={`POST ${projectUrl}/db/tables/users/query

{
  "select": ["id", "name", "email"],
  "filters": [
    {"column": "age", "operator": "gte", "value": 18},
    {"column": "status", "operator": "eq", "value": "active"}
  ],
  "limit": 50
}`} />
                  </div>

                  {/* Advanced Filters */}
                  <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">Advanced Filters (IN, BETWEEN, IS NULL)</h2>
                    <CodeBlock code={`POST ${projectUrl}/db/tables/products/query

{
  "select": ["id", "name", "price", "category"],
  "filters": [
    {"column": "category", "operator": "in", "value": ["electronics", "books"]},
    {"column": "price", "operator": "between", "value": [10, 100]},
    {"column": "deleted_at", "operator": "is", "value": null}
  ],
  "limit": 20
}`} />
                  </div>

                  {/* GROUP BY and Aggregates */}
                  <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">GROUP BY with Aggregates</h2>
                    <CodeBlock code={`POST ${projectUrl}/db/tables/products/query

{
  "select": ["category", "COUNT(*) as count", "AVG(price) as avg_price", "SUM(price) as total"],
  "group_by": ["category"],
  "having": [
    {"column": "COUNT(*)", "operator": "gt", "value": 10}
  ],
  "order_by": [{"column": "count", "direction": "desc"}],
  "limit": 20
}`} />
                  </div>

                  {/* Sorting */}
                  <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">Sorting Results</h2>
                    <p className="text-zinc-600 dark:text-white/60 mb-2">Single column:</p>
                    <CodeBlock code={`POST ${projectUrl}/db/tables/products/query

{
  "select": ["id", "name", "price"],
  "order_by": "price",
  "order_direction": "desc",
  "limit": 10
}`} />
                    <p className="text-zinc-600 dark:text-white/60 mb-2 mt-4">Multiple columns:</p>
                    <CodeBlock code={`POST ${projectUrl}/db/tables/products/query

{
  "select": ["id", "name", "price", "category"],
  "order_by": [
    {"column": "category", "direction": "asc"},
    {"column": "price", "direction": "desc"}
  ],
  "limit": 20
}`} />
                  </div>

                  {/* Pagination */}
                  <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">Pagination</h2>
                    <CodeBlock code={`POST ${projectUrl}/db/tables/posts/query

{
  "limit": 20,
  "offset": 40
}`} />
                  </div>
                </div>
              )}

              {/* Insert Data */}
              {activeSection === 'insert-data' && (
                <div className="space-y-8 animate-fade-in-up">
                  <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Insert Data</h1>
                    <p className="text-zinc-600 dark:text-white/60">Add new records to your tables</p>
                  </div>

                  {/* Single Insert */}
                  <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">Insert Single Record</h2>
                    <CodeBlock code={`POST ${projectUrl}/db/tables/users/insert

{
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30
  }
}`} />
                    <div className="mt-4 bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                      <p className="text-sm text-green-300">
                        ✓ Returns the inserted record with auto-generated ID
                      </p>
                    </div>
                  </div>

                  {/* Bulk Insert */}
                  <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">Bulk Insert</h2>
                    <CodeBlock code={`POST ${projectUrl}/db/tables/products/insert

{
  "data": [
    {
      "name": "Product A",
      "price": 29.99,
      "stock": 100
    },
    {
      "name": "Product B",
      "price": 49.99,
      "stock": 50
    }
  ]
}`} />
                  </div>

                  {/* Response Example */}
                  <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">Response Example</h2>
                    <CodeBlock code={`{
  "success": true,
  "data": {
    "id": 123,
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30,
    "created_at": "2024-01-15T10:30:00Z"
  }
}`} language="json" />
                  </div>
                </div>
              )}

              {/* Update Data */}
              {activeSection === 'update-data' && (
                <div className="space-y-8 animate-fade-in-up">
                  <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Update Data</h1>
                    <p className="text-zinc-600 dark:text-white/60">Modify existing records in your tables</p>
                  </div>

                  {/* Update with ID */}
                  <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">Update by ID</h2>
                    <CodeBlock code={`POST ${projectUrl}/db/tables/users/update

{
  "filters": {
    "id": 123
  },
  "data": {
    "name": "John Updated",
    "age": 31
  }
}`} />
                  </div>

                  {/* Update with Filters */}
                  <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">Update with Filters</h2>
                    <CodeBlock code={`POST ${projectUrl}/db/tables/products/update

{
  "filters": {
    "category": "electronics",
    "stock": {"$lt": 10}
  },
  "data": {
    "status": "low_stock"
  }
}`} />
                  </div>

                  {/* Response Example */}
                  <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">Response Example</h2>
                    <CodeBlock code={`{
  "success": true,
  "updated_count": 1,
  "data": {
    "id": 123,
    "name": "John Updated",
    "email": "john@example.com",
    "age": 31,
    "updated_at": "2024-01-15T12:00:00Z"
  }
}`} language="json" />
                  </div>
                </div>
              )}

              {/* Delete Data */}
              {activeSection === 'delete-data' && (
                <div className="space-y-8 animate-fade-in-up">
                  <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Delete Data</h1>
                    <p className="text-zinc-600 dark:text-white/60">Remove records from your tables</p>
                  </div>

                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                    <p className="text-red-300 text-sm">
                      ⚠️ <strong>Warning:</strong> Delete operations are permanent and cannot be undone. Always use filters carefully.
                    </p>
                  </div>

                  {/* Delete by ID */}
                  <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">Delete by ID</h2>
                    <CodeBlock code={`POST ${projectUrl}/db/tables/users/delete

{
  "filters": {
    "id": 123
  }
}`} />
                  </div>

                  {/* Delete with Filters */}
                  <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">Delete with Filters</h2>
                    <CodeBlock code={`POST ${projectUrl}/db/tables/logs/delete

{
  "filters": {
    "created_at": {"$lt": "2024-01-01"},
    "processed": true
  }
}`} />
                  </div>

                  {/* Response Example */}
                  <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">Response Example</h2>
                    <CodeBlock code={`{
  "success": true,
  "deleted_count": 5,
  "message": "Successfully deleted 5 record(s)"
}`} language="json" />
                  </div>
                </div>
              )}

              {/* Filters & Operators */}
              {activeSection === 'filters' && (
                <div className="space-y-8 animate-fade-in-up">
                  <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Filters & Operators</h1>
                    <p className="text-zinc-600 dark:text-white/60">Advanced filtering for precise queries</p>
                  </div>

                  <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-6">Available Operators</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { op: 'eq', desc: 'Equal to', example: '{"column": "status", "operator": "eq", "value": "active"}' },
                        { op: 'neq', desc: 'Not equal to', example: '{"column": "status", "operator": "neq", "value": "deleted"}' },
                        { op: 'gt', desc: 'Greater than', example: '{"column": "age", "operator": "gt", "value": 18}' },
                        { op: 'gte', desc: 'Greater than or equal', example: '{"column": "age", "operator": "gte", "value": 18}' },
                        { op: 'lt', desc: 'Less than', example: '{"column": "price", "operator": "lt", "value": 100}' },
                        { op: 'lte', desc: 'Less than or equal', example: '{"column": "price", "operator": "lte", "value": 100}' },
                        { op: 'like', desc: 'Pattern match', example: '{"column": "email", "operator": "like", "value": "%@gmail.com"}' },
                        { op: 'is', desc: 'IS NULL / IS NOT NULL', example: '{"column": "deleted_at", "operator": "is", "value": null}' },
                        { op: 'in', desc: 'In array', example: '{"column": "category", "operator": "in", "value": ["electronics", "books"]}' },
                        { op: 'not_in', desc: 'Not in array', example: '{"column": "status", "operator": "not_in", "value": ["deleted", "archived"]}' },
                        { op: 'between', desc: 'Between values', example: '{"column": "price", "operator": "between", "value": [10, 100]}' },
                        { op: 'not_between', desc: 'Not between values', example: '{"column": "age", "operator": "not_between", "value": [18, 65]}' }
                      ].map((filter, idx) => (
                        <div key={idx} className="bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/20 rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <code className="text-purple-400 font-mono font-semibold">{filter.op}</code>
                            <span className="text-zinc-600 dark:text-white/40">-</span>
                            <span className="text-zinc-600 dark:text-white/70 text-sm">{filter.desc}</span>
                          </div>
                          <code className="text-xs text-zinc-600 dark:text-white/50 font-mono block mt-2 break-all">{filter.example}</code>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Complex Example */}
                  <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">Complex Filter Example</h2>
                    <CodeBlock code={`POST ${projectUrl}/db/tables/orders/query

{
  "select": ["id", "customer_email", "total_amount", "status", "created_at"],
  "filters": [
    {"column": "status", "operator": "in", "value": ["pending", "processing"]},
    {"column": "total_amount", "operator": "gte", "value": 100},
    {"column": "created_at", "operator": "gte", "value": "2024-01-01"},
    {"column": "customer_email", "operator": "like", "value": "%@company.com"}
  ],
  "order_by": [{"column": "created_at", "direction": "desc"}],
  "limit": 50
}`} />
                  </div>

                  {/* GROUP BY Example */}
                  <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">GROUP BY with Date Functions</h2>
                    <CodeBlock code={`POST ${projectUrl}/db/tables/orders/query

{
  "select": ["DATE(created_at) as date", "COUNT(*) as orders", "SUM(total_amount) as revenue"],
  "group_by": ["DATE(created_at)"],
  "having": [
    {"column": "COUNT(*)", "operator": "gt", "value": 5}
  ],
  "order_by": [{"column": "date", "direction": "desc"}],
  "limit": 30
}`} />
                  </div>
                </div>
              )}

              {/* Client SDKs */}
              {activeSection === 'client-sdks' && (
                <div className="space-y-8 animate-fade-in-up">
                  <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Client SDKs</h1>
                    <p className="text-zinc-600 dark:text-white/60">Official client libraries for popular languages</p>
                  </div>

                  {/* Python SDK */}
                  <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6 hover:border-zinc-200 dark:border-white/10 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white flex items-center space-x-2">
                        <Code className="w-6 h-6 text-blue-400" />
                        <span>Python SDK</span>
                      </h2>
                      <a
                        href="https://pypi.org/project/WOWSQL/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 transition flex items-center space-x-1"
                      >
                        <span className="text-sm">View on PyPI</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-zinc-900 dark:text-white font-semibold mb-2">Installation</h3>
                        <CodeBlock code="pip install WOWSQL" />
                      </div>

                      <div>
                        <h3 className="text-zinc-900 dark:text-white font-semibold mb-2">Quick Start</h3>
                        <CodeBlock code={`from WOWSQL import WOWSQL

# Initialize client
client = WOWSQL(
    api_endpoint="${projectUrl}",
    api_key="${apiKeys?.anon_key || 'YOUR_API_KEY'}"
)

# Query data
users = client.table('users').query(limit=10)
print(users)

# Insert data
new_user = client.table('users').insert({
    'name': 'John Doe',
    'email': 'john@example.com'
})

# Update data
client.table('users').update(
    filters={'id': 1},
    data={'name': 'Jane Doe'}
)

# Delete data
client.table('users').delete(filters={'id': 1})`} language="python" />
                      </div>
                    </div>
                  </div>

                  {/* TypeScript SDK */}
                  <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6 hover:border-zinc-200 dark:border-white/10 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white flex items-center space-x-2">
                        <Code className="w-6 h-6 text-purple-400" />
                        <span>TypeScript SDK</span>
                      </h2>
                      <a
                        href="https://www.npmjs.com/package/@wowsql/sdk"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:text-purple-300 transition flex items-center space-x-1"
                      >
                        <span className="text-sm">View on NPM</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-zinc-900 dark:text-white font-semibold mb-2">Installation</h3>
                        <CodeBlock code="npm install @wowsql/sdk" />
                      </div>

                      <div>
                        <h3 className="text-zinc-900 dark:text-white font-semibold mb-2">Quick Start</h3>
                        <CodeBlock code={`import { WOWSQLClient } from '@wowsql/sdk';

// Initialize client
const client = new WOWSQLClient({
  apiEndpoint: '${projectUrl}',
  apiKey: '${apiKeys?.anon_key || 'YOUR_API_KEY'}'
});

// Query data
const users = await client.table('users').query({ limit: 10 });
console.log(users);

// Insert data
const newUser = await client.table('users').insert({
  name: 'John Doe',
  email: 'john@example.com'
});

// Update data
await client.table('users').update({
  filters: { id: 1 },
  data: { name: 'Jane Doe' }
});

// Delete data
await client.table('users').delete({ filters: { id: 1 } });`} language="typescript" />
                      </div>
                    </div>
                  </div>

                  {/* More Info */}
                  <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Need More Examples?</h3>
                    <p className="text-zinc-600 dark:text-white/60 mb-4">
                      Visit our full documentation for more detailed examples, best practices, and advanced usage.
                    </p>
                    <a
                      href="https://wowsql.com/docs"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" className="border-zinc-200 dark:border-white/20 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-100 dark:bg-white/10">
                        <Book className="w-4 h-4 mr-2" />
                        View Full Documentation
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

