import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Film, Tv, BarChart2, Layers, CheckCircle2, Bookmark, Eye, Clock, List, TrendingUp, HelpCircle, Loader2, User, Clapperboard, ChevronLeft, ChevronRight } from 'lucide-react'
import { fetchTMDB } from '../lib/tmdb'

// TMDB Genre Maps
const MOVIE_GENRES = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western'
}

const TV_GENRES = {
  10759: 'Action & Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  10762: 'Kids',
  9648: 'Mystery',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War & Politics',
  37: 'Western'
}

export default function Statistics({ items = [] }) {
  const navigate = useNavigate()
  const [mediaType, setMediaType] = useState('movies') // 'movies' or 'tvshows'
  const [hideIndian, setHideIndian] = useState(false)
  const [genreCache, setGenreCache] = useState(() => {
    try {
      const cached = localStorage.getItem('cinelog_genre_cache')
      return cached ? JSON.parse(cached) : {}
    } catch {
      return {}
    }
  })
  const [actorCache, setActorCache] = useState(() => {
    try {
      const cached = localStorage.getItem('cinelog_actor_cache')
      return cached ? JSON.parse(cached) : {}
    } catch {
      return {}
    }
  })
  const [directorCache, setDirectorCache] = useState(() => {
    try {
      const cached = localStorage.getItem('cinelog_director_cache')
      return cached ? JSON.parse(cached) : {}
    } catch {
      return {}
    }
  })
  const [loadingGenres, setLoadingGenres] = useState(false)
  const [fetchingProgress, setFetchingProgress] = useState({ current: 0, total: 0 })

  const normalizeCountryName = (c) => {
    if (!c) return ''
    const clean = c.trim().toLowerCase()
    if (clean === 'us' || clean === 'usa' || clean === 'united states') return 'United States'
    if (clean === 'gb' || clean === 'uk' || clean === 'united kingdom') return 'United Kingdom'
    if (clean === 'kr' || clean === 'south korea') return 'South Korea'
    if (clean === 'jp' || clean === 'japan') return 'Japan'
    if (clean === 'fr' || clean === 'france') return 'France'
    if (clean === 'in' || clean === 'india') return 'India'
    if (clean === 'cn' || clean === 'china') return 'China'
    return c.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
  }

  const targetType = mediaType === 'movies' ? 'movie' : 'tv'
  const filteredItems = React.useMemo(() => {
    return items
      .filter(item => item.type === targetType && item.status !== 'list_only')
      .filter(item => !hideIndian || normalizeCountryName(item.country) !== 'India')
  }, [items, targetType, hideIndian])

  const totalCount = filteredItems.length

  // Filter items by status
  const completedItems = React.useMemo(() => {
    return filteredItems.filter(item => item.status === 'completed')
  }, [filteredItems])

  const watchingItems = React.useMemo(() => {
    return filteredItems.filter(item => item.status === 'watching')
  }, [filteredItems])

  const plannedItems = React.useMemo(() => {
    return filteredItems.filter(item => item.status === 'planned')
  }, [filteredItems])

  const pendingItems = React.useMemo(() => {
    return filteredItems.filter(item => item.status === 'pending')
  }, [filteredItems])

  const backlogItems = React.useMemo(() => {
    return filteredItems.filter(item => item.status === 'backlog')
  }, [filteredItems])

  // Resolve genres and cast metadata for completed items
  useEffect(() => {
    let active = true
    const resolveMetadata = async () => {
      const targetType = mediaType === 'movies' ? 'movie' : 'tv'
      const completedList = items.filter(item => item.type === targetType && item.status === 'completed')

      // Identify items that need TMDB fetching
      const itemsToFetch = completedList.filter(item => {
        const hasGenreIds = Array.isArray(item.genre_ids) && item.genre_ids.length > 0
        const hasGenres = Array.isArray(item.genres) && item.genres.length > 0
        const hasGenresResolved = hasGenreIds || hasGenres || genreCache[item.tmdb_id]
        const hasActorsResolved = actorCache[item.tmdb_id]
        const hasDirectorsResolved = directorCache[item.tmdb_id]
        return (!hasGenresResolved || !hasActorsResolved || !hasDirectorsResolved) && item.tmdb_id
      })

      if (itemsToFetch.length === 0) return

      setLoadingGenres(true)
      setFetchingProgress({ current: 0, total: itemsToFetch.length })

      let updatedGenreCache = { ...genreCache }
      let updatedActorCache = { ...actorCache }
      let updatedDirectorCache = { ...directorCache }
      let count = 0

      for (const item of itemsToFetch) {
        if (!active) return
        try {
          const endpoint = item.type === 'movie' ? `/movie/${item.tmdb_id}` : `/tv/${item.tmdb_id}`
          const details = await fetchTMDB(endpoint, { append_to_response: 'credits' })
          
          if (details && details.genres) {
            updatedGenreCache[item.tmdb_id] = details.genres.map(g => g.name)
          } else if (details && details.genre_ids) {
            const map = item.type === 'movie' ? MOVIE_GENRES : TV_GENRES
            updatedGenreCache[item.tmdb_id] = details.genre_ids.map(id => map[id]).filter(Boolean)
          }

          if (details && details.credits && details.credits.cast) {
            const topCast = details.credits.cast
              .slice(0, 6)
              .map(actor => ({
                id: actor.id,
                name: actor.name,
                profile_path: actor.profile_path
              }))
            updatedActorCache[item.tmdb_id] = topCast
          }

          if (details) {
            let directors = []
            if (details.credits && details.credits.crew) {
              directors = details.credits.crew
                .filter(member => member.job === 'Director')
                .map(dir => ({
                  id: dir.id,
                  name: dir.name,
                  profile_path: dir.profile_path
                }))
            }
            if (directors.length === 0 && details.created_by) {
              directors = details.created_by.map(creator => ({
                id: creator.id,
                name: creator.name,
                profile_path: creator.profile_path
              }))
            }
            updatedDirectorCache[item.tmdb_id] = directors
          }
        } catch (err) {
          console.error(`Failed to fetch metadata for ${item.title}:`, err)
        }
        count++
        setFetchingProgress({ current: count, total: itemsToFetch.length })
        // Small delay to prevent TMDB rate-limiting
        await new Promise(resolve => setTimeout(resolve, 150))
      }

      if (active) {
        setGenreCache(updatedGenreCache)
        setActorCache(updatedActorCache)
        setDirectorCache(updatedDirectorCache)
        localStorage.setItem('cinelog_genre_cache', JSON.stringify(updatedGenreCache))
        localStorage.setItem('cinelog_actor_cache', JSON.stringify(updatedActorCache))
        localStorage.setItem('cinelog_director_cache', JSON.stringify(updatedDirectorCache))
        setLoadingGenres(false)
      }
    }

    resolveMetadata()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, mediaType])

  // Aggregate genres from completed items
  const genreCounts = React.useMemo(() => {
    const counts = {}
    const map = mediaType === 'movies' ? MOVIE_GENRES : TV_GENRES

    completedItems.forEach(item => {
      // 1. Check direct genres list
      if (Array.isArray(item.genres) && item.genres.length > 0) {
        item.genres.forEach(g => {
          const name = typeof g === 'string' ? g : g.name
          if (name) counts[name] = (counts[name] || 0) + 1
        })
      } 
      // 2. Check direct genre_ids list
      else if (Array.isArray(item.genre_ids) && item.genre_ids.length > 0) {
        item.genre_ids.forEach(id => {
          const name = map[id]
          if (name) counts[name] = (counts[name] || 0) + 1
        })
      } 
      // 3. Check cached genres from TMDB details
      else if (item.tmdb_id && genreCache[item.tmdb_id]) {
        genreCache[item.tmdb_id].forEach(name => {
          if (name) counts[name] = (counts[name] || 0) + 1
        })
      }
      // 4. Default to Unknown if none
      else {
        counts['Uncategorized'] = (counts['Uncategorized'] || 0) + 1
      }
    })

    // Sort genres by count in descending order
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  }, [completedItems, genreCache, mediaType])

  // Aggregate actors from completed items
  const actorCounts = React.useMemo(() => {
    const counts = {}

    completedItems.forEach(item => {
      if (item.tmdb_id && actorCache[item.tmdb_id]) {
        actorCache[item.tmdb_id].forEach(actor => {
          if (!actor.id) return
          if (!counts[actor.id]) {
            counts[actor.id] = {
              id: actor.id,
              name: actor.name,
              profile_path: actor.profile_path,
              count: 0
            }
          }
          counts[actor.id].count += 1
        })
      }
    })

    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [completedItems, actorCache])
 
  // Aggregate directors from completed items
  const directorCounts = React.useMemo(() => {
    const counts = {}

    completedItems.forEach(item => {
      if (item.tmdb_id && directorCache[item.tmdb_id]) {
        directorCache[item.tmdb_id].forEach(director => {
          if (!director.id) return
          if (!counts[director.id]) {
            counts[director.id] = {
              id: director.id,
              name: director.name,
              profile_path: director.profile_path,
              count: 0
            }
          }
          counts[director.id].count += 1
        })
      }
    })

    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [completedItems, directorCache])

  const topGenre = genreCounts.length > 0 ? genreCounts[0].name : 'N/A'
  const completionRate = totalCount > 0 ? Math.round((completedItems.length / totalCount) * 100) : 0

  // Horizontal Scroll & Arrow state hooks for Top Actors/Directors
  const actorsScrollRef = useRef(null)
  const directorsScrollRef = useRef(null)
  const [actorsScrollState, setActorsScrollState] = useState({ canLeft: false, canRight: true })
  const [directorsScrollState, setDirectorsScrollState] = useState({ canLeft: false, canRight: true })

  const checkScrollState = (ref, setter) => {
    if (ref.current) {
      const { scrollLeft, scrollWidth, clientWidth } = ref.current
      setter({
        canLeft: scrollLeft > 10,
        canRight: scrollLeft + clientWidth < scrollWidth - 10
      })
    }
  }

  const scrollContainer = (ref, direction) => {
    if (ref.current) {
      const { scrollLeft, clientWidth } = ref.current
      const amount = clientWidth * 0.75
      ref.current.scrollTo({
        left: direction === 'left' ? scrollLeft - amount : scrollLeft + amount,
        behavior: 'smooth'
      })
    }
  }

  useEffect(() => {
    const actEl = actorsScrollRef.current
    const checkAct = () => checkScrollState(actorsScrollRef, setActorsScrollState)
    if (actEl) {
      actEl.addEventListener('scroll', checkAct)
      window.addEventListener('resize', checkAct)
      setTimeout(checkAct, 150)
    }
    return () => {
      if (actEl) actEl.removeEventListener('scroll', checkAct)
      window.removeEventListener('resize', checkAct)
    }
  }, [actorCounts])

  useEffect(() => {
    const dirEl = directorsScrollRef.current
    const checkDir = () => checkScrollState(directorsScrollRef, setDirectorsScrollState)
    if (dirEl) {
      dirEl.addEventListener('scroll', checkDir)
      window.addEventListener('resize', checkDir)
      setTimeout(checkDir, 150)
    }
    return () => {
      if (dirEl) dirEl.removeEventListener('scroll', checkDir)
      window.removeEventListener('resize', checkDir)
    }
  }, [directorCounts])

  const getStatusColorClass = (status) => {
    switch (status) {
      case 'completed': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      case 'watching': return 'text-violet-400 bg-violet-500/10 border-violet-500/20'
      case 'pending': return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      case 'planned': return 'text-sky-400 bg-sky-500/10 border-sky-500/20'
      case 'backlog': return 'text-slate-400 bg-slate-500/10 border-slate-500/20'
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20'
    }
  }

  const getStatusPillColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500'
      case 'watching': return 'bg-violet-500'
      case 'pending': return 'bg-amber-500'
      case 'planned': return 'bg-sky-500'
      case 'backlog': return 'bg-slate-500'
      default: return 'bg-slate-500'
    }
  }

  const statusRows = [
    { id: 'completed', label: 'Completed', count: completedItems.length, icon: CheckCircle2 },
    { id: 'watching', label: 'Watching', count: watchingItems.length, icon: Eye },
    { id: 'pending', label: 'Pending', count: pendingItems.length, icon: Clock },
    { id: 'planned', label: 'Planned', count: plannedItems.length, icon: Bookmark },
    { id: 'backlog', label: 'Backlog', count: backlogItems.length, icon: Layers }
  ]



  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto animate-fade-in text-slate-100">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <BarChart2 className="w-8 h-8 text-violet-400" />
            Collection Statistics
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Analyze your watch status and favorite genres across your movie and TV collections.
          </p>
        </div>

        {/* Hide Indian Toggle Switch */}
        <div className="flex items-center gap-3 bg-[#0c0f1d]/60 border border-slate-800/80 px-4 py-2.5 rounded-2xl shadow-xl w-fit self-end md:self-center">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Hide Indian</span>
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hideIndian}
              onChange={(e) => setHideIndian(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-8 h-4.5 bg-slate-950 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-3.5 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-slate-500 after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-violet-600 peer-checked:after:bg-white"></div>
          </label>
        </div>
      </div>

      {/* Sliding Tabs Switcher */}
      <div className="flex justify-center mb-10">
        <div className="relative flex bg-[#0c0f1d] p-1.5 rounded-2xl border border-slate-800/80 w-full max-w-[340px] shadow-2xl">
          <div 
            className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-violet-600 rounded-xl transition-all duration-300 ease-out shadow-lg shadow-violet-500/25 ${
              mediaType === 'tvshows' ? 'translate-x-full' : 'translate-x-0'
            }`}
          />
          
          <button
            onClick={() => setMediaType('movies')}
            className={`relative z-10 flex-1 py-3 text-center text-sm font-extrabold transition-colors duration-300 rounded-xl flex items-center justify-center gap-2 cursor-pointer ${
              mediaType === 'movies' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Film className="w-4 h-4" />
            Movies
          </button>
          <button
            onClick={() => setMediaType('tvshows')}
            className={`relative z-10 flex-1 py-3 text-center text-sm font-extrabold transition-colors duration-300 rounded-xl flex items-center justify-center gap-2 cursor-pointer ${
              mediaType === 'tvshows' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tv className="w-4 h-4" />
            TV Shows
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
        <div className="bg-[#0a0a0a] border border-slate-800/60 rounded-2xl p-5 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Added</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-white">{totalCount}</span>
            <span className="text-xs font-semibold text-slate-400">items</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2">
            All tracked {mediaType === 'movies' ? 'movies' : 'TV shows'} in your library
          </p>
        </div>

        <div className="bg-[#0a0a0a] border border-slate-800/60 rounded-2xl p-5 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Top Genre</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-violet-400 truncate max-w-full block" title={topGenre}>
              {topGenre}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2">
            {completedItems.length > 0 ? 'Your absolute favorite category' : 'No items watched yet'}
          </p>
        </div>
      </div>

      {/* Main Breakdown Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Side: Status Table */}
        <div className="md:col-span-6 bg-[#0a0a0a]/60 border border-slate-800/60 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-2.5 mb-6">
            <List className="w-5 h-5 text-violet-400" />
            <h3 className="text-base font-extrabold text-white">List Breakdown</h3>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-800/40">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#080b16] border-b border-slate-850">
                  <th className="px-4 py-3 text-xs font-bold text-slate-400">List Status</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-400 text-right">Items</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 bg-transparent">
                {statusRows.map(row => {
                  const IconComp = row.icon
                  return (
                    <tr key={row.id} className="hover:bg-[#0c1022]/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-semibold text-slate-200">
                        <div className="flex items-center gap-2">
                          <IconComp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span>{row.label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-right text-slate-100">
                        <span className={`px-2 py-0.5 rounded text-xs border ${getStatusColorClass(row.id)}`}>
                          {row.count}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Ranked Genre List */}
        <div className="md:col-span-6 bg-[#0a0a0a]/60 border border-slate-800/60 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-md relative overflow-hidden">
          
          {/* Title Header with TMDB background syncing loader */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <TrendingUp className="w-5 h-5 text-violet-400" />
              <h3 className="text-base font-extrabold text-white">Top Completed Genres</h3>
            </div>
            
            {loadingGenres && (
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-violet-400 bg-violet-950/40 border border-violet-900/40 px-2 py-1 rounded-lg animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Syncing ({fetchingProgress.current}/{fetchingProgress.total})</span>
              </div>
            )}
          </div>

          {completedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <HelpCircle className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-sm font-semibold text-slate-400">No completed items yet</p>
              <p className="text-xs text-slate-500 max-w-[240px] mt-1">
                Mark movies or shows as completed to see your genre analysis.
              </p>
            </div>
          ) : genreCounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Loader2 className="w-10 h-10 text-violet-500 animate-spin mb-3" />
              <p className="text-sm font-semibold text-slate-400">Analyzing collection genres...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1">
              {genreCounts.slice(0, 10).map((genre, idx) => {
                return (
                  <div 
                    key={genre.name} 
                    className="bg-[#101424]/40 border border-slate-850 hover:border-violet-500/40 rounded-xl p-3 flex flex-col justify-between h-24 hover:-translate-y-0.5 transition-all group/genre relative overflow-hidden"
                  >
                    {/* Top: Name and Rank */}
                    <div className="flex items-start justify-between gap-1.5">
                      <span className="text-[11px] font-extrabold text-slate-200 group-hover/genre:text-violet-400 transition-colors line-clamp-1" title={genre.name}>
                        {genre.name}
                      </span>
                      <span className="text-[9px] font-black px-1.5 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 group-hover/genre:text-violet-300 transition-colors rounded flex-shrink-0">
                        #{idx + 1}
                      </span>
                    </div>
                    
                    {/* Bottom: Total items */}
                    <div className="mt-auto">
                      <span className="text-lg font-black text-white block leading-none">
                        {genre.count}
                      </span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mt-1">
                        {genre.count === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Background Decorative Sparkles */}
          <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-violet-600/5 rounded-full blur-2xl pointer-events-none" />
        </div>
      </div>

      {/* Top 10 Actors Section */}
      <div className="mt-8 bg-[#0a0a0a]/60 border border-slate-800/60 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-md relative overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <User className="w-5 h-5 text-violet-400" />
            <h3 className="text-base font-extrabold text-white">Top 10 Most Watched Actors</h3>
          </div>
          {actorCounts.length > 0 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => scrollContainer(actorsScrollRef, 'left')}
                disabled={!actorsScrollState.canLeft}
                className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                  actorsScrollState.canLeft
                    ? 'bg-[#101424] border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                    : 'bg-[#090c15] border-slate-900 text-slate-700 cursor-not-allowed opacity-30'
                }`}
                title="Scroll Left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollContainer(actorsScrollRef, 'right')}
                disabled={!actorsScrollState.canRight}
                className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                  actorsScrollState.canRight
                    ? 'bg-[#101424] border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                    : 'bg-[#090c15] border-slate-900 text-slate-700 cursor-not-allowed opacity-30'
                }`}
                title="Scroll Right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {completedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <User className="w-12 h-12 text-slate-600 mb-3" />
            <p className="text-sm font-semibold text-slate-400">No completed items yet</p>
            <p className="text-xs text-slate-500 max-w-[240px] mt-1">
              Mark movies or shows as completed to see actor analysis.
            </p>
          </div>
        ) : actorCounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            {loadingGenres ? (
              <>
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-3" />
                <p className="text-sm font-semibold text-slate-400">Resolving cast details from TMDB...</p>
              </>
            ) : (
              <>
                <HelpCircle className="w-10 h-10 text-slate-600 mb-3" />
                <p className="text-sm font-semibold text-slate-400">No actor details available</p>
                <p className="text-xs text-slate-500 max-w-[280px] mt-1">
                  Ensure TMDB API Key is configured in settings to retrieve cast details.
                </p>
              </>
            )}
          </div>
        ) : (
          <div 
            ref={actorsScrollRef}
            className="flex gap-6 overflow-x-auto pb-4 scrollbar-none scroll-smooth"
          >
            {actorCounts.map((actor, idx) => (
              <div 
                key={actor.id} 
                onClick={() => navigate(`/explore_tmdb?type=person&id=${actor.id}&name=${encodeURIComponent(actor.name)}`)}
                className="w-28 sm:w-32 flex-shrink-0 flex flex-col items-center text-center p-2 transition-all hover:-translate-y-1 group/actor relative cursor-pointer"
              >
                {/* Rank Badge */}
                <span className="absolute top-1 left-2 text-[11px] font-black text-slate-500 group-hover/actor:text-violet-400 transition-colors">
                  #{idx + 1}
                </span>

                {/* Actor Avatar */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-slate-950 border border-slate-850 flex items-center justify-center flex-shrink-0 group-hover/actor:scale-105 transition-transform duration-300 shadow-md">
                  {actor.profile_path ? (
                    <img 
                      src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`} 
                      alt={actor.name} 
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-violet-600/30 to-indigo-600/30 flex items-center justify-center font-black text-violet-300 text-base">
                      {actor.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Actor Names */}
                <div className="mt-3 w-full">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-200 line-clamp-2 group-hover/actor:text-violet-400 transition-colors" title={actor.name}>
                    {actor.name}
                  </h4>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top 10 Directors Section */}
      <div className="mt-8 bg-[#0a0a0a]/60 border border-slate-800/60 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-md relative overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <Clapperboard className="w-5 h-5 text-violet-400" />
            <h3 className="text-base font-extrabold text-white">Top 10 Most Watched Directors</h3>
          </div>
          {directorCounts.length > 0 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => scrollContainer(directorsScrollRef, 'left')}
                disabled={!directorsScrollState.canLeft}
                className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                  directorsScrollState.canLeft
                    ? 'bg-[#101424] border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                    : 'bg-[#090c15] border-slate-900 text-slate-700 cursor-not-allowed opacity-30'
                }`}
                title="Scroll Left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollContainer(directorsScrollRef, 'right')}
                disabled={!directorsScrollState.canRight}
                className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                  directorsScrollState.canRight
                    ? 'bg-[#101424] border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                    : 'bg-[#090c15] border-slate-900 text-slate-700 cursor-not-allowed opacity-30'
                }`}
                title="Scroll Right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {completedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clapperboard className="w-12 h-12 text-slate-600 mb-3" />
            <p className="text-sm font-semibold text-slate-400">No completed items yet</p>
            <p className="text-xs text-slate-500 max-w-[240px] mt-1">
              Mark movies or shows as completed to see director analysis.
            </p>
          </div>
        ) : directorCounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            {loadingGenres ? (
              <>
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-3" />
                <p className="text-sm font-semibold text-slate-400">Resolving crew details from TMDB...</p>
              </>
            ) : (
              <>
                <HelpCircle className="w-10 h-10 text-slate-600 mb-3" />
                <p className="text-sm font-semibold text-slate-400">No director details available</p>
                <p className="text-xs text-slate-500 max-w-[280px] mt-1">
                  Ensure TMDB API Key is configured in settings to retrieve crew details.
                </p>
              </>
            )}
          </div>
        ) : (
          <div 
            ref={directorsScrollRef}
            className="flex gap-6 overflow-x-auto pb-4 scrollbar-none scroll-smooth"
          >
            {directorCounts.map((director, idx) => (
              <div 
                key={director.id} 
                onClick={() => navigate(`/explore_tmdb?type=person&id=${director.id}&name=${encodeURIComponent(director.name)}`)}
                className="w-28 sm:w-32 flex-shrink-0 flex flex-col items-center text-center p-2 transition-all hover:-translate-y-1 group/director relative cursor-pointer"
              >
                {/* Rank Badge */}
                <span className="absolute top-1 left-2 text-[11px] font-black text-slate-500 group-hover/director:text-violet-400 transition-colors">
                  #{idx + 1}
                </span>

                {/* Director Avatar */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-slate-950 border border-slate-850 flex items-center justify-center flex-shrink-0 group-hover/director:scale-105 transition-transform duration-300 shadow-md">
                  {director.profile_path ? (
                    <img 
                      src={`https://image.tmdb.org/t/p/w185${director.profile_path}`} 
                      alt={director.name} 
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-violet-600/30 to-indigo-600/30 flex items-center justify-center font-black text-violet-300 text-base">
                      {director.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Director Names */}
                <div className="mt-3 w-full">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-200 line-clamp-2 group-hover/director:text-violet-400 transition-colors" title={director.name}>
                    {director.name}
                  </h4>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
