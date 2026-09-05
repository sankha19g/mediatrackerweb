import React, { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom'
import { 
  isFirebaseConfigured, 
  onFirebaseAuthStateChanged, 
  firebaseSignOut, 
  loadFirebaseItems, 
  addFirebaseItem, 
  migrateLocalItemsToFirebase, 
  updateFirebaseItem, 
  deleteFirebaseItem,
  batchAddFirebaseItems,
  loadFirebaseSources,
  addFirebaseSource,
  deleteFirebaseSource,
  updateFirebaseSource,
  loadFirebaseDownloadSources,
  addFirebaseDownloadSource,
  deleteFirebaseDownloadSource,
  updateFirebaseDownloadSource,
  loadFirebaseSavedSites,
  addFirebaseSavedSite,
  deleteFirebaseSavedSite,
  updateFirebaseSavedSite,
  loadAllFirebaseLists,
  updateFirebaseListItems
} from './lib/firebase'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import MediaGrid from './components/MediaGrid'
import ExploreTMDB from './components/ExploreTMDB'
import ExploreAnilist from './components/ExploreAnilist'
import GameExplore from './components/GameExplore'
import Settings from './components/Settings'
import Auth from './components/Auth'
import MovieTvDetails from './components/MovieTvDetails'
import AnimeDetails from './components/AnimeDetails'
import AnimePlayer from './components/AnimePlayer'
import ImportExport from './components/ImportExport'
import Sources from './components/Sources'
import SavedSites from './components/SavedSites'
import Statistics from './components/Statistics'
import { PlusCircle, ShieldAlert, CheckCircle, Database } from 'lucide-react'

export const getMediaItemKey = (item) => {
  if (!item) return ''
  const type = item.type || 'movie'
  if (type === 'tv' && item.season_number) {
    return `tv_${item.tmdb_id || item.id}_s${item.season_number}`
  }
  if (item.tmdb_id) {
    return `${type}_${item.tmdb_id}`
  }
  return item.id || `title_${item.title}_${item.release_year}`
}

const STATUS_PRIORITY = {
  completed: 10,
  watching: 9,
  planned: 8,
  pending: 7,
  backlog: 6,
  onhold: 5,
  paused: 5,
  dropped: 4,
  list_only: 1
}

export const getDeduplicatedItems = (itemsList) => {
  if (!Array.isArray(itemsList)) return []
  const map = new Map()

  for (const item of itemsList) {
    const key = getMediaItemKey(item)
    if (!map.has(key)) {
      map.set(key, item)
    } else {
      const existing = map.get(key)
      const existingPriority = STATUS_PRIORITY[existing.status] || (existing.status ? 5 : 0)
      const itemPriority = STATUS_PRIORITY[item.status] || (item.status ? 5 : 0)

      let winner, loser
      if (itemPriority > existingPriority) {
        winner = item
        loser = existing
      } else if (existingPriority > itemPriority) {
        winner = existing
        loser = item
      } else {
        const itemDate = new Date(item.updated_at || item.watched_at || item.created_at || 0).getTime()
        const existingDate = new Date(existing.updated_at || existing.watched_at || existing.created_at || 0).getTime()
        if (itemDate >= existingDate) {
          winner = item
          loser = existing
        } else {
          winner = existing
          loser = item
        }
      }

      const latestUpdateMs = Math.max(
        new Date(item.updated_at || item.watched_at || item.created_at || 0).getTime() || 0,
        new Date(existing.updated_at || existing.watched_at || existing.created_at || 0).getTime() || 0
      )
      const latestDateStr = latestUpdateMs > 0 ? new Date(latestUpdateMs).toISOString() : (winner.updated_at || winner.watched_at || winner.created_at)

      const merged = {
        ...loser,
        ...winner,
        rating: winner.rating || loser.rating || 0,
        review: winner.review || loser.review || '',
        poster_path: winner.poster_path || loser.poster_path || '',
        seasons_watched: Array.isArray(winner.seasons_watched) && winner.seasons_watched.length > 0 
          ? winner.seasons_watched 
          : (loser.seasons_watched || []),
        season_progress: winner.season_progress || loser.season_progress || null,
        updated_at: latestDateStr,
        watched_at: winner.watched_at || latestDateStr
      }
      map.set(key, merged)
    }
  }

  return Array.from(map.values())
}

export const consolidateMediaItems = (rawItems, allLists = []) => {
  if (!Array.isArray(rawItems)) return { cleanedItems: [], duplicatesToDelete: [], updatedItems: [], listsToUpdate: [] }

  const customListItemIds = new Set(allLists.flatMap(l => l.item_ids || []))
  const groups = new Map()

  for (const item of rawItems) {
    const key = getMediaItemKey(item)
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key).push(item)
  }

  const cleanedItems = []
  const duplicatesToDelete = []
  const updatedItems = []
  const idReplacements = new Map()

  for (const [, itemsInGroup] of groups.entries()) {
    if (itemsInGroup.length === 1) {
      cleanedItems.push(itemsInGroup[0])
      continue
    }

    const scoredItems = itemsInGroup.map(item => {
      let score = 0
      const priority = STATUS_PRIORITY[item.status] || (item.status ? 5 : 0)
      score += priority * 10
      if (customListItemIds.has(item.id)) score += 50
      if (item.id && !item.id.toString().startsWith('local_')) score += 5
      const time = new Date(item.watched_at || item.created_at || 0).getTime()
      return { item, score, time }
    })

    scoredItems.sort((a, b) => (b.score - a.score) || (b.time - a.time))
    const canonical = scoredItems[0].item
    const others = scoredItems.slice(1).map(s => s.item)

    const bestStatusItem = itemsInGroup.find(i => i.status && i.status !== 'list_only')
    const finalStatus = bestStatusItem ? bestStatusItem.status : canonical.status
    const bestReview = itemsInGroup.find(i => i.review && i.review.trim())?.review || canonical.review || ''
    const bestRating = itemsInGroup.find(i => Number(i.rating) > 0)?.rating || canonical.rating || 0

    const mergedCanonical = {
      ...canonical,
      status: finalStatus,
      review: bestReview,
      rating: bestRating,
      watched_at: bestStatusItem?.watched_at || canonical.watched_at || new Date().toISOString()
    }

    cleanedItems.push(mergedCanonical)
    updatedItems.push(mergedCanonical)

    for (const other of others) {
      duplicatesToDelete.push(other.id)
      idReplacements.set(other.id, canonical.id)
    }
  }

  const listsToUpdate = []
  if (idReplacements.size > 0 && allLists.length > 0) {
    for (const list of allLists) {
      const currentIds = list.item_ids || []
      let changed = false
      const newIds = []
      for (const id of currentIds) {
        if (idReplacements.has(id)) {
          const replacement = idReplacements.get(id)
          if (!newIds.includes(replacement)) {
            newIds.push(replacement)
          }
          changed = true
        } else {
          if (!newIds.includes(id)) {
            newIds.push(id)
          }
        }
      }
      if (changed) {
        listsToUpdate.push({ listId: list.id, itemIds: newIds })
      }
    }
  }

  return { cleanedItems, duplicatesToDelete, updatedItems, listsToUpdate }
}

function MediaDetailsWrapper(props) {
  const { id } = useParams()
  const item = props.items.find(i => i.id === id)
  const isAnime = item?.tmdb_id?.toString().startsWith('anilist_')
  
  if (isAnime) {
    return <AnimeDetails {...props} />
  }
  return <MovieTvDetails {...props} />
}

function ExploreDetailsWrapper(props) {
  const { tmdb_id } = useParams()
  const isAnime = tmdb_id?.toString().startsWith('anilist_')
  
  if (isAnime) {
    return <AnimeDetails {...props} />
  }
  return <MovieTvDetails {...props} />
}

export default function App() {
  const [items, setItems] = useState([])
  const [user, setUser] = useState(null)
  const [sources, setSources] = useState([])
  const [downloadSources, setDownloadSources] = useState([])
  const [savedSites, setSavedSites] = useState([])
  const [currentTab, setCurrentTab] = useState(() => {
    return localStorage.getItem('cinelog_current_tab') || 'movie'
  }) // 'movie', 'tv', 'game'
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState({ type: '', message: '' })
  
  const navigate = useNavigate()
  const location = useLocation()
  const activeView = location.pathname.substring(1) || 'watchlist'

  // Initialize Firebase Auth State
  useEffect(() => {
    if (!isFirebaseConfigured()) {
      loadLocalItems()
      loadLocalSources()
      loadLocalSavedSites()
      setLoading(false)
      return
    }

    setLoading(true)
    const unsubscribe = onFirebaseAuthStateChanged((currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        loadFirebaseItemsData(currentUser)
        loadFirebaseSourcesData(currentUser)
        loadFirebaseSavedSitesData(currentUser)
      } else {
        loadLocalItems()
        loadLocalSources()
        loadLocalSavedSites()
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const [globalSearchQuery, setGlobalSearchQuery] = useState('')
  const [globalSelectMode, setGlobalSelectMode] = useState(false)
  const [globalFilterOpen, setGlobalFilterOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem('cinelog_current_tab', currentTab)
  }, [currentTab])

  useEffect(() => {
    const isExplorePage = location.pathname.startsWith('/explore_tmdb') || location.pathname.startsWith('/explore_anilist')
    const isMediaPage = location.pathname.startsWith('/media/') || location.pathname.startsWith('/explore/')
    const isWatchlistPage = location.pathname === '/'
    if (!isExplorePage && !isMediaPage && !isWatchlistPage) {
      setGlobalSearchQuery('')
      setGlobalSelectMode(false)
      setGlobalFilterOpen(false)
    }
  }, [location.pathname])

  // Local Storage loaders
  const loadLocalItems = () => {
    try {
      const localData = localStorage.getItem('local_media_items')
      const localListsRaw = localStorage.getItem('local_custom_lists')
      const localLists = localListsRaw ? JSON.parse(localListsRaw) : []

      if (localData) {
        const parsedData = JSON.parse(localData)
        const { cleanedItems, listsToUpdate } = consolidateMediaItems(parsedData, localLists)
        setItems(cleanedItems)
        localStorage.setItem('local_media_items', JSON.stringify(cleanedItems))

        if (listsToUpdate.length > 0) {
          const updatedLists = localLists.map(list => {
            const match = listsToUpdate.find(u => u.listId === list.id)
            return match ? { ...list, item_ids: match.itemIds } : list
          })
          localStorage.setItem('local_custom_lists', JSON.stringify(updatedLists))
        }
      } else {
        setItems([])
      }
    } catch (err) {
      console.error('Failed to load local media items:', err)
    }
  }

  // Firebase Database loaders
  const loadFirebaseItemsData = async (currentUser) => {
    setLoading(true)
    try {
      const [data, allLists] = await Promise.all([
        loadFirebaseItems(currentUser.uid),
        loadAllFirebaseLists(currentUser.uid).catch(err => {
          console.warn('Failed to load lists for consolidation:', err)
          return []
        })
      ])

      const { cleanedItems, duplicatesToDelete, updatedItems, listsToUpdate } = consolidateMediaItems(data || [], allLists || [])
      setItems(cleanedItems)

      if (duplicatesToDelete.length > 0) {
        duplicatesToDelete.forEach(id => deleteFirebaseItem(id).catch(e => console.warn('Could not delete duplicate item:', e)))
      }
      if (updatedItems.length > 0) {
        updatedItems.forEach(item => updateFirebaseItem(item.id, {
          status: item.status,
          rating: item.rating,
          review: item.review,
          watched_at: item.watched_at
        }).catch(e => console.warn('Could not update consolidated item in DB:', e)))
      }
      if (listsToUpdate.length > 0) {
        listsToUpdate.forEach(({ listId, itemIds }) => updateFirebaseListItems(listId, itemIds).catch(e => console.warn('Could not update list items:', e)))
      }
      
      // Perform automated migration if local data exists
      const localData = localStorage.getItem('local_media_items')
      if (localData) {
        const localItems = JSON.parse(localData)
        if (localItems.length > 0) {
          migrateLocalItemsToFirebaseData(currentUser, localItems)
        }
      }
    } catch (err) {
      console.error('Failed to load Firebase items:', err)
      showSyncBanner('error', 'Failed to fetch items from Firebase database. Falling back to offline mode.')
      loadLocalItems()
    } finally {
      setLoading(false)
    }
  }

  const loadLocalSources = () => {
    try {
      // Local streaming sources
      const localData = localStorage.getItem('local_video_sources')
      if (localData) {
        const parsed = JSON.parse(localData)
        const unique = Array.from(new Map(parsed.map(s => [(s.name || '').trim().toLowerCase(), s])).values())
        setSources(unique)
        localStorage.setItem('local_video_sources', JSON.stringify(unique))
      } else {
        const defaultSources = [{ id: 'default_4k', name: '4K', url: 'https://player.videasy.to/movie/{id}' }]
        setSources(defaultSources)
        localStorage.setItem('local_video_sources', JSON.stringify(defaultSources))
      }

      // Local download sources
      const localDownloadData = localStorage.getItem('local_download_sources')
      if (localDownloadData) {
        const parsed = JSON.parse(localDownloadData)
        const unique = Array.from(new Map(parsed.map(s => [(s.name || '').trim().toLowerCase(), s])).values())
        setDownloadSources(unique)
        localStorage.setItem('local_download_sources', JSON.stringify(unique))
      } else {
        const defaultDownloads = [{ id: 'default_download', name: 'Moviepire', url: 'https://video.moviepire.co/download/movie/{id}' }]
        setDownloadSources(defaultDownloads)
        localStorage.setItem('local_download_sources', JSON.stringify(defaultDownloads))
      }
    } catch (err) {
      console.error('Failed to load local sources:', err)
    }
  }

  const loadFirebaseSourcesData = async (currentUser) => {
    try {
      // Load streaming sources
      const dbSources = await loadFirebaseSources(currentUser.uid)
      const uniqueSourcesMap = new Map()
      const duplicatesToDelete = []

      for (const src of dbSources) {
        const key = (src.name || '').trim().toLowerCase()
        if (!uniqueSourcesMap.has(key)) {
          uniqueSourcesMap.set(key, src)
        } else {
          duplicatesToDelete.push(src.id)
        }
      }

      // Automatically delete duplicate entries from Firebase
      duplicatesToDelete.forEach(id => deleteFirebaseSource(id).catch(() => {}))

      let finalSources = Array.from(uniqueSourcesMap.values())
      if (finalSources.length === 0) {
        const defaultSource = await addFirebaseSource(currentUser.uid, '4K', 'https://player.videasy.to/movie/{id}')
        finalSources = [defaultSource]
      }
      setSources(finalSources)

      // Load download sources
      const dbDownloadSources = await loadFirebaseDownloadSources(currentUser.uid)
      const uniqueDownloadMap = new Map()
      const downloadDuplicatesToDelete = []

      for (const src of dbDownloadSources) {
        const key = (src.name || '').trim().toLowerCase()
        if (!uniqueDownloadMap.has(key)) {
          uniqueDownloadMap.set(key, src)
        } else {
          downloadDuplicatesToDelete.push(src.id)
        }
      }

      downloadDuplicatesToDelete.forEach(id => deleteFirebaseDownloadSource(id).catch(() => {}))

      let finalDownloads = Array.from(uniqueDownloadMap.values())
      if (finalDownloads.length === 0) {
        const defaultDownload = await addFirebaseDownloadSource(currentUser.uid, 'Moviepire', 'https://video.moviepire.co/download/movie/{id}')
        finalDownloads = [defaultDownload]
      }
      setDownloadSources(finalDownloads)
    } catch (err) {
      console.error('Failed to load Firebase sources:', err)
      loadLocalSources()
    }
  }

  let adminEmail = localStorage.getItem('cinelog_admin_email')
  if (user?.email && (!adminEmail || adminEmail === 'undefined')) {
    localStorage.setItem('cinelog_admin_email', user.email.toLowerCase())
    adminEmail = user.email.toLowerCase()
  }
  const isAdmin = user 
    ? (user.email && adminEmail ? user.email.toLowerCase() === adminEmail.toLowerCase() : true) 
    : true

  const handleAddSource = async (name, url, isPublic = false) => {
    const isCloud = isFirebaseConfigured() && user
    const canMakePublic = isAdmin && isPublic
    if (isCloud) {
      try {
        const newSource = await addFirebaseSource(user.uid, name, url, canMakePublic)
        setSources(prev => [...prev, newSource])
        showSyncBanner('success', `Added ${canMakePublic ? 'public' : 'private'} source "${name}" to cloud.`)
      } catch (err) {
        console.error('Failed to add source:', err)
        showSyncBanner('error', 'Could not save source to database.')
      }
    } else {
      const newSource = {
        id: `local_source_${Date.now()}`,
        name,
        url,
        is_public: false,
        created_at: new Date().toISOString()
      }
      const updated = [...sources, newSource]
      setSources(updated)
      localStorage.setItem('local_video_sources', JSON.stringify(updated))
      showSyncBanner('success', `Added source "${name}" locally.`)
    }
  }

  const handleRemoveSource = async (sourceId) => {
    const isCloud = isFirebaseConfigured() && user
    const targetSource = sources.find(s => s.id === sourceId)
    const sourceName = targetSource ? targetSource.name : 'Source'

    if (isCloud && typeof sourceId === 'string' && !sourceId.startsWith('local_source_') && sourceId !== 'default_4k') {
      try {
        await deleteFirebaseSource(sourceId)
        setSources(prev => prev.filter(s => s.id !== sourceId))
        showSyncBanner('success', `Removed source "${sourceName}" from cloud.`)
      } catch (err) {
        console.error('Failed to delete source:', err)
        showSyncBanner('error', 'Could not delete source from database.')
      }
    } else {
      const updated = sources.filter(s => s.id !== sourceId)
      setSources(updated)
      localStorage.setItem('local_video_sources', JSON.stringify(updated))
      showSyncBanner('success', `Removed source "${sourceName}" locally.`)
    }
  }

  const handleAddDownloadSource = async (name, url, isPublic = false) => {
    const isCloud = isFirebaseConfigured() && user
    const canMakePublic = isAdmin && isPublic
    if (isCloud) {
      try {
        const newSource = await addFirebaseDownloadSource(user.uid, name, url, canMakePublic)
        setDownloadSources(prev => [...prev, newSource])
        showSyncBanner('success', `Added ${canMakePublic ? 'public' : 'private'} download source "${name}" to cloud.`)
      } catch (err) {
        console.error('Failed to add download source:', err)
        showSyncBanner('error', 'Could not save download source to database.')
      }
    } else {
      const newSource = {
        id: `local_download_source_${Date.now()}`,
        name,
        url,
        is_public: false,
        created_at: new Date().toISOString()
      }
      const updated = [...downloadSources, newSource]
      setDownloadSources(updated)
      localStorage.setItem('local_download_sources', JSON.stringify(updated))
      showSyncBanner('success', `Added download source "${name}" locally.`)
    }
  }

  const handleRemoveDownloadSource = async (sourceId) => {
    const isCloud = isFirebaseConfigured() && user
    const targetSource = downloadSources.find(s => s.id === sourceId)
    const sourceName = targetSource ? targetSource.name : 'Source'

    if (isCloud && typeof sourceId === 'string' && !sourceId.startsWith('local_download_source_') && sourceId !== 'default_download') {
      try {
        await deleteFirebaseDownloadSource(sourceId)
        setDownloadSources(prev => prev.filter(s => s.id !== sourceId))
        showSyncBanner('success', `Removed download source "${sourceName}" from cloud.`)
      } catch (err) {
        console.error('Failed to delete download source:', err)
        showSyncBanner('error', 'Could not delete download source from database.')
      }
    } else {
      const updated = downloadSources.filter(s => s.id !== sourceId)
      setDownloadSources(updated)
      localStorage.setItem('local_download_sources', JSON.stringify(updated))
      showSyncBanner('success', `Removed download source "${sourceName}" locally.`)
    }
  }

  const handleUpdateSource = async (sourceId, name, url, isPublic) => {
    const isCloud = isFirebaseConfigured() && user
    const target = sources.find(s => s.id === sourceId)
    const newName = name !== undefined ? name : target?.name
    const newUrl = url !== undefined ? url : target?.url
    const canMakePublic = isAdmin ? (isPublic !== undefined ? isPublic : target?.is_public) : false

    if (isCloud && typeof sourceId === 'string' && !sourceId.startsWith('local_source_')) {
      try {
        await updateFirebaseSource(sourceId, newName, newUrl, canMakePublic)
        setSources(prev => prev.map(s => s.id === sourceId ? { ...s, name: newName, url: newUrl, is_public: canMakePublic } : s))
        showSyncBanner('success', `Updated source "${newName}".`)
      } catch (err) {
        console.error('Failed to update source:', err)
        showSyncBanner('error', 'Could not update source in database.')
      }
    } else {
      const updated = sources.map(s => s.id === sourceId ? { ...s, name: newName, url: newUrl, is_public: canMakePublic } : s)
      setSources(updated)
      localStorage.setItem('local_video_sources', JSON.stringify(updated))
      showSyncBanner('success', `Updated source "${newName}" locally.`)
    }
  }

  const handleUpdateDownloadSource = async (sourceId, name, url, isPublic) => {
    const isCloud = isFirebaseConfigured() && user
    const target = downloadSources.find(s => s.id === sourceId)
    const newName = name !== undefined ? name : target?.name
    const newUrl = url !== undefined ? url : target?.url
    const canMakePublic = isAdmin ? (isPublic !== undefined ? isPublic : target?.is_public) : false

    if (isCloud && typeof sourceId === 'string' && !sourceId.startsWith('local_download_source_')) {
      try {
        await updateFirebaseDownloadSource(sourceId, newName, newUrl, canMakePublic)
        setDownloadSources(prev => prev.map(s => s.id === sourceId ? { ...s, name: newName, url: newUrl, is_public: canMakePublic } : s))
        showSyncBanner('success', `Updated download source "${newName}".`)
      } catch (err) {
        console.error('Failed to update download source:', err)
        showSyncBanner('error', 'Could not update download source in database.')
      }
    } else {
      const updated = downloadSources.map(s => s.id === sourceId ? { ...s, name: newName, url: newUrl, is_public: canMakePublic } : s)
      setDownloadSources(updated)
      localStorage.setItem('local_download_sources', JSON.stringify(updated))
      showSyncBanner('success', `Updated download source "${newName}" locally.`)
    }
  }

  const loadLocalSavedSites = () => {
    try {
      const localData = localStorage.getItem('local_saved_sites')
      if (localData) {
        const parsed = JSON.parse(localData)
        // Filter out initial default seed sites if present
        const userSites = parsed.filter(s => !s.id?.startsWith('def_'))
        setSavedSites(userSites)
        localStorage.setItem('local_saved_sites', JSON.stringify(userSites))
      } else {
        setSavedSites([])
        localStorage.setItem('local_saved_sites', JSON.stringify([]))
      }
    } catch (err) {
      console.error('Failed to load local saved sites:', err)
    }
  }

  const loadFirebaseSavedSitesData = async (currentUser) => {
    try {
      const dbSites = await loadFirebaseSavedSites(currentUser.uid)
      setSavedSites(dbSites)
    } catch (err) {
      console.error('Failed to load Firebase saved sites:', err)
      loadLocalSavedSites()
    }
  }

  const handleAddSavedSite = async (name, url, imageUrl, category) => {
    const isCloud = isFirebaseConfigured() && user
    if (isCloud) {
      try {
        const newSite = await addFirebaseSavedSite(user.uid, name, url, imageUrl, category)
        setSavedSites(prev => [...prev, newSite])
        showSyncBanner('success', `Saved site "${name}" to cloud.`)
      } catch (err) {
        console.error('Failed to add saved site:', err)
        showSyncBanner('error', 'Could not save site to database.')
      }
    } else {
      const newSite = {
        id: `local_site_${Date.now()}`,
        name,
        url,
        image_url: imageUrl,
        category,
        created_at: new Date().toISOString()
      }
      const updated = [...savedSites, newSite]
      setSavedSites(updated)
      localStorage.setItem('local_saved_sites', JSON.stringify(updated))
      showSyncBanner('success', `Saved site "${name}" locally.`)
    }
  }

  const handleRemoveSavedSite = async (siteId) => {
    const isCloud = isFirebaseConfigured() && user
    const targetSite = savedSites.find(s => s.id === siteId)
    const siteName = targetSite ? targetSite.name : 'Site'

    if (isCloud && typeof siteId === 'string' && !siteId.startsWith('local_site_')) {
      try {
        await deleteFirebaseSavedSite(siteId)
        setSavedSites(prev => prev.filter(s => s.id !== siteId))
        showSyncBanner('success', `Removed site "${siteName}" from cloud.`)
      } catch (err) {
        console.error('Failed to delete saved site:', err)
        showSyncBanner('error', 'Could not delete site from database.')
      }
    } else {
      const updated = savedSites.filter(s => s.id !== siteId)
      setSavedSites(updated)
      localStorage.setItem('local_saved_sites', JSON.stringify(updated))
      showSyncBanner('success', `Removed site "${siteName}" locally.`)
    }
  }

  const handleUpdateSavedSite = async (siteId, updatedData) => {
    const isCloud = isFirebaseConfigured() && user
    const targetSite = savedSites.find(s => s.id === siteId)
    const oldName = targetSite ? targetSite.name : 'Site'
    const newName = updatedData.name || oldName

    if (isCloud && typeof siteId === 'string' && !siteId.startsWith('local_site_')) {
      try {
        await updateFirebaseSavedSite(siteId, updatedData)
        setSavedSites(prev => prev.map(s => s.id === siteId ? { ...s, ...updatedData } : s))
        showSyncBanner('success', `Updated site "${newName}" in cloud.`)
      } catch (err) {
        console.error('Failed to update saved site:', err)
        showSyncBanner('error', 'Could not update site in database.')
      }
    } else {
      const updated = savedSites.map(s => s.id === siteId ? { ...s, ...updatedData } : s)
      setSavedSites(updated)
      localStorage.setItem('local_saved_sites', JSON.stringify(updated))
      showSyncBanner('success', `Updated site "${newName}" locally.`)
    }
  }

  // Migrate local items to Firebase on sign-in
  const migrateLocalItemsToFirebaseData = async (currentUser, localItems) => {
    showSyncBanner('loading', 'Syncing your offline items to your database cloud storage...')
    try {
      const addedItems = await migrateLocalItemsToFirebase(currentUser.uid, localItems)
      
      // Update local state with the synced database items and purge localStorage
      setItems(prev => {
        // Clean duplicates
        const localUnique = prev.filter(p => !p.tmdb_id) // Keep items without tmdb_id if any
        return [...addedItems, ...localUnique]
      })
      localStorage.removeItem('local_media_items')
      showSyncBanner('success', `Imported ${localItems.length} local items to your cloud database!`)
    } catch (err) {
      console.error('Migration failed:', err)
      showSyncBanner('error', 'Cloud sync failed. Local watchlist saved in browser memory.')
    }
  }

  // Config Reload Handler (called from settings component)
  const handleConfigChange = () => {
    // Reload whole app auth & storage setup
    window.location.reload()
  }

  const showSyncBanner = (type, message) => {
    setSyncStatus({ type, message })
    if (type !== 'loading') {
      setTimeout(() => setSyncStatus({ type: '', message: '' }), 5000)
    }
  }

  // API Callbacks: Add
  const handleAddItem = async (newItem) => {
    const isCloud = isFirebaseConfigured() && user
    const dateNow = new Date().toISOString()
    const targetKey = getMediaItemKey(newItem)

    // Check if an item for this media already exists in items
    const existing = items.find(i => getMediaItemKey(i) === targetKey)

    if (existing) {
      const typeLabel = newItem.type === 'movie' ? 'movie' : newItem.type === 'tv' ? 'TV show' : 'game'
      const targetStatus = newItem.status || (existing.status !== 'list_only' ? existing.status : 'completed')
      const successMsg = `"${newItem.title || existing.title}" ${typeLabel} updated to ${targetStatus}.`

      const updates = {
        ...newItem,
        status: targetStatus,
        watched_at: newItem.watched_at || dateNow
      }
      delete updates.id
      delete updates.user_id

      await handleUpdateItem(existing.id, updates)
      showSyncBanner('success', successMsg)
      return { ...existing, ...updates }
    }

    const itemWithMeta = {
      ...newItem,
      watched_at: dateNow,
      created_at: dateNow
    }

    const typeLabel = newItem.type === 'movie' ? 'movie' : newItem.type === 'tv' ? 'TV show' : 'game'
    const statusLabel = newItem.status || 'planned'
    const successMsg = `"${newItem.title}" ${typeLabel} added to ${statusLabel}.`

    if (isCloud) {
      try {
        const addedItem = await addFirebaseItem(user.uid, newItem)
        setItems(prev => [addedItem, ...prev])
        showSyncBanner('success', successMsg)
        return addedItem
      } catch (err) {
        console.error('Failed to save to Firebase:', err)
        showSyncBanner('error', 'Failed to sync to database. Storing locally instead.')
        // Fallback save locally
        return saveItemLocally(itemWithMeta, successMsg)
      }
    } else {
      return saveItemLocally(itemWithMeta, successMsg)
    }
  }

  const handleAddItems = async (newItemsList) => {
    const isCloud = isFirebaseConfigured() && user
    const dateNow = new Date().toISOString()
    
    const itemsToInsert = []
    const updatedExistingItems = []

    for (const newItem of newItemsList) {
      const targetKey = getMediaItemKey(newItem)
      const existing = items.find(i => getMediaItemKey(i) === targetKey)

      if (existing) {
        const targetStatus = newItem.status || (existing.status !== 'list_only' ? existing.status : 'completed')
        const updates = {
          ...newItem,
          status: targetStatus,
          watched_at: newItem.watched_at || dateNow
        }
        delete updates.id
        delete updates.user_id
        await handleUpdateItem(existing.id, updates)
        updatedExistingItems.push({ ...existing, ...updates })
      } else {
        itemsToInsert.push({
          ...newItem,
          watched_at: dateNow,
          created_at: dateNow
        })
      }
    }

    let createdItems = []
    if (itemsToInsert.length > 0) {
      if (isCloud) {
        try {
          createdItems = await batchAddFirebaseItems(user.uid, itemsToInsert)
          setItems(prev => [...createdItems, ...prev])
          showSyncBanner('success', `Logged ${newItemsList.length} items to cloud database.`)
        } catch (err) {
          console.error('Failed to save to Firebase:', err)
          showSyncBanner('error', 'Failed to sync to database. Storing locally instead.')
          
          // Fallback save locally
          createdItems = itemsToInsert.map(item => ({
            ...item,
            id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          }))
          setItems(prev => [...createdItems, ...prev])
          localStorage.setItem('local_media_items', JSON.stringify([...createdItems, ...items]))
        }
      } else {
        createdItems = itemsToInsert.map(item => ({
          ...item,
          id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }))
        setItems(prev => [...createdItems, ...prev])
        localStorage.setItem('local_media_items', JSON.stringify([...createdItems, ...items]))
        showSyncBanner('success', `Saved ${newItemsList.length} items locally in browser.`)
      }
    } else if (updatedExistingItems.length > 0) {
      showSyncBanner('success', `Updated ${updatedExistingItems.length} items.`)
    }

    return [...updatedExistingItems, ...createdItems]
  }

  const saveItemLocally = (item, customMsg) => {
    const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const finalItem = { ...item, id: localId }
    const updated = [finalItem, ...items]
    setItems(updated)
    localStorage.setItem('local_media_items', JSON.stringify(updated))
    showSyncBanner('success', customMsg || `Saved "${item.title}" locally in browser.`)
    return finalItem
  }

  // API Callbacks: Update
  const handleUpdateItem = async (itemId, updates) => {
    const isCloud = isFirebaseConfigured() && user
    const dateNow = new Date().toISOString()
    const finalUpdates = {
      ...updates,
      updated_at: updates.updated_at || dateNow,
      ...((updates.season_progress !== undefined || updates.status === 'watching') ? { watched_at: updates.watched_at || dateNow } : {})
    }
    
    // Find the item to display title in messages
    const targetItem = items.find(i => i.id === itemId)
    const itemTitle = targetItem ? targetItem.title : 'Media item'
    const typeLabel = targetItem ? (targetItem.type === 'movie' ? 'movie' : targetItem.type === 'tv' ? 'TV show' : 'game') : 'item'
    const successMsg = finalUpdates.status
      ? `"${itemTitle}" ${typeLabel} added to ${finalUpdates.status}.`
      : `Updated reviews for "${itemTitle}".`

    if (isCloud && typeof itemId === 'string' && !itemId.startsWith('local_')) {
      try {
        await updateFirebaseItem(itemId, finalUpdates)

        setItems(prev => prev.map(item => 
          item.id === itemId ? { ...item, ...finalUpdates } : item
        ))
        showSyncBanner('success', successMsg)
      } catch (err) {
        console.error('Failed to update in Firebase:', err)
        showSyncBanner('error', 'Could not sync update to database.')
      }
    } else {
      // Local updates
      const updated = items.map(item => 
        item.id === itemId ? { ...item, ...finalUpdates } : item
      )
      setItems(updated)
      localStorage.setItem('local_media_items', JSON.stringify(updated))
      showSyncBanner('success', successMsg)
    }
  }

  // API Callbacks: Remove
  const handleRemoveItem = async (itemId) => {
    const isCloud = isFirebaseConfigured() && user
    const targetItem = items.find(i => i.id === itemId)
    const itemTitle = targetItem ? targetItem.title : 'Item'

    if (isCloud && typeof itemId === 'string' && !itemId.startsWith('local_')) {
      try {
        await deleteFirebaseItem(itemId)

        setItems(prev => prev.filter(item => item.id !== itemId))
        showSyncBanner('success', `Removed "${itemTitle}" from cloud list.`)
      } catch (err) {
        console.error('Failed to delete from Firebase:', err)
        showSyncBanner('error', 'Could not delete item from database.')
      }
    } else {
      // Local delete
      const updated = items.filter(item => item.id !== itemId)
      setItems(updated)
      localStorage.setItem('local_media_items', JSON.stringify(updated))
      showSyncBanner('success', `Removed "${itemTitle}" from local list.`)
    }
  }

  // API Callbacks: Import
  const handleAddImportedItems = (newItems) => {
    setItems((prevItems) => {
      const mergedMap = new Map()
      
      prevItems.forEach(item => {
        const key = item.tmdb_id ? `tmdb_${item.tmdb_id}` : `title_${item.title}_${item.release_year}`
        mergedMap.set(key, item)
      })

      newItems.forEach(item => {
        const key = item.tmdb_id ? `tmdb_${item.tmdb_id}` : `title_${item.title}_${item.release_year}`
        mergedMap.set(key, item)
      })

      return Array.from(mergedMap.values())
    })
    
    showSyncBanner('success', `Imported ${newItems.length} items successfully!`)
  }

  // Auth Functions
  const handleAuthSuccess = (authUser) => {
    setUser(authUser)
    navigate('/')
  }

  const handleLogout = async () => {
    try {
      await firebaseSignOut()
      setUser(null)
      loadLocalItems()
      navigate('/')
      showSyncBanner('success', 'Logged out successfully. Switched to offline sandbox.')
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col font-sans selection:bg-violet-600 selection:text-white antialiased">
      
      {/* Navigation Header */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        user={user}
        onLogout={handleLogout}
        onNavigateToAuth={() => navigate('/auth')}
        onNavigateToSettings={() => navigate('/settings')}
        activeView={activeView}
        searchQuery={globalSearchQuery}
        setSearchQuery={setGlobalSearchQuery}
        isSelectMode={globalSelectMode}
        setIsSelectMode={setGlobalSelectMode}
        isFilterOpen={globalFilterOpen}
        setIsFilterOpen={setGlobalFilterOpen}
      />

      {/* Hamburger Sidebar Navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeView={activeView}
        onNavigate={(view) => navigate(view === 'watchlist' ? '/' : `/${view}`)}
        watchedCount={items.filter(i => i.status !== 'list_only').length}
        user={user}
        onLogout={handleLogout}
      />

      {/* Toast Notification Sync Banners */}
      {syncStatus.message && (
        <div className="fixed top-20 right-6 z-50 animate-slide-in-right max-w-sm">
          <div className={`p-4 rounded-xl border flex items-start gap-3 shadow-2xl backdrop-blur-md ${
            syncStatus.type === 'success' 
              ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300' 
              : syncStatus.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/30 text-rose-300'
              : 'bg-violet-950/90 border-violet-500/30 text-violet-300'
          }`}>
            {syncStatus.type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-400 mt-0.5" />}
            {syncStatus.type === 'error' && <ShieldAlert className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />}
            {syncStatus.type === 'loading' && (
              <span className="w-5 h-5 border-2 border-violet-400/20 border-t-violet-400 rounded-full animate-spin flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Sync Manager</p>
              <p className="text-sm font-medium mt-0.5">{syncStatus.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Page Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto pb-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-48 text-slate-400">
            <span className="w-12 h-12 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin mb-4" />
            <p className="text-sm font-semibold">Synchronizing your collections...</p>
          </div>
        ) : (
          <div className="transition-all duration-300 animate-fade-in">
            <Routes>
              <Route path="/" element={
                <MediaGrid
                  items={getDeduplicatedItems(items)}
                  typeFilter={currentTab}
                  onUpdateItem={handleUpdateItem}
                  onRemoveItem={handleRemoveItem}
                  onItemClick={(item) => {
                    if (item.id && item.id.toString().startsWith('tmdb_')) {
                      if (item.watchlist_item_id) {
                        navigate(`/media/${item.watchlist_item_id}`)
                      } else {
                        navigate(`/explore/${item.type}/${item.tmdb_id}`)
                      }
                    } else {
                      navigate(`/media/${item.id}`)
                    }
                  }}
                  onAddItem={handleAddItem}
                  onAddItems={handleAddItems}
                  user={user}
                  searchQuery={globalSearchQuery}
                  setSearchQuery={setGlobalSearchQuery}
                  isSelectMode={globalSelectMode}
                  setIsSelectMode={setGlobalSelectMode}
                  showFilterDropdown={globalFilterOpen}
                  setShowFilterDropdown={setGlobalFilterOpen}
                />
              } />
              
              <Route path="/media/:id" element={
                <MediaDetailsWrapper 
                  items={items}
                  onUpdateItem={handleUpdateItem}
                  onRemoveItem={handleRemoveItem}
                  onAddItem={handleAddItem}
                  sources={sources}
                  downloadSources={downloadSources}
                />
              } />

              <Route path="/anime-player/:id/:epNum" element={
                <AnimePlayer 
                  items={items}
                  onUpdateItem={handleUpdateItem}
                />
              } />

              <Route path="/explore/:type/:tmdb_id" element={
                <ExploreDetailsWrapper 
                  items={items}
                  onUpdateItem={handleUpdateItem}
                  onRemoveItem={handleRemoveItem}
                  onAddItem={handleAddItem}
                  sources={sources}
                  downloadSources={downloadSources}
                />
              } />

              <Route path="/explore_tmdb" element={
                <ExploreTMDB
                  watchedItems={items}
                  onAddItem={handleAddItem}
                  onAddItems={handleAddItems}
                  onUpdateItem={handleUpdateItem}
                  onRemoveItem={handleRemoveItem}
                  user={user}
                  query={globalSearchQuery}
                  setQuery={setGlobalSearchQuery}
                  isSelectMode={globalSelectMode}
                  setIsSelectMode={setGlobalSelectMode}
                />
              } />
              
              <Route path="/explore_games" element={
                <GameExplore
                  watchedItems={items}
                  onAddItem={handleAddItem}
                  onRemoveItem={handleRemoveItem}
                />
              } />

              <Route path="/explore_anilist" element={
                <ExploreAnilist
                  watchedItems={items}
                  onAddItem={handleAddItem}
                  onRemoveItem={handleRemoveItem}
                  user={user}
                  query={globalSearchQuery}
                  setQuery={setGlobalSearchQuery}
                />
              } />

              <Route path="/settings" element={
                <Settings 
                  user={user}
                  isAdmin={isAdmin}
                  onAuthSuccess={handleAuthSuccess}
                  onLogout={handleLogout}
                  onConfigChange={handleConfigChange}
                  sources={sources}
                  onAddSource={handleAddSource}
                  onRemoveSource={handleRemoveSource}
                  onUpdateSource={handleUpdateSource}
                  downloadSources={downloadSources}
                  onAddDownloadSource={handleAddDownloadSource}
                  onRemoveDownloadSource={handleRemoveDownloadSource}
                  onUpdateDownloadSource={handleUpdateDownloadSource}
                  items={items}
                  onAddImportedItems={handleAddImportedItems}
                />
              } />

              <Route path="/auth" element={
                <Auth 
                  onAuthSuccess={handleAuthSuccess} 
                  onNavigateToSettings={() => navigate('/settings')}
                />
              } />

              <Route path="/import_export" element={
                <ImportExport
                  items={items}
                  onAddImportedItems={handleAddImportedItems}
                  user={user}
                />
              } />

              <Route path="/sources" element={
                <Sources
                  sources={sources}
                  onAddSource={handleAddSource}
                  onRemoveSource={handleRemoveSource}
                  onUpdateSource={handleUpdateSource}
                  downloadSources={downloadSources}
                  onAddDownloadSource={handleAddDownloadSource}
                  onRemoveDownloadSource={handleRemoveDownloadSource}
                  onUpdateDownloadSource={handleUpdateDownloadSource}
                  user={user}
                  isAdmin={isAdmin}
                />
              } />

              <Route path="/saved_sites" element={
                <SavedSites
                  sites={savedSites}
                  onAddSite={handleAddSavedSite}
                  onRemoveSite={handleRemoveSavedSite}
                  onUpdateSite={handleUpdateSavedSite}
                  user={user}
                />
              } />

              <Route path="/statistics" element={
                <Statistics items={items} />
              } />
            </Routes>
          </div>
        )}
      </main>

      {/* Subtle Background Art Gradients */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-3xl -z-50 pointer-events-none" />
      <div className="absolute bottom-12 left-1/4 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-3xl -z-50 pointer-events-none" />
    </div>
  )
}
