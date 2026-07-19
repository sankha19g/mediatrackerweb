import React, { useState, useEffect } from 'react'
import { Key, Database, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react'
import { isFirebaseConfigured } from '../lib/firebase'
import { isTMDBConfigured } from '../lib/tmdb'

export default function Settings({ onConfigChange }) {
  const [tmdbApiKey, setTmdbApiKey] = useState('')
  const [status, setStatus] = useState({ type: '', message: '' })
  
  useEffect(() => {
    setTmdbApiKey(localStorage.getItem('tmdb_api_key') || '')
  }, [])

  const handleSave = (e) => {
    e.preventDefault()
    try {
      if (tmdbApiKey) {
        localStorage.setItem('tmdb_api_key', tmdbApiKey.trim())
      } else {
        localStorage.removeItem('tmdb_api_key')
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
    setTmdbApiKey('')
    
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

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
          Developer & API Settings
        </h1>
        <p className="text-slate-400">
          Configure API credentials to sync your lists to your own Firebase project and load live data from TMDB.
        </p>
      </div>

      {status.message && (
        <div className={`p-4 rounded-none mb-6 flex items-start gap-3 border ${
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className={`p-4 rounded-none border flex flex-col justify-between ${
          isConnectedToFirebase 
            ? 'bg-indigo-950/20 border-indigo-500/20' 
            : 'bg-slate-900/40 border-slate-800'
        }`}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Database className="w-5 h-5 text-indigo-400" />
              <h3 className="font-semibold text-white">Firebase Cloud Sync</h3>
            </div>
            <p className="text-xs text-slate-400">
              Connected to project "media-tracker-sankha" and ready to synchronize your media list.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-none w-fit mt-3 bg-emerald-500/10 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Sync Active
          </span>
        </div>

        <div className={`p-4 rounded-none border flex flex-col justify-between ${
          isConnectedToTMDB 
            ? 'bg-violet-950/20 border-violet-500/20' 
            : 'bg-slate-900/40 border-slate-800'
        }`}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Key className="w-5 h-5 text-violet-400" />
              <h3 className="font-semibold text-white">TMDB Database Connection</h3>
            </div>
            <p className="text-xs text-slate-400">
              {isConnectedToTMDB 
                ? 'Connected. Explore page pulls live details from TMDB.' 
                : 'Using curated offline list of popular movies and TV shows.'}
            </p>
          </div>
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-none w-fit mt-3 ${
            isConnectedToTMDB 
              ? 'bg-emerald-500/10 text-emerald-400' 
              : 'bg-amber-500/10 text-amber-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isConnectedToTMDB ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            {isConnectedToTMDB ? 'Live Connected' : 'Mock Mode'}
          </span>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 bg-slate-900/30 border border-slate-800 p-6 rounded-none backdrop-blur-xl">
        <h2 className="text-lg font-bold text-white mb-2 pb-2 flex items-center gap-2 border-b border-slate-800">
          <Key className="w-5 h-5 text-violet-400" />
          TMDB Live Access
        </h2>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            TMDB Read Access Token or API Key (v3)
          </label>
          <input
            type="password"
            value={tmdbApiKey}
            onChange={(e) => setTmdbApiKey(e.target.value)}
            placeholder="e.g. 5da7e6..."
            className="w-full bg-slate-950 border border-slate-800 rounded-none px-4 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
          />
          <p className="text-xs text-slate-500 mt-1">
            Don't have a key? Register on <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer" className="text-violet-400 hover:underline">TMDB</a> to get a free API Key.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-800/60">
          <button
            type="submit"
            className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-2.5 px-4 rounded-none shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Save & Connect
          </button>
          
          {tmdbApiKey && (
            <button
              type="button"
              onClick={handleClear}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 px-4 rounded-none transition-all cursor-pointer"
            >
              Reset to Mock Mode
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
