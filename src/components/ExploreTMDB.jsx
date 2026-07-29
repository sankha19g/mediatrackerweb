import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Search, Film, Tv, Plus, Check, Star, Calendar, Loader, ListChecks, CheckSquare, Square, X, ChevronLeft, ChevronRight, Flame, Sparkles, Trophy, TrendingUp, Info, Play, ArrowLeft, User, Building2, SlidersHorizontal, Heart, Grid3x3, ChevronDown, Eye } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { fetchTMDB, getPosterUrl, isTMDBConfigured } from '../lib/tmdb'
import { isFirebaseConfigured, loadFirebaseLists, updateFirebaseListItems, addFirebaseList, deleteFirebaseList } from '../lib/firebase'

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
    <div className="mb-4 sm:mb-10 relative group/row">
      <div className="flex items-center justify-between mb-2 sm:mb-4 px-2">
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
          </div>
        </div>

        {/* Scroll arrows */}
        <div className="hidden sm:flex items-center gap-1.5">
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
        className="flex gap-2 sm:gap-4 overflow-x-auto scrollbar-none scroll-smooth pb-4 px-2 snap-x"
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
              className={`flex-shrink-0 w-24 sm:w-44 md:w-48 lg:w-[calc((100%-96px)/7)] group/card relative bg-slate-900/40 border rounded-2xl overflow-hidden shadow-lg transition-all duration-300 flex flex-col snap-start ${
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

const GENRES_LIST = [
  { id: '', name: 'All Genres' },
  { id: '28', name: 'Action' },
  { id: '12', name: 'Adventure' },
  { id: '16', name: 'Animation' },
  { id: '35', name: 'Comedy' },
  { id: '80', name: 'Crime' },
  { id: '99', name: 'Documentary' },
  { id: '18', name: 'Drama' },
  { id: '10751', name: 'Family' },
  { id: '14', name: 'Fantasy' },
  { id: '36', name: 'History' },
  { id: '27', name: 'Horror' },
  { id: '10402', name: 'Music' },
  { id: '9648', name: 'Mystery' },
  { id: '10749', name: 'Romance' },
  { id: '878', name: 'Sci-Fi & Fantasy' },
  { id: '53', name: 'Thriller' },
  { id: '10752', name: 'War' },
  { id: '37', name: 'Western' }
]

const PROVIDERS_LIST = [
  { id: '', name: 'All Platforms' },
  { id: '8', name: 'Netflix' },
  { id: '337', name: 'Disney+' },
  { id: '119', name: 'Amazon Prime Video' },
  { id: '350', name: 'Apple TV+' },
  { id: '1899', name: 'Max (HBO)' },
  { id: '15', name: 'Hulu' },
  { id: '531', name: 'Paramount+' }
]

const LANGUAGES_LIST = [
  { id: '', name: 'Select language...' },
  { id: 'en', name: 'English' },
  { id: 'hi', name: 'Hindi' },
  { id: 'ja', name: 'Japanese' },
  { id: 'ko', name: 'Korean' },
  { id: 'es', name: 'Spanish' },
  { id: 'fr', name: 'French' },
  { id: 'de', name: 'German' },
  { id: 'it', name: 'Italian' },
  { id: 'ta', name: 'Tamil' },
  { id: 'te', name: 'Telugu' },
  { id: 'ml', name: 'Malayalam' },
  { id: 'zh', name: 'Chinese' }
]

const DURATION_OPTIONS = [
  { id: 'under_30', label: 'Under 30mins' },
  { id: '30_60', label: '30-60mins' },
  { id: '60_120', label: '1-2hrs' },
  { id: '120_180', label: '2-3hrs' },
  { id: 'over_180', label: '3hrs+' }
]

const YEARS_LIST = (() => {
  const list = []
  const currentYear = new Date().getFullYear()
  for (let y = currentYear; y >= 1920; y--) {
    list.push(y.toString())
  }
  return list
})()

const OTT_PLATFORMS = [
  { 
    id: '8', 
    providerIds: '8', 
    name: 'Netflix', 
    defaultLogo: 'https://image.tmdb.org/t/p/w92/pbp122LfaWwRjGoxLftZlIZB3vU.jpg', 
    activeClass: 'border-red-500/80 bg-red-950/60 text-white shadow-red-500/20' 
  },
  { 
    id: '119', 
    providerIds: '119|9|10', 
    name: 'Prime Video', 
    defaultLogo: 'https://image.tmdb.org/t/p/w92/dQeAfi54P2jMNm1yByGmiioz2ot.jpg', 
    activeClass: 'border-sky-500/80 bg-sky-950/60 text-white shadow-sky-500/20' 
  },
  { 
    id: '122', 
    providerIds: '337|122|2|220|390', 
    name: 'JioHotstar', 
    defaultLogo: 'https://image.tmdb.org/t/p/w92/7rwE24K9e2k9XzSgYn1w1bZ2r2d.png', 
    activeClass: 'border-indigo-500/80 bg-indigo-950/60 text-white shadow-indigo-500/20' 
  },
  { 
    id: '283', 
    providerIds: '283', 
    name: 'Crunchyroll', 
    defaultLogo: 'https://image.tmdb.org/t/p/w92/mXe0Kl3K7B9sM5B0G9i2pQ5d8r.png', 
    activeClass: 'border-orange-500/80 bg-orange-950/60 text-white shadow-orange-500/20' 
  },
  { 
    id: '237', 
    providerIds: '237', 
    name: 'SonyLIV', 
    defaultLogo: 'https://image.tmdb.org/t/p/w92/v2Ff7L2LfaWwRjGoxLftZlIZB3vU.jpg', 
    activeClass: 'border-amber-500/80 bg-amber-950/60 text-white shadow-amber-500/20' 
  },
  { 
    id: '232', 
    providerIds: '232', 
    name: 'Zee5', 
    defaultLogo: 'https://image.tmdb.org/t/p/w92/1Fk5LfaWwRjGoxLftZlIZB3vU.jpg', 
    activeClass: 'border-purple-500/80 bg-purple-950/60 text-white shadow-purple-500/20' 
  },
  { 
    id: '350', 
    providerIds: '350|2', 
    name: 'Apple TV+', 
    defaultLogo: 'https://image.tmdb.org/t/p/w92/2E0h5RjG1f8cR9G9j1mF0h4g.png', 
    activeClass: 'border-slate-400/80 bg-slate-800/80 text-white shadow-slate-400/20' 
  },
  { 
    id: '192', 
    providerIds: '192', 
    name: 'YouTube', 
    defaultLogo: 'https://image.tmdb.org/t/p/w92/v9R1sM71T2HhYhQ78Y0mN0m.png', 
    activeClass: 'border-red-500/80 bg-red-950/60 text-white shadow-red-500/20' 
  }
]

// Sub-component for "View All Movie/TV" page
const ViewAllMovieTvView = ({
  watchedItems,
  onAddItem,
  navigate,
  user,
  searchQuery = '',
  setSearchQuery
}) => {
  const [mediaType, setMediaType] = useState(() => sessionStorage.getItem('mt_discover_mediaType') || 'all') // 'all' | 'movie' | 'tv'
  const [sortBy, setSortBy] = useState(() => sessionStorage.getItem('mt_discover_sortBy') || 'trending') // 'trending' | 'top_rated' | 'revenue'
  const [selectedGenre, setSelectedGenre] = useState(() => sessionStorage.getItem('mt_discover_selectedGenre') || '')
  const [selectedProvider, setSelectedProvider] = useState(() => sessionStorage.getItem('mt_discover_selectedProvider') || '')
  const [selectedLanguage, setSelectedLanguage] = useState(() => sessionStorage.getItem('mt_discover_selectedLanguage') || '')
  const [selectedDuration, setSelectedDuration] = useState(() => sessionStorage.getItem('mt_discover_selectedDuration') || '')
  const [selectedYear, setSelectedYear] = useState(() => sessionStorage.getItem('mt_discover_selectedYear') || '')
  const [localSearch, setLocalSearch] = useState(searchQuery || '')
  const [page, setPage] = useState(() => {
    const cached = sessionStorage.getItem('mt_discover_page')
    return cached ? parseInt(cached, 10) : 1
  })
  const [items, setItems] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  // Persist filter states to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('mt_discover_mediaType', mediaType)
  }, [mediaType])
  
  useEffect(() => {
    sessionStorage.setItem('mt_discover_sortBy', sortBy)
  }, [sortBy])

  useEffect(() => {
    sessionStorage.setItem('mt_discover_selectedGenre', selectedGenre)
  }, [selectedGenre])

  useEffect(() => {
    sessionStorage.setItem('mt_discover_selectedProvider', selectedProvider)
  }, [selectedProvider])

  useEffect(() => {
    sessionStorage.setItem('mt_discover_selectedLanguage', selectedLanguage)
  }, [selectedLanguage])

  useEffect(() => {
    sessionStorage.setItem('mt_discover_selectedDuration', selectedDuration)
  }, [selectedDuration])

  useEffect(() => {
    sessionStorage.setItem('mt_discover_selectedYear', selectedYear)
  }, [selectedYear])

  useEffect(() => {
    sessionStorage.setItem('mt_discover_page', page.toString())
  }, [page])

  useEffect(() => {
    if (searchQuery !== undefined) {
      setLocalSearch(searchQuery)
    }
  }, [searchQuery])

  // Prevent resetting page to 1 on initial mount when reading cached page
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    setPage(1)
  }, [mediaType, sortBy, selectedGenre, selectedProvider, selectedLanguage, selectedDuration, selectedYear, localSearch])

  useEffect(() => {
    let active = true
    const loadData = async () => {
      setLoading(true)
      try {
        const queryTerm = localSearch.trim()

        // ── SEARCH MODE ──────────────────────────────────────────────────────
        if (queryTerm.length >= 2) {
          const endpoint = mediaType === 'movie' ? '/search/movie'
            : mediaType === 'tv' ? '/search/tv'
            : '/search/multi'
          const data = await fetchTMDB(endpoint, { query: queryTerm, page })
          if (!active) return
          const raw = (data.results || [])
            .filter(i => i.poster_path || i.title || i.name)
            .map(i => ({ ...i, media_type: i.media_type || (i.title ? 'movie' : 'tv') }))
            .filter(i => i.media_type === 'movie' || i.media_type === 'tv')
          setItems(raw)
          setTotalPages(Math.min(data.total_pages || 1, 500))
          return
        }

        const hasFilters = selectedGenre || selectedProvider || selectedLanguage
          || selectedDuration || selectedYear

        // ── CURATED TMDB LISTS (no filters) ──────────────────────────────────
        if (!hasFilters) {
          if (sortBy === 'trending') {
            const ep = mediaType === 'movie' ? '/trending/movie/week'
              : mediaType === 'tv' ? '/trending/tv/week'
              : '/trending/all/week'
            const data = await fetchTMDB(ep, { page })
            if (!active) return
            const raw = (data.results || [])
              .map(i => ({ ...i, media_type: i.media_type || (i.title ? 'movie' : 'tv') }))
              .filter(i => i.media_type === 'movie' || i.media_type === 'tv')
            setItems(raw)
            setTotalPages(Math.min(data.total_pages || 1, 500))
            return
          }
          if (sortBy === 'top_rated') {
            const epM = '/movie/top_rated', epT = '/tv/top_rated'
            if (mediaType === 'movie') {
              const d = await fetchTMDB(epM, { page })
              if (!active) return
              setItems((d.results || []).map(i => ({ ...i, media_type: 'movie' })))
              setTotalPages(Math.min(d.total_pages || 1, 500))
              return
            } else if (mediaType === 'tv') {
              const d = await fetchTMDB(epT, { page })
              if (!active) return
              setItems((d.results || []).map(i => ({ ...i, media_type: 'tv' })))
              setTotalPages(Math.min(d.total_pages || 1, 500))
              return
            } else {
              const [mD, tD] = await Promise.all([fetchTMDB(epM, { page }), fetchTMDB(epT, { page })])
              if (!active) return
              const combined = [
                ...(mD.results || []).map(i => ({ ...i, media_type: 'movie' })),
                ...(tD.results || []).map(i => ({ ...i, media_type: 'tv' }))
              ].sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
              setItems(combined)
              setTotalPages(Math.min(Math.max(mD.total_pages || 1, tD.total_pages || 1), 500))
              return
            }
          }
          if (sortBy === 'revenue') {
            // Curated highest grossing movies (movies only)
            const ep = '/discover/movie'
            const d = await fetchTMDB(ep, { page, sort_by: 'revenue.desc', 'vote_count.gte': 100 })
            if (!active) return
            setItems((d.results || []).map(i => ({ ...i, media_type: 'movie' })))
            setTotalPages(Math.min(d.total_pages || 1, 500))
            return
          }
        }

        // ── DISCOVER MODE (with filters) ──────────────────────────────────────
        // Compute sort_by param
        let sortParamM = 'popularity.desc'
        let sortParamT = 'popularity.desc'

        if (sortBy === 'top_rated') {
          sortParamM = 'vote_average.desc'
          sortParamT = 'vote_average.desc'
        } else if (sortBy === 'revenue') {
          sortParamM = 'revenue.desc'
          sortParamT = 'popularity.desc'
        }

        const region = (selectedProvider && (selectedProvider.includes('350') || selectedProvider.includes('192'))) ? 'US' : 'IN'

        const buildParams = (isMovie) => {
          const p = {
            page,
            sort_by: isMovie ? sortParamM : sortParamT,
            watch_region: region
          }
          if (selectedGenre) p.with_genres = selectedGenre
          if (selectedProvider) p.with_watch_providers = selectedProvider
          if (selectedLanguage) p.with_original_language = selectedLanguage
          if (sortBy === 'top_rated') {
            p['vote_count.gte'] = isMovie ? 500 : 200
          }
          if (selectedYear) {
            if (isMovie) p.primary_release_year = selectedYear
            else p.first_air_date_year = selectedYear
          }
          // Duration
          const durMap = {
            under_30: { lte: 30 }, '30_60': { gte: 30, lte: 60 },
            '60_120': { gte: 60, lte: 120 }, '120_180': { gte: 120, lte: 180 },
            over_180: { gte: 180 }
          }
          if (selectedDuration && durMap[selectedDuration]) {
            const d = durMap[selectedDuration]
            if (d.gte) p['with_runtime.gte'] = d.gte
            if (d.lte) p['with_runtime.lte'] = d.lte
          }
          return p
        }

        const fetchDiscover = async (endpoint, params) => {
          let res = await fetchTMDB(endpoint, params)
          let results = res.results || []
          let totalPages = res.total_pages || 1
          // Fallback for OTT providers with few results
          if (results.length < 10 && params.with_watch_providers) {
            const alt = { ...params }; delete alt.watch_region
            const altRes = await fetchTMDB(endpoint, alt)
            const ids = new Set(results.map(r => r.id))
            ;(altRes.results || []).forEach(item => {
              if (!ids.has(item.id)) { results.push(item); ids.add(item.id) }
            })
            totalPages = Math.max(totalPages, altRes.total_pages || 1)
          }
          return { results, total_pages: totalPages }
        }

        // Sort combined results
        const sortCombined = (arr) => {
          if (sortBy === 'top_rated') return arr.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
          if (sortBy === 'revenue') return arr.sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
          return arr.sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        }

        if (mediaType === 'movie') {
          const data = await fetchDiscover('/discover/movie', buildParams(true))
          if (!active) return
          setItems((data.results || []).map(i => ({ ...i, media_type: 'movie' })))
          setTotalPages(Math.min(data.total_pages || 1, 500))
        } else if (mediaType === 'tv') {
          const data = await fetchDiscover('/discover/tv', buildParams(false))
          if (!active) return
          setItems((data.results || []).map(i => ({ ...i, media_type: 'tv' })))
          setTotalPages(Math.min(data.total_pages || 1, 500))
        } else {
          const [mRes, tRes] = await Promise.all([
            fetchDiscover('/discover/movie', buildParams(true)),
            fetchDiscover('/discover/tv', buildParams(false))
          ])
          if (!active) return
          const combined = sortCombined([
            ...(mRes.results || []).map(i => ({ ...i, media_type: 'movie' })),
            ...(tRes.results || []).map(i => ({ ...i, media_type: 'tv' }))
          ])
          setItems(combined)
          setTotalPages(Math.min(Math.max(mRes.total_pages || 1, tRes.total_pages || 1), 500))
        }

      } catch (err) {
        console.error('Failed to fetch discover items:', err)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadData()
    return () => { active = false }
  }, [mediaType, sortBy, selectedGenre, selectedProvider, selectedLanguage, selectedDuration, selectedYear, localSearch, page])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const params = new URLSearchParams(window.location.search)
              params.delete('view')
              const qs = params.toString()
              navigate(`/explore_tmdb${qs ? `?${qs}` : ''}`)
            }}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all cursor-pointer shadow-md"
            title="Back to Explore Feed"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
              <Grid3x3 className="w-6 h-6 text-violet-400" />
              Discover
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Browse, search, and filter all trending & discoverable titles from TMDB.
            </p>
          </div>
        </div>

        <div className="text-xs font-bold text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl self-start sm:self-auto">
          Page {page} of {totalPages}
        </div>
      </div>

      {/* 2-Column Responsive Layout: Left Filters + Right Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: FILTERS & SEARCH */}
        <div className="lg:col-span-3 bg-[#0a0a0a] border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-5 sticky top-20">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-violet-400" />
              Filter & Search
            </h3>
            {(localSearch || selectedGenre || selectedProvider || selectedLanguage || selectedDuration || selectedYear || sortBy !== 'trending' || mediaType !== 'all') && (
              <button
                onClick={() => {
                  setLocalSearch('')
                  if (setSearchQuery) setSearchQuery('')
                  setMediaType('all')
                  setSortBy('trending')
                  setSelectedGenre('')
                  setSelectedProvider('')
                  setSelectedLanguage('')
                  setSelectedDuration('')
                  setSelectedYear('')
                }}
                className="text-[11px] font-bold text-violet-400 hover:underline cursor-pointer"
              >
                Reset All
              </button>
            )}
          </div>

          {/* 1. Top Search Bar */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Search Titles
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => {
                  setLocalSearch(e.target.value)
                  if (setSearchQuery) setSearchQuery(e.target.value)
                }}
                placeholder="Search movies, tv..."
                className="w-full bg-[#101424] border border-slate-800 focus:border-violet-500 text-white text-xs rounded-xl pl-9 pr-8 py-2 focus:outline-none transition-all"
              />
              {localSearch && (
                <button
                  onClick={() => {
                    setLocalSearch('')
                    if (setSearchQuery) setSearchQuery('')
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 2. TV / Movie / All Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Category Type
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-[#101424] p-1 border border-slate-800 rounded-xl">
              {[
                { id: 'all', label: 'All' },
                { id: 'movie', label: 'Movies' },
                { id: 'tv', label: 'TV Shows' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setMediaType(t.id)}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
                    mediaType === t.id
                      ? 'bg-violet-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Sort Options Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Sort By
            </label>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-[#101424] border border-slate-800 text-white text-xs font-semibold py-2 px-3 pr-8 rounded-xl appearance-none cursor-pointer focus:outline-none focus:border-violet-500 transition-all"
              >
                <option value="trending">🔥 Trending</option>
                <option value="top_rated">🏆 Top Rated</option>
                <option value="revenue">💰 Top Grossing (Movies)</option>
              </select>
              <ChevronDown className="w-4 h-4 text-violet-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 3.5 Release Year Dropdown */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Release Year
            </label>
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full bg-[#101424] border border-slate-800 text-white text-xs font-semibold py-2.5 px-3 pr-8 rounded-xl appearance-none cursor-pointer focus:outline-none focus:border-violet-500 transition-all"
              >
                <option value="">📅 All Years</option>
                {YEARS_LIST.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 4. Genre Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Genre
            </label>
            <div className="relative">
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="w-full bg-[#101424] border border-slate-800 text-white text-xs font-semibold py-2 px-3 pr-8 rounded-xl appearance-none cursor-pointer focus:outline-none focus:border-violet-500 transition-all"
              >
                {GENRES_LIST.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-violet-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 5. LANGUAGE */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Language
            </label>
            <div className="relative">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full bg-[#101424] border border-slate-800 text-white text-xs font-semibold py-2.5 px-3 pr-8 rounded-xl appearance-none cursor-pointer focus:outline-none focus:border-violet-500 transition-all"
              >
                {LANGUAGES_LIST.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 6. DURATION */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Duration
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DURATION_OPTIONS.map(d => {
                const isActive = selectedDuration === d.id
                return (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDuration(isActive ? '' : d.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-violet-600/30 border-violet-500 text-violet-200 font-bold shadow-sm'
                        : 'bg-[#101424] border-slate-800/90 text-slate-300 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {d.label}
                  </button>
                )
              })}
            </div>
          </div>



          {/* 8. OTT PLATFORMS GRID */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              OTT
            </label>
            <div className="grid grid-cols-2 gap-2">
              {OTT_PLATFORMS.map(ott => {
                const isActive = selectedProvider === ott.providerIds
                return (
                  <button
                    key={ott.id}
                    onClick={() => setSelectedProvider(isActive ? '' : ott.providerIds)}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isActive
                        ? ott.activeClass
                        : 'bg-[#101424] border-slate-800/90 text-slate-300 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-md overflow-hidden bg-slate-900 flex-shrink-0 flex items-center justify-center border border-slate-700/50">
                      <img
                        src={ott.defaultLogo}
                        alt={ott.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="truncate">{ott.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: MOVIES & TV SHOWS GRID */}
        <div className="lg:col-span-9 space-y-6">
          {loading ? (
            <div className="h-96 flex items-center justify-center text-slate-500 text-sm font-semibold animate-pulse gap-2">
              <Loader className="w-5 h-5 text-violet-400 animate-spin" />
              Fetching items from TMDB...
            </div>
          ) : items.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-sm italic bg-[#0a0a0a] border border-slate-800 rounded-2xl p-8 text-center space-y-2">
              <Film className="w-8 h-8 text-slate-700 mb-1" />
              <p>No movies or TV shows found matching your active filters.</p>
              <button
                onClick={() => {
                  setLocalSearch('')
                  if (setSearchQuery) setSearchQuery('')
                  setMediaType('all')
                  setSortBy('trending')
                  setSelectedGenre('')
                  setSelectedProvider('')
                }}
                className="text-xs text-violet-400 hover:underline font-bold not-italic"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {items.map(item => {
                  const mType = item.media_type || (item.title ? 'movie' : 'tv')
                  const isMovie = mType === 'movie'
                  const titleStr = isMovie ? item.title : item.name
                  const releaseDate = isMovie ? item.release_date : item.first_air_date
                  const watched = watchedItems.find(wi => wi.type === mType && wi.tmdb_id === item.id.toString() && wi.status !== 'list_only')

                  return (
                    <div
                      key={`${mType}_${item.id}`}
                      onClick={() => navigate(`/explore/${mType}/${item.id}`)}
                      className="bg-[#0a0a0a] border border-slate-800 hover:border-violet-500/50 rounded-2xl overflow-hidden flex flex-col shadow-lg transition-all duration-300 hover:-translate-y-1 group/card cursor-pointer relative"
                    >
                      <div className="aspect-[2/3] w-full bg-slate-950 relative overflow-hidden">
                        {item.poster_path ? (
                          <img
                            src={getPosterUrl(item.poster_path)}
                            alt={titleStr}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-900 font-bold text-xs p-2 text-center">
                            {titleStr}
                          </div>
                        )}

                        {/* Watched Status Badge */}
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

              {/* Pagination Row */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 pt-6">
                  <button
                    disabled={page === 1}
                    onClick={() => {
                      setPage(prev => Math.max(1, prev - 1))
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      page === 1
                        ? 'bg-slate-900/40 border-slate-950 text-slate-600 cursor-not-allowed opacity-50'
                        : 'bg-[#101424] hover:bg-[#181e36] border-slate-800 text-slate-300 hover:text-white active:scale-95'
                    }`}
                  >
                    Previous
                  </button>

                  <span className="text-xs font-bold text-slate-400">
                    Page <span className="text-white">{page}</span> of <span className="text-white">{totalPages}</span>
                  </span>

                  <button
                    disabled={page >= totalPages}
                    onClick={() => {
                      setPage(prev => Math.min(totalPages, prev + 1))
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      page >= totalPages
                        ? 'bg-slate-900/40 border-slate-950 text-slate-600 cursor-not-allowed opacity-50'
                        : 'bg-[#101424] hover:bg-[#181e36] border-slate-800 text-slate-300 hover:text-white active:scale-95'
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

// Sub-component for Person (Actor/Director) and Company (Studio) Details
const DetailView = ({ detail, onBack, isFromState, watchedItems, onAddItem, navigate, user }) => {
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

  const [actorLists, setActorLists] = useState([])
  const [toastMessage, setToastMessage] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const isCloud = isFirebaseConfigured() && user

  const fetchActorLists = async () => {
    try {
      if (isCloud && user) {
        const cloudLists = await loadFirebaseLists(user.uid, 'actor')
        setActorLists(cloudLists)
      } else {
        const localListsRaw = localStorage.getItem('local_custom_lists')
        if (localListsRaw) {
          const parsed = JSON.parse(localListsRaw)
          setActorLists(parsed.filter(list => list.type === 'actor'))
        } else {
          setActorLists([])
        }
      }
    } catch (err) {
      console.error('Failed to load actor lists:', err)
    }
  }

  useEffect(() => {
    fetchActorLists()
  }, [user, detail])

  const isFavourite = useMemo(() => {
    if (detail.type !== 'person' || !data) return false
    return actorLists.some(list => list.name === data.name && list.type === 'actor')
  }, [actorLists, detail, data])

  const handleToggleFavourite = async () => {
    if (detail.type !== 'person' || !data) return
    
    const existingList = actorLists.find(list => list.name === data.name && list.type === 'actor')
    
    try {
      if (existingList) {
        if (isCloud && !existingList.id.startsWith('local_list_')) {
          await deleteFirebaseList(existingList.id)
        } else {
          const localListsRaw = localStorage.getItem('local_custom_lists')
          if (localListsRaw) {
            const parsed = JSON.parse(localListsRaw)
            const filtered = parsed.filter(list => list.id !== existingList.id)
            localStorage.setItem('local_custom_lists', JSON.stringify(filtered))
          }
        }
        setActorLists(prev => prev.filter(l => l.id !== existingList.id))
        setToastMessage(`${data.name} removed from favourites`)
        setTimeout(() => setToastMessage(''), 3000)
      } else {
        const bannerUrl = profileImages.length > 0 ? `https://image.tmdb.org/t/p/w1280${profileImages[0]}` : getPosterUrl(data.profile_path)
        const thumbnailUrl = getPosterUrl(data.profile_path)
        
        if (isCloud) {
          const newList = await addFirebaseList(
            user.uid,
            data.name,
            data.known_for_department || 'Artist',
            'actor',
            thumbnailUrl,
            bannerUrl,
            { tmdb_person_id: data.id.toString(), removed_ids: [] }
          )
          setActorLists(prev => [newList, ...prev])
        } else {
          const localId = `local_list_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          const newList = {
            id: localId,
            user_id: 'local',
            name: data.name,
            description: data.known_for_department || 'Artist',
            type: 'actor',
            thumbnail_url: thumbnailUrl,
            banner_url: bannerUrl,
            item_ids: [],
            created_at: new Date().toISOString(),
            tmdb_person_id: data.id.toString(),
            removed_ids: []
          }
          const localListsRaw = localStorage.getItem('local_custom_lists')
          const currentLocalLists = localListsRaw ? JSON.parse(localListsRaw) : []
          const updatedLocalLists = [newList, ...currentLocalLists]
          localStorage.setItem('local_custom_lists', JSON.stringify(updatedLocalLists))
          setActorLists(prev => [newList, ...prev])
        }
        setToastMessage(`${data.name} saved as favourite`)
        setTimeout(() => setToastMessage(''), 3000)
      }
    } catch (err) {
      console.error('Failed to toggle favourite actor:', err)
      alert('Failed to update favourite status.')
    }
  }

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
      <div className="w-screen relative left-1/2 -translate-x-1/2 overflow-hidden border-0 bg-black shadow-2xl mb-8">
        {isPerson && profileImages.length > 0 ? (
          <div className="absolute inset-0 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 opacity-65 filter blur-[0.5px] pointer-events-none">
            {profileImages.slice(0, 5).map((path, idx) => (
              <div key={idx} className="relative aspect-[2/3] w-full h-full overflow-hidden">
                <img
                  src={`https://image.tmdb.org/t/p/w300${path}`}
                  alt=""
                  className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        ) : (
          /* Stylish blur background */
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {isPerson && data?.profile_path ? (
              <img
                src={getPosterUrl(data.profile_path)}
                alt=""
                className="w-full h-full object-cover scale-125 opacity-35 filter blur-2xl"
              />
            ) : (
              /* Gradient mesh for studio or fallback */
              <div className="absolute inset-0 bg-gradient-to-br from-violet-900/40 via-indigo-900/30 to-black opacity-55 filter blur-xl" />
            )}
          </div>
        )}
        {/* Gradients to fade collage into the dark page background */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/30 to-transparent z-10 pointer-events-none" />

        {/* Centered Profile Content */}
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 pb-8 relative z-10">
          {/* Overlaid back button & title */}
          <div className="flex items-center justify-between mb-6">
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

          <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-start">
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
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-wrap mb-1">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                    {data.name}
                  </h1>
                  {isPerson && (
                    <button
                      onClick={handleToggleFavourite}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-md w-fit ${
                        isFavourite
                          ? 'bg-rose-600 border-rose-500 text-white hover:bg-rose-700'
                          : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFavourite ? 'fill-white' : ''}`} />
                      {isFavourite ? 'Saved as Favourite' : 'Set as Favourite'}
                    </button>
                  )}
                </div>
                {isPerson && data.known_for_department && (
                  <p className="text-xs sm:text-sm font-extrabold text-violet-400 uppercase tracking-wider">
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
            </div>
          </div>
        </div>
      </div>

      {/* Main Page Content (Works Grid) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16">

      {/* Grid of Work Credits */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <h2 className="text-xl font-black text-white flex items-center gap-2 tracking-tight">
            <Film className="w-5 h-5 text-violet-400" />
            Featured Filmography / Productions
          </h2>
          
          <div className="flex items-center gap-4 relative">
            {/* Desktop Search Input */}
            <input
              type="text"
              placeholder="Search films..."
              value={worksSearchQuery}
              onChange={(e) => setWorksSearchQuery(e.target.value)}
              className="hidden sm:block bg-slate-900 border border-slate-800 focus:border-violet-500 focus:outline-none rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 w-32 sm:w-40 transition-all focus:w-48"
            />

            {/* Mobile Magnifying Icon Button */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="sm:hidden p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer flex items-center justify-center"
              title="Search films"
            >
              <Search className="w-4 h-4 text-violet-400" />
            </button>

            {/* Mobile Absolute Floating Search Bar */}
            {isSearchOpen && (
              <div className="absolute inset-y-0 right-0 left-0 bg-slate-900 border border-slate-800 rounded-xl p-1 flex items-center gap-2 z-30 shadow-2xl animate-fade-in">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search films..."
                    value={worksSearchQuery}
                    onChange={(e) => setWorksSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800/60 focus:border-violet-500 focus:outline-none rounded-lg pl-8 pr-7 py-1 text-xs text-white placeholder-slate-500"
                  />
                  {worksSearchQuery && (
                    <button
                      onClick={() => setWorksSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchOpen(false)
                    setWorksSearchQuery('')
                  }}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-white cursor-pointer transition-all flex items-center justify-center"
                  title="Close search"
                >
                  <X className="w-4 h-4 text-slate-400 hover:text-rose-400" />
                </button>
              </div>
            )}
            <span className="text-xs font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-lg">
              {watchedCount} watched
            </span>
            {works.length > 0 && (
              <button
                type="button"
                onClick={() => setFadeWatched(!fadeWatched)}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                  fadeWatched
                    ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
                title={fadeWatched ? "Show Watched" : "Fade Watched"}
              >
                <Eye className="w-4 h-4" />
              </button>
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
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-800 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-fade-in">
          <Heart className="w-4 h-4 text-rose-500 fill-rose-550" />
          <span className="text-xs font-bold text-slate-200">{toastMessage}</span>
        </div>
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
  const [onAirTV, setOnAirTV] = useState([])
  const [trendingIndian, setTrendingIndian] = useState([])
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
        const [trRes, onAirTVRes, indMovieRes, topMRes, topTVRes] = await Promise.all([
          fetchTMDB('/trending/all/week'),
          fetchTMDB('/tv/on_the_air'),
          fetchTMDB('/discover/movie', { with_origin_country: 'IN', sort_by: 'popularity.desc' }),
          fetchTMDB('/movie/top_rated'),
          fetchTMDB('/tv/top_rated')
        ])

        setTrending((trRes.results || []).filter(i => i.poster_path))
        setOnAirTV((onAirTVRes.results || []).map(i => ({ ...i, media_type: 'tv' })).filter(i => i.poster_path))
        setTrendingIndian((indMovieRes.results || []).map(i => ({ ...i, media_type: 'movie' })).filter(i => i.poster_path))

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

  // Clear active detail view when query changes, but only if we're not on a URL-param deep link
  useEffect(() => {
    if (query) {
      const params = new URLSearchParams(location.search)
      if (!params.get('type')) {
        setActiveDetail(null)
      }
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
      release_date: releaseDate || '',
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

  const isViewAll = new URLSearchParams(location.search).get('view') === 'all'

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
          user={user}
        />
      ) : isViewAll ? (
        <ViewAllMovieTvView
          watchedItems={watchedItems}
          onAddItem={onAddItem}
          navigate={navigate}
          user={user}
          searchQuery={query}
          setSearchQuery={setQuery}
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
                          <div className="hidden sm:flex items-center gap-2">
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

                          {/* Sub-info Badges */}
                          <div className="flex items-center flex-wrap gap-3 text-xs sm:text-sm font-semibold text-slate-300">
                            <span className="flex items-center gap-1 text-amber-400 bg-slate-900/80 border border-slate-800 px-2.5 py-1 rounded-lg">
                              <Star className="w-4 h-4 fill-amber-400" />
                              {(slide.vote_average || 0).toFixed(1)} TMDB
                            </span>
                            <span className="hidden sm:inline-block bg-slate-900/80 border border-slate-800 px-2.5 py-1 rounded-lg">
                              {slide.release_date ? slide.release_date.split('-')[0] : (slide.first_air_date ? slide.first_air_date.split('-')[0] : 'N/A')}
                            </span>
                            <span className="hidden sm:inline-block bg-slate-900/80 border border-slate-800 px-2.5 py-1 rounded-lg uppercase">
                              {slide.original_language || 'EN'}
                            </span>
                          </div>

                          {/* Overview */}
                          <p className="hidden sm:block text-xs sm:text-sm text-slate-300 line-clamp-3 leading-relaxed max-w-xl font-medium">
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
            <div className="space-y-4 sm:space-y-6">
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

              {/* Row 2: On Air TV Shows */}
              <CategoryRow
                title="On Air TV Shows"
                subtitle="TV series currently airing episodes this week"
                icon={Tv}
                items={onAirTV}
                watchedItems={watchedItems}
                openAddDialog={openAddDialog}
                navigate={navigate}
                isSelectMode={isSelectMode}
                selectedItems={selectedItems}
                setSelectedItems={setSelectedItems}
              />

              {/* Row 3: Trending Indian Movies */}
              <CategoryRow
                title="Trending Indian Movies"
                subtitle="Top trending movies in India"
                icon={Sparkles}
                items={trendingIndian}
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
