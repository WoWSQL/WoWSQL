'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import api from '@/lib/api'

interface Schema {
  name: string
  isSelected: boolean
  type: 'project' | 'shared'
}

interface SchemaSelectorProps {
  projectSlug: string
  onSchemaChange?: (schemaName: string) => void
  className?: string
}

export function SchemaSelector({ 
  projectSlug, 
  onSchemaChange,
  className = ''
}: SchemaSelectorProps) {
  const [schemas, setSchemas] = useState<Schema[]>([])
  const [selectedSchema, setSelectedSchema] = useState<string>('')
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadSchemas()
  }, [projectSlug])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  const loadSchemas = async () => {
    try {
      const response = await api.get('/api/v1/db/schemas', {
        headers: { 'X-Project-Slug': projectSlug }
      })
      const schemaList = response.data
      setSchemas(schemaList)
      
      // Set selected schema (first selected one or first one)
      const selected = schemaList.find((s: Schema) => s.isSelected) || schemaList[0]
      if (selected) {
        setSelectedSchema(selected.name)
      }
    } catch (err) {
      console.error('Failed to load schemas:', err)
      // Fallback to default schema
      setSchemas([{ name: 'public', isSelected: true, type: 'project' }])
      setSelectedSchema('public')
    }
  }

  const handleSchemaSelect = (schemaName: string) => {
    setSelectedSchema(schemaName)
    setShowDropdown(false)
    onSchemaChange?.(schemaName)
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors text-sm font-medium text-zinc-900 dark:text-white"
      >
        <span className="text-zinc-500 dark:text-white/70">schema</span>
        <span className="text-zinc-900 dark:text-white font-semibold">{selectedSchema || 'public'}</span>
        <ChevronDown className={`w-4 h-4 text-zinc-500 dark:text-white/50 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>
      
      {showDropdown && schemas.length > 0 && (
        <div className="absolute top-full mt-2 bg-zinc-100 dark:bg-[#0a0a0a] border border-zinc-200 dark:border-white/10 rounded-lg shadow-xl z-50 min-w-[220px] overflow-hidden">
          {schemas.map((schema) => (
            <button
              key={schema.name}
              onClick={() => handleSchemaSelect(schema.name)}
              className={`w-full text-left px-4 py-2.5 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors flex items-center justify-between ${
                schema.isSelected ? 'bg-purple-500/10' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-900 dark:text-white font-medium">{schema.name}</span>
                {schema.type === 'shared' && (
                  <span className="text-xs text-zinc-500 dark:text-white/40 bg-zinc-100 dark:bg-white/5 px-1.5 py-0.5 rounded">shared</span>
                )}
              </div>
              {schema.isSelected && (
                <Check className="w-4 h-4 text-purple-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
