import { useState, useEffect, useMemo, useRef } from 'react'
import { X, Download, Copy, Check, Flame, RefreshCw, AlertCircle, Film, Tv, Radio, ArrowUpDown, Volume2, Video, Search, Magnet, RotateCcw, FolderArchive, ChevronDown, FileVideo } from 'lucide-react'
import { fetchYtsTorrents, fetchTorrentioTorrents } from '../lib/torrents'

export default function TorrentModal({
  isOpen,
  onClose,
  initialProvider = 'yts',
  title = '',
  year = '',
  type = 'movie',
  imdbId = '',
  seasons = []
}) {
  const [activeProvider, setActiveProvider] = useState(initialProvider)
  const [selectedSeason, setSelectedSeason] = useState('all') // 'all' | 'complete' | number
  const [selectedEpisode, setSelectedEpisode] = useState('all') // 'all' | number
  const [qualityFilter, setQualityFilter] = useState('all') // 'all', '4K', '1080p', '720p'
  const [audioFilter, setAudioFilter] = useState('all') // 'all', 'Dual Audio', 'Hindi', 'English'
  const [sortBy, setSortBy] = useState('seeds') // 'seeds', 'size_desc', 'size_asc'
  const [torrents, setTorrents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [copiedHash, setCopiedHash] = useState(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedHashes, setExpandedHashes] = useState(new Set())
  const searchInputRef = useRef(null)

  // Toggle file list accordion for a specific torrent
  const toggleExpandFiles = (hash) => {
    setExpandedHashes(prev => {
      const next = new Set(prev)
      if (next.has(hash)) {
        next.delete(hash)
      } else {
        next.add(hash)
      }
      return next
    })
  }

  // Calculate TV season list from details
  const seasonsList = useMemo(() => {
    const valid = (seasons || []).filter(s => s && s.season_number > 0)
    return valid.length > 0 ? valid : [{ season_number: 1, episode_count: 24, name: 'Season 1' }]
  }, [seasons])

  // Max episodes for currently selected season
  const maxEpisodesInSeason = useMemo(() => {
    if (typeof selectedSeason !== 'number') return 24
    const sObj = seasonsList.find(s => s.season_number === selectedSeason)
    return sObj?.episode_count || 24
  }, [seasonsList, selectedSeason])

  // Reset TV filters handler
  const handleResetTvFilters = () => {
    setSelectedSeason('all')
    setSelectedEpisode('all')
    setQualityFilter('all')
    setAudioFilter('all')
    setSearchQuery('')
  }

  // Focus search input when search bar opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isSearchOpen])

  // Sync initialProvider on open, reset search and filters on close
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isOpen) {
      setActiveProvider(initialProvider)
      setSelectedSeason('all')
      setSelectedEpisode('all')
      setExpandedHashes(new Set())
    } else {
      setIsSearchOpen(false)
      setSearchQuery('')
      setExpandedHashes(new Set())
    }
  }, [isOpen, initialProvider])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Load torrents when modal opens or provider / season / episode / stream filter changes
  useEffect(() => {
    if (!isOpen) return

    let isMounted = true
    const loadTorrents = async () => {
      setLoading(true)
      setError(null)
      setTorrents([])

      try {
        if (activeProvider === 'yts') {
          if (type === 'tv') {
            setError('YTS exclusively indexes movies. Please switch to Torrentio for TV series.')
            setLoading(false)
            return
          }
          // YTS search: try IMDb ID first, fallback to title + year
          const query = imdbId || `${title} ${year}`.trim()
          const result = await fetchYtsTorrents(query)
          if (!isMounted) return

          if (result.success) {
            setTorrents(result.torrents || [])
            if (result.torrents.length === 0) {
              setError('No torrents found on YTS for this title.')
            }
          } else {
            setError(result.error || 'Failed to fetch torrents from YTS.')
          }
        } else {
          // Torrentio search:
          let seasonToQuery = null
          let epToQuery = null

          if (type === 'tv') {
            if (selectedSeason === 'all' || selectedSeason === 'all_seasons' || selectedSeason === 'complete') {
              seasonToQuery = null
              epToQuery = null
            } else if (typeof selectedSeason === 'number') {
              seasonToQuery = selectedSeason
              epToQuery = selectedEpisode === 'all' ? 1 : selectedEpisode
            }
          }

          let result = await fetchTorrentioTorrents({
            type,
            imdbId,
            season: seasonToQuery,
            episode: epToQuery,
            title
          })

          // Fallback: If querying root series returned 0 streams, fallback to season 1 episode 1
          if (type === 'tv' && (!result.success || !result.torrents?.length) && !seasonToQuery) {
            const fallbackResult = await fetchTorrentioTorrents({
              type,
              imdbId,
              season: 1,
              episode: 1,
              title
            })
            if (fallbackResult.success && fallbackResult.torrents?.length) {
              result = fallbackResult
            }
          }

          if (!isMounted) return

          if (result.success) {
            setTorrents(result.torrents || [])
            if (result.torrents.length === 0) {
              setError(
                type === 'tv'
                  ? selectedSeason === 'complete'
                    ? 'No complete series packs found on Torrentio for this show.'
                    : selectedSeason === 'all_seasons'
                      ? 'No season batch packs found on Torrentio for this show.'
                      : typeof selectedSeason === 'number'
                        ? `No streams found on Torrentio for Season ${selectedSeason}${selectedEpisode !== 'all' ? ` Ep ${selectedEpisode}` : ''}.`
                        : 'No streams found on Torrentio for this show.'
                  : 'No streams found on Torrentio for this movie.'
              )
            }
          } else {
            setError(result.error || 'Failed to fetch streams from Torrentio.')
          }
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'An unexpected error occurred.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadTorrents()
    return () => {
      isMounted = false
    }
  }, [isOpen, activeProvider, selectedSeason, selectedEpisode, imdbId, title, year, type])

  const handleCopyMagnet = (hash, magnetUrl) => {
    if (!magnetUrl) return
    navigator.clipboard.writeText(magnetUrl)
    setCopiedHash(hash)
    setTimeout(() => setCopiedHash(null), 2500)
  }

  // Filter & Sort Torrents
  const processedTorrents = useMemo(() => {
    let result = torrents

    // 0. Search Query Filter (Searches release title, target file, quality, audio, codec, indexer source)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(t => {
        const titleMatch = (t.title || '').toLowerCase().includes(q)
        const fileMatch = (t.targetFile || '').toLowerCase().includes(q)
        const qualityMatch = (t.quality || '').toLowerCase().includes(q)
        const ripMatch = (t.ripType || '').toLowerCase().includes(q)
        const sourceMatch = (t.source || '').toLowerCase().includes(q)
        const audioMatch = t.audios?.some(a => a.toLowerCase().includes(q))
        const tagMatch = t.tags?.some(tag => tag.toLowerCase().includes(q))
        const batchMatch = t.isBatch && (q === 'batch' || q === 'season' || q === 'complete' || q === 'pack')
        return titleMatch || fileMatch || qualityMatch || ripMatch || sourceMatch || audioMatch || tagMatch || batchMatch
      })
    }

    // 1. In TV Mode: Filter by Season / Complete Series / All Seasons
    if (type === 'tv' && activeProvider === 'torrentio') {
      if (selectedSeason === 'all') {
        // "All": Every torrent, every season, every episode - all streams returned for the show!
      } else if (selectedSeason === 'all_seasons') {
        // "All Seasons": Season batches and complete series packs across all seasons
        result = result.filter(t => t.isBatch)
        // Deduplicate by hash so user sees clean unique season/complete packs
        const seen = new Set()
        result = result.filter(t => {
          if (!t.hash) return true
          if (seen.has(t.hash)) return false
          seen.add(t.hash)
          return true
        })
      } else if (selectedSeason === 'complete') {
        // "Complete Series": Full series boxsets and complete run packs
        result = result.filter(t => t.isCompleteSeries || /complete|s\d{1,2}\s*-\s*s?\d{1,2}|season\s*\d{1,2}\s*-\s*\d{1,2}|all\s*seasons|entire\s*series|full\s*series/i.test(t.title || ''))
        // Deduplicate by hash
        const seen = new Set()
        result = result.filter(t => {
          if (!t.hash) return true
          if (seen.has(t.hash)) return false
          seen.add(t.hash)
          return true
        })
      } else if (typeof selectedSeason === 'number') {
        if (selectedEpisode === 'all') {
          // If viewing All Episodes for a specific season, deduplicate batch packs of the same hash
          const seen = new Set()
          result = result.filter(t => {
            if (!t.hash) return true
            if (seen.has(t.hash)) return false
            seen.add(t.hash)
            return true
          })
        }
      }
    }

    // 2. Quality Filter
    if (qualityFilter !== 'all') {
      result = result.filter(t => t.quality?.toLowerCase() === qualityFilter.toLowerCase())
    }

    // 3. Audio Filter
    if (audioFilter !== 'all') {
      result = result.filter(t => {
        if (audioFilter === 'Dual Audio') {
          return t.audios?.includes('Dual Audio') || t.audios?.includes('Multi Audio')
        }
        return t.audios?.includes(audioFilter)
      })
    }

    // 4. Sorting
    result = [...result].sort((a, b) => {
      if (sortBy === 'size_desc') {
        return (b.sizeBytes || 0) - (a.sizeBytes || 0)
      }
      if (sortBy === 'size_asc') {
        return (a.sizeBytes || 0) - (b.sizeBytes || 0)
      }
      // Default: 'seeds'
      return (b.seeds || 0) - (a.seeds || 0)
    })

    return result
  }, [torrents, searchQuery, qualityFilter, audioFilter, selectedSeason, selectedEpisode, sortBy, type, activeProvider])

  // Early return if modal is not open, AFTER all hooks are called
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div
        className="bg-[#0b0f19] border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.85)] overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/70">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 border shadow-inner ${activeProvider === 'yts'
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400 shadow-emerald-500/20'
                : 'bg-violet-950/60 border-violet-500/40 text-violet-400 shadow-violet-500/20'
              }`}>
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black text-white truncate flex items-center gap-2">
                <span>{title}</span>
                {year && <span className="text-slate-500 text-xs font-semibold">({year})</span>}
              </h2>
              <p className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
                <span>Torrents & Streams</span>
                <span className="text-slate-600">·</span>
                <span className={activeProvider === 'yts' ? 'text-emerald-400 font-extrabold' : 'text-violet-400 font-extrabold'}>
                  {activeProvider === 'yts' ? 'YTS.mx' : 'Torrentio'}
                </span>
                {imdbId && (
                  <>
                    <span className="text-slate-600">·</span>
                    <span className="text-amber-400/90 font-mono text-[11px]">{imdbId}</span>
                  </>
                )}
                {type === 'tv' && activeProvider === 'torrentio' && (
                  <>
                    <span className="text-slate-600">·</span>
                    {selectedSeason === 'all' ? (
                      <span className="text-slate-400 font-bold">All</span>
                    ) : selectedSeason === 'all_seasons' ? (
                      <span className="text-amber-400 font-bold">All Seasons (Batches)</span>
                    ) : selectedSeason === 'complete' ? (
                      <span className="text-amber-300 font-bold">Complete Series</span>
                    ) : (
                      <span className="text-violet-300 font-bold">
                        Season {selectedSeason} {selectedEpisode !== 'all' ? `· Ep ${selectedEpisode}` : ''}
                      </span>
                    )}
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Top Actions: Search Button & Close Button */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setIsSearchOpen(prev => !prev)}
              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${isSearchOpen || searchQuery
                  ? 'bg-violet-600 text-white border-violet-400 shadow-lg shadow-violet-600/40'
                  : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white'
                }`}
              title={isSearchOpen ? 'Close Search Bar' : 'Search Torrents'}
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Popup Search Bar (Pops up when clicking Search button at top) */}
        {isSearchOpen && (
          <div className="p-3 sm:px-5 bg-[#0e1424] border-b border-violet-500/30 flex items-center gap-3 animate-fade-in shadow-inner">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-violet-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search releases (e.g. S01E03, PSA, 1080p, Hindi, BluRay, 1337x)..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 focus:outline-none rounded-xl pl-10 pr-9 py-2 text-white text-xs placeholder-slate-500 transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                  title="Clear search text"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={() => {
                setIsSearchOpen(false)
                setSearchQuery('')
              }}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer whitespace-nowrap"
            >
              Close
            </button>
          </div>
        )}

        {/* Provider Switcher Tabs & TV Controls */}
        <div className="p-3 sm:p-4 border-b border-slate-800/60 bg-[#0e1322]/90 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          {/* Highlighted Provider Tabs Slider */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-2xl w-full sm:w-auto shadow-inner">
            <button
              onClick={() => setActiveProvider('yts')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${activeProvider === 'yts'
                  ? 'bg-emerald-500 text-white font-black shadow-lg shadow-emerald-500/40 border border-emerald-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent font-bold'
                }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>YTS</span>
              <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${activeProvider === 'yts' ? 'bg-black/30 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                Movies
              </span>
            </button>

            <button
              onClick={() => setActiveProvider('torrentio')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${activeProvider === 'torrentio'
                  ? 'bg-violet-600 text-white font-black shadow-lg shadow-violet-600/40 border border-violet-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent font-bold'
                }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Torrentio</span>
              <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${activeProvider === 'torrentio' ? 'bg-black/30 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                Movie & TV
              </span>
            </button>
          </div>

          {/* TV Controls: 1st Seasons Dropdown, 2nd Episodes Dropdown, 3rd Reset Button */}
          {type === 'tv' && activeProvider === 'torrentio' && (
            <div className="flex items-center gap-2 sm:gap-2.5 w-full lg:w-auto flex-wrap">
              {/* 1st: Seasons Dropdown */}
              <select
                value={selectedSeason}
                onChange={(e) => {
                  const val = e.target.value
                  setSelectedSeason(val === 'all' || val === 'all_seasons' || val === 'complete' ? val : Number(val))
                  setSelectedEpisode('all')
                }}
                className="bg-[#12141e] hover:bg-[#181b28] border border-slate-800 text-slate-100 text-xs sm:text-[13px] font-medium rounded-xl px-3.5 py-2 outline-none focus:border-violet-500 transition-colors cursor-pointer"
              >
                <option value="all">All</option>
                <option value="all_seasons">All Seasons</option>
                <option value="complete">Complete Series</option>
                {seasonsList.map(s => (
                  <option key={s.season_number} value={s.season_number}>
                    {s.name && s.name.startsWith('Season') ? s.name : `Season ${s.season_number}`}
                  </option>
                ))}
              </select>

              {/* 2nd: Episodes Dropdown */}
              <select
                value={selectedEpisode}
                onChange={(e) => {
                  const val = e.target.value
                  setSelectedEpisode(val === 'all' ? 'all' : Number(val))
                }}
                className="bg-[#12141e] hover:bg-[#181b28] border border-slate-800 text-slate-100 text-xs sm:text-[13px] font-medium rounded-xl px-3.5 py-2 outline-none focus:border-violet-500 transition-colors cursor-pointer"
              >
                <option value="all">All Episodes</option>
                {typeof selectedSeason === 'number' &&
                  Array.from({ length: maxEpisodesInSeason }, (_, i) => i + 1).map(ep => (
                    <option key={ep} value={ep}>
                      Episode {ep}
                    </option>
                  ))}
              </select>

              {/* 3rd: Reset Button */}
              <button
                type="button"
                onClick={handleResetTvFilters}
                className="bg-[#12141e] hover:bg-[#181b28] border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white px-3.5 py-2 rounded-xl text-xs sm:text-[13px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Reset TV Filters"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Reset</span>
              </button>
            </div>
          )}
        </div>

        {/* Filter & Sort Bar (Quality, Audio & Sorting) */}
        <div className="p-3 sm:px-5 bg-slate-950/60 border-b border-slate-800/60 flex items-center justify-between flex-wrap gap-2.5 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Quality Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-bold text-[11px] flex items-center gap-1">
                <Video className="w-3 h-3 text-slate-400" />
                Res:
              </span>
              <select
                value={qualityFilter}
                onChange={(e) => setQualityFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-slate-200 text-[11px] font-bold rounded-xl px-2.5 py-1 outline-none focus:border-violet-500 cursor-pointer"
              >
                <option value="all">All Resolutions</option>
                <option value="4K">4K</option>
                <option value="1080p">1080p</option>
                <option value="720p">720p</option>
              </select>
            </div>

            {/* Audio Filters */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-bold text-[11px] flex items-center gap-1">
                <Volume2 className="w-3 h-3 text-amber-400" />
                Audio:
              </span>
              <select
                value={audioFilter}
                onChange={(e) => setAudioFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-slate-200 text-[11px] font-bold rounded-xl px-2.5 py-1 outline-none focus:border-violet-500 cursor-pointer"
              >
                <option value="all">All Audio</option>
                <option value="Dual Audio">Dual/Multi</option>
                <option value="Hindi">Hindi</option>
                <option value="English">English</option>
              </select>
            </div>
          </div>

          {/* Right side: Sort selector and count */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Sort Options */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-bold text-[11px] flex items-center gap-1">
                <ArrowUpDown className="w-3 h-3 text-slate-400" />
                Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-slate-200 text-[11px] font-bold rounded-xl px-2.5 py-1 outline-none focus:border-violet-500 cursor-pointer"
              >
                <option value="seeds">🔥 Most Seeders</option>
                <option value="size_desc">💾 Size: Largest First</option>
                <option value="size_asc">💾 Size: Smallest First</option>
              </select>
            </div>

            <div className="text-slate-500 text-[11px] font-semibold">
              {loading ? (
                <span className="flex items-center gap-1.5 text-violet-400">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Loading...
                </span>
              ) : (
                <span>
                  {processedTorrents.length} result{processedTorrents.length === 1 ? '' : 's'}
                  {searchQuery ? ` matching "${searchQuery}"` : ''}
                </span>
              )}
            </div>
          </div>
        </div>


        {/* Torrents List Content */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 space-y-2">
          {loading && (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-violet-400" />
              <p className="text-xs font-semibold">
                Scanning {activeProvider === 'yts' ? 'YTS' : 'Torrentio'} database...
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center flex flex-col items-center justify-center gap-3 my-4">
              <AlertCircle className="w-8 h-8 text-amber-400" />
              <p className="text-sm font-semibold text-slate-300 max-w-md">{error}</p>
              {type === 'tv' && activeProvider === 'yts' && (
                <button
                  onClick={() => setActiveProvider('torrentio')}
                  className="mt-1 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-extrabold transition-all cursor-pointer shadow-md shadow-violet-600/30"
                >
                  Switch to Torrentio for TV Series
                </button>
              )}
            </div>
          )}

          {!loading && !error && processedTorrents.length === 0 && (
            <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
              <p className="font-bold text-slate-400">
                {searchQuery
                  ? `No torrents match "${searchQuery}".`
                  : type === 'tv' && selectedSeason === 'complete'
                    ? 'No complete series packs found for this show.'
                    : type === 'tv' && selectedSeason === 'all_seasons'
                      ? 'No season batch packs found across all seasons.'
                      : type === 'tv' && typeof selectedSeason === 'number'
                        ? `No streams found for Season ${selectedSeason}${selectedEpisode !== 'all' ? ` Episode ${selectedEpisode}` : ''}.`
                        : 'No torrents match the active filters.'}
              </p>
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-violet-400 hover:underline cursor-pointer text-xs font-bold mt-1"
                >
                  Clear search
                </button>
              ) : type === 'tv' && (selectedSeason !== 'all' || selectedEpisode !== 'all') ? (
                <button
                  onClick={handleResetTvFilters}
                  className="text-violet-400 hover:underline cursor-pointer text-xs font-bold mt-1 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Show all seasons & episodes</span>
                </button>
              ) : null}
              {qualityFilter !== 'all' || audioFilter !== 'all' ? (
                <button
                  onClick={() => {
                    setQualityFilter('all')
                    setAudioFilter('all')
                  }}
                  className="text-slate-400 hover:text-white cursor-pointer text-xs underline"
                >
                  Reset Quality/Audio Filters
                </button>
              ) : null}
            </div>
          )}

          {!loading && !error && processedTorrents.map((t, idx) => {
            const is4K = t.quality === '4K' || t.quality === '2160p'
            const is1080p = t.quality === '1080p'
            const isCopied = copiedHash === t.hash

            // Rip Type badge styling
            const ripType = t.ripType
            const isCam = ripType === 'CAM'
            const isBluRay = ripType === 'BluRay'
            const isWeb = ripType === 'WEB-DL'
            const isRemux = ripType === 'REMUX'

            return (
              <div
                key={t.hash || idx}
                className={`p-3 sm:px-4 sm:py-3 rounded-2xl bg-[#0e1322] border transition-all flex flex-col md:grid md:grid-cols-[1fr_120px_90px_85px_42px_42px] gap-2.5 md:gap-3 items-start md:items-center shadow-md group ${t.isBatch
                    ? 'border-amber-500/30 hover:border-amber-500/60 bg-gradient-to-r from-amber-950/15 via-[#0e1322] to-[#0e1322]'
                    : 'border-slate-800/80 hover:border-violet-500/40 hover:bg-[#12182b]'
                  }`}
              >
                {/* Column 1: Title & Tags */}
                <div className="min-w-0 w-full pr-1">
                  {/* Badges / Tags Row */}
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    {/* Batch / Complete / Single Episode Badge */}
                    {t.isCompleteSeries ? (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center gap-1 shadow-sm">
                        <span>📦 Complete Series</span>
                      </span>
                    ) : t.isBatch ? (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center gap-1 shadow-sm">
                        <span>📦 Season Batch</span>
                      </span>
                    ) : (type === 'tv' || activeProvider === 'torrentio') ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-300 flex items-center gap-1">
                        <span>🎬 Single Episode</span>
                      </span>
                    ) : null}

                    {/* Audio Badges (Dual Audio, Hindi, English, etc.) */}
                    {t.audios?.map(audio => {
                      const isDual = audio === 'Dual Audio' || audio === 'Multi Audio'
                      const isHindi = audio === 'Hindi'
                      return (
                        <span
                          key={audio}
                          className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${isDual
                              ? 'bg-amber-500/20 border-amber-500/30 text-amber-300'
                              : isHindi
                                ? 'bg-orange-500/20 border-orange-500/30 text-orange-300'
                                : 'bg-blue-500/15 border-blue-500/30 text-blue-300'
                            }`}
                        >
                          {isDual ? '🎧 ' + audio : audio}
                        </span>
                      )
                    })}

                    {/* Source / Indexer tag */}
                    {t.source && (
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                        {t.source}
                      </span>
                    )}

                    {/* Codec / Format Tags */}
                    {t.codec && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-950 text-slate-400">
                        {t.codec}
                      </span>
                    )}
                    {t.tags?.map(tag => (
                      <span key={tag} className="text-[9px] font-black px-1.5 py-0.5 rounded bg-violet-950/60 border border-violet-500/30 text-violet-300">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Release Title */}
                  <h4 className="text-xs sm:text-[13px] font-bold text-white group-hover:text-violet-200 transition-colors line-clamp-2 break-all leading-snug">
                    {t.title}
                  </h4>

                  {/* View Files Expandable Button */}
                  {t.files && t.files.length > 0 && (
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleExpandFiles(t.hash)
                        }}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-bold transition-all cursor-pointer shadow-sm ${
                          expandedHashes.has(t.hash)
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-amber-500/10'
                            : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700/60 text-slate-300 hover:text-white'
                        }`}
                        title="View all files in this torrent pack"
                      >
                        <FolderArchive className="w-3.5 h-3.5 text-amber-400" />
                        <span>{expandedHashes.has(t.hash) ? 'Hide files' : `View files (${t.files.length})`}</span>
                        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${expandedHashes.has(t.hash) ? 'rotate-180 text-amber-300' : ''}`} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Column 2: Quality */}
                <div className="flex md:flex-col items-center md:items-start gap-1 flex-wrap">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider border shadow-sm ${is4K
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                      : is1080p
                        ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
                        : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    }`}>
                    {t.quality}
                  </span>

                  {ripType && (
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider border ${isCam
                        ? 'bg-rose-500/25 border-rose-500/40 text-rose-300 animate-pulse'
                        : isBluRay
                          ? 'bg-sky-500/15 border-sky-500/30 text-sky-300'
                          : isWeb
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                            : isRemux
                              ? 'bg-purple-500/20 border-purple-500/30 text-purple-300'
                              : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}>
                      {ripType}
                    </span>
                  )}
                </div>

                {/* Column 3: Size */}
                <div className="text-xs font-black text-slate-200 flex items-center gap-1 whitespace-nowrap">
                  <span className="text-slate-400 text-xs">💾</span>
                  <span>{t.size || 'N/A'}</span>
                </div>

                {/* Column 4: Seeders */}
                <div className="text-xs font-black text-emerald-400 flex items-center gap-1 whitespace-nowrap">
                  <Flame className="w-3.5 h-3.5 fill-emerald-400/80 text-emerald-400 flex-shrink-0" />
                  <span>{t.seeds !== undefined ? t.seeds : '-'}</span>
                </div>

                {/* Column 5: Copy (Logo ONLY, no text) */}
                <div className="flex items-center justify-center">
                  <button
                    onClick={() => handleCopyMagnet(t.hash, t.magnetUrl)}
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${isCopied
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-md shadow-emerald-500/30 scale-105'
                        : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                      }`}
                    title={isCopied ? 'Copied Magnet Link!' : 'Copy Magnet Link'}
                    aria-label="Copy Magnet Link"
                  >
                    {isCopied ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-300" />
                    )}
                  </button>
                </div>

                {/* Column 6: Magnet (Logo ONLY, no text) */}
                <div className="flex items-center justify-center gap-1.5">
                  <a
                    href={t.magnetUrl}
                    className="w-9 h-9 rounded-xl bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center border border-violet-500 shadow-md shadow-violet-600/30 transition-all cursor-pointer hover:scale-105"
                    title="Open in Torrent Client"
                    aria-label="Open Magnet Link"
                  >
                    <Magnet className="w-4 h-4" />
                  </a>

                  {/* Direct .torrent download logo (for YTS) */}
                  {t.torrentUrl && (
                    <a
                      href={t.torrentUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                      title="Download .torrent file"
                      aria-label="Download .torrent file"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                {/* Expandable Files List for Batches */}
                {expandedHashes.has(t.hash) && t.files && t.files.length > 0 && (
                  <div className="w-full col-span-full mt-2 pt-2.5 border-t border-slate-800/80 animate-fade-in">
                    <div className="bg-[#070a12] border border-slate-800/90 rounded-2xl p-3 max-h-56 overflow-y-auto space-y-1.5 text-xs shadow-inner">
                      <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-slate-800/80 text-[11px] font-bold text-slate-400 px-1">
                        <span className="flex items-center gap-1.5 text-amber-400">
                          <FolderArchive className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-slate-200">Files in this torrent ({t.files.length})</span>
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">Pack contents</span>
                      </div>
                      <div className="space-y-1">
                        {t.files.map((file, fIdx) => (
                          <div
                            key={fIdx}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-slate-800/40 text-slate-300 hover:text-white font-mono text-[11px] transition-colors group/f"
                          >
                            <span className="text-slate-600 font-bold select-none text-[10px] w-5 text-right flex-shrink-0 group-hover/f:text-slate-400">
                              {fIdx + 1}.
                            </span>
                            <FileVideo className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                            <span className="truncate flex-1 font-sans text-xs" title={file}>
                              {file}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>


      </div>
    </div>
  )
}
