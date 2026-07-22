import React, { useState, useEffect, useMemo } from 'react'
import { Star, Calendar, Trash2, Edit, MessageSquare, Tag, Eye, Filter, ArrowUpDown, Film, Tv, Gamepad, CheckSquare, Square, Check, X, ListChecks, Sparkles, RefreshCw, Globe, MapPin } from 'lucide-react'
import { getPosterUrl, fetchTMDB, isTMDBConfigured } from '../lib/tmdb'
import CustomLists from './CustomLists'
import { isFirebaseConfigured, loadFirebaseLists, updateFirebaseListItems } from '../lib/firebase'

const LANGUAGE_NAMES = {
  'en': 'English',
  'hi': 'Hindi',
  'ta': 'Tamil',
  'te': 'Telugu',
  'ml': 'Malayalam',
  'kn': 'Kannada',
  'mr': 'Marathi',
  'bn': 'Bengali',
  'pa': 'Punjabi',
  'gu': 'Gujarati',
  'ur': 'Urdu',
  'or': 'Odia',
  'as': 'Assamese',
  'bho': 'Bhojpuri',
  'ja': 'Japanese',
  'ko': 'Korean',
  'es': 'Spanish',
  'fr': 'French',
  'it': 'Italian',
  'de': 'German',
  'zh': 'Chinese',
  'cn': 'Chinese',
  'ru': 'Russian',
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

export default function MediaGrid({ items, typeFilter, onUpdateItem, onRemoveItem, onItemClick, onAddItem, onAddItems, user }) {
  const [statusFilter, setStatusFilter] = useState(() => {
    return localStorage.getItem('cinelog_status_filter') || 'all'
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('newest_added') // 'newest_added', 'release_year'
  const [editingItem, setEditingItem] = useState(null)
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [yearFilter, setYearFilter] = useState('all')
  const [languageFilter, setLanguageFilter] = useState('all')
  const [countryFilter, setCountryFilter] = useState('all')
  const [hideIndian, setHideIndian] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setYearFilter('all')
    setLanguageFilter('all')
    setCountryFilter('all')
    setHideIndian(false)
    setCurrentPage(1)
  }, [typeFilter])

  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, searchQuery, sortBy, yearFilter, languageFilter, countryFilter, hideIndian])

  useEffect(() => {
    localStorage.setItem('cinelog_status_filter', statusFilter)
  }, [statusFilter])

  // Auto-fill missing original_language and country for existing items with tmdb_id
  useEffect(() => {
    const itemsToHeal = items.filter(item => 
      item.tmdb_id && (
        !item.original_language || item.original_language === '' || 
        !item.country || item.country === ''
      )
    )
    if (itemsToHeal.length === 0 || !isTMDBConfigured()) return

    let isMounted = true
    const healMetadata = async () => {
      const batch = itemsToHeal.slice(0, 15)
      for (const item of batch) {
        if (!isMounted) break
        try {
          const endpoint = item.type === 'movie' ? `/movie/${item.tmdb_id}` : `/tv/${item.tmdb_id}`
          const details = await fetchTMDB(endpoint)
          if (details && isMounted) {
            const updates = {}
            
            // Resolve language if missing
            if (!item.original_language || item.original_language === '') {
              if (details.original_language) {
                updates.original_language = details.original_language
              }
            }
            
            // Resolve country if missing
            if (!item.country || item.country === '') {
              let resolvedCountry = 'Unknown'
              if (details.origin_country && Array.isArray(details.origin_country) && details.origin_country.length > 0) {
                const code = details.origin_country[0].toUpperCase()
                resolvedCountry = COUNTRY_MAP[code] || code
              } else if (details.production_countries && Array.isArray(details.production_countries) && details.production_countries.length > 0) {
                const code = details.production_countries[0].iso_3166_1.toUpperCase()
                resolvedCountry = COUNTRY_MAP[code] || code
              } else if (details.original_language || item.original_language) {
                const lang = (details.original_language || item.original_language).toLowerCase()
                resolvedCountry = LANG_TO_COUNTRY[lang] || 'Unknown'
              }
              updates.country = resolvedCountry
            }

            if (Object.keys(updates).length > 0) {
              onUpdateItem(item.id, updates)
            }
          }
        } catch (err) {
          // Ignore individual fetch errors
        }
      }
    }
    healMetadata()
    return () => { isMounted = false }
  }, [items, onUpdateItem])
  
  // Multi-Select Mode States
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [lists, setLists] = useState([])
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState(0)

  const isCloud = isFirebaseConfigured() && user

  // Load custom lists for multi-select custom list operations
  useEffect(() => {
    const fetchLists = async () => {
      try {
        if (isCloud) {
          const cloudLists = await loadFirebaseLists(user.uid, typeFilter)
          setLists(cloudLists)
        } else {
          const localListsRaw = localStorage.getItem('local_custom_lists')
          if (localListsRaw) {
            const parsed = JSON.parse(localListsRaw)
            const filtered = parsed.filter(list => list.type === typeFilter)
            setLists(filtered)
          } else {
            setLists([])
          }
        }
      } catch (err) {
        console.error('Failed to load lists in MediaGrid:', err)
      }
    }
    fetchLists()
  }, [typeFilter, user, isCloud])

  // Edit Dialog States
  const [editStatus, setEditStatus] = useState('completed')
  const [editReview, setEditReview] = useState('')

  // Get all unique release years from items of the active type
  const availableYears = Array.from(new Set(
    items
      .filter(item => item.type === typeFilter)
      .map(item => item.release_year)
      .filter(Boolean)
  )).sort((a, b) => parseInt(b) - parseInt(a))

  // Get all unique original languages from items of active type + popular defaults
  const availableLanguagesMap = new Map()
  const COMMON_LANG_CODES = ['en', 'hi', 'ta', 'te', 'ml', 'kn', 'mr', 'bn', 'ja', 'ko', 'es', 'fr', 'de']
  
  items
    .filter(item => item.type === typeFilter)
    .forEach(item => {
      const code = (item.original_language || '').toLowerCase().trim()
      if (code && !availableLanguagesMap.has(code)) {
        availableLanguagesMap.set(code, {
          code,
          name: LANGUAGE_NAMES[code] || code.toUpperCase()
        })
      }
    })

  COMMON_LANG_CODES.forEach(code => {
    if (!availableLanguagesMap.has(code)) {
      availableLanguagesMap.set(code, {
        code,
        name: LANGUAGE_NAMES[code] || code.toUpperCase()
      })
    }
  })

  const availableLanguages = Array.from(availableLanguagesMap.values())
    .sort((a, b) => a.name.localeCompare(b.name))

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

  const matchCountry = (itemCountry, targetFilter) => {
    if (targetFilter === 'all') return true
    if (!itemCountry) return false
    return normalizeCountryName(itemCountry) === normalizeCountryName(targetFilter)
  }

  const availableCountries = Array.from(new Set(
    items
      .filter(item => item.type === typeFilter)
      .map(item => normalizeCountryName(item.country))
      .filter(Boolean)
  )).sort((a, b) => a.localeCompare(b))

  // ── TV Show grouping helper ──────────────────────────────────────────────
  // Collapses all per-season items for a show into one representative card.
  const groupTVShows = (tvItems) => {
    const map = new Map()
    for (const s of tvItems) {
      const key = s.tmdb_id || s.id
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(s)
    }
    return Array.from(map.values()).map(seasons => {
      const sorted = [...seasons].sort((a, b) => (a.season_number || 1) - (b.season_number || 1))
      const rep = sorted.reduce((a, b) =>
        new Date(b.watched_at || b.created_at || 0) > new Date(a.watched_at || a.created_at || 0) ? b : a
      , sorted[0])
      const completedSeasons = sorted.filter(s => s.status === 'completed')
      const watchingSeasons  = sorted.filter(s => s.status === 'watching' || s.status === 'pending')
      const totalSeasons     = sorted.length
      const activeSeason = watchingSeasons[0] || sorted.find(s => s.status !== 'completed') || sorted[sorted.length - 1]

      const getEpProgress = (s) => {
        if (!s || !s.season_progress) return 0
        if (typeof s.season_progress === 'number') return s.season_progress
        const num = s.season_number || 1
        return s.season_progress[num] !== undefined ? Number(s.season_progress[num]) : (Object.values(s.season_progress)[0] || 0)
      }

      const rawEpProgress = getEpProgress(activeSeason)
      const activeEpisodeProgress = (activeSeason?.status === 'watching' && rawEpProgress === 0) ? 1 : rawEpProgress
      const pct = totalSeasons > 0 ? Math.round((completedSeasons.length / totalSeasons) * 100) : 0
      
      let showStatus = rep.status || 'planned'
      if (completedSeasons.length === totalSeasons && totalSeasons > 0) {
        showStatus = 'completed'
      } else if (activeSeason && activeSeason.status === 'watching') {
        showStatus = 'watching'
      } else if (activeSeason && activeEpisodeProgress === 0 && activeSeason.status !== 'completed') {
        showStatus = 'pending'
      } else if (watchingSeasons.length > 0) {
        showStatus = 'watching'
      } else if (completedSeasons.length > 0) {
        showStatus = 'watching'
      }
      return {
        ...rep,
        _isGrouped: true,
        _allSeasons: sorted,
        _completedSeasons: completedSeasons.length,
        _remainingSeasons: totalSeasons - completedSeasons.length,
        _totalSeasons: totalSeasons,
        _activeSeason: activeSeason,
        _activeEpisodeProgress: activeEpisodeProgress,
        _pct: pct,
        virtualStatus: showStatus,
        _sortDate: rep.watched_at || rep.created_at
      }
    })
  }

  // Filter virtual items based on status, year, language, and local query search
  // For TV: group by show first, then filter on the aggregated status
  const rawTVItems = typeFilter === 'tv'
    ? items.filter(item => item.type === 'tv' && item.status !== 'list_only')
    : []
  const groupedTVShows = typeFilter === 'tv' ? groupTVShows(rawTVItems) : []

  const matchLanguage = (itemLang, targetFilter) => {
    if (targetFilter === 'all') return true
    if (!itemLang) return false
    return itemLang.toLowerCase().trim() === targetFilter.toLowerCase().trim()
  }

  const filteredItems = typeFilter === 'tv'
    ? groupedTVShows
        .filter(show => statusFilter === 'all' || show.virtualStatus === statusFilter)
        .filter(show => yearFilter === 'all' || show.release_year === yearFilter)
        .filter(show => matchLanguage(show.original_language, languageFilter))
        .filter(show => matchCountry(show.country, countryFilter))
        .filter(show => !hideIndian || normalizeCountryName(show.country) !== 'India')
        .filter(show => show.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : items
        .filter(item => item.type === typeFilter && item.status !== 'list_only')
        .map(item => ({ ...item, virtualStatus: item.status || 'planned' }))
        .filter(item => statusFilter === 'all' || item.virtualStatus === statusFilter)
        .filter(item => yearFilter === 'all' || item.release_year === yearFilter)
        .filter(item => matchLanguage(item.original_language, languageFilter))
        .filter(item => matchCountry(item.country, countryFilter))
        .filter(item => !hideIndian || normalizeCountryName(item.country) !== 'India')
        .filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()))

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'newest_added') {
      return new Date(b._sortDate || b.watched_at || b.created_at) - new Date(a._sortDate || a.watched_at || a.created_at)
    }
    if (sortBy === 'release_year') {
      return parseInt(b.release_year || 0) - parseInt(a.release_year || 0)
    }
    return 0
  })

  const ITEMS_PER_PAGE = 50
  const totalPages = Math.ceil(sortedItems.length / ITEMS_PER_PAGE) || 1
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return sortedItems.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [sortedItems, currentPage])

  const openEditDialog = (item) => {
    setEditingItem(item)
    setEditStatus(item.status || 'completed')
    setEditReview(item.review || '')
  }

  const handleUpdateConfirm = () => {
    if (!editingItem) return
    const statusChanged = editingItem.status !== editStatus
    if (statusChanged) {
      if (!window.confirm(`Are you sure you want to move "${editingItem.title}" to ${editStatus}?`)) {
        return
      }
    }
    onUpdateItem(editingItem.id, {
      status: editStatus,
      review: editReview.trim()
    })
    setEditingItem(null)
  }

  const handleToggleSelectAll = () => {
    if (selectedIds.length === sortedItems.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(sortedItems.map(item => item.id))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (window.confirm(`Are you sure you want to delete the ${selectedIds.length} selected items?`)) {
      for (const id of selectedIds) {
        await onRemoveItem(id)
      }
      setSelectedIds([])
      setIsSelectMode(false)
    }
  }

  const handleBulkStatusChange = async (newStatus) => {
    if (selectedIds.length === 0) return
    if (!window.confirm(`Are you sure you want to move the ${selectedIds.length} selected items to ${newStatus}?`)) {
      return
    }
    for (const id of selectedIds) {
      await onUpdateItem(id, { status: newStatus })
    }
    setSelectedIds([])
    setIsSelectMode(false)
  }

  const handleBulkAddToList = async (listId) => {
    if (selectedIds.length === 0 || !listId) return
    const targetList = lists.find(l => l.id === listId)
    if (!targetList) return

    if (!window.confirm(`Are you sure you want to add the ${selectedIds.length} selected items to the list "${targetList.name}"?`)) {
      return
    }

    const currentItemIds = targetList.item_ids || []
    const updatedIds = Array.from(new Set([...currentItemIds, ...selectedIds]))

    try {
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
      
      alert(`Successfully added ${selectedIds.length} items to "${targetList.name}"!`)
      setSelectedIds([])
      setIsSelectMode(false)
    } catch (err) {
      console.error('Failed to add items to list in bulk:', err)
      alert('Failed to add items to custom list.')
    }
  }

  const handleBulkSyncTMDB = async () => {
    if (selectedIds.length === 0) return
    if (!isTMDBConfigured()) {
      alert('TMDB API Key is not configured. Please add it in Settings.')
      return
    }

    setIsSyncing(true)
    setSyncProgress(0)
    
    let syncedCount = 0
    let skippedCount = 0

    for (let idx = 0; idx < selectedIds.length; idx++) {
      const id = selectedIds[idx]
      const item = items.find(i => i.id === id)
      
      if (!item || item.type === 'game') {
        skippedCount++
        setSyncProgress(Math.round(((idx + 1) / selectedIds.length) * 100))
        continue
      }

      try {
        const queryParams = { query: item.title }
        if (item.release_year) {
          if (item.type === 'movie') {
            queryParams.primary_release_year = item.release_year
          } else {
            queryParams.first_air_date_year = item.release_year
          }
        }

        const endpoint = item.type === 'movie' ? '/search/movie' : '/search/tv'
        const searchResults = await fetchTMDB(endpoint, queryParams)
        
        if (searchResults.results && searchResults.results.length > 0) {
          const match = searchResults.results[0]
          const releaseDate = item.type === 'movie' ? match.release_date : match.first_air_date
          const releaseYear = releaseDate ? releaseDate.split('-')[0] : item.release_year
          
          await onUpdateItem(id, {
            tmdb_id: match.id.toString(),
            title: item.type === 'movie' ? match.title : match.name,
            poster_path: match.poster_path || '',
            release_year: releaseYear,
            original_language: match.original_language || 'en'
          })
          syncedCount++
        } else {
          skippedCount++
        }
      } catch (err) {
        console.error(`TMDB sync failed for ${item.title}:`, err)
        skippedCount++
      }

      setSyncProgress(Math.round(((idx + 1) / selectedIds.length) * 100))
      // Throttle API calls
      await new Promise(r => setTimeout(r, 200))
    }

    setIsSyncing(false)
    alert(`TMDB Sync complete! Successfully synced: ${syncedCount} items. Skipped/Unmatched: ${skippedCount} items.`)
    setSelectedIds([])
    setIsSelectMode(false)
  }

  const getTypeLabel = () => {
    if (typeFilter === 'movie') return 'Movies'
    if (typeFilter === 'tv') return 'TV Shows'
    return 'Games'
  }

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'watching': return 'bg-sky-500/10 text-sky-400 border-sky-500/20'
      case 'pending': return 'bg-rose-500/10 text-rose-450 border-rose-500/20'
      case 'planned': return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      case 'backlog': return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
  }

  const getStatusLabel = (status) => {
    if (status === 'completed') return typeFilter === 'game' ? 'Beaten' : 'Completed'
    if (status === 'watching') return typeFilter === 'game' ? 'Playing' : 'Watching'
    if (status === 'pending') return typeFilter === 'tv' ? 'Up Next' : 'Pending'
    if (status === 'planned') return 'Planned'
    if (status === 'backlog') return 'Backlog'
    return 'Planned'
  }
  if (statusFilter === 'lists') {
    return (
      <div className="py-6 px-4">
        {/* Grid Header & Statistics */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
              {typeFilter === 'movie' && <Film className="w-6 h-6 text-violet-400" />}
              {typeFilter === 'tv' && <Tv className="w-6 h-6 text-violet-400" />}
              {typeFilter === 'game' && <Gamepad className="w-6 h-6 text-violet-400" />}
              My Custom {getTypeLabel()} Lists
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Create and manage your custom categories and collections of {getTypeLabel().toLowerCase()}.
            </p>
          </div>
        </div>

        {/* Watch Status Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-800 pb-3 overflow-x-auto">
          {[
            { id: 'all', label: 'All Items' },
            { id: 'completed', label: typeFilter === 'game' ? 'Beaten' : 'Completed' },
            { id: 'watching', label: typeFilter === 'game' ? 'Playing' : 'Watching' },
            { id: 'pending', label: typeFilter === 'tv' ? 'Up Next' : 'Pending' },
            { id: 'planned', label: 'Planned' },
            typeFilter !== 'tv' && { id: 'backlog', label: 'Backlog' },
            { id: 'lists', label: 'Custom Lists' }
          ].filter(Boolean).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-violet-600/10 border-violet-500/30 text-violet-400'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <CustomLists
          typeFilter={typeFilter}
          user={user}
          watchlistItems={items}
          onItemClick={onItemClick}
          onAddItem={onAddItem}
          onAddItems={onAddItems}
          onUpdateItem={onUpdateItem}
        />
      </div>
    )
  }

  return (
    <div className="py-6 px-4">
      {/* Grid Header & Controls */}
      <div className="mb-6 flex items-center justify-end gap-2">
        {/* Local Search & Filter & Sort Controls */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <input
            type="text"
            placeholder={`Search ${getTypeLabel().toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-900 border border-slate-800 focus:border-violet-500 focus:outline-none rounded-none px-3 py-1.5 text-xs text-white placeholder-slate-500 flex-1 min-w-0 md:w-48"
          />

          {/* Filter & Sort Dropdown */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`flex items-center justify-center w-8 h-8 rounded-none border text-xs font-semibold cursor-pointer transition-all ${
                showFilterDropdown
                  ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
              title="Filter & Sort"
            >
              <Filter className="w-3.5 h-3.5" />
            </button>

            {showFilterDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-none p-3 shadow-xl z-30 space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Sort By
                  </label>
                  <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-none px-2 py-1">
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-transparent border-none text-xs text-slate-300 focus:outline-none cursor-pointer w-full pr-1"
                    >
                      <option value="newest_added" className="bg-slate-950 text-slate-300">Newest Added</option>
                      <option value="release_year" className="bg-slate-950 text-slate-300">Release Year</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Release Year
                  </label>
                  <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-none px-2 py-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={yearFilter}
                      onChange={(e) => setYearFilter(e.target.value)}
                      className="bg-transparent border-none text-xs text-slate-350 focus:outline-none cursor-pointer w-full pr-1"
                    >
                      <option value="all" className="bg-slate-950 text-slate-300">All Years</option>
                      {availableYears.map(year => (
                        <option key={year} value={year} className="bg-slate-950 text-slate-300">{year}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Original Language
                  </label>
                  <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-none px-2 py-1">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={languageFilter}
                      onChange={(e) => setLanguageFilter(e.target.value)}
                      className="bg-transparent border-none text-xs text-slate-355 focus:outline-none cursor-pointer w-full pr-1"
                    >
                      <option value="all" className="bg-slate-950 text-slate-300">All Languages</option>
                      {availableLanguages.map(lang => (
                        <option key={lang.code} value={lang.code} className="bg-slate-950 text-slate-300">{lang.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Country
                  </label>
                  <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-none px-2 py-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={countryFilter}
                      onChange={(e) => setCountryFilter(e.target.value)}
                      className="bg-transparent border-none text-xs text-slate-350 focus:outline-none cursor-pointer w-full pr-1"
                    >
                      <option value="all" className="bg-slate-950 text-slate-300">All Countries</option>
                      {availableCountries.map(country => (
                        <option key={country} value={country} className="bg-slate-950 text-slate-300">{country}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hide Indian</span>
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
            )}
          </div>

          <button
            onClick={() => {
              setIsSelectMode(!isSelectMode)
              setSelectedIds([])
            }}
            className={`flex items-center justify-center w-8 h-8 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex-shrink-0 ${
              isSelectMode
                ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20'
                : 'bg-slate-900 border-slate-800 text-slate-450 hover:text-slate-200 hover:border-slate-700'
            }`}
            title={isSelectMode ? 'Cancel Selection' : 'Select Items'}
          >
            <ListChecks className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Watch Status Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-800 pb-3 overflow-x-auto">
        {[
          { id: 'all', label: 'All Items' },
          { id: 'completed', label: typeFilter === 'game' ? 'Beaten' : 'Completed' },
          { id: 'watching', label: typeFilter === 'game' ? 'Playing' : 'Watching' },
          { id: 'pending', label: typeFilter === 'tv' ? 'Up Next' : 'Pending' },
          { id: 'planned', label: 'Planned' },
          typeFilter !== 'tv' && { id: 'backlog', label: 'Backlog' },
          { id: 'lists', label: 'Custom Lists' }
        ].filter(Boolean).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === tab.id
                ? 'bg-violet-600/10 border-violet-500/30 text-violet-400'
                : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Media Grid Cards */}
      {sortedItems.length > 0 ? (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-3 sm:gap-6">
            {paginatedItems.map((item) => {
              // For grouped TV shows, the id is the rep item's id;
              // for multi-select we match on the representative id
              const cardId = item.id
              const isTV = item.type === 'tv'
              const activeSeason    = item._activeSeason
              const pct             = item._pct ?? 0
              const completedSeas   = item._completedSeasons ?? 0
              const remainingSeas   = item._remainingSeasons ?? 0
              const totalSeas       = item._totalSeasons ?? 0
              const activeSeasonNum = activeSeason?.season_number ?? item.season_number ?? null

              // For TV groups, navigate via the ACTIVE (in-progress) season item
              const navItem = isTV ? (item._activeSeason || item._allSeasons?.[0] || item) : item

              return (
              <div 
                key={cardId}
                className={`group relative bg-slate-900/30 border rounded-xl overflow-hidden shadow-lg transition-all duration-300 ${
                  isSelectMode && selectedIds.includes(cardId)
                    ? 'border-violet-500 ring-2 ring-violet-500/20 shadow-violet-500/5'
                    : 'border-slate-800 hover:border-slate-700/50'
                }`}
              >
                {/* Card Image */}
                <div 
                  className="aspect-[2/3] w-full relative overflow-hidden bg-slate-950 cursor-pointer"
                  onClick={() => {
                    if (isSelectMode) {
                      setSelectedIds(prev => 
                        prev.includes(cardId) 
                          ? prev.filter(id => id !== cardId) 
                          : [...prev, cardId]
                      )
                    } else {
                      onItemClick && onItemClick(navItem)
                    }
                  }}
                >
                  <img
                    src={getPosterUrl(item.poster_path)}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />

                  {/* Multi-select check icon */}
                  {isSelectMode && (
                    <div className="absolute top-2 right-2 z-20">
                      {selectedIds.includes(cardId) ? (
                        <div className="bg-violet-650 border border-violet-500 text-white p-1 rounded-lg shadow-lg">
                          <Check className="w-3.5 h-3.5 font-bold" />
                        </div>
                      ) : (
                        <div className="bg-slate-950/80 border border-slate-750 text-slate-450 p-1.5 rounded-lg shadow-lg">
                          <div className="w-3 h-3 rounded-sm border border-slate-500" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Status Tag on Top Left */}
                  <div className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold border backdrop-blur-md ${getStatusBadgeColor(item.virtualStatus)}`}>
                    {getStatusLabel(item.virtualStatus)}
                  </div>

                  {/* TV: total seasons badge top-right (non-select mode) */}
                  {isTV && !isSelectMode && totalSeas > 1 && (
                    <div className="absolute top-2 right-2 bg-slate-950/90 backdrop-blur border border-slate-700/60 text-slate-300 text-[10px] font-black px-2 py-0.5 rounded-md tracking-wider">
                      {totalSeas}S
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
                className={`px-4 py-2 border text-xs font-semibold transition-all cursor-pointer ${
                  currentPage === 1
                    ? 'bg-slate-900/40 border-slate-950 text-slate-600 cursor-not-allowed opacity-50'
                    : 'bg-slate-900 border-slate-800 text-slate-450 hover:text-slate-200 hover:border-slate-700 active:scale-95'
                }`}
              >
                Previous
              </button>
              <span className="text-xs font-bold text-slate-450">
                Page <span className="text-white">{currentPage}</span> of <span className="text-white">{totalPages}</span>
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className={`px-4 py-2 border text-xs font-semibold transition-all cursor-pointer ${
                  currentPage === totalPages
                    ? 'bg-slate-900/40 border-slate-950 text-slate-600 cursor-not-allowed opacity-50'
                    : 'bg-slate-900 border-slate-800 text-slate-450 hover:text-slate-200 hover:border-slate-700 active:scale-95'
                }`}
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        /* Empty Grid State */
        <div className="text-center py-20 border border-dashed border-slate-800 rounded-2xl max-w-md mx-auto mt-6">
          <Filter className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <h3 className="font-bold text-slate-400 mb-1">No items found</h3>
          <p className="text-sm text-slate-500">
            {searchQuery 
              ? 'Try clearing your search keyword.' 
              : `Your log for ${getTypeLabel().toLowerCase()} is empty.`}
          </p>
        </div>
      )}

      {/* Editing Dialog Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <h3 className="text-xl font-bold text-white mb-1">
              Edit Logged Details
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Update rating, notes or watch progress for <strong className="text-slate-200">{editingItem.title}</strong>.
            </p>

            <div className="space-y-4">
              {/* Status Option */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Watch/Play Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500"
                >
                  <option value="completed">Completed</option>
                  <option value="watching">Active (Watching/Playing)</option>
                  <option value="pending">{(editingItem?.type === 'tv' || typeFilter === 'tv') ? 'Up Next' : 'Pending'}</option>
                  <option value="planned">Planned (Watchlist)</option>
                  {(editingItem?.type !== 'tv' && typeFilter !== 'tv') && <option value="backlog">Planned (Backlog)</option>}
                </select>
              </div>

              {/* Review area */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  My Notes & Review
                </label>
                <textarea
                  rows="4"
                  value={editReview}
                  onChange={(e) => setEditReview(e.target.value)}
                  placeholder="Update your review..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingItem(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl text-sm transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateConfirm}
                className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bulk Actions Bar */}
      {isSelectMode && (
        <div className="fixed bottom-6 inset-x-4 z-40 flex justify-center pointer-events-none animate-slide-in-up">
          <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-lg p-3.5 px-6 rounded-2xl flex flex-wrap items-center justify-between gap-4 max-w-4xl w-full shadow-2xl pointer-events-auto">
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleSelectAll}
                className="text-xs font-semibold text-slate-350 hover:text-white bg-slate-800 border border-slate-750 px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
              >
                {selectedIds.length === sortedItems.length ? 'Deselect All' : 'Select All'}
              </button>
              <span className="text-xs font-bold text-slate-400">
                <span className="text-violet-400 font-extrabold text-sm">{selectedIds.length}</span> of {sortedItems.length} selected
              </span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Change Status Dropdown */}
              <div className="flex items-center gap-1 bg-slate-800 border border-slate-750 rounded-xl px-2 py-1">
                <select
                  disabled={selectedIds.length === 0}
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBulkStatusChange(e.target.value)
                      e.target.value = ''
                    }
                  }}
                  className="bg-transparent border-none text-xs text-slate-200 font-semibold focus:outline-none cursor-pointer pr-1 disabled:opacity-50"
                >
                  <option value="">Move Status...</option>
                  <option value="completed">{typeFilter === 'game' ? 'Beaten' : 'Completed'}</option>
                  <option value="watching">{typeFilter === 'game' ? 'Playing' : 'Watching'}</option>
                  <option value="pending">{typeFilter === 'tv' ? 'Up Next' : 'Pending'}</option>
                  <option value="planned">Planned (Watchlist)</option>
                  {typeFilter !== 'tv' && <option value="backlog">Backlog</option>}
                </select>
              </div>

              {/* Add to Custom List Dropdown */}
              {lists.length > 0 && (
                <div className="flex items-center gap-1 bg-slate-800 border border-slate-750 rounded-xl px-2 py-1">
                  <select
                    disabled={selectedIds.length === 0}
                    onChange={(e) => {
                      if (e.target.value) {
                        handleBulkAddToList(e.target.value)
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

              {/* Sync with TMDB */}
              {typeFilter !== 'game' && (
                <button
                  onClick={handleBulkSyncTMDB}
                  disabled={selectedIds.length === 0 || isSyncing}
                  className="bg-violet-955/65 hover:bg-violet-900/30 border border-violet-500/20 text-violet-400 hover:text-violet-300 disabled:opacity-50 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                  Sync TMDB
                </button>
              )}

              {/* Delete Selected */}
              <button
                onClick={handleBulkDelete}
                disabled={selectedIds.length === 0}
                className="bg-rose-950/60 hover:bg-rose-900/30 border border-rose-500/20 text-rose-455 hover:text-rose-300 disabled:opacity-50 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>

              <button
                onClick={() => {
                  setIsSelectMode(false)
                  setSelectedIds([])
                }}
                className="text-slate-455 hover:text-white p-1 rounded-lg cursor-pointer animate-pulse"
                title="Cancel Select Mode"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
          </div>
        </div>
      )}

      {/* Syncing Progress Overlay */}
      {isSyncing && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center space-y-6">
            <RefreshCw className="w-10 h-10 text-violet-500 animate-spin mx-auto" />
            <div>
              <h3 className="font-extrabold text-lg text-white">Syncing with TMDB...</h3>
              <p className="text-xs text-slate-400 mt-1">Retrieving high-fidelity metadata, posters, and IDs from TMDB.</p>
            </div>
            
            <div className="space-y-2">
              <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full transition-all duration-350"
                  style={{ width: `${syncProgress}%` }}
                />
              </div>
              <span className="text-xs font-bold text-violet-400">{syncProgress}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
