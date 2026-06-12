'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { 
  HardDrive, 
  Database,
  Shield,
  RefreshCw,
  Download,
  Upload,
  FolderOpen,
  Image as ImageIcon,
  FileText,
  Video,
  Trash2,
  X,
  Plus,
  Eye,
  Copy,
  Check,
  Link,
  Globe,
  Lock
} from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { Button } from '@/components/Button'
import api from '@/lib/api'

interface Project {
  id: number
  name: string
  slug: string
  db_name: string
  ram_limit_mb: number
  storage_limit_gb: number
  requests_limit_per_month: number
}

interface ResourceUsage {
  ram: {
    used_mb: number
    limit_mb: number
    percentage: number
  }
  storage: {
    used_mb: number
    used_gb: number
    limit_gb: number
    percentage: number
    display_in_mb: boolean
  }
  requests: {
    this_month: number
    limit_per_month: number
    percentage: number
  }
}

interface Bucket {
  id: string
  name: string
  public: boolean
  file_size_limit: number | null
  allowed_mime_types: string[] | null
  object_count?: number
  total_size?: number
  created_at: string
}

interface StorageFile {
  id: string
  bucket_id: string
  name: string
  path: string
  mime_type: string | null
  size: number
  metadata: Record<string, any>
  created_at: string
  public_url?: string | null
}

interface StorageStats {
  total_files: number
  total_size_bytes: number
  total_size_gb: number
  bandwidth_used_bytes: number
  file_types: Record<string, number>
}

export default function StoragePage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [usage, setUsage] = useState<ResourceUsage | null>(null)
  const [loadingUsage, setLoadingUsage] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  
  const [buckets, setBuckets] = useState<Bucket[]>([])
  const [selectedBucket, setSelectedBucket] = useState<string>('')
  const [showCreateBucket, setShowCreateBucket] = useState(false)
  const [newBucketName, setNewBucketName] = useState('')
  const [newBucketPublic, setNewBucketPublic] = useState(false)
  const [newBucketSizeLimit, setNewBucketSizeLimit] = useState(50)
  const [creatingBucket, setCreatingBucket] = useState(false)
  
  const [files, setFiles] = useState<StorageFile[]>([])
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null)
  
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  
  const [previewFile, setPreviewFile] = useState<StorageFile | null>(null)
  const [deletingBucket, setDeletingBucket] = useState<string | null>(null)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [togglingBucket, setTogglingBucket] = useState<string | null>(null)

  useEffect(() => {
    loadProject()
    loadUsage()
    loadBuckets()
    loadStorageStats()
  }, [])

  useEffect(() => {
    if (selectedBucket) {
      loadFiles()
    }
  }, [selectedBucket])

  const loadProject = async () => {
    try {
      const response = await api.get(`/api/v1/projects/${slug}`)
      setProject(response.data)
    } catch (err) {
      console.error('Failed to load project')
    } finally {
      setLoading(false)
    }
  }

  const loadUsage = async () => {
    setLoadingUsage(true)
    try {
      const response = await api.get(`/api/v1/projects/${slug}/usage`)
      setUsage(response.data)
    } catch (err) {
      console.error('Failed to load usage data')
      setUsage({
        ram: { used_mb: 0, limit_mb: 300, percentage: 0 },
        storage: { used_mb: 0, used_gb: 0, limit_gb: 1, percentage: 0, display_in_mb: true },
        requests: { this_month: 0, limit_per_month: 50000, percentage: 0 }
      })
    } finally {
      setLoadingUsage(false)
    }
  }

  const loadBuckets = async () => {
    try {
      const response = await api.get(`/api/v1/storage/projects/${slug}/buckets`)
      setBuckets(response.data)
      if (response.data.length > 0 && !selectedBucket) {
        setSelectedBucket(response.data[0].name)
      }
    } catch (err) {
      console.error('Failed to load buckets:', err)
      setBuckets([])
    }
  }

  const loadFiles = async () => {
    if (!selectedBucket) return
    
    setLoadingFiles(true)
    try {
      const response = await api.get(`/api/v1/storage/projects/${slug}/buckets/${selectedBucket}/files`)
      setFiles(response.data)
    } catch (err) {
      console.error('Failed to load files:', err)
      setFiles([])
    } finally {
      setLoadingFiles(false)
    }
  }

  const loadStorageStats = async () => {
    try {
      const response = await api.get(`/api/v1/storage/projects/${slug}/stats`)
      setStorageStats(response.data)
    } catch (err) {
      console.error('Failed to load storage stats:', err)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([loadUsage(), loadBuckets(), loadFiles(), loadStorageStats()])
    setTimeout(() => setRefreshing(false), 500)
  }

  const handleCreateBucket = async () => {
    if (!newBucketName.trim()) return
    
    setCreatingBucket(true)
    try {
      await api.post(`/api/v1/storage/projects/${slug}/buckets`, {
        name: newBucketName.trim(),
        public: newBucketPublic,
        file_size_limit: newBucketSizeLimit * 1024 * 1024
      })
      
      setNewBucketName('')
      setNewBucketPublic(false)
      setNewBucketSizeLimit(50)
      setShowCreateBucket(false)
      await loadBuckets()
      await loadStorageStats()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create bucket')
    } finally {
      setCreatingBucket(false)
    }
  }

  const handleDeleteBucket = async (bucketName: string) => {
    if (!confirm(`Delete bucket "${bucketName}" and all its files? This cannot be undone.`)) return
    setDeletingBucket(bucketName)
    try {
      await api.delete(`/api/v1/storage/projects/${slug}/buckets/${bucketName}`)
      if (selectedBucket === bucketName) setSelectedBucket('')
      await loadBuckets()
      await loadStorageStats()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete bucket')
    } finally {
      setDeletingBucket(null)
    }
  }

  const handleToggleBucketVisibility = async (bucket: Bucket) => {
    const newPublic = !bucket.public
    const action = newPublic ? 'public' : 'private'
    if (!confirm(`Make bucket "${bucket.name}" ${action}? ${newPublic ? 'Files will be accessible without authentication.' : 'Public links will stop working.'}`)) return
    setTogglingBucket(bucket.name)
    try {
      await api.patch(`/api/v1/storage/projects/${slug}/buckets/${bucket.name}`, {
        public: newPublic,
      })
      await loadBuckets()
      if (selectedBucket === bucket.name) await loadFiles()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update bucket')
    } finally {
      setTogglingBucket(null)
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (!selectedBucket) {
      alert('Please select a bucket first')
      return
    }
    
    const droppedFiles = Array.from(e.dataTransfer.files)
    await uploadFiles(droppedFiles)
  }, [selectedBucket])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedBucket) {
      alert('Please select a bucket first')
      return
    }
    
    const selectedFiles = Array.from(e.target.files || [])
    await uploadFiles(selectedFiles)
  }

  const uploadFiles = async (filesToUpload: globalThis.File[]) => {
    setUploading(true)
    
    for (const file of filesToUpload) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }))
        
        await api.post(
          `/api/v1/storage/projects/${slug}/buckets/${selectedBucket}/files`,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent) => {
              const progress = progressEvent.total
                ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
                : 0
              setUploadProgress(prev => ({ ...prev, [file.name]: progress }))
            }
          }
        )
        
        setUploadProgress(prev => {
          const newProgress = { ...prev }
          delete newProgress[file.name]
          return newProgress
        })
      } catch (err: any) {
        console.error(`Failed to upload ${file.name}:`, err)
        alert(`Failed to upload ${file.name}: ${err.response?.data?.detail || err.message}`)
      }
    }
    
    setUploading(false)
    await Promise.all([loadFiles(), loadStorageStats(), loadUsage()])
  }

  const handleDeleteFile = async (file: StorageFile) => {
    if (!confirm(`Delete ${file.name}?`)) return
    
    try {
      await api.delete(`/api/v1/storage/projects/${slug}/files/${selectedBucket}/${file.path}`)
      await Promise.all([loadFiles(), loadStorageStats(), loadUsage()])
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete file')
    }
  }

  const handleDownloadFile = async (file: StorageFile) => {
    try {
      const response = await api.get(
        `/api/v1/storage/projects/${slug}/files/${selectedBucket}/${file.path}`,
        { responseType: 'blob' }
      )
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = file.name
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      alert('Failed to download file')
    }
  }

  const handleCopyPublicUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedUrl(url)
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  const isSelectedBucketPublic = buckets.find(b => b.name === selectedBucket)?.public ?? false

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = (mimeType: string | null) => {
    if (!mimeType) return <FileText className="w-8 h-8 text-gray-400" />
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-8 h-8 text-purple-400" />
    if (mimeType.startsWith('video/')) return <Video className="w-8 h-8 text-blue-400" />
    return <FileText className="w-8 h-8 text-green-400" />
  }

  const getFileTypeColor = (mimeType: string | null) => {
    if (!mimeType) return 'text-gray-400'
    if (mimeType.startsWith('image/')) return 'text-purple-400'
    if (mimeType.startsWith('video/')) return 'text-blue-400'
    if (mimeType.startsWith('application/pdf')) return 'text-red-400'
    return 'text-green-400'
  }

  if (loading || !project) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#000000] flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-zinc-900 dark:text-white">Loading storage...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#000000] overflow-hidden flex transition-colors duration-300">
            <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000010_1px,transparent_1px),linear-gradient(to_bottom,#00000010_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(0,0,0,0.8)_70%,transparent_100%)] dark:[mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(255,255,255,0.8)_70%,transparent_100%)] animate-grid-flow" />
      </div>

      <Sidebar projectSlug={slug} projectName={project.name} />

      <main className="relative z-10 flex-1 p-4 lg:p-8 transition-all duration-300" style={{ marginLeft: 'var(--sidebar-width, 0px)' }}>
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Storage</h1>
              <p className="text-zinc-600 dark:text-white/60">PostgreSQL-native file storage in the <code className="text-emerald-400 bg-zinc-100 dark:bg-white/5 px-1.5 py-0.5 rounded text-sm">storage</code> schema</p>
            </div>
            <Button
              onClick={handleRefresh}
              variant="outline"
              disabled={refreshing}
              className="flex items-center space-x-2 border-zinc-200 dark:border-white/20 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-100 dark:bg-white/10"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>

          {/* Storage Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6 hover:border-zinc-200 dark:border-white/10 transition-all duration-300">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Database className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-zinc-600 dark:text-white/60">Database Size</p>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                    {usage && usage.storage ? (
                      usage.storage.display_in_mb 
                        ? `${usage.storage.used_mb}MB`
                        : `${usage.storage.used_gb}GB`
                    ) : 'Loading...'}
                  </p>
                </div>
              </div>
              <div className="w-full bg-zinc-100 dark:bg-white/10 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all" 
                  style={{ width: `${usage && usage.storage ? usage.storage.percentage : 0}%` }} 
                />
              </div>
              <p className="text-xs text-zinc-600 dark:text-white/50 mt-2">
                {usage && usage.storage ? `${usage.storage.percentage}% of ${usage.storage.limit_gb}GB used` : 'Loading...'}
              </p>
            </div>

            <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6 hover:border-zinc-200 dark:border-white/10 transition-all duration-300">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <HardDrive className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-zinc-600 dark:text-white/60">File Storage</p>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                    {storageStats ? formatFileSize(storageStats.total_size_bytes) : '0 Bytes'}
                  </p>
                </div>
              </div>
              <p className="text-xs text-zinc-600 dark:text-white/50 mt-2">
                {storageStats ? `${storageStats.total_files} files across ${buckets.length} buckets` : '0 files'}
              </p>
            </div>

            <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6 relative overflow-hidden hover:border-green-500/30 transition-all duration-300">
              <div className="absolute top-2 right-2">
                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">Coming Soon</span>
              </div>
              <div className="flex items-center space-x-3 mb-4 opacity-50">
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-zinc-600 dark:text-white/60">Backups</p>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-white">0</p>
                </div>
              </div>
              <p className="text-xs text-zinc-600 dark:text-white/50 mt-2">No backups created yet</p>
            </div>
          </div>

          {/* Bucket Management */}
          <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6 mb-6 hover:border-zinc-200 dark:border-white/10 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center">
                <FolderOpen className="w-5 h-5 mr-2 text-orange-400" />
                Buckets
              </h3>
              <Button
                onClick={() => setShowCreateBucket(true)}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 hover:opacity-90 text-white shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>New Bucket</span>
              </Button>
            </div>

            {buckets.length === 0 ? (
              <div className="text-center py-8">
                <FolderOpen className="w-16 h-16 text-zinc-600 dark:text-white/30 mx-auto mb-4" />
                <p className="text-zinc-600 dark:text-white/60 mb-4">No buckets yet. Create one to start uploading files.</p>
                <Button onClick={() => setShowCreateBucket(true)} className="bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 hover:opacity-90 text-white shadow-sm">Create Your First Bucket</Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {buckets.map((bucket) => (
                  <div
                    key={bucket.id}
                    className={`relative p-4 rounded-lg border-2 transition-all text-left group ${
                      selectedBucket === bucket.name
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-zinc-200 dark:border-white/20 hover:border-zinc-200 dark:border-white/40 bg-zinc-100 dark:bg-white/5'
                    }`}
                  >
                    <button
                      onClick={() => setSelectedBucket(bucket.name)}
                      className="w-full text-left"
                    >
                      <FolderOpen className={`w-8 h-8 mb-2 ${
                        selectedBucket === bucket.name ? 'text-purple-400' : 'text-zinc-600 dark:text-white/60'
                      }`} />
                      <p className="text-zinc-900 dark:text-white font-medium truncate">{bucket.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className={`text-xs ${bucket.public ? 'text-blue-400' : 'text-zinc-600 dark:text-white/50'}`}>
                          {bucket.public ? (
                            <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> Public</span>
                          ) : (
                            <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Private</span>
                          )}
                        </p>
                        {bucket.object_count !== undefined && (
                          <p className="text-xs text-zinc-600 dark:text-white/40">
                            {bucket.object_count} files
                          </p>
                        )}
                      </div>
                      {bucket.file_size_limit && (
                        <p className="text-xs text-zinc-600 dark:text-white/40 mt-0.5">
                          Limit: {formatFileSize(bucket.file_size_limit)}
                        </p>
                      )}
                    </button>
                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleBucketVisibility(bucket) }}
                        disabled={togglingBucket === bucket.name}
                        className={`p-1 rounded transition-colors ${
                          bucket.public
                            ? 'bg-blue-500/10 hover:bg-blue-500/20'
                            : 'bg-amber-500/10 hover:bg-amber-500/20'
                        }`}
                        title={bucket.public ? 'Make private' : 'Make public'}
                      >
                        {togglingBucket === bucket.name ? (
                          <RefreshCw className="w-3.5 h-3.5 text-zinc-600 dark:text-white/50 animate-spin" />
                        ) : bucket.public ? (
                          <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        ) : (
                          <Globe className="w-3.5 h-3.5 text-blue-400" />
                        )}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteBucket(bucket.name) }}
                        className="p-1 rounded bg-red-500/0 hover:bg-red-500/20 transition-all"
                        title="Delete bucket"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* File Upload Zone */}
          {selectedBucket && (
            <div className="mb-6">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  isDragging
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-zinc-200 dark:border-white/20 hover:border-zinc-200 dark:border-white/40 bg-zinc-100 dark:bg-white/5'
                }`}
              >
                <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-purple-400' : 'text-zinc-600 dark:text-white/60'}`} />
                <p className="text-zinc-900 dark:text-white font-medium mb-2">
                  {isDragging ? 'Drop files here!' : 'Drag & drop files or click to browse'}
                </p>
                <p className="text-sm text-zinc-600 dark:text-white/60 mb-4">
                  Uploading to: <span className="text-purple-400 font-medium">{selectedBucket}</span>
                </p>
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  disabled={uploading}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className={`inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all ${
                    uploading
                      ? 'bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-white/40 cursor-not-allowed'
                      : 'bg-blue-600 text-white shadow-sm hover:from-blue-700 hover:to-purple-700'
                  }`}>
                    {uploading ? 'Uploading...' : 'Select Files'}
                  </span>
                </label>
              </div>

              {Object.keys(uploadProgress).length > 0 && (
                <div className="mt-4 space-y-2">
                  {Object.entries(uploadProgress).map(([filename, progress]) => (
                    <div key={filename} className="glass-card rounded-lg p-3 border border-zinc-200 dark:border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-zinc-900 dark:text-white truncate flex-1">{filename}</span>
                        <span className="text-sm text-zinc-600 dark:text-white/60 ml-2">{progress}%</span>
                      </div>
                      <div className="w-full bg-zinc-100 dark:bg-white/10 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* File Browser */}
          {selectedBucket && (
            <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6 hover:border-zinc-200 dark:border-white/10 transition-all duration-300">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center">
                <HardDrive className="w-5 h-5 mr-2 text-purple-400" />
                Files in <span className="text-purple-400 ml-1">{selectedBucket}</span>
                {isSelectedBucketPublic && (
                  <span className="ml-2 px-2 py-0.5 text-xs rounded bg-blue-500/20 text-blue-400">Public — files have shareable links</span>
                )}
              </h3>

              {loadingFiles ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
                  <p className="text-zinc-600 dark:text-white/60">Loading files...</p>
                </div>
              ) : files.length === 0 ? (
                <div className="text-center py-8">
                  <Upload className="w-16 h-16 text-zinc-600 dark:text-white/30 mx-auto mb-4" />
                  <p className="text-zinc-600 dark:text-white/60">No files in this bucket yet. Upload some files to get started!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-white/10">
                        <th className="pb-3 text-xs font-medium text-zinc-600 dark:text-white/50 uppercase tracking-wider">Name</th>
                        <th className="pb-3 text-xs font-medium text-zinc-600 dark:text-white/50 uppercase tracking-wider">Type</th>
                        <th className="pb-3 text-xs font-medium text-zinc-600 dark:text-white/50 uppercase tracking-wider">Size</th>
                        <th className="pb-3 text-xs font-medium text-zinc-600 dark:text-white/50 uppercase tracking-wider">Created</th>
                        <th className="pb-3 text-xs font-medium text-zinc-600 dark:text-white/50 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {files.map((file) => (
                        <tr key={file.id} className="hover:bg-zinc-200 dark:hover:bg-zinc-100 dark:bg-white/5 transition-colors">
                          <td className="py-3 pr-4">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                {getFileIcon(file.mime_type)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm text-zinc-900 dark:text-white font-medium truncate max-w-xs">{file.name}</p>
                                <p className="text-xs text-zinc-600 dark:text-white/40 truncate max-w-xs">{file.path}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            <span className={`text-xs ${getFileTypeColor(file.mime_type)}`}>
                              {file.mime_type || 'Unknown'}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            <span className="text-sm text-zinc-600 dark:text-white/70">{formatFileSize(file.size)}</span>
                          </td>
                          <td className="py-3 pr-4">
                            <span className="text-xs text-zinc-600 dark:text-white/50">
                              {new Date(file.created_at).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center justify-end space-x-1">
                              {file.public_url && (
                                <button
                                  onClick={() => handleCopyPublicUrl(file.public_url!)}
                                  className="p-1.5 rounded bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
                                  title={copiedUrl === file.public_url ? 'Copied!' : 'Copy public link'}
                                >
                                  {copiedUrl === file.public_url ? (
                                    <Check className="w-3.5 h-3.5 text-green-400" />
                                  ) : (
                                    <Link className="w-3.5 h-3.5 text-blue-400" />
                                  )}
                                </button>
                              )}
                              <button
                                onClick={() => handleDownloadFile(file)}
                                className="p-1.5 rounded bg-green-500/10 hover:bg-green-500/20 transition-colors"
                                title="Download"
                              >
                                <Download className="w-3.5 h-3.5 text-green-400" />
                              </button>
                              <button
                                onClick={() => handleDeleteFile(file)}
                                className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* File type breakdown */}
          {storageStats && Object.keys(storageStats.file_types).length > 0 && (
            <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6 mt-6">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">File Types</h3>
              <div className="flex flex-wrap gap-3">
                {Object.entries(storageStats.file_types).map(([ext, count]) => (
                  <div key={ext} className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-sm">
                    <span className="text-zinc-600 dark:text-white/80 font-mono">.{ext}</span>
                    <span className="ml-2 text-zinc-600 dark:text-white/40">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Create Bucket Modal */}
          {showCreateBucket && (
            <div className="fixed inset-0 bg-white dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="glass-card border border-zinc-200 dark:border-white/20 rounded-2xl p-6 max-w-md w-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Create New Bucket</h3>
                  <button
                    onClick={() => setShowCreateBucket(false)}
                    className="text-zinc-600 dark:text-white/60 hover:text-zinc-900 dark:hover:text-zinc-900 dark:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-600 dark:text-white/70 mb-2">
                      Bucket Name
                    </label>
                    <input
                      type="text"
                      value={newBucketName}
                      onChange={(e) => setNewBucketName(e.target.value)}
                      placeholder="e.g., avatars, documents"
                      className="w-full px-3 py-2 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/20 rounded-lg text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:text-white/40 focus:outline-none focus:border-zinc-200 dark:border-white/10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-600 dark:text-white/70 mb-2">
                      File Size Limit (MB)
                    </label>
                    <input
                      type="number"
                      value={newBucketSizeLimit}
                      onChange={(e) => setNewBucketSizeLimit(Number(e.target.value))}
                      min={1}
                      max={500}
                      className="w-full px-3 py-2 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/20 rounded-lg text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:text-white/40 focus:outline-none focus:border-zinc-200 dark:border-white/10"
                    />
                    <p className="text-xs text-zinc-600 dark:text-white/40 mt-1">Max individual file size in megabytes</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="public-bucket"
                      checked={newBucketPublic}
                      onChange={(e) => setNewBucketPublic(e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-200 dark:border-white/20 bg-zinc-100 dark:bg-white/5 text-purple-500 focus:ring-purple-500"
                    />
                    <label htmlFor="public-bucket" className="text-sm text-zinc-600 dark:text-white/70">
                      Make bucket public (files accessible without authentication)
                    </label>
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button
                      onClick={handleCreateBucket}
                      disabled={creatingBucket || !newBucketName.trim()}
                      className="flex-1 bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 hover:opacity-90 text-white shadow-sm"
                    >
                      {creatingBucket ? 'Creating...' : 'Create Bucket'}
                    </Button>
                    <Button
                      onClick={() => setShowCreateBucket(false)}
                      variant="outline"
                      className="border-zinc-200 dark:border-white/20 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-100 dark:bg-white/10"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
