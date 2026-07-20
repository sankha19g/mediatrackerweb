import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Star, Calendar, Clock, Film, Tv, Gamepad, Trash2, ExternalLink, Play, Check, ChevronDown, ChevronUp, Sparkles, ChevronLeft, ChevronRight, Download, Plus, CheckSquare, Eye, Tag, X, Bookmark, Edit } from 'lucide-react'
import { getPosterUrl, fetchTMDB, isTMDBConfigured } from '../lib/tmdb'

const CastCarousel = ({ cast }) => {
  const scrollRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [showAll, setShowAll] = useState(false)

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 10)
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10)
    }
  }

  useEffect(() => {
    checkScroll()
    const el = scrollRef.current
    if (el) {
      el.addEventListener('scroll', checkScroll)
      window.addEventListener('resize', checkScroll)
    }
    return () => {
      if (el) el.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [cast])

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current
      const amount = clientWidth * 0.75
      scrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - amount : scrollLeft + amount,
        behavior: 'smooth'
      })
    }
  }

  if (!cast || cast.length === 0) return null

  const displayedCast = showAll ? cast : cast

  return (
    <div className="bg-[#060810] border border-white/5 rounded-2xl p-5 shadow-2xl relative group/cast mb-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-base font-bold text-white tracking-wide">Top Cast</h4>
        
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors cursor-pointer"
          >
            {showAll ? 'Show Carousel' : 'View All'}
          </button>

          {!showAll && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                  canScrollLeft
                    ? 'bg-[#101424] border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                    : 'bg-[#090c15] border-slate-900 text-slate-700 cursor-not-allowed opacity-30'
                }`}
                title="Scroll Left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                  canScrollRight
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
      </div>

      {/* Cards Display */}
      {showAll ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 max-h-[500px] overflow-y-auto pr-1">
          {cast.map(actor => (
            <div
              key={actor.id}
              className="bg-[#101424] rounded-xl overflow-hidden flex flex-col shadow-md group/actor"
            >
              <div className="aspect-[3/4] w-full bg-slate-950 relative overflow-hidden">
                {actor.profile_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                    alt={actor.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover/actor:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-900 font-bold text-2xl">
                    {actor.name.charAt(0)}
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-[#0d101d] via-[#0d101d]/90 to-transparent flex flex-col justify-end">
                  <span className="text-xs font-bold text-white truncate" title={actor.name}>
                    {actor.name}
                  </span>
                  <span className="text-[11px] text-violet-400 font-medium truncate mt-0.5" title={actor.character}>
                    {actor.character || 'Cast Member'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="relative">
          {/* Left Side Fade Overlay */}
          {canScrollLeft && (
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#060810] to-transparent z-10" />
          )}
          
          {/* Right Side Fade Overlay */}
          {canScrollRight && (
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#060810] to-transparent z-10" />
          )}

          {/* Horizontal Scroll Row */}
          <div
            ref={scrollRef}
            className="flex flex-nowrap gap-3.5 overflow-x-auto scrollbar-none py-1 scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {displayedCast.map(actor => (
              <div
                key={actor.id}
                className="w-28 sm:w-36 flex-shrink-0 bg-[#101424] rounded-xl overflow-hidden flex flex-col shadow-md transition-transform hover:-translate-y-0.5 group/actor"
              >
                <div className="aspect-[3/4] w-full bg-slate-950 relative overflow-hidden">
                  {actor.profile_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                      alt={actor.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover/actor:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-900 font-bold text-2xl">
                      {actor.name.charAt(0)}
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-[#0d101d] via-[#0d101d]/90 to-transparent flex flex-col justify-end">
                    <span className="text-xs font-bold text-white truncate" title={actor.name}>
                      {actor.name}
                    </span>
                    <span className="text-[11px] text-violet-400 font-medium truncate mt-0.5" title={actor.character}>
                      {actor.character || 'Cast Member'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const getProviderUrl = (providerName = '', mainWatchLink = '', title = '') => {
  const name = providerName.toLowerCase()
  const encodedTitle = encodeURIComponent(title)
  
  if (name.includes('netflix')) {
    return `https://www.netflix.com/search?q=${encodedTitle}`
  }
  if (name.includes('prime') || name.includes('amazon')) {
    return `https://www.primevideo.com/search/ref=atv_sr_sug?phrase=${encodedTitle}`
  }
  if (name.includes('hotstar') || name.includes('disney')) {
    return `https://www.hotstar.com/in/explore?search=${encodedTitle}`
  }
  if (name.includes('jiocinema') || name.includes('jio')) {
    return `https://www.jiocinema.com/search/${encodedTitle}`
  }
  if (name.includes('zee')) {
    return `https://www.zee5.com/search?q=${encodedTitle}`
  }
  if (name.includes('sonyliv') || name.includes('sony')) {
    return `https://www.sonyliv.com/search?q=${encodedTitle}`
  }
  if (name.includes('apple')) {
    return `https://tv.apple.com/search?term=${encodedTitle}`
  }
  if (mainWatchLink) {
    return mainWatchLink
  }
  return `https://www.google.com/search?q=${encodeURIComponent(`Watch ${title} online`)}`
}

const getLetterboxdUrl = (title, year) => {
  if (!title) return ''
  const cleanTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with dashes
    .replace(/-+/g, '-') // Collapse multiple dashes
  const suffix = year ? `-${year}` : ''
  return `https://letterboxd.com/film/${cleanTitle}${suffix}/`
}

const formatRuntime = (mins) => {
  if (!mins) return ''
  const hrs = Math.floor(mins / 60)
  const remainingMins = mins % 60
  if (hrs > 0) {
    return `${hrs} hr${hrs > 1 ? 's' : ''}${remainingMins > 0 ? ` ${remainingMins} min${remainingMins !== 1 ? 's' : ''}` : ''}`
  }
  return `${mins} min${mins !== 1 ? 's' : ''}`
}

const LANGUAGE_NAMES = {
  'en': 'English',
  'ja': 'Japanese',
  'ko': 'Korean',
  'es': 'Spanish',
  'fr': 'French',
  'it': 'Italian',
  'de': 'German',
  'zh': 'Chinese',
  'cn': 'Chinese',
  'ru': 'Russian',
  'hi': 'Hindi',
  'pt': 'Portuguese',
  'nl': 'Dutch',
  'sv': 'Swedish',
  'no': 'Norwegian',
  'da': 'Danish',
  'fi': 'Finnish',
  'pl': 'Polish',
  'tr': 'Turkish',
  'th': 'Thai',
  'vi': 'Vietnamese',
  'ar': 'Arabic',
  'fa': 'Persian',
  'el': 'Greek',
  'he': 'Hebrew',
  'id': 'Indonesian',
  'ms': 'Malay',
  'tl': 'Tagalog',
  'uk': 'Ukrainian',
  'hu': 'Hungarian',
  'cs': 'Czech',
  'ro': 'Romanian'
}

const SeasonCard = ({ season, item, seasonsWatched, toggleSeasonWatched }) => {
  const [expanded, setExpanded] = useState(false)
  const [episodes, setEpisodes] = useState([])
  const [loading, setLoading] = useState(false)

  const handleExpand = async () => {
    if (!expanded) {
      if (episodes.length === 0) {
        setLoading(true)
        try {
          const data = await fetchTMDB(`/tv/${item.tmdb_id}/season/${season.season_number}`)
          setEpisodes(data.episodes || [])
        } catch (err) {
          console.error(err)
        } finally {
          setLoading(false)
        }
      }
    }
    setExpanded(!expanded)
  }

  const isWatched = seasonsWatched.includes(season.season_number)

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden transition-colors hover:border-slate-700">
      <div 
        className="flex items-center gap-4 p-3 cursor-pointer group"
        onClick={handleExpand}
      >
        <div className="w-12 h-16 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
          {season.poster_path ? (
            <img src={`https://image.tmdb.org/t/p/w92${season.poster_path}`} alt={season.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-700 text-xs text-center p-1">No Img</div>
          )}
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-slate-200 text-sm group-hover:text-violet-400 transition-colors flex items-center gap-2">
            {season.name}
            {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </h4>
          <p className="text-xs text-slate-500">{season.episode_count} Episodes • {season.air_date ? season.air_date.split('-')[0] : 'TBA'}</p>
        </div>
        {!item.isExplore && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleSeasonWatched(season.season_number)
            }}
            className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all cursor-pointer z-10 ${
              isWatched 
                ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-500'
            }`}
            title={isWatched ? "Mark Unwatched" : "Mark Watched"}
          >
            <Check className={`w-4 h-4 ${isWatched ? 'opacity-100' : 'opacity-50'}`} />
          </button>
        )}
      </div>
      
      {/* Expanded Episodes List */}
      {expanded && (
        <div className="border-t border-slate-800 bg-slate-950/50 p-4 max-h-96 overflow-y-auto">
          {loading ? (
             <div className="text-center text-slate-500 text-xs py-4 flex items-center justify-center gap-2">
               <span className="w-4 h-4 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
               Loading episodes...
             </div>
          ) : (
             <div className="flex flex-col gap-4">
               {episodes.length === 0 && <p className="text-xs text-slate-500">No episodes found.</p>}
               {episodes.map(ep => (
                 <div key={ep.id} className="flex gap-4 items-start border-b border-slate-800/50 pb-4 last:border-0 last:pb-0">
                   <div className="w-28 sm:w-32 aspect-video bg-slate-800 rounded-lg flex-shrink-0 overflow-hidden border border-slate-700/50">
                     {ep.still_path ? (
                       <img src={`https://image.tmdb.org/t/p/w185${ep.still_path}`} className="w-full h-full object-cover" />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">No Img</div>
                     )}
                   </div>
                   <div className="flex-1 min-w-0">
                     <h5 className="text-sm font-bold text-slate-200 truncate flex items-center gap-2">
                       <span className="text-violet-400">E{ep.episode_number}</span> 
                       {ep.name}
                     </h5>
                     <p className="text-xs text-slate-400 line-clamp-3 mt-1.5 leading-relaxed">
                       {ep.overview || "No description available."}
                     </p>
                   </div>
                 </div>
               ))}
             </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function MediaDetails({ items, onUpdateItem, onRemoveItem, onAddItem, sources = [], downloadSources = [] }) {
  const { id, type, tmdb_id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const [addStatus, setAddStatus] = useState('planned')
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  
  let item = items.find(i => i.id === id)
  if (!item && location.state?.addedItem && location.state.addedItem.id === id) {
    item = location.state.addedItem
  }
  
  // If it's an explore route, we construct a stub item
  if (!item && tmdb_id && type) {
    // Check if it's actually in our items anyway
    const existing = items.find(i => i.tmdb_id === tmdb_id && i.type === type)
    if (existing) {
      item = existing
    } else {
      item = { tmdb_id, type, isExplore: true }
    }
  }

  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(false)
  const [currentSeasonDetails, setCurrentSeasonDetails] = useState(null)
  const [isTrailerOpen, setIsTrailerOpen] = useState(false)
  const [isPlayerOpen, setIsPlayerOpen] = useState(false)
  const [isDownloadOpen, setIsDownloadOpen] = useState(false)
  const [activeSource, setActiveSource] = useState('')
  const [collectionDetails, setCollectionDetails] = useState(null)
  const [loadingCollection, setLoadingCollection] = useState(false)
  const [selectedSeason, setSelectedSeason] = useState(1)
  const [selectedEpisode, setSelectedEpisode] = useState(1)
  const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false)
  const [showAllProviders, setShowAllProviders] = useState(false)

  const tmdbId = item?.tmdb_id || details?.id

  // Calculate TV season list from details
  const allSeasons = details?.seasons?.filter(s => s.season_number > 0) || []
  const seasonsList = allSeasons.length > 0 ? allSeasons : [{ season_number: 1, episode_count: 24, name: 'Season 1' }]
  
  // Find current season's max episodes
  const currentSeasonObj = seasonsList.find(s => s.season_number === selectedSeason)
  const currentSeasonMaxEpisodes = currentSeasonObj ? currentSeasonObj.episode_count : 24

  // Max seasons and last season episode count
  const maxSeasonsNum = seasonsList.length > 0 ? Math.max(...seasonsList.map(s => s.season_number)) : 1
  const lastSeasonObj = seasonsList.find(s => s.season_number === maxSeasonsNum)
  const maxEpisodesInLastSeason = lastSeasonObj ? lastSeasonObj.episode_count : 24

  const handlePrevEpisode = () => {
    if (selectedEpisode > 1) {
      setSelectedEpisode(prev => prev - 1)
    } else if (selectedSeason > 1) {
      const prevSeasonNum = selectedSeason - 1
      const prevSeasonObj = seasonsList.find(s => s.season_number === prevSeasonNum)
      const prevSeasonMaxEpisodes = prevSeasonObj ? prevSeasonObj.episode_count : 24
      setSelectedSeason(prevSeasonNum)
      setSelectedEpisode(prevSeasonMaxEpisodes)
    }
  }

  const handleNextEpisode = () => {
    if (selectedEpisode < currentSeasonMaxEpisodes) {
      setSelectedEpisode(prev => prev + 1)
    } else {
      const nextSeasonNum = selectedSeason + 1
      const hasNextSeason = seasonsList.some(s => s.season_number === nextSeasonNum)
      if (hasNextSeason) {
        setSelectedSeason(nextSeasonNum)
        setSelectedEpisode(1)
      }
    }
  }

  // Format sources dynamically: if TV show, replace /movie/ with /tv/ and replace {ID} with ID/season/episode
  const movieSources = sources.map(source => {
    let formattedUrl = source.url;
    if (item?.type === 'tv') {
      formattedUrl = formattedUrl
        .replace('/movie/', '/tv/')
        .replace('{ID}', `${tmdbId}/${selectedSeason}/${selectedEpisode}`);
    } else {
      formattedUrl = formattedUrl.replace('{ID}', tmdbId || '');
    }
    return {
      id: source.id,
      name: source.name,
      url: formattedUrl
    }
  })
  const currentSourceUrl = movieSources.find(s => s.id === activeSource)?.url || ''

  // Format download sources dynamically with same rules
  const resolvedDownloadSources = downloadSources.map(source => {
    let formattedUrl = source.url;
    if (item?.type === 'tv') {
      formattedUrl = formattedUrl
        .replace('/movie/', '/tv/')
        .replace('{ID}', `${tmdbId}/${selectedSeason}/${selectedEpisode}`);
    } else {
      formattedUrl = formattedUrl.replace('{ID}', tmdbId || '');
    }
    return {
      id: source.id,
      name: source.name,
      url: formattedUrl
    }
  })

  useEffect(() => {
    if (sources && sources.length > 0) {
      setActiveSource(sources[0].id)
    }
  }, [sources, tmdbId])

  useEffect(() => {
    // Only reset details if navigating to a DIFFERENT item
    const isSameTmdbItem = details && tmdbId && details.id?.toString() === tmdbId?.toString()
    if (!isSameTmdbItem) {
      setDetails(null)
      setCollectionDetails(null)
      setCurrentSeasonDetails(null)
    }
    setIsTrailerOpen(false)
    setIsPlayerOpen(false)
    setIsDownloadOpen(false)
    setSelectedSeason(item?.season_number || 1)
    setSelectedEpisode(1)
    if (sources && sources.length > 0) {
      setActiveSource(sources[0].id)
    } else {
      setActiveSource('')
    }
    if (!isSameTmdbItem) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [id, type, tmdb_id, sources])

  useEffect(() => {
    const loadCollection = async () => {
      if (details?.belongs_to_collection?.id) {
        setLoadingCollection(true)
        try {
          const colData = await fetchTMDB(`/collection/${details.belongs_to_collection.id}`)
          setCollectionDetails(colData)
        } catch (error) {
          console.error("Failed to fetch collection details from TMDB:", error)
        } finally {
          setLoadingCollection(false)
        }
      } else {
        setCollectionDetails(null)
      }
    }
    loadCollection()
  }, [details?.belongs_to_collection?.id])

  useEffect(() => {
    const loadDetails = async () => {
      if (item && item.tmdb_id && item.type !== 'game' && (!details || details.id?.toString() !== item.tmdb_id.toString())) {
        setLoading(true)
        try {
          // Append credits, release_dates (movies), content_ratings (tv), watch/providers, videos, external_ids
          const data = await fetchTMDB(`/${item.type}/${item.tmdb_id}`, {
            append_to_response: 'credits,release_dates,content_ratings,watch/providers,videos,external_ids'
          })
          setDetails(data)
        } catch (error) {
          console.error("Failed to fetch extended details from TMDB:", error)
        } finally {
          setLoading(false)
        }
      }
    }
    loadDetails()
  }, [item?.tmdb_id, item?.type, details])

  useEffect(() => {
    const allSeasons = details?.seasons?.filter(s => s.season_number > 0) || []
    const seasonsWatched = item?.seasons_watched || []

    // Use item.season_number directly for per-season items; fall back to scan for legacy
    const currentSeason = item?.season_number
      ? allSeasons.find(s => s.season_number === item.season_number)
      : allSeasons.find(s => !seasonsWatched.includes(s.season_number))

    if (currentSeason && item && !item.isExplore) {
      if (currentSeasonDetails?.season_number === currentSeason.season_number) return;
      
      const fetchSeason = async () => {
        try {
          const data = await fetchTMDB(`/tv/${item.tmdb_id}/season/${currentSeason.season_number}`)
          setCurrentSeasonDetails({ ...data, season_number: currentSeason.season_number })
        } catch(e) {
          console.error(e)
        }
      }
      fetchSeason()
    }
  }, [details, item])

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <h2 className="text-xl font-bold mb-4">Item not found</h2>
        <button onClick={() => navigate('/')} className="text-violet-400 hover:underline">Return to Watchlist</button>
      </div>
    )
  }

  const title = item.title || details?.title || details?.name || 'Loading...'
  const posterPath = item.poster_path || details?.poster_path
  const releaseYear = item.release_year || (details?.release_date || details?.first_air_date || '').split('-')[0]

  const handleAddItemFromDetails = async () => {
    if (!onAddItem) return
    const releaseYearStr = releaseYear || ''
    
    // Country detection logic
    const getCountryCode = () => {
      if (details?.origin_country && Array.isArray(details.origin_country) && details.origin_country.length > 0) {
        return details.origin_country[0];
      }
      if (details?.production_countries && Array.isArray(details.production_countries) && details.production_countries.length > 0) {
        return details.production_countries[0].iso_3166_1 || 'US';
      }
      return 'US';
    }

    const newItem = {
      title: title,
      type: type,
      tmdb_id: tmdbId.toString(),
      poster_path: posterPath,
      release_year: releaseYearStr,
      status: addStatus,
      country: getCountryCode(),
      original_language: details?.original_language || 'en',
      ...(type === 'tv' && {
        season_number: selectedSeason,
        season_progress: addStatus === 'watching' ? { [selectedSeason]: 1 } : { [selectedSeason]: 0 }
      })
    }

    const added = await onAddItem(newItem)
    if (added && added.id) {
      navigate(`/media/${added.id}`, { replace: true, state: { addedItem: added } })
    }
  }

  const getTypeLabel = () => {
    if (item.type === 'movie') return 'Movie'
    if (item.type === 'tv') return 'TV Show'
    return 'Game'
  }

  const getStatusLabel = (status) => {
    if (status === 'completed') return item.type === 'game' ? 'Beaten' : 'Completed'
    if (status === 'watching') return item.type === 'game' ? 'Playing' : 'Watching'
    if (status === 'pending') return item.type === 'tv' ? 'Up Next' : 'Pending'
    if (status === 'planned') return 'Planned'
    if (status === 'backlog') return 'Backlog'
    return 'Planned'
  }

  const getStatusBadgeColor = (status) => {
    if (!status) return 'bg-slate-800 text-slate-300 border-slate-700'
    switch (status) {
      case 'completed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'watching': return 'bg-sky-500/10 text-sky-400 border-sky-500/20'
      case 'pending': return 'bg-rose-500/10 text-rose-450 border-rose-500/20'
      case 'planned': return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      case 'backlog': return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
  }

  const getStatusDetails = (statusKey, isGame, isTv) => {
    switch (statusKey) {
      case 'completed':
        return {
          label: isGame ? 'Beaten (Completed)' : 'Completed',
          description: 'Finished watching/playing',
          icon: CheckSquare,
          iconBg: 'bg-emerald-500/15',
          iconColor: 'text-emerald-400',
          badgeStyle: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        }
      case 'watching':
        return {
          label: isGame ? 'Playing Now' : 'Watching Now',
          description: 'Currently in progress',
          icon: Eye,
          iconBg: 'bg-violet-500/15',
          iconColor: 'text-violet-400',
          badgeStyle: 'bg-violet-500/10 text-violet-400 border-violet-500/20'
        }
      case 'pending':
        return {
          label: isTv ? 'Up Next' : 'Pending',
          description: 'Up next in queue',
          icon: Clock,
          iconBg: 'bg-amber-500/15',
          iconColor: 'text-amber-400',
          badgeStyle: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        }
      case 'planned':
        return {
          label: isGame ? 'Plan to Play' : 'Plan to Watch',
          description: 'Saved to watch later',
          icon: Bookmark,
          iconBg: 'bg-sky-500/15',
          iconColor: 'text-sky-400',
          badgeStyle: 'bg-sky-500/10 text-sky-400 border-sky-500/20'
        }
      case 'backlog':
      default:
        return {
          label: 'Backlog',
          description: 'On low priority backlog',
          icon: Tag,
          iconBg: 'bg-slate-800',
          iconColor: 'text-slate-400',
          badgeStyle: 'bg-slate-800/80 text-slate-400 border-slate-700/80'
        }
    }
  }

  // Derived TMDB Data
  const backdropUrl = details?.backdrop_path 
    ? `https://image.tmdb.org/t/p/original${details.backdrop_path}` 
    : null;
    
  const synopsis = details?.overview || 'No synopsis available.'
  const runtime = details?.runtime || (details?.episode_run_time ? details.episode_run_time[0] : null)
  
  // Find Director, Writer, Country & Formatted Date
  const crew = details?.credits?.crew || []
  const director = crew.find(member => member.job === 'Director')?.name || 'Unknown'
  const directorName = crew.find(member => member.job === 'Director')?.name || details?.created_by?.map(c => c.name).join(', ') || 'Unknown'
  const writerName = crew.find(member => member.job === 'Writer' || member.job === 'Screenplay' || member.department === 'Writing')?.name || 'Unknown'
  const productionCountry = details?.production_countries?.[0]?.name || details?.origin_country?.[0] || 'US'
  
  const releaseDateRaw = details?.release_date || details?.first_air_date || item?.created_at
  const releaseDateFormatted = releaseDateRaw ? new Date(releaseDateRaw).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Unknown'
  
  // External IDs & Links
  const imdbId = details?.external_ids?.imdb_id || details?.imdb_id
  const homepage = details?.homepage
  const wikidataId = details?.external_ids?.wikidata_id
  const wikipediaUrl = wikidataId ? `https://www.wikidata.org/wiki/${wikidataId}` : null
  
  // Cast (All cast members)
  const cast = (details?.credits?.cast || []).filter(actor => actor.profile_path || actor.name)

  const userWatchedPart = (partId) => {
    return items.find(i => i.type === 'movie' && i.tmdb_id === partId.toString())
  }

  const sortedParts = collectionDetails?.parts
    ? [...collectionDetails.parts].sort((a, b) => {
        const dateA = a.release_date || '9999-12-31'
        const dateB = b.release_date || '9999-12-31'
        return dateA.localeCompare(dateB)
      })
    : []

  // Trailer
  const videos = details?.videos?.results || []
  const trailer = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube') || videos.find(v => v.site === 'YouTube')

  // Content Rating (PG-13, TV-MA, etc)
  let contentRating = 'NR'
  if (item.type === 'movie' && details?.release_dates?.results) {
    const usRelease = details.release_dates.results.find(r => r.iso_3166_1 === 'US')
    if (usRelease && usRelease.release_dates.length > 0) {
      contentRating = usRelease.release_dates[0].certification || 'NR'
    }
  } else if (item.type === 'tv' && details?.content_ratings?.results) {
    const usRating = details.content_ratings.results.find(r => r.iso_3166_1 === 'US')
    if (usRating) {
      contentRating = usRating.rating || 'NR'
    }
  }

  // Where to watch (India)
  const providerData = details?.['watch/providers']?.results?.IN
  const watchProviders = [
    ...(providerData?.flatrate || []),
    ...(providerData?.rent || []),
    ...(providerData?.buy || [])
  ].reduce((acc, current) => {
    const x = acc.find(item => item.provider_id === current.provider_id)
    if (!x) {
      return acc.concat([current])
    } else {
      return acc
    }
  }, [])  // TV Seasons from TMDB details
  const seasons = details?.seasons?.filter(s => s.season_number > 0) || []
  const totalEpisodes = seasons.reduce((sum, s) => sum + (s.episode_count || 0), 0)

  // All per-season items for this same show (across the watchlist)
  const allShowItems = items.filter(i => i.tmdb_id?.toString() === item.tmdb_id?.toString() && i.type === 'tv')
  const watchingSeasonItemsList = allShowItems.filter(i => i.status === 'watching' || i.status === 'pending')

  // ── Active season item: the season currently being tracked ────────────────
  const activeSeasonItem = (() => {
    if (watchingSeasonItemsList.length > 0) {
      return [...watchingSeasonItemsList].sort((a, b) => (b.season_number || 1) - (a.season_number || 1))[0]
    }
    const nonCompleted = allShowItems.find(i => i.status !== 'completed')
    if (nonCompleted) return nonCompleted
    return [...allShowItems].sort((a, b) => (b.season_number || 1) - (a.season_number || 1))[0] || item
  })()

  // currentSeason: the TMDB season object for the active season item
  const currentSeason = (() => {
    const seasonNum = activeSeasonItem?.season_number
    if (seasonNum) return seasons.find(s => s.season_number === seasonNum) || null
    return seasons[seasons.length - 1] || seasons[0] || null
  })()

  const currentSeasonNum = currentSeason?.season_number || activeSeasonItem?.season_number || 1

  // Read actual saved season_progress count if present
  const getRawProgressCount = () => {
    const prog = activeSeasonItem?.season_progress || item.season_progress
    if (!prog) return null
    if (typeof prog === 'number') return prog
    if (prog[currentSeasonNum] !== undefined) return Number(prog[currentSeasonNum])
    return null
  }

  const rawProgressCount = getRawProgressCount()

  // Check if show as a whole or any representative item is completed
  const rawCompleted = item.status === 'completed' || 
                        (allShowItems.length > 0 && allShowItems.every(i => i.status === 'completed'))

  // Show is completed only if rawCompleted is true AND (progress hasn't been decremented below max episodes)
  const isShowCompleted = rawCompleted && (rawProgressCount === null || !currentSeason || rawProgressCount >= (currentSeason.episode_count || 1))

  // Aggregate set of completed season numbers across all records for this show
  const seasonsWatchedNumbers = new Set([
    ...(item.seasons_watched || []),
    ...allShowItems.flatMap(i => i.seasons_watched || []),
    ...allShowItems.filter(i => i.status === 'completed').map(i => i.season_number).filter(Boolean),
    ...(isShowCompleted && seasons.length > 0 ? seasons.map(s => s.season_number) : [])
  ])
  const seasonsWatched = Array.from(seasonsWatchedNumbers)
  const myTotalSeasonsWatched = seasonsWatched.length

  // Episodes from fully-completed seasons
  const myEpisodesFromCompleted = seasonsWatched.reduce((sum, sNum) => {
    const tmdbSeason = seasons.find(s => s.season_number === sNum)
    return sum + (tmdbSeason?.episode_count || 0)
  }, 0)

  // Episodes watched in currently active season
  const activeSeasonIsCompleted = currentSeasonNum ? seasonsWatchedNumbers.has(currentSeasonNum) : false

  const isWatchingStatus = (activeSeasonItem?.status === 'watching') || (item.status === 'watching') || allShowItems.some(i => i.status === 'watching')

  const currentEpisodesWatched = (() => {
    if (rawProgressCount !== null && rawProgressCount > 0) return rawProgressCount
    if (isShowCompleted && currentSeason) return currentSeason.episode_count || 0
    if (isWatchingStatus) return (rawProgressCount && rawProgressCount > 0) ? rawProgressCount : 1
    return rawProgressCount || 0
  })()

  const myEpisodesFromWatching = (isShowCompleted || activeSeasonIsCompleted) ? 0 : currentEpisodesWatched
  const myTotalEpisodesWatched = isShowCompleted 
    ? (totalEpisodes || myEpisodesFromCompleted)
    : (myEpisodesFromCompleted + myEpisodesFromWatching)

  // ── Effective show status aggregated across all season items ─────────────
  const effectiveStatus = (() => {
    if (allShowItems.length === 0) return (isShowCompleted ? 'completed' : item.status || 'planned')
    if (isShowCompleted) return 'completed'
    if (seasons.length > 0 && seasonsWatched.length >= seasons.length) return 'completed'
    if (isWatchingStatus) return 'watching'
    if (currentEpisodesWatched === 0) return 'pending'
    if (watchingSeasonItemsList.length > 0) return 'watching'
    const anyNonPlanned = allShowItems.find(i => i.status !== 'planned' && i.status !== 'backlog')
    if (anyNonPlanned) return anyNonPlanned.status
    return allShowItems[0]?.status || item.status || 'planned'
  })()

  const toggleSeasonWatched = (seasonNumber) => {
    if (item.isExplore) return
    const newSeasons = seasonsWatched.includes(seasonNumber)
      ? seasonsWatched.filter(s => s !== seasonNumber)
      : [...seasonsWatched, seasonNumber]
    let updates = { seasons_watched: newSeasons }
    if (seasons.length > 0 && newSeasons.length >= seasons.length) {
      updates.status = 'completed'
    } else if (item.status === 'completed' && newSeasons.length < seasons.length) {
      updates.status = 'watching'
    }
    onUpdateItem(item.id, updates)
  }

  const upNextEpisode = currentSeasonDetails?.episodes?.[currentEpisodesWatched]

  const handleUpdateEpisodes = (seasonNumber, newCount, maxEpisodes) => {
    if (item.isExplore) return
    const targetItem = activeSeasonItem || item

    if (newCount >= maxEpisodes) {
      // Current season completed
      const prevSeasonsWatched = targetItem.seasons_watched || seasonsWatched || []
      const newSeasonsWatched = Array.from(new Set([...prevSeasonsWatched, seasonNumber]))
      
      const nextSeasonNumber = seasonNumber + 1
      const nextSeasonExists = seasons.some(s => s.season_number === nextSeasonNumber)

      if (nextSeasonExists) {
        // Advance to next season
        const nextSeasonItem = allShowItems.find(i => i.season_number === nextSeasonNumber)
        
        if (nextSeasonItem) {
          onUpdateItem(targetItem.id, {
            seasons_watched: newSeasonsWatched,
            season_progress: { ...(targetItem.season_progress || {}), [seasonNumber]: maxEpisodes },
            status: 'completed'
          })
          onUpdateItem(nextSeasonItem.id, {
            season_progress: { ...(nextSeasonItem.season_progress || {}), [nextSeasonNumber]: 0 },
            status: 'pending'
          })
        } else {
          // Single-item or advance targetItem
          onUpdateItem(targetItem.id, {
            season_number: nextSeasonNumber,
            seasons_watched: newSeasonsWatched,
            season_progress: { [nextSeasonNumber]: 0 },
            status: 'pending'
          })
        }
      } else {
        // Last season of the show completed
        onUpdateItem(targetItem.id, {
          seasons_watched: newSeasonsWatched,
          season_progress: { ...(targetItem.season_progress || {}), [seasonNumber]: maxEpisodes },
          status: 'completed'
        })
        if (item.id !== targetItem.id) {
          onUpdateItem(item.id, { status: 'completed' })
        }
      }
    } else if (newCount < 0) {
      // Decrementing below episode 0 -> move to previous season
      const prevSeasonNumber = seasonNumber - 1
      const prevSeasonObj = seasons.find(s => s.season_number === prevSeasonNumber)
      if (prevSeasonObj && prevSeasonNumber >= 1) {
        const newSeasonsWatched = (targetItem.seasons_watched || seasonsWatched || []).filter(s => s !== prevSeasonNumber)
        const prevMax = prevSeasonObj.episode_count || 1
        const prevSeasonItem = allShowItems.find(i => i.season_number === prevSeasonNumber)
        const targetCount = Math.max(0, prevMax - 1)
        const targetStatus = targetCount === 0 ? 'pending' : 'watching'
        
        if (prevSeasonItem) {
          onUpdateItem(prevSeasonItem.id, {
            season_progress: { ...(prevSeasonItem.season_progress || {}), [prevSeasonNumber]: targetCount },
            status: targetStatus
          })
        } else {
          onUpdateItem(targetItem.id, {
            season_number: prevSeasonNumber,
            seasons_watched: newSeasonsWatched,
            season_progress: { [prevSeasonNumber]: targetCount },
            status: targetStatus
          })
        }
        if (item.id !== targetItem.id) {
          onUpdateItem(item.id, { status: targetStatus })
        }
      } else {
        // Season 1 Episode 0 -> clamp to 0
        onUpdateItem(targetItem.id, {
          season_progress: { ...(targetItem.season_progress || {}), [seasonNumber]: 0 },
          status: 'pending'
        })
        if (item.id !== targetItem.id) {
          onUpdateItem(item.id, { status: 'pending' })
        }
      }
    } else {
      // Normal episode update within current season
      const prevSeasonsWatched = targetItem.seasons_watched || seasonsWatched || []
      const newSeasonsWatched = prevSeasonsWatched.filter(s => s !== seasonNumber)
      const targetStatus = newCount === 0 ? 'pending' : 'watching'

      onUpdateItem(targetItem.id, {
        season_progress: { ...(targetItem.season_progress || {}), [seasonNumber]: newCount },
        seasons_watched: newSeasonsWatched,
        status: targetStatus
      })
      if (item.id !== targetItem.id) {
        onUpdateItem(item.id, {
          seasons_watched: newSeasonsWatched,
          status: targetStatus
        })
      }
    }
  }

  return (
    <div className="animate-fade-in pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Back Navigation Header */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      {/* Hero Header Banner */}
      <div className="relative rounded-3xl overflow-hidden border-0 bg-[#060810] shadow-2xl mb-8">
        {/* Backdrop background image aligned right with smooth left-to-right & bottom fade gradients */}
        {backdropUrl && (
          <div className="absolute right-0 top-0 bottom-0 w-full md:w-3/4 lg:w-2/3 h-full z-0 overflow-hidden pointer-events-none">
            <img 
              src={backdropUrl} 
              alt="Backdrop" 
              className="w-full h-full object-cover object-center opacity-100"
            />
            {/* Left to Right Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#060810] via-[#060810]/60 to-transparent z-10" />
            {/* Bottom Fade Overlay */}
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#060810] via-[#060810]/60 to-transparent z-10" />
          </div>
        )}

        {/* Main Hero Card Content */}
        <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row gap-6 sm:gap-8 items-start">
          {/* Poster */}
          <div className="w-36 sm:w-44 md:w-52 aspect-[2/3] rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex-shrink-0 bg-slate-950">
            <img 
              src={getPosterUrl(posterPath)} 
              alt={title} 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Hero Info Column */}
          <div className="flex-1 min-w-0 flex flex-col justify-between min-h-[300px] w-full gap-4">
            <div className="flex flex-col gap-2.5">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                {item.isExplore ? (
                  <span className="text-xs font-bold text-slate-400 bg-slate-900 border border-white/10 px-3 py-1 rounded-lg">
                    Not in List
                  </span>
                ) : (
                  <span className={`text-xs font-bold px-3 py-1 rounded-lg border flex items-center gap-1.5 ${getStatusDetails(item.status || 'planned', type === 'game', type === 'tv' || item.type === 'tv').badgeStyle}`}>
                    <Check className="w-3.5 h-3.5" />
                    {getStatusDetails(item.status || 'planned', type === 'game', type === 'tv' || item.type === 'tv').label}
                  </span>
                )}
              </div>

              {/* Main Title */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                {title}
              </h1>

              {/* Metadata Row: Rating, Year, Runtime, Certification, Language */}
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-semibold text-slate-300">
                {details?.vote_average > 0 && (
                  <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    {details.vote_average.toFixed(1)}
                  </span>
                )}
                {releaseYear && (
                  <>
                    <span className="text-slate-600">·</span>
                    <span>{releaseYear}</span>
                  </>
                )}
                {runtime && (
                  <>
                    <span className="text-slate-600">·</span>
                    <span>{formatRuntime(runtime)}</span>
                  </>
                )}
                {contentRating && contentRating !== 'NR' && (
                  <>
                    <span className="text-slate-600">·</span>
                    <span className="border border-slate-700/60 bg-slate-900/60 px-1.5 py-0.5 rounded text-[11px] font-bold text-slate-300 uppercase">
                      {contentRating}
                    </span>
                  </>
                )}
                {details?.original_language && (
                  <>
                    <span className="text-slate-600">·</span>
                    <span className="capitalize">
                      {LANGUAGE_NAMES[details.original_language.toLowerCase()] || details.original_language.toUpperCase()}
                    </span>
                  </>
                )}
              </div>

              {/* Genre Pills */}
              <div className="flex flex-wrap gap-2 mt-1">
                {details?.genres?.slice(0, 2).map(g => (
                  <span key={g.id} className="text-xs font-semibold px-3 py-1 rounded-xl bg-[#14122b] text-[#a78bfa] border border-[#2e265c]">
                    {g.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Row: Synopsis (Left) & Action Buttons (Right) in Same Line */}
            <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-4 mt-2 w-full">
              {/* Overview Paragraph with Expander */}
              <div className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl flex-1">
                <p className={isSynopsisExpanded ? "" : "line-clamp-3"}>
                  {loading ? 'Loading synopsis...' : synopsis}
                </p>
                {synopsis && synopsis.length > 180 && (
                  <button
                    onClick={() => setIsSynopsisExpanded(!isSynopsisExpanded)}
                    className="text-violet-400 hover:text-violet-300 font-bold text-xs mt-1.5 cursor-pointer flex items-center gap-1"
                  >
                    {isSynopsisExpanded ? 'Read Less ▲' : 'Read More ∨'}
                  </button>
                )}
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center justify-end gap-3 flex-shrink-0">
                {(item.type === 'movie' || item.type === 'tv') && movieSources.length > 0 && (
                  <button
                    onClick={() => setIsPlayerOpen(true)}
                    className="bg-[#6332f6] hover:bg-[#5223e0] text-white font-extrabold text-sm px-6 py-3 rounded-xl flex items-center gap-2.5 shadow-lg shadow-purple-600/30 transition-all cursor-pointer active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-white stroke-white" />
                    {item.type === 'movie' ? 'Play Movie' : 'Play Show'}
                  </button>
                )}

                <button
                  onClick={() => setIsStatusModalOpen(true)}
                  className="bg-[#101424] hover:bg-[#181e36] text-slate-200 border border-white/10 font-bold text-sm px-5 py-3 rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                >
                  {item.isExplore ? <Plus className="w-4 h-4 text-violet-400" /> : <Plus className="w-4 h-4 text-violet-400" />}
                  {item.isExplore ? 'Add to List' : 'My List'}
                </button>

                {(item.type === 'movie' || item.type === 'tv') && resolvedDownloadSources.length > 0 && (
                  <button
                    onClick={() => setIsDownloadOpen(true)}
                    className="bg-[#101424] hover:bg-[#181e36] text-slate-200 border border-white/10 p-3 rounded-xl flex items-center justify-center transition-all cursor-pointer"
                    title="Download Sources"
                  >
                    <Download className="w-4 h-4 text-violet-400" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ========================================================================= */}
        {/* LEFT SIDEBAR COLUMN (lg:col-span-4) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* DETAILS Box */}
          <div className="bg-[#060810] border border-white/5 rounded-2xl p-5 shadow-2xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              DETAILS
            </h3>
            <div className="flex flex-col text-xs gap-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Release Date</span>
                <span className="text-white font-bold">{releaseDateFormatted}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Director</span>
                <span className="text-white font-bold truncate max-w-[160px] text-right">{directorName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Writer</span>
                <span className="text-white font-bold truncate max-w-[160px] text-right">{writerName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Country</span>
                <span className="text-white font-bold">{productionCountry}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Language</span>
                <span className="text-white font-bold">
                  {details?.original_language ? (LANGUAGE_NAMES[details.original_language.toLowerCase()] || details.original_language.toUpperCase()) : 'English'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Budget</span>
                <span className="text-white font-bold">{details?.budget ? `$${details.budget.toLocaleString()}` : '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Revenue</span>
                <span className="text-white font-bold">{details?.revenue ? `$${details.revenue.toLocaleString()}` : '—'}</span>
              </div>
            </div>
          </div>

          {/* RATINGS & SCORES Box */}
          <div className="bg-[#060810] border border-white/5 rounded-2xl p-5 shadow-2xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center justify-between">
              <span>RATINGS & SCORES</span>
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {/* TMDB Rating */}
              <div className="bg-[#101424] border border-slate-850 p-3 rounded-xl flex flex-col justify-between">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1">
                  <span>TMDB</span>
                  <Star className="w-3 h-3 text-sky-400 fill-sky-400" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-black text-white">{details?.vote_average ? details.vote_average.toFixed(1) : 'N/A'}</span>
                  <span className="text-[10px] text-slate-500 font-bold">/10</span>
                </div>
                <span className="text-[9px] text-slate-500 mt-1 truncate">{details?.vote_count ? `${details.vote_count.toLocaleString()} votes` : 'User Score'}</span>
              </div>

              {/* IMDb Rating/Link */}
              {imdbId ? (
                <a 
                  href={`https://www.imdb.com/title/${imdbId}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-[#101424] border border-[#f5c518]/30 hover:border-[#f5c518]/60 p-3 rounded-xl flex flex-col justify-between transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#f5c518]">
                    <span>IMDb</span>
                    <ExternalLink className="w-3 h-3 text-[#f5c518] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <div className="text-xs font-black text-slate-200 mt-1">View IMDb</div>
                  <span className="text-[9px] text-slate-400">Reviews & Trivia</span>
                </a>
              ) : (
                <a 
                  href={`https://www.imdb.com/find/?q=${encodeURIComponent(title)}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-[#101424] border border-slate-800 hover:border-[#f5c518]/40 p-3 rounded-xl flex flex-col justify-between transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#f5c518]">
                    <span>IMDb</span>
                    <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-[#f5c518] transition-colors" />
                  </div>
                  <div className="text-xs font-black text-slate-300 mt-1">Search IMDb</div>
                  <span className="text-[9px] text-slate-500">Find Page</span>
                </a>
              )}

              {/* Rotten Tomatoes */}
              <a 
                href={`https://www.rottentomatoes.com/search?search=${encodeURIComponent(title)}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-[#101424] border border-rose-500/20 hover:border-rose-500/50 p-3 rounded-xl flex flex-col justify-between transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between text-[11px] font-bold text-rose-400">
                  <span>Tomatometer</span>
                  <ExternalLink className="w-3 h-3 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="text-xs font-black text-slate-200 mt-1">Rotten Tomatoes</div>
                <span className="text-[9px] text-slate-500">Critics Score</span>
              </a>

              {/* Metacritic */}
              <a 
                href={`https://www.metacritic.com/search/${encodeURIComponent(title)}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-[#101424] border border-emerald-500/20 hover:border-emerald-500/50 p-3 rounded-xl flex flex-col justify-between transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400">
                  <span>Metacritic</span>
                  <ExternalLink className="w-3 h-3 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="text-xs font-black text-slate-200 mt-1">Metascore</div>
                <span className="text-[9px] text-slate-500">Consensus</span>
              </a>
            </div>
          </div>

          {/* WHERE TO WATCH Box */}
          <div className="bg-[#060810] border border-white/5 rounded-2xl p-5 shadow-2xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              WHERE TO WATCH
            </h3>
            {watchProviders.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {(showAllProviders ? watchProviders : watchProviders.slice(0, 3)).map(provider => (
                  <a
                    key={provider.provider_id}
                    href={getProviderUrl(provider.provider_name, providerData?.link, title)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-[#101424] border border-slate-850 hover:border-violet-500/40 transition-all group/prov"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img 
                        src={`https://image.tmdb.org/t/p/original${provider.logo_path}`} 
                        alt={provider.provider_name}
                        className="w-7 h-7 rounded-lg flex-shrink-0"
                      />
                      <span className="text-xs font-bold text-white group-hover/prov:text-violet-300 truncate">
                        {provider.provider_name}
                      </span>
                    </div>
                    <span className="text-xs font-extrabold text-violet-400 group-hover/prov:text-violet-300 flex-shrink-0">
                      Rent / Buy
                    </span>
                  </a>
                ))}
                {watchProviders.length > 3 && (
                  <button
                    onClick={() => setShowAllProviders(!showAllProviders)}
                    className="w-full py-2.5 bg-[#101424] hover:bg-[#181e36] border border-slate-800 rounded-xl text-xs font-bold text-slate-300 mt-1 transition-colors cursor-pointer"
                  >
                    {showAllProviders ? 'Show Less' : `See All (${watchProviders.length})`}
                  </button>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic py-2 text-center">
                No streaming providers listed for this region.
              </div>
            )}
          </div>

          {/* EXTERNAL LINKS Box */}
          <div className="bg-[#060810] border border-white/5 rounded-2xl p-5 shadow-2xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-violet-400" />
              EXTERNAL LINKS
            </h3>
            <div className="flex flex-wrap gap-2">
              {imdbId && (
                <a 
                  href={`https://www.imdb.com/title/${imdbId}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-2 bg-[#101424] hover:bg-[#181e36] border border-amber-500/30 hover:border-amber-400 text-amber-400 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm group"
                >
                  <span className="bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded text-[10px] font-black">IMDb</span>
                  Title Page
                  <ExternalLink className="w-3 h-3 ml-auto opacity-70 group-hover:opacity-100" />
                </a>
              )}
              {tmdbId && (
                <a 
                  href={`https://www.themoviedb.org/${item.type || 'movie'}/${tmdbId}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-2 bg-[#101424] hover:bg-[#181e36] border border-sky-500/30 hover:border-sky-400 text-sky-400 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm group"
                >
                  <span className="bg-sky-400 text-slate-950 px-1.5 py-0.5 rounded text-[10px] font-black">TMDB</span>
                  Official Page
                  <ExternalLink className="w-3 h-3 ml-auto opacity-70 group-hover:opacity-100" />
                </a>
              )}
              <a 
                href={imdbId ? `https://letterboxd.com/imdb/${imdbId}` : `https://letterboxd.com/search/${encodeURIComponent(title)}/`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2 bg-[#101424] hover:bg-[#181e36] border border-orange-500/30 hover:border-orange-400 text-orange-400 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm group cursor-pointer"
              >
                <span className="bg-orange-500 text-slate-950 px-1.5 py-0.5 rounded text-[10px] font-black">LB</span>
                Letterboxd
                <ExternalLink className="w-3 h-3 ml-auto opacity-70 group-hover:opacity-100" />
              </a>
              {homepage && (
                <a 
                  href={homepage} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-2 bg-[#101424] hover:bg-[#181e36] border border-violet-500/30 hover:border-violet-400 text-violet-300 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm group"
                >
                  <span>Official Website</span>
                  <ExternalLink className="w-3 h-3 ml-auto opacity-70 group-hover:opacity-100" />
                </a>
              )}
              {wikipediaUrl && (
                <a 
                  href={wikipediaUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-2 bg-[#101424] hover:bg-[#181e36] border border-slate-700 hover:border-slate-500 text-slate-300 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm group"
                >
                  <span>Wikidata</span>
                  <ExternalLink className="w-3 h-3 ml-auto opacity-70 group-hover:opacity-100" />
                </a>
              )}
              <a 
                href={`https://www.google.com/search?q=${encodeURIComponent(`${title} ${item.type || 'movie'}`)}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2 bg-[#101424] hover:bg-[#181e36] border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm group"
              >
                <span>Google Search</span>
                <ExternalLink className="w-3 h-3 ml-auto opacity-70 group-hover:opacity-100" />
              </a>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT MAIN COLUMN (lg:col-span-8) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* TV Show Progress & Episode Tracker Section */}
          {(type === 'tv' || item.type === 'tv') && seasons.length > 0 && (
            <div className="bg-[#060810] border border-white/5 rounded-2xl p-5 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Tv className="w-4 h-4 text-violet-400" />
                    Season & Episode Tracker
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Season {currentSeasonNum} · {currentEpisodesWatched} of {currentSeason?.episode_count || 0} episodes watched
                  </p>
                </div>

                {/* Season Selection & Quick Increment */}
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={currentSeasonNum}
                    onChange={(e) => {
                      const sNum = parseInt(e.target.value, 10)
                      const sObj = seasons.find(s => s.season_number === sNum)
                      if (sObj && !item.isExplore) {
                        handleUpdateEpisodes(sNum, 0, sObj.episode_count || 1)
                      }
                    }}
                    className="bg-[#101424] border border-white/10 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-200 focus:outline-none focus:border-violet-500 cursor-pointer"
                  >
                    {seasons.map(s => (
                      <option key={s.season_number} value={s.season_number}>
                        {s.name || `Season ${s.season_number}`} ({s.episode_count} eps)
                      </option>
                    ))}
                  </select>

                  {!item.isExplore && currentSeason && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleUpdateEpisodes(currentSeasonNum, Math.max(0, currentEpisodesWatched - 1), currentSeason.episode_count || 1)}
                        disabled={currentEpisodesWatched <= 0}
                        className="bg-[#101424] hover:bg-[#181e36] disabled:opacity-40 border border-white/10 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        -1 Ep
                      </button>
                      <button
                        onClick={() => handleUpdateEpisodes(currentSeasonNum, Math.min(currentSeason.episode_count || 1, currentEpisodesWatched + 1), currentSeason.episode_count || 1)}
                        disabled={currentEpisodesWatched >= (currentSeason.episode_count || 1)}
                        className="bg-[#6332f6] hover:bg-[#5223e0] disabled:opacity-40 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-purple-600/30"
                      >
                        +1 Ep
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Overall Show Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
                  <span>Overall Progress</span>
                  <span className="text-violet-400 font-bold">
                    {totalEpisodes > 0 ? Math.round((myTotalEpisodesWatched / totalEpisodes) * 100) : 0}% ({myTotalEpisodesWatched} / {totalEpisodes} eps)
                  </span>
                </div>
                <div className="w-full bg-[#101424] rounded-full h-2.5 overflow-hidden border border-white/5">
                  <div 
                    className="bg-gradient-to-r from-violet-600 to-indigo-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${totalEpisodes > 0 ? Math.min(100, Math.round((myTotalEpisodesWatched / totalEpisodes) * 100)) : 0}%` }}
                  />
                </div>
              </div>

              {/* Season Pills */}
              <div className="flex flex-wrap gap-2">
                {seasons.map(s => {
                  const isWatched = seasonsWatched.includes(s.season_number)
                  const isCurrent = s.season_number === currentSeasonNum
                  return (
                    <button
                      key={s.season_number}
                      onClick={() => toggleSeasonWatched(s.season_number)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                        isWatched
                          ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                          : isCurrent
                          ? 'bg-violet-950/60 border-violet-500/40 text-violet-300'
                          : 'bg-[#101424] border-white/5 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {isWatched && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      {s.name || `Season ${s.season_number}`}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Cast */}
          <CastCarousel cast={cast} />


          {/* Franchise Collection Section */}
          {collectionDetails && sortedParts.length > 0 && (
            <div className="mt-4 border-t border-slate-900 pt-6">
              <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-400" />
                Part of the {collectionDetails.name}
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Explore the entire franchise, ordered by release date.
              </p>
              
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none">
                {sortedParts.map(part => {
                  const releaseDate = part.release_date || ''
                  const partYear = releaseDate ? releaseDate.split('-')[0] : 'TBA'
                  const isCurrent = part.id.toString() === item.tmdb_id
                  const watchlistInstance = userWatchedPart(part.id)
                  
                  return (
                    <div 
                      key={part.id} 
                      onClick={() => {
                        if (isCurrent) return
                        if (watchlistInstance) {
                          navigate(`/media/${watchlistInstance.id}`)
                        } else {
                          navigate(`/explore/movie/${part.id}`)
                        }
                      }}
                      className={`flex-shrink-0 w-32 bg-[#0f1422] border rounded-lg overflow-hidden shadow-lg flex flex-col group ${
                        isCurrent 
                          ? 'border-violet-500 ring-1 ring-violet-500/20 opacity-95'
                          : 'border-slate-850 hover:border-slate-700/80 cursor-pointer'
                      }`}
                    >
                      <div className="aspect-[2/3] w-full bg-slate-950 relative overflow-hidden">
                        {part.poster_path ? (
                          <img 
                            src={`https://image.tmdb.org/t/p/w185${part.poster_path}`} 
                            alt={part.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600 font-bold text-4xl rounded-none">
                            {part.title.charAt(0)}
                          </div>
                        )}
                        
                        {isCurrent && (
                          <div className="absolute top-2 left-2 bg-violet-600/90 backdrop-blur text-white text-[9px] font-black px-1.5 py-0.5 rounded tracking-wider shadow-md">
                            CURRENT
                          </div>
                        )}

                        {watchlistInstance && (
                          <div className="absolute top-2 right-2 bg-emerald-500/95 backdrop-blur text-white p-1 rounded shadow-md border border-emerald-400/20" title={getStatusLabel(watchlistInstance.status)}>
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      
                      <div className="p-2.5 flex flex-col flex-grow justify-between min-h-[64px] bg-gradient-to-b from-[#0f1422] to-[#070b13]">
                        <span className={`text-[10px] font-bold line-clamp-2 w-full ${isCurrent ? 'text-violet-400' : 'text-slate-200'}`} title={part.title}>
                          {part.title}
                        </span>
                        <div className="flex items-center justify-between mt-1 text-[9px] text-slate-500 font-semibold">
                          <span>{partYear}</span>
                          {watchlistInstance && (
                            <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-wide">
                              {watchlistInstance.status === 'completed' ? 'Watched' : watchlistInstance.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* My Review & Notes */}
          {!item.isExplore && (
            <div className="mt-4">
              <h3 className="text-lg font-bold text-white mb-3">My Notes & Review</h3>
              <div className="bg-[#0f1422] border border-slate-855 rounded-2xl p-4 min-h-[100px] shadow-inner">
                {item.review ? (
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap text-sm">{item.review}</p>
                ) : (
                  <p className="text-slate-500 italic text-xs">No notes or review written for this item yet. Use the Quick Edit button in your watchlist to add some!</p>
                )}
              </div>
              
              <div className="mt-3 text-[10px] text-slate-500 flex flex-col gap-1">
                <span>Added to list: {new Date(item.created_at).toLocaleDateString()}</span>
                {item.watched_at && <span>Last Activity: {new Date(item.watched_at).toLocaleDateString()}</span>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Trailer Modal Overlay */}
      {isTrailerOpen && trailer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm animate-fade-in p-4 sm:p-8">
          <div className="relative w-full max-w-6xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10">
            <button 
              onClick={() => setIsTrailerOpen(false)}
              className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10 flex items-center gap-2 bg-black/50 hover:bg-white/20 text-white px-4 py-2 rounded-full font-bold transition-colors cursor-pointer backdrop-blur-md border border-white/10 shadow-lg"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Details
            </button>
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1`}
              title="Trailer"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}

      {/* Player Modal Overlay */}
      {isPlayerOpen && tmdbId && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm animate-fade-in p-4 sm:p-8">
          <div className="w-full max-w-6xl flex items-center justify-between mb-4 flex-shrink-0 gap-4">
            {/* Sources Pills at the top */}
            <div className="flex items-center gap-2 overflow-x-auto py-1 pr-4">
              {movieSources.map(source => (
                <button
                  key={source.id}
                  onClick={() => setActiveSource(source.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer whitespace-nowrap ${
                    activeSource === source.id
                      ? 'bg-violet-600 border-violet-500 text-white shadow-md shadow-violet-500/20'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {source.name}
                </button>
              ))}
            </div>

            <button 
              onClick={() => setIsPlayerOpen(false)}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-855 text-white px-4 py-2 rounded-full font-bold transition-colors cursor-pointer border border-slate-800 shadow-lg text-xs flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              Close Player
            </button>
          </div>

          <div className="relative w-full max-w-6xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex-grow max-h-[75vh]">
            {currentSourceUrl ? (
              <iframe
                className="w-full h-full"
                src={currentSourceUrl}
                title={item?.type === 'movie' ? 'Movie Player' : 'TV Show Player'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-550 text-sm">
                No active source selected.
              </div>
            )}
          </div>

          {/* TV Show controls below the player */}
          {item?.type === 'tv' && (
            <div className="w-full max-w-6xl mt-4 flex-shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              {/* Dropdowns for Season and Episode */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Season</label>
                  <select
                    value={selectedSeason}
                    onChange={(e) => {
                      const sNum = parseInt(e.target.value, 10);
                      setSelectedSeason(sNum);
                      setSelectedEpisode(1);
                    }}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-200 focus:outline-none focus:border-violet-500 transition-colors"
                  >
                    {seasonsList.map(s => (
                      <option key={s.season_number} value={s.season_number}>
                        {s.name || `Season ${s.season_number}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Episode</label>
                  <select
                    value={selectedEpisode}
                    onChange={(e) => setSelectedEpisode(parseInt(e.target.value, 10))}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-200 focus:outline-none focus:border-violet-500 transition-colors"
                  >
                    {Array.from({ length: currentSeasonMaxEpisodes }, (_, i) => i + 1).map(ep => (
                      <option key={ep} value={ep}>
                        Episode {ep}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Prev / Next Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrevEpisode}
                  disabled={selectedSeason === 1 && selectedEpisode === 1}
                  className="flex items-center gap-1.5 bg-slate-950 border border-slate-850 hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-350 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Prev Episode
                </button>
                <button
                  onClick={handleNextEpisode}
                  disabled={
                    selectedSeason === maxSeasonsNum && 
                    selectedEpisode === maxEpisodesInLastSeason
                  }
                  className="flex items-center gap-1.5 bg-gradient-to-r from-violet-650 to-indigo-650 hover:from-violet-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Next Episode
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Download Modal Overlay */}
      {isDownloadOpen && tmdbId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm animate-fade-in p-4">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div>
                <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                  <Download className="w-5 h-5 text-violet-400" />
                  Download Sources
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {item?.type === 'tv' 
                    ? `Season ${selectedSeason}, Episode ${selectedEpisode}` 
                    : 'Choose a provider link to view download options'}
                </p>
              </div>
              <button 
                onClick={() => setIsDownloadOpen(false)}
                className="flex items-center gap-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white px-3 py-1.5 rounded-full font-bold transition-colors cursor-pointer border border-slate-850 shadow-md text-xs"
              >
                Close
              </button>
            </div>

            {/* If TV show, allow season/episode controls right inside the download modal */}
            {item?.type === 'tv' && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950 border border-slate-850 p-4 rounded-2xl mb-6">
                {/* Dropdowns */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Season</label>
                    <select
                      value={selectedSeason}
                      onChange={(e) => {
                        const sNum = parseInt(e.target.value, 10);
                        setSelectedSeason(sNum);
                        setSelectedEpisode(1);
                      }}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs font-semibold text-slate-200 focus:outline-none focus:border-violet-500 transition-colors"
                    >
                      {seasonsList.map(s => (
                        <option key={s.season_number} value={s.season_number}>
                          {s.name || `Season ${s.season_number}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Episode</label>
                    <select
                      value={selectedEpisode}
                      onChange={(e) => setSelectedEpisode(parseInt(e.target.value, 10))}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs font-semibold text-slate-200 focus:outline-none focus:border-violet-500 transition-colors"
                    >
                      {Array.from({ length: currentSeasonMaxEpisodes }, (_, i) => i + 1).map(ep => (
                        <option key={ep} value={ep}>
                          Ep {ep}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevEpisode}
                    disabled={selectedSeason === 1 && selectedEpisode === 1}
                    className="flex items-center gap-1 bg-slate-900 border border-slate-800 hover:border-slate-750 disabled:opacity-40 disabled:cursor-not-allowed text-slate-400 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-3 h-3" />
                    Prev
                  </button>
                  <button
                    onClick={handleNextEpisode}
                    disabled={
                      selectedSeason === maxSeasonsNum && 
                      selectedEpisode === maxEpisodesInLastSeason
                    }
                    className="flex items-center gap-1 bg-gradient-to-r from-violet-650 to-indigo-650 hover:from-violet-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer"
                  >
                    Next
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3 overflow-y-auto pr-1 flex-1">
              {resolvedDownloadSources.map((source) => (
                <a
                  key={source.id}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/60 border border-slate-850 hover:border-violet-500/40 hover:bg-violet-950/10 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Download className="w-4 h-4 text-violet-400" />
                    <span className="font-bold text-white text-xs truncate">{source.name}</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-violet-400" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
