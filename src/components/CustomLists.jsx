import React, { useState, useEffect } from 'react'
import { FolderPlus, Folder, Plus, X, ChevronLeft, Trash2, PlusCircle, FolderOpen, Film, Tv, Gamepad, Info } from 'lucide-react'
import { isFirebaseConfigured, loadFirebaseLists, addFirebaseList, updateFirebaseListItems, deleteFirebaseList } from '../lib/firebase'
import { getPosterUrl } from '../lib/tmdb'

export default function CustomLists({ typeFilter, user, watchlistItems, onItemClick }) {
  const [lists, setLists] = useState([])
  const [activeListId, setActiveListId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [newListDesc, setNewListDesc] = useState('')
  const [selectedItemId, setSelectedItemId] = useState('')
  const [error, setError] = useState('')
  
  const isCloud = isFirebaseConfigured() && user

  // Load lists on mount/type change/user change
  useEffect(() => {
    fetchLists()
  }, [typeFilter, user])

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

    try {
      if (isCloud) {
        const newList = await addFirebaseList(user.uid, newListName.trim(), newListDesc.trim(), typeFilter)
        setLists(prev => [newList, ...prev])
      } else {
        const localId = `local_list_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const newList = {
          id: localId,
          user_id: 'local',
          name: newListName.trim(),
          description: newListDesc.trim(),
          type: typeFilter,
          item_ids: [],
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
      setShowCreateModal(false)
    } catch (err) {
      console.error('Failed to create list:', err)
      setError('Could not create list.')
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
          {/* List Header controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
            <div>
              <button 
                onClick={() => { setActiveListId(null); setError(''); }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-400 hover:text-violet-300 transition-colors mb-3 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Custom Lists
              </button>
              <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
                <FolderOpen className="w-6 h-6 text-violet-400" />
                {activeList.name}
              </h2>
              {activeList.description && (
                <p className="text-xs text-slate-400 mt-1 max-w-xl italic">
                  {activeList.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleDeleteList(activeList.id)}
                className="inline-flex items-center gap-1.5 bg-rose-950/30 hover:bg-rose-950/50 border border-rose-900/30 text-rose-400 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete List
              </button>
            </div>
          </div>

          {/* Add item control bar */}
          <div className="bg-slate-900/20 border border-slate-850 p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-3 max-w-2xl">
            <div className="flex-1 w-full">
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-350 focus:outline-none focus:border-violet-500"
              >
                <option value="">-- Choose logged {getTypeLabel().toLowerCase()} to add --</option>
                {candidateItems.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.title} ({item.release_year || 'N/A'})
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAddItem}
              disabled={!selectedItemId}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-violet-850 disabled:to-indigo-900 text-white font-semibold py-2 px-4 rounded-xl text-xs transition-all cursor-pointer shadow-md"
            >
              <PlusCircle className="w-4 h-4" />
              Add to List
            </button>
          </div>

          {/* Items in this list */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
              Items in this List ({getListItems(activeList.item_ids).length})
            </h3>

            {getListItems(activeList.item_ids).length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {getListItems(activeList.item_ids).map(item => (
                  <div 
                    key={item.id}
                    className="group relative bg-slate-900/30 border border-slate-800 hover:border-slate-700/50 rounded-xl overflow-hidden shadow-lg transition-all duration-300 flex flex-col h-full"
                  >
                    <div 
                      className="aspect-[2/3] w-full relative overflow-hidden bg-slate-950 cursor-pointer"
                      onClick={() => onItemClick && onItemClick(item)}
                    >
                      <img
                        src={getPosterUrl(item.poster_path)}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      
                      {/* Hover Overlay with delete button */}
                      <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3.5">
                        <div className="text-center pt-8">
                          <h4 className="font-bold text-white text-xs line-clamp-3">{item.title}</h4>
                          <span className="text-[10px] text-slate-400 block mt-1">{item.release_year || 'N/A'}</span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemoveItem(item.id); }}
                          className="w-full bg-rose-950/50 hover:bg-rose-950/80 border border-rose-900/30 hover:border-rose-700/50 text-rose-300 py-1.5 rounded-lg text-[10px] font-bold tracking-wide transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          Remove from List
                        </button>
                      </div>
                    </div>

                    <div className="p-3 flex-grow flex flex-col justify-between">
                      <h4 className="font-semibold text-xs text-slate-200 line-clamp-1 group-hover:text-white transition-colors">
                        {item.title}
                      </h4>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 border border-dashed border-slate-850 rounded-2xl max-w-sm mx-auto">
                <FolderOpen className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                <h4 className="text-slate-400 font-bold text-xs">This list is empty</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Choose an item from the log selector above to populate it.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* =================== LIST DIRECTORY VIEW =================== */
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            
            {/* Create New List Box */}
            <div 
              onClick={() => setShowCreateModal(true)}
              className="group border-2 border-dashed border-slate-800 hover:border-violet-600/40 bg-slate-900/10 hover:bg-violet-950/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 min-h-[180px]"
            >
              <div className="w-10 h-10 rounded-full bg-slate-850 group-hover:bg-violet-950 border border-slate-800 group-hover:border-violet-800/40 flex items-center justify-center text-slate-400 group-hover:text-violet-400 mb-3 transition-colors">
                <Plus className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-300 group-hover:text-white transition-colors">
                Create Custom List
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 max-w-[200px]">
                Create a custom category for your tracked {getTypeLabelPlural().toLowerCase()}.
              </p>
            </div>

            {/* Custom Lists Cards */}
            {lists.map(list => {
              const mappedItems = getListItems(list.item_ids)
              return (
                <div 
                  key={list.id}
                  onClick={() => setActiveListId(list.id)}
                  className="group bg-slate-900/30 border border-slate-800 hover:border-slate-700/50 rounded-2xl p-5 flex flex-col justify-between cursor-pointer transition-all duration-350 hover:shadow-lg relative overflow-hidden min-h-[180px]"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/5 rounded-full blur-2xl -z-10 group-hover:bg-violet-600/10 transition-colors" />
                  
                  <div>
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="p-2 rounded-xl bg-violet-650/10 border border-violet-800/20 text-violet-400">
                        <Folder className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-850 px-2 py-0.5 rounded border border-slate-800/80">
                        {mappedItems.length} {mappedItems.length === 1 ? getTypeLabel() : getTypeLabelPlural()}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-200 line-clamp-1 group-hover:text-white transition-colors">
                      {list.name}
                    </h3>
                    
                    {list.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1.5 italic">
                        {list.description}
                      </p>
                    )}
                  </div>

                  {/* Collage overlay of posters in the list */}
                  <div className="flex items-center gap-1 mt-4 pt-3 border-t border-slate-850/60">
                    {mappedItems.slice(0, 3).map((item, idx) => (
                      <div 
                        key={item.id} 
                        className="w-7 h-10 rounded overflow-hidden bg-slate-950 border border-slate-800 shadow-md transform transition-transform group-hover:translate-y-[-2px]"
                        style={{ zIndex: 10 - idx, marginLeft: idx > 0 ? '-10px' : '0px' }}
                      >
                        <img 
                          src={getPosterUrl(item.poster_path)} 
                          alt="" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    ))}
                    {mappedItems.length > 3 && (
                      <span className="text-[10px] text-slate-500 font-bold ml-1.5">
                        +{mappedItems.length - 3} more
                      </span>
                    )}
                    {mappedItems.length === 0 && (
                      <span className="text-[10px] text-slate-500 italic">
                        Empty list
                      </span>
                    )}
                  </div>
                </div>
              )
            })}

          </div>

          {/* Empty Directory State */}
          {lists.length === 0 && (
            <div className="text-center py-16 border border-dashed border-slate-850 rounded-2xl max-w-sm mx-auto mt-6">
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
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  List Name
                </label>
                <input
                  type="text"
                  required
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
                  value={newListDesc}
                  onChange={(e) => setNewListDesc(e.target.value)}
                  placeholder="Describe what's in this list..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => { setShowCreateModal(false); setNewListName(''); setNewListDesc(''); }}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                Create List
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
