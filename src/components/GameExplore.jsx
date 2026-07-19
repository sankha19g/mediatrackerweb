import React, { useState, useEffect } from 'react'
import { Search, Gamepad, Plus, Check, Star, PlusCircle, ArrowLeft } from 'lucide-react'
import { searchGames, getPosterUrl } from '../lib/tmdb'

export default function GameExplore({ watchedItems, onAddItem, onRemoveItem }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [addingItem, setAddingItem] = useState(null)
  
  // Custom Game Form States
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customTitle, setCustomTitle] = useState('')
  const [customYear, setCustomYear] = useState('')
  const [customRating, setCustomRating] = useState(8)
  const [customStatus, setCustomStatus] = useState('completed')
  const [customReview, setCustomReview] = useState('')

  // Add Item Dialog States
  const [userRating, setUserRating] = useState(8)
  const [userReview, setUserReview] = useState('')
  const [userStatus, setUserStatus] = useState('completed')

  useEffect(() => {
    const loadGames = async () => {
      setLoading(true)
      const games = await searchGames(query)
      setResults(games)
      setLoading(false)
    }
    loadGames()
  }, [query])

  const openAddDialog = (game) => {
    setAddingItem(game)
    setUserRating(8)
    setUserReview('')
    setUserStatus('completed')
  }

  const handleAddConfirm = () => {
    if (!addingItem) return

    // Derive country for default games
    const title = (addingItem.title || '').toLowerCase()
    let country = 'Unknown'
    if (title.includes('witcher') || title.includes('cyberpunk')) country = 'Poland'
    else if (title.includes('elden ring') || title.includes('zelda') || title.includes('breath of the wild')) country = 'Japan'
    else if (title.includes('grand theft auto') || title.includes('hades') || title.includes('god of war') || title.includes('red dead')) country = 'United States'

    const newItem = {
      title: addingItem.title,
      type: 'game',
      tmdb_id: addingItem.id, // For games, id is g1, g2 etc.
      poster_path: addingItem.poster_path,
      rating: userRating,
      review: userReview.trim(),
      release_year: addingItem.release_date.split('-')[0],
      status: userStatus,
      country: country
    }

    onAddItem(newItem)
    setAddingItem(null)
  }

  const handleCustomAddSubmit = (e) => {
    e.preventDefault()
    if (!customTitle.trim()) return

    const newItem = {
      title: customTitle.trim(),
      type: 'game',
      tmdb_id: `custom_${Date.now()}`,
      poster_path: 'https://images.unsplash.com/photo-1538481199705-c750c4e965fc?w=500&q=80', // Beautiful controller picture as custom game cover
      rating: customRating,
      review: customReview.trim(),
      release_year: customYear.trim() || new Date().getFullYear().toString(),
      status: customStatus,
      country: 'Unknown'
    }

    onAddItem(newItem)
    
    // Reset Form
    setCustomTitle('')
    setCustomYear('')
    setCustomRating(8)
    setCustomStatus('completed')
    setCustomReview('')
    setShowCustomForm(false)
  }

  const getWatchedInstance = (game) => {
    return watchedItems.find(
      (wi) => wi.type === 'game' && wi.tmdb_id === game.id
    )
  }

  return (
    <div className="py-6 px-4">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            Explore & Log Games
          </h1>
          <p className="text-slate-400 text-sm">
            Search our curated library of top games or manually register custom games in your log.
          </p>
        </div>

        {!showCustomForm && (
          <button
            onClick={() => setShowCustomForm(true)}
            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all transform active:scale-95 shadow-md border border-slate-700 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-violet-400" />
            Add Custom Game
          </button>
        )}
      </div>

      {showCustomForm ? (
        /* Custom Game Input Form */
        <div className="max-w-xl mx-auto bg-slate-900/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl relative">
          <button
            onClick={() => setShowCustomForm(false)}
            className="absolute top-4 left-4 p-2 rounded-lg bg-slate-950/40 text-slate-400 hover:text-white hover:bg-slate-950/80 transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Search
          </button>
          
          <div className="text-center mb-6 mt-4">
            <Gamepad className="w-10 h-10 text-violet-500 mx-auto mb-2" />
            <h2 className="text-xl font-bold text-white">Add Custom Game Entry</h2>
            <p className="text-xs text-slate-400">Perfect for indie games, retro games, or entries not in our list.</p>
          </div>

          <form onSubmit={handleCustomAddSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Game Title *
              </label>
              <input
                type="text"
                required
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. Witcher 3, Half-Life 2..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Release Year
                </label>
                <input
                  type="text"
                  maxLength="4"
                  value={customYear}
                  onChange={(e) => setCustomYear(e.target.value)}
                  placeholder="e.g. 2015"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Status
                </label>
                <select
                  value={customStatus}
                  onChange={(e) => setCustomStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-violet-500"
                >
                  <option value="completed">Completed (Beaten)</option>
                  <option value="watching">Playing Now</option>
                  <option value="pending">Pending</option>
                  <option value="planned">Planned (Watchlist)</option>
                  <option value="backlog">Planned (Backlog)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Rating</span>
                <span className="text-violet-400 font-bold">{customRating}/10</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={customRating}
                onChange={(e) => setCustomRating(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Your Review / Notes
              </label>
              <textarea
                rows="3"
                value={customReview}
                onChange={(e) => setCustomReview(e.target.value)}
                placeholder="Write your rating notes here..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-3 rounded-xl shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              Add Game to Log
            </button>
          </form>
        </div>
      ) : (
        /* Curated Search Interface */
        <>
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search popular video games..."
                className="w-full bg-slate-900/50 border border-slate-800 focus:border-violet-500 focus:outline-none rounded-2xl pl-12 pr-4 py-4 text-white text-lg placeholder-slate-500 transition-all shadow-xl"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
              <span className="w-10 h-10 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin mb-3" />
              <span>Loading games database...</span>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-6">
              {results.map((game) => {
                const watched = getWatchedInstance(game)
                const releaseYear = game.release_date.split('-')[0]

                return (
                  <div 
                    key={game.id}
                    className="group relative bg-slate-900/40 border border-slate-800 hover:border-slate-700/60 rounded-xl overflow-hidden shadow-lg transition-all duration-300 flex flex-col h-full"
                  >
                    <div className="aspect-[2/3] w-full relative overflow-hidden bg-slate-950">
                      <img
                        src={getPosterUrl(game.poster_path)}
                        alt={game.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                        <p className="text-xs text-slate-300 line-clamp-4 mb-3">
                          {game.overview}
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-4 border-t border-slate-800 pt-2">
                          <span className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            {game.vote_average.toFixed(1)}/10
                          </span>
                          <span>{game.genre_ids.join(', ')}</span>
                        </div>
                      </div>

                      {watched && (
                        <div className="absolute top-2 right-2 bg-emerald-500/90 backdrop-blur text-white p-1.5 rounded-lg shadow-lg border border-emerald-400/20">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <div className="p-3.5 flex flex-col justify-between flex-grow">
                      <h3 className="font-semibold text-sm text-slate-200 line-clamp-1 group-hover:text-white transition-colors mb-1">
                        {game.title}
                      </h3>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-[11px] text-slate-500 font-medium">
                          {releaseYear}
                        </span>
                        {watched ? (
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete "${game.title}"?`)) {
                                onRemoveItem(watched.id)
                              }
                            }}
                            className="text-[11px] text-rose-400 hover:text-rose-300 transition-colors font-medium border border-rose-950 hover:bg-rose-950/20 px-2 py-1 rounded cursor-pointer"
                          >
                            Remove
                          </button>
                        ) : (
                          <button
                            onClick={() => openAddDialog(game)}
                            className="bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-bold px-2 py-1 rounded flex items-center gap-1 shadow-md active:scale-95 transition-all cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            Logged
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="text-center py-24 text-slate-500">
              <Gamepad className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <h3 className="font-bold text-slate-400 mb-1">No games found</h3>
              <p className="text-sm">Try typing different search terms or use the 'Add Custom Game' button above.</p>
            </div>
          )}
        </>
      )}

      {/* Adding Configuration Modal */}
      {addingItem && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <h3 className="text-xl font-bold text-white mb-2">
              Log Watched Game
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Customize your rating and optional review for <strong className="text-slate-200">{addingItem.title}</strong>.
            </p>

            <div className="space-y-4">
              {/* Rating Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Your Rating</span>
                  <span className="text-violet-400 font-bold">{userRating}/10</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={userRating}
                  onChange={(e) => setUserRating(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-violet-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>1 (Terrible)</span>
                  <span>5 (Average)</span>
                  <span>10 (Masterpiece)</span>
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Play Status
                </label>
                <select
                  value={userStatus}
                  onChange={(e) => setUserStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500"
                >
                  <option value="completed">Completed (Beaten)</option>
                  <option value="watching">Playing Now</option>
                  <option value="pending">Pending</option>
                  <option value="planned">Planned (Watchlist)</option>
                  <option value="backlog">Planned (Backlog)</option>
                </select>
              </div>

              {/* Review / Note textarea */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Review or Personal Notes
                </label>
                <textarea
                  rows="3"
                  value={userReview}
                  onChange={(e) => setUserReview(e.target.value)}
                  placeholder="What did you think of it? Write down your comments..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>
            </div>

            {/* Confirmation Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setAddingItem(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl text-sm transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddConfirm}
                className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add to List
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
