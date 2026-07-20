import React, { useState, useEffect, useRef } from 'react'
import { Search, Film, Tv, Plus, Check, Star, Calendar, Loader, ListChecks, CheckSquare, Square, X, ChevronLeft, ChevronRight, Flame, Sparkles, Trophy, TrendingUp, Info, Play } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
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
  return item.title ? 'movie' : 'tv'
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
            wi.type === mediaType && wi.tmdb_id === item.id.toString()
          )

          return (
            <div
              key={cardKey}
              className={`flex-shrink-0 w-36 sm:w-44 md:w-48 group/card relative bg-slate-900/40 border rounded-2xl overflow-hidden shadow-lg transition-all duration-300 flex flex-col snap-start ${
                isSelectMode && isSelected
                  ? 'border-violet-500 ring-2 ring-violet-500/20 shadow-violet-500/10'
                  : 'border-slate-800/80 hover:border-slate-700/80 hover:-translate-y-1'
              }`}
            >
              {/* Media Type & Rating Badges */}
              <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1">
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md backdrop-blur-md shadow-md border ${
                  isMovie 
                    ? 'bg-sky-500/80 text-white border-sky-400/30' 
                    : 'bg-indigo-500/80 text-white border-indigo-400/30'
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
                  <div className="absolute inset-x-0 bottom-0 bg-emerald-950/90 backdrop-blur-md border-t border-emerald-500/30 text-emerald-300 text-[11px] font-bold py-1 px-2 flex items-center justify-center gap-1">
                    <Check className="w-3.5 h-3.5" /> In Library
                  </div>
                )}
              </div>

              {/* Card Meta */}
              <div className="p-3 flex flex-col flex-1 justify-between bg-slate-900/60">
                <div>
                  <h3 className="font-semibold text-xs sm:text-sm text-slate-200 line-clamp-1 group-hover/card:text-violet-400 transition-colors">
                    {isMovie ? item.title : item.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">{releaseYear}</p>
                </div>

                {!isSelectMode && !watched && (
                  <button
                    onClick={(e) => { e.stopPropagation(); openAddDialog(item) }}
                    className="mt-2.5 w-full bg-slate-800 hover:bg-violet-600 text-slate-300 hover:text-white text-[11px] font-bold py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer border border-slate-700/60 hover:border-violet-500"
                  >
                    <Plus className="w-3 h-3" /> Add to List
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function ExploreTMDB({ watchedItems = [], onAddItem, onAddItems, onRemoveItem, user }) {
  const [query, setQuery] = useState('')
  const [searchFilter, setSearchFilter] = useState('all') // 'all' | 'movie' | 'tv'
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  
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
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedItems, setSelectedItems] = useState({})
  const [lists, setLists] = useState([])

  const navigate = useNavigate()
  const isCloud = isFirebaseConfigured() && user

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

  // Live Unified Search
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const timer = setTimeout(async () => {
      try {
        const data = await fetchTMDB('/search/multi', { query: query.trim() })
        const validResults = (data.results || []).filter(i => i.poster_path && i.media_type !== 'person')
        setSearchResults(validResults)
      } catch (err) {
        console.error('Search error:', err)
      } finally {
        setIsSearching(false)
      }
    }, 400)

    return () => clearTimeout(timer)
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
    return true
  })

  // Active Hero Slide Item
  const featuredSlides = trending.slice(0, 8)
  const activeSlide = featuredSlides[bannerIndex] || featuredSlides[0]

  return (
    <div className="py-4 px-2 sm:px-4 max-w-7xl mx-auto space-y-8">

      {/* Demo Mode Notice */}
      {isDemo && (
        <div className="flex justify-end">
          <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl px-4 py-2 text-xs text-amber-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Demo Mode. Add your TMDB API Key in Settings for live data.
          </div>
        </div>
      )}

      {/* Top Search & Filter Section */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all Movies & TV Shows by title..."
            className="w-full bg-slate-900/80 border border-slate-800 focus:border-violet-500 focus:outline-none rounded-2xl pl-12 pr-12 py-3.5 text-white text-base placeholder-slate-500 transition-all shadow-xl"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Multi-Select Control Toggle */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={() => {
              setIsSelectMode(!isSelectMode)
              setSelectedItems({})
            }}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border text-xs sm:text-sm font-semibold cursor-pointer transition-all whitespace-nowrap ${
              isSelectMode
                ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <ListChecks className="w-4 h-4" />
            <span>{isSelectMode ? 'Cancel Selection' : 'Select Items'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="max-w-md mx-auto p-4 bg-rose-950/20 border border-rose-500/20 text-rose-300 text-center rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* ────────────────── SEARCH RESULTS VIEW ────────────────── */}
      {query.trim() ? (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-violet-400" />
              Search Results for <span className="text-violet-400">"{query}"</span>
            </h2>

            {/* Filter Chips */}
            <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
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
            </div>
          </div>

          {isSearching ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <Loader className="w-8 h-8 animate-spin text-violet-500" />
              <span className="text-sm">Searching Movies & TV Shows...</span>
            </div>
          ) : filteredSearchResults.length === 0 ? (
            <div className="text-center py-20 text-slate-500 border border-dashed border-slate-800 rounded-2xl max-w-md mx-auto">
              <Film className="w-10 h-10 text-slate-700 mx-auto mb-2" />
              <h3 className="font-bold text-slate-400">No results found</h3>
              <p className="text-xs text-slate-500 mt-1">Try a different title or keyword.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
              {filteredSearchResults.map((item) => {
                const mediaType = getItemMediaType(item)
                const isMovie = mediaType === 'movie'
                const releaseDate = isMovie ? item.release_date : item.first_air_date
                const releaseYear = releaseDate ? releaseDate.split('-')[0] : 'N/A'
                const cardKey = item.id.toString()
                const isSelected = !!selectedItems[cardKey]

                const watched = watchedItems.find(wi =>
                  wi.type === mediaType && wi.tmdb_id === item.id.toString()
                )

                return (
                  <div
                    key={cardKey}
                    className={`group/card relative bg-slate-900/40 border rounded-2xl overflow-hidden shadow-lg transition-all duration-300 flex flex-col ${
                      isSelectMode && isSelected
                        ? 'border-violet-500 ring-2 ring-violet-500/20 shadow-violet-500/10'
                        : 'border-slate-800 hover:border-slate-700/80 hover:-translate-y-1'
                    }`}
                  >
                    {/* Media Type & Rating */}
                    <div className="absolute top-2.5 left-2.5 z-10">
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

                      {!isSelectMode && watched && (
                        <div className="absolute inset-x-0 bottom-0 bg-emerald-950/90 backdrop-blur-md border-t border-emerald-500/30 text-emerald-300 text-[11px] font-bold py-1 px-2 flex items-center justify-center gap-1">
                          <Check className="w-3.5 h-3.5" /> In Library
                        </div>
                      )}
                    </div>

                    <div className="p-3 flex flex-col flex-1 justify-between bg-slate-900/60">
                      <div>
                        <h3 className="font-semibold text-xs sm:text-sm text-slate-200 line-clamp-1 group-hover/card:text-violet-400 transition-colors">
                          {isMovie ? item.title : item.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">{releaseYear}</p>
                      </div>

                      {!isSelectMode && !watched && (
                        <button
                          onClick={(e) => { e.stopPropagation(); openAddDialog(item) }}
                          className="mt-2.5 w-full bg-slate-800 hover:bg-violet-600 text-slate-300 hover:text-white text-[11px] font-bold py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer border border-slate-700/60 hover:border-violet-500"
                        >
                          <Plus className="w-3 h-3" /> Add to List
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        /* ────────────────── UNIFIED DASHBOARD FEED ────────────────── */
        <div className="space-y-12">

          {/* FEATURED HERO BANNER SLIDESHOW WITH SWIPING TRANSITION */}
          {featuredSlides.length > 0 && (
            <div
              className="relative w-full min-h-[380px] sm:min-h-[440px] md:min-h-[480px] rounded-3xl overflow-hidden shadow-2xl transition-all duration-700 group/hero"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {/* Horizontal Sliding Container */}
              <div
                className="flex w-full h-full transition-transform duration-700 ease-out"
                style={{ transform: `translateX(-${bannerIndex * 100}%)` }}
              >
                {featuredSlides.map((slide, idx) => (
                  <div
                    key={slide.id || idx}
                    className="w-full min-w-full flex-shrink-0 relative min-h-[380px] sm:min-h-[440px] md:min-h-[480px] flex flex-col justify-end overflow-hidden"
                  >
                    {/* Background Backdrop Image */}
                    <div className="absolute inset-0 bg-slate-950 overflow-hidden">
                      <img
                        src={`https://image.tmdb.org/t/p/w1280${slide.backdrop_path || slide.poster_path}`}
                        alt={slide.title || slide.name}
                        className={`w-full h-full object-cover object-top opacity-100 transition-transform duration-[30000ms] ease-out ${
                          idx === bannerIndex ? 'scale-[1.07]' : 'scale-100'
                        }`}
                      />
                      {/* Only bottom fade overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
                    </div>

                    {/* Slide Details Content */}
                    <div className="relative z-10 p-6 sm:p-10 max-w-2xl space-y-4">
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

                      {/* Sub-info Badges */}
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
                ))}
              </div>

              {/* Manual Carousel Arrow Controls */}
              <div className="absolute right-4 bottom-6 z-20 flex items-center gap-2">
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
