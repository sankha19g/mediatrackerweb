import React, { useState } from 'react'
import { Play, Download, Plus, Trash2, Info, Lock, CheckCircle, AlertTriangle } from 'lucide-react'

export default function Sources({ 
  sources, 
  onAddSource, 
  onRemoveSource, 
  downloadSources = [], 
  onAddDownloadSource, 
  onRemoveDownloadSource, 
  user 
}) {
  const [activeTab, setActiveTab] = useState('streaming') // 'streaming' or 'download'
  
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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
    if (!url.includes('{ID}')) {
      setError('Your URL must include the {ID} placeholder so we can inject the media ID dynamically.')
      return
    }

    try {
      if (activeTab === 'streaming') {
        onAddSource(name.trim(), url.trim())
      } else {
        onAddDownloadSource(name.trim(), url.trim())
      }
      setName('')
      setUrl('')
      setSuccess(`Source "${name}" added successfully!`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to add source.')
    }
  }

  const currentSourcesList = activeTab === 'streaming' ? sources : downloadSources
  const handleRemove = activeTab === 'streaming' ? onRemoveSource : onRemoveDownloadSource

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
          Manage Sources
        </h1>
        <p className="text-slate-400">
          Configure video streaming and download endpoints for CineLog. These will show up in the detail views of movies and TV shows.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 mb-6">
        <button
          onClick={() => {
            setActiveTab('streaming')
            setError('')
            setSuccess('')
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
        <div className="p-4 rounded-xl mb-6 flex items-start gap-3 border bg-rose-950/40 border-rose-500/30 text-rose-300">
          <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl mb-6 flex items-start gap-3 border bg-emerald-950/40 border-emerald-500/30 text-emerald-300">
          <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {/* Instructions Card */}
      <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl mb-8 flex gap-4">
        <Info className="w-6 h-6 text-violet-400 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-white mb-1">How it works:</h4>
          <p className="text-sm text-slate-350 leading-relaxed">
            Specify standard URL templates using the <code className="text-violet-400 font-mono font-bold bg-violet-950/45 px-1.5 py-0.5 rounded">{'{ID}'}</code> parameter. 
            When playing/downloading, we automatically replace <code className="text-violet-400 font-mono bg-violet-950/45 px-1.5 py-0.5 rounded">{'{ID}'}</code> with the movie's TMDB identifier. 
            For TV shows, it resolves to <code className="text-violet-400 font-mono font-bold bg-violet-950/45 px-1.5 py-0.5">{'{ID}/{season}/{episode}'}</code>.
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Example: <code className="text-slate-400 font-mono">
              {activeTab === 'streaming' 
                ? 'https://player.videasy.to/movie/{ID}' 
                : 'https://video.moviepire.co/download/movie/{ID}'}
            </code>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-5">
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
                placeholder="e.g. Moviepire, Torrent, High Quality"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                URL Template
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={activeTab === 'streaming' ? 'https://example.com/movie/{ID}' : 'https://example.com/download/movie/{ID}'}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors text-sm font-mono"
              />
            </div>

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
        <div className="lg:col-span-7 space-y-4">
          <h3 className="font-bold text-white text-lg pb-1">
            Configured {activeTab === 'streaming' ? 'Streaming' : 'Download'} Sources ({currentSourcesList.length})
          </h3>

          <div className="space-y-3">
            {currentSourcesList.map((source) => {
              const isDefault = source.id === 'default_4k' || source.id === 'default_download' || source.name === '4K' || source.name === 'Moviepire';
              return (
                <div 
                  key={source.id} 
                  className="p-4 rounded-2xl bg-slate-900/30 border border-slate-800 flex items-start justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-white text-sm">{source.name}</span>
                      {isDefault && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded-full border border-violet-500/20">
                          <Lock className="w-2.5 h-2.5" />
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-slate-550 truncate" title={source.url}>
                      {source.url}
                    </p>
                  </div>

                  {!isDefault ? (
                    <button
                      onClick={() => handleRemove(source.id)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-450 hover:bg-rose-955/20 transition-all cursor-pointer border border-transparent hover:border-rose-900/20"
                      title={`Delete ${source.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <span className="p-2 text-slate-600" title="System default source cannot be deleted">
                      <Lock className="w-4 h-4" />
                    </span>
                  )}
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
