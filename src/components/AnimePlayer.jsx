import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Play, Check, Search, Film, X, ChevronLeft, ChevronRight, Bookmark, SlidersHorizontal, Grid3x3, List, Star, Tv, Layers } from 'lucide-react'
import { fetchAnilistAnimeDetails } from '../lib/anilist'
import { findKitsuAnime, fetchKitsuEpisodesRange } from '../lib/kitsu'

export default function AnimePlayer({ items, onUpdateItem }) {
  const { id, epNum } = useParams()
  const navigate = useNavigate()

  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Player configurations (persisted in localStorage)
  const [autoPlay, setAutoPlay] = useState(() => localStorage.getItem('player_auto_play') === 'true')
  const [autoNext, setAutoNext] = useState(() => localStorage.getItem('player_auto_next') !== 'false') // default true
  const [autoSkip, setAutoSkip] = useState(() => localStorage.getItem('player_auto_skip') === 'true')
  const [miniPlayer, setMiniPlayer] = useState(false)
  const [lightOff, setLightOff] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)

  // Language & Server configurations
  const [language, setLanguage] = useState('sub') // 'sub' or 'dub'
  const [activeServer, setActiveServer] = useState('Vidstream-2')

  // Search and view switcher for right-side episodes list
  const [episodeSearch, setEpisodeSearch] = useState('')
  const [sideView, setSideView] = useState('list') // 'list' or 'grid'

  // Kitsu Metadata & Pagination States
  const currentEpInt = parseInt(epNum, 10) || 1
  const [kitsuAnime, setKitsuAnime] = useState(null)
  const [kitsuEpisodes, setKitsuEpisodes] = useState({})
  const [kitsuLoading, setKitsuLoading] = useState(false)
  const [activeRangeStart, setActiveRangeStart] = useState(() => {
    return Math.floor((currentEpInt - 1) / 50) * 50 + 1
  })

  // Sync active range with current episode number when epNum changes
  useEffect(() => {
    const epRangeStart = Math.floor((currentEpInt - 1) / 50) * 50 + 1
    setActiveRangeStart(epRangeStart)
  }, [currentEpInt])

  // Sync state changes with localStorage
  useEffect(() => {
    localStorage.setItem('player_auto_play', autoPlay)
  }, [autoPlay])

  useEffect(() => {
    localStorage.setItem('player_auto_next', autoNext)
  }, [autoNext])

  useEffect(() => {
    localStorage.setItem('player_auto_skip', autoSkip)
  }, [autoSkip])

  // Extract numeric AniList ID
  const numericId = id ? id.replace('anilist_', '') : ''

  // Watchlist item lookup
  const lookupId = id
  let item = items.find(i => i.id === lookupId || (i.tmdb_id === lookupId && i.status !== 'list_only'))

  // Load details
  useEffect(() => {
    const loadDetails = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchAnilistAnimeDetails(id)
        if (data) {
          setDetails(data)
        } else {
          setError('No details found for this anime.')
        }
      } catch (err) {
        console.error('Failed to load anime details:', err)
        setError(err.message || 'Failed to fetch details from AniList.')
      } finally {
        setLoading(false)
      }
    }
    if (id) {
      loadDetails()
    }
  }, [id])

  // Check if bookmarked in watchlist
  useEffect(() => {
    if (item && item.status !== 'list_only') {
      setIsBookmarked(true)
    } else {
      setIsBookmarked(false)
    }
  }, [item])

  const maxEpisodes = details?.seasons?.[0]?.episode_count 
    || details?.episodes 
    || (details?.nextAiringEpisode ? details.nextAiringEpisode.episode - 1 : (kitsuAnime?.episodeCount || 12))

  // Resolve Kitsu Anime mapping
  useEffect(() => {
    if (!details?.title) return
    let isMounted = true
    const resolveKitsu = async () => {
      const year = details.release_date ? details.release_date.split('-')[0] : null
      const matched = await findKitsuAnime(details.title, year)
      if (isMounted && matched) {
        setKitsuAnime(matched)
      }
    }
    resolveKitsu()
    return () => { isMounted = false }
  }, [details?.title])

  // Fetch Kitsu episodes for current range in player
  useEffect(() => {
    if (!kitsuAnime?.id) return
    let isMounted = true
    const rangeEnd = Math.min(activeRangeStart + 49, maxEpisodes)
    const loadKitsuEps = async () => {
      setKitsuLoading(true)
      try {
        const epsMap = await fetchKitsuEpisodesRange(kitsuAnime.id, activeRangeStart, rangeEnd)
        if (isMounted) {
          setKitsuEpisodes(prev => ({ ...prev, ...epsMap }))
        }
      } catch (err) {
        console.warn('Failed to load Kitsu episodes for player:', err)
      } finally {
        if (isMounted) setKitsuLoading(false)
      }
    }
    loadKitsuEps()
    return () => { isMounted = false }
  }, [kitsuAnime?.id, activeRangeStart, maxEpisodes])

  // Watch progress updater
  const handleMarkWatched = (num) => {
    if (!item || item.isExplore) return
    const currentWatched = item.season_progress?.[1] || 0
    if (num > currentWatched) {
      const status = num >= maxEpisodes ? 'completed' : 'watching'
      onUpdateItem(item.id, {
        season_progress: { 1: num },
        status: status
      })
    }
  }

  // Monitor playback complete event from MegaPlay postMessage API
  useEffect(() => {
    const handleMessage = (event) => {
      let data = event.data
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data)
        } catch (e) {
          return
        }
      }

      if (data.event === 'complete') {
        console.log('MegaPlay playback complete event received')
        const currentEp = parseInt(epNum, 10)
        handleMarkWatched(currentEp)

        if (autoNext && currentEp < maxEpisodes) {
          // Play next episode automatically after 3 seconds
          setTimeout(() => {
            navigate(`/anime-player/${id}/${currentEp + 1}`)
          }, 3000)
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [id, epNum, maxEpisodes, autoNext, item, maxEpisodes])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-slate-400 gap-3 bg-black">
        <span className="w-10 h-10 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
        <p className="text-sm font-semibold">Loading player...</p>
      </div>
    )
  }

  if (error || !details) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black px-4 text-center">
        <div className="text-rose-500 font-medium max-w-md mx-auto bg-rose-500/10 border border-rose-500/20 p-6 rounded-2xl mb-6">
          <p className="text-lg font-bold mb-2">Error Loading Player</p>
          <p className="text-sm text-slate-400">{error || 'Anime not found'}</p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    )
  }

  const streamingUrl = `https://megaplay.buzz/stream/ani/${numericId}/${currentEpInt}/${language}`

  // Parse helper helpers
  const parseEpisodeNumber = (title) => {
    if (!title) return null
    const match = title.match(/Episode\s+(\d+)/i)
    return match ? parseInt(match[1], 10) : null
  }

  const cleanEpisodeName = (title, num) => {
    if (!title) return `Episode ${num}`
    const prefixRegex = new RegExp(`^Episode\\s+${num}\\s*(?:-|:|–|—)?\\s*`, 'i')
    const cleaned = title.replace(prefixRegex, '')
    if (!cleaned.trim()) return title
    return cleaned.trim()
  }

  const findStreamingEpisode = (num, list) => {
    if (!list || list.length === 0) return null
    const match = list.find(se => parseEpisodeNumber(se.title) === num)
    if (match) return match
    if (list[num - 1]) {
      const parsedNum = parseEpisodeNumber(list[num - 1].title)
      if (parsedNum === null || parsedNum === num) return list[num - 1]
    }
    return null
  }

  // Filter episodes list in side panel
  const rangeEnd = Math.min(activeRangeStart + 49, maxEpisodes)
  const episodeNumbers = episodeSearch.trim()
    ? Array.from({ length: maxEpisodes }).map((_, idx) => idx + 1)
    : Array.from({ length: rangeEnd - activeRangeStart + 1 }).map((_, idx) => activeRangeStart + idx)

  const allEpisodes = episodeNumbers.map((num) => {
    const kitsuEp = kitsuEpisodes[num]
    const se = details.streamingEpisodes ? findStreamingEpisode(num, details.streamingEpisodes) : null
    return {
      num,
      name: kitsuEp?.title || (se ? cleanEpisodeName(se.title, num) : `Episode ${num}`),
      thumbnail: kitsuEp?.thumbnail || se?.thumbnail || details.backdrop_path || details.poster_path || ''
    }
  })

  const filteredEpisodes = allEpisodes.filter(ep => {
    if (!episodeSearch.trim()) return true
    const query = episodeSearch.toLowerCase().trim()
    const isNum = !isNaN(query) && parseInt(query, 10) === ep.num
    if (isNum) return true
    const matchStr = query.match(/(?:ep(?:isode)?\s+)(\d+)/i)
    if (matchStr && parseInt(matchStr[1], 10) === ep.num) return true
    return ep.name.toLowerCase().includes(query)
  })

  return (
    <div className={`min-h-screen pb-16 bg-[#060408] transition-all duration-500 ${lightOff ? 'brightness-50 saturate-[0.15]' : ''}`}>
      {/* Light Overlay toggle shield */}
      {lightOff && (
        <div
          onClick={() => setLightOff(false)}
          className="fixed inset-0 z-40 bg-black/40 cursor-pointer pointer-events-auto"
          title="Click to turn on the lights"
        />
      )}

      {/* Header Brand Bar */}
      <div className="w-full bg-[#0a080e]/95 border-b border-slate-900/80 sticky top-0 z-30 backdrop-blur-md px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/media/${id}`)}
            className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* logo brand */}
          <div className="flex items-center gap-2 select-none cursor-pointer" onClick={() => navigate('/')}>
            <div className="text-xl font-extrabold text-white tracking-tight flex items-center">
              ani<span className="text-[#00f2fe] drop-shadow-[0_0_8px_rgba(0,242,254,0.5)]">chi</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#100d16] border border-slate-800/85 p-0.5 rounded-lg text-xs font-extrabold text-slate-400 select-none">
            <span className="px-2 py-0.5 bg-violet-650/10 border border-violet-500/20 text-violet-400 rounded">EN</span>
            <span className="px-2 py-0.5">JP</span>
          </div>
          <div className="w-7 h-7 rounded-full bg-violet-650 flex items-center justify-center text-white text-xs font-black select-none">
            U
          </div>
        </div>
      </div>

      {/* Main Grid Wrapper */}
      <div className="max-w-7xl mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">

        {/* Left Side: Video Player, Toggles, Source Info */}
        <div className="lg:col-span-8 flex flex-col gap-5">

          {/* Iframe Viewport */}
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-855 bg-black shadow-2xl">
            <iframe
              src={streamingUrl}
              className="w-full h-full border-0"
              scrolling="no"
              allowFullScreen
              allow="autoplay; encrypted-media; picture-in-picture"
              title={`Streaming Episode ${currentEpInt}`}
            />
          </div>

          {/* Autoplay / Configuration controls row */}
          <div className="w-full bg-[#0a080e] border border-slate-900/90 rounded-2xl p-4 shadow-xl flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap items-center gap-4 text-xs font-extrabold text-slate-400">
              <label className="flex items-center gap-2 cursor-pointer select-none hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={autoPlay}
                  onChange={(e) => setAutoPlay(e.target.checked)}
                  className="rounded border-slate-800 bg-[#100d16] text-violet-500 focus:ring-0 cursor-pointer h-3.5 w-3.5"
                />
                <span>Auto Play</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={autoNext}
                  onChange={(e) => setAutoNext(e.target.checked)}
                  className="rounded border-slate-800 bg-[#100d16] text-violet-500 focus:ring-0 cursor-pointer h-3.5 w-3.5"
                />
                <span className="text-emerald-400">✓ Auto Next</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={autoSkip}
                  onChange={(e) => setAutoSkip(e.target.checked)}
                  className="rounded border-slate-800 bg-[#100d16] text-violet-500 focus:ring-0 cursor-pointer h-3.5 w-3.5"
                />
                <span>Auto Skip</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={miniPlayer}
                  onChange={(e) => setMiniPlayer(e.target.checked)}
                  className="rounded border-slate-800 bg-[#100d16] text-violet-500 focus:ring-0 cursor-pointer h-3.5 w-3.5"
                />
                <span>Mini Player</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={lightOff}
                  onChange={(e) => setLightOff(e.target.checked)}
                  className="rounded border-slate-800 bg-[#100d16] text-violet-500 focus:ring-0 cursor-pointer h-3.5 w-3.5"
                />
                <span>Light</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={isBookmarked}
                  onChange={() => {
                    // bookmarks placeholder check
                    setIsBookmarked(!isBookmarked)
                  }}
                  className="rounded border-slate-800 bg-[#100d16] text-violet-500 focus:ring-0 cursor-pointer h-3.5 w-3.5"
                />
                <span>Add Bookmark</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={currentEpInt <= 1}
                onClick={() => navigate(`/anime-player/${id}/${currentEpInt - 1}`)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:hover:bg-slate-900 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                ‹ Prev
              </button>
              <button
                disabled={currentEpInt >= maxEpisodes}
                onClick={() => navigate(`/anime-player/${id}/${currentEpInt + 1}`)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:hover:bg-slate-900 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                Next ›
              </button>
            </div>
          </div>

          {/* Server details panel */}
          <div className="w-full bg-[#0a080e] border border-slate-900/90 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row gap-5 items-start justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-extrabold text-white">
                Watching <span className="text-violet-400">Episode {currentEpInt}</span>
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-lg">
                Pick a server type, then choose a source. If playback fails, switch server or type (Sub/Dub).
              </p>
            </div>

            <div className="flex flex-col gap-3 items-end w-full md:w-auto">
              {/* SUB vs DUB toggler */}
              <div className="flex items-center gap-2 bg-[#100d16] border border-slate-850 p-1 rounded-xl w-full md:w-auto justify-between">
                <button
                  onClick={() => setLanguage('sub')}
                  className={`px-3 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer ${language === 'sub'
                      ? 'bg-emerald-500/15 text-emerald-450 border border-emerald-500/25'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                    }`}
                >
                  <span className="text-[10px] uppercase font-bold tracking-wider">CC</span> SUB
                </button>
                <button
                  onClick={() => setLanguage('dub')}
                  className={`px-3 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer ${language === 'dub'
                      ? 'bg-emerald-500/15 text-emerald-455 border border-emerald-500/25'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                    }`}
                >
                  DUB
                </button>
              </div>

              {/* Server selector mock */}
              <div className="flex items-center gap-2 flex-wrap">
                {['Vidstream-2', 'HD-2', 'VidPlay-1'].map(srv => (
                  <button
                    key={srv}
                    onClick={() => setActiveServer(srv)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${activeServer === srv
                        ? 'bg-violet-650 hover:bg-violet-500 text-white border-violet-500'
                        : 'bg-[#100d16] hover:bg-slate-900 border-slate-800 text-slate-350'
                      }`}
                  >
                    {srv}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Next Episode countdown card banner */}
          {currentEpInt < maxEpisodes && (
            <div className="w-full bg-gradient-to-r from-violet-950/20 via-slate-900/20 to-indigo-950/20 border border-violet-900/20 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-600/15 flex items-center justify-center text-violet-400">
                  <Tv className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase text-violet-400 tracking-wider">Next Episode</span>
                  <h4 className="text-xs font-bold text-white leading-tight">Episode {currentEpInt + 1}</h4>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/anime-player/${id}/${currentEpInt + 1}`)}
                  className="px-4 py-2 rounded-xl bg-violet-650 hover:bg-violet-500 text-white text-xs font-bold cursor-pointer transition-all"
                >
                  Play Next
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Right Side: Scrollable Episodes List panel */}
        <div className="lg:col-span-4 flex flex-col bg-[#0a080e] border border-slate-900 rounded-2xl p-5 shadow-2xl h-[calc(100vh-140px)] sticky top-24">
          <div className="flex items-center justify-between mb-4 border-b border-slate-900 pb-3">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Film className="w-4 h-4 text-violet-400" />
              Episodes
            </h3>

            {/* View switcher */}
            <div className="flex bg-[#100d16] border border-slate-800/80 p-0.5 rounded-lg">
              <button
                onClick={() => setSideView('list')}
                className={`p-1.5 rounded transition-all cursor-pointer ${sideView === 'list' ? 'bg-violet-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'
                  }`}
                title="List view"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setSideView('grid')}
                className={`p-1.5 rounded transition-all cursor-pointer ${sideView === 'grid' ? 'bg-violet-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'
                  }`}
                title="Grid view"
              >
                <Grid3x3 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Episode Find Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Find ep..."
              value={episodeSearch}
              onChange={(e) => setEpisodeSearch(e.target.value)}
              className="w-full bg-[#100d16] border border-slate-800 text-white text-xs rounded-xl pl-9 pr-8 py-2 focus:outline-none focus:border-violet-500 transition-all placeholder-slate-600"
            />
            {episodeSearch && (
              <button
                onClick={() => setEpisodeSearch('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Range Selector for large series (>50 episodes) */}
          {(() => {
            const rangeStep = 50
            const totalRanges = Math.ceil(maxEpisodes / rangeStep)
            if (totalRanges <= 1 || episodeSearch.trim()) return null

            const ranges = Array.from({ length: totalRanges }).map((_, i) => {
              const start = i * rangeStep + 1
              const end = Math.min((i + 1) * rangeStep, maxEpisodes)
              return { start, end, label: `${start}–${end}` }
            })

            return (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-thin scrollbar-thumb-slate-800">
                {ranges.map((r) => {
                  const isSelected = activeRangeStart === r.start
                  return (
                    <button
                      key={r.start}
                      onClick={() => setActiveRangeStart(r.start)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex-shrink-0 cursor-pointer ${
                        isSelected
                          ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30 border border-violet-500'
                          : 'bg-[#100d16] text-slate-400 hover:text-white border border-slate-850'
                      }`}
                    >
                      {r.label}
                    </button>
                  )
                })}
              </div>
            )
          })()}

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {filteredEpisodes.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs font-semibold">
                No episodes found
              </div>
            ) : sideView === 'grid' ? (
              <div className="grid grid-cols-4 gap-2">
                {filteredEpisodes.map((ep) => {
                  const isActive = ep.num === currentEpInt
                  return (
                    <button
                      key={ep.num}
                      onClick={() => navigate(`/anime-player/${id}/${ep.num}`)}
                      className={`w-full aspect-square rounded-lg flex items-center justify-center font-extrabold text-sm border transition-all cursor-pointer ${isActive
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-md shadow-emerald-500/10'
                          : 'border-slate-850 bg-[#100d16]/40 text-slate-400 hover:border-slate-700 hover:text-white'
                        }`}
                    >
                      {ep.num}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filteredEpisodes.map((ep) => {
                  const isActive = ep.num === currentEpInt
                  return (
                    <div
                      key={ep.num}
                      onClick={() => navigate(`/anime-player/${id}/${ep.num}`)}
                      className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all cursor-pointer select-none group/ep ${isActive
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-sm shadow-emerald-500/5'
                          : 'border-slate-850 bg-[#100d16]/30 text-slate-350 hover:border-slate-800 hover:bg-[#100d16]/60'
                        }`}
                    >
                      {/* ep thumbnail preview */}
                      <div className="w-14 aspect-video rounded-lg overflow-hidden bg-slate-950 flex-shrink-0 border border-slate-850 relative group-hover/ep:border-slate-700 transition-colors">
                        {ep.thumbnail ? (
                          <img src={ep.thumbnail} alt={ep.name} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600">
                            <Film className="w-3.5 h-3.5 opacity-40" />
                          </div>
                        )}
                        <span className="absolute bottom-0.5 right-1 text-[8px] font-black px-1 rounded bg-black/80 text-white">
                          #{ep.num}
                        </span>
                      </div>

                      {/* ep name */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-extrabold ${isActive ? 'text-emerald-400' : 'text-slate-400'}`}>
                            EP {ep.num}
                          </span>
                        </div>
                        <h4 className={`text-xs font-bold truncate leading-tight group-hover/ep:text-white transition-colors ${isActive ? 'text-emerald-400' : 'text-slate-300'
                          }`}>
                          {ep.name}
                        </h4>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
