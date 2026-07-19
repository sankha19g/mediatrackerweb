import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Star, Calendar, Clock, Film, Tv, Gamepad, Trash2, ExternalLink, Play, Check, ChevronDown, ChevronUp, Sparkles, ChevronLeft, ChevronRight, Download, Plus } from 'lucide-react'
import { getPosterUrl, fetchTMDB, isTMDBConfigured } from '../lib/tmdb'

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
    setDetails(null)
    setCollectionDetails(null)
    setCurrentSeasonDetails(null)
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
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
      if (item && item.tmdb_id && item.type !== 'game') {
        setLoading(true)
        try {
          // Append credits, release_dates (movies), content_ratings (tv), and watch/providers, and videos
          const data = await fetchTMDB(`/${item.type}/${item.tmdb_id}`, {
            append_to_response: 'credits,release_dates,content_ratings,watch/providers,videos'
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
  }, [item?.tmdb_id, item?.type])

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
      ...(type === 'tv' && { season_number: selectedSeason })
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
    if (status === 'pending') return 'Pending'
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

  // Derived TMDB Data
  const backdropUrl = details?.backdrop_path 
    ? `https://image.tmdb.org/t/p/original${details.backdrop_path}` 
    : null;
    
  const synopsis = details?.overview || 'No synopsis available.'
  const runtime = details?.runtime || (details?.episode_run_time ? details.episode_run_time[0] : null)
  
  // Find Director
  const crew = details?.credits?.crew || []
  const director = crew.find(member => member.job === 'Director')?.name || 'Unknown'
  
  // Cast (top 6 with images)
  const cast = (details?.credits?.cast || []).slice(0, 6)

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
  }, [])

  // TV Seasons
  const seasons = details?.seasons?.filter(s => s.season_number > 0) || []
  const seasonsWatched = item.seasons_watched || []

  // Series-level aggregates
  const totalEpisodes = seasons.reduce((sum, s) => sum + (s.episode_count || 0), 0)

  // All per-season items for this same show (across the watchlist)
  const allShowItems = items.filter(i => i.tmdb_id === item.tmdb_id && i.type === 'tv')
  const completedSeasonItems = allShowItems.filter(i => i.status === 'completed')
  const watchingSeasonItems  = allShowItems.filter(i => i.status === 'watching')

  const myTotalSeasonsWatched = completedSeasonItems.length

  // Episodes from fully-completed seasons (use TMDB episode_count)
  const myEpisodesFromCompleted = completedSeasonItems.reduce((sum, si) => {
    const tmdbSeason = seasons.find(s => s.season_number === si.season_number)
    return sum + (tmdbSeason?.episode_count || 0)
  }, 0)

  // Episodes from in-progress seasons (stored in item.season_progress)
  const myEpisodesFromWatching = watchingSeasonItems.reduce((sum, si) => {
    return sum + (si.season_progress || 0)
  }, 0)

  const myTotalEpisodesWatched = myEpisodesFromCompleted + myEpisodesFromWatching

  const toggleSeasonWatched = (seasonNumber) => {
    if (item.isExplore) return
    const newSeasons = seasonsWatched.includes(seasonNumber)
      ? seasonsWatched.filter(s => s !== seasonNumber)
      : [...seasonsWatched, seasonNumber]
    
    let updates = { seasons_watched: newSeasons }
    
    // Automatically transition status based on progress
    if (seasons.length > 0 && newSeasons.length >= seasons.length) {
      updates.status = 'completed'
    } else if (item.status === 'completed' && newSeasons.length < seasons.length) {
      updates.status = 'watching'
    }
    
    onUpdateItem(item.id, updates)
  }

  // With per-season items, THIS item IS the season being tracked.
  // Find the TMDB season entry that matches item.season_number directly.
  const currentSeason = item.season_number
    ? seasons.find(s => s.season_number === item.season_number)
    : seasons.find(s => !seasonsWatched.includes(s.season_number)) // fallback for legacy items
  const currentEpisodesWatched = item.season_progress?.[currentSeason?.season_number] || 0
  const upNextEpisode = currentSeasonDetails?.episodes?.[currentEpisodesWatched]

  const handleUpdateEpisodes = (seasonNumber, newCount, maxEpisodes) => {
    if (item.isExplore) return
    
    if (newCount >= maxEpisodes) {
      const newSeasons = [...seasonsWatched, seasonNumber]
      const newProgress = { ...(item.season_progress || {}) }
      delete newProgress[seasonNumber]
      
      let updates = { 
        seasons_watched: newSeasons,
        season_progress: newProgress
      }
      
      if (seasons.length > 0 && newSeasons.length >= seasons.length) {
        updates.status = 'completed'
      }
      
      onUpdateItem(item.id, updates)
    } else {
      let updates = {
        season_progress: {
          ...(item.season_progress || {}),
          [seasonNumber]: newCount
        }
      }
      
      if (item.status === 'completed') {
        updates.status = 'watching'
      }
      
      onUpdateItem(item.id, updates)
    }
  }

  return (
    <div className="animate-fade-in pb-16">
      {/* ========================================================================= */}
      {/* MOBILE LAYOUT (md:hidden) */}
      {/* ========================================================================= */}
      <div className="md:hidden flex flex-col min-h-screen bg-slate-950 text-white overflow-x-hidden">
        {/* Backdrop & Overlay Poster Section */}
        <div className="relative w-full h-[35vh] bg-slate-950 overflow-visible">
          {backdropUrl ? (
            <img 
              src={backdropUrl} 
              alt="Backdrop" 
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className="w-full h-full bg-slate-900" />
          )}
          {/* Dark gradient overlay on backdrop */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent z-10" />

          {/* Back button overlaying the backdrop */}
          <button 
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 z-30 w-10 h-10 border border-white/20 bg-slate-950/60 text-white rounded-lg flex items-center justify-center cursor-pointer transition-all hover:bg-slate-900/60"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Poster overlapping the bottom of the backdrop */}
          <div className="absolute bottom-[-30px] left-4 z-20 w-[110px] aspect-[2/3] rounded-lg overflow-hidden border border-slate-800 shadow-2xl">
            <img 
              src={getPosterUrl(posterPath)} 
              alt={title} 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Play & Download Buttons positioned on the right of the poster at the bottom of backdrop area */}
          <div className="absolute bottom-[-16px] right-4 z-20 flex items-center gap-2">
            {(item.type === 'movie' || item.type === 'tv') && movieSources.length > 0 && (
              <button
                onClick={() => setIsPlayerOpen(true)}
                className="inline-flex items-center gap-1.5 bg-[#0a0f1d] hover:bg-[#121829] text-white px-4 py-2.5 rounded-lg font-bold border border-slate-800/80 transition-all hover:scale-105 shadow-xl cursor-pointer text-xs uppercase"
              >
                <Play className="w-3.5 h-3.5 fill-white stroke-white" />
                {item.type === 'movie' ? 'Play Movie' : 'Play Show'}
              </button>
            )}
            {(item.type === 'movie' || item.type === 'tv') && resolvedDownloadSources.length > 0 && (
              <button
                onClick={() => setIsDownloadOpen(true)}
                className="inline-flex items-center justify-center p-2.5 rounded-lg border border-slate-800/80 bg-[#0a0f1d] hover:bg-[#121829] text-slate-300 hover:text-white transition-all hover:scale-105 cursor-pointer shadow-lg"
                title="Download Options"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>        {/* Content area below backdrop */}
        <div className="pt-10 px-4 py-5 flex flex-col gap-3">
          {/* Title and Metadata block with tight spacing */}
          <div className="flex flex-col gap-2">
            {/* Title */}
            <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
              {title}
            </h1>

            {/* Genre and Letterboxd Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {details?.genres?.map(g => (
                <span key={g.id} className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900/85 border border-slate-850 text-slate-400 shadow-sm">
                  {g.name}
                </span>
              ))}
              {item.type === 'movie' && (
                <a
                  href={getLetterboxdUrl(title, releaseYear)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-900/85 border border-slate-850 text-slate-400 hover:text-white rounded text-[9px] font-bold uppercase transition-all cursor-pointer"
                >
                  <ExternalLink className="w-2.5 h-2.5 text-orange-400" />
                  Letterboxd
                </a>
              )}
            </div>

            {/* Runtime pill */}
            {runtime && (
              <div className="flex">
                <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-violet-955/10 border border-violet-900/20 text-violet-400 shadow-sm">
                  <Clock className="w-3 h-3 text-violet-400" />
                  {formatRuntime(runtime).toUpperCase()}
                </span>
              </div>
            )}

            {/* Release Date, Rating, Status Info */}
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[10px] text-slate-400 font-semibold">
              <span className="flex items-center gap-1 text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {releaseYear || 'Unknown Year'}
              </span>
              {details?.vote_average && (
                <span className="bg-[#081327] border border-blue-900/30 text-sky-400 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase">
                  IMDb: {details.vote_average.toFixed(1)}
                </span>
              )}
              {details?.status && (
                <span className="bg-slate-900/80 border border-slate-800/80 px-1.5 py-0.5 rounded text-[9px] font-extrabold text-slate-500 uppercase">
                  STATUS: {details.status}
                </span>
              )}
              {details?.original_language && (
                <span className="bg-slate-900/80 border border-slate-800/80 px-1.5 py-0.5 rounded text-[9px] font-extrabold text-slate-500 uppercase">
                  {LANGUAGE_NAMES[details.original_language.toLowerCase()] || details.original_language.toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* Set Status Card & Delete Button - Compact Row */}
          <div className="flex items-center gap-2 bg-[#0c111d] border border-slate-900 rounded-xl p-2 shadow-inner">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider pl-1 flex-shrink-0">List:</span>
            <div className="flex-1">
              {item.isExplore ? (
                <select
                  value={addStatus}
                  onChange={(e) => setAddStatus(e.target.value)}
                  className="w-full bg-[#070b13] border border-slate-850 rounded-lg py-1 px-2 text-xs font-semibold text-slate-350 focus:outline-none focus:border-violet-500 cursor-pointer"
                >
                  <option value="completed">Completed</option>
                  <option value="watching">Watching Now</option>
                  <option value="pending">Pending</option>
                  <option value="planned">Planned (Watchlist)</option>
                  <option value="backlog">Backlog</option>
                </select>
              ) : (
                <select
                  value={item.status || 'planned'}
                  onChange={(e) => {
                    const newStatus = e.target.value
                    if (window.confirm(`Are you sure you want to move "${title}" to ${newStatus}?`)) {
                      onUpdateItem(item.id, { status: newStatus })
                    }
                  }}
                  className="w-full bg-[#070b13] border border-slate-850 rounded-lg py-1 px-2 text-xs font-semibold text-slate-350 focus:outline-none focus:border-violet-500 cursor-pointer"
                >
                  <option value="completed">Completed</option>
                  <option value="watching">Watching Now</option>
                  <option value="pending">Pending</option>
                  <option value="planned">Planned</option>
                  <option value="backlog">Backlog</option>
                </select>
              )}
            </div>

            {/* Trash or Add button */}
            {item.isExplore ? (
              <button 
                onClick={handleAddItemFromDetails}
                className="h-8 px-3 bg-violet-650 hover:bg-violet-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-md border border-violet-500/20 flex-shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            ) : (
              <button 
                onClick={() => {
                  if(window.confirm(`Are you sure you want to delete "${title}"?`)) {
                    onRemoveItem(item.id);
                    navigate('/');
                  }
                }}
                className="h-8 w-8 bg-[#1c0f18] border border-[#3b1828] text-rose-505 hover:bg-[#2c1322] rounded-lg flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
                title="Remove Item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Where to Watch Box */}
          {watchProviders.length > 0 && (
            <div className="bg-[#0c111d] border border-slate-900 rounded-xl p-2 flex items-center justify-between gap-3 shadow-inner">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider pl-1 flex-shrink-0">Watch:</span>
              <div className="flex flex-wrap items-center gap-1.5 justify-end">
                {watchProviders.map(provider => (
                  <div key={provider.provider_id} className="flex items-center gap-1 bg-[#070b13] border border-slate-850 py-0.5 px-1.5 rounded" title={provider.provider_name}>
                    <img 
                      src={`https://image.tmdb.org/t/p/original${provider.logo_path}`} 
                      alt={provider.provider_name}
                      className="w-3.5 h-3.5 rounded-sm flex-shrink-0"
                    />
                    <span className="text-[9px] font-bold text-slate-400 truncate max-w-[70px]">{provider.provider_name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Synopsis */}
          <div>
            <h3 className="text-lg font-bold text-white mb-2">Synopsis</h3>
            <p className="text-slate-350 leading-relaxed text-sm">
              {loading ? 'Loading description...' : synopsis}
            </p>
          </div>

          {/* TV Series Stats + My Progress for TV shows */}
          {item.type === 'tv' && details && (
            <div className="flex flex-col gap-4">
              {/* Series Stats */}
              <div className="flex gap-2">
                <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-violet-400 leading-none">{seasons.length || '—'}</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-1">Total Seasons</p>
                </div>
                <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-violet-400 leading-none">{totalEpisodes || '—'}</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-1">Total Episodes</p>
                </div>
              </div>

              {/* Continue Watching / Episode Tracker */}
              {currentSeason && !item.isExplore && item.status !== 'completed' && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 h-1 bg-violet-600 transition-all duration-300" style={{ width: `${(currentEpisodesWatched / currentSeason.episode_count) * 100}%` }} />
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-white mb-0.5">Continue Watching</h3>
                      <p className="text-[10px] text-slate-400">Tracking {currentSeason.name}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-violet-400">{currentEpisodesWatched}</span>
                      <span className="text-xs text-slate-500 font-bold"> / {currentSeason.episode_count} eps</span>
                    </div>
                  </div>
                  
                  {/* Up Next Episode Preview */}
                  {upNextEpisode && (
                    <div className="flex gap-3 items-center bg-[#070b13] p-2 rounded-lg border border-slate-800/80 mb-4 shadow-inner">
                       <div className="w-20 aspect-video bg-slate-800 rounded overflow-hidden flex-shrink-0 border border-slate-700/50">
                         {upNextEpisode.still_path ? (
                           <img src={`https://image.tmdb.org/t/p/w185${upNextEpisode.still_path}`} className="w-full h-full object-cover" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center text-slate-650 text-[9px]">No Img</div>
                         )}
                       </div>
                       <div className="flex-1 min-w-0">
                         <span className="text-[9px] font-bold text-violet-400 uppercase tracking-wider mb-0.5 block">Up Next: E{upNextEpisode.episode_number}</span>
                         <h5 className="text-xs font-bold text-slate-200 truncate">{upNextEpisode.name}</h5>
                       </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleUpdateEpisodes(currentSeason.season_number, Math.max(0, currentEpisodesWatched - 1), currentSeason.episode_count)}
                      className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center hover:bg-slate-700 text-slate-350 transition-colors cursor-pointer flex-shrink-0 text-sm font-bold"
                    >
                      -
                    </button>
                    
                    <div className="flex-1 flex items-center">
                      <input 
                        type="range" 
                        min="0" 
                        max={currentSeason.episode_count} 
                        value={currentEpisodesWatched}
                        onChange={(e) => handleUpdateEpisodes(currentSeason.season_number, parseInt(e.target.value), currentSeason.episode_count)}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500 outline-none hover:bg-slate-700 transition-colors"
                      />
                    </div>
                    
                    <button 
                      onClick={() => handleUpdateEpisodes(currentSeason.season_number, currentEpisodesWatched + 1, currentSeason.episode_count)}
                      className="w-8 h-8 rounded-full bg-violet-600 border border-violet-500 flex items-center justify-center hover:bg-violet-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all cursor-pointer flex-shrink-0 text-sm font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cast */}
          {cast.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-5 bg-red-600 rounded-sm" />
                <h4 className="text-lg font-bold text-white tracking-wide">Cast</h4>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-none">
                {cast.map(actor => (
                  <div key={actor.id} className="w-[110px] flex-shrink-0 bg-[#0f1422] border border-slate-850 rounded-xl overflow-hidden flex flex-col shadow-xl">
                    <div className="aspect-[2/3] w-full bg-slate-850 relative">
                      {actor.profile_path ? (
                        <img 
                          src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`} 
                          alt={actor.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-900 font-bold text-2xl">
                          {actor.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="p-2 flex flex-col flex-1 bg-gradient-to-b from-[#0f1422] to-[#070b13]">
                      <span className="text-[10px] font-bold text-slate-200 line-clamp-1 w-full" title={actor.name}>{actor.name}</span>
                      <span className="text-[9px] text-slate-400 font-medium line-clamp-1 w-full mt-0.5" title={actor.character}>{actor.character}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Seasons for TV shows */}
          {item.type === 'tv' && seasons.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-bold text-white mb-4">Seasons</h3>
              <div className="flex flex-col gap-3">
                {seasons.map(s => (
                  <SeasonCard 
                    key={s.id} 
                    season={s} 
                    item={item} 
                    seasonsWatched={seasonsWatched} 
                    toggleSeasonWatched={toggleSeasonWatched} 
                  />
                ))}
              </div>
            </div>
          )}

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

      {/* ========================================================================= */}
      {/* DESKTOP LAYOUT (hidden md:block) */}
      {/* ========================================================================= */}
      <div className="hidden md:block">
        {backdropUrl && (
          <div className="relative w-full h-[20vh] sm:h-[30vh] lg:h-[35vh] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent z-10" />
            <div className="absolute inset-0 bg-slate-950/20 z-10" /> {/* Slight dark overlay for text readability */}
            <img 
              src={backdropUrl} 
              alt="Backdrop" 
              className="w-full h-full object-cover object-center"
            />
          </div>
        )}

        <div className={`pt-6 px-4 ${backdropUrl ? '-mt-16 sm:-mt-24 relative z-20' : ''}`}>
          <button 
            onClick={() => navigate(-1)}
            className="mb-8 flex items-center gap-2 text-slate-300 hover:text-white transition-colors cursor-pointer text-sm font-semibold bg-slate-900/80 px-4 py-2 rounded-full backdrop-blur-md w-fit border border-slate-800 shadow-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex flex-col md:flex-row gap-8 lg:gap-12 max-w-6xl mx-auto mt-4 sm:mt-12">
          {/* Left Column: Poster */}
          <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0 z-10">
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-800 shadow-slate-950/50">
              <img 
                src={getPosterUrl(posterPath)} 
                alt={title} 
                className="w-full h-auto object-cover"
              />
            </div>
            
            {/* Quick Actions / Provider Links underneath poster */}
            <div className="mt-6 flex flex-col gap-3">
              {item.isExplore ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-inner">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 text-center flex items-center justify-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-violet-400" />
                    Not in Watchlist
                  </h4>
                  
                  <div className="flex flex-col gap-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Add to List
                    </label>
                    <select
                      value={addStatus}
                      onChange={(e) => setAddStatus(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500"
                    >
                      <option value="completed">{type === 'game' ? 'Beaten (Completed)' : 'Completed'}</option>
                      <option value="watching">{type === 'game' ? 'Playing Now' : 'Watching Now'}</option>
                      <option value="pending">Pending</option>
                      <option value="planned">Plan to {type === 'game' ? 'Play' : 'Watch'}</option>
                      <option value="backlog">Backlog</option>
                    </select>
                  </div>

                  <button 
                    onClick={handleAddItemFromDetails}
                    className="w-full py-3 bg-violet-650 hover:bg-violet-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg"
                  >
                    <Plus className="w-4 h-4" />
                    Add to List
                  </button>

                  <button 
                    onClick={() => navigate(-1)}
                    className="w-full py-2.5 bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-850"
                  >
                    Go Back
                  </button>
                </div>
              ) : (
                <>
                  {item.type !== 'tv' && (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col gap-2 shadow-inner">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 text-center">Set Status</h4>
                      <select
                        value={item.status || 'planned'}
                        onChange={(e) => {
                          const newStatus = e.target.value
                          if (window.confirm(`Are you sure you want to move "${title}" to ${newStatus}?`)) {
                            onUpdateItem(item.id, { status: newStatus })
                          }
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500"
                      >
                        <option value="completed">{item.type === 'game' ? 'Beaten (Completed)' : 'Completed'}</option>
                        <option value="watching">{item.type === 'game' ? 'Playing Now' : 'Watching Now'}</option>
                        <option value="pending">Pending</option>
                        <option value="planned">Plan to {item.type === 'game' ? 'Play' : 'Watch'}</option>
                        <option value="backlog">Backlog</option>
                      </select>
                    </div>
                  )}

                  <button 
                    onClick={() => {
                      if(window.confirm(`Are you sure you want to delete "${title}"?`)) {
                        onRemoveItem(item.id);
                        navigate('/');
                      }
                    }}
                    className="w-full py-3 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer mt-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                </>
              )}
              {item.type === 'movie' && (
                <a
                  href={getLetterboxdUrl(title, releaseYear)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-none text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md text-center"
                >
                  <ExternalLink className="w-4 h-4 text-orange-400" />
                  Letterboxd
                </a>
              )}

              {/* Watch Providers under poster column */}
              {watchProviders.length > 0 && (
                <div className="mt-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-inner">
                  <h4 className="text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-3 text-center">Where to Watch</h4>
                  <div className="flex flex-col gap-2">
                    {watchProviders.map(provider => (
                      <div key={provider.provider_id} className="flex items-center gap-2.5 bg-slate-950 border border-slate-850 p-2 rounded-xl" title={provider.provider_name}>
                        <img 
                          src={`https://image.tmdb.org/t/p/original${provider.logo_path}`} 
                          alt={provider.provider_name}
                          className="w-7 h-7 rounded-lg flex-shrink-0"
                        />
                        <span className="text-xs font-semibold text-slate-300 truncate">{provider.provider_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Right Column: Details */}
          <div className="flex-1 min-w-0 flex flex-col z-10">
            <div className="mb-6">
              <div className="flex items-center flex-wrap gap-3 mb-3">
                {item.status ? (
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${getStatusBadgeColor(item.status)}`}>
                    {getStatusLabel(item.status)}
                  </span>
                ) : (
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold border bg-slate-800 text-slate-300 border-slate-700`}>
                    Unlogged
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-md backdrop-blur-sm border border-slate-700">
                  {item.type === 'movie' && <Film className="w-3.5 h-3.5 text-violet-400" />}
                  {item.type === 'tv' && <Tv className="w-3.5 h-3.5 text-violet-400" />}
                  {item.type === 'game' && <Gamepad className="w-3.5 h-3.5 text-violet-400" />}
                  {getTypeLabel()}
                </span>
                {contentRating !== 'NR' && (
                  <span className="text-xs font-bold text-slate-300 border border-slate-600 px-2 rounded backdrop-blur-sm">
                    {contentRating}
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight drop-shadow-md">
                  {title}
                </h1>
                <div className="flex items-center gap-3">
                  {(item.type === 'movie' || item.type === 'tv') && movieSources.length > 0 && (
                    <button
                      onClick={() => setIsPlayerOpen(true)}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-650 to-indigo-650 hover:from-violet-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-full font-bold transition-all hover:scale-105 shadow-xl cursor-pointer text-sm"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      {item.type === 'movie' ? 'Play Movie' : 'Play Show'}
                    </button>
                  )}
                  {(item.type === 'movie' || item.type === 'tv') && resolvedDownloadSources.length > 0 && (
                    <button
                      onClick={() => setIsDownloadOpen(true)}
                      className="inline-flex items-center justify-center p-2.5 rounded-full bg-slate-900 border border-slate-850 hover:border-slate-700 text-slate-300 hover:text-white transition-all hover:scale-105 cursor-pointer shadow-lg"
                      title="Download Options"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {item.type === 'tv' && item.season_number && (
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-flex items-center gap-1.5 bg-violet-600/20 border border-violet-500/40 text-violet-300 text-sm font-black px-3 py-1 rounded-full tracking-wide">
                    <Tv className="w-3.5 h-3.5" />
                    Season {item.season_number}
                  </span>
                </div>
              )}
              
              {((details?.genres && details.genres.length > 0) || runtime) && (
                <div className="flex flex-wrap items-center gap-2 mb-6">
                  {details?.genres?.map(g => (
                    <span key={g.id} className="text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-slate-800/80 backdrop-blur-sm border border-slate-700 text-slate-300 shadow-sm">
                      {g.name}
                    </span>
                  ))}
                  {runtime && (
                    <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-violet-650/10 text-violet-400 border border-violet-500/20 shadow-sm backdrop-blur-sm">
                      <Clock className="w-3.5 h-3.5" />
                      {formatRuntime(runtime)}
                    </span>
                  )}
                </div>
              )}
              
              <div className="flex items-center flex-wrap gap-6 text-sm text-slate-300 font-medium mb-6">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {releaseYear || 'Unknown Year'}
                  </span>
                {details?.vote_average && (
                  <span className="flex items-center gap-1.5 bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded-lg border border-sky-500/20 font-bold">
                    IMDb / TMDB: {details.vote_average.toFixed(1)}
                  </span>
                )}
                {details?.status && (
                  <span className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded text-xs font-semibold text-slate-400">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Status:</span>
                    <span className="text-slate-350">{details.status}</span>
                  </span>
                )}
                {details?.original_language && (
                  <span className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded text-xs font-semibold text-slate-400">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Language:</span>
                    <span className="text-slate-355">{LANGUAGE_NAMES[details.original_language.toLowerCase()] || details.original_language.toUpperCase()}</span>
                  </span>
                )}
              </div>

              {/* Synopsis */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-white mb-2">Synopsis</h3>
                <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                  {loading ? 'Loading description...' : synopsis}
                </p>
              </div>

              {/* TV Series Stats + My Progress */}
              {item.type === 'tv' && details && (
                <>
                  {/* Series Stats */}
                  <div className="flex gap-3 mb-6">
                    <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                      <p className="text-3xl font-black text-violet-400 leading-none">{seasons.length || '—'}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1.5">Total Seasons</p>
                    </div>
                    <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                      <p className="text-3xl font-black text-violet-400 leading-none">{totalEpisodes || '—'}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1.5">Total Episodes</p>
                    </div>
                  </div>

                  {/* My Progress */}
                  {!item.isExplore && allShowItems.length > 0 && (
                    <div className="mb-8 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-inner backdrop-blur">
                      <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">My Progress</h3>

                      {/* Seasons progress */}
                      <div className="mb-4">
                        <div className="flex justify-between items-baseline mb-1.5">
                          <span className="text-xs font-semibold text-slate-300">Seasons Completed</span>
                          <span className="text-sm font-black text-violet-300">
                            {myTotalSeasonsWatched}
                            <span className="text-slate-500 font-semibold"> / {seasons.length}</span>
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full transition-all duration-500"
                            style={{ width: seasons.length > 0 ? `${(myTotalSeasonsWatched / seasons.length) * 100}%` : '0%' }}
                          />
                        </div>
                      </div>

                      {/* Episodes progress */}
                      <div>
                        <div className="flex justify-between items-baseline mb-1.5">
                          <span className="text-xs font-semibold text-slate-300">Episodes Completed</span>
                          <span className="text-sm font-black text-emerald-400">
                            {myTotalEpisodesWatched}
                            <span className="text-slate-500 font-semibold"> / {totalEpisodes}</span>
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-500"
                            style={{ width: totalEpisodes > 0 ? `${(myTotalEpisodesWatched / totalEpisodes) * 100}%` : '0%' }}
                          />
                        </div>
                        {watchingSeasonItems.length > 0 && (
                          <p className="text-[10px] text-slate-500 mt-1.5">
                            Includes {myEpisodesFromWatching} ep{myEpisodesFromWatching !== 1 ? 's' : ''} in-progress
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
              {item.type === 'tv' && currentSeason && !item.isExplore && item.status !== 'completed' && (
                <div className="mb-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 h-1 bg-violet-600 transition-all duration-300" style={{ width: `${(currentEpisodesWatched / currentSeason.episode_count) * 100}%` }} />
                  <div className="flex justify-between items-end mb-5">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">Continue Watching</h3>
                      <p className="text-sm text-slate-400">Tracking {currentSeason.name}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-violet-400">{currentEpisodesWatched}</span>
                      <span className="text-sm text-slate-500 font-bold"> / {currentSeason.episode_count} eps</span>
                    </div>
                  </div>
                  
                  {/* Up Next Episode Preview */}
                  {upNextEpisode && (
                    <div className="flex gap-4 items-center bg-slate-950/50 p-3 rounded-xl border border-slate-800/80 mb-5 shadow-inner">
                       <div className="w-24 aspect-video bg-slate-800 rounded-lg overflow-hidden flex-shrink-0 border border-slate-700/50">
                         {upNextEpisode.still_path ? (
                           <img src={`https://image.tmdb.org/t/p/w185${upNextEpisode.still_path}`} className="w-full h-full object-cover" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center text-slate-600 text-[10px]">No Img</div>
                         )}
                       </div>
                       <div className="flex-1 min-w-0">
                         <span className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-1 block">Up Next: E{upNextEpisode.episode_number}</span>
                         <h5 className="text-sm font-bold text-slate-200 truncate">{upNextEpisode.name}</h5>
                         <p className="text-xs text-slate-500 mt-0.5">{upNextEpisode.air_date ? new Date(upNextEpisode.air_date).toLocaleDateString() : 'TBA'}</p>
                       </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleUpdateEpisodes(currentSeason.season_number, Math.max(0, currentEpisodesWatched - 1), currentSeason.episode_count)}
                      className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer flex-shrink-0 font-bold"
                    >
                      -
                    </button>
                    
                    <div className="flex-1 flex items-center">
                      <input 
                        type="range" 
                        min="0" 
                        max={currentSeason.episode_count} 
                        value={currentEpisodesWatched}
                        onChange={(e) => handleUpdateEpisodes(currentSeason.season_number, parseInt(e.target.value), currentSeason.episode_count)}
                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500 outline-none hover:bg-slate-700 transition-colors"
                      />
                    </div>
                    
                    <button 
                      onClick={() => handleUpdateEpisodes(currentSeason.season_number, currentEpisodesWatched + 1, currentSeason.episode_count)}
                      className="w-10 h-10 rounded-full bg-violet-600 border border-violet-500 flex items-center justify-center hover:bg-violet-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all cursor-pointer flex-shrink-0 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Credits Grid */}
              {(director !== 'Unknown' || cast.length > 0) && (
                <div className="mb-8 border-y border-slate-800/50 py-6">
                  {director !== 'Unknown' && (
                    <div className="mb-6">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Director</h4>
                      <p className="text-slate-200 text-sm font-semibold">{director}</p>
                    </div>
                  )}
                  {cast.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Top Cast</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                        {cast.map(actor => (
                          <div key={actor.id} className="bg-slate-900 border border-slate-800/80 rounded-xl overflow-hidden flex flex-col shadow-xl transition-transform hover:scale-105 hover:border-violet-500/30">
                            <div className="aspect-[2/3] w-full bg-slate-800 relative">
                              {actor.profile_path ? (
                                <img 
                                  src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`} 
                                  alt={actor.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-600 font-bold text-4xl">
                                  {actor.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div className="p-3 flex flex-col flex-1 bg-gradient-to-b from-slate-900 to-slate-950">
                              <span className="text-sm font-bold text-slate-200 line-clamp-1 w-full" title={actor.name}>{actor.name}</span>
                              <span className="text-xs text-violet-400 font-medium line-clamp-1 w-full mt-1" title={actor.character}>{actor.character}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}



              {/* Franchise Collection Section */}
              {collectionDetails && sortedParts.length > 0 && (
                <div className="mb-8 border-b border-slate-800/50 pb-8">
                  <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-violet-400" />
                    Part of the {collectionDetails.name}
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Explore the entire franchise, ordered by release date.
                  </p>
                  
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
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
                          className={`flex-shrink-0 w-36 bg-slate-900/60 border rounded-none overflow-hidden shadow-lg transition-all duration-300 flex flex-col group ${
                            isCurrent 
                              ? 'border-violet-500 ring-1 ring-violet-500/20 opacity-95'
                              : 'border-slate-800 hover:border-slate-700/80 cursor-pointer hover:scale-[1.02]'
                          }`}
                        >
                          <div className="aspect-[2/3] w-full bg-slate-950 relative overflow-hidden">
                            {part.poster_path ? (
                              <img 
                                src={`https://image.tmdb.org/t/p/w185${part.poster_path}`} 
                                alt={part.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-600 font-bold text-4xl rounded-none">
                                {part.title.charAt(0)}
                              </div>
                            )}
                            
                            {/* Current badge */}
                            {isCurrent && (
                              <div className="absolute top-2 left-2 bg-violet-600/90 backdrop-blur text-white text-[9px] font-black px-1.5 py-0.5 rounded-none tracking-wider shadow-md">
                                CURRENT
                              </div>
                            )}

                            {/* Watch status overlay if logged in library */}
                            {watchlistInstance && (
                              <div className="absolute top-2 right-2 bg-emerald-500/95 backdrop-blur text-white p-1 rounded-none shadow-md border border-emerald-400/20" title={getStatusLabel(watchlistInstance.status)}>
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            )}
                          </div>
                          
                          <div className="p-2.5 flex flex-col flex-grow justify-between min-h-[72px] bg-gradient-to-b from-slate-900 to-slate-950">
                            <span className={`text-xs font-bold line-clamp-2 w-full transition-colors ${isCurrent ? 'text-violet-400' : 'text-slate-200 group-hover:text-white'}`} title={part.title}>
                              {part.title}
                            </span>
                            <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500 font-semibold">
                              <span>{partYear}</span>
                              {watchlistInstance && (
                                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wide">
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
                  <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                    My Notes & Review
                  </h3>
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 min-h-[120px] backdrop-blur-md shadow-inner">
                    {item.review ? (
                      <p className="text-slate-300 leading-relaxed whitespace-pre-wrap text-sm md:text-base">{item.review}</p>
                    ) : (
                      <p className="text-slate-500 italic text-sm">No notes or review written for this item yet. Use the Quick Edit button in your watchlist to add some!</p>
                    )}
                  </div>
                  
                  <div className="mt-4 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                    <span>Added to list: {new Date(item.created_at).toLocaleDateString()}</span>
                    {item.watched_at && <span>Last Activity: {new Date(item.watched_at).toLocaleDateString()}</span>}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
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
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/40 border border-slate-850 hover:border-violet-500/40 hover:bg-violet-950/10 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 mr-3">
                    <div className="p-2.5 rounded-xl bg-violet-600/10 text-violet-400 border border-violet-500/20 group-hover:bg-violet-650 group-hover:text-white transition-all flex-shrink-0">
                      <Download className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-white text-sm group-hover:text-violet-400 transition-colors truncate">
                        {source.name}
                      </div>
                      <div className="text-[10px] font-mono text-slate-550 truncate" title={source.url}>
                        {source.url}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-extrabold text-violet-400 uppercase tracking-wider group-hover:text-violet-300 transition-colors flex-shrink-0">
                    Open Link
                    <ExternalLink className="w-3.5 h-3.5" />
                  </div>
                </a>
              ))}

              {resolvedDownloadSources.length === 0 && (
                <div className="text-center py-12 text-slate-500 text-sm">
                  No download sources configured yet. Go to Configuration &gt; Choose Sources to add one.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
