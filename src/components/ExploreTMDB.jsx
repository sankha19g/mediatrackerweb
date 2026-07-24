import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Search, Film, Tv, Plus, Check, Star, Calendar, Loader, ListChecks, CheckSquare, Square, X, ChevronLeft, ChevronRight, Flame, Sparkles, Trophy, TrendingUp, Info, Play, ArrowLeft, User, Building2, SlidersHorizontal } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { fetchTMDB, getPosterUrl, isTMDBConfigured } from '../lib/tmdb'
import { isFirebaseConfigured, loadFirebaseLists, updateFirebaseListItems } from '../lib/firebase'

const COUNTRY_MAP = {
  'US': 'United States',
  'GB': 'United Kingdom',
  'JP': 'Japan',
  'KR': 'South Korea',
  'FR': 'France',
  'IT': 'Italy',
  'ES': 'Spain',
  'DE': 'Germany',
  'IN': 'India',
  'CN': 'China',
  'HK': 'Hong Kong',
  'TW': 'Taiwan',
  'CA': 'Canada',
  'AU': 'Australia',
  'NZ': 'New Zealand',
  'BR': 'Brazil',
  'MX': 'Mexico',
  'DK': 'Denmark',
  'SE': 'Sweden',
  'NO': 'Norway',
  'FI': 'Finland',
  'NL': 'Netherlands',
  'PL': 'Poland',
  'RU': 'Russia',
  'TH': 'Thailand',
  'TR': 'Turkey',
}

const LANG_TO_COUNTRY = {
  'en': 'United States',
  'ja': 'Japan',
  'ko': 'South Korea',
  'fr': 'France',
  'it': 'Italy',
  'es': 'Spain',
  'de': 'Germany',
  'hi': 'India',
  'zh': 'China',
  'cn': 'China',
  'ru': 'Russia',
  'pt': 'Brazil',
  'th': 'Thailand',
}

const getCountryFromTMDBItem = (item) => {
  if (item.origin_country && Array.isArray(item.origin_country) && item.origin_country.length > 0) {
    const code = item.origin_country[0].toUpperCase()
    return COUNTRY_MAP[code] || code
  }
  if (item.original_language) {
    const lang = item.original_language.toLowerCase()
    return LANG_TO_COUNTRY[lang] || 'Unknown'
  }
  return 'Unknown'
}

const getItemMediaType = (item) => {
  if (item.media_type) return item.media_type
  if (item.profile_path) return 'person'
  if (item.logo_path) return 'company'
  return item.title ? 'movie' : 'tv'
}

const getStatusLabelAndStyle = (status) => {
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

// Sub-component for horizontal scrolling category rows
const CategoryRow = ({ title, subtitle, icon: Icon, items, watchedItems, openAddDialog, navigate, isSelectMode, selectedItems, setSelectedItems }) => {
  const rowRef = useRef(null)

  const scroll = (direction) => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current
      const scrollAmount = clientWidth * 0.75
      rowRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  if (!items || items.length === 0) return null

  return (
    <div className="mb-10 relative group/row">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              {title}
            </h2>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>

        {/* Scroll arrows */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => scroll('left')}
            className="w-8 h-8 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-md"
            title="Scroll Left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-8 h-8 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-md"
            title="Scroll Right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Row Items Container */}
      <div
        ref={rowRef}
        className="flex gap-4 overflow-x-auto scrollbar-none scroll-smooth pb-4 px-2 snap-x"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item) => {
          const mediaType = getItemMediaType(item)
          const isMovie = mediaType === 'movie'
          const releaseDate = isMovie ? item.release_date : item.first_air_date
          const releaseYear = releaseDate ? releaseDate.split('-')[0] : 'N/A'
          const cardKey = item.id.toString()
          const isSelected = !!selectedItems[cardKey]

          const watched = watchedItems.find(wi =>
            wi.type === mediaType && wi.tmdb_id === item.id.toString() && wi.status !== 'list_only'
          )

          return (
            <div
              key={cardKey}
              className={`flex-shrink-0 w-36 sm:w-44 md:w-48 lg:w-[calc((100%-96px)/7)] group/card relative bg-slate-900/40 border rounded-2xl overflow-hidden shadow-lg transition-all duration-300 flex flex-col snap-start ${
                isSelectMode && isSelected
                  ? 'border-violet-500 ring-2 ring-violet-500/20 shadow-violet-500/10'
                  : 'border-slate-800/80 hover:border-slate-700/80 hover:-translate-y-1'
              }`}
            >

              {/* Poster Image */}
              <div
                className="aspect-[2/3] w-full relative overflow-hidden bg-slate-950 cursor-pointer"
                onClick={() => {
                  if (isSelectMode) {
                    setSelectedItems(prev => {
                      const next = { ...prev }
                      if (next[cardKey]) delete next[cardKey]
                      else next[cardKey] = item
                      return next
                    })
                  } else {
                    navigate(`/explore/${mediaType}/${item.id}`)
                  }
                }}
              >
                <img
                  src={getPosterUrl(item.poster_path)}
                  alt={isMovie ? item.title : item.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                  loading="lazy"
                />

                {/* Select checkbox overlay */}
                {isSelectMode && (
                  <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[1px] flex items-center justify-center">
                    <div className="p-2 rounded-full bg-slate-900 border border-slate-700">
                      {isSelected ? (
                        <CheckSquare className="w-6 h-6 text-violet-400 fill-violet-400/20" />
                      ) : (
                        <Square className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                  </div>
                )}

                {/* Watched check badge */}
                {!isSelectMode && watched && (
                  <div className={`absolute inset-x-0 bottom-0 backdrop-blur-md border-t text-[11px] font-bold py-1 px-2 flex items-center justify-center gap-1 ${getStatusLabelAndStyle(watched.status).containerStyle}`}>
                    <Check className={`w-3.5 h-3.5 ${getStatusLabelAndStyle(watched.status).iconColor}`} />
                    <span>{getStatusLabelAndStyle(watched.status).label}</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Sub-component for Person (Actor/Director) and Company (Studio) Details
const DetailView = ({ detail, onBack, isFromState, watchedItems, onAddItem, navigate }) => {
  const [data, setData] = useState(null)
  const [works, setWorks] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [worksSearchQuery, setWorksSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [fadeWatched, setFadeWatched] = useState(false)
  const [profileImages, setProfileImages] = useState([])
  const [bioExpanded, setBioExpanded] = useState(false)
  const [sortBy, setSortBy] = useState('release_date')
  const [mediaFilter, setMediaFilter] = useState('all')
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    setCurrentPage(1)
    setWorksSearchQuery('')
  }, [detail])

  useEffect(() => {
    setCurrentPage(1)
  }, [sortBy, mediaFilter, worksSearchQuery])

  const filteredAndSortedWorks = useMemo(() => {
    let result = [...works]

    // 1. Filter
    if (mediaFilter === 'movie') {
      result = result.filter(item => (item.media_type || (item.title ? 'movie' : 'tv')) === 'movie')
    } else if (mediaFilter === 'tv') {
      result = result.filter(item => (item.media_type || (item.title ? 'movie' : 'tv')) === 'tv')
    }

    // 2. Search
    if (worksSearchQuery.trim()) {
      const q = worksSearchQuery.toLowerCase()
      result = result.filter(item => 
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.name && item.name.toLowerCase().includes(q))
      )
    }

    // 3. Sort
    if (sortBy === 'release_date') {
      result.sort((a, b) => {
        const dateA = a.release_date || a.first_air_date || ''
        const dateB = b.release_date || b.first_air_date || ''
        return dateB.localeCompare(dateA)
      })
    } else if (sortBy === 'rating') {
      result.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
    } else if (sortBy === 'my_list') {
      result.sort((a, b) => {
        const getRank = (item) => {
          const mType = item.media_type || (item.title ? 'movie' : 'tv')
          const wi = watchedItems.find(w => w.type === mType && w.tmdb_id === item.id.toString() && w.status !== 'list_only')
          if (!wi) return 4
          if (wi.status === 'completed') return 1
          if (wi.status === 'watching') return 2
          if (wi.status === 'planned') return 3
          return 4
        }
        const rankA = getRank(a)
        const rankB = getRank(b)
        if (rankA !== rankB) {
          return rankA - rankB
        }
        // Fallback to popularity
        return (b.popularity || 0) - (a.popularity || 0)
      })
    } else {
      result.sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    }

    return result
  }, [works, sortBy, mediaFilter, worksSearchQuery, watchedItems])

  const ITEMS_PER_PAGE = 30
  const totalPages = Math.ceil(filteredAndSortedWorks.length / ITEMS_PER_PAGE) || 1
  const paginatedWorks = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredAndSortedWorks.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredAndSortedWorks, currentPage])

  useEffect(() => {
    let active = true
    const fetchDetails = async () => {
      setLoading(true)
      setError('')
      try {
        if (detail.type === 'person') {
          // Fetch person details, credits, and profile images in parallel
          const [detailsRes, creditsRes, imagesRes] = await Promise.all([
            fetchTMDB(`/person/${detail.id}`),
            fetchTMDB(`/person/${detail.id}/combined_credits`),
            fetchTMDB(`/person/${detail.id}/images`)
          ])
          if (!active) return
          setData(detailsRes)
          setProfileImages((imagesRes.profiles || []).map(p => p.file_path))
          
          // Sort credits by popularity and filter to unique ones with posters
          const uniqueWorks = []
          const seen = new Set()
          const sortedCredits = (creditsRes.cast || []).concat(creditsRes.crew || [])
            .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
          
          for (const item of sortedCredits) {
            const key = `${item.media_type || (item.title ? 'movie' : 'tv')}_${item.id}`
            if (!seen.has(key) && item.poster_path) {
              seen.add(key)
              uniqueWorks.push(item)
            }
          }
          setWorks(uniqueWorks) // Store complete filmography to allow full-list sorting/filtering
        } else if (detail.type === 'company') {
          // Fetch company details
          const detailsRes = await fetchTMDB(`/company/${detail.id}`)
          if (!active) return
          setData(detailsRes)
          setProfileImages([])

          // Fetch movies and TV shows from this company
          const [moviesRes, tvRes] = await Promise.all([
            fetchTMDB('/discover/movie', { with_companies: detail.id, sort_by: 'popularity.desc' }),
            fetchTMDB('/discover/tv', { with_companies: detail.id, sort_by: 'popularity.desc' })
          ])
          if (!active) return

          const movieItems = (moviesRes.results || []).map(i => ({ ...i, media_type: 'movie' }))
          const tvItems = (tvRes.results || []).map(i => ({ ...i, media_type: 'tv' }))
          const combined = [...movieItems, ...tvItems]
            .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
            .filter(i => i.poster_path)
          
          setWorks(combined) // Store complete studio catalog to allow full-list sorting/filtering
        }
      } catch (err) {
        console.error('Error fetching details:', err)
        if (active) setError('Failed to load details.')
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchDetails()
    return () => {
      active = false
    }
  }, [detail])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 text-slate-400">
        <Loader className="w-10 h-10 animate-spin text-violet-500" />
        <span className="text-sm font-semibold">Loading details...</span>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="text-center py-20 text-slate-400">
        <p className="text-rose-400 font-bold mb-4">{error || 'Something went wrong'}</p>
        <button 
          onClick={onBack} 
          className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-white hover:bg-slate-800 cursor-pointer"
        >
          {isFromState ? 'Back' : 'Back to Explore'}
        </button>
      </div>
    )
  }

  const isPerson = detail.type === 'person'

  const getAge = (birthday, deathday) => {
    if (!birthday) return ''
    const birthDate = new Date(birthday)
    const endDate = deathday ? new Date(deathday) : new Date()
    let age = endDate.getFullYear() - birthDate.getFullYear()
    const m = endDate.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && endDate.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const watchedCount = works.filter(item => {
    const mediaType = item.media_type || (item.title ? 'movie' : 'tv')
    return watchedItems.some(wi => wi.type === mediaType && wi.tmdb_id === item.id.toString() && wi.status !== 'list_only')
  }).length

  return (
    <div className="animate-fade-in">
      {/* Backdrop collage / blur banner */}
      <div className="w-screen relative left-1/2 -translate-x-1/2 h-48 sm:h-64 overflow-hidden z-0 bg-black mb-8">
        {/* Overlaid back button & title */}
        <div className="absolute inset-x-0 top-0 z-20 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 flex items-center justify-between">
          <button 
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            {isFromState ? 'Back' : 'Back to Explore'}
          </button>
          <span className="text-xs font-bold text-slate-400 bg-black/85 backdrop-blur-md px-3 py-1 rounded-full border border-slate-800 uppercase tracking-wider">
            {isPerson ? 'Artist Profile' : 'Production Studio'}
          </span>
        </div>
        {isPerson && profileImages.length > 0 ? (
          <div className="absolute inset-0 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 opacity-35 filter blur-[0.5px]">
            {profileImages.slice(0, 5).map((path, idx) => (
              <div key={idx} className="relative aspect-[2/3] w-full h-full overflow-hidden">
                <img
                  src={`https://image.tmdb.org/t/p/w300${path}`}
                  alt="Backdrop collage image"
                  className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        ) : (
          /* Stylish blur background */
          <div className="absolute inset-0 overflow-hidden">
            {isPerson && data?.profile_path ? (
              <img
                src={getPosterUrl(data.profile_path)}
                alt="Blurred profile"
                className="w-full h-full object-cover scale-125 opacity-20 filter blur-2xl"
              />
            ) : (
              /* Gradient mesh for studio or fallback */
              <div className="absolute inset-0 bg-gradient-to-br from-violet-900/30 via-indigo-900/20 to-black opacity-40 filter blur-xl" />
            )}
          </div>
        )}
        {/* Gradients to fade collage into the dark page background */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black z-10" />
      </div>

      {/* Centered Profile Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16">
        {/* Profile/Detail Banner Header */}
        <div className="relative z-10 bg-slate-950/80 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row gap-6 sm:gap-8 items-start shadow-2xl -mt-20 sm:-mt-28">
        {/* Poster / Logo */}
        <div className={`w-32 sm:w-40 aspect-[2/3] rounded-2xl overflow-hidden border shadow-2xl flex-shrink-0 flex items-center justify-center ${!isPerson ? 'bg-white border-slate-200 p-4' : 'bg-slate-950 border-slate-800'}`}>
          {isPerson ? (
            <img 
              src={getPosterUrl(data.profile_path)} 
              alt={data.name} 
              className="w-full h-full object-cover"
            />
          ) : (
            data.logo_path ? (
              <img 
                src={`https://image.tmdb.org/t/p/w300${data.logo_path}`} 
                alt={data.name} 
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-slate-950 font-extrabold text-xl text-center leading-tight">{data.name}</div>
            )
          )}
        </div>

        {/* Text Details */}
        <div className="flex-1 min-w-0 space-y-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
              {data.name}
            </h1>
            {isPerson && data.known_for_department && (
              <p className="text-xs sm:text-sm font-extrabold text-violet-400 uppercase tracking-wider mt-1">
                {data.known_for_department}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-300">
            {isPerson ? (
              <>
                {data.birthday && (
                  <div>
                    <span className="text-slate-500 font-medium block">Age</span>
                    <span className="text-white font-bold">
                      {getAge(data.birthday, data.deathday)} years old
                      {data.deathday ? ' (at death)' : ''}
                      {data.place_of_birth ? ` (Born in ${data.place_of_birth})` : ''}
                    </span>
                  </div>
                )}
                {data.deathday && (
                  <div>
                    <span className="text-slate-500 font-medium block">Died</span>
                    <span className="text-white font-bold">{data.deathday}</span>
                  </div>
                )}
              </>
            ) : (
              <>
                {data.headquarters && (
                  <div>
                    <span className="text-slate-500 font-medium block">Headquarters</span>
                    <span className="text-white font-bold">{data.headquarters}</span>
                  </div>
                )}
                {data.homepage && (
                  <div>
                    <span className="text-slate-500 font-medium block">Website</span>
                    <a href={data.homepage} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline font-bold truncate block">
                      {data.homepage}
                    </a>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Biography/Overview */}
          {(data.biography || data.description) && (
            <div className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-4xl pt-2 border-t border-slate-800/40">
              <p 
                onClick={() => setBioExpanded(!bioExpanded)}
                className={`whitespace-pre-line text-slate-400 cursor-pointer transition-all duration-350 ${
                  bioExpanded ? '' : 'line-clamp-6'
                }`}
                title={bioExpanded ? "Click to collapse" : "Click to expand biography"}
              >
                {data.biography || data.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Grid of Work Credits */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <h2 className="text-xl font-black text-white flex items-center gap-2 tracking-tight">
            <Film className="w-5 h-5 text-violet-400" />
            Featured Filmography / Productions
          </h2>
          
          <div className="flex items-center gap-4 relative">
            <input
              type="text"
              placeholder="Search films..."
              value={worksSearchQuery}
              onChange={(e) => setWorksSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-800 focus:border-violet-500 focus:outline-none rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 w-32 sm:w-40 transition-all focus:w-48"
            />
            <span className="text-xs font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-lg">
              {watchedCount} films watched
            </span>
            {works.length > 0 && (
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <span className="text-xs font-bold text-slate-400">Fade Watched</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={fadeWatched}
                    onChange={(e) => setFadeWatched(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-850 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-slate-400 after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600 peer-checked:after:bg-white peer-checked:after:border-transparent"></div>
                </div>
              </label>
            )}

            {/* Sort & Filter Dropdown trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                  showDropdown || mediaFilter !== 'all' || sortBy !== 'popularity'
                    ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
                title="Sort & Filter"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-52 bg-[#0d111d] border border-slate-800 rounded-2xl shadow-2xl p-4 z-40 space-y-4">
                  {/* Filter Section */}
                  <div className="space-y-1.5">
                    <span className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Filter By</span>
                    <div className="flex flex-col gap-1">
                      {[
                        { id: 'all', label: 'All Projects', count: works.length },
                        { id: 'movie', label: 'Movies', count: works.filter(item => (item.media_type || (item.title ? 'movie' : 'tv')) === 'movie').length },
                        { id: 'tv', label: 'TV Shows', count: works.filter(item => (item.media_type || (item.title ? 'movie' : 'tv')) === 'tv').length }
                      ].map(opt => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setMediaFilter(opt.id)
                            setShowDropdown(false)
                          }}
                          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            mediaFilter === opt.id
                              ? 'bg-violet-600/20 text-violet-300 border border-violet-500/20'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent'
                          }`}
                        >
                          <span>{opt.label}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold transition-colors ${
                            mediaFilter === opt.id ? 'bg-violet-500/30 text-violet-200' : 'bg-slate-800 text-slate-500'
                          }`}>
                            {opt.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sort Section */}
                  <div className="space-y-1.5 border-t border-slate-800/80 pt-3">
                    <span className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Sort By</span>
                    <div className="flex flex-col gap-1">
                      {[
                        { id: 'popularity', label: 'Popularity' },
                        { id: 'release_date', label: 'Release Date' },
                        { id: 'rating', label: 'TMDB Rating' },
                        { id: 'my_list', label: 'My List (Status)' }
                      ].map(opt => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setSortBy(opt.id)
                            setShowDropdown(false)
                          }}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            sortBy === opt.id
                              ? 'bg-violet-600/20 text-violet-300 border border-violet-500/20'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {filteredAndSortedWorks.length === 0 ? (
          <div className="text-center py-12 text-slate-500 italic text-sm">
            No movie or TV show credits found matching these filters.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-3 sm:gap-6">
              {paginatedWorks.map((item) => {
                const mediaType = item.media_type || (item.title ? 'movie' : 'tv')
                const isMovie = mediaType === 'movie'
                const releaseDate = isMovie ? item.release_date : item.first_air_date
                const releaseYear = releaseDate ? releaseDate.split('-')[0] : 'N/A'
                const cardKey = `work_${item.id}`
                const watched = watchedItems.find(wi =>
                  wi.type === mediaType && wi.tmdb_id === item.id.toString() && wi.status !== 'list_only'
                )

                return (
                  <div
                    key={cardKey}
                    className={`group/card relative rounded-2xl overflow-hidden shadow-lg transition-all duration-300 ${
                      fadeWatched && watched ? 'opacity-30 grayscale-[30%] brightness-[60%] hover:opacity-100 hover:grayscale-0 hover:brightness-100' : ''
                    }`}
                  >
                    {/* Media Type & Rating Badges */}
                    <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1">
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md backdrop-blur-md border ${
                        isMovie ? 'bg-sky-500/80 text-white border-sky-400/30' : 'bg-indigo-500/80 text-white border-indigo-400/30'
                      }`}>
                        {isMovie ? 'Movie' : 'TV'}
                      </span>
                    </div>

                    <div className="absolute top-2.5 right-2.5 z-10">
                      <span className="text-[10px] font-bold bg-slate-950/80 backdrop-blur-md text-amber-400 px-2 py-0.5 rounded-md border border-amber-400/20 flex items-center gap-1 shadow-md">
                        <Star className="w-3 h-3 fill-amber-400" />
                        {(item.vote_average || 0).toFixed(1)}
                      </span>
                    </div>

                    {/* Poster Image */}
                    <div
                      className="aspect-[2/3] w-full relative overflow-hidden bg-slate-950 cursor-pointer"
                      onClick={() => navigate(`/explore/${mediaType}/${item.id}`)}
                    >
                      <img
                        src={getPosterUrl(item.poster_path)}
                        alt={isMovie ? item.title : item.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                        loading="lazy"
                      />

                      {watched && (
                        <div className={`absolute inset-x-0 bottom-0 backdrop-blur-md border-t text-[11px] font-bold py-1 px-2 flex items-center justify-center gap-1 ${getStatusLabelAndStyle(watched.status).containerStyle}`}>
                          <Check className={`w-3.5 h-3.5 ${getStatusLabelAndStyle(watched.status).iconColor}`} />
                          <span>{getStatusLabelAndStyle(watched.status).label}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-8">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    currentPage === 1
                      ? 'bg-slate-900/40 border-slate-950 text-slate-600 cursor-not-allowed opacity-50'
                      : 'bg-[#101424] hover:bg-[#181e36] border-slate-800 text-slate-350 hover:text-white active:scale-95'
                  }`}
                >
                  Previous
                </button>
                <span className="text-xs font-bold text-slate-400">
                  Page <span className="text-white">{currentPage}</span> of <span className="text-white">{totalPages}</span>
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    currentPage === totalPages
                      ? 'bg-slate-900/40 border-slate-950 text-slate-600 cursor-not-allowed opacity-50'
                      : 'bg-[#101424] hover:bg-[#181e36] border-slate-800 text-slate-350 hover:text-white active:scale-95'
                  }`}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  </div>
  )
}

function ScrollableRow({ children }) {
  const rowRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = () => {
    if (rowRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = rowRef.current
      setCanScrollLeft(scrollLeft > 1)
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1)
    }
  }

  useEffect(() => {
    checkScroll()
    // Small delay to allow items to render and get proper width
    const timer = setTimeout(checkScroll, 300)
    window.addEventListener('resize', checkScroll)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', checkScroll)
    }
  }, [children])

  const scroll = (direction) => {
    if (rowRef.current) {
      const scrollAmount = rowRef.current.clientWidth * 0.75
      rowRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div className="relative group/scrollrow w-full">
      {/* Left Fade Overlay */}
      {canScrollLeft && (
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-slate-950 via-slate-950/40 to-transparent z-20" />
      )}

      {/* Right Fade Overlay */}
      {canScrollRight && (
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-slate-950 via-slate-950/40 to-transparent z-20" />
      )}

      {/* Left Scroll Button */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scroll('left')}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-slate-900/90 hover:bg-violet-600 border border-slate-800 hover:border-violet-500 text-white flex items-center justify-center transition-all cursor-pointer shadow-xl opacity-0 group-hover/scrollrow:opacity-100 focus:opacity-100"
          title="Scroll Left"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Right Scroll Button */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scroll('right')}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-slate-900/90 hover:bg-violet-600 border border-slate-800 hover:border-violet-500 text-white flex items-center justify-center transition-all cursor-pointer shadow-xl opacity-0 group-hover/scrollrow:opacity-100 focus:opacity-100"
          title="Scroll Right"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Scrollable Container */}
      <div
        ref={rowRef}
        onScroll={checkScroll}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x scroll-smooth w-full"
      >
        {children}
      </div>
    </div>
  )
}

export default function ExploreTMDB({ 
  watchedItems = [], 
  onAddItem, 
  onAddItems, 
  onRemoveItem, 
  user,
  query,
  setQuery,
  isSelectMode,
  setIsSelectMode
}) {
  const [searchFilter, setSearchFilter] = useState('all') // 'all' | 'movie' | 'tv' | 'person' | 'company'
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [activeDetail, setActiveDetail] = useState(null) // { type: 'person' | 'company', id: string, name: string }
  const [wasStateDeepLink, setWasStateDeepLink] = useState(false)
  
  // Curated Explore Rows Data
  const [trending, setTrending] = useState([])
  const [popularMovies, setPopularMovies] = useState([])
  const [popularTV, setPopularTV] = useState([])
  const [topMovies, setTopMovies] = useState([])
  const [topTV, setTopTV] = useState([])
  
  const [loadingFeed, setLoadingFeed] = useState(true)
  const [error, setError] = useState('')

  // Hero Banner State
  const [bannerIndex, setBannerIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Quick Add Dialog
  const [addingItem, setAddingItem] = useState(null)
  const [userReview, setUserReview] = useState('')
  const [userStatus, setUserStatus] = useState('completed')

  // Selection states for Bulk Add

  const [selectedItems, setSelectedItems] = useState({})
  const [lists, setLists] = useState([])

  const navigate = useNavigate()
  const location = useLocation()
  const isCloud = isFirebaseConfigured() && user

  // Handle direct navigation to deep-linked details (e.g. from Media Details cast list)
  useEffect(() => {
    if (location.state?.activeDetail) {
      setActiveDetail(location.state.activeDetail)
      setWasStateDeepLink(true)
      window.history.replaceState({}, document.title)
      return
    }

    // Parse query parameters (?type=person&id=123&name=Actor)
    const params = new URLSearchParams(location.search)
    const type = params.get('type')
    const id = params.get('id')
    const name = params.get('name')

    if (type && id) {
      setActiveDetail({ type, id: parseInt(id) || id, name: name ? decodeURIComponent(name) : '' })
      setWasStateDeepLink(true)
    } else {
      setActiveDetail(null)
      setWasStateDeepLink(false)
    }
  }, [location])

  // Load custom lists
  useEffect(() => {
    const fetchLists = async () => {
      try {
        if (isCloud && user) {
          const cloudLists = await loadFirebaseLists(user.uid, 'movie')
          setLists(cloudLists)
        } else {
          const localListsRaw = localStorage.getItem('local_custom_lists')
          if (localListsRaw) {
            setLists(JSON.parse(localListsRaw))
          } else {
            setLists([])
          }
        }
      } catch (err) {
        console.error('Failed to load custom lists:', err)
      }
    }
    fetchLists()
  }, [user, isCloud])

  // Load All Explore Feed Categories on Mount
  useEffect(() => {
    const loadExploreFeed = async () => {
      setLoadingFeed(true)
      setError('')
      try {
        const [trRes, popMRes, popTVRes, topMRes, topTVRes] = await Promise.all([
          fetchTMDB('/trending/all/week'),
          fetchTMDB('/movie/popular'),
          fetchTMDB('/tv/popular'),
          fetchTMDB('/movie/top_rated'),
          fetchTMDB('/tv/top_rated')
        ])

        setTrending((trRes.results || []).filter(i => i.poster_path))
        setPopularMovies((popMRes.results || []).map(i => ({ ...i, media_type: 'movie' })).filter(i => i.poster_path))
        setPopularTV((popTVRes.results || []).map(i => ({ ...i, media_type: 'tv' })).filter(i => i.poster_path))
        setTopMovies((topMRes.results || []).map(i => ({ ...i, media_type: 'movie' })).filter(i => i.poster_path))
        setTopTV((topTVRes.results || []).map(i => ({ ...i, media_type: 'tv' })).filter(i => i.poster_path))
      } catch (err) {
        console.error('Failed to fetch TMDB Explore feed:', err)
        setError('Failed to load explore content from TMDB. Please check your API key in Settings.')
      } finally {
        setLoadingFeed(false)
      }
    }

    loadExploreFeed()
  }, [])

  // Hero Banner Auto-slide Timer (5 seconds)
  useEffect(() => {
    if (trending.length === 0 || isPaused) return
    const timer = setInterval(() => {
      setBannerIndex(prev => (prev + 1) % Math.min(trending.length, 8))
    }, 30000)
    return () => clearInterval(timer)
  }, [trending.length, isPaused])

  // Live Unified Search (including People and Companies)
  useEffect(() => {
    if (query.trim().length < 3) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const timer = setTimeout(async () => {
      try {
        const [multiData, companyData] = await Promise.all([
          fetchTMDB('/search/multi', { query: query.trim() }),
          fetchTMDB('/search/company', { query: query.trim() })
        ])

        const multiResults = (multiData.results || []).map(i => {
          if (i.media_type === 'person') {
            return { ...i, media_type: 'person' }
          }
          return i
        })

        const companyResults = (companyData.results || []).map(i => ({
          ...i,
          media_type: 'company'
        }))

        // Combine all results, filtering out items that lack image path AND name/title
        const combined = [...multiResults, ...companyResults].filter(i => 
          i.poster_path || i.profile_path || i.logo_path || i.title || i.name
        )
        setSearchResults(combined)
      } catch (err) {
        console.error('Search error:', err)
      } finally {
        setIsSearching(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [query])

  // Clear active detail view when query changes
  useEffect(() => {
    if (query) {
      setActiveDetail(null)
    }
  }, [query])

  const openAddDialog = (item) => {
    setUserReview('')
    setUserStatus('completed')
    setAddingItem(item)
  }

  const handleAddConfirm = () => {
    if (!addingItem) return
    const mediaType = getItemMediaType(addingItem)
    const isMovie = mediaType === 'movie'
    const releaseDate = isMovie ? addingItem.release_date : addingItem.first_air_date
    const releaseYear = releaseDate ? releaseDate.split('-')[0] : ''

    const newItem = {
      title: isMovie ? (addingItem.title || addingItem.name) : (addingItem.name || addingItem.title),
      type: mediaType,
      tmdb_id: addingItem.id.toString(),
      poster_path: addingItem.poster_path,
      review: userReview.trim(),
      release_year: releaseYear,
      status: userStatus,
      country: getCountryFromTMDBItem(addingItem),
      original_language: addingItem.original_language || 'en',
      genre_ids: addingItem.genre_ids || [],
      ...(mediaType === 'tv' && {
        season_number: 1,
        season_progress: userStatus === 'watching' ? { 1: 1 } : { 1: 0 }
      })
    }

    onAddItem(newItem)
    setAddingItem(null)
  }

  const handleToggleSelectAll = () => {
    const currentList = query.trim() ? filteredSearchResults : trending
    const allCurrentKeys = currentList.map(item => item.id.toString())
    const allCurrentAreSelected = allCurrentKeys.length > 0 && allCurrentKeys.every(key => !!selectedItems[key])

    if (allCurrentAreSelected) {
      setSelectedItems(prev => {
        const next = { ...prev }
        allCurrentKeys.forEach(key => { delete next[key] })
        return next
      })
    } else {
      setSelectedItems(prev => {
        const next = { ...prev }
        currentList.forEach(item => { next[item.id.toString()] = item })
        return next
      })
    }
  }

  const handleBulkAdd = async (status, listId = null) => {
    const selectedList = Object.values(selectedItems)
    if (selectedList.length === 0) return

    const itemsToAdd = []

    for (const item of selectedList) {
      const mediaType = getItemMediaType(item)
      const alreadyAdded = watchedItems.find(wi =>
        wi.type === mediaType && wi.tmdb_id === item.id.toString()
      )

      if (!alreadyAdded) {
        const isMovie = mediaType === 'movie'
        const releaseDate = isMovie ? item.release_date : item.first_air_date
        const releaseYear = releaseDate ? releaseDate.split('-')[0] : ''
        const targetStatus = status || 'planned'

        itemsToAdd.push({
          title: isMovie ? (item.title || item.name) : (item.name || item.title),
          type: mediaType,
          tmdb_id: item.id.toString(),
          poster_path: item.poster_path || '',
          review: '',
          release_year: releaseYear,
          status: targetStatus,
          country: getCountryFromTMDBItem(item),
          original_language: item.original_language || 'en',
          genre_ids: item.genre_ids || [],
          ...(mediaType === 'tv' && {
            season_number: 1,
            season_progress: targetStatus === 'watching' ? { 1: 1 } : { 1: 0 }
          })
        })
      }
    }

    if (itemsToAdd.length === 0) {
      alert('All selected items are already in your library.')
      setSelectedItems({})
      setIsSelectMode(false)
      return
    }

    try {
      const addedItems = await onAddItems(itemsToAdd)

      if (listId && addedItems && addedItems.length > 0) {
        const targetList = lists.find(l => l.id === listId)
        if (targetList) {
          const currentItemIds = targetList.item_ids || []
          const newIds = addedItems.map(i => i.id)
          const updatedIds = Array.from(new Set([...currentItemIds, ...newIds]))

          if (isCloud && !listId.startsWith('local_list_')) {
            await updateFirebaseListItems(listId, updatedIds)
          } else {
            const localListsRaw = localStorage.getItem('local_custom_lists')
            if (localListsRaw) {
              const parsed = JSON.parse(localListsRaw)
              const updated = parsed.map(list =>
                list.id === listId ? { ...list, item_ids: updatedIds } : list
              )
              localStorage.setItem('local_custom_lists', JSON.stringify(updated))
            }
          }

          setLists(prev => prev.map(list =>
            list.id === listId ? { ...list, item_ids: updatedIds } : list
          ))
        }
      }

      alert(`Successfully added ${itemsToAdd.length} items to your library!`)
      setSelectedItems({})
      setIsSelectMode(false)
    } catch (err) {
      console.error('Failed to bulk add items:', err)
      alert('An error occurred while adding items in bulk.')
    }
  }

  const isDemo = !isTMDBConfigured()

  // Filtered search results
  const filteredSearchResults = searchResults.filter(item => {
    const type = getItemMediaType(item)
    if (searchFilter === 'movie') return type === 'movie'
    if (searchFilter === 'tv') return type === 'tv'
    if (searchFilter === 'person') return type === 'person'
    if (searchFilter === 'company') return type === 'company'
    return true
  })

  // Active Hero Slide Item
  const featuredSlides = trending.slice(0, 8)
  const activeSlide = featuredSlides[bannerIndex] || featuredSlides[0]

  const renderCard = (item, isRowItem = false) => {
    const mediaType = getItemMediaType(item)
    const isMovie = mediaType === 'movie'
    const isTV = mediaType === 'tv'
    const isPerson = mediaType === 'person'
    const isCompany = mediaType === 'company'

    const releaseDate = isMovie ? item.release_date : isTV ? item.first_air_date : null
    const releaseYear = releaseDate ? releaseDate.split('-')[0] : (isPerson && item.known_for_department ? item.known_for_department : isCompany ? 'Studio' : 'N/A')
    const cardKey = `${mediaType}_${item.id}`
    const isSelected = !!selectedItems[cardKey]

    const watched = (isMovie || isTV) && watchedItems.find(wi =>
      wi.type === mediaType && wi.tmdb_id === item.id.toString() && wi.status !== 'list_only'
    )

    const cardImage = isPerson 
      ? (item.profile_path ? getPosterUrl(item.profile_path) : null)
      : isCompany 
      ? (item.logo_path ? `https://image.tmdb.org/t/p/w300${item.logo_path}` : null)
      : getPosterUrl(item.poster_path)

    return (
      <div
        key={cardKey}
        className={`group/card relative transition-all duration-300 flex flex-col ${
          isPerson 
            ? 'bg-transparent border-transparent shadow-none' 
            : 'bg-slate-900/40 border border-slate-800 hover:border-slate-700/80 rounded-2xl overflow-hidden shadow-lg'
        } ${
          isRowItem 
            ? isPerson 
              ? 'w-32 sm:w-36 flex-shrink-0' 
              : isCompany 
              ? 'w-36 sm:w-44 flex-shrink-0' 
              : 'w-36 sm:w-44 flex-shrink-0' 
            : 'w-full'
        } ${
          isSelectMode && isSelected
            ? 'border-violet-500 ring-2 ring-violet-500/20 shadow-violet-500/10'
            : ''
        }`}
      >


        {/* Image Area */}
        <div
          className={`relative overflow-hidden cursor-pointer ${
            isPerson 
              ? 'aspect-square rounded-full w-24 h-24 sm:w-28 sm:h-28 mx-auto mt-6 mb-3 bg-slate-950 border border-slate-800 shadow-inner' 
              : isCompany 
              ? 'aspect-square w-full bg-white p-4 flex items-center justify-center rounded-2xl border border-slate-800' 
              : 'aspect-[2/3] w-full bg-slate-950'
          }`}
          onClick={() => {
            if (isSelectMode) {
              if (isPerson || isCompany) return
              setSelectedItems(prev => {
                const next = { ...prev }
                if (next[cardKey]) delete next[cardKey]
                else next[cardKey] = item
                return next
              })
            } else {
              if (isPerson || isCompany) {
                setActiveDetail({ type: mediaType, id: item.id, name: item.name })
              } else {
                navigate(`/explore/${mediaType}/${item.id}`)
              }
            }
          }}
        >
          {cardImage ? (
            <img
              src={cardImage}
              alt={item.title || item.name}
              className={`transition-transform duration-500 group-hover/card:scale-105 ${
                isCompany ? 'w-full h-full object-contain' : 'w-full h-full object-cover'
              }`}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 font-extrabold text-xs uppercase text-center p-3">
              {item.name || item.title}
            </div>
          )}

          {isSelectMode && !isPerson && !isCompany && (
            <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[1px] flex items-center justify-center">
              <div className="p-2 rounded-full bg-slate-900 border border-slate-700">
                {isSelected ? (
                  <CheckSquare className="w-6 h-6 text-violet-400 fill-violet-400/20" />
                ) : (
                  <Square className="w-6 h-6 text-slate-400" />
                )}
              </div>
            </div>
          )}

          {!isSelectMode && watched && (
            <div className={`absolute inset-x-0 bottom-0 backdrop-blur-md border-t text-[11px] font-bold py-1 px-2 flex items-center justify-center gap-1 ${getStatusLabelAndStyle(watched.status).containerStyle}`}>
              <Check className={`w-3.5 h-3.5 ${getStatusLabelAndStyle(watched.status).iconColor}`} />
              <span>{getStatusLabelAndStyle(watched.status).label}</span>
            </div>
          )}
        </div>

        {/* Card Footer Information */}
        {isPerson || isCompany ? (
          <div className="p-3 text-center">
            <h3 className="font-semibold text-xs sm:text-sm text-slate-200 line-clamp-2 group-hover/card:text-violet-400 transition-colors leading-tight">
              {item.name || item.title}
            </h3>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="animate-fade-in pb-16">
      {activeDetail ? (
        <DetailView 
          detail={activeDetail} 
          onBack={() => {
            if (wasStateDeepLink) {
              navigate(-1)
            } else {
              setActiveDetail(null)
            }
          }} 
          isFromState={wasStateDeepLink}
          watchedItems={watchedItems}
          onAddItem={onAddItem}
          navigate={navigate}
        />
      ) : (
        <>


          {/* Featured Slideshow Banner (Only when not searching) */}
          {query.trim().length < 3 && featuredSlides.length > 0 && (
            <div
              className="relative w-screen left-1/2 -translate-x-1/2 min-h-[380px] sm:min-h-[440px] md:min-h-[480px] overflow-hidden shadow-2xl transition-all duration-700 group/hero mb-8"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {/* Faded Slides Container */}
              <div className="relative w-full h-full min-h-[380px] sm:min-h-[440px] md:min-h-[480px]">
                {featuredSlides.map((slide, idx) => {
                  const isActive = idx === bannerIndex;
                  return (
                    <div
                      key={slide.id || idx}
                      className={`absolute inset-0 w-full h-full flex flex-col justify-end overflow-hidden transition-opacity duration-1000 ease-in-out ${
                        isActive 
                          ? 'opacity-100 z-10 pointer-events-auto' 
                          : 'opacity-0 z-0 pointer-events-none'
                      }`}
                    >
                      {/* Background Backdrop Image */}
                      <div className="absolute inset-0 bg-black overflow-hidden">
                        <img
                          src={`https://image.tmdb.org/t/p/w1280${slide.backdrop_path || slide.poster_path}`}
                          alt={slide.title || slide.name}
                          className={`w-full h-full object-cover object-top opacity-100 transition-transform duration-[30000ms] ease-out ${
                            isActive ? 'scale-[1.07]' : 'scale-100'
                          }`}
                        />
                        {/* Only bottom fade overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                      </div>

                      {/* Slide Details Content Wrapper (Constrained and centered) */}
                      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
                        <div className="max-w-2xl space-y-4">
                          {/* Media Type & Trending Pill */}
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 backdrop-blur-md">
                              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> #{idx + 1} Trending This Week
                            </span>
                            <span className={`text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-lg backdrop-blur-md border ${
                              getItemMediaType(slide) === 'movie' 
                                ? 'bg-sky-500/20 border-sky-400/40 text-sky-300' 
                                : 'bg-indigo-500/20 border-indigo-400/40 text-indigo-300'
                            }`}>
                              {getItemMediaType(slide) === 'movie' ? 'Movie' : 'TV Show'}
                            </span>
                          </div>

                          {/* Title */}
                          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                            {slide.title || slide.name}
                          </h1>

                          {/* Sub-info Bad--ges */}
                          <div className="flex items-center flex-wrap gap-3 text-xs sm:text-sm font-semibold text-slate-300">
                            <span className="flex items-center gap-1 text-amber-400 bg-slate-900/80 border border-slate-800 px-2.5 py-1 rounded-lg">
                              <Star className="w-4 h-4 fill-amber-400" />
                              {(slide.vote_average || 0).toFixed(1)} TMDB
                            </span>
                            <span className="bg-slate-900/80 border border-slate-800 px-2.5 py-1 rounded-lg">
                              {slide.release_date ? slide.release_date.split('-')[0] : (slide.first_air_date ? slide.first_air_date.split('-')[0] : 'N/A')}
                            </span>
                            <span className="bg-slate-900/80 border border-slate-800 px-2.5 py-1 rounded-lg uppercase">
                              {slide.original_language || 'EN'}
                            </span>
                          </div>

                          {/* Overview */}
                          <p className="text-xs sm:text-sm text-slate-300 line-clamp-3 leading-relaxed max-w-xl font-medium">
                            {slide.overview || 'No synopsis available for this title.'}
                          </p>

                          {/* Hero Action Buttons */}
                          <div className="flex items-center gap-3 pt-2">
                            <button
                              onClick={() => openAddDialog(slide)}
                              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold px-5 py-3 rounded-xl flex items-center gap-2 shadow-xl shadow-violet-600/30 cursor-pointer active:scale-95 transition-all"
                            >
                              <Plus className="w-4 h-4" /> Add to Library
                            </button>

                            <button
                              onClick={() => navigate(`/explore/${getItemMediaType(slide)}/${slide.id}`)}
                              className="bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs sm:text-sm font-bold px-5 py-3 rounded-xl flex items-center gap-2 backdrop-blur-md cursor-pointer transition-all"
                            >
                              <Info className="w-4 h-4 text-violet-400" /> Details & Seasons
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Manual Carousel Arrow Controls */}
              <div className="absolute right-4 top-4 sm:top-auto sm:bottom-6 z-20 flex items-center gap-2">
                <button
                  onClick={() => setBannerIndex(prev => (prev === 0 ? featuredSlides.length - 1 : prev - 1))}
                  className="w-10 h-10 rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer hover:border-slate-600 shadow-xl"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setBannerIndex(prev => (prev + 1) % featuredSlides.length)}
                  className="w-10 h-10 rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer hover:border-slate-600 shadow-xl"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Bottom Dot Indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
                {featuredSlides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setBannerIndex(idx)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      idx === bannerIndex ? 'w-6 bg-violet-500' : 'w-1.5 bg-slate-700 hover:bg-slate-500'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Centered Page Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 mt-6">
            {/* Demo Mode Notice */}
            {isDemo && (
              <div className="flex justify-end">
                <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl px-4 py-2 text-xs text-amber-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Demo Mode. Add your TMDB API Key in Settings for live data.
                </div>
              </div>
            )}

            {error && (
              <div className="max-w-md mx-auto p-4 bg-rose-950/20 border border-rose-500/20 text-rose-300 text-center rounded-xl text-sm">
                {error}
              </div>
            )}
            {/* ────────────────── SEARCH RESULTS VIEW ────────────────── */}
            {query.trim().length >= 3 ? (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-violet-400" />
              Search Results for <span className="text-violet-400">"{query}"</span>
            </h2>

            {/* Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setSearchFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  searchFilter === 'all' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSearchFilter('movie')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  searchFilter === 'movie' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Film className="w-3 h-3" /> Movies
              </button>
              <button
                onClick={() => setSearchFilter('tv')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  searchFilter === 'tv' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Tv className="w-3 h-3" /> TV Shows
              </button>
              <button
                onClick={() => setSearchFilter('person')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  searchFilter === 'person' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <User className="w-3 h-3" /> People
              </button>
              <button
                onClick={() => setSearchFilter('company')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  searchFilter === 'company' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Building2 className="w-3 h-3" /> Studios
              </button>
            </div>
          </div>

          {isSearching ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <Loader className="w-8 h-8 animate-spin text-violet-500" />
              <span className="text-sm">Searching...</span>
            </div>
          ) : filteredSearchResults.length === 0 ? (
            <div className="text-center py-20 text-slate-500 border border-dashed border-slate-800 rounded-2xl max-w-md mx-auto">
              <Film className="w-10 h-10 text-slate-700 mx-auto mb-2" />
              <h3 className="font-bold text-slate-400">No results found</h3>
              <p className="text-xs text-slate-500 mt-1">Try a different title or keyword.</p>
            </div>
          ) : (
            searchFilter === 'all' ? (
              <div className="space-y-10">
                {/* People Section (circular, 1 single row) */}
                {searchResults.filter(i => getItemMediaType(i) === 'person').length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <User className="w-4 h-4 text-violet-400" />
                      People
                    </h3>
                    <ScrollableRow>
                      {searchResults
                        .filter(i => getItemMediaType(i) === 'person')
                        .map(item => renderCard(item, true))}
                    </ScrollableRow>
                  </div>
                )}

                {/* Studios Section (square, 1 single row) */}
                {searchResults.filter(i => getItemMediaType(i) === 'company').length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-violet-400" />
                      Studios
                    </h3>
                    <ScrollableRow>
                      {searchResults
                        .filter(i => getItemMediaType(i) === 'company')
                        .map(item => renderCard(item, true))}
                    </ScrollableRow>
                  </div>
                )}

                {/* Movies & TV Shows Section (grid) */}
                {searchResults.filter(i => getItemMediaType(i) === 'movie' || getItemMediaType(i) === 'tv').length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Film className="w-4 h-4 text-violet-400" />
                      Movies & TV Shows
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-3 sm:gap-6">
                      {searchResults
                        .filter(i => getItemMediaType(i) === 'movie' || getItemMediaType(i) === 'tv')
                        .map(item => renderCard(item, false))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Single filter grid mode */
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-3 sm:gap-6">
                {filteredSearchResults.map(item => renderCard(item, false))}
              </div>
            )
          )}
        </div>
      ) : (
        /* ────────────────── UNIFIED DASHBOARD FEED ────────────────── */
        <div className="space-y-12">



          {/* CATEGORY ROWS FEED */}
          {loadingFeed ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <Loader className="w-8 h-8 animate-spin text-violet-500" />
              <span className="text-sm">Fetching TMDB catalog categories...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Row 1: Trending This Week */}
              <CategoryRow
                title="Trending This Week"
                subtitle="Top rated Movies & TV shows buzzing right now"
                icon={Flame}
                items={trending}
                watchedItems={watchedItems}
                openAddDialog={openAddDialog}
                navigate={navigate}
                isSelectMode={isSelectMode}
                selectedItems={selectedItems}
                setSelectedItems={setSelectedItems}
              />

              {/* Row 2: Popular Movies */}
              <CategoryRow
                title="Popular Movies"
                subtitle="Most watched movies around the globe"
                icon={Film}
                items={popularMovies}
                watchedItems={watchedItems}
                openAddDialog={openAddDialog}
                navigate={navigate}
                isSelectMode={isSelectMode}
                selectedItems={selectedItems}
                setSelectedItems={setSelectedItems}
              />

              {/* Row 3: Popular TV Shows */}
              <CategoryRow
                title="Popular TV Shows"
                subtitle="Binge-worthy shows trending globally"
                icon={Tv}
                items={popularTV}
                watchedItems={watchedItems}
                openAddDialog={openAddDialog}
                navigate={navigate}
                isSelectMode={isSelectMode}
                selectedItems={selectedItems}
                setSelectedItems={setSelectedItems}
              />

              {/* Row 4: Top Rated Movies */}
              <CategoryRow
                title="Top Rated Movies"
                subtitle="Critically acclaimed cinematic masterpieces"
                icon={Star}
                items={topMovies}
                watchedItems={watchedItems}
                openAddDialog={openAddDialog}
                navigate={navigate}
                isSelectMode={isSelectMode}
                selectedItems={selectedItems}
                setSelectedItems={setSelectedItems}
              />

              {/* Row 5: Top Rated TV Shows */}
              <CategoryRow
                title="Top Rated TV Shows"
                subtitle="Highest rated television series of all time"
                icon={Trophy}
                items={topTV}
                watchedItems={watchedItems}
                openAddDialog={openAddDialog}
                navigate={navigate}
                isSelectMode={isSelectMode}
                selectedItems={selectedItems}
                setSelectedItems={setSelectedItems}
              />
            </div>
          )}

        </div>
      )}
      </div>

      {/* Floating Action Bar for Bulk Selection */}
      {isSelectMode && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 w-[90%] max-w-2xl animate-slide-in-up">
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
              >
                Select / Deselect Page
              </button>
              <span className="text-xs font-bold text-slate-400">
                <span className="text-violet-400 font-extrabold text-sm">{Object.keys(selectedItems).length}</span> items selected
              </span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-xl px-2 py-1">
                <select
                  disabled={Object.keys(selectedItems).length === 0}
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBulkAdd(e.target.value)
                      e.target.value = ''
                    }
                  }}
                  className="bg-transparent border-none text-xs text-slate-200 font-semibold focus:outline-none cursor-pointer pr-1 disabled:opacity-50"
                >
                  <option value="">Add to Watchlist...</option>
                  <option value="completed">Completed</option>
                  <option value="watching font">Watching Now</option>
                  <option value="pending">Up Next (Pending)</option>
                  <option value="planned">Planned</option>
                  <option value="backlog">Backlog</option>
                </select>
              </div>

              {lists.length > 0 && (
                <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-xl px-2 py-1">
                  <select
                    disabled={Object.keys(selectedItems).length === 0}
                    onChange={(e) => {
                      if (e.target.value) {
                        handleBulkAdd('planned', e.target.value)
                        e.target.value = ''
                      }
                    }}
                    className="bg-transparent border-none text-xs text-slate-200 font-semibold focus:outline-none cursor-pointer pr-1 disabled:opacity-50"
                  >
                    <option value="">Add to Custom List...</option>
                    {lists.map(list => (
                      <option key={list.id} value={list.id}>
                        {list.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsSelectMode(false)
                  setSelectedItems({})
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer transition-colors"
                title="Cancel Select Mode"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )}

      {/* Quick Add Dialog Modal */}
      {addingItem && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-1">
              Add {getItemMediaType(addingItem) === 'movie' ? 'Movie' : 'TV Show'}
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Adding <strong className="text-slate-200">
                {addingItem.title || addingItem.name}
              </strong>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Watch Status
                </label>
                <select
                  value={userStatus}
                  onChange={(e) => setUserStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500 cursor-pointer"
                >
                  <option value="completed">Completed</option>
                  <option value="watching">Watching Now</option>
                  <option value="pending">{getItemMediaType(addingItem) === 'tv' ? 'Up Next' : 'Pending'}</option>
                  <option value="planned">Planned (Watchlist)</option>
                  {getItemMediaType(addingItem) !== 'tv' && <option value="backlog">Planned (Backlog)</option>}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Review / Notes
                </label>
                <textarea
                  rows="3"
                  value={userReview}
                  onChange={(e) => setUserReview(e.target.value)}
                  placeholder="What did you think?"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setAddingItem(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl text-sm transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddConfirm}
                className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-violet-600/20"
              >
                <Plus className="w-4 h-4" /> Add to List
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
