import React, { useState, useEffect } from 'react'
import { Search, Film, Tv, Plus, Check, Star, Calendar, Loader, ListChecks, CheckSquare, Square, X } from 'lucide-react'
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

export default function ExploreTMDB({ watchedItems, onAddItem, onAddItems, onRemoveItem, user }) {
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState('movie')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [expandingSeasons, setExpandingSeasons] = useState(false)
  const [addingItem, setAddingItem] = useState(null)
  const [userReview, setUserReview] = useState('')
  const [userStatus, setUserStatus] = useState('completed')
  const [error, setError] = useState('')

  // Selection states
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedItems, setSelectedItems] = useState({})
  const [lists, setLists] = useState([])

  const navigate = useNavigate()

  const isCloud = isFirebaseConfigured() && user

  // Load custom lists for active tab
  useEffect(() => {
    const fetchLists = async () => {
      try {
        if (isCloud && user) {
          const cloudLists = await loadFirebaseLists(user.uid, activeTab)
          setLists(cloudLists)
        } else {
          const localListsRaw = localStorage.getItem('local_custom_lists')
          if (localListsRaw) {
            const parsed = JSON.parse(localListsRaw)
            const filtered = parsed.filter(list => list.type === activeTab)
            setLists(filtered)
          } else {
            setLists([])
          }
        }
      } catch (err) {
        console.error('Failed to load lists in ExploreTMDB:', err)
      }
    }
    fetchLists()
  }, [activeTab, user, isCloud])

  // Expand each TV show into N per-season cards
  const expandTVIntoSeasons = async (shows) => {
    if (!shows.length) return []
    setExpandingSeasons(true)
    try {
      const detailsPromises = shows.map(show =>
        fetchTMDB(`/tv/${show.id}`).catch(() => ({ number_of_seasons: 1 }))
      )
      const details = await Promise.all(detailsPromises)
      const expanded = []
      shows.forEach((show, idx) => {
        const numSeasons = details[idx]?.number_of_seasons || 1
        for (let s = 1; s <= numSeasons; s++) {
          expanded.push({ ...show, season_number: s, _totalSeasons: numSeasons })
        }
      })
      return expanded
    } finally {
      setExpandingSeasons(false)
    }
  }

  const fetchAndSet = async (endpoint, params = {}) => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchTMDB(endpoint, params)
      const raw = data.results || []
      if (activeTab === 'tv') {
        const expanded = await expandTVIntoSeasons(raw)
        setResults(expanded)
      } else {
        setResults(raw)
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Failed to fetch from TMDB. Check your API key in Settings.')
    } finally {
      setLoading(false)
    }
  }

  // Load popular on mount / tab switch
  useEffect(() => {
    const endpoint = activeTab === 'movie' ? '/movie/popular' : '/tv/popular'
    fetchAndSet(endpoint)
    setSelectedItems({})
    setIsSelectMode(false)
  }, [activeTab])

  // Debounced live search
  useEffect(() => {
    if (!query.trim()) return
    const timer = setTimeout(() => {
      const endpoint = activeTab === 'movie' ? '/search/movie' : '/search/tv'
      fetchAndSet(endpoint, { query: query.trim() })
    }, 500)
    return () => clearTimeout(timer)
  }, [query, activeTab])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (!query.trim()) return
    const endpoint = activeTab === 'movie' ? '/search/movie' : '/search/tv'
    fetchAndSet(endpoint, { query: query.trim() })
  }

  const openAddDialog = (item) => {
    setUserReview('')
    setUserStatus('completed')
    setAddingItem(item)
  }

  const handleAddConfirm = () => {
    if (!addingItem) return
    const isMovie = activeTab === 'movie'
    const releaseDate = isMovie ? addingItem.release_date : addingItem.first_air_date
    const releaseYear = releaseDate ? releaseDate.split('-')[0] : ''

    const newItem = {
      title: isMovie ? addingItem.title : addingItem.name,
      type: activeTab,
      tmdb_id: addingItem.id.toString(),
      poster_path: addingItem.poster_path,
      review: userReview.trim(),
      release_year: releaseYear,
      status: userStatus,
      country: getCountryFromTMDBItem(addingItem),
      original_language: addingItem.original_language || 'en',
      ...(activeTab === 'tv' && { season_number: addingItem.season_number })
    }

    onAddItem(newItem)
    setAddingItem(null)
  }

  const handleToggleSelectAll = () => {
    const allCurrentKeys = results.map(item =>
      activeTab === 'tv' ? `${item.id}-s${item.season_number}` : item.id.toString()
    )
    const allCurrentAreSelected = allCurrentKeys.length > 0 && allCurrentKeys.every(key => !!selectedItems[key])

    if (allCurrentAreSelected) {
      setSelectedItems(prev => {
        const next = { ...prev }
        allCurrentKeys.forEach(key => {
          delete next[key]
        })
        return next
      })
    } else {
      setSelectedItems(prev => {
        const next = { ...prev }
        results.forEach(item => {
          const key = activeTab === 'tv' ? `${item.id}-s${item.season_number}` : item.id.toString()
          next[key] = item
        })
        return next
      })
    }
  }

  const handleBulkAdd = async (status, listId = null) => {
    const selectedList = Object.values(selectedItems)
    if (selectedList.length === 0) return

    const itemsToAdd = []

    for (const item of selectedList) {
      // Check if already in watchedItems
      const alreadyAdded = watchedItems.find(wi => {
        if (wi.type !== activeTab) return false
        if (wi.tmdb_id !== item.id.toString()) return false
        if (activeTab === 'tv') return wi.season_number === item.season_number
        return true
      })

      if (!alreadyAdded) {
        const isMovie = activeTab === 'movie'
        const releaseDate = isMovie ? item.release_date : item.first_air_date
        const releaseYear = releaseDate ? releaseDate.split('-')[0] : ''

        itemsToAdd.push({
          title: isMovie ? item.title : item.name,
          type: activeTab,
          tmdb_id: item.id.toString(),
          poster_path: item.poster_path || '',
          review: '',
          release_year: releaseYear,
          status: status || 'planned',
          country: getCountryFromTMDBItem(item),
          original_language: item.original_language || 'en',
          ...(activeTab === 'tv' && { season_number: item.season_number })
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
      // Add items in bulk using onAddItems
      const addedItems = await onAddItems(itemsToAdd)

      // If listId is specified, add the new items to that custom list
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

  // For TV: match on both tmdb_id AND season_number
  const getWatchedInstance = (item) => {
    return watchedItems.find(wi => {
      if (wi.type !== activeTab) return false
      if (wi.tmdb_id !== item.id.toString()) return false
      if (activeTab === 'tv') return wi.season_number === item.season_number
      return true
    })
  }

  const isDemo = !isTMDBConfigured()
  const isLoadingAny = loading || expandingSeasons

  const allCurrentKeys = results.map(item =>
    activeTab === 'tv' ? `${item.id}-s${item.season_number}` : item.id.toString()
  )
  const allCurrentAreSelected = results.length > 0 && allCurrentKeys.every(key => !!selectedItems[key])
  const selectedCount = Object.keys(selectedItems).length

  return (
    <div className="py-6 px-4">
      {/* Header */}
      {isDemo && (
        <div className="mb-8 flex justify-end">
          <div className="bg-amber-950/20 border border-amber-500/20 rounded-xl px-4 py-2 text-xs text-amber-400 max-w-sm">
            💡 Demo Mode. Add your TMDB API Key in Settings for live data.
          </div>
        </div>
      )}

      {/* Search Bar & Multi-select Control */}
      <div className="max-w-2xl mx-auto mb-8 flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${activeTab === 'movie' ? 'movies' : 'TV shows by season'}...`}
              className="w-full bg-slate-900/50 border border-slate-800 focus:border-violet-500 focus:outline-none rounded-2xl pl-12 pr-28 py-4 text-white text-lg placeholder-slate-500 transition-all shadow-xl"
            />
            <div className="absolute right-2 flex gap-1">
              <button type="button" onClick={() => setActiveTab('movie')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'movie' ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                <Film className="w-3.5 h-3.5" /> Movies
              </button>
              <button type="button" onClick={() => setActiveTab('tv')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'tv' ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                <Tv className="w-3.5 h-3.5" /> TV
              </button>
            </div>
          </div>
        </form>

        {results.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setIsSelectMode(!isSelectMode)
              setSelectedItems({})
            }}
            className={`flex items-center justify-center gap-1.5 px-4 py-4 rounded-2xl border text-sm font-semibold cursor-pointer transition-all whitespace-nowrap ${isSelectMode
                ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20'
                : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white'
              }`}
          >
            <ListChecks className="w-5 h-5" />
            <span>{isSelectMode ? 'Cancel Selection' : 'Select Items'}</span>
          </button>
        )}
      </div>

      {error && (
        <div className="max-w-md mx-auto p-4 bg-rose-950/20 border border-rose-500/20 text-rose-300 text-center rounded-xl mb-6 text-sm">
          {error}
        </div>
      )}

      {isLoadingAny ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
          <Loader className="w-10 h-10 animate-spin text-violet-500" />
          <span>{expandingSeasons ? 'Loading season data...' : 'Searching TMDB...'}</span>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-6">
          {results.map((item) => {
            const watched = getWatchedInstance(item)
            const isMovie = activeTab === 'movie'
            const releaseDate = isMovie ? item.release_date : item.first_air_date
            const releaseYear = releaseDate ? releaseDate.split('-')[0] : 'N/A'
            const cardKey = activeTab === 'tv' ? `${item.id}-s${item.season_number}` : item.id.toString()
            const isSelected = !!selectedItems[cardKey]

            return (
              <div key={cardKey}
                className={`group relative bg-slate-900/40 border overflow-hidden shadow-lg transition-all duration-300 flex flex-col h-full ${isSelectMode && isSelected
                    ? 'border-violet-500 ring-2 ring-violet-500/20 shadow-violet-500/5'
                    : 'border-slate-800 hover:border-slate-700/60'
                  }`}>

                {/* Poster */}
                <div className="aspect-[2/3] w-full relative overflow-hidden bg-slate-950 cursor-pointer"
                  onClick={() => {
                    if (isSelectMode) {
                      setSelectedItems(prev => {
                        const next = { ...prev }
                        if (next[cardKey]) {
                          delete next[cardKey]
                        } else {
                          next[cardKey] = item
                        }
                        return next
                      })
                    } else {
                      navigate(`/explore/${activeTab}/${item.id}`)
                    }
                  }}>
                  <img
                    src={getPosterUrl(item.poster_path)}
                    alt={isMovie ? item.title : item.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />

                  {/* Multi-Select Checkbox overlay */}
                  {isSelectMode && (
                    <div className="absolute top-2 left-2 z-20">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedItems(prev => {
                            const next = { ...prev }
                            if (next[cardKey]) {
                              delete next[cardKey]
                            } else {
                              next[cardKey] = item
                            }
                            return next
                          })
                        }}
                        className="p-1.5 rounded-lg bg-slate-950/90 border border-slate-800 text-violet-400 hover:text-white transition-all cursor-pointer"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-violet-400 fill-violet-400/20" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-500" />
                        )}
                      </button>
                    </div>
                  )}

                  {/* Season Badge */}
                  {activeTab === 'tv' && item.season_number && (
                    <div className="absolute bottom-2 left-2 bg-slate-950/90 backdrop-blur border border-violet-700/60 text-violet-300 text-[10px] font-black px-2 py-0.5 rounded-md tracking-wider">
                      S{item.season_number}
                    </div>
                  )}

                  {/* Hover overlay */}
                  {!isSelectMode && (
                    <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                      <p className="text-xs text-slate-300 line-clamp-4 mb-3">
                        {item.overview || 'No synopsis available.'}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800 pt-2">
                        <span className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          {(item.vote_average || 0).toFixed(1)}/10
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {releaseYear}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Watched check */}
                  {watched && (
                    <div className="absolute top-2 right-2 bg-emerald-500/90 backdrop-blur text-white p-1.5 rounded-lg shadow-lg border border-emerald-400/20">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="p-3.5 flex flex-col justify-between flex-grow">
                  <h3 className="font-semibold text-sm text-slate-200 line-clamp-1 group-hover:text-white transition-colors mb-1">
                    {isMovie ? item.title : item.name}
                    {activeTab === 'tv' && item.season_number && (
                      <span className="text-slate-500 font-normal"> · S{item.season_number}</span>
                    )}
                  </h3>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-[11px] text-slate-500 font-medium">{releaseYear}</span>
                    {!isSelectMode && (
                      watched ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Are you sure you want to delete "${isMovie ? item.title : item.name}"?`)) {
                              onRemoveItem(watched.id)
                            }
                          }}
                          className="text-[11px] text-rose-400 hover:text-rose-300 font-medium border border-rose-950 hover:bg-rose-950/20 px-2 py-1 rounded cursor-pointer transition-colors">
                          Remove
                        </button>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); openAddDialog(item) }}
                          className="bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-bold px-2 py-1 rounded flex items-center gap-1 shadow-md active:scale-95 transition-all cursor-pointer">
                          <Plus className="w-3 h-3" /> Add
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!isLoadingAny && results.length === 0 && (
        <div className="text-center py-24 text-slate-500 border border-dashed border-slate-800 rounded-2xl max-w-md mx-auto">
          <Film className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <h3 className="font-bold text-slate-400 mb-1">No items found</h3>
          <p className="text-sm">Try different search terms or check your connection.</p>
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
                className="text-xs font-semibold text-slate-350 hover:text-white bg-slate-800 border border-slate-750 px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
              >
                {allCurrentAreSelected ? 'Deselect All Page' : 'Select All Page'}
              </button>
              <span className="text-xs font-bold text-slate-400">
                <span className="text-violet-400 font-extrabold text-sm">{selectedCount}</span> items selected
              </span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Add Status Dropdown */}
              <div className="flex items-center gap-1 bg-slate-800 border border-slate-750 rounded-xl px-2 py-1">
                <select
                  disabled={selectedCount === 0}
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
                  <option value="watching">Watching Now</option>
                  <option value="pending">Pending</option>
                  <option value="planned">Planned</option>
                  <option value="backlog">Backlog</option>
                </select>
              </div>

              {/* Add to Custom List Dropdown */}
              {lists.length > 0 && (
                <div className="flex items-center gap-1 bg-slate-800 border border-slate-750 rounded-xl px-2 py-1">
                  <select
                    disabled={selectedCount === 0}
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

      {/* Add Dialog */}
      {addingItem && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-1">
              Log {activeTab === 'movie' ? 'Movie' : `Season ${addingItem.season_number}`}
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Adding <strong className="text-slate-200">
                {activeTab === 'movie' ? addingItem.title : `${addingItem.name} — Season ${addingItem.season_number}`}
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500">
                  <option value="completed">Completed</option>
                  <option value="watching">Watching Now</option>
                  <option value="pending">Pending</option>
                  <option value="planned">Planned (Watchlist)</option>
                  <option value="backlog">Planned (Backlog)</option>
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
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl text-sm transition-all cursor-pointer">
                Cancel
              </button>
              <button
                onClick={handleAddConfirm}
                className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5">
                <Plus className="w-4 h-4" /> Add to List
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
