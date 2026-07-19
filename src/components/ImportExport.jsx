import React, { useState } from 'react'
import { FileUp, FileDown, ArrowLeft, RefreshCw, CheckCircle, AlertTriangle, Info, FileSpreadsheet, Sparkles } from 'lucide-react'
import { fetchTMDB, isTMDBConfigured } from '../lib/tmdb'
import { isFirebaseConfigured, batchAddFirebaseItems } from '../lib/firebase'
import { useNavigate } from 'react-router-dom'

export default function ImportExport({ items, onAddImportedItems, user }) {
  const [file, setFile] = useState(null)
  const [fileName, setFileName] = useState('')
  const [fileContent, setFileContent] = useState('')
  const [importMode, setImportMode] = useState('fast') // 'fast' or 'tmdb'
  const [defaultStatus, setDefaultStatus] = useState('auto') // 'auto' (based on filename/headers), 'completed', 'planned'
  
  const [status, setStatus] = useState('idle') // 'idle', 'parsing', 'matching', 'saving', 'success', 'error'
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState('')
  const [summary, setSummary] = useState({ total: 0, matched: 0, manual: 0 })
  const [errorMessage, setErrorMessage] = useState('')
  
  const navigate = useNavigate()
  const isCloud = isFirebaseConfigured() && user
  const isTMDB = isTMDBConfigured()

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return
    
    setFile(selectedFile)
    setFileName(selectedFile.name)
    setErrorMessage('')
    
    // Automatically pre-select status based on filename
    const nameLower = selectedFile.name.toLowerCase()
    if (nameLower.includes('watchlist')) {
      setDefaultStatus('planned')
    } else if (nameLower.includes('watched') || nameLower.includes('diary')) {
      setDefaultStatus('completed')
    } else {
      setDefaultStatus('auto')
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setFileContent(event.target.result)
    }
    reader.readAsText(selectedFile)
  }

  // Parse CSV Line respecting double quotes
  const parseCSVLine = (line) => {
    const result = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  const handleImport = async () => {
    if (!fileContent) {
      setErrorMessage('Please select a valid CSV file first.')
      return
    }

    setStatus('parsing')
    setProgress(5)
    setProgressText('Reading and parsing CSV data...')

    try {
      const lines = fileContent.split(/\r?\n/).filter(line => line.trim().length > 0)
      if (lines.length <= 1) {
        throw new Error('CSV file is empty or only contains headers.')
      }

      // Detect headers
      const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/["']/g, ''))
      
      const nameIdx = headers.indexOf('name') !== -1 ? headers.indexOf('name') : headers.indexOf('title')
      const yearIdx = headers.indexOf('year')
      const ratingIdx = headers.indexOf('rating')
      const reviewIdx = headers.indexOf('review')
      const watchedDateIdx = headers.indexOf('watched date') !== -1 
        ? headers.indexOf('watched date') 
        : (headers.indexOf('date') !== -1 ? headers.indexOf('date') : -1)

      if (nameIdx === -1) {
        throw new Error('Could not find movie "Name" or "Title" column in CSV.')
      }

      const parsedRows = []
      for (let i = 1; i < lines.length; i++) {
        const columns = parseCSVLine(lines[i])
        if (columns.length <= nameIdx) continue

        const title = columns[nameIdx].replace(/^"|"$/g, '')
        const year = yearIdx !== -1 && columns[yearIdx] ? columns[yearIdx].replace(/^"|"$/g, '') : ''
        
        // Letterboxd rating is usually out of 5 in CSV (e.g., 4.5). We scale it to 10.
        let rating = 0
        if (ratingIdx !== -1 && columns[ratingIdx]) {
          const rawRating = parseFloat(columns[ratingIdx].replace(/^"|"$/g, ''))
          if (!isNaN(rawRating)) {
            rating = rawRating <= 5 ? rawRating * 2 : rawRating
          }
        }

        const review = reviewIdx !== -1 && columns[reviewIdx] ? columns[reviewIdx].replace(/^"|"$/g, '') : ''
        const dateStr = watchedDateIdx !== -1 && columns[watchedDateIdx] 
          ? columns[watchedDateIdx].replace(/^"|"$/g, '') 
          : new Date().toISOString().split('T')[0]

        // Resolve status
        let resolvedStatus = 'completed'
        if (defaultStatus === 'planned') {
          resolvedStatus = 'planned'
        } else if (defaultStatus === 'completed') {
          resolvedStatus = 'completed'
        } else {
          // Auto detect: if watchlist is in name, or if rating/review is blank and date is missing
          if (fileName.toLowerCase().includes('watchlist') || (!rating && !review && watchedDateIdx === -1)) {
            resolvedStatus = 'planned'
          }
        }

        parsedRows.push({
          title,
          release_year: year,
          rating,
          review,
          status: resolvedStatus,
          watched_at: dateStr ? new Date(dateStr).toISOString() : new Date().toISOString(),
          type: 'movie' // Letterboxd is specifically for movies
        })
      }

      if (parsedRows.length === 0) {
        throw new Error('No valid movies could be parsed from the CSV.')
      }

      let matchedItems = []
      let tmdbMatchedCount = 0
      let tmdbManualCount = 0

      // Option 2: Match with TMDB API
      if (importMode === 'tmdb' && isTMDB) {
        setStatus('matching')
        setProgress(10)
        setProgressText(`Matching movies with TMDB database... (0 / ${parsedRows.length})`)

        const BATCH_SIZE = 4
        for (let i = 0; i < parsedRows.length; i += BATCH_SIZE) {
          const batch = parsedRows.slice(i, i + BATCH_SIZE)
          
          await Promise.all(batch.map(async (movie, index) => {
            const currentIdx = i + index
            try {
              const queryParams = { query: movie.title }
              if (movie.release_year) {
                queryParams.primary_release_year = movie.release_year
              }
              
              const searchResults = await fetchTMDB('/search/movie', queryParams)
              if (searchResults.results && searchResults.results.length > 0) {
                const match = searchResults.results[0]
                matchedItems.push({
                  ...movie,
                  tmdb_id: match.id.toString(),
                  title: match.title,
                  poster_path: match.poster_path || '',
                  release_year: match.release_date ? match.release_date.split('-')[0] : movie.release_year
                })
                tmdbMatchedCount++
              } else {
                // Fallback to manual entry
                matchedItems.push(movie)
                tmdbManualCount++
              }
            } catch (err) {
              console.error(`TMDB lookup failed for ${movie.title}:`, err)
              matchedItems.push(movie)
              tmdbManualCount++
            }
          }))

          // Update Progress
          const matchedSofar = Math.min(i + BATCH_SIZE, parsedRows.length)
          const pct = Math.floor(10 + (matchedSofar / parsedRows.length) * 75)
          setProgress(pct)
          setProgressText(`Matching movies with TMDB database... (${matchedSofar} / ${parsedRows.length})`)

          // Throttling to avoid slamming the API rate limit
          await new Promise(r => setTimeout(r, 150))
        }
      } else {
        // Fast Import mode
        matchedItems = parsedRows
        tmdbManualCount = parsedRows.length
      }

      // Save Items to Store
      setStatus('saving')
      setProgress(90)
      setProgressText('Writing imported movies to database...')

      let finalAdded = []
      if (isCloud) {
        finalAdded = await batchAddFirebaseItems(user.uid, matchedItems)
      } else {
        // Local storage saving
        const localData = localStorage.getItem('local_media_items')
        const currentLocal = localData ? JSON.parse(localData) : []
        
        // Generate random IDs for the new items
        const prepared = matchedItems.map(item => ({
          id: `local_media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...item
        }))

        // Filter duplicates based on title and year
        const filtered = [...prepared, ...currentLocal]
        const uniqueData = Array.from(new Map(filtered.map(i => {
          const key = i.tmdb_id ? `tmdb_${i.tmdb_id}` : `title_${i.title}_${i.release_year}`
          return [key, i]
        })).values())

        localStorage.setItem('local_media_items', JSON.stringify(uniqueData))
        finalAdded = prepared
      }

      // Update state in App.jsx
      onAddImportedItems(finalAdded)
      
      setSummary({
        total: parsedRows.length,
        matched: tmdbMatchedCount,
        manual: tmdbManualCount
      })
      setProgress(100)
      setStatus('success')
    } catch (err) {
      console.error(err)
      setErrorMessage(err.message || 'An error occurred during parsing or importing.')
      setStatus('error')
    }
  }

  // Export JSON file
  const handleExportJSON = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(items, null, 2))
      const downloadAnchor = document.createElement('a')
      downloadAnchor.setAttribute("href", dataStr)
      downloadAnchor.setAttribute("download", `cinelog_export_${new Date().toISOString().split('T')[0]}.json`)
      document.body.appendChild(downloadAnchor)
      downloadAnchor.click()
      downloadAnchor.remove()
    } catch (err) {
      console.error(err)
      setErrorMessage('Could not generate export file.')
    }
  }

  return (
    <div className="py-6 px-4 max-w-4xl mx-auto animate-fade-in">
      
      {/* Header */}
      <div className="mb-8 border-b border-slate-900 pb-5">
        <button 
          onClick={() => navigate('/')}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-violet-400 hover:text-violet-300 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Watchlist
        </button>
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <FileSpreadsheet className="w-8 h-8 text-violet-400" />
          Import / Export Data
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Seamlessly migrate your data. Import movie logs from Letterboxd exports or export your CineLog tracker list.
        </p>
      </div>

      {status === 'idle' || status === 'error' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* ===================== LETTERBOXD IMPORT PANEL ===================== */}
          <div className="bg-slate-900/30 border border-slate-800 hover:border-slate-700/50 rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-colors">
            <div>
              <div className="flex items-center gap-2 text-violet-400 mb-4">
                <FileUp className="w-5 h-5" />
                <h3 className="font-bold text-lg text-white">Import from Letterboxd</h3>
              </div>

              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Upload a CSV file exported from Letterboxd. We support importing your <code className="text-violet-300 bg-violet-950/40 px-1 py-0.5 rounded">watched.csv</code>, <code className="text-violet-300 bg-violet-950/40 px-1 py-0.5 rounded">diary.csv</code>, or <code className="text-violet-300 bg-violet-950/40 px-1 py-0.5 rounded">watchlist.csv</code>.
              </p>

              {errorMessage && (
                <div className="p-3.5 bg-rose-950/40 border border-rose-500/20 text-rose-350 text-xs rounded-xl mb-5 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-450 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="space-y-4">
                {/* File picker */}
                <div className="border-2 border-dashed border-slate-800 hover:border-violet-500/35 rounded-xl p-4 text-center cursor-pointer bg-slate-950/20 hover:bg-slate-950/45 transition-all relative">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <FileSpreadsheet className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <span className="text-xs font-bold text-slate-350 block">
                    {fileName ? fileName : 'Choose CSV File'}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    {fileName ? 'Click to change file' : 'Drag and drop or browse files'}
                  </span>
                </div>

                {/* Import Mode */}
                {file && (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Import Accuracy
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setImportMode('fast')}
                          className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                            importMode === 'fast'
                              ? 'bg-slate-905 border-violet-500 text-white'
                              : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <span className="font-bold">Fast Import</span>
                          <span className="text-[9px] text-slate-500 mt-0.5">Skip TMDB search. Adds names instantly.</span>
                        </button>

                        <button
                          type="button"
                          disabled={!isTMDB}
                          onClick={() => setImportMode('tmdb')}
                          className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center text-center cursor-pointer transition-all relative ${
                            !isTMDB ? 'opacity-50 cursor-not-allowed' : ''
                          } ${
                            importMode === 'tmdb'
                              ? 'bg-slate-905 border-violet-500 text-white'
                              : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {!isTMDB && (
                            <span className="absolute -top-2 right-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[8px] font-bold px-1 rounded">
                              Key Required
                            </span>
                          )}
                          <span className="font-bold inline-flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                            Match TMDB
                          </span>
                          <span className="text-[9px] text-slate-500 mt-0.5">Fetches posters, IDs and descriptions.</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Import Status
                      </label>
                      <select
                        value={defaultStatus}
                        onChange={(e) => setDefaultStatus(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-350 focus:outline-none focus:border-violet-500"
                      >
                        <option value="auto">Auto-detect (Recommended)</option>
                        <option value="completed">Force Completed</option>
                        <option value="planned">Force Watchlist (Planned)</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={handleImport}
              disabled={!file}
              className="mt-8 w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-violet-850 disabled:to-indigo-900 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all cursor-pointer shadow-lg shadow-violet-500/10"
            >
              <FileUp className="w-4 h-4" />
              Start Letterboxd Import
            </button>
          </div>

          {/* ===================== EXPORT PANEL ===================== */}
          <div className="bg-slate-900/30 border border-slate-800 hover:border-slate-700/50 rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-colors">
            <div>
              <div className="flex items-center gap-2 text-violet-400 mb-4">
                <FileDown className="w-5 h-5" />
                <h3 className="font-bold text-lg text-white">Export My log</h3>
              </div>

              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Download a complete, structured backup of all tracked movies, TV shows, and games. You can import this backup file back at any time.
              </p>

              <div className="p-4 bg-slate-950/20 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Logged items count</span>
                  <span className="text-2xl font-black text-white">{items.length}</span>
                </div>
                <span className="text-xs text-slate-400 italic">Format: JSON</span>
              </div>
            </div>

            <button
              onClick={handleExportJSON}
              disabled={items.length === 0}
              className="mt-8 w-full inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:text-slate-650 text-slate-200 py-3 px-4 rounded-xl text-sm transition-all cursor-pointer border border-slate-750"
            >
              <FileDown className="w-4 h-4" />
              Download backup (.json)
            </button>
          </div>

        </div>
      ) : (
        /* ===================== PROGRESS SCREEN ===================== */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-lg mx-auto shadow-2xl text-center">
          {status === 'parsing' || status === 'matching' || status === 'saving' ? (
            <div className="space-y-6">
              <RefreshCw className="w-10 h-10 text-violet-500 animate-spin mx-auto" />
              <div>
                <h3 className="font-bold text-lg text-white">Importing logs...</h3>
                <p className="text-xs text-slate-400 mt-1">{progressText}</p>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-violet-400">{progress}%</span>
              </div>

              <div className="p-3 bg-slate-950/30 border border-slate-900 text-[10px] text-slate-455 rounded-lg flex items-center justify-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-violet-400" />
                <span>Do not close this page or exit the app during importing.</span>
              </div>
            </div>
          ) : status === 'success' ? (
            <div className="space-y-6">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
              <div>
                <h3 className="font-extrabold text-2xl text-white">Import Complete!</h3>
                <p className="text-xs text-emerald-450 mt-1">Successfully parsed and saved Letterboxd logs.</p>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-2 border-y border-slate-800 py-4 text-center">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Total</span>
                  <p className="text-lg font-extrabold text-white mt-1">{summary.total}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Matched</span>
                  <p className="text-lg font-extrabold text-violet-400 mt-1">{summary.matched}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Manual</span>
                  <p className="text-lg font-extrabold text-slate-400 mt-1">{summary.manual}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => { setStatus('idle'); setFile(null); setFileName(''); }}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-350 font-semibold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Import Another File
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Go to Watchlist
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
