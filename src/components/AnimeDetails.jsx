import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Star, Film, Tv, Check, Play, Plus, Minus, X, Bookmark, Search, Layers, ChevronLeft, ChevronRight } from 'lucide-react'
import { fetchAnilistAnimeDetails } from '../lib/anilist'
import { findKitsuAnime, fetchKitsuEpisodesRange } from '../lib/kitsu'

// Cast Carousel matching MovieTvDetails cast area exactly
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

  return (
    <div className="relative group/cast">
      <div className="flex items-center justify-between gap-3 mb-3">
        {/* Header */}
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-white">Cast</h3>
        </div>

        {/* Action Controls (View All / Scroll Arrows) */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors cursor-pointer"
          >
            {showAll ? 'Show Carousel' : `View All (${cast.length})`}
          </button>

          {!showAll && (
            <div className="hidden sm:flex items-center gap-1.5">
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
              key={`${actor.id}-${actor.character}`}
              className="bg-[#101424] border border-slate-800 hover:border-violet-500/50 rounded-xl overflow-hidden flex flex-col shadow-md group/actor transition-all duration-300"
            >
              <div className="aspect-[3/4] w-full bg-slate-950 relative overflow-hidden">
                {actor.profile_path ? (
                  <img
                    src={actor.profile_path}
                    alt={actor.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover/actor:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-900 font-bold text-2xl">
                    {actor.name?.charAt(0)}
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
          {canScrollLeft && (
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0a0a0a] to-transparent z-10" />
          )}
          {canScrollRight && (
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0a0a0a] to-transparent z-10" />
          )}

          <div
            ref={scrollRef}
            className="flex flex-nowrap gap-2 sm:gap-3.5 overflow-x-auto scrollbar-none py-1 scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {cast.map(actor => (
              <div
                key={`${actor.id}-${actor.character}`}
                className="w-24 sm:w-36 flex-shrink-0 bg-[#101424] hover:border-violet-500/50 rounded-xl overflow-hidden flex flex-col shadow-md transition-all duration-300 hover:-translate-y-0.5 group/actor border border-slate-800/60"
              >
                <div className="aspect-[3/4] w-full bg-slate-950 relative overflow-hidden">
                  {actor.profile_path ? (
                    <img
                      src={actor.profile_path}
                      alt={actor.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover/actor:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-900 font-bold text-2xl">
                      {actor.name?.charAt(0)}
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-[#0d101d] via-[#0d101d]/90 to-transparent flex flex-col justify-end">
                    <span className="text-xs font-bold text-white truncate" title={actor.name}>
                      {actor.name}
                    </span>
                    <span className="text-[10px] text-violet-400 font-medium truncate mt-0.5" title={actor.character}>
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

const parseEpisodeNumber = (title) => {
  if (!title) return null
  const match = title.match(/Episode\s+(\d+)/i)
  return match ? parseInt(match[1], 10) : null
}

const cleanEpisodeName = (title, epNum) => {
  if (!title) return `Episode ${epNum}`
  const prefixRegex = new RegExp(`^Episode\\s+${epNum}\\s*(?:-|:|–|—)?\\s*`, 'i')
  const cleaned = title.replace(prefixRegex, '')
  if (!cleaned.trim()) {
    return title
  }
  return cleaned.trim()
}

const findStreamingEpisode = (epNum, streamingEpisodes) => {
  if (!streamingEpisodes || streamingEpisodes.length === 0) return null

  const match = streamingEpisodes.find(se => {
    const parsedNum = parseEpisodeNumber(se.title)
    return parsedNum === epNum
  })
  if (match) return match

  if (streamingEpisodes[epNum - 1]) {
    const parsedNum = parseEpisodeNumber(streamingEpisodes[epNum - 1].title)
    if (parsedNum === null || parsedNum === epNum) {
      return streamingEpisodes[epNum - 1]
    }
  }

  return null
}

export default function AnimeDetails({ items, onUpdateItem, onRemoveItem, onAddItem }) {
  const { id, tmdb_id } = useParams()
  const navigate = useNavigate()

  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Navigation Tabs state
  const [activeAnimeTab, setActiveAnimeTab] = useState('overview')
  const [isTrailerOpen, setIsTrailerOpen] = useState(false)

  // Search state for Episodes tab
  const [searchQuery, setSearchQuery] = useState('')

  // View switcher state ('list', 'grid-large', 'grid-small')
  const [episodeView, setEpisodeView] = useState('grid-large')

  // Tracker Logging Modal States
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [addStatus, setAddStatus] = useState('planned')
  const [addReview, setAddReview] = useState('')
  const [addRating, setAddRating] = useState(8)

  // Kitsu Metadata & Pagination States
  const [kitsuAnime, setKitsuAnime] = useState(null)
  const [kitsuEpisodes, setKitsuEpisodes] = useState({})
  const [, setKitsuLoading] = useState(false)
  const [activeRangeStart, setActiveRangeStart] = useState(1)

  // Find if this anime is already logged in the watchlist
  const lookupId = id || tmdb_id
  let item = items.find(i => i.id === lookupId || (i.tmdb_id && i.tmdb_id.toString() === lookupId?.toString() && i.status !== 'list_only'))
  const listOnlyItem = !item && items.find(i => i.tmdb_id && i.tmdb_id.toString() === lookupId?.toString() && i.status === 'list_only')
  if (listOnlyItem) {
    item = { ...listOnlyItem, isExplore: true }
  } else if (item && item.status === 'list_only') {
    item = { ...item, isExplore: true }
  } else if (!item) {
    item = { tmdb_id: lookupId, type: 'tv', isExplore: true }
  }

  // Load details from AniList
  useEffect(() => {
    const loadDetails = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchAnilistAnimeDetails(lookupId)
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
    if (lookupId) {
      loadDetails()
    }
  }, [lookupId])

  // Calculated Progress Variables
  const currentEpisodesWatched = item.season_progress?.[1] || 0
  const maxEpisodes = details?.seasons?.[0]?.episode_count 
    || details?.episodes 
    || (details?.nextAiringEpisode ? details.nextAiringEpisode.episode - 1 : (kitsuAnime?.episodeCount || 12))

  // Trailer key
  const trailerKey = details?.videos?.results?.[0]?.key
  const anilistNumericId = details?.anilistId || lookupId?.toString().replace('anilist_', '')
  const malId = details?.idMal
  const cleanTitle = (details?.title || '')
    .replace(/[:\-_/\\#?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // Data Array Config for EXTERNAL LINKS (matching MovieTvDetails)
  const externalLinksData = [
    {
      id: 'youtube',
      label: 'YouTube Trailer',
      show: true,
      url: trailerKey
        ? `https://www.youtube.com/watch?v=${trailerKey}`
        : `https://www.youtube.com/results?search_query=${encodeURIComponent(`${details?.title || ''} official trailer`)}`,
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
      id: 'mal',
      label: 'MyAnimeList',
      show: true,
      url: malId
        ? `https://myanimelist.net/anime/${malId}`
        : `https://myanimelist.net/anime.php?q=${encodeURIComponent(details?.title || '')}`,
      borderClass: 'border-[#2e51a2]/30 hover:border-[#2e51a2]',
      badge: (
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/7/7a/MyAnimeList_Logo.png"
          alt="MyAnimeList"
          className="w-6 h-5 object-contain flex-shrink-0"
        />
      )
    },
    {
      id: 'anilist',
      label: 'AniList',
      show: !!(anilistNumericId || details?.siteUrl || details?.homepage),
      url: details?.siteUrl || details?.homepage || `https://anilist.co/anime/${anilistNumericId}`,
      borderClass: 'border-sky-500/30 hover:border-sky-400',
      badge: (
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/6/61/AniList_logo.svg"
          alt="AniList"
          className="w-5 h-5 object-contain flex-shrink-0"
        />
      )
    },
    {
      id: 'kitsu',
      label: 'Kitsu',
      show: true,
      url: kitsuAnime?.id
        ? `https://kitsu.app/anime/${kitsuAnime.id}`
        : `https://kitsu.app/anime?text=${encodeURIComponent(details?.title || '')}`,
      borderClass: 'border-orange-500/30 hover:border-orange-400',
      badge: (
        <span className="w-5 h-5 rounded bg-orange-600/20 text-orange-400 font-black text-[10px] flex items-center justify-center border border-orange-500/30">
          K
        </span>
      )
    },
    {
      id: '1337x',
      label: '1337x',
      show: true,
      url: `https://1337x.to/search/${cleanTitle.split(' ').join('+')}/1/`,
      borderClass: 'border-red-600/30 hover:border-red-500',
      badge: (
        <span className="w-5 h-5 rounded bg-red-600/20 text-red-400 font-black text-[10px] flex items-center justify-center border border-red-500/30">
          1337
        </span>
      )
    }
  ]

  // Resolve Kitsu anime metadata
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
  }, [details?.title, details?.release_date])

  // Fetch Kitsu episodes for the currently active range
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
        console.warn('Failed to load Kitsu range:', err)
      } finally {
        if (isMounted) setKitsuLoading(false)
      }
    }
    loadKitsuEps()
    return () => { isMounted = false }
  }, [kitsuAnime?.id, activeRangeStart, maxEpisodes])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400 gap-3">
        <span className="w-10 h-10 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
        <p className="text-sm font-semibold">Loading anime details...</p>
      </div>
    )
  }

  if (error || !details) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <div className="text-rose-500 font-medium max-w-md mx-auto bg-rose-500/10 border border-rose-500/20 p-6 rounded-2xl mb-6">
          <p className="text-lg font-bold mb-2">Error Loading Details</p>
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

  // Watched toggling
  const handleUpdateEpisodes = (newCount) => {
    if (item.isExplore) return
    const status = newCount >= maxEpisodes ? 'completed' : (newCount === 0 ? 'planned' : 'watching')
    onUpdateItem(item.id, {
      season_progress: { 1: newCount },
      status: status
    })
  }

  // Add Watchlist handler
  const handleAddConfirm = async () => {
    if (item && item.id && onUpdateItem) {
      const updates = {
        status: addStatus,
        rating: addRating,
        review: addReview.trim(),
        season_progress: { 1: addStatus === 'completed' ? maxEpisodes : (item.season_progress?.[1] || 0) }
      }
      await onUpdateItem(item.id, updates)
      setIsStatusModalOpen(false)
      return
    }

    const newItem = {
      tmdb_id: details.tmdb_id,
      title: details.title,
      type: 'tv', // Anime defaults to tv watchlist tab
      poster_path: details.poster_path,
      release_year: details.release_date ? details.release_date.split('-')[0] : 'N/A',
      status: addStatus,
      rating: addRating,
      review: addReview.trim(),
      season_progress: { 1: addStatus === 'completed' ? maxEpisodes : 0 }
    }
    await onAddItem(newItem)
    setIsStatusModalOpen(false)
  }

  const handleDeleteItem = () => {
    if (window.confirm(`Remove "${details.title}" from your watchlist?`)) {
      onRemoveItem(item.id)
      navigate(-1)
    }
  }

  return (
    <div className="animate-fade-in pb-16">
      {/* Hero Header Banner */}
      <div className="w-screen relative left-1/2 -translate-x-1/2 overflow-hidden border-0 bg-black shadow-2xl mb-8">
        {details.backdrop_path && (
          <div className="absolute right-0 top-0 bottom-0 w-full md:w-3/4 lg:w-2/3 h-full z-0 overflow-hidden pointer-events-none">
            <img
              src={details.backdrop_path}
              alt="Backdrop"
              className="w-full h-full object-cover object-center opacity-100"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent z-10" />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black via-black/85 to-transparent z-10" />
          </div>
        )}

        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 relative z-10">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-855 border border-slate-800 text-slate-350 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-md"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-start pb-6 sm:pb-8">
            <div className="w-36 sm:w-44 md:w-52 aspect-[2/3] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex-shrink-0 bg-slate-950">
              <img
                src={details.poster_path}
                alt={details.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-between min-h-[260px] w-full gap-4">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold px-2.5 py-0.5 rounded bg-violet-500/10 border border-violet-500/20 text-violet-400 uppercase tracking-wide">
                    Anime
                  </span>
                  <span className="text-xs font-bold text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg flex items-center gap-1.5">
                    {maxEpisodes} Episodes
                    {details.status === 'RELEASING' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Airing
                      </span>
                    )}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3.5xl font-black text-white tracking-tight leading-tight line-clamp-2">
                  {details.title}
                </h1>

                <div className="flex items-center gap-3 text-slate-350 text-xs font-bold flex-wrap">
                  {details.vote_average > 0 && (
                    <span className="flex items-center gap-1.5 text-amber-400">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      {details.vote_average.toFixed(1)}
                    </span>
                  )}
                  {details.release_date && (
                    <>
                      <span className="text-slate-650">·</span>
                      <span>{details.release_date.split('-')[0]}</span>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mt-1">
                  {details.genres?.slice(0, 3).map(g => (
                    <span key={g.id} className="text-xs font-semibold px-3 py-1 rounded-xl bg-[#14122b] text-[#a78bfa] border border-[#2e265c]">
                      {g.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-4 mt-2 w-full">
                <div className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl flex-1">
                  <p className="line-clamp-4">
                    {details.overview}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 flex-shrink-0">
                  <button
                    onClick={() => {
                      if (item.isExplore) {
                        setAddStatus('planned')
                        setIsStatusModalOpen(true)
                      } else {
                        setIsStatusModalOpen(true)
                      }
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

                  {!item.isExplore && (
                    <button
                      onClick={handleDeleteItem}
                      className="bg-rose-950/30 hover:bg-rose-900/40 text-rose-450 border border-rose-500/20 hover:border-rose-500/35 p-3 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-md"
                      title="Remove From Watchlist"
                    >
                      <Trash2Icon />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigator */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex border-b border-slate-800">
          <button
            onClick={() => setActiveAnimeTab('overview')}
            className={`py-3 px-6 text-sm font-black border-b-2 transition-all cursor-pointer ${activeAnimeTab === 'overview'
              ? 'border-violet-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveAnimeTab('episodes')}
            className={`py-3 px-6 text-sm font-black border-b-2 transition-all cursor-pointer ${activeAnimeTab === 'episodes'
              ? 'border-violet-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
          >
            Episodes ({maxEpisodes})
          </button>
        </div>
      </div>

      {/* Content Columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {activeAnimeTab === 'episodes' ? (
          /* Episodes List Tab */
          <div className="bg-[#0a0a0a] border border-slate-800/80 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-850 pb-4 gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-white">Episodes Tracker</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Click an episode to toggle its watched status.
                </p>
              </div>
              <div className="flex items-center gap-3.5 self-start sm:self-auto flex-wrap">
                {/* View Switcher Button Group */}
                <div className="flex bg-[#101424]/40 border border-slate-800 p-0.5 rounded-xl">
                  <button
                    onClick={() => setEpisodeView('list')}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${episodeView === 'list'
                        ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                        : 'text-slate-450 hover:text-slate-200'
                      }`}
                    title="List View (2 per row)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                      <line x1="8" y1="6" x2="21" y2="6" />
                      <line x1="8" y1="12" x2="21" y2="12" />
                      <line x1="8" y1="18" x2="21" y2="18" />
                      <line x1="3" y1="6" x2="3.01" y2="6" strokeLinecap="round" />
                      <line x1="3" y1="12" x2="3.01" y2="12" strokeLinecap="round" />
                      <line x1="3" y1="18" x2="3.01" y2="18" strokeLinecap="round" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setEpisodeView('grid-large')}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${episodeView === 'grid-large'
                        ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                        : 'text-slate-450 hover:text-slate-200'
                      }`}
                    title="Large Grid View"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                      <rect x="3" y="3" width="7" height="7" rx="1.5" />
                      <rect x="14" y="3" width="7" height="7" rx="1.5" />
                      <rect x="14" y="14" width="7" height="7" rx="1.5" />
                      <rect x="3" y="14" width="7" height="7" rx="1.5" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setEpisodeView('grid-small')}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${episodeView === 'grid-small'
                        ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                        : 'text-slate-450 hover:text-slate-200'
                      }`}
                    title="Small Grid View"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                      <rect x="3" y="3" width="4" height="4" rx="0.5" />
                      <rect x="10" y="3" width="4" height="4" rx="0.5" />
                      <rect x="17" y="3" width="4" height="4" rx="0.5" />
                      <rect x="3" y="10" width="4" height="4" rx="0.5" />
                      <rect x="10" y="10" width="4" height="4" rx="0.5" />
                      <rect x="17" y="10" width="4" height="4" rx="0.5" />
                      <rect x="3" y="17" width="4" height="4" rx="0.5" />
                      <rect x="10" y="17" width="4" height="4" rx="0.5" />
                      <rect x="17" y="17" width="4" height="4" rx="0.5" />
                    </svg>
                  </button>
                </div>

                {!item.isExplore && (
                  <div className="text-xs font-bold text-slate-400 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl">
                    {currentEpisodesWatched} of {maxEpisodes} watched
                  </div>
                )}
              </div>
            </div>

            {/* Episode Search Bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search episodes by number or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#101424]/40 border border-slate-800/80 focus:border-violet-500 focus:outline-none rounded-xl pl-10 pr-9 py-2.5 text-white text-xs placeholder-slate-550 transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Episode Range Selector for Large Episode Catalogs */}
            {(() => {
              const rangeStep = 50
              const totalRanges = Math.ceil(maxEpisodes / rangeStep)
              if (totalRanges <= 1 || searchQuery.trim()) return null

              const ranges = Array.from({ length: totalRanges }).map((_, i) => {
                const start = i * rangeStep + 1
                const end = Math.min((i + 1) * rangeStep, maxEpisodes)
                return { start, end, label: `${start}–${end}` }
              })

              return (
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 flex-shrink-0 mr-1">
                    <Layers className="w-3.5 h-3.5 text-violet-400" />
                    Range:
                  </span>
                  {ranges.map((r) => {
                    const isSelected = activeRangeStart === r.start
                    return (
                      <button
                        key={r.start}
                        onClick={() => setActiveRangeStart(r.start)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 cursor-pointer ${
                          isSelected
                            ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25 border border-violet-500'
                            : 'bg-slate-900/80 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                      >
                        {r.label}
                      </button>
                    )
                  })}
                </div>
              )
            })()}

            {(() => {
              const rangeEnd = Math.min(activeRangeStart + 49, maxEpisodes)
              const episodeNumbers = searchQuery.trim()
                ? Array.from({ length: maxEpisodes }).map((_, idx) => idx + 1)
                : Array.from({ length: rangeEnd - activeRangeStart + 1 }).map((_, idx) => activeRangeStart + idx)

              const filteredEpisodes = episodeNumbers.map((epNum) => {
                const kitsuEp = kitsuEpisodes[epNum]
                const streamingEp = details.streamingEpisodes ? findStreamingEpisode(epNum, details.streamingEpisodes) : null
                const epName = kitsuEp?.title || (streamingEp ? cleanEpisodeName(streamingEp.title, epNum) : `Episode ${epNum}`)
                const epThumbnail = kitsuEp?.thumbnail || streamingEp?.thumbnail || details.backdrop_path || details.poster_path || ''
                const epUrl = streamingEp?.url || ''

                return {
                  epNum,
                  name: epName,
                  thumbnail: epThumbnail,
                  url: epUrl,
                  isWatched: epNum <= currentEpisodesWatched,
                }
              }).filter(ep => {
                if (!searchQuery.trim()) return true
                const query = searchQuery.toLowerCase().trim()

                const isNum = !isNaN(query) && parseInt(query, 10) === ep.epNum
                if (isNum) return true

                const numInText = query.match(/(?:ep(?:isode)?\s+)(\d+)/i)
                if (numInText && parseInt(numInText[1], 10) === ep.epNum) {
                  return true
                }

                return ep.name.toLowerCase().includes(query)
              })

              if (filteredEpisodes.length === 0) {
                return (
                  <div className="text-center py-10 bg-slate-955/10 border border-dashed border-slate-850 rounded-2xl text-slate-450 text-xs font-bold">
                    No episodes found matching "{searchQuery}"
                  </div>
                )
              }

              if (episodeView === 'list') {
                return (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredEpisodes.map((ep) => (
                      <div
                        key={ep.epNum}
                        onClick={() => navigate(`/anime-player/${lookupId}/${ep.epNum}`)}
                        className={`flex items-center p-3.5 rounded-2xl border transition-all cursor-pointer select-none gap-4 hover:-translate-y-0.5 duration-200 ${ep.isWatched
                          ? 'bg-emerald-955/10 border-emerald-500/20 hover:border-emerald-500/40 shadow-sm shadow-emerald-950/20'
                          : 'bg-[#0f1422]/60 border-slate-800/85 hover:border-slate-750'
                          }`}
                      >
                        {/* Thumbnail */}
                        <div className="relative aspect-video w-28 sm:w-36 rounded-xl overflow-hidden border border-slate-850 bg-slate-950 flex-shrink-0 group/thumb">
                          {ep.thumbnail ? (
                            <img
                              src={ep.thumbnail}
                              alt={ep.name}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-105"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-655 bg-slate-900/50">
                              <Film className="w-5 h-5 opacity-30" />
                            </div>
                          )}
                          {ep.url && (
                            <a
                              href={ep.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="absolute bottom-1.5 right-1.5 bg-black/75 hover:bg-violet-650 text-white text-[9px] font-bold px-1.5 rounded py-0.5 flex items-center gap-0.5 border border-slate-800/80 transition-colors backdrop-blur-sm shadow-md"
                            >
                              <Play className="w-1.5 h-1.5 fill-white stroke-none" /> Watch
                            </a>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <div className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${ep.isWatched
                              ? 'bg-emerald-500/20 text-emerald-455'
                              : 'bg-slate-900 text-slate-400 border border-slate-800'
                              }`}>
                              EP {ep.epNum}
                            </div>
                          </div>
                          <h4 className={`text-xs sm:text-sm font-bold leading-snug line-clamp-2 ${ep.isWatched ? 'text-emerald-300/90' : 'text-slate-200'}`}>
                            {ep.name}
                          </h4>
                        </div>

                        {/* Checkbox */}
                        {!item.isExplore && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              const newCount = ep.isWatched ? ep.epNum - 1 : ep.epNum
                              handleUpdateEpisodes(newCount)
                            }}
                            className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all flex-shrink-0 ${ep.isWatched
                              ? 'bg-emerald-500 border-emerald-400 text-white shadow-sm shadow-emerald-500/20'
                              : 'bg-slate-900 border-slate-800 text-transparent'
                              }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )
              }

              if (episodeView === 'grid-small') {
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {filteredEpisodes.map((ep) => (
                      <div
                        key={ep.epNum}
                        onClick={() => navigate(`/anime-player/${lookupId}/${ep.epNum}`)}
                        className={`flex flex-col p-2.5 rounded-xl border transition-all cursor-pointer select-none gap-2.5 hover:-translate-y-0.5 duration-200 ${ep.isWatched
                          ? 'bg-emerald-955/10 border-emerald-500/20 hover:border-emerald-500/40 shadow-sm shadow-emerald-950/20'
                          : 'bg-[#0f1422]/60 border-slate-800/85 hover:border-slate-750'
                          }`}
                      >
                        {/* Thumbnail */}
                        <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-slate-855 bg-slate-950 group/thumb">
                          {ep.thumbnail ? (
                            <img
                              src={ep.thumbnail}
                              alt={ep.name}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-105"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-655 bg-slate-900/50">
                              <Film className="w-4 h-4 opacity-30" />
                            </div>
                          )}
                          {ep.url && (
                            <a
                              href={ep.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="absolute bottom-1 right-1 bg-black/75 hover:bg-violet-650 text-white text-[8px] font-bold px-1.5 rounded py-0.5 flex items-center gap-0.5 border border-slate-800/80 transition-colors backdrop-blur-sm"
                            >
                              <Play className="w-1.5 h-1.5 fill-white stroke-none" /> Watch
                            </a>
                          )}
                        </div>

                        {/* Info & Checkbox */}
                        <div className="flex items-start justify-between gap-1 w-full min-w-0">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[10px] font-extrabold ${ep.isWatched ? 'text-emerald-455' : 'text-slate-400'}`}>
                                EP {ep.epNum}
                              </span>
                            </div>
                            <h4 className={`text-[10px] font-bold leading-tight truncate ${ep.isWatched ? 'text-emerald-350' : 'text-slate-350'}`}>
                              {ep.name}
                            </h4>
                          </div>

                          {!item.isExplore && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                const newCount = ep.isWatched ? ep.epNum - 1 : ep.epNum
                                handleUpdateEpisodes(newCount)
                              }}
                              className={`w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0 ${ep.isWatched
                                ? 'bg-emerald-500 border-emerald-400 text-white shadow-sm'
                                : 'bg-slate-900 border-slate-800 text-transparent'
                                }`}
                            >
                              <Check className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }

              // Default: grid-large (current style)
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredEpisodes.map((ep) => (
                    <div
                      key={ep.epNum}
                      onClick={() => navigate(`/anime-player/${lookupId}/${ep.epNum}`)}
                      className={`flex flex-col p-4 rounded-2xl border transition-all cursor-pointer select-none gap-3 hover:-translate-y-0.5 duration-200 ${ep.isWatched
                        ? 'bg-emerald-955/10 border-emerald-500/20 hover:border-emerald-500/40 shadow-sm shadow-emerald-950/20'
                        : 'bg-[#0f1422]/60 border-slate-800/85 hover:border-slate-750'
                        }`}
                    >
                      {/* Top Row: Episode Number & Checkbox */}
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-extrabold text-xs ${ep.isWatched
                            ? 'bg-emerald-500/20 text-emerald-455'
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                            }`}>
                            {ep.epNum}
                          </div>
                          <span className={`text-xs font-bold ${ep.isWatched ? 'text-emerald-455' : 'text-slate-400'}`}>
                            Episode {ep.epNum}
                          </span>
                        </div>

                        {!item.isExplore && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              const newCount = ep.isWatched ? ep.epNum - 1 : ep.epNum
                              handleUpdateEpisodes(newCount)
                            }}
                            className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${ep.isWatched
                              ? 'bg-emerald-500 border-emerald-400 text-white shadow-sm shadow-emerald-500/20'
                              : 'bg-slate-900 border-slate-800 text-transparent'
                              }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Middle Row: Thumbnail Image */}
                      <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-855 bg-slate-950 group/thumb">
                        {ep.thumbnail ? (
                          <img
                            src={ep.thumbnail}
                            alt={ep.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-655 bg-slate-900/50 gap-1.5">
                            <Film className="w-6 h-6 opacity-30" />
                            <span className="text-[10px] font-medium opacity-40">No thumbnail available</span>
                          </div>
                        )}

                        {/* Streaming Source/Link Badge if available */}
                        {ep.url && (
                          <a
                            href={ep.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()} // don't toggle watched status when clicking streaming link
                            className="absolute bottom-2 right-2 bg-black/75 hover:bg-violet-650 text-white text-[10px] font-bold px-2 rounded-md py-1 flex items-center gap-1 border border-slate-800/80 transition-colors backdrop-blur-sm shadow-md"
                          >
                            <Play className="w-2 h-2 fill-white stroke-none" /> Watch
                          </a>
                        )}
                      </div>

                      {/* Bottom Row: Episode Name */}
                      <div className="w-full min-w-0">
                        <h4 className={`text-xs font-bold leading-snug line-clamp-2 ${ep.isWatched ? 'text-emerald-300/90' : 'text-slate-200'}`}>
                          {ep.name}
                        </h4>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
        ) : (
          /* Overview Tab */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sidebar details */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="bg-[#0a0a0a] border border-slate-800/80 rounded-2xl p-5 shadow-2xl">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                  Anime details
                </h3>
                <div className="flex flex-col text-xs gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Release Year</span>
                    <span className="text-white font-bold">{details.release_date?.split('-')[0] || 'N/A'}</span>
                  </div>
                  {details.status && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Status</span>
                      <span className="text-white font-bold capitalize">{details.status.replace(/_/g, ' ').toLowerCase()}</span>
                    </div>
                  )}
                  {details.episodes && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Total Episodes</span>
                      <span className="text-white font-bold">{details.episodes}</span>
                    </div>
                  )}
                  {details.popularity > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Popularity Score</span>
                      <span className="text-white font-bold">{details.popularity.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* EXTERNAL LINKS Box */}
              <div className="bg-[#0a0a0a] border border-slate-800 rounded-2xl p-5 shadow-2xl">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                  EXTERNAL LINKS
                </h3>
                <div className="flex flex-wrap gap-2">
                  {externalLinksData.filter(link => link.show).map((link) => {
                    const isYouTube = link.id === 'youtube'
                    if (isYouTube) {
                      return (
                        <button
                          key={link.id}
                          type="button"
                          onClick={() => {
                            if (trailerKey) {
                              setIsTrailerOpen(true)
                            } else {
                              window.open(link.url, '_blank', 'noopener,noreferrer')
                            }
                          }}
                          className={`flex items-center gap-2 bg-[#101424] hover:bg-[#181e36] border text-slate-200 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm group cursor-pointer ${link.borderClass}`}
                        >
                          {link.badge}
                          <span>{link.label}</span>
                        </button>
                      )
                    }
                    return (
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
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Main info panel */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* Episodes status panel (tracker box) */}
              {!item.isExplore && (
                <div className="bg-[#0a0a0a] border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Tv className="w-5 h-5 text-violet-400" />
                      <h3 className="text-sm font-extrabold text-white">Watch Progress</h3>
                    </div>
                    <span className="inline-flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-350 font-extrabold px-3 py-1 text-xs rounded-xl">
                      {currentEpisodesWatched} of {maxEpisodes} episodes watched
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                      <span>Overall Progress</span>
                      <span>{Math.round((currentEpisodesWatched / maxEpisodes) * 100)}%</span>
                    </div>
                    <div className="w-full bg-[#101424] rounded-full h-2 overflow-hidden border border-slate-850">
                      <div
                        className="bg-gradient-to-r from-violet-500 to-indigo-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.round((currentEpisodesWatched / maxEpisodes) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleUpdateEpisodes(Math.max(0, currentEpisodesWatched - 1))}
                      disabled={currentEpisodesWatched <= 0}
                      className="w-9 h-9 rounded-full bg-[#101424] hover:bg-[#181e36] disabled:opacity-40 border border-slate-800 text-slate-200 flex items-center justify-center transition-all cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleUpdateEpisodes(Math.min(maxEpisodes, currentEpisodesWatched + 1))}
                      disabled={currentEpisodesWatched >= maxEpisodes}
                      className="w-9 h-9 rounded-full bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 text-white flex items-center justify-center transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Characters cast */}
              <CastCarousel cast={details.credits?.cast} />

              {/* Recommendations */}
              {details.recommendations && details.recommendations.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">Recommended Anime</h3>
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {details.recommendations.map(rec => (
                      <div
                        key={rec.id}
                        onClick={() => navigate(`/explore/tv/${rec.id}`)}
                        className="flex-shrink-0 w-28 bg-[#0f1422] border border-slate-800 hover:border-slate-700/80 rounded-lg overflow-hidden shadow-lg group cursor-pointer transition-all hover:-translate-y-0.5"
                      >
                        <div className="aspect-[2/3] w-full bg-slate-950 relative overflow-hidden">
                          {rec.poster_path ? (
                            <img src={rec.poster_path} alt={rec.title} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-655 bg-slate-900 text-xs font-bold">
                              No Pic
                            </div>
                          )}
                        </div>
                        <div className="p-2">
                          <h4 className="text-[10px] font-bold text-slate-200 truncate">{rec.title}</h4>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Relations */}
              {details.similar && details.similar.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">Relations & Similar Anime</h3>
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {details.similar.map(rel => (
                      <div
                        key={rel.id}
                        onClick={() => navigate(`/explore/tv/${rel.id}`)}
                        className="flex-shrink-0 w-28 bg-[#0f1422] border border-slate-800 hover:border-slate-700/80 rounded-lg overflow-hidden shadow-lg group cursor-pointer transition-all hover:-translate-y-0.5"
                      >
                        <div className="aspect-[2/3] w-full bg-slate-950 relative overflow-hidden">
                          {rel.poster_path ? (
                            <img src={rel.poster_path} alt={rel.title} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-655 bg-slate-900 text-xs font-bold">
                              No Pic
                            </div>
                          )}
                        </div>
                        <div className="p-2">
                          <h4 className="text-[10px] font-bold text-slate-200 truncate">{rel.title}</h4>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status Log dialog modal */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#0f1424] border border-slate-800 p-6 rounded-2xl max-w-sm w-full space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsStatusModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-extrabold text-white text-base border-b border-slate-800 pb-3 flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-violet-400" />
              Log Watchlist Status
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Status</label>
                <select
                  value={addStatus}
                  onChange={(e) => setAddStatus(e.target.value)}
                  className="w-full bg-[#101424] border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-violet-500 font-bold"
                >
                  <option value="watching">Watching</option>
                  <option value="completed">Completed</option>
                  <option value="planned">Plan to Watch</option>
                  <option value="dropped">Dropped</option>
                  <option value="onhold">On Hold</option>
                </select>
              </div>

              {addStatus !== 'planned' && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Rating ({addRating}/10)</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={addRating}
                    onChange={(e) => setAddRating(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-violet-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-bold mt-1">
                    <span>1 (Terrible)</span>
                    <span>10 (Masterpiece)</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Notes / Review</label>
                <textarea
                  value={addReview}
                  onChange={(e) => setAddReview(e.target.value)}
                  placeholder="Any personal thoughts on this show..."
                  className="w-full h-20 bg-[#101424] border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-violet-500 resize-none font-medium placeholder-slate-650"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setIsStatusModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-350 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddConfirm}
                className="px-4 py-2 bg-violet-650 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trailer Modal Overlay */}
      {isTrailerOpen && details.videos?.results?.[0] && (
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
              src={`https://www.youtube.com/embed/${details.videos.results[0].key}?autoplay=1`}
              title="Trailer"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Trash icon helper
function Trash2Icon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9 9m12 6c0 1.104-.896 2-2 2H5c-1.104 0-2-.896-2-2V7H21v8ZM9.75 5.25h4.5m-4.5 0a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75m-4.5 0H9m5.25 0h.75" />
    </svg>
  )
}
