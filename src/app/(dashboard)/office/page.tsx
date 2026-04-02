'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  Building2, Upload, Search, FileText, Image, File,
  Folder, Tag, Eye, Download, Trash2, RefreshCw,
  Filter, X, CheckCircle
} from 'lucide-react'

interface Document {
  id: string
  documentCode: string
  name: string
  fileType: string
  category: string
  ocrStatus: string
  aiSummary: string | null
  createdAt: string
  uploader: { name: string }
  case: { caseTitle: string } | null
  client: { name: string } | null
  fileSize: number | null
}

export default function OfficePage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('ALL')
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [uploadProgress, setUploadProgress] = useState<string>('')

  async function fetchDocuments() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (category !== 'ALL') params.set('category', category)

      const res = await fetch(`/api/documents?${params}`)
      const data = await res.json()
      setDocuments(data.documents || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [search, category])

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    setUploadProgress('Uploading...')

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('category', category !== 'ALL' ? category : 'GENERAL')

        setUploadProgress(`Uploading ${file.name}...`)
        const res = await fetch('/api/documents', { method: 'POST', body: formData })

        if (res.ok) {
          setUploadProgress(`OCR processing ${file.name}...`)
        }
      }
      setUploadProgress('Done!')
      setTimeout(() => setUploadProgress(''), 2000)
      fetchDocuments()
    } catch {
      setUploadProgress('Upload failed')
    } finally {
      setUploading(false)
    }
  }, [category])

  function formatFileSize(bytes: number | null): string {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  function getFileIcon(fileType: string) {
    if (['jpg', 'jpeg', 'png', 'gif'].includes(fileType.toLowerCase())) {
      return <Image className="w-5 h-5 text-blue-400" />
    }
    if (fileType.toLowerCase() === 'pdf') {
      return <FileText className="w-5 h-5 text-red-400" />
    }
    return <File className="w-5 h-5 text-gray-400" />
  }

  const categories = [
    { value: 'ALL', label: 'All Documents', icon: '📁' },
    { value: 'PETITION', label: 'Petitions', icon: '⚖️' },
    { value: 'ORDER', label: 'Court Orders', icon: '📋' },
    { value: 'JUDGEMENT', label: 'Judgements', icon: '🔨' },
    { value: 'AFFIDAVIT', label: 'Affidavits', icon: '📝' },
    { value: 'AGREEMENT', label: 'Agreements', icon: '🤝' },
    { value: 'NOTICE', label: 'Notices', icon: '📢' },
    { value: 'EVIDENCE', label: 'Evidence', icon: '🔍' },
    { value: 'ID_PROOF', label: 'ID Proofs', icon: '🪪' },
    { value: 'VAKALATNAMA', label: 'Vakalatnama', icon: '📜' },
    { value: 'GENERAL', label: 'General', icon: '📄' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="page-header flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-orange-600" />
            </div>
            <h1 className="page-title">Daftar — Office Management</h1>
          </div>
          <p className="page-subtitle">
            Searchable document vault • OCR-powered • {documents.length} documents stored
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => document.getElementById('office-upload')?.click()}
            className="btn-primary"
          >
            <Upload className="w-4 h-4" />
            Upload Documents
          </button>
          <input
            id="office-upload"
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.docx,.doc,.txt"
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
          />
        </div>
      </div>

      {/* Upload Status */}
      {uploadProgress && (
        <div className="mb-4 flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-sm px-4 py-3 rounded-lg">
          <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
          {uploadProgress}
        </div>
      )}

      <div className="flex gap-6">
        {/* Left: Category Sidebar */}
        <div className="w-52 flex-shrink-0">
          <div className="hexis-card p-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 mb-2">Categories</p>
            <div className="space-y-0.5">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-all ${
                    category === cat.value
                      ? 'bg-hexis-navy text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span className="truncate">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Drag & Drop Zone */}
          <div
            className="mt-4 border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-orange-300 hover:bg-orange-50/30 transition-all"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              handleFileUpload(e.dataTransfer.files)
            }}
            onClick={() => document.getElementById('office-upload')?.click()}
          >
            <Upload className="w-6 h-6 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-400">Drop files here</p>
            <p className="text-xs text-gray-300 mt-0.5">PDF, Images, Docs</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents by name, content, OCR text, tags..."
              className="form-input pl-9"
            />
          </div>

          {/* Document Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="hexis-card p-4 animate-pulse">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg mb-3" />
                  <div className="h-3 bg-gray-100 rounded w-3/4 mb-2" />
                  <div className="h-2 bg-gray-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="hexis-card p-12 text-center">
              <Building2 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No documents found</p>
              <p className="text-gray-400 text-sm mt-1">
                {search ? 'Try different search terms' : 'Upload your first document to get started'}
              </p>
              <button
                onClick={() => document.getElementById('office-upload')?.click()}
                className="btn-primary inline-flex mt-4"
              >
                <Upload className="w-4 h-4" />
                Upload Document
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className="hexis-card p-4 cursor-pointer hover:border-orange-200 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                      {getFileIcon(doc.fileType)}
                    </div>
                    <div className="flex items-center gap-1">
                      {doc.ocrStatus === 'DONE' && (
                        <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded font-medium">
                          OCR
                        </span>
                      )}
                      {doc.aiSummary && (
                        <span className="text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded font-medium">
                          AI
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-900 group-hover:text-hexis-navy transition-colors line-clamp-2 mb-1">
                    {doc.name}
                  </p>
                  <p className="text-xs text-gray-400 mb-2">
                    {doc.category} • {doc.fileType.toUpperCase()}
                    {doc.fileSize && ` • ${formatFileSize(doc.fileSize)}`}
                  </p>
                  {doc.case && (
                    <p className="text-xs text-gray-500 truncate">📂 {doc.case.caseTitle}</p>
                  )}
                  {doc.client && !doc.case && (
                    <p className="text-xs text-gray-500 truncate">👤 {doc.client.name}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">{doc.uploader.name}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Document Preview Panel */}
        {selectedDoc && (
          <div className="w-72 flex-shrink-0">
            <div className="hexis-card p-5 sticky top-0">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-800">Document Details</h3>
                <button onClick={() => setSelectedDoc(null)}>
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              </div>

              <div className="w-full h-32 bg-gray-50 rounded-lg flex items-center justify-center mb-4">
                {getFileIcon(selectedDoc.fileType)}
              </div>

              <h4 className="font-medium text-gray-900 text-sm mb-3">{selectedDoc.name}</h4>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Category</span>
                  <span className="font-medium text-gray-700">{selectedDoc.category}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Type</span>
                  <span className="font-medium text-gray-700">{selectedDoc.fileType.toUpperCase()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Uploaded by</span>
                  <span className="font-medium text-gray-700">{selectedDoc.uploader.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">OCR Status</span>
                  <span className={`font-medium ${
                    selectedDoc.ocrStatus === 'DONE' ? 'text-green-600' :
                    selectedDoc.ocrStatus === 'PROCESSING' ? 'text-amber-600' :
                    'text-gray-500'
                  }`}>
                    {selectedDoc.ocrStatus}
                  </span>
                </div>
              </div>

              {selectedDoc.aiSummary && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                    ✨ AI Summary
                  </p>
                  <p className="text-xs text-gray-500 leading-relaxed">{selectedDoc.aiSummary}</p>
                </div>
              )}

              <div className="mt-4 space-y-2">
                <a
                  href={`/api/documents/${selectedDoc.id}/download`}
                  className="btn-secondary w-full justify-center text-xs py-2"
                >
                  <Download className="w-3 h-3" />
                  Download
                </a>
                {selectedDoc.ocrStatus !== 'DONE' && (
                  <button className="btn-secondary w-full justify-center text-xs py-2">
                    <RefreshCw className="w-3 h-3" />
                    Run OCR
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
