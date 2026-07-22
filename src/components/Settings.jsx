import React, { useState, useEffect } from 'react'
import { Key, Database, RefreshCw, CheckCircle, AlertTriangle, Shield, Play, UploadCloud, User, LogOut } from 'lucide-react'
import { isFirebaseConfigured, getFirebaseDb } from '../lib/firebase'
import { isTMDBConfigured } from '../lib/tmdb'
import Auth from './Auth'
import Sources from './Sources'
import ImportExport from './ImportExport'

export default function Settings({
  // Auth / Account props
  user,
  onAuthSuccess,
  onLogout,
  
  // Developer keys props
  onConfigChange,
  
  // Sources props
  sources,
  onAddSource,
  onRemoveSource,
  downloadSources,
  onAddDownloadSource,
  onRemoveDownloadSource,
  
  // Import/Export props
  items,
  onAddImportedItems
}) {
  const [activeTab, setActiveTab] = useState('account') // 'account', 'keys', 'sources', 'import_export'
  const [tmdbApiKey, setTmdbApiKey] = useState('')
  const [omdbApiKey, setOmdbApiKey] = useState('')
  const [status, setStatus] = useState({ type: '', message: '' })

  useEffect(() => {
    setTmdbApiKey(localStorage.getItem('tmdb_api_key') || '')
    setOmdbApiKey(localStorage.getItem('omdb_api_key') || '')
  }, [])

  const handleSave = (e) => {
    e.preventDefault()
    try {
      if (tmdbApiKey) {
        localStorage.setItem('tmdb_api_key', tmdbApiKey.trim())
      } else {
        localStorage.removeItem('tmdb_api_key')
      }
      
      if (omdbApiKey) {
        localStorage.setItem('omdb_api_key', omdbApiKey.trim())
      } else {
        localStorage.removeItem('omdb_api_key')
      }
      
      setStatus({
        type: 'success',
        message: 'Configuration saved successfully! Reloading connection...'
      })
      
      if (onConfigChange) {
        onConfigChange()
      }
      
      setTimeout(() => {
        setStatus({ type: '', message: '' })
        window.location.reload()
      }, 1500)
    } catch (err) {
      setStatus({
        type: 'error',
        message: 'Failed to save configuration: ' + err.message
      })
    }
  }

  const handleClear = () => {
    localStorage.removeItem('tmdb_api_key')
    localStorage.removeItem('omdb_api_key')
    setTmdbApiKey('')
    setOmdbApiKey('')
    
    setStatus({
      type: 'success',
      message: 'Credentials cleared. TMDB is now in mock mode.'
    })
    if (onConfigChange) {
      onConfigChange()
    }
    setTimeout(() => {
      setStatus({ type: '', message: '' })
      window.location.reload()
    }, 1500)
  }

  const isConnectedToFirebase = isFirebaseConfigured()
  const isConnectedToTMDB = isTMDBConfigured()

  const tabs = [
    { id: 'account', label: 'Account Protection', icon: Shield },
    { id: 'keys', label: 'Developer Keys', icon: Key },
    { id: 'sources', label: 'Choose Sources', icon: Play },
    { id: 'import_export', label: 'Import / Export', icon: UploadCloud }
  ]

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-8 border-b border-slate-800 pb-5">
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
          CineLog Configuration & Settings
        </h1>
        <p className="text-slate-400 text-sm">
          Customize your API connections, account protection, media streaming sources, and import/export lists.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Sidebar/Tabs */}
        <div className="md:col-span-1 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-none border-b md:border-b-0 md:border-r border-slate-800/80 pr-0 md:pr-4">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap md:w-full ${
                  isActive
                    ? 'bg-violet-600/10 text-violet-300 border border-violet-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-violet-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Active Tab Panel */}
        <div className="md:col-span-3">
          {activeTab === 'account' && (
            <div className="space-y-6">
              {user ? (
                <div className="max-w-md mx-auto p-8 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl -z-10" />
                  
                  <div className="text-center mb-8">
                    <User className="w-12 h-12 text-violet-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-extrabold text-white tracking-tight mb-2">
                      Account Information
                    </h2>
                    <p className="text-slate-455 text-xs leading-relaxed">
                      Your watchlist, ratings, reviews, and custom lists are actively synced in the cloud.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-[#101424] border border-slate-800 rounded-xl p-4 text-center">
                      <span className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Signed in as</span>
                      <span className="block text-sm font-semibold text-white truncate">{user.email}</span>
                      {user.isQrUser && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded-full mt-2 border border-violet-500/20 uppercase tracking-wider">
                          Linked via QR Code
                        </span>
                      )}
                    </div>

                    <button
                      onClick={onLogout}
                      className="w-full bg-slate-900 hover:bg-rose-950/20 hover:text-rose-455 border border-slate-800 hover:border-rose-900/30 text-slate-300 font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out of Account
                    </button>
                  </div>
                </div>
              ) : (
                <Auth 
                  onAuthSuccess={onAuthSuccess} 
                  onNavigateToSettings={() => setActiveTab('keys')}
                />
              )}
            </div>
          )}

          {activeTab === 'keys' && (
            <div className="space-y-6">
              {status.message && (
                <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 border ${
                  status.type === 'success' 
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' 
                    : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                }`}>
                  {status.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0 text-rose-400" />
                  )}
                  <span>{status.message}</span>
                </div>
              )}

              {/* Connection Status Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className={`p-4 rounded-xl border flex flex-col justify-between ${
                  isConnectedToFirebase 
                    ? 'bg-indigo-950/20 border-indigo-500/20' 
                    : 'bg-slate-900/40 border-slate-800'
                }`}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Database className="w-5 h-5 text-indigo-400" />
                      <h3 className="font-semibold text-white text-sm">Firebase Cloud Sync</h3>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Connected to project "media-tracker-sankha" and ready to synchronize your watchlist.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded w-fit mt-3 bg-emerald-500/10 text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Sync Active
                  </span>
                </div>

                <div className={`p-4 rounded-xl border flex flex-col justify-between ${
                  isConnectedToTMDB 
                    ? 'bg-violet-950/20 border-violet-500/20' 
                    : 'bg-slate-900/40 border-slate-800'
                }`}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Key className="w-5 h-5 text-violet-400" />
                      <h3 className="font-semibold text-white text-sm">TMDB Database Connection</h3>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {isConnectedToTMDB 
                        ? 'Connected. Explore page pulls live details from TMDB.' 
                        : 'Using curated offline list of popular movies and TV shows.'}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded w-fit mt-3 ${
                    isConnectedToTMDB 
                      ? 'bg-emerald-500/10 text-emerald-400' 
                      : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isConnectedToTMDB ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                    {isConnectedToTMDB ? 'Live Connected' : 'Mock Mode'}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSave} className="space-y-6 bg-slate-900/30 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl">
                <h2 className="text-base font-bold text-white mb-2 pb-2 flex items-center gap-2 border-b border-slate-800">
                  <Key className="w-5 h-5 text-violet-400" />
                  TMDB Live Access
                </h2>

                <div>
                  <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider mb-1">
                    TMDB Read Access Token or API Key (v3)
                  </label>
                  <input
                    type="password"
                    value={tmdbApiKey}
                    onChange={(e) => setTmdbApiKey(e.target.value)}
                    placeholder="e.g. 5da7e6..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-650 focus:outline-none focus:border-violet-500 transition-colors text-sm"
                  />
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Don't have a key? Register on <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer" className="text-violet-400 hover:underline">TMDB</a> to get a free API Key.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-355 uppercase tracking-wider mb-1">
                    OMDb API Key (Optional)
                  </label>
                  <input
                    type="password"
                    value={omdbApiKey}
                    onChange={(e) => setOmdbApiKey(e.target.value)}
                    placeholder="Custom OMDb Key (Default fallback active)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-650 focus:outline-none focus:border-violet-500 transition-colors text-sm"
                  />
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Used for fetching IMDb, Rotten Tomatoes & Metacritic scores. Get a free key on <a href="https://www.omdbapi.com/apikey.aspx" target="_blank" rel="noreferrer" className="text-violet-400 hover:underline">OMDb API</a>.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-800/60">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer text-sm"
                  >
                    <RefreshCw className="w-4 h-4 animate-spin-hover" />
                    Save & Connect
                  </button>
                  
                  {tmdbApiKey && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer text-sm"
                    >
                      Reset to Mock Mode
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {activeTab === 'sources' && (
            <Sources
              sources={sources}
              onAddSource={onAddSource}
              onRemoveSource={onRemoveSource}
              downloadSources={downloadSources}
              onAddDownloadSource={onAddDownloadSource}
              onRemoveDownloadSource={onRemoveDownloadSource}
              user={user}
            />
          )}

          {activeTab === 'import_export' && (
            <ImportExport
              items={items}
              onAddImportedItems={onAddImportedItems}
              user={user}
            />
          )}
        </div>
      </div>
    </div>
  )
}
