import React, { useState } from 'react'
import { Play, Download, Plus, Trash2, Info, Lock, Globe, CheckCircle, AlertTriangle, ShieldCheck, MoreVertical, Edit3, Save, X } from 'lucide-react'

export default function Sources({ 
  sources, 
  onAddSource, 
  onRemoveSource, 
  onUpdateSource,
  downloadSources = [], 
  onAddDownloadSource, 
  onRemoveDownloadSource, 
  onUpdateDownloadSource,
  user,
  isAdmin = false
}) {
  const [activeTab, setActiveTab] = useState('streaming') // 'streaming' or 'download'
  
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // 3-dots Menu & Inline Edit states
  const [openMenuId, setOpenMenuId] = useState(null)
  const [editingSourceId, setEditingSourceId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editUrl, setEditUrl] = useState('')
  const [editIsPublic, setEditIsPublic] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!name.trim()) {
      setError('Please provide a source name.')
      return
    }
    if (!url.trim()) {
      setError('Please provide a source URL.')
      return
    }

    let finalUrl = url.trim()
    const placeholderRegex = /\{id\}|:id|\[id\]|%id%|\$id|\{tmdb\}|:tmdb/gi

    if (!placeholderRegex.test(finalUrl)) {
      finalUrl = finalUrl.endsWith('/') ? `${finalUrl}{id}` : `${finalUrl}/{id}`
    }

    const publicFlag = isAdmin ? isPublic : false

    try {
      if (activeTab === 'streaming') {
        onAddSource(name.trim(), finalUrl, publicFlag)
      } else {
        onAddDownloadSource(name.trim(), finalUrl, publicFlag)
      }
      setName('')
      setUrl('')
      setIsPublic(false)
      setSuccess(`Source "${name}" added successfully as ${publicFlag ? 'Public' : 'Private'}!`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to add source.')
    }
  }

  const handleQuickInsertTag = (tag) => {
    setUrl((prev) => {
      const trimmed = prev.trim()
      if (!trimmed) return `https://example.com/movie/${tag}`
      if (trimmed.endsWith('/')) return trimmed + tag
      return trimmed + '/' + tag
    })
  }

  const handleStartEdit = (source) => {
    setEditingSourceId(source.id)
    setEditName(source.name)
    setEditUrl(source.url)
    setEditIsPublic(!!source.is_public)
    setOpenMenuId(null)
  }

  const handleCancelEdit = () => {
    setEditingSourceId(null)
    setEditName('')
    setEditUrl('')
  }

  const handleSaveEdit = (sourceId) => {
    if (!editName.trim() || !editUrl.trim()) return

    let finalUrl = editUrl.trim()
    const placeholderRegex = /\{id\}|:id|\[id\]|%id%|\$id|\{tmdb\}|:tmdb/gi
    if (!placeholderRegex.test(finalUrl)) {
      finalUrl = finalUrl.endsWith('/') ? `${finalUrl}{id}` : `${finalUrl}/{id}`
    }

    const publicFlag = isAdmin ? editIsPublic : false

    if (activeTab === 'streaming') {
      if (onUpdateSource) onUpdateSource(sourceId, editName.trim(), finalUrl, publicFlag)
    } else {
      if (onUpdateDownloadSource) onUpdateDownloadSource(sourceId, editName.trim(), finalUrl, publicFlag)
    }

    setEditingSourceId(null)
    setSuccess('Source updated successfully!')
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleTogglePublicPrivate = (source) => {
    const newScope = !source.is_public
    if (activeTab === 'streaming') {
      if (onUpdateSource) onUpdateSource(source.id, source.name, source.url, newScope)
    } else {
      if (onUpdateDownloadSource) onUpdateDownloadSource(source.id, source.name, source.url, newScope)
    }
    setOpenMenuId(null)
    setSuccess(`Source "${source.name}" updated to ${newScope ? 'Public' : 'Private'}!`)
    setTimeout(() => setSuccess(''), 3000)
  }

  const currentSourcesList = activeTab === 'streaming' ? sources : downloadSources
  const handleRemove = activeTab === 'streaming' ? onRemoveSource : onRemoveDownloadSource

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            Manage Sources
          </h1>
          <p className="text-slate-400 text-sm">
            Configure video streaming and download endpoints for CineLog.
          </p>
        </div>
        {isAdmin && (
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full text-xs font-extrabold self-start sm:self-auto">
            <ShieldCheck className="w-4 h-4" />
            Admin Account (Public Controls Active)
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 mb-6">
        <button
          onClick={() => {
            setActiveTab('streaming')
            setError('')
            setSuccess('')
            setEditingSourceId(null)
            setOpenMenuId(null)
          }}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'streaming'
              ? 'border-violet-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Play className="w-4 h-4" />
          Streaming Sources
        </button>
        <button
          onClick={() => {
            setActiveTab('download')
            setError('')
            setSuccess('')
            setEditingSourceId(null)
            setOpenMenuId(null)
          }}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'download'
              ? 'border-violet-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Download className="w-4 h-4" />
          Download Sources
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl mb-6 flex items-start gap-3 border bg-rose-950/40 border-rose-500/30 text-rose-300 text-sm">
          <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl mb-6 flex items-start gap-3 border bg-emerald-950/40 border-emerald-500/30 text-emerald-300 text-sm">
          <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {/* Instructions Card */}
      <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl mb-8 flex gap-4">
        <Info className="w-6 h-6 text-violet-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-2">
          <h4 className="font-bold text-white text-base">How to Add & Format Sources:</h4>
          <p className="text-sm text-slate-300 leading-relaxed">
            Specify standard URL templates using flexible placeholders like <code className="text-violet-400 font-mono font-bold bg-violet-950/45 px-1.5 py-0.5 rounded">{'{id}'}</code>, <code className="text-indigo-400 font-mono font-bold bg-indigo-950/45 px-1.5 py-0.5 rounded">:id</code>, or <code className="text-cyan-400 font-mono font-bold bg-cyan-950/45 px-1.5 py-0.5 rounded">[id]</code>.
          </p>
          <p className="text-sm text-slate-300 leading-relaxed">
            When playing or downloading media, CineLog automatically replaces the placeholder with the movie's TMDB ID. 
            For TV shows, it automatically resolves to <code className="text-violet-400 font-mono font-bold bg-violet-950/45 px-1.5 py-0.5 rounded">{'{id}/{season}/{episode}'}</code> and replaces <code className="text-slate-400 font-mono bg-slate-950 px-1 rounded">/movie/</code> with <code className="text-slate-400 font-mono bg-slate-950 px-1 rounded">/tv/</code>.
          </p>
          <div className="text-xs text-slate-400 pt-2 border-t border-slate-800/60 flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-slate-300">Example Template:</span>
            <code className="text-violet-300 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              {activeTab === 'streaming' 
                ? 'https://player.videasy.to/movie/{id}' 
                : 'https://video.moviepire.co/download/movie/{id}'}
            </code>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-6">
          <form onSubmit={handleSubmit} className="space-y-5 bg-slate-900/20 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-xl">
            <h3 className="font-bold text-white text-lg flex items-center gap-2 border-b border-slate-800 pb-3">
              <Plus className="w-5 h-5 text-violet-400" />
              Add {activeTab === 'streaming' ? 'Streaming' : 'Download'} Source
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Source Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. VidSrc, Moviepire, Fast Stream"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  URL Template
                </label>
              </div>

              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={activeTab === 'streaming' ? 'https://example.com/movie/{id}' : 'https://example.com/download/movie/{id}'}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors text-sm font-mono"
              />

              {/* 1-Click Quick Insert Pills */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-[11px] text-slate-400 font-medium">Click to insert:</span>
                <button
                  type="button"
                  onClick={() => handleQuickInsertTag('{id}')}
                  className="text-[11px] font-mono bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                >
                  + {'{id}'}
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickInsertTag(':id')}
                  className="text-[11px] font-mono bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                >
                  + :id
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickInsertTag('[id]')}
                  className="text-[11px] font-mono bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                >
                  + [id]
                </button>
              </div>
            </div>

            {/* Scope / Visibility Selection */}
            {isAdmin ? (
              <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className={`w-4 h-4 ${isPublic ? 'text-violet-400' : 'text-slate-500'}`} />
                  <div>
                    <span className="block text-xs font-bold text-white">Public Source</span>
                    <span className="block text-[11px] text-slate-400">Make visible to all users</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4 accent-violet-600 rounded cursor-pointer"
                />
              </div>
            ) : (
              <div className="p-3 bg-slate-950/50 border border-slate-800/80 rounded-xl flex items-center gap-2 text-xs text-slate-400">
                <Lock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                <span>Sources created on your account will be <strong>Private</strong>.</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-violet-650 to-indigo-650 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Source
            </button>
          </form>
        </div>

        {/* List Column */}
        <div className="lg:col-span-6 space-y-4">
          <h3 className="font-bold text-white text-lg pb-1">
            Configured {activeTab === 'streaming' ? 'Streaming' : 'Download'} Sources ({currentSourcesList.length})
          </h3>

          <div className="space-y-3">
            {currentSourcesList.map((source) => {
              const isDefault = source.id === 'default_4k' || source.id === 'default_download';
              const isSourcePublic = source.is_public || isDefault;
              const isOwner = source.user_id === user?.uid;
              const canEditOrManage = !isDefault && (isAdmin || isOwner || !isSourcePublic);
              const isEditing = editingSourceId === source.id;
              const isMenuOpen = openMenuId === source.id;

              if (isEditing) {
                return (
                  <div key={source.id} className="p-4 rounded-2xl bg-slate-900 border border-violet-500/40 space-y-3 shadow-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">Editing Source</span>
                      <button onClick={handleCancelEdit} className="text-slate-500 hover:text-white p-1">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Source Name"
                        className="w-full bg-slate-955 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm"
                      />
                    </div>

                    <div>
                      <input
                        type="text"
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        placeholder="URL Template"
                        className="w-full bg-slate-955 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs font-mono"
                      />
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="checkbox"
                          id={`edit-public-${source.id}`}
                          checked={editIsPublic}
                          onChange={(e) => setEditIsPublic(e.target.checked)}
                          className="w-4 h-4 accent-violet-600 rounded cursor-pointer"
                        />
                        <label htmlFor={`edit-public-${source.id}`} className="text-xs text-slate-300 font-medium cursor-pointer">
                          Public Source (Visible to all users)
                        </label>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={handleCancelEdit}
                        className="px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(source.id)}
                        className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Save Changes
                      </button>
                    </div>
                  </div>
                )
              }

              return (
                <div 
                  key={source.id} 
                  className="p-4 rounded-2xl bg-slate-900/30 border border-slate-800 flex items-start justify-between gap-4 relative"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-bold text-white text-sm">{source.name}</span>
                      
                      {isSourcePublic ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded-full border border-violet-500/20">
                          <Globe className="w-2.5 h-2.5" />
                          Public
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
                          <Lock className="w-2.5 h-2.5" />
                          Private
                        </span>
                      )}

                      {isDefault && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20">
                          System Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-slate-550 truncate" title={source.url}>
                      {source.url}
                    </p>
                  </div>

                  {/* 3 Dots Menu Button & Dropdown */}
                  <div className="relative flex-shrink-0">
                    {canEditOrManage ? (
                      <button
                        onClick={() => setOpenMenuId(isMenuOpen ? null : source.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all cursor-pointer border border-slate-800/60"
                        title="Source options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="p-2 text-slate-600" title={isDefault ? "System default source cannot be modified" : "Public Admin sources can only be managed by Admin"}>
                        <Lock className="w-4 h-4" />
                      </span>
                    )}

                    {/* Menu Dropdown */}
                    {isMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-30 py-1 overflow-hidden animate-fade-in">
                        <button
                          onClick={() => handleStartEdit(source)}
                          className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white flex items-center gap-2 cursor-pointer transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-violet-400" />
                          Edit Details
                        </button>

                        {isAdmin && (
                          <button
                            onClick={() => handleTogglePublicPrivate(source)}
                            className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            {source.is_public ? (
                              <>
                                <Lock className="w-3.5 h-3.5 text-amber-400" />
                                Set as Private
                              </>
                            ) : (
                              <>
                                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                                Set as Public
                              </>
                            )}
                          </button>
                        )}

                        <div className="border-t border-slate-800 my-1" />

                        <button
                          onClick={() => {
                            setOpenMenuId(null)
                            handleRemove(source.id)
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs font-semibold text-rose-400 hover:bg-rose-950/30 flex items-center gap-2 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          Delete Source
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {currentSourcesList.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-sm">
                No {activeTab === 'streaming' ? 'streaming' : 'download'} sources configured yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}




