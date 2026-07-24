import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Star, Calendar, Clock, Film, Tv, Gamepad, Trash2, ExternalLink, Play, Check, ChevronDown, ChevronUp, Sparkles, ChevronLeft, ChevronRight, Download, Plus, CheckSquare, Eye, Tag, X, Bookmark, Edit, Award, DollarSign } from 'lucide-react'
import { getPosterUrl, fetchTMDB, isTMDBConfigured } from '../lib/tmdb'
import { fetchOMDBData } from '../lib/omdb'

const getCollectionStatusLabelAndStyle = (status) => {
  switch (status) {
    case 'completed':
      return {
        label: 'Watched',
        containerStyle: 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300',
        iconColor: 'text-emerald-400'
      }
    case 'watching':
      return {
        label: 'Watching',
        containerStyle: 'bg-violet-950/90 border-violet-500/30 text-violet-300',
        iconColor: 'text-violet-400'
      }
    case 'planned':
      return {
        label: 'Plan to Watch',
        containerStyle: 'bg-sky-950/90 border-sky-500/30 text-sky-300',
        iconColor: 'text-sky-400'
      }
    case 'onhold':
    case 'paused':
      return {
        label: 'On Hold',
        containerStyle: 'bg-amber-950/90 border-amber-500/30 text-amber-300',
        iconColor: 'text-amber-400'
      }
    case 'dropped':
      return {
        label: 'Dropped',
        containerStyle: 'bg-rose-950/90 border-rose-500/30 text-rose-300',
        iconColor: 'text-rose-400'
      }
    case 'backlog':
      return {
        label: 'Backlog',
        containerStyle: 'bg-slate-900/90 border-slate-700/30 text-slate-300',
        iconColor: 'text-slate-400'
      }
    case 'pending':
      return {
        label: 'Pending',
        containerStyle: 'bg-indigo-950/90 border-indigo-500/30 text-indigo-300',
        iconColor: 'text-indigo-400'
      }
    default:
      return {
        label: 'In Library',
        containerStyle: 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300',
        iconColor: 'text-emerald-400'
      }
  }
}

const CastCarousel = ({ cast, navigate }) => {
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
    <div className="bg-[#0a0a0a] rounded-2xl p-5 shadow-2xl relative group/cast mb-6">
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
                className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${canScrollLeft
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
                className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${canScrollRight
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
              onClick={() => navigate(`/explore_tmdb?type=person&id=${actor.id}&name=${encodeURIComponent(actor.name)}`)}
              className="bg-[#101424] border border-slate-800 hover:border-violet-500/50 rounded-xl overflow-hidden flex flex-col shadow-md group/actor cursor-pointer transition-all duration-300"
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
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0a0a0a] to-transparent z-10" />
          )}

          {/* Right Side Fade Overlay */}
          {canScrollRight && (
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0a0a0a] to-transparent z-10" />
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
                onClick={() => navigate(`/explore_tmdb?type=person&id=${actor.id}&name=${encodeURIComponent(actor.name)}`)}
                className="w-28 sm:w-36 flex-shrink-0 bg-[#101424]  hover:border-violet-500/50 rounded-xl overflow-hidden flex flex-col shadow-md transition-all duration-300 hover:-translate-y-0.5 group/actor cursor-pointer"
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
            className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all cursor-pointer z-10 ${isWatched
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
  const [addReview, setAddReview] = useState('')
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [imageModalType, setImageModalType] = useState('posters')

  let item = items.find(i => i.id === id)
  if (item && item.status === 'list_only') {
    item = { ...item, isExplore: true }
  }
  if (!item && location.state?.addedItem && location.state.addedItem.id === id) {
    const stateItem = location.state.addedItem
    item = stateItem.status === 'list_only' ? { ...stateItem, isExplore: true } : stateItem
  }

  // If it's an explore route, we construct a stub item
  if (!item && tmdb_id && type) {
    // Check if it's actually in our items anyway
    const existing = items.find(i => i.tmdb_id && i.tmdb_id.toString() === tmdb_id.toString() && i.type === type && i.status !== 'list_only')
    if (existing) {
      item = existing
    } else {
      item = { tmdb_id, type, isExplore: true }
    }
  }

  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(false)
  const [omdbData, setOmdbData] = useState(null)
  const [loadingOmdb, setLoadingOmdb] = useState(false)
  const [currentSeasonDetails, setCurrentSeasonDetails] = useState(null)
  const [isTrailerOpen, setIsTrailerOpen] = useState(false)
  const [isPlayerOpen, setIsPlayerOpen] = useState(false)
  const [isDownloadOpen, setIsDownloadOpen] = useState(false)
  const [activeSource, setActiveSource] = useState('')
  const [collectionDetails, setCollectionDetails] = useState(null)
  const [loadingCollection, setLoadingCollection] = useState(false)
  const [recommendations, setRecommendations] = useState([])
  const [similar, setSimilar] = useState([])
  const recsScrollRef = useRef(null)
  const similarScrollRef = useRef(null)
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
      setRecommendations([])
      setSimilar([])
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
    const loadRecsAndSimilar = async () => {
      if (item && item.tmdb_id && item.type !== 'game') {
        try {
          const [recsData, similarData] = await Promise.all([
            fetchTMDB(`/${item.type}/${item.tmdb_id}/recommendations`),
            fetchTMDB(`/${item.type}/${item.tmdb_id}/similar`)
          ])
          setRecommendations(recsData?.results || [])
          setSimilar(similarData?.results || [])
        } catch (error) {
          console.error("Failed to fetch recommendations/similar items:", error)
        }
      } else {
        setRecommendations([])
        setSimilar([])
      }
    }
    loadRecsAndSimilar()
  }, [item?.tmdb_id, item?.type])

  useEffect(() => {
    const loadDetails = async () => {
      if (item && item.tmdb_id && item.type !== 'game' && (!details || details.id?.toString() !== item.tmdb_id.toString())) {
        setLoading(true)
        try {
          // Append credits, release_dates (movies), content_ratings (tv), watch/providers, videos, external_ids, images
          const data = await fetchTMDB(`/${item.type}/${item.tmdb_id}`, {
            append_to_response: 'credits,release_dates,content_ratings,watch/providers,videos,external_ids,images'
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
    const loadOmdb = async () => {
      const targetImdbId = details?.external_ids?.imdb_id || details?.imdb_id
      const targetTitle = item?.title || details?.title || details?.name
      const targetYear = item?.release_year || (details?.release_date || details?.first_air_date || '').split('-')[0]
      const targetType = item?.type || type

      if (targetImdbId || targetTitle) {
        setLoadingOmdb(true)
        const omdbRes = await fetchOMDBData({
          imdbId: targetImdbId,
          title: targetTitle,
          year: targetYear,
          type: targetType
        })
        setOmdbData(omdbRes)
        setLoadingOmdb(false)
      }
    }

    if (details || item) {
      loadOmdb()
    }
  }, [details?.external_ids?.imdb_id, details?.imdb_id, details?.title, details?.name, item?.title, item?.release_year, item?.type, type])

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
        } catch (e) {
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
    const itemType = item?.type || type

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
      type: itemType,
      tmdb_id: tmdbId ? tmdbId.toString() : '',
      poster_path: posterPath,
      release_year: releaseYearStr,
      status: addStatus,
      review: addReview.trim(),
      country: getCountryCode(),
      original_language: details?.original_language || 'en',
      vote_average: details?.vote_average || 0,
      popularity: details?.popularity || 0,
      ...(itemType === 'tv' && {
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
  const directorObj = crew.find(member => member.job === 'Director') || details?.created_by?.[0]
  const directorName = directorObj ? directorObj.name : 'Unknown'
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
    return items.find(i => i.type === 'movie' && i.tmdb_id === partId.toString() && i.status !== 'list_only')
  }

  const sortedParts = collectionDetails?.parts
    ? [...collectionDetails.parts].sort((a, b) => {
      const dateA = a.release_date || '9999-12-31'
      const dateB = b.release_date || '9999-12-31'
      return dateA.localeCompare(dateB)
    })
    : []

  const collectionScrollRef = useRef(null)
  const [canScrollLeftCollection, setCanScrollLeftCollection] = useState(false)
  const [canScrollRightCollection, setCanScrollRightCollection] = useState(true)

  const checkCollectionScroll = () => {
    if (collectionScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = collectionScrollRef.current
      setCanScrollLeftCollection(scrollLeft > 10)
      setCanScrollRightCollection(scrollLeft + clientWidth < scrollWidth - 10)
    }
  }

  useEffect(() => {
    checkCollectionScroll()
    const el = collectionScrollRef.current
    if (el) {
      el.addEventListener('scroll', checkCollectionScroll)
      window.addEventListener('resize', checkCollectionScroll)
    }
    return () => {
      if (el) el.removeEventListener('scroll', checkCollectionScroll)
      window.removeEventListener('resize', checkCollectionScroll)
    }
  }, [collectionDetails, sortedParts])

  const scrollCollection = (direction) => {
    if (collectionScrollRef.current) {
      const { scrollLeft, clientWidth } = collectionScrollRef.current
      const amount = clientWidth * 0.75
      collectionScrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - amount : scrollLeft + amount,
        behavior: 'smooth'
      })
    }
  }

  const scrollRow = (ref, direction) => {
    if (ref.current) {
      const { scrollLeft, clientWidth } = ref.current
      const amount = clientWidth * 0.75
      ref.current.scrollTo({
        left: direction === 'left' ? scrollLeft - amount : scrollLeft + amount,
        behavior: 'smooth'
      })
    }
  }

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
  }, [])

  const formatUSD = (num) => {
    if (!num || num <= 0) return null
    if (num >= 1000000000) {
      return `$${parseFloat((num / 1000000000).toFixed(2))} Billion`
    }
    if (num >= 1000000) {
      return `$${parseFloat((num / 1000000).toFixed(2))} Million`
    }
    return `$${num.toLocaleString()}`
  }

  const budgetRaw = formatUSD(details?.budget)
  const revenueRaw = formatUSD(details?.revenue)

  const budgetINR = (() => {
    if (!details?.budget) return null
    const crores = (details.budget * 95) / 10000000
    return `${crores.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} Crores`
  })()

  const revenueINR = (() => {
    if (!details?.revenue) return null
    const crores = (details.revenue * 95) / 10000000
    return `${crores.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} Crores`
  })()

  // TV Seasons from TMDB details
  const seasons = details?.seasons?.filter(s => s.season_number > 0) || []  // Data Array Config for RATINGS & SCORES
  const ratingCards = [
    {
      id: 'imdb',
      label: 'IMDb Rating',
      sublabel: omdbData?.imdbVotes ? `${omdbData.imdbVotes} votes` : 'IMDb Rating',
      score: omdbData?.imdbRating || (details?.vote_average ? details.vote_average.toFixed(1) : 'N/A'),
      maxScore: '/10',
      url: (imdbId || omdbData?.imdbID)
        ? `https://www.imdb.com/title/${imdbId || omdbData?.imdbID}`
        : `https://www.imdb.com/find/?q=${encodeURIComponent(title)}`,
      borderClass: 'border-[#f5c518]/25 hover:border-[#f5c518]/60',
      badge: (
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/6/69/IMDB_Logo_2016.svg"
          alt="IMDb"
          className="w-9 h-9 object-contain flex-shrink-0"
        />
      )
    },
    {
      id: 'tomatometer',
      label: 'Tomatometer',
      sublabel: 'Tomatometer',
      score: omdbData?.rottenTomatoes || 'N/A',
      maxScore: null,
      url: `https://www.rottentomatoes.com/search?search=${encodeURIComponent(title)}`,
      borderClass: 'border-rose-500/20 hover:border-rose-500/50',
      badge: (
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Rotten_Tomatoes.svg/250px-Rotten_Tomatoes.svg.png"
          alt="Tomatometer"
          className="w-9 h-9 object-contain flex-shrink-0"
        />
      )
    },
    {
      id: 'audience',
      label: 'Audience Score',
      sublabel: 'Audience Score',
      score: details?.vote_average ? `${Math.round(details.vote_average * 10)}%` : 'N/A',
      maxScore: null,
      url: tmdbId ? `https://www.themoviedb.org/${item.type || 'movie'}/${tmdbId}` : '#',
      borderClass: 'border-amber-500/20 hover:border-amber-500/50',
      badge: (
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Rotten_Tomatoes_positive_audience.svg/960px-Rotten_Tomatoes_positive_audience.svg.png"
          alt="Audience Score"
          className="w-9 h-9 object-contain flex-shrink-0"
        />
      )
    },
    {
      id: 'metacritic',
      label: 'Metascore',
      sublabel: 'Metascore',
      score: omdbData?.metascore || 'N/A',
      maxScore: omdbData?.metascore ? '/100' : null,
      url: `https://www.metacritic.com/search/${encodeURIComponent(title)}`,
      borderClass: 'border-emerald-500/20 hover:border-emerald-500/50',
      badge: (
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/f/fe/Metascore.png"
          alt="Metacritic"
          className="w-9 h-9 object-contain flex-shrink-0"
        />
      )
    }
  ]

  // Data Array Config for EXTERNAL LINKS
  const externalLinksData = [
    {
      id: 'youtube',
      label: 'YouTube Trailer',
      show: true,
      url: trailer?.key
        ? `https://www.youtube.com/watch?v=${trailer.key}`
        : `https://www.youtube.com/results?search_query=${encodeURIComponent(`${title} official trailer`)}`,
      borderClass: 'border-red-500/30 hover:border-red-500',
      badge: (
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/e/ef/Youtube_logo.png"
          alt="YouTube"
          className="w-6 h-5 object-contain flex-shrink-0"
        />
      )
    },
    {
      id: 'imdb',
      label: 'IMDb Page',
      show: !!(imdbId || omdbData?.imdbID),
      url: `https://www.imdb.com/title/${imdbId || omdbData?.imdbID}`,
      borderClass: 'border-[#f5c518]/30 hover:border-[#f5c518]',
      badge: (
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/IMDB_Logo_2016.svg/960px-IMDB_Logo_2016.svg.png"
          alt="IMDb"
          className="w-6 h-5 object-contain flex-shrink-0"
        />
      )
    },
    {
      id: 'tmdb',
      label: 'TMDB Page',
      show: !!tmdbId,
      url: `https://www.themoviedb.org/${item.type || 'movie'}/${tmdbId}`,
      borderClass: 'border-sky-500/30 hover:border-sky-400',
      badge: (
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Tmdb.new.logo.svg/960px-Tmdb.new.logo.svg.png"
          alt="TMDB"
          className="w-6 h-5 object-contain flex-shrink-0"
        />
      )
    },
    {
      id: 'letterboxd',
      label: 'Letterboxd',
      show: true,
      url: (imdbId || omdbData?.imdbID)
        ? `https://letterboxd.com/imdb/${imdbId || omdbData?.imdbID}`
        : `https://letterboxd.com/search/${encodeURIComponent(title)}/`,
      borderClass: 'border-orange-500/30 hover:border-orange-400',
      badge: (
        <img
          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQRpFZIm6Gp13p9WQ9TfharzuN7HS4J4Bo_dEs5Hp5uGg&s=10"
          alt="Letterboxd"
          className="w-6 h-5 object-contain flex-shrink-0"
        />
      )
    },
    {
      id: 'website',
      label: 'Official Website',
      show: !!homepage,
      url: homepage || '#',
      borderClass: 'border-violet-500/30 hover:border-violet-400',
      badge: (
        <img
          src="https://png.pngtree.com/png-vector/20190319/ourmid/pngtree-vector-web-icon-png-image_847779.jpg"
          alt="Website"
          className="w-6 h-5 object-contain flex-shrink-0"
        />
      )
    },
    {
      id: 'wikidata',
      label: 'Wikidata',
      show: !!wikipediaUrl,
      url: wikipediaUrl || '#',
      borderClass: 'border-slate-700 hover:border-slate-500',
      badge: (
        <img
          src="https://upload.wikimedia.org/wikipedia/en/thumb/8/80/Wikipedia-logo-v2.svg/250px-Wikipedia-logo-v2.svg.png"
          alt="Wikidata"
          className="w-6 h-5 object-contain flex-shrink-0"
        />
      )
    }
  ]
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
    <div className="animate-fade-in pb-16">
      {/* Hero Header Banner */}
      <div className="w-screen relative left-1/2 -translate-x-1/2 overflow-hidden border-0 bg-black shadow-2xl mb-8">
        {/* Backdrop background image aligned right with smooth left-to-right & bottom fade gradients */}
        {backdropUrl && (
          <div className="absolute right-0 top-0 bottom-0 w-full md:w-3/4 lg:w-2/3 h-full z-0 overflow-hidden pointer-events-none">
            <img
              src={backdropUrl}
              alt="Backdrop"
              className="w-full h-full object-cover object-center opacity-100"
            />
            {/* Left to Right Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent z-10" />
            {/* Bottom Fade Overlay */}
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black via-black/60 to-transparent z-10" />
          </div>
        )}

        {/* Centered content wrapper */}
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 relative z-10">
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

          {/* Main Hero Card Content */}
          <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-start pb-6 sm:pb-8">
          {/* Poster */}
          <div className="w-36 sm:w-44 md:w-52 aspect-[2/3] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex-shrink-0 bg-slate-950">
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
                  <span className="text-xs font-bold text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg">
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
                  onClick={() => {
                    setAddStatus(item.status || 'planned')
                    setAddReview(item.review || '')
                    setIsStatusModalOpen(true)
                  }}
                  className={`font-bold text-sm px-5 py-3 rounded-xl flex items-center gap-2 transition-all cursor-pointer border ${item.isExplore
                    ? 'bg-[#101424] hover:bg-[#181e36] text-slate-200 border-slate-800'
                    : 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border-emerald-500/40'
                    }`}
                >
                  {item.isExplore ? (
                    <>
                      <Plus className="w-4 h-4 text-violet-400" />
                      <span>Add to List</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Saved</span>
                    </>
                  )}
                </button>

                {(item.type === 'movie' || item.type === 'tv') && resolvedDownloadSources.length > 0 && (
                  <button
                    onClick={() => setIsDownloadOpen(true)}
                    className="bg-[#101424] hover:bg-[#181e36] text-slate-200 border border-slate-800 p-3 rounded-xl flex items-center justify-center transition-all cursor-pointer"
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
    </div>

      {/* Main 2-Column Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ========================================================================= */}
        {/* LEFT SIDEBAR COLUMN (lg:col-span-4) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* DETAILS Box */}
          <div className="bg-[#0a0a0a] border border-slate-800/80 rounded-2xl p-5 shadow-2xl">
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
                {directorObj ? (
                  <span
                    onClick={() => navigate(`/explore_tmdb?type=person&id=${directorObj.id}&name=${encodeURIComponent(directorObj.name)}`)}
                    className="text-violet-400 font-bold hover:underline cursor-pointer transition-colors max-w-[160px] truncate text-right"
                  >
                    {directorName}
                  </span>
                ) : (
                  <span className="text-white font-bold truncate max-w-[160px] text-right">{directorName}</span>
                )}
              </div>
              {details?.production_companies && details.production_companies.length > 0 && (
                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-400 font-medium mt-0.5">Studio</span>
                  <div className="flex flex-col items-end gap-1.5 max-w-[160px]">
                    {details.production_companies.slice(0, 2).map(studio => (
                      <span
                        key={studio.id}
                        onClick={() => navigate(`/explore_tmdb?type=company&id=${studio.id}&name=${encodeURIComponent(studio.name)}`)}
                        className="text-violet-400 font-bold hover:underline cursor-pointer transition-colors text-right leading-tight"
                      >
                        {studio.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
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
            </div>
          </div>

          {/* POSTER & BANNER Buttons */}
          {(item?.type === 'movie' || item?.type === 'tv') && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setImageModalType('posters')
                  setShowImageModal(true)
                }}
                className="bg-[#0a0a0a] border border-slate-800/80 hover:border-violet-500/30 py-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition-all shadow-md cursor-pointer"
              >
                <Film className="w-4 h-4 text-violet-400" />
                Posters
              </button>
              <button
                onClick={() => {
                  setImageModalType('backdrops')
                  setShowImageModal(true)
                }}
                className="bg-[#0a0a0a] border border-slate-800/80 hover:border-violet-500/30 py-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition-all shadow-md cursor-pointer"
              >
                <Tag className="w-4 h-4 text-violet-400" />
                Banners
              </button>
            </div>
          )}

          {/* RATINGS & SCORES Box */}
          <div className="bg-[#0a0a0a] border border-slate-800/80 rounded-2xl p-5 shadow-2xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span>RATINGS & SCORES</span>
                {loadingOmdb && <span className="text-[10px] text-violet-400 font-normal animate-pulse">(Syncing OMDb...)</span>}
              </span>
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {ratingCards.map((card) => (
                <a
                  key={card.id}
                  href={card.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`bg-[#101424] border p-3 rounded-xl flex items-center gap-3 transition-all cursor-pointer group ${card.borderClass}`}
                >
                  {card.badge}
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-baseline gap-0.5 leading-tight">
                      <span className="text-base font-black text-white">{card.score}</span>
                      {card.maxScore && <span className="text-[10px] font-bold text-slate-400">{card.maxScore}</span>}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                      {card.sublabel}
                    </span>
                  </div>
                </a>
              ))}
            </div>

            {/* Extra OMDb & TMDB Info (Awards, Budget & Revenue) */}
            {((omdbData && omdbData.awards) || budgetRaw || revenueRaw) && (
              <div className="mt-3.5 pt-3 border-t border-slate-800 flex flex-col gap-1.5 text-[11px]">
                {omdbData?.awards && (
                  <div className="flex items-center gap-1.5 text-amber-300/90 font-medium truncate" title={omdbData.awards}>
                    <Award className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span className="truncate">{omdbData.awards}</span>
                  </div>
                )}
                {budgetRaw && (
                  <div className="flex items-center gap-1.5 text-emerald-300/90 font-medium">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>
                      Budget: {budgetRaw} {budgetINR && <span className="text-[#a78bfa]">(INR Rs. {budgetINR})</span>}
                    </span>
                  </div>
                )}
                {revenueRaw && (
                  <div className="flex items-center gap-1.5 text-emerald-300/90 font-medium">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>
                      Revenue: {revenueRaw} {revenueINR && <span className="text-[#a78bfa]">(INR Rs. {revenueINR})</span>}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* WHERE TO WATCH Box */}
          <div className="bg-[#0a0a0a] border border-slate-800 rounded-2xl p-5 shadow-2xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Streaming Platforms
            </h3>
            {watchProviders.length > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {(showAllProviders ? watchProviders : watchProviders.slice(0, 6)).map(provider => (
                    <a
                      key={provider.provider_id}
                      href={getProviderUrl(provider.provider_name, providerData?.link, title)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 py-2 px-3 rounded-xl bg-[#101424] border border-slate-800 hover:border-violet-500/30 transition-all group/prov min-w-0"
                    >
                      <img
                        src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                        alt={provider.provider_name}
                        className="w-8 h-8 rounded-lg flex-shrink-0"
                      />
                      <span className="text-xs font-bold text-white group-hover/prov:text-violet-300 truncate">
                        {provider.provider_name}
                      </span>
                    </a>
                  ))}
                </div>
                {watchProviders.length > 6 && (
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
          <div className="bg-[#0a0a0a] border border-slate-800 rounded-2xl p-5 shadow-2xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              EXTERNAL LINKS
            </h3>
            <div className="flex flex-wrap gap-2">
              {externalLinksData.filter(link => link.show).map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 bg-[#101424] hover:bg-[#181e36] border text-slate-200 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm group cursor-pointer ${link.borderClass}`}
                >
                  {link.badge}
                  <span>{link.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT MAIN COLUMN (lg:col-span-8) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* TV Show Progress & Episode Tracker Section */}
          {(type === 'tv' || item.type === 'tv') && seasons.length > 0 && (
            <div className="bg-[#0a0a0a] border border-slate-800 rounded-2xl p-5 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Tv className="w-4 h-4 text-violet-400" />
                    Season & Episode Tracker
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Season {currentSeasonNum} · {currentEpisodesWatched} of {currentSeason?.episode_count || 0} episodes watched
                  </p>
                </div>

                {/* Quick Increment */}
                {!item.isExplore && currentSeason && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleUpdateEpisodes(currentSeasonNum, Math.max(0, currentEpisodesWatched - 1), currentSeason.episode_count || 1)}
                      disabled={currentEpisodesWatched <= 0}
                      className="bg-[#101424] hover:bg-[#181e36] disabled:opacity-40 border border-slate-800 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
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

              {/* Overall Show Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
                  <span>Overall Progress</span>
                  <span className="text-violet-400 font-bold">
                    {totalEpisodes > 0 ? Math.round((myTotalEpisodesWatched / totalEpisodes) * 100) : 0}% ({myTotalEpisodesWatched} / {totalEpisodes} eps)
                  </span>
                </div>
                <div className="w-full bg-[#101424] rounded-full h-2.5 overflow-hidden border border-slate-800">
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
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${isWatched
                        ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                        : isCurrent
                          ? 'bg-violet-950/60 border-violet-500/40 text-violet-300'
                          : 'bg-[#101424] border-slate-800 text-slate-400 hover:text-slate-200'
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
          <CastCarousel cast={cast} navigate={navigate} />


          {/* Franchise Collection Section */}
          {collectionDetails && sortedParts.length > 0 && (
            <div className="mt-4 border-t border-slate-900 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-violet-400" />
                    Part of the {collectionDetails.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Explore the entire franchise, ordered by release date.
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => scrollCollection('left')}
                    disabled={!canScrollLeftCollection}
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                      canScrollLeftCollection
                        ? 'bg-[#101424] border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                        : 'bg-[#090c15] border-slate-900 text-slate-700 cursor-not-allowed opacity-30'
                    }`}
                    title="Scroll Left"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollCollection('right')}
                    disabled={!canScrollRightCollection}
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                      canScrollRightCollection
                        ? 'bg-[#101424] border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                        : 'bg-[#090c15] border-slate-900 text-slate-700 cursor-not-allowed opacity-30'
                    }`}
                    title="Scroll Right"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="relative">
                {/* Left Side Fade Overlay */}
                {canScrollLeftCollection && (
                  <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-950 to-transparent z-10" />
                )}

                {/* Right Side Fade Overlay */}
                {canScrollRightCollection && (
                  <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-950 to-transparent z-10" />
                )}

                {/* Horizontal Scroll Row */}
                <div
                  ref={collectionScrollRef}
                  className="flex gap-4 overflow-x-auto pb-4 scrollbar-none scroll-smooth"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
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
                        className={`flex-shrink-0 w-32 bg-[#0f1422] border rounded-lg overflow-hidden shadow-lg group ${isCurrent
                          ? 'border-violet-500 ring-1 ring-violet-500/20 opacity-95'
                          : 'border-slate-800 hover:border-slate-700/80 cursor-pointer'
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
                            <div className={`absolute inset-x-0 bottom-0 backdrop-blur-md border-t text-[10px] font-bold py-1 px-1.5 flex items-center justify-center gap-1 ${getCollectionStatusLabelAndStyle(watchlistInstance.status).containerStyle}`}>
                              <Check className={`w-3.5 h-3.5 ${getCollectionStatusLabelAndStyle(watchlistInstance.status).iconColor}`} />
                              <span>{getCollectionStatusLabelAndStyle(watchlistInstance.status).label}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Recommended Row */}
          {recommendations.length > 0 && (
            <div className="mt-6 border-t border-slate-900 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-violet-400" />
                    Recommended For You
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Explore curated recommendations based on this title.
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => scrollRow(recsScrollRef, 'left')}
                    className="w-7 h-7 rounded-lg border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 bg-[#101424] flex items-center justify-center transition-all cursor-pointer"
                    title="Scroll Left"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollRow(recsScrollRef, 'right')}
                    className="w-7 h-7 rounded-lg border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 bg-[#101424] flex items-center justify-center transition-all cursor-pointer"
                    title="Scroll Right"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="relative">
                <div
                  ref={recsScrollRef}
                  className="flex gap-4 overflow-x-auto pb-4 scrollbar-none scroll-smooth"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {recommendations.slice(0, 20).map(rec => {
                    const releaseDate = rec.release_date || rec.first_air_date || ''
                    const year = releaseDate ? releaseDate.split('-')[0] : 'TBA'
                    const watchlistInstance = items.find(i => i.tmdb_id && i.tmdb_id.toString() === rec.id.toString() && i.type === (item.type || type) && i.status !== 'list_only')

                    return (
                      <div
                        key={rec.id}
                        onClick={() => {
                          if (watchlistInstance) {
                            navigate(`/media/${watchlistInstance.id}`)
                          } else {
                            navigate(`/explore/${item.type || type}/${rec.id}`)
                          }
                        }}
                        className="flex-shrink-0 w-32 bg-[#0f1422] border border-slate-800 hover:border-slate-700/80 rounded-lg overflow-hidden shadow-lg group cursor-pointer"
                      >
                        <div className="aspect-[2/3] w-full bg-slate-950 relative overflow-hidden">
                          {rec.poster_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w185${rec.poster_path}`}
                              alt={rec.title || rec.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500 bg-slate-900 font-bold text-4xl rounded-none">
                              {(rec.title || rec.name || 'U').charAt(0)}
                            </div>
                          )}

                          {watchlistInstance && (
                            <div className={`absolute inset-x-0 bottom-0 backdrop-blur-md border-t text-[10px] font-bold py-1 px-1.5 flex items-center justify-center gap-1 ${getCollectionStatusLabelAndStyle(watchlistInstance.status).containerStyle}`}>
                              <Check className={`w-3.5 h-3.5 ${getCollectionStatusLabelAndStyle(watchlistInstance.status).iconColor}`} />
                              <span>{getCollectionStatusLabelAndStyle(watchlistInstance.status).label}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Similar Row */}
          {similar.length > 0 && (
            <div className="mt-6 border-t border-slate-900 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-violet-400" />
                    Similar Titles
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Discover movies and shows sharing a similar genre or style.
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => scrollRow(similarScrollRef, 'left')}
                    className="w-7 h-7 rounded-lg border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 bg-[#101424] flex items-center justify-center transition-all cursor-pointer"
                    title="Scroll Left"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollRow(similarScrollRef, 'right')}
                    className="w-7 h-7 rounded-lg border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 bg-[#101424] flex items-center justify-center transition-all cursor-pointer"
                    title="Scroll Right"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="relative">
                <div
                  ref={similarScrollRef}
                  className="flex gap-4 overflow-x-auto pb-4 scrollbar-none scroll-smooth"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {similar.slice(0, 20).map(sim => {
                    const releaseDate = sim.release_date || sim.first_air_date || ''
                    const year = releaseDate ? releaseDate.split('-')[0] : 'TBA'
                    const watchlistInstance = items.find(i => i.tmdb_id && i.tmdb_id.toString() === sim.id.toString() && i.type === (item.type || type) && i.status !== 'list_only')

                    return (
                      <div
                        key={sim.id}
                        onClick={() => {
                          if (watchlistInstance) {
                            navigate(`/media/${watchlistInstance.id}`)
                          } else {
                            navigate(`/explore/${item.type || type}/${sim.id}`)
                          }
                        }}
                        className="flex-shrink-0 w-32 bg-[#0f1422] border border-slate-800 hover:border-slate-700/80 rounded-lg overflow-hidden shadow-lg group cursor-pointer"
                      >
                        <div className="aspect-[2/3] w-full bg-slate-950 relative overflow-hidden">
                          {sim.poster_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w185${sim.poster_path}`}
                              alt={sim.title || sim.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500 bg-slate-900 font-bold text-4xl rounded-none">
                              {(sim.title || sim.name || 'U').charAt(0)}
                            </div>
                          )}

                          {watchlistInstance && (
                            <div className={`absolute inset-x-0 bottom-0 backdrop-blur-md border-t text-[10px] font-bold py-1 px-1.5 flex items-center justify-center gap-1 ${getCollectionStatusLabelAndStyle(watchlistInstance.status).containerStyle}`}>
                              <Check className={`w-3.5 h-3.5 ${getCollectionStatusLabelAndStyle(watchlistInstance.status).iconColor}`} />
                              <span>{getCollectionStatusLabelAndStyle(watchlistInstance.status).label}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* My Review & Notes */}
          {!item.isExplore && (
            <div className="mt-4">
              <h3 className="text-lg font-bold text-white mb-3">My Notes & Review</h3>
              <div className="bg-[#0f1422] border border-slate-800 rounded-2xl p-4 min-h-[100px] shadow-inner">
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
    </div>

      {/* Trailer Modal Overlay */}
      {isTrailerOpen && trailer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm animate-fade-in p-4 sm:p-8">
          <div className="relative w-full max-w-6xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
            <button
              onClick={() => setIsTrailerOpen(false)}
              className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10 flex items-center gap-2 bg-black/50 hover:bg-white/20 text-white px-4 py-2 rounded-full font-bold transition-colors cursor-pointer backdrop-blur-md border border-slate-800 shadow-lg"
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
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer whitespace-nowrap ${activeSource === source.id
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
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-full font-bold transition-colors cursor-pointer border border-slate-800 shadow-lg text-xs flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              Close Player
            </button>
          </div>

          <div className="relative w-full max-w-6xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex-grow max-h-[75vh]">
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
                  className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-350 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
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
                className="flex items-center gap-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white px-3 py-1.5 rounded-full font-bold transition-colors cursor-pointer border border-slate-800 shadow-md text-xs"
              >
                Close
              </button>
            </div>

            {/* If TV show, allow season/episode controls right inside the download modal */}
            {item?.type === 'tv' && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950 border border-slate-800 p-4 rounded-2xl mb-6">
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
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-violet-500/40 hover:bg-violet-950/10 transition-all group"
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

      {/* Status Modal Overlay */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-[#0f1422] border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                {item.isExplore ? (
                  <>
                    <Plus className="w-5 h-5 text-violet-400" />
                    Add to Watchlist
                  </>
                ) : (
                  <>
                    <Edit className="w-5 h-5 text-violet-400" />
                    Update Watchlist Status
                  </>
                )}
              </h3>
              <button
                onClick={() => setIsStatusModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Watch Status
                </label>
                <select
                  value={addStatus}
                  onChange={(e) => setAddStatus(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-violet-500 cursor-pointer"
                >
                  <option value="completed">{(item.type || type) === 'game' ? 'Beaten' : 'Completed'}</option>
                  <option value="watching">{(item.type || type) === 'game' ? 'Playing' : 'Watching'}</option>
                  <option value="pending">{(item.type || type) === 'tv' ? 'Up Next' : 'Pending'}</option>
                  <option value="planned">Planned</option>
                  <option value="backlog">Backlog</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Notes / Review
                </label>
                <textarea
                  rows="3"
                  value={addReview}
                  onChange={(e) => setAddReview(e.target.value)}
                  placeholder="Add personal notes or review..."
                  className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              {!item.isExplore && onRemoveItem && (
                <button
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to remove this item from your watchlist?')) {
                      await onRemoveItem(item.id)
                      setIsStatusModalOpen(false)
                      navigate('/')
                    }
                  }}
                  className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl font-bold transition-all cursor-pointer"
                  title="Remove from List"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsStatusModalOpen(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-sm transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (item.isExplore) {
                    await handleAddItemFromDetails()
                  } else if (onUpdateItem) {
                    await onUpdateItem(item.id, { status: addStatus, review: addReview.trim() })
                  }
                  setIsStatusModalOpen(false)
                }}
                className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-2.5 rounded-xl text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
              >
                <Check className="w-4 h-4" />
                {item.isExplore ? 'Save to List' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for viewing all posters/banners */}
      {showImageModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h3 className="text-lg font-bold text-white uppercase tracking-wider">
                All {imageModalType === 'posters' ? 'Posters' : 'Banners'} ({details?.images?.[imageModalType]?.length || 0})
              </h3>
              <button
                onClick={() => setShowImageModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="overflow-y-auto pr-1 flex-1">
              {details?.images?.[imageModalType] && details.images[imageModalType].length > 0 ? (
                <div className={`grid gap-4 ${imageModalType === 'posters' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2'}`}>
                  {details.images[imageModalType].slice(0, 48).map((img, index) => (
                    <a
                      key={index}
                      href={`https://image.tmdb.org/t/p/original${img.file_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 hover:border-violet-500/40 transition-all shadow-md flex"
                    >
                      <img
                        src={`https://image.tmdb.org/t/p/${imageModalType === 'posters' ? 'w342' : 'w780'}${img.file_path}`}
                        alt=""
                        className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800 backdrop-blur-sm">
                          Open Original
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-slate-500 italic text-xs">
                  No images found in this category.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
