import React, { useState, useEffect } from 'react'
import { FolderPlus, Folder, Plus, X, ChevronLeft, Trash2, PlusCircle, FolderOpen, Film, Tv, Gamepad, Info, Settings, Eye, Filter, ArrowUpDown, Check, CheckSquare, Square } from 'lucide-react'
import { isFirebaseConfigured, loadFirebaseLists, addFirebaseList, updateFirebaseListItems, deleteFirebaseList, updateFirebaseList } from '../lib/firebase'
import { getPosterUrl, fetchTMDB, searchGames } from '../lib/tmdb'

const getStatusLabelAndStyle = (status, type) => {
  if (!status || status === 'list_only') return null
  const isGame = type === 'game'
  switch (status) {
    case 'completed':
      return {
        label: isGame ? 'Beaten' : 'Watched',
        containerStyle: 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300',
        iconColor: 'text-emerald-400'
      }
    case 'watching':
      return {
        label: isGame ? 'Playing' : 'Watching',
        containerStyle: 'bg-violet-950/90 border-violet-500/30 text-violet-300',
        iconColor: 'text-violet-400'
      }
    case 'planned':
      return {
        label: isGame ? 'Plan to Play' : 'Plan to Watch',
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
        label: type === 'tv' ? 'Up Next' : 'Pending',
        containerStyle: 'bg-indigo-950/90 border-indigo-500/30 text-indigo-300',
        iconColor: 'text-indigo-400'
      }
    default:
      return {
        label: isGame ? 'In Library' : 'Watched',
        containerStyle: 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300',
        iconColor: 'text-emerald-400'
      }
  }
}

export default function CustomLists({ typeFilter, user, watchlistItems, onItemClick, onAddItem, onAddItems, onUpdateItem }) {
  const [lists, setLists] = useState([])
  const [activeListId, setActiveListId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [newListDesc, setNewListDesc] = useState('')
  const [selectedItemId, setSelectedItemId] = useState('')
  const [error, setError] = useState('')
  
  const [letterboxdUrl, setLetterboxdUrl] = useState('')
  const [newThumbnailUrl, setNewThumbnailUrl] = useState('')
  const [newBannerUrl, setNewBannerUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [importStatus, setImportStatus] = useState('')
  
  const [showEditModal, setShowEditModal] = useState(false)
  const [editListName, setEditListName] = useState('')
  const [editListDesc, setEditListDesc] = useState('')
  const [editThumbnailUrl, setEditThumbnailUrl] = useState('')
  const [editBannerUrl, setEditBannerUrl] = useState('')
  const [editLetterboxdUrl, setEditLetterboxdUrl] = useState('')
  
  const [fadeWatched, setFadeWatched] = useState(false)
  const [showListFilterDropdown, setShowListFilterDropdown] = useState(false)
  const [listSortBy, setListSortBy] = useState('newest_added')
  const [listSearchQuery, setListSearchQuery] = useState('')
  
  const isCloud = isFirebaseConfigured() && user

  // Image Picker state variables
  const [showImagePicker, setShowImagePicker] = useState(false)
  const [imagePickerTarget, setImagePickerTarget] = useState(null) // 'thumbnail' | 'banner'
  const [pickerImages, setPickerImages] = useState([])
  const [loadingPickerImages, setLoadingPickerImages] = useState(false)

  // Bulk delete states
  const [isDeleteMode, setIsDeleteMode] = useState(false)
  const [selectedDeleteIds, setSelectedDeleteIds] = useState([])

  // Bulk add states
  const [showAddPopup, setShowAddPopup] = useState(false)
  const [popupSearchQuery, setPopupSearchQuery] = useState('')
  const [popupSearchResults, setPopupSearchResults] = useState([])
  const [searchingPopup, setSearchingPopup] = useState(false)
  const [selectedPopupItems, setSelectedPopupItems] = useState({})

  // Auto-migrate existing custom list items with 'planned' status to 'list_only'
  useEffect(() => {
    if (lists.length === 0 || watchlistItems.length === 0 || !onUpdateItem) return

    const customListItemIds = new Set(lists.flatMap(list => list.item_ids))
    watchlistItems.forEach(item => {
      if (customListItemIds.has(item.id) && (item.status === 'planned' || !item.status)) {
        onUpdateItem(item.id, { status: 'list_only' })
      }
    })
  }, [lists, watchlistItems, onUpdateItem])

  // Load lists on mount/type change/user change
  useEffect(() => {
    fetchLists()
  }, [typeFilter, user])

  // Load suggestions when Add Popup is opened
  useEffect(() => {
    if (showAddPopup) {
      loadInitialPopupSuggestions()
    }
  }, [showAddPopup])

  const fetchLists = async () => {
    setLoading(true)
    setError('')
    try {
      if (isCloud) {
        const cloudLists = await loadFirebaseLists(user.uid, typeFilter)
        setLists(cloudLists)
      } else {
        const localListsRaw = localStorage.getItem('local_custom_lists')
        if (localListsRaw) {
          const parsed = JSON.parse(localListsRaw)
          // Filter by media type and user if any (for offline simplicity, just filter by type)
          const filtered = parsed.filter(list => list.type === typeFilter)
          setLists(filtered)
        } else {
          setLists([])
        }
      }
    } catch (err) {
      console.error('Failed to load lists:', err)
      setError('Could not load custom lists.')
    } finally {
      setLoading(false)
    }
  }

  // Create List
  const handleCreateList = async (e) => {
    e.preventDefault()
    if (!newListName.trim()) return

    setImporting(true)
    setError('')
    setImportStatus('Initializing...')

    try {
      let importedItemIds = []

      if (letterboxdUrl.trim() && typeFilter === 'movie') {
        setImportStatus('Fetching Letterboxd list...')
        const cleanUrl = letterboxdUrl.trim()
        
        // Use fallback CORS proxies to prevent NetworkErrors
        let html = ''
        let fetchSuccess = false
        const proxies = [
          (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
          (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
        ]

        for (const proxyFn of proxies) {
          try {
            const proxyUrl = proxyFn(cleanUrl)
            const response = await fetch(proxyUrl)
            if (!response.ok) continue
            
            if (proxyUrl.includes('allorigins')) {
              const json = await response.json()
              html = json.contents
            } else {
              html = await response.text()
            }
            if (html && html.trim().length > 0) {
              fetchSuccess = true
              break
            }
          } catch (e) {
            console.error('CORS proxy fetch failed:', e)
          }
        }

        if (!fetchSuccess) {
          throw new Error('CORS fetch failed. Try again, or ensure the Letterboxd list is public.')
        }

        setImportStatus('Parsing list elements...')
        const parser = new DOMParser()
        const doc = parser.parseFromString(html, 'text/html')
        const items = doc.querySelectorAll('.poster-list li, .poster-grid li, .film-poster, .posteritem')
        
        const parsedMovies = []
        items.forEach(li => {
          const nameAttr = li.querySelector('[data-item-name]')?.getAttribute('data-item-name') || 
                           li.getAttribute('data-item-name') ||
                           li.querySelector('img')?.getAttribute('alt')
          
          if (nameAttr) {
            const yearMatch = nameAttr.match(/\((\d{4})\)$/)
            const year = yearMatch ? yearMatch[1] : ''
            const title = year ? nameAttr.replace(/\s*\(\d{4}\)$/, '').trim() : nameAttr.trim()
            
            if (title && title.toLowerCase() !== 'pcullen8' && !parsedMovies.some(m => m.title.toLowerCase() === title.toLowerCase())) {
              parsedMovies.push({ title, year })
            }
          }
        })

        if (parsedMovies.length === 0) {
          throw new Error('No movies found on the provided Letterboxd list. Make sure the list is public.')
        }

        setImportStatus(`Found ${parsedMovies.length} movies. Querying TMDB slowly...`)
        
        const searchTMDBItem = async (title, year) => {
          try {
            const res = await fetchTMDB('/search/movie', { query: title, ...(year && { year }) })
            if (res.results && res.results.length > 0) {
              return res.results[0]
            }
          } catch (err) {
            console.error(`Failed to lookup ${title} on TMDB:`, err)
          }
          return null
        }

        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))
        const resolvedTmdbItems = []

        for (let i = 0; i < parsedMovies.length; i++) {
          const movie = parsedMovies[i]
          setImportStatus(`TMDB query: Processing ${i + 1} of ${parsedMovies.length} ("${movie.title}")...`)
          const resolved = await searchTMDBItem(movie.title, movie.year)
          if (resolved) {
            resolvedTmdbItems.push(resolved)
          }
          // Sleep for 450ms between each request to comply with rate limits and prevent IP ban
          await sleep(450)
        }

        if (resolvedTmdbItems.length === 0) {
          throw new Error('Could not resolve any movies to TMDB database entries.')
        }

        setImportStatus(`Resolved ${resolvedTmdbItems.length} movies. Checking existing database watchlist...`)
        
        const itemsToCreate = []
        
        for (const tmdbItem of resolvedTmdbItems) {
          // Check if item is already in watchlistItems
          const existing = watchlistItems.find(w => w.type === 'movie' && w.tmdb_id === tmdbItem.id.toString())
          if (existing) {
            importedItemIds.push(existing.id)
            if (onUpdateItem && (existing.status === 'planned' || !existing.status)) {
              onUpdateItem(existing.id, { status: 'list_only' })
            }
          } else {
            // Need to create it
            const releaseYear = (tmdbItem.release_date || '').split('-')[0]
            const getCountryCode = () => {
              if (tmdbItem.origin_country && Array.isArray(tmdbItem.origin_country) && tmdbItem.origin_country.length > 0) {
                return tmdbItem.origin_country[0]
              }
              return 'US'
            }
            itemsToCreate.push({
              title: tmdbItem.title,
              type: 'movie',
              tmdb_id: tmdbItem.id.toString(),
              poster_path: tmdbItem.poster_path || '',
              release_year: releaseYear,
              status: 'list_only',
              country: getCountryCode(),
              original_language: tmdbItem.original_language || 'en',
              review: ''
            })
          }
        }

        if (itemsToCreate.length > 0) {
          setImportStatus(`Adding ${itemsToCreate.length} new movies to your watchlist...`)
          if (onAddItems) {
            const createdItems = await onAddItems(itemsToCreate)
            if (createdItems && createdItems.length > 0) {
              importedItemIds.push(...createdItems.map(i => i.id))
            }
          } else if (onAddItem) {
            for (const item of itemsToCreate) {
              const created = await onAddItem(item)
              if (created && created.id) {
                importedItemIds.push(created.id)
              }
            }
          }
        }
      }

      setImportStatus('Creating your custom list...')
      
      if (isCloud) {
        const newList = await addFirebaseList(
          user.uid, 
          newListName.trim(), 
          newListDesc.trim(), 
          typeFilter, 
          newThumbnailUrl.trim(), 
          newBannerUrl.trim()
        )
        if (importedItemIds.length > 0) {
          await updateFirebaseListItems(newList.id, importedItemIds)
          newList.item_ids = importedItemIds
        }
        setLists(prev => [newList, ...prev])
      } else {
        const localId = `local_list_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const newList = {
          id: localId,
          user_id: 'local',
          name: newListName.trim(),
          description: newListDesc.trim(),
          type: typeFilter,
          thumbnail_url: newThumbnailUrl.trim(),
          banner_url: newBannerUrl.trim(),
          item_ids: importedItemIds,
          created_at: new Date().toISOString()
        }

        const localListsRaw = localStorage.getItem('local_custom_lists')
        const currentLocalLists = localListsRaw ? JSON.parse(localListsRaw) : []
        const updatedLocalLists = [newList, ...currentLocalLists]
        localStorage.setItem('local_custom_lists', JSON.stringify(updatedLocalLists))
        
        setLists(prev => [newList, ...prev])
      }

      setNewListName('')
      setNewListDesc('')
      setLetterboxdUrl('')
      setNewThumbnailUrl('')
      setNewBannerUrl('')
      setShowCreateModal(false)
    } catch (err) {
      console.error('Failed to create list:', err)
      setError(err.message || 'Could not create list.')
    } finally {
      setImporting(false)
      setImportStatus('')
    }
  }

  // Delete List
  const handleDeleteList = async (listId) => {
    if (!window.confirm('Are you sure you want to delete this list? This cannot be undone.')) return

    try {
      if (isCloud && !listId.startsWith('local_list_')) {
        await deleteFirebaseList(listId)
      } else {
        const localListsRaw = localStorage.getItem('local_custom_lists')
        if (localListsRaw) {
          const parsed = JSON.parse(localListsRaw)
          const filtered = parsed.filter(list => list.id !== listId)
          localStorage.setItem('local_custom_lists', JSON.stringify(filtered))
        }
      }

      setLists(prev => prev.filter(list => list.id !== listId))
      if (activeListId === listId) {
        setActiveListId(null)
      }
    } catch (err) {
      console.error('Failed to delete list:', err)
      setError('Failed to delete list.')
    }
  }

  const handleOpenEditModal = () => {
    if (!activeList) return
    setEditListName(activeList.name)
    setEditListDesc(activeList.description || '')
    setEditThumbnailUrl(activeList.thumbnail_url || '')
    setEditBannerUrl(activeList.banner_url || '')
    setEditLetterboxdUrl('')
    setShowEditModal(true)
  }

  const handleSaveEditList = async (e) => {
    e.preventDefault()
    if (!activeList || !editListName.trim()) return

    setImporting(true)
    setError('')
    setImportStatus('Initializing list settings update...')

    try {
      let finalItemIds = [...activeList.item_ids]

      if (editLetterboxdUrl.trim() && typeFilter === 'movie') {
        setImportStatus('Fetching Letterboxd list...')
        const cleanUrl = editLetterboxdUrl.trim()
        
        // Use fallback CORS proxies
        let html = ''
        let fetchSuccess = false
        const proxies = [
          (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
          (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
        ]

        for (const proxyFn of proxies) {
          try {
            const proxyUrl = proxyFn(cleanUrl)
            const response = await fetch(proxyUrl)
            if (!response.ok) continue
            
            if (proxyUrl.includes('allorigins')) {
              const json = await response.json()
              html = json.contents
            } else {
              html = await response.text()
            }
            if (html && html.trim().length > 0) {
              fetchSuccess = true
              break
            }
          } catch (e) {
            console.error('CORS proxy fetch failed:', e)
          }
        }

        if (!fetchSuccess) {
          throw new Error('CORS fetch failed. Try again, or ensure the Letterboxd list is public.')
        }

        setImportStatus('Parsing list elements...')
        const parser = new DOMParser()
        const doc = parser.parseFromString(html, 'text/html')
        const items = doc.querySelectorAll('.poster-list li, .poster-grid li, .film-poster, .posteritem')
        
        const parsedMovies = []
        items.forEach(li => {
          const nameAttr = li.querySelector('[data-item-name]')?.getAttribute('data-item-name') || 
                           li.getAttribute('data-item-name') ||
                           li.querySelector('img')?.getAttribute('alt')
          
          if (nameAttr) {
            const yearMatch = nameAttr.match(/\((\d{4})\)$/)
            const year = yearMatch ? yearMatch[1] : ''
            const title = year ? nameAttr.replace(/\s*\(\d{4}\)$/, '').trim() : nameAttr.trim()
            
            if (title && title.toLowerCase() !== 'pcullen8' && !parsedMovies.some(m => m.title.toLowerCase() === title.toLowerCase())) {
              parsedMovies.push({ title, year })
            }
          }
        })

        if (parsedMovies.length === 0) {
          throw new Error('No movies found on the provided Letterboxd list. Make sure the list is public.')
        }

        setImportStatus(`Found ${parsedMovies.length} movies. Querying TMDB slowly...`)
        
        const searchTMDBItem = async (title, year) => {
          try {
            const res = await fetchTMDB('/search/movie', { query: title, ...(year && { year }) })
            if (res.results && res.results.length > 0) {
              return res.results[0]
            }
          } catch (err) {
            console.error(`Failed to lookup ${title} on TMDB:`, err)
          }
          return null
        }

        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))
        const resolvedTmdbItems = []

        for (let i = 0; i < parsedMovies.length; i++) {
          const movie = parsedMovies[i]
          setImportStatus(`TMDB query: Processing ${i + 1} of ${parsedMovies.length} ("${movie.title}")...`)
          const resolved = await searchTMDBItem(movie.title, movie.year)
          if (resolved) {
            resolvedTmdbItems.push(resolved)
          }
          await sleep(450)
        }

        if (resolvedTmdbItems.length === 0) {
          throw new Error('Could not resolve any movies to TMDB database entries.')
        }

        setImportStatus(`Resolved ${resolvedTmdbItems.length} movies. Checking existing database watchlist...`)
        
        const itemsToCreate = []
        const importedItemIds = []
        
        for (const tmdbItem of resolvedTmdbItems) {
          const existing = watchlistItems.find(w => w.type === 'movie' && w.tmdb_id === tmdbItem.id.toString())
          if (existing) {
            importedItemIds.push(existing.id)
            if (onUpdateItem && (existing.status === 'planned' || !existing.status)) {
              onUpdateItem(existing.id, { status: 'list_only' })
            }
          } else {
            const releaseYear = (tmdbItem.release_date || '').split('-')[0]
            const getCountryCode = () => {
              if (tmdbItem.origin_country && Array.isArray(tmdbItem.origin_country) && tmdbItem.origin_country.length > 0) {
                return tmdbItem.origin_country[0]
              }
              return 'US'
            }
            itemsToCreate.push({
              title: tmdbItem.title,
              type: 'movie',
              tmdb_id: tmdbItem.id.toString(),
              poster_path: tmdbItem.poster_path || '',
              release_year: releaseYear,
              status: 'list_only',
              country: getCountryCode(),
              original_language: tmdbItem.original_language || 'en',
              review: ''
            })
          }
        }

        if (itemsToCreate.length > 0) {
          setImportStatus(`Adding ${itemsToCreate.length} new movies to your watchlist...`)
          if (onAddItems) {
            const createdItems = await onAddItems(itemsToCreate)
            if (createdItems && createdItems.length > 0) {
              importedItemIds.push(...createdItems.map(i => i.id))
            }
          } else if (onAddItem) {
            for (const item of itemsToCreate) {
              const created = await onAddItem(item)
              if (created && created.id) {
                importedItemIds.push(created.id)
              }
            }
          }
        }

        // Merge and prevent duplicates
        finalItemIds = Array.from(new Set([...finalItemIds, ...importedItemIds]))
      }

      setImportStatus('Saving settings updates...')
      
      const updates = {
        name: editListName.trim(),
        description: editListDesc.trim(),
        thumbnail_url: editThumbnailUrl.trim(),
        banner_url: editBannerUrl.trim(),
        item_ids: finalItemIds
      }

      if (isCloud && !activeList.id.startsWith('local_list_')) {
        await updateFirebaseList(activeList.id, updates)
        if (editLetterboxdUrl.trim()) {
          await updateFirebaseListItems(activeList.id, finalItemIds)
        }
      } else {
        const localListsRaw = localStorage.getItem('local_custom_lists')
        if (localListsRaw) {
          const parsed = JSON.parse(localListsRaw)
          const updated = parsed.map(list => 
            list.id === activeList.id ? { ...list, ...updates } : list
          )
          localStorage.setItem('local_custom_lists', JSON.stringify(updated))
        }
      }

      setLists(prev => prev.map(list => 
        list.id === activeList.id ? { ...list, ...updates } : list
      ))
      setEditLetterboxdUrl('')
      setShowEditModal(false)
    } catch (err) {
      console.error('Failed to update list details:', err)
      setError(err.message || 'Could not update list details.')
    } finally {
      setImporting(false)
      setImportStatus('')
    }
  }

  // Add Item to List
  const handleAddItem = async () => {
    if (!selectedItemId || !activeListId) return

    const targetList = lists.find(l => l.id === activeListId)
    if (!targetList) return

    if (targetList.item_ids.includes(selectedItemId)) {
      setError('Item is already in this list!')
      return
    }

    const updatedIds = [...targetList.item_ids, selectedItemId]

    try {
      if (isCloud && !activeListId.startsWith('local_list_')) {
        await updateFirebaseListItems(activeListId, updatedIds)
      } else {
        const localListsRaw = localStorage.getItem('local_custom_lists')
        if (localListsRaw) {
          const parsed = JSON.parse(localListsRaw)
          const updated = parsed.map(list => 
            list.id === activeListId ? { ...list, item_ids: updatedIds } : list
          )
          localStorage.setItem('local_custom_lists', JSON.stringify(updated))
        }
      }

      setLists(prev => prev.map(list => 
        list.id === activeListId ? { ...list, item_ids: updatedIds } : list
      ))
      setSelectedItemId('')
      setError('')
    } catch (err) {
      console.error('Failed to add item to list:', err)
      setError('Could not add item to list.')
    }
  }

  // Remove Item from List
  const handleRemoveItem = async (itemId) => {
    if (!activeListId) return

    const targetList = lists.find(l => l.id === activeListId)
    if (!targetList) return

    const updatedIds = targetList.item_ids.filter(id => id !== itemId)

    try {
      if (isCloud && !activeListId.startsWith('local_list_')) {
        await updateFirebaseListItems(activeListId, updatedIds)
      } else {
        const localListsRaw = localStorage.getItem('local_custom_lists')
        if (localListsRaw) {
          const parsed = JSON.parse(localListsRaw)
          const updated = parsed.map(list => 
            list.id === activeListId ? { ...list, item_ids: updatedIds } : list
          )
          localStorage.setItem('local_custom_lists', JSON.stringify(updated))
        }
      }

      setLists(prev => prev.map(list => 
        list.id === activeListId ? { ...list, item_ids: updatedIds } : list
      ))
      setError('')
    } catch (err) {
      console.error('Failed to remove item from list:', err)
      setError('Could not remove item from list.')
    }
  }

  const activeList = lists.find(l => l.id === activeListId)

  // Map item IDs to actual watchlist items
  const getListItems = (itemIds) => {
    return itemIds
      .map(id => watchlistItems.find(w => w.id === id))
      .filter(Boolean) // Filter out items that might have been deleted from main log
  }

  const rawListItems = activeList ? getListItems(activeList.item_ids) : []

  // Image Picker handlers
  const handleOpenImagePicker = async (target) => {
    setImagePickerTarget(target)
    setShowImagePicker(true)
    setLoadingPickerImages(true)
    setPickerImages([])
    
    try {
      const items = rawListItems.filter(i => i.tmdb_id)
      
      const posters = items.map(item => ({
        src: getPosterUrl(item.poster_path),
        title: `${item.title} (Poster)`,
        itemTitle: item.title,
        type: 'poster'
      })).filter(img => img.src && !img.src.includes('placehold.co') && !img.src.includes('No+Poster'))

      setPickerImages(posters)

      const fetchedBackdrops = await Promise.all(
        items.map(async (item) => {
          if (item.type !== 'movie' && item.type !== 'tv') return null
          try {
            const endpoint = item.type === 'movie' ? `/movie/${item.tmdb_id}` : `/tv/${item.tmdb_id}`
            const details = await fetchTMDB(endpoint)
            if (details && details.backdrop_path) {
              return {
                src: `https://image.tmdb.org/t/p/w1280${details.backdrop_path}`,
                title: `${item.title} (Banner)`,
                itemTitle: item.title,
                type: 'banner'
              }
            }
          } catch (e) {
            console.error('Failed to fetch backdrop for picker:', e)
          }
          return null
        })
      )

      const backdrops = fetchedBackdrops.filter(Boolean)
      setPickerImages([...posters, ...backdrops])
    } catch (err) {
      console.error('Error loading picker images:', err)
    } finally {
      setLoadingPickerImages(false)
    }
  }

  const handleSelectImage = (src) => {
    if (imagePickerTarget === 'thumbnail') {
      setEditThumbnailUrl(src)
    } else if (imagePickerTarget === 'banner') {
      setEditBannerUrl(src)
    }
    setShowImagePicker(false)
  }

  // Bulk remove items
  const handleRemoveItems = async (itemIdsToRemove) => {
    if (!activeListId || itemIdsToRemove.length === 0) return

    const targetList = lists.find(l => l.id === activeListId)
    if (!targetList) return

    const updatedIds = targetList.item_ids.filter(id => !itemIdsToRemove.includes(id))

    try {
      if (isCloud && !activeListId.startsWith('local_list_')) {
        await updateFirebaseListItems(activeListId, updatedIds)
      } else {
        const localListsRaw = localStorage.getItem('local_custom_lists')
        if (localListsRaw) {
          const parsed = JSON.parse(localListsRaw)
          const updated = parsed.map(list => 
            list.id === activeListId ? { ...list, item_ids: updatedIds } : list
          )
          localStorage.setItem('local_custom_lists', JSON.stringify(updated))
        }
      }

      setLists(prev => prev.map(list => 
        list.id === activeListId ? { ...list, item_ids: updatedIds } : list
      ))
      setError('')
      setIsDeleteMode(false)
      setSelectedDeleteIds([])
    } catch (err) {
      console.error('Failed to remove items from list:', err)
      setError('Could not remove items from list.')
    }
  }

  // Popup Search Handlers
  const handlePopupSearch = async (queryText) => {
    setPopupSearchQuery(queryText)
    if (!queryText.trim()) {
      loadInitialPopupSuggestions()
      return
    }
    setSearchingPopup(true)
    try {
      if (typeFilter === 'game') {
        const results = await searchGames(queryText)
        setPopupSearchResults(results.map(g => ({ ...g, media_type: 'game' })))
      } else {
        const endpoint = typeFilter === 'movie' ? '/search/movie' : '/search/tv'
        const data = await fetchTMDB(endpoint, { query: queryText })
        if (data && data.results) {
          setPopupSearchResults(data.results.map(i => ({ ...i, media_type: typeFilter })))
        } else {
          setPopupSearchResults([])
        }
      }
    } catch (err) {
      console.error('Failed to search in custom list add popup:', err)
    } finally {
      setSearchingPopup(false)
    }
  }

  const loadInitialPopupSuggestions = async () => {
    setSearchingPopup(true)
    try {
      if (typeFilter === 'game') {
        const results = await searchGames('')
        setPopupSearchResults(results.map(g => ({ ...g, media_type: 'game' })))
      } else {
        const endpoint = typeFilter === 'movie' ? '/movie/popular' : '/tv/popular'
        const data = await fetchTMDB(endpoint)
        if (data && data.results) {
          setPopupSearchResults(data.results.map(i => ({ ...i, media_type: typeFilter })))
        }
      }
    } catch (err) {
      console.error('Failed to load initial popup suggestions:', err)
    } finally {
      setSearchingPopup(false)
    }
  }

  const handleAddItemsToList = async (selectedItemsArray) => {
    if (!activeListId || selectedItemsArray.length === 0) return

    const targetList = lists.find(l => l.id === activeListId)
    if (!targetList) return

    setImporting(true)
    setImportStatus('Adding selected items...')
    
    try {
      const addedItemIds = []
      const itemsToCreate = []

      for (const tmdbItem of selectedItemsArray) {
        const isGame = typeFilter === 'game'
        const itemIdStr = tmdbItem.id.toString()
        const existing = watchlistItems.find(w => 
          w.type === typeFilter && 
          (isGame ? w.id === itemIdStr || w.tmdb_id === itemIdStr : w.tmdb_id === itemIdStr)
        )

        if (existing) {
          addedItemIds.push(existing.id)
          if (onUpdateItem && (existing.status === 'planned' || !existing.status)) {
            onUpdateItem(existing.id, { status: 'list_only' })
          }
        } else {
          const releaseDate = tmdbItem.release_date || tmdbItem.first_air_date || ''
          const releaseYear = releaseDate ? releaseDate.split('-')[0] : (tmdbItem.release_year || '')
          
          const getCountryCode = () => {
            if (tmdbItem.origin_country && Array.isArray(tmdbItem.origin_country) && tmdbItem.origin_country.length > 0) {
              return tmdbItem.origin_country[0]
            }
            return 'US'
          }

          itemsToCreate.push({
            title: tmdbItem.title || tmdbItem.name,
            type: typeFilter,
            tmdb_id: itemIdStr,
            poster_path: tmdbItem.poster_path || tmdbItem.cover_path || '',
            release_year: releaseYear.toString(),
            status: 'list_only',
            country: getCountryCode(),
            original_language: tmdbItem.original_language || 'en',
            review: ''
          })
        }
      }

      if (itemsToCreate.length > 0) {
        if (onAddItems) {
          const createdItems = await onAddItems(itemsToCreate)
          if (createdItems && createdItems.length > 0) {
            addedItemIds.push(...createdItems.map(i => i.id))
          }
        } else if (onAddItem) {
          for (const item of itemsToCreate) {
            const created = await onAddItem(item)
            if (created && created.id) {
              addedItemIds.push(created.id)
            }
          }
        }
      }

      const finalItemIds = Array.from(new Set([...targetList.item_ids, ...addedItemIds]))

      if (isCloud && !activeListId.startsWith('local_list_')) {
        await updateFirebaseListItems(activeListId, finalItemIds)
      } else {
        const localListsRaw = localStorage.getItem('local_custom_lists')
        if (localListsRaw) {
          const parsed = JSON.parse(localListsRaw)
          const updated = parsed.map(list => 
            list.id === activeListId ? { ...list, item_ids: finalItemIds } : list
          )
          localStorage.setItem('local_custom_lists', JSON.stringify(updated))
        }
      }

      setLists(prev => prev.map(list => 
        list.id === activeListId ? { ...list, item_ids: finalItemIds } : list
      ))

      setSelectedPopupItems({})
      setShowAddPopup(false)
      setPopupSearchQuery('')
      setPopupSearchResults([])
      setError('')
    } catch (err) {
      console.error('Failed to add items to list:', err)
      setError('Could not add selected items to list.')
    } finally {
      setImporting(false)
      setImportStatus('')
    }
  }

  // Filter items in active list by search query
  const filteredListItems = rawListItems.filter(item => 
    item.title.toLowerCase().includes(listSearchQuery.toLowerCase())
  )

  // Sort items in active list
  const sortedListItems = [...filteredListItems].sort((a, b) => {
    if (listSortBy === 'release_year') {
      return parseInt(b.release_year || 0) - parseInt(a.release_year || 0)
    }
    if (listSortBy === 'vote_average') {
      return (b.vote_average || 0) - (a.vote_average || 0)
    }
    if (listSortBy === 'popularity') {
      return (b.popularity || 0) - (a.popularity || 0)
    }
    if (listSortBy === 'title') {
      return a.title.localeCompare(b.title)
    }
    if (listSortBy === 'newest_added') {
      const idxA = activeList.item_ids.indexOf(a.id)
      const idxB = activeList.item_ids.indexOf(b.id)
      return idxB - idxA
    }
    return 0
  })

  // Find candidate items that are of the correct type and NOT in the active list already
  const candidateItems = watchlistItems
    .filter(item => item.type === typeFilter)
    .filter(item => activeList ? !activeList.item_ids.includes(item.id) : true)

  const getTypeLabel = () => {
    if (typeFilter === 'movie') return 'Movie'
    if (typeFilter === 'tv') return 'TV Show'
    return 'Game'
  }

  const getTypeLabelPlural = () => {
    if (typeFilter === 'movie') return 'Movies'
    if (typeFilter === 'tv') return 'TV Shows'
    return 'Games'
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <span className="w-8 h-8 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin mb-3" />
        <p className="text-xs">Loading custom lists...</p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {error && (
        <div className="p-3.5 bg-rose-950/40 border border-rose-500/30 text-rose-300 rounded-xl mb-6 text-xs flex items-center gap-2 max-w-xl">
          <Info className="w-4 h-4 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-rose-400 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
      )}

      {activeList ? (
        /* =================== DETAILED VIEW OF ACTIVE LIST =================== */
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="relative w-full h-48 md:h-64 rounded-2xl overflow-hidden shadow-2xl bg-slate-950">
            {/* Banner Image */}
            {activeList.banner_url || activeList.thumbnail_url ? (
              <img 
                src={activeList.banner_url || activeList.thumbnail_url} 
                alt="" 
                className="w-full h-full object-cover opacity-95" 
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-violet-950/20 via-slate-900 to-indigo-950/20 opacity-85" />
            )}
            
            {/* Bottom Fade Mask (Faded in below) */}
            <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
            
            {/* Content overlay */}
            <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <button 
                  onClick={() => { setActiveListId(null); setError(''); }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-400 hover:text-violet-300 transition-colors mb-2.5 w-max cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Back to Custom Lists
                </button>
                <h2 className="text-xl md:text-3xl font-black text-white drop-shadow-md flex items-center gap-2">
                  {activeList.name}
                </h2>
                {activeList.description && (
                  <p className="text-xs text-slate-350 mt-1 max-w-2xl drop-shadow-sm italic font-medium">
                    {activeList.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 self-start md:self-end">
                {isDeleteMode ? (
                  <>
                    <button
                      onClick={() => handleRemoveItems(selectedDeleteIds)}
                      disabled={selectedDeleteIds.length === 0}
                      className="px-3.5 py-2 bg-rose-650 hover:bg-rose-600 disabled:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5 border border-rose-500/20"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove ({selectedDeleteIds.length})
                    </button>
                    <button
                      onClick={() => {
                        setIsDeleteMode(false);
                        setSelectedDeleteIds([]);
                      }}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all border border-slate-700/60 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    {/* Add Items (+) Button */}
                    <button
                      onClick={() => setShowAddPopup(true)}
                      className="p-2.5 bg-violet-650 hover:bg-violet-600 text-white rounded-xl transition-all shadow-lg shadow-violet-650/25 border border-violet-500/35 cursor-pointer flex items-center justify-center"
                      title="Add Items"
                    >
                      <Plus className="w-4 h-4" />
                    </button>

                    {/* Delete Logo (Trash) Button */}
                    <button
                      onClick={() => {
                        setIsDeleteMode(true);
                        setSelectedDeleteIds([]);
                      }}
                      className="p-2.5 bg-slate-900/60 hover:bg-slate-800 border border-slate-700/45 text-slate-350 hover:text-rose-455 hover:border-rose-500/30 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center"
                      title="Remove Items"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Settings Button */}
                    <button
                      onClick={handleOpenEditModal}
                      className="p-2.5 bg-slate-900/60 hover:bg-slate-800 border border-slate-700/45 text-slate-350 hover:text-white rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center"
                      title="List Settings"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Add item control bar */}

          {/* Controls Bar (Search, Fade Watched, Filter/Sort) */}
          <div className="flex items-center justify-between gap-4 mt-6 mb-4 pb-2 border-b border-slate-900">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Items in this List ({sortedListItems.length})
            </h3>
            
            <div className="flex items-center gap-2">
              {/* Search input inside list */}
              <input
                type="text"
                placeholder="Search in list..."
                value={listSearchQuery}
                onChange={(e) => setListSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-800 focus:border-violet-500 focus:outline-none rounded-none px-3 py-1.5 text-xs text-white placeholder-slate-550 w-32 sm:w-48 transition-colors"
              />

              {/* Fade Watched Toggle Button */}
              <button
                onClick={() => setFadeWatched(!fadeWatched)}
                className={`flex items-center justify-center w-8 h-8 border text-xs font-semibold cursor-pointer transition-all ${
                  fadeWatched
                    ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
                title={fadeWatched ? "Show Watched Normally" : "Fade Watched"}
              >
                <Eye className="w-3.5 h-3.5" />
              </button>

              {/* Filter / Sort Button */}
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setShowListFilterDropdown(!showListFilterDropdown)}
                  className={`flex items-center justify-center w-8 h-8 border text-xs font-semibold cursor-pointer transition-all ${
                    showListFilterDropdown
                      ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                  title="Sort List"
                >
                  <Filter className="w-3.5 h-3.5" />
                </button>

                {showListFilterDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-none p-3 shadow-xl z-30 space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Sort By
                      </label>
                      <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-none px-2 py-1">
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                        <select
                          value={listSortBy}
                          onChange={(e) => { setListSortBy(e.target.value); setShowListFilterDropdown(false); }}
                          className="bg-transparent border-none text-xs text-slate-300 focus:outline-none cursor-pointer w-full pr-1"
                        >
                          <option value="newest_added" className="bg-slate-950 text-slate-300">Newest Added</option>
                          <option value="release_year" className="bg-slate-950 text-slate-300">Release Year</option>
                          <option value="vote_average" className="bg-slate-950 text-slate-300">IMDb Rating</option>
                          <option value="popularity" className="bg-slate-950 text-slate-300">Popularity</option>
                          <option value="title" className="bg-slate-950 text-slate-300">Title (A-Z)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            {rawListItems.length > 0 ? (
              sortedListItems.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-6">
                  {sortedListItems.map(item => {
                    const isWatched = item.status === 'completed'
                    const statusInfo = getStatusLabelAndStyle(item.status, item.type)
                    const isDeletingSelected = selectedDeleteIds.includes(item.id)
                    return (
                      <div 
                        key={item.id}
                        onClick={() => {
                          if (isDeleteMode) {
                            setSelectedDeleteIds(prev => 
                              prev.includes(item.id) 
                                ? prev.filter(id => id !== item.id) 
                                : [...prev, item.id]
                            )
                          }
                        }}
                        className={`group relative bg-slate-900/30 border rounded-xl overflow-hidden shadow-lg transition-all duration-300 ${
                          isDeleteMode 
                            ? isDeletingSelected
                              ? 'border-rose-500 ring-2 ring-rose-500/20'
                              : 'border-slate-800 hover:border-rose-500/40'
                            : 'border-slate-800 hover:border-slate-700/50'
                        } ${
                          fadeWatched && isWatched && !isDeleteMode ? 'opacity-35 grayscale scale-95 hover:opacity-90 hover:grayscale-0 hover:scale-100' : ''
                        }`}
                      >
                        <div 
                          className="aspect-[2/3] w-full relative overflow-hidden bg-slate-950 cursor-pointer"
                          onClick={() => {
                            if (isDeleteMode) {
                              setSelectedDeleteIds(prev => 
                                prev.includes(item.id) 
                                  ? prev.filter(id => id !== item.id) 
                                  : [...prev, item.id]
                              )
                            } else {
                              onItemClick && onItemClick(item)
                            }
                          }}
                        >
                          <img
                            src={getPosterUrl(item.poster_path)}
                            alt={item.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                          />
                          {statusInfo && !isDeleteMode && (
                            <div className={`absolute inset-x-0 bottom-0 backdrop-blur-md border-t text-[11px] font-bold py-1 px-2 flex items-center justify-center gap-1 ${statusInfo.containerStyle}`}>
                              <Check className={`w-3.5 h-3.5 ${statusInfo.iconColor}`} />
                              <span>{statusInfo.label}</span>
                            </div>
                          )}

                          {isDeleteMode && (
                            <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[1px] flex items-center justify-center">
                              <div className="p-2 rounded-full bg-slate-900 border border-slate-700 shadow-md">
                                {isDeletingSelected ? (
                                  <CheckSquare className="w-6 h-6 text-rose-500 fill-rose-500/20" />
                                ) : (
                                  <Square className="w-6 h-6 text-slate-400" />
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-16 text-slate-500">
                  No items matched your search query.
                </div>
              )
            ) : (
              <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl max-w-sm mx-auto">
                <FolderOpen className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                <h4 className="text-slate-400 font-bold text-xs">This list is empty</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Add items using your watchlist or the explorer view.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* =================== LIST DIRECTORY VIEW =================== */
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            
            {/* Create New List Box */}
            <div 
              onClick={() => setShowCreateModal(true)}
              className="group border-2 border-dashed border-slate-800 hover:border-violet-600/40 bg-slate-900/10 hover:bg-violet-950/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 aspect-[19/9]"
            >
              <Plus className="w-6 h-6 text-slate-500 group-hover:text-violet-400 mb-1 transition-colors" />
              <span className="font-bold text-xs text-slate-400 group-hover:text-white transition-colors">
                Create Custom List
              </span>
            </div>

            {/* Custom Lists Cards */}
            {lists.map(list => {
              const mappedItems = getListItems(list.item_ids)
              const fakeLikes = Math.round((list.name.length * 3) % 45) + 5
              return (
                <div 
                  key={list.id}
                  onClick={() => setActiveListId(list.id)}
                  className="group flex flex-col cursor-pointer transition-all duration-300"
                >
                  {/* Landscape Image */}
                  <div className="aspect-[19/9] w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-md relative">
                    {list.thumbnail_url || list.banner_url ? (
                      <img 
                        src={list.thumbnail_url || list.banner_url} 
                        alt="" 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" 
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-violet-950/20 via-slate-900 to-indigo-950/20 flex items-center justify-center border border-slate-800/40 group-hover:from-violet-950/30 group-hover:to-indigo-950/30 transition-all duration-500">
                        <Folder className="w-8 h-8 text-slate-650 group-hover:text-violet-500/70 transition-colors" />
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-[14px] text-slate-200 line-clamp-1 mt-2.5 group-hover:text-white transition-colors">
                    {list.name}
                  </h3>
                </div>
              )
            })}

          </div>

          {/* Empty Directory State */}
          {lists.length === 0 && (
            <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl max-w-sm mx-auto mt-6">
              <FolderPlus className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <h3 className="font-bold text-slate-400 mb-1">No custom lists created</h3>
              <p className="text-xs text-slate-500">Create your first custom category using the card above.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal for creating a new list */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <form onSubmit={handleCreateList} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <h3 className="text-xl font-bold text-white mb-1">
              Create Custom List
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Organize your tracked {getTypeLabelPlural().toLowerCase()} into a custom category or collection.
            </p>

            <div className="space-y-4">
              {importing ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-400">
                  <div className="w-10 h-10 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
                  <span className="text-xs font-semibold text-slate-300 animate-pulse text-center">
                    {importStatus}
                  </span>
                </div>
              ) : (
                <>
                  {error && (
                    <div className="text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-xl">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      List Name
                    </label>
                    <input
                      type="text"
                      required
                      disabled={importing}
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      placeholder="e.g. My Favorite Movies"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      rows="3"
                      disabled={importing}
                      value={newListDesc}
                      onChange={(e) => setNewListDesc(e.target.value)}
                      placeholder="Describe what's in this list..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-violet-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Poster/Thumbnail Image Link (Optional)
                    </label>
                    <input
                      type="url"
                      disabled={importing}
                      value={newThumbnailUrl}
                      onChange={(e) => setNewThumbnailUrl(e.target.value)}
                      placeholder="e.g. https://example.com/cover.jpg (19:9 ratio)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Banner Image Link (Optional)
                    </label>
                    <input
                      type="url"
                      disabled={importing}
                      value={newBannerUrl}
                      onChange={(e) => setNewBannerUrl(e.target.value)}
                      placeholder="e.g. https://example.com/banner.jpg"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  {typeFilter === 'movie' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                        <span>Import from Letterboxd URL (Optional)</span>
                        <span className="text-[10px] text-violet-400 font-bold tracking-normal normal-case">public lists only</span>
                      </label>
                      <input
                        type="url"
                        disabled={importing}
                        value={letterboxdUrl}
                        onChange={(e) => setLetterboxdUrl(e.target.value)}
                        placeholder="e.g. https://letterboxd.com/username/list/list-name/"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-violet-500"
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                disabled={importing}
                onClick={() => { setShowCreateModal(false); setNewListName(''); setNewListDesc(''); setLetterboxdUrl(''); setError(''); }}
                className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 font-semibold py-2.5 rounded-xl text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={importing || !newListName.trim()}
                className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {importing ? 'Importing...' : 'Create List'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal for editing a list */}
      {showEditModal && activeList && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <form onSubmit={handleSaveEditList} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full max-h-[85vh] md:max-h-[90vh] flex flex-col shadow-2xl relative">
            <h3 className="text-xl font-bold text-white mb-1">
              List Settings
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Update list details, cover photo, banner image, or delete this list.
            </p>

            <div className="space-y-4 overflow-y-auto pr-1 flex-grow scrollbar-thin mb-2">
              {importing ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-400">
                  <div className="w-10 h-10 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
                  <span className="text-xs font-semibold text-slate-300 animate-pulse text-center">
                    {importStatus}
                  </span>
                </div>
              ) : (
                <>
                  {error && (
                    <div className="text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-xl">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      List Name
                    </label>
                    <input
                      type="text"
                      required
                      disabled={importing}
                      value={editListName}
                      onChange={(e) => setEditListName(e.target.value)}
                      placeholder="e.g. My Favorite Movies"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      rows="3"
                      disabled={importing}
                      value={editListDesc}
                      onChange={(e) => setEditListDesc(e.target.value)}
                      placeholder="Describe what's in this list..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-violet-500 resize-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Poster/Thumbnail Image Link (Optional)
                      </label>
                      <button
                        type="button"
                        onClick={() => handleOpenImagePicker('thumbnail')}
                        className="text-violet-400 hover:text-violet-300 flex items-center gap-1 text-[11px] font-bold transition-colors cursor-pointer"
                        title="Choose from list items"
                      >
                        <Info className="w-3.5 h-3.5" /> Choose from items
                      </button>
                    </div>
                    <input
                      type="url"
                      disabled={importing}
                      value={editThumbnailUrl}
                      onChange={(e) => setEditThumbnailUrl(e.target.value)}
                      placeholder="e.g. https://example.com/cover.jpg (19:9 ratio)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Banner Image Link (Optional)
                      </label>
                      <button
                        type="button"
                        onClick={() => handleOpenImagePicker('banner')}
                        className="text-violet-400 hover:text-violet-300 flex items-center gap-1 text-[11px] font-bold transition-colors cursor-pointer"
                        title="Choose from list items"
                      >
                        <Info className="w-3.5 h-3.5" /> Choose from items
                      </button>
                    </div>
                    <input
                      type="url"
                      disabled={importing}
                      value={editBannerUrl}
                      onChange={(e) => setEditBannerUrl(e.target.value)}
                      placeholder="e.g. https://example.com/banner.jpg"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  {typeFilter === 'movie' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                        <span>Import & Merge from Letterboxd (Optional)</span>
                        <span className="text-[10px] text-violet-400 font-bold tracking-normal normal-case">public lists only</span>
                      </label>
                      <input
                        type="url"
                        disabled={importing}
                        value={editLetterboxdUrl}
                        onChange={(e) => setEditLetterboxdUrl(e.target.value)}
                        placeholder="e.g. https://letterboxd.com/username/list/list-name/"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-violet-500"
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col gap-3 mt-6">
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={importing}
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-350 font-semibold py-2.5 rounded-xl text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importing || !editListName.trim()}
                  className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center"
                >
                  {importing ? 'Importing...' : 'Save Changes'}
                </button>
              </div>

              <div className="pt-3 border-t border-slate-800 mt-1 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    handleDeleteList(activeList.id);
                  }}
                  className="w-full inline-flex items-center justify-center gap-1.5 bg-rose-950/40 hover:bg-rose-950/70 border border-rose-900/35 hover:border-rose-700/50 text-rose-450 hover:text-rose-350 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-md"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete List
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Image Picker Modal */}
      {showImagePicker && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowImagePicker(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">
              Select {imagePickerTarget === 'thumbnail' ? 'Poster/Thumbnail' : 'Banner'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Choose an image from the items in this list to set as the list {imagePickerTarget === 'thumbnail' ? 'cover' : 'banner'}.
            </p>

            {loadingPickerImages && pickerImages.length === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                <div className="w-10 h-10 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
                <span className="text-xs font-semibold text-slate-300 animate-pulse text-center">
                  Loading images from TMDB...
                </span>
              </div>
            ) : pickerImages.length === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center py-20 text-slate-500 text-center">
                <Info className="w-10 h-10 text-slate-700 mb-2" />
                <p className="text-sm font-semibold">No images found</p>
                <p className="text-xs mt-1">Make sure your list has items with poster links.</p>
              </div>
            ) : (
              <div className="flex-col flex flex-grow overflow-hidden">
                <div className="overflow-y-auto pr-1 flex-grow scrollbar-thin pb-4 space-y-6">
                  {/* Banners Section */}
                  {pickerImages.filter(img => img.type === 'banner').length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                        Banners / Backdrops
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {pickerImages.filter(img => img.type === 'banner').map((img, idx) => (
                          <div
                            key={`banner_${idx}`}
                            onClick={() => handleSelectImage(img.src)}
                            className="group/picker relative rounded-xl overflow-hidden border border-slate-800 hover:border-violet-500 bg-slate-950/60 aspect-[16/9] cursor-pointer transition-all duration-300 shadow-md hover:scale-[1.02]"
                          >
                            <img
                              src={img.src}
                              alt={img.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover/picker:scale-105"
                              loading="lazy"
                            />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent p-2 text-center">
                              <p className="text-[10px] font-bold text-slate-200 line-clamp-1">
                                {img.itemTitle}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Posters Section */}
                  {pickerImages.filter(img => img.type === 'poster').length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                        Posters
                      </h4>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                        {pickerImages.filter(img => img.type === 'poster').map((img, idx) => (
                          <div
                            key={`poster_${idx}`}
                            onClick={() => handleSelectImage(img.src)}
                            className="group/picker relative rounded-xl overflow-hidden border border-slate-800 hover:border-violet-500 bg-slate-950/60 aspect-[2/3] cursor-pointer transition-all duration-300 shadow-md hover:scale-[1.02]"
                          >
                            <img
                              src={img.src}
                              alt={img.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover/picker:scale-105"
                              loading="lazy"
                            />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent p-2 text-center">
                              <p className="text-[10px] font-bold text-slate-200 line-clamp-1">
                                {img.itemTitle}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {loadingPickerImages && (
                  <div className="py-2 text-center text-xs font-semibold text-violet-400 animate-pulse">
                    Loading backdrops...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Items Popup Modal */}
      {showAddPopup && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl relative animate-scale-up">
            <button
              type="button"
              onClick={() => {
                setShowAddPopup(false);
                setPopupSearchQuery('');
                setPopupSearchResults([]);
                setSelectedPopupItems({});
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1">
              Add Items to {activeList.name}
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Search TMDB to find and select multiple {getTypeLabelPlural().toLowerCase()} to add to this list.
            </p>

            {/* Search Input Area */}
            <div className="mb-6">
              <input
                type="text"
                value={popupSearchQuery}
                onChange={(e) => handlePopupSearch(e.target.value)}
                placeholder={`Search for ${getTypeLabelPlural().toLowerCase()}...`}
                className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-550 transition-colors"
              />
            </div>

            {/* Results Grid */}
            <div className="flex-grow overflow-y-auto pr-1 scrollbar-thin pb-4">
              {searchingPopup ? (
                <div className="h-48 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <div className="w-8 h-8 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
                  <span className="text-xs font-semibold text-slate-355 animate-pulse">
                    Searching TMDB...
                  </span>
                </div>
              ) : popupSearchResults.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-slate-500 text-center">
                  <FolderOpen className="w-10 h-10 text-slate-700 mb-2" />
                  <p className="text-sm font-semibold">No results found</p>
                  <p className="text-xs mt-1">Try searching for a different title.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {popupSearchResults.map((item) => {
                    const isAlreadyInList = activeList && rawListItems.some(li => li.tmdb_id === item.id.toString())
                    const isSelected = !!selectedPopupItems[item.id]
                    const cardImage = getPosterUrl(item.poster_path || item.cover_path)
                    const releaseDate = item.release_date || item.first_air_date || ''
                    const releaseYear = releaseDate ? releaseDate.split('-')[0] : (item.release_year || 'N/A')

                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (isAlreadyInList) return
                          setSelectedPopupItems(prev => {
                            const next = { ...prev }
                            if (isSelected) {
                              delete next[item.id]
                            } else {
                              next[item.id] = item
                            }
                            return next
                          })
                        }}
                        className={`group/item relative bg-slate-950/40 border rounded-xl overflow-hidden shadow-md transition-all duration-300 flex flex-col h-full cursor-pointer select-none ${
                          isAlreadyInList
                            ? 'opacity-40 border-slate-900 cursor-not-allowed'
                            : isSelected
                            ? 'border-violet-500 ring-2 ring-violet-500/20'
                            : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Poster Image */}
                        <div className="aspect-[2/3] w-full bg-slate-950 relative overflow-hidden">
                          <img
                            src={cardImage}
                            alt={item.title || item.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover/item:scale-105"
                            loading="lazy"
                          />

                          {/* Selection Overlay */}
                          {!isAlreadyInList && (
                            <div className="absolute top-2 right-2 z-10">
                              <div className={`p-1.5 rounded-full border shadow-md transition-colors ${
                                isSelected 
                                  ? 'bg-violet-600 border-violet-500 text-white' 
                                  : 'bg-slate-950/80 border-slate-700 text-slate-400 group-hover/item:text-slate-200'
                              }`}>
                                <Check className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          )}

                          {/* Already in list label */}
                          {isAlreadyInList && (
                            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[1px] flex items-center justify-center p-2 text-center">
                              <span className="text-[10px] font-black uppercase px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 tracking-wider">
                                Already In List
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Title Info */}
                        <div className="p-2.5 flex-grow flex flex-col justify-between bg-slate-900/60">
                          <div>
                            <h4 className="font-semibold text-xs text-slate-200 line-clamp-1 group-hover/item:text-violet-400 transition-colors">
                              {item.title || item.name}
                            </h4>
                            <p className="text-[10px] text-slate-500 mt-0.5">{releaseYear}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex gap-3 mt-6 border-t border-slate-800/60 pt-4 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowAddPopup(false);
                  setPopupSearchQuery('');
                  setPopupSearchResults([]);
                  setSelectedPopupItems({});
                }}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-350 font-semibold py-2.5 rounded-xl text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={importing || Object.keys(selectedPopupItems).length === 0}
                onClick={() => handleAddItemsToList(Object.values(selectedPopupItems))}
                className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {importing ? 'Adding...' : `Add Selected (${Object.keys(selectedPopupItems).length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
