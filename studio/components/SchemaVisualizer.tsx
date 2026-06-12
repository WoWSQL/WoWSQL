'use client'

import { useEffect, useRef, useState } from 'react'
import { Table, Key, Link2, ZoomIn, ZoomOut, Maximize2, Grid3x3 } from 'lucide-react'

interface Column {
  name: string
  type: string
  nullable: boolean
  key: string
  default: string | null
  extra: string
}

interface TableSchema {
  name?: string
  table?: string  // API returns 'table' property
  columns: Column[]
  row_count?: number
  total?: number  // API returns 'total' for row count
}

interface Relationship {
  from: string
  to: string
  type: 'one-to-one' | 'one-to-many' | 'many-to-many' | 'many-to-one'
}

interface SchemaVisualizerProps {
  tables: TableSchema[]
  onTableClick?: (tableName: string) => void
}

interface TablePosition {
  x: number
  y: number
  width: number
  height: number
}

export function SchemaVisualizer({ tables, onTableClick }: SchemaVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [clickStart, setClickStart] = useState({ x: 0, y: 0 })
  const [tablePositions, setTablePositions] = useState<Map<string, TablePosition>>(new Map())
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set())
  const [hoveredTable, setHoveredTable] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'auto'>('grid')
  const [isDark, setIsDark] = useState(false)

  // Detect relationships between tables based on foreign keys
  const detectRelationships = (): Relationship[] => {
    const relationships: Relationship[] = []
    
    if (!tables || tables.length === 0) return relationships
    
    tables.forEach(table => {
      const tableName = table?.name || table?.table
      if (!table || !tableName || !table.columns) return
      
      table.columns.forEach(column => {
        if (!column || !column.name) return
        
        // Check if column is a foreign key (common patterns)
        if (column.key === 'MUL' || column.name.endsWith('_id') || column.name.endsWith('Id')) {
          // Try to find referenced table
          const possibleTableNames = [
            column.name.replace(/_id$/, '').replace(/Id$/, ''),
            column.name.replace(/_id$/, '').replace(/Id$/, '') + 's', // plural
            column.name.replace(/_id$/, '').replace(/Id$/, '') + 'es'
          ]
          
          const referencedTable = tables.find(t => {
            const refTableName = t?.name || t?.table
            return t && refTableName && possibleTableNames.some(name => 
              refTableName.toLowerCase() === name.toLowerCase()
            )
          })
          
          const refTableName = referencedTable?.name || referencedTable?.table
          if (referencedTable && refTableName && refTableName !== tableName) {
            relationships.push({
              from: tableName,
              to: refTableName,
              type: 'many-to-one'
            })
          }
        }
      })
    })
    
    return relationships
  }

  const relationships = detectRelationships()

  // Calculate grid layout positions
  const calculatePositions = () => {
    if (!tables || tables.length === 0) return
    
    const positions = new Map<string, TablePosition>()
    const cols = Math.ceil(Math.sqrt(tables.length))
    const cardWidth = 320
    const spacing = 80
    
    const rowHeights: number[] = []
    const tableHeights = tables.map(table => {
      const tableName = table.name || table.table
      const isExpanded = tableName ? expandedTables.has(tableName) : false
      const columnCount = table.columns?.length || 0
      const displayCount = isExpanded ? columnCount : Math.min(columnCount, 5)
      const hasMore = !isExpanded && columnCount > 5
      
      return Math.max(195, 115 + displayCount * 25 + (hasMore || isExpanded ? 30 : 0))
    })

    // First pass: find max height for each row
    tables.forEach((_, index) => {
      const row = Math.floor(index / cols)
      const height = tableHeights[index]
      if (!rowHeights[row] || height > rowHeights[row]) {
        rowHeights[row] = height
      }
    })

    // Second pass: set positions
    tables.forEach((table, index) => {
      const tableName = table.name || table.table
      if (!table || !tableName) return
      
      const row = Math.floor(index / cols)
      const col = index % cols
      
      let yPos = spacing
      for (let i = 0; i < row; i++) {
        yPos += rowHeights[i] + spacing
      }
      
      positions.set(tableName, {
        x: col * (cardWidth + spacing) + spacing,
        y: yPos,
        width: cardWidth,
        height: tableHeights[index]
      })
    })
    
    setTablePositions(positions)
  }

  useEffect(() => {
    calculatePositions()
  }, [tables, expandedTables])

  useEffect(() => {
    const root = document.documentElement
    const updateTheme = () => setIsDark(root.classList.contains('dark'))
    updateTheme()

    const observer = new MutationObserver(updateTheme)
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })

    return () => observer.disconnect()
  }, [])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current
      const container = containerRef.current
      if (!canvas || !container) return
      
      const rect = container.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Draw the schema visualization
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to match container
    const rect = container.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // If no tables, don't draw anything
    if (tablePositions.size === 0) return
    
    // Apply transformations
    ctx.save()
    ctx.translate(pan.x, pan.y)
    ctx.scale(zoom, zoom)

    const palette = isDark
      ? {
          cardBg: '#0f172a',
          cardHoverBg: '#1e293b',
          cardBorder: '#334155',
          cardBorderHover: '#8b5cf6',
          headerBg: '#7c3aed',
          headerText: '#ffffff',
          rowCountBg: '#1e293b',
          rowCountText: '#a78bfa',
          columnName: '#e2e8f0',
          columnType: '#94a3b8',
          bullet: '#64748b',
          primaryKey: '#fbbf24',
          moreText: '#64748b',
          relationship: '#8b5cf6',
          shadow: 'rgba(0, 0, 0, 0.3)',
          shadowHover: 'rgba(124, 58, 237, 0.5)'
        }
      : {
          cardBg: '#ffffff',
          cardHoverBg: '#f8fafc',
          cardBorder: '#e2e8f0',
          cardBorderHover: '#7c3aed',
          headerBg: '#7c3aed',
          headerText: '#ffffff',
          rowCountBg: '#eef2ff',
          rowCountText: '#6d28d9',
          columnName: '#0f172a',
          columnType: '#64748b',
          bullet: '#94a3b8',
          primaryKey: '#f59e0b',
          moreText: '#94a3b8',
          relationship: '#7c3aed',
          shadow: 'rgba(15, 23, 42, 0.12)',
          shadowHover: 'rgba(124, 58, 237, 0.35)'
        }

    // Draw relationships first (so they appear behind tables)
    ctx.lineWidth = 2
    relationships.forEach(rel => {
      const fromPos = tablePositions.get(rel.from)
      const toPos = tablePositions.get(rel.to)
      
      if (fromPos && toPos) {
        const spacing = 80;
        const radius = 20;
        const points = [];
        
        let fromX, toX;
        const isLeftToRight = fromPos.x <= toPos.x;
        
        if (isLeftToRight) {
            fromX = fromPos.x + fromPos.width;
            toX = toPos.x;
        } else {
            fromX = fromPos.x;
            toX = toPos.x + toPos.width;
        }
        
        const fromY = fromPos.y + 60;
        const toY = toPos.y + 60;
        
        if (Math.abs(fromPos.x - toPos.x) < 10) {
            const midX = fromPos.x + fromPos.width + spacing / 2;
            fromX = fromPos.x + fromPos.width;
            toX = toPos.x + toPos.width;
            points.push({x: fromX, y: fromY});
            points.push({x: midX, y: fromY});
            points.push({x: midX, y: toY});
            points.push({x: toX, y: toY});
        } 
        else if (Math.abs(toPos.x - (fromPos.x + fromPos.width)) < spacing + 10 || 
                 Math.abs(fromPos.x - (toPos.x + toPos.width)) < spacing + 10) {
            const midX = fromX + (toX - fromX) / 2;
            points.push({x: fromX, y: fromY});
            points.push({x: midX, y: fromY});
            points.push({x: midX, y: toY});
            points.push({x: toX, y: toY});
        }
        else {
            const midX1 = fromX + (isLeftToRight ? spacing / 2 : -spacing / 2);
            const midX2 = toX + (isLeftToRight ? -spacing / 2 : spacing / 2);
            const midY = Math.max(fromPos.y, toPos.y) - spacing / 2;
            points.push({x: fromX, y: fromY});
            points.push({x: midX1, y: fromY});
            points.push({x: midX1, y: midY});
            points.push({x: midX2, y: midY});
            points.push({x: midX2, y: toY});
            points.push({x: toX, y: toY});
        }

        ctx.beginPath();
        ctx.strokeStyle = palette.relationship;
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 4]);
        
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length - 1; i++) {
            ctx.arcTo(points[i].x, points[i].y, points[i+1].x, points[i+1].y, radius);
        }
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.stroke();
        ctx.setLineDash([]);
        
        const pLast = points[points.length - 1];
        const pPrev = points[points.length - 2];
        const arrowSize = 12;
        const dirX = Math.sign(pLast.x - pPrev.x);
        
        ctx.beginPath();
        ctx.fillStyle = palette.relationship;
        ctx.moveTo(pLast.x, pLast.y);
        if (dirX > 0) {
            ctx.lineTo(pLast.x - arrowSize, pLast.y - arrowSize / 2);
            ctx.lineTo(pLast.x - arrowSize, pLast.y + arrowSize / 2);
        } else {
            ctx.lineTo(pLast.x + arrowSize, pLast.y - arrowSize / 2);
            ctx.lineTo(pLast.x + arrowSize, pLast.y + arrowSize / 2);
        }
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.fillStyle = palette.relationship;
        ctx.arc(points[0].x, points[0].y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    })

    // Draw tables
    tablePositions.forEach((pos, tableName) => {
      const table = tables.find(t => (t.name || t.table) === tableName)
      if (!table) return

      const isHovered = hoveredTable === tableName

      // Draw card shadow with glow effect when hovered
      ctx.shadowColor = isHovered ? palette.shadowHover : palette.shadow
      ctx.shadowBlur = isHovered ? 30 : 10
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = isHovered ? 8 : 4

      // Draw card background with scale effect
      const scale = isHovered ? 1.02 : 1
      const scaledWidth = pos.width * scale
      const scaledHeight = pos.height * scale
      const xOffset = isHovered ? -((scaledWidth - pos.width) / 2) : 0
      const yOffset = isHovered ? -((scaledHeight - pos.height) / 2) : 0

      ctx.fillStyle = isHovered ? palette.cardHoverBg : palette.cardBg
      ctx.strokeStyle = isHovered ? palette.cardBorderHover : palette.cardBorder
      ctx.lineWidth = isHovered ? 3 : 1
      ctx.beginPath()
      ctx.roundRect(pos.x, pos.y, pos.width, pos.height, 12)
      ctx.fill()
      ctx.stroke()
      
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0

      // Draw table header
      const gradient = ctx.createLinearGradient(pos.x, pos.y, pos.x + pos.width, pos.y)
      gradient.addColorStop(0, '#3b82f6')
      gradient.addColorStop(0.5, '#8b5cf6')
      gradient.addColorStop(1, '#ec4899')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.roundRect(pos.x, pos.y, pos.width, 40, [12, 12, 0, 0])
      ctx.fill()

      // Draw table name
      ctx.fillStyle = palette.headerText
      ctx.font = 'bold 16px Inter, system-ui, sans-serif'
      ctx.fillText(tableName, pos.x + 40, pos.y + 26)

      // Draw table icon
      ctx.fillStyle = palette.headerText
      ctx.font = '20px Inter'
      ctx.fillText('⊞', pos.x + 12, pos.y + 28)

      // Draw row count badge if available
      const rowCount = table.row_count ?? table.total
      if (rowCount !== undefined) {
        const badge = `${rowCount} rows`
        ctx.font = '11px Inter, system-ui, sans-serif'
        const badgeWidth = ctx.measureText(badge).width + 16
        ctx.fillStyle = palette.rowCountBg
        ctx.beginPath()
        ctx.roundRect(pos.x + pos.width - badgeWidth - 8, pos.y + 12, badgeWidth, 16, 8)
        ctx.fill()
        ctx.fillStyle = palette.rowCountText
        ctx.fillText(badge, pos.x + pos.width - badgeWidth, pos.y + 23)
      }

      // Draw columns
      const isExpanded = expandedTables.has(tableName)
      const maxColumns = isExpanded ? table.columns.length : 5
      const displayColumns = table.columns.slice(0, maxColumns)
      
      ctx.font = '13px Inter, system-ui, sans-serif'
      displayColumns.forEach((column, index) => {
        const yPos = pos.y + 70 + index * 25
        
        // Column name
        ctx.fillStyle = column.key === 'PRI' ? palette.primaryKey : palette.columnName
        let nameText = column.name
        const maxNameWidth = 130
        if (ctx.measureText(nameText).width > maxNameWidth) {
          while (nameText.length > 0 && ctx.measureText(nameText + '...').width > maxNameWidth) {
            nameText = nameText.slice(0, -1)
          }
          nameText = nameText + '...'
        }
        ctx.fillText(nameText, pos.x + 35, yPos)
        
        // Primary key icon
        if (column.key === 'PRI') {
          ctx.fillStyle = palette.primaryKey
          ctx.font = '12px Inter'
          ctx.fillText('🔑', pos.x + 12, yPos)
          ctx.font = '13px Inter, system-ui, sans-serif'
        } else {
          ctx.fillStyle = palette.bullet
          ctx.font = '12px Inter'
          ctx.fillText('•', pos.x + 16, yPos)
          ctx.font = '13px Inter, system-ui, sans-serif'
        }
        
        // Column type
        ctx.fillStyle = palette.columnType
        ctx.font = '11px Inter, system-ui, sans-serif'
        let typeText = column.type
        const maxTypeWidth = pos.width - 190
        if (ctx.measureText(typeText).width > maxTypeWidth) {
          while (typeText.length > 0 && ctx.measureText(typeText + '...').width > maxTypeWidth) {
            typeText = typeText.slice(0, -1)
          }
          typeText = typeText + '...'
        }
        ctx.fillText(typeText, pos.x + 180, yPos)
        ctx.font = '13px Inter, system-ui, sans-serif'
      })

      // Show "more" indicator if there are more columns
      if (!isExpanded && table.columns.length > maxColumns) {
        const moreY = pos.y + 70 + maxColumns * 25
        ctx.fillStyle = palette.moreText
        ctx.font = '12px Inter, system-ui, sans-serif'
        ctx.fillText(`+ ${table.columns.length - maxColumns} more columns...`, pos.x + 35, moreY)
      }
    })

    ctx.restore()
  }, [tables, tablePositions, zoom, pan, hoveredTable, relationships, isDark, expandedTables])

  // Handle mouse interactions
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    setClickStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Check if hovering over a table
    const rect = canvas.getBoundingClientRect()
    const mouseX = (e.clientX - rect.left - pan.x) / zoom
    const mouseY = (e.clientY - rect.top - pan.y) / zoom

    let foundHover = false
    tablePositions.forEach((pos, tableName) => {
      if (
        mouseX >= pos.x &&
        mouseX <= pos.x + pos.width &&
        mouseY >= pos.y &&
        mouseY <= pos.y + pos.height
      ) {
        setHoveredTable(tableName)
        foundHover = true
        canvas.style.cursor = 'pointer'
      }
    })

    if (!foundHover) {
      setHoveredTable(null)
      canvas.style.cursor = isDragging ? 'grabbing' : 'grab'
    }

    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mouseY = (e.clientY - rect.top - pan.y) / zoom

    // Only trigger click if we didn't drag
    const wasDragging = isDragging
    setIsDragging(false)
    
    // If we were dragging, don't trigger click
    if (wasDragging) {
      const dragDistance = Math.abs(e.clientX - clickStart.x) + Math.abs(e.clientY - clickStart.y)
      if (dragDistance > 5) return // Ignore if dragged more than 5px
    }
    
    // Handle table click
    if (hoveredTable) {
      const pos = tablePositions.get(hoveredTable)
      if (pos) {
        if (mouseY <= pos.y + 40) {
          // Clicked header -> navigate
          if (onTableClick) onTableClick(hoveredTable)
        } else {
          // Clicked body -> toggle expand
          setExpandedTables(prev => {
            const next = new Set(prev)
            if (next.has(hoveredTable)) next.delete(hoveredTable)
            else next.add(hoveredTable)
            return next
          })
        }
      }
    }
  }

  const handleWheel = (e: React.WheelEvent) => {
    const zoomSensitivity = 0.002
    const delta = e.deltaY * zoomSensitivity
    const newZoom = Math.min(Math.max(0.2, zoom - delta), 3)
    
    if (newZoom !== zoom) {
      const canvas = canvasRef.current
      if (canvas) {
        const rect = canvas.getBoundingClientRect()
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top

        const zoomRatio = newZoom / zoom
        setPan(prevPan => ({
          x: mouseX - (mouseX - prevPan.x) * zoomRatio,
          y: mouseY - (mouseY - prevPan.y) * zoomRatio
        }))
        setZoom(newZoom)
      }
    }
  }

  const handleZoomIn = () => setZoom(Math.min(zoom + 0.2, 3))
  const handleZoomOut = () => setZoom(Math.max(zoom - 0.2, 0.5))
  const handleResetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  return (
    <div className="relative w-full h-full overflow-hidden" ref={containerRef}>
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="p-2 bg-zinc-100 dark:bg-white/10 hover:bg-zinc-100 dark:hover:bg-white/20 backdrop-blur-sm border border-zinc-200 dark:border-white/20 rounded-lg text-zinc-900 dark:text-white transition-all"
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 bg-zinc-100 dark:bg-white/10 hover:bg-zinc-100 dark:hover:bg-white/20 backdrop-blur-sm border border-zinc-200 dark:border-white/20 rounded-lg text-zinc-900 dark:text-white transition-all"
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          onClick={handleResetView}
          className="p-2 bg-zinc-100 dark:bg-white/10 hover:bg-zinc-100 dark:hover:bg-white/20 backdrop-blur-sm border border-zinc-200 dark:border-white/20 rounded-lg text-zinc-900 dark:text-white transition-all"
          title="Reset View"
        >
          <Maximize2 className="w-5 h-5" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-zinc-100 dark:bg-white/10 backdrop-blur-sm border border-zinc-200 dark:border-white/20 rounded-lg p-3">
        <div className="flex items-center gap-4 text-sm text-zinc-900 dark:text-white">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 rounded"></div>
            <span>Table</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-violet-500 rounded-full"></div>
              <div className="w-8 h-0.5 bg-violet-500 mx-1" style={{ borderTop: '2px dashed #8b5cf6' }}></div>
              <div className="w-0 h-0 border-l-8 border-l-violet-500 border-y-4 border-y-transparent"></div>
            </div>
            <span>Relationship</span>
          </div>
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Primary Key</span>
          </div>
        </div>
      </div>

      {/* Info Badge */}
      <div className="absolute top-4 left-4 z-10 bg-zinc-100 dark:bg-white/10 backdrop-blur-sm border border-zinc-200 dark:border-white/20 rounded-lg px-4 py-2">
        <div className="text-zinc-900 dark:text-white text-sm font-medium">
          {tables.length} {tables.length === 1 ? 'Table' : 'Tables'} · {relationships.length} {relationships.length === 1 ? 'Relationship' : 'Relationships'}
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setIsDragging(false)}
        onWheel={handleWheel}
        className="w-full h-full cursor-grab active:cursor-grabbing bg-transparent"
        style={{ display: 'block' }}
      />

      {/* Hover Tooltip */}
      {hoveredTable && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2 rounded-lg shadow-lg border border-zinc-700 dark:border-zinc-200 animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="font-medium">{hoveredTable}</span>
            <span className="text-zinc-400 dark:text-zinc-500 text-sm">• Click to view details</span>
          </div>
        </div>
      )}

      {/* Help Text */}
      {tables.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-zinc-500 dark:text-white/60">
            <Grid3x3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No tables found</p>
            <p className="text-sm">Create some tables to see the schema visualization</p>
          </div>
        </div>
      )}
    </div>
  )
}

