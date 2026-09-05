import { useState, useEffect, useMemo, useRef } from 'react'
import { Calendar, Trash2, Filter, ArrowUpDown, Film, Tv, Gamepad, Check, X, ListChecks, Sparkles, RefreshCw, Globe, MapPin, Bookmark, List, LayoutGrid, Plus, Minus } from 'lucide-react'
import { getPosterUrl, fetchTMDB, isTMDBConfigured } from '../lib/tmdb'
import { fetchAnilistAnimeDetails } from '../lib/anilist'
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

export default function MediaGrid({ 
  items, 
  typeFilter, 
  onUpdateItem, 
  onRemoveItem, 
  onItemClick, 
  onAddItem, 
  onAddItems, 
  user,
  searchQuery: propSearchQuery,
  setSearchQuery: propSetSearchQuery,
  isSelectMode: propIsSelectMode,
  setIsSelectMode: propSetIsSelectMode,
  showFilterDropdown: propShowFilterDropdown,
  setShowFilterDropdown: propSetShowFilterDropdown
}) {
  const [statusFilter, setStatusFilter] = useState(() => {
    return localStorage.getItem('cinelog_status_filter') || 'all'
  })
  const [watchingViewMode, setWatchingViewMode] = useState(() => {
    return localStorage.getItem('cinelog_watching_view_mode') || 'list'
  })
  const [episodeDetailsCache, setEpisodeDetailsCache] = useState({})
  const fetchedEpisodeKeysRef = useRef(new Set())
  const [localSearchQuery, setLocalSearchQuery] = useState('')
  const searchQuery = propSearchQuery !== undefined ? propSearchQuery : localSearchQuery
  const setSearchQuery = propSetSearchQuery !== undefined ? propSetSearchQuery : setLocalSearchQuery

  const [sortBy, setSortBy] = useState('newest_added') // 'newest_added', 'release_date'
  const [listsSubTab, setListsSubTab] = useState('movie_tv') // 'movie_tv', 'actors'
  
  const [localShowFilterDropdown, setLocalShowFilterDropdown] = useState(false)
  const showFilterDropdown = propShowFilterDropdown !== undefined ? propShowFilterDropdown : localShowFilterDropdown
  const setShowFilterDropdown = propSetShowFilterDropdown !== undefined ? propSetShowFilterDropdown : setLocalShowFilterDropdown
  const [yearFilter, setYearFilter] = useState('all')
  const [languageFilter, setLanguageFilter] = useState('all')
  const [countryFilter, setCountryFilter] = useState('all')
  const [hideIndian, setHideIndian] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const [activeListId, setActiveListId] = useState(null)

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setYearFilter('all')
    setLanguageFilter('all')
    setCountryFilter('all')
    setHideIndian(false)
    setCurrentPage(1)
    setActiveListId(null)
    setListsSubTab('movie_tv')
  }, [typeFilter])

  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, searchQuery, sortBy, yearFilter, languageFilter, countryFilter, hideIndian])

  useEffect(() => {
    localStorage.setItem('cinelog_status_filter', statusFilter)
    if (statusFilter !== 'lists') {
      setActiveListId(null)
    }
  }, [statusFilter])
  /* eslint-enable react-hooks/set-state-in-effect */

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
        } catch {
          // Ignore individual fetch errors
        }
      }
    }
    healMetadata()
    return () => { isMounted = false }
  }, [items, onUpdateItem])

  const [localIsSelectMode, setLocalIsSelectMode] = useState(false)
  const isSelectMode = propIsSelectMode !== undefined ? propIsSelectMode : localIsSelectMode
  const setIsSelectMode = propSetIsSelectMode !== undefined ? propSetIsSelectMode : setLocalIsSelectMode
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

      const getItemTimestamp = (s) => {
        if (!s) return 0
        const dateVal = s.updated_at || s._sortDate || s.watched_at || s.created_at || 0
        const t = new Date(dateVal).getTime()
        return isNaN(t) ? 0 : t
      }

      const rep = sorted.reduce((a, b) =>
        getItemTimestamp(b) > getItemTimestamp(a) ? b : a
        , sorted[0])

      const latestUpdateMs = sorted.reduce((max, s) => {
        const t = getItemTimestamp(s)
        return t > max ? t : max
      }, 0)
      const latestUpdateDate = latestUpdateMs > 0 ? new Date(latestUpdateMs).toISOString() : (rep.updated_at || rep.watched_at || rep.created_at)

      const completedSeasons = sorted.filter(s => s.status === 'completed')
      const watchingSeasons = sorted.filter(s => s.status === 'watching' || s.status === 'pending')
      const totalSeasons = sorted.length
      const activeSeason = (watchingSeasons.length > 0
        ? watchingSeasons.reduce((a, b) => getItemTimestamp(b) > getItemTimestamp(a) ? b : a, watchingSeasons[0])
        : null) || sorted.find(s => s.status !== 'completed') || sorted[sorted.length - 1]

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
        _sortDate: latestUpdateDate,
        updated_at: latestUpdateDate,
        watched_at: latestUpdateDate
      }
    })
  }

  // Filter virtual items based on status, year, language, and local query search
  // For TV & Series: group by show first, then filter on the aggregated status
  const isSeriesType = typeFilter === 'tv' || typeFilter === 'anime'
  const rawTVItems = isSeriesType
    ? items.filter(item => (item.type === 'tv' || item.type === 'anime') && item.status !== 'list_only')
    : []
  const groupedTVShows = isSeriesType ? groupTVShows(rawTVItems) : []

  const matchLanguage = (itemLang, targetFilter) => {
    if (targetFilter === 'all') return true
    if (!itemLang) return false
    return itemLang.toLowerCase().trim() === targetFilter.toLowerCase().trim()
  }

  const filteredItems = isSeriesType
    ? groupedTVShows
      .filter(show => statusFilter === 'all' || show.virtualStatus === statusFilter)
      .filter(show => yearFilter === 'all' || show.release_year === yearFilter)
      .filter(show => matchLanguage(show.original_language, languageFilter))
      .filter(show => matchCountry(show.country, countryFilter))
      .filter(show => !hideIndian || normalizeCountryName(show.country) !== 'India')
      .filter(show => show.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : items
      .filter(item => item.type === typeFilter && item.status !== 'list_only')
      .map(item => ({
        ...item,
        virtualStatus: item.status || 'planned',
        _sortDate: item.updated_at || item.watched_at || item.created_at
      }))
      .filter(item => statusFilter === 'all' || item.virtualStatus === statusFilter)
      .filter(item => yearFilter === 'all' || item.release_year === yearFilter)
      .filter(item => matchLanguage(item.original_language, languageFilter))
      .filter(item => matchCountry(item.country, countryFilter))
      .filter(item => !hideIndian || normalizeCountryName(item.country) !== 'India')
      .filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()))

  const getItemDateMs = (item) => {
    if (!item) return 0
    const val = item.updated_at || item._sortDate || item.watched_at || item.created_at || 0
    const t = new Date(val).getTime()
    return isNaN(t) ? 0 : t
  }

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    // When viewing watching list, sort by most recently updated/watched
    if (statusFilter === 'watching') {
      const diff = getItemDateMs(b) - getItemDateMs(a)
      if (diff !== 0) return diff
      const dateA = a.release_date || a.release_year || '0000'
      const dateB = b.release_date || b.release_year || '0000'
      return dateB.localeCompare(dateA)
    }
    if (sortBy === 'newest_added') {
      return getItemDateMs(b) - getItemDateMs(a)
    }
    if (sortBy === 'release_date') {
      const dateA = a.release_date || a.release_year || '0000'
      const dateB = b.release_date || b.release_year || '0000'
      return dateB.localeCompare(dateA)
    }
    return 0
  })

  const ITEMS_PER_PAGE = 50
  const totalPages = Math.ceil(sortedItems.length / ITEMS_PER_PAGE) || 1
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return sortedItems.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [sortedItems, currentPage])

  // Fetch season & episode details for watching list items
  useEffect(() => {
    if (statusFilter !== 'watching' || watchingViewMode !== 'list') return
    if (!paginatedItems || paginatedItems.length === 0) return

    let isMounted = true

    const fetchBatchDetails = async () => {
      for (const item of paginatedItems) {
        if (!isMounted) break

        const isAnime = item.tmdb_id?.toString().startsWith('anilist_') || item.id?.toString().startsWith('anilist_')
        const isTV = item.type === 'tv' || item.type === 'anime' || (isAnime && item.type !== 'movie')

        if (isAnime) {
          const anilistNumericId = (item.tmdb_id || item.id || '').toString().replace('anilist_', '')
          const cacheKey = `anime_${anilistNumericId}`
          if (fetchedEpisodeKeysRef.current.has(cacheKey)) continue
          fetchedEpisodeKeysRef.current.add(cacheKey)

          try {
            const data = await fetchAnilistAnimeDetails(anilistNumericId)
            if (data && isMounted) {
              setEpisodeDetailsCache(prev => ({
                ...prev,
                [cacheKey]: {
                  episodesCount: data.episodes || data.rawEpisodes || (data.streamingEpisodes?.length || 12),
                  streamingEpisodes: data.streamingEpisodes || []
                }
              }))
            }
          } catch {
            // Ignore fetch error, fallback to defaults
          }
        } else if (isTV && item.tmdb_id && isTMDBConfigured()) {
          const activeSeason = item._activeSeason || item._allSeasons?.[0] || item
          const seasonNum = activeSeason?.season_number || 1
          const cacheKey = `tv_${item.tmdb_id}_s${seasonNum}`
          if (fetchedEpisodeKeysRef.current.has(cacheKey)) continue
          fetchedEpisodeKeysRef.current.add(cacheKey)

          try {
            const data = await fetchTMDB(`/tv/${item.tmdb_id}/season/${seasonNum}`)
            if (data && isMounted) {
              setEpisodeDetailsCache(prev => ({
                ...prev,
                [cacheKey]: {
                  episodesCount: data.episodes?.length || 0,
                  episodes: data.episodes || []
                }
              }))
            }
          } catch {
            // Ignore fetch error, fallback to defaults
          }
        }
      }
    }

    fetchBatchDetails()

    return () => {
      isMounted = false
    }
  }, [statusFilter, watchingViewMode, paginatedItems])

  const resolveItemEpisodeInfo = (item) => {
    const isAnime = item.tmdb_id?.toString().startsWith('anilist_') || item.id?.toString().startsWith('anilist_')
    const isTV = item.type === 'tv' || item.type === 'anime' || (isAnime && item.type !== 'movie')
    const isMovie = item.type === 'movie' && !isTV

    if (isMovie) {
      return {
        isMovie: true,
        isAnime,
        seasonNum: null,
        totalSeasons: 1,
        currentEpNum: 1,
        rawEpProgress: 1,
        totalSeasonEps: 1,
        progressPct: 100,
        epName: 'Feature Film',
        displayTitle: item.title
      }
    }

    const activeSeason = item._activeSeason || item._allSeasons?.[0] || item
    const seasonNum = activeSeason?.season_number || item.season_number || 1
    const totalSeasons = item._totalSeasons || 1

    const currentEpProgress = isAnime
      ? (typeof item.season_progress === 'number'
          ? item.season_progress
          : (item.season_progress?.[1] !== undefined ? Number(item.season_progress[1]) : (item._activeEpisodeProgress || 0)))
      : (item._activeEpisodeProgress !== undefined ? item._activeEpisodeProgress : (
          typeof activeSeason?.season_progress === 'number'
            ? activeSeason.season_progress
            : (activeSeason?.season_progress?.[seasonNum] !== undefined ? Number(activeSeason.season_progress[seasonNum]) : 0)
        ))

    let totalSeasonEps
    let epName = ''

    if (isAnime) {
      const anilistNumericId = (item.tmdb_id || item.id || '').toString().replace('anilist_', '')
      const cacheKey = `anime_${anilistNumericId}`
      const cached = episodeDetailsCache[cacheKey]
      if (cached) {
        totalSeasonEps = cached.episodesCount || item.episodes || 12
        const targetEpNum = Math.max(1, currentEpProgress || 1)
        const streamingList = cached.streamingEpisodes || []
        const match = streamingList.find(se => {
          const m = se.title?.match(/Episode\s+(\d+)/i)
          return m ? parseInt(m[1], 10) === targetEpNum : false
        }) || streamingList[targetEpNum - 1]

        if (match?.title) {
          const prefixRegex = new RegExp(`^Episode\\s+${targetEpNum}\\s*(?:-|:|–|—)?\\s*`, 'i')
          const cleaned = match.title.replace(prefixRegex, '').trim()
          epName = cleaned || match.title
        }
      } else {
        totalSeasonEps = item.episodes || 12
      }
    } else {
      const cacheKey = `tv_${item.tmdb_id || item.id}_s${seasonNum}`
      const cached = episodeDetailsCache[cacheKey]
      if (cached) {
        totalSeasonEps = cached.episodesCount || activeSeason?.episodes || 12
        const targetEpNum = Math.max(1, currentEpProgress || 1)
        const epObj = (cached.episodes || []).find(e => e.episode_number === targetEpNum)
        if (epObj?.name) {
          epName = epObj.name
        }
      } else {
        totalSeasonEps = activeSeason?.episodes || 12
      }
    }

    const targetEpNum = Math.max(1, currentEpProgress || 1)
    if (!epName) {
      epName = `Episode ${targetEpNum}`
    }

    const progressPct = totalSeasonEps > 0
      ? Math.min(100, Math.round((currentEpProgress / totalSeasonEps) * 100))
      : 0

    return {
      isMovie: false,
      isAnime,
      seasonNum,
      totalSeasons,
      currentEpNum: targetEpNum,
      rawEpProgress: currentEpProgress,
      totalSeasonEps,
      progressPct,
      epName,
      displayTitle: item.title
    }
  }

  const handleQuickEpisodeChange = async (e, item, delta) => {
    e.stopPropagation()
    const isAnime = item.tmdb_id?.toString().startsWith('anilist_') || item.id?.toString().startsWith('anilist_')
    const isTV = item.type === 'tv' || item.type === 'anime' || (isAnime && item.type !== 'movie')

    if (isAnime) {
      const anilistNumericId = (item.tmdb_id || item.id || '').toString().replace('anilist_', '')
      const cacheKey = `anime_${anilistNumericId}`
      const cached = episodeDetailsCache[cacheKey]
      const maxEps = cached?.episodesCount || item.episodes || 12

      const currentProgress = typeof item.season_progress === 'number'
        ? item.season_progress
        : (item.season_progress?.[1] !== undefined ? Number(item.season_progress[1]) : (item._activeEpisodeProgress || 0))

      const newProgress = Math.max(0, currentProgress + delta)
      const cappedProgress = Math.min(newProgress, maxEps)
      const isCompleted = cappedProgress >= maxEps

      const now = new Date().toISOString()
      await onUpdateItem(item.id, {
        season_progress: { 1: cappedProgress },
        status: isCompleted ? 'completed' : 'watching',
        updated_at: now,
        watched_at: now
      })
    } else if (isTV) {
      const activeSeason = item._activeSeason || item._allSeasons?.[0] || item
      const seasonNum = activeSeason?.season_number || 1
      const cacheKey = `tv_${item.tmdb_id || item.id}_s${seasonNum}`
      const cached = episodeDetailsCache[cacheKey]
      const maxEps = cached?.episodesCount || activeSeason?.episodes || 24

      const currentProgress = item._activeEpisodeProgress !== undefined ? item._activeEpisodeProgress : (
        typeof activeSeason?.season_progress === 'number'
          ? activeSeason.season_progress
          : (activeSeason?.season_progress?.[seasonNum] !== undefined ? Number(activeSeason.season_progress[seasonNum]) : 0)
      )

      const newProgress = Math.max(0, currentProgress + delta)
      const cappedProgress = Math.min(newProgress, maxEps)
      const isCompleted = cappedProgress >= maxEps

      const existingProgress = typeof activeSeason?.season_progress === 'object' && activeSeason?.season_progress !== null
        ? { ...activeSeason.season_progress }
        : {}

      const now = new Date().toISOString()
      await onUpdateItem(activeSeason.id, {
        season_progress: {
          ...existingProgress,
          [seasonNum]: cappedProgress
        },
        status: isCompleted ? 'completed' : 'watching',
        updated_at: now,
        watched_at: now
      })
    }
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
    if (typeFilter === 'lists') return 'Custom Lists'
    return 'Games'
  }

  const getStatusLabel = (status) => {
    if (status === 'completed') return typeFilter === 'game' ? 'Beaten' : 'Completed'
    if (status === 'watching') return typeFilter === 'game' ? 'Playing' : 'Watching'
    if (status === 'pending') return typeFilter === 'tv' ? 'Up Next' : 'Pending'
    if (status === 'planned') return 'Planned'
    if (status === 'backlog') return 'Backlog'
    return 'Planned'
  }

  const getStatusOverlayStyle = (status) => {
    switch (status) {
      case 'completed':
        return {
          containerStyle: 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300',
          iconColor: 'text-emerald-400'
        }
      case 'watching':
        return {
          containerStyle: 'bg-violet-950/90 border-violet-500/30 text-violet-300',
          iconColor: 'text-violet-400'
        }
      case 'pending':
        return {
          containerStyle: 'bg-rose-950/90 border-rose-500/30 text-rose-300',
          iconColor: 'text-rose-455'
        }
      case 'planned':
        return {
          containerStyle: 'bg-sky-950/90 border-sky-500/30 text-sky-300',
          iconColor: 'text-sky-400'
        }
      case 'backlog':
        return {
          containerStyle: 'bg-slate-900/90 border-slate-750 text-slate-350',
          iconColor: 'text-slate-450'
        }
      default:
        return {
          containerStyle: 'bg-slate-900/90 border-slate-750 text-slate-350',
          iconColor: 'text-slate-450'
        }
    }
  }

  if (typeFilter === 'lists') {
    return (
      <div className={activeListId ? "pb-16" : "py-6 px-4"}>
        {!activeListId && (
          <>
            {/* Grid Header & Statistics */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
                  <Bookmark className="w-6 h-6 text-violet-400" />
                  My Saved Lists
                </h2>
              </div>
            </div>

            {/* Saved List Sub-Tabs */}
            <div className="flex gap-2 mb-6 border-b border-slate-800 pb-3 overflow-x-auto">
              {[
                { id: 'movie_tv', label: 'Movie/TV' },
                { id: 'actors', label: 'Actors' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setListsSubTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${listsSubTab === tab.id
                      ? 'bg-violet-600/10 border-violet-500/30 text-violet-400'
                      : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </>
        )}

        <CustomLists
          typeFilter={listsSubTab === 'actors' ? 'actor' : 'lists'}
          user={user}
          watchlistItems={items}
          onItemClick={onItemClick}
          onAddItem={onAddItem}
          onAddItems={onAddItems}
          onUpdateItem={onUpdateItem}
          activeListId={activeListId}
          setActiveListId={setActiveListId}
        />
      </div>
    )
  }

  if (statusFilter === 'lists') {
    return (
      <div className={activeListId ? "pb-16" : "py-6 px-4"}>
        {!activeListId && (
          <>
            {/* Grid Header & Statistics */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
                  {typeFilter === 'movie' && <Film className="w-6 h-6 text-violet-400" />}
                  {typeFilter === 'tv' && <Tv className="w-6 h-6 text-violet-400" />}
                  {typeFilter === 'game' && <Gamepad className="w-6 h-6 text-violet-400" />}
                  {typeFilter === 'game' ? 'My Saved Games Lists' : `My Custom ${getTypeLabel()} Lists`}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {typeFilter === 'game'
                    ? 'Create and manage your saved game lists.'
                    : `Create and manage your custom categories and collections of ${getTypeLabel().toLowerCase()}.`}
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
                typeFilter === 'game' && { id: 'lists', label: 'Saved Games List' }
              ].filter(Boolean).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${statusFilter === tab.id
                      ? 'bg-violet-600/10 border-violet-500/30 text-violet-400'
                      : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </>
        )}

        <CustomLists
          typeFilter={typeFilter}
          user={user}
          watchlistItems={items}
          onItemClick={onItemClick}
          onAddItem={onAddItem}
          onAddItems={onAddItems}
          onUpdateItem={onUpdateItem}
          activeListId={activeListId}
          setActiveListId={setActiveListId}
        />
      </div>
    )
  }

  return (
    <div className="py-6 px-4">
      {/* Grid Header & Controls */}
      <div className={`mb-0 md:mb-6 flex items-center justify-end gap-2 ${showFilterDropdown ? 'mb-6 md:mb-6' : ''}`}>
        {/* Local Search & Filter & Sort Controls */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <input
            type="text"
            placeholder={`Search ${getTypeLabel().toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="hidden md:block bg-slate-900 border border-slate-800 focus:border-violet-500 focus:outline-none rounded-none px-3 py-1.5 text-xs text-white placeholder-slate-500 flex-1 min-w-0 md:w-48"
          />

          {/* Filter & Sort Dropdown */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`hidden md:flex items-center justify-center w-8 h-8 rounded-none border text-xs font-semibold cursor-pointer transition-all ${showFilterDropdown
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
                  <div className="flex items-center gap-1.5 bg-slate-955 border border-slate-800 rounded-none px-2 py-1">
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-transparent border-none text-xs text-slate-300 focus:outline-none cursor-pointer w-full pr-1"
                    >
                      <option value="newest_added" className="bg-slate-955 text-slate-300">
                        {statusFilter === 'watching' ? 'Last Updated' : 'Newest Added'}
                      </option>
                      <option value="release_date" className="bg-slate-955 text-slate-300">Release Date</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Release Year
                  </label>
                  <div className="flex items-center gap-1.5 bg-slate-955 border border-slate-800 rounded-none px-2 py-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={yearFilter}
                      onChange={(e) => setYearFilter(e.target.value)}
                      className="bg-transparent border-none text-xs text-slate-350 focus:outline-none cursor-pointer w-full pr-1"
                    >
                      <option value="all" className="bg-slate-955 text-slate-300">All Years</option>
                      {availableYears.map(year => (
                        <option key={year} value={year} className="bg-slate-955 text-slate-300">{year}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Original Language
                  </label>
                  <div className="flex items-center gap-1.5 bg-slate-955 border border-slate-800 rounded-none px-2 py-1">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={languageFilter}
                      onChange={(e) => setLanguageFilter(e.target.value)}
                      className="bg-transparent border-none text-xs text-slate-355 focus:outline-none cursor-pointer w-full pr-1"
                    >
                      <option value="all" className="bg-slate-955 text-slate-300">All Languages</option>
                      {availableLanguages.map(lang => (
                        <option key={lang.code} value={lang.code} className="bg-slate-955 text-slate-300">{lang.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Country
                  </label>
                  <div className="flex items-center gap-1.5 bg-slate-955 border border-slate-800 rounded-none px-2 py-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={countryFilter}
                      onChange={(e) => setCountryFilter(e.target.value)}
                      className="bg-transparent border-none text-xs text-slate-350 focus:outline-none cursor-pointer w-full pr-1"
                    >
                      <option value="all" className="bg-slate-955 text-slate-300">All Countries</option>
                      {availableCountries.map(country => (
                        <option key={country} value={country} className="bg-slate-955 text-slate-300">{country}</option>
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
                    <div className="w-8 h-4.5 bg-slate-955 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-3.5 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-slate-500 after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-violet-600 peer-checked:after:bg-white"></div>
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
            className={`hidden md:flex items-center justify-center w-8 h-8  border text-xs font-semibold cursor-pointer transition-all flex-shrink-0 ${isSelectMode
                ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20'
                : 'bg-slate-900 border-slate-800 text-slate-455 hover:text-slate-200 hover:border-slate-700'
              }`}
            title={isSelectMode ? 'Cancel Selection' : 'Select Items'}
          >
            <ListChecks className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Watch Status Tabs & View Switcher */}
      <div className="flex items-center justify-between gap-2 mb-6 border-b border-slate-800 pb-3">
        <div className="flex gap-2 overflow-x-auto py-0.5">
          {[
            { id: 'all', label: 'All Items' },
            { id: 'completed', label: typeFilter === 'game' ? 'Beaten' : 'Completed' },
            { id: 'watching', label: typeFilter === 'game' ? 'Playing' : 'Watching' },
            { id: 'pending', label: typeFilter === 'tv' ? 'Up Next' : 'Pending' },
            { id: 'planned', label: 'Planned' },
            typeFilter !== 'tv' && { id: 'backlog', label: 'Backlog' },
            typeFilter === 'game' && { id: 'lists', label: 'Saved Games List' }
          ].filter(Boolean).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${statusFilter === tab.id
                  ? 'bg-violet-600/10 border-violet-500/30 text-violet-400'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* View Switcher: List vs Grid (Watching ONLY) */}
        {statusFilter === 'watching' && (
          <div className="flex items-center bg-slate-900/90 border border-slate-800 p-0.5 rounded-lg flex-shrink-0">
            <button
              onClick={() => {
                setWatchingViewMode('list')
                localStorage.setItem('cinelog_watching_view_mode', 'list')
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${watchingViewMode === 'list'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
                }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              onClick={() => {
                setWatchingViewMode('grid')
                localStorage.setItem('cinelog_watching_view_mode', 'grid')
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${watchingViewMode === 'grid'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
                }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
          </div>
        )}
      </div>

      {/* Media Items */}
      {sortedItems.length > 0 ? (
        <>
          {statusFilter === 'watching' && watchingViewMode === 'list' ? (
            /* Watching Series / Media List View */
            <div className="space-y-3">
              {paginatedItems.map((item) => {
                const cardId = item.id
                const isTV = item.type === 'tv' || item.type === 'anime'
                const navItem = isTV ? (item._activeSeason || item._allSeasons?.[0] || item) : item
                const info = resolveItemEpisodeInfo(item)

                return (
                  <div
                    key={cardId}
                    className={`bg-slate-900/60 hover:bg-slate-900 border rounded-xl p-3 sm:p-4 transition-all duration-200 shadow-sm hover:shadow-lg hover:shadow-violet-900/10 group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 ${
                      isSelectMode && selectedIds.includes(cardId)
                        ? 'border-violet-500 ring-2 ring-violet-500/20 shadow-violet-500/5'
                        : 'border-slate-800 hover:border-slate-700/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      {/* Select Mode Checkbox */}
                      {isSelectMode && (
                        <div
                          className="cursor-pointer flex-shrink-0"
                          onClick={() => {
                            setSelectedIds(prev =>
                              prev.includes(cardId)
                                ? prev.filter(id => id !== cardId)
                                : [...prev, cardId]
                            )
                          }}
                        >
                          {selectedIds.includes(cardId) ? (
                            <div className="bg-violet-600 border border-violet-500 text-white p-1 rounded-md shadow">
                              <Check className="w-3.5 h-3.5 font-bold" />
                            </div>
                          ) : (
                            <div className="bg-slate-950 border border-slate-700 p-1 rounded-md">
                              <div className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Poster */}
                      <div
                        className="w-16 sm:w-20 aspect-[2/3] flex-shrink-0 rounded-lg overflow-hidden relative bg-slate-950 border border-slate-800/80 shadow-md cursor-pointer group/poster"
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
                          className="w-full h-full object-cover group-hover/poster:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        {!info.isMovie && info.totalSeasons > 1 && (
                          <div className="absolute top-1 right-1 bg-slate-950/90 border border-slate-700/60 text-[9px] font-black px-1.5 py-0.5 rounded text-slate-300 tracking-wider">
                            S{info.seasonNum}
                          </div>
                        )}
                      </div>

                      {/* Info & Progress */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between gap-1.5 sm:gap-2">
                        {/* Title & Badges */}
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4
                              className="text-sm sm:text-base font-bold text-white group-hover:text-violet-400 transition-colors cursor-pointer truncate max-w-lg"
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
                              {info.displayTitle}
                            </h4>

                            {!info.isMovie ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-violet-600/15 text-violet-300 border border-violet-500/30 whitespace-nowrap">
                                Season {info.seasonNum}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-sky-600/15 text-sky-300 border border-sky-500/30 whitespace-nowrap">
                                Movie
                              </span>
                            )}

                            {info.isAnime && (
                              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 whitespace-nowrap">
                                Anime
                              </span>
                            )}

                            {info.totalSeasons > 1 && (
                              <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                                ({info.totalSeasons} Seasons)
                              </span>
                            )}
                          </div>

                          {/* Episode Number and Name */}
                          <div className="flex items-center gap-2 mt-1 text-xs">
                            {!info.isMovie ? (
                              <>
                                <span className="font-bold text-violet-300 bg-violet-950/60 border border-violet-800/60 px-2 py-0.5 rounded text-[11px] whitespace-nowrap">
                                  Ep {info.currentEpNum}
                                </span>
                                <span className="text-slate-200 font-medium truncate max-w-md">
                                  {info.epName}
                                </span>
                              </>
                            ) : (
                              <span className="text-slate-400 text-xs font-medium">
                                {item.release_year ? `${item.release_year} • ` : ''}Feature Film
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Season Progress Bar */}
                        <div className="w-full pt-1">
                          <div className="flex items-center justify-end text-[11px] font-semibold mb-1">
                            <span className="text-slate-300">
                              {!info.isMovie ? (
                                <>
                                  <span className="text-white font-bold">{info.rawEpProgress}</span> / {info.totalSeasonEps} eps
                                  <span className="text-violet-400 font-bold ml-1.5">({info.progressPct}%)</span>
                                </>
                              ) : (
                                <span className="text-violet-400 font-bold">Currently Watching</span>
                              )}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-950 border border-slate-800/80 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-400 rounded-full transition-all duration-300 shadow-sm shadow-violet-500/30"
                              style={{ width: `${info.isMovie ? 50 : info.progressPct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Episode Adjustment Controls (+ and - only) */}
                    {!info.isMovie && (
                      <div className="flex items-center gap-1.5 self-end sm:self-center flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60 w-full sm:w-auto justify-end">
                        <button
                          onClick={(e) => handleQuickEpisodeChange(e, item, -1)}
                          disabled={info.rawEpProgress <= 0}
                          title="Previous Episode (-1)"
                          className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-750 border border-slate-700/60 text-slate-300 hover:text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleQuickEpisodeChange(e, item, 1)}
                          title="Next Episode (+1)"
                          className="w-8 h-8 rounded-lg bg-violet-600 hover:bg-violet-500 border border-violet-500 text-white flex items-center justify-center transition-all shadow-md shadow-violet-600/20 active:scale-95 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            /* Media Grid Cards */
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-3 sm:gap-6">
              {paginatedItems.map((item) => {
                // For grouped TV shows, the id is the rep item's id;
                // for multi-select we match on the representative id
                const cardId = item.id
                const isTV = item.type === 'tv'
                const totalSeas = item._totalSeasons ?? 0

                // For TV groups, navigate via the ACTIVE (in-progress) season item
                const navItem = isTV ? (item._activeSeason || item._allSeasons?.[0] || item) : item

                return (
                  <div
                    key={cardId}
                    className={`group relative bg-slate-900/30 border rounded-xl overflow-hidden shadow-lg transition-all duration-300 ${isSelectMode && selectedIds.includes(cardId)
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

                      {/* Status Overlay at the bottom */}
                      {!isSelectMode && (
                        <div className={`absolute inset-x-0 bottom-0 backdrop-blur-md border-t text-[11px] font-bold py-1.5 px-2 flex items-center justify-center gap-1 ${getStatusOverlayStyle(item.virtualStatus).containerStyle}`}>
                          <Check className={`w-3.5 h-3.5 ${getStatusOverlayStyle(item.virtualStatus).iconColor}`} />
                          <span>{getStatusLabel(item.virtualStatus)}</span>
                        </div>
                      )}

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
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-8">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className={`px-4 py-2 border text-xs font-semibold transition-all cursor-pointer ${currentPage === 1
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
                className={`px-4 py-2 border text-xs font-semibold transition-all cursor-pointer ${currentPage === totalPages
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
