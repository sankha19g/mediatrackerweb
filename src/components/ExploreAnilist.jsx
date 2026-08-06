import React, { useState, useEffect, useRef } from 'react'
import { Search, Flame, Sparkles, Trophy, Tv, Plus, Check, Star, Play, Info, ChevronLeft, ChevronRight, X, Calendar, Edit, MessageSquare, BookOpen, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { fetchAnilistDashboard, fetchAnilistBrowse } from '../lib/anilist'

// Sub-component for horizontal scrolling category rows
const CategoryRow = ({ title, icon: Icon, items, watchedItems, openAddDialog, navigate }) => {
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

  const getWatchedInstance = (item) => {
    return watchedItems.find(wi => wi.tmdb_id === item.tmdb_id && wi.status !== 'list_only')
  }

  if (!items || items.length === 0) return null

  return (
    <div className="mb-10 relative group/row">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2.5">
          {Icon && <Icon className="w-5 h-5 text-violet-400" />}
          <h2 className="text-xl font-bold text-white tracking-tight">
            {title}
          </h2>
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
        className="flex gap-4 overflow-x-auto scrollbar-none scroll-smooth pb-4 px-2 snap-x"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item) => {
          const watched = getWatchedInstance(item)

          return (
            <div
              key={item.id}
              className="flex-shrink-0 w-36 sm:w-44 md:w-48 group/card relative bg-slate-900/40 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 flex flex-col snap-start hover:-translate-y-1"
            >
              {/* Cover Image */}
              <div 
                className="aspect-[2/3] w-full relative overflow-hidden bg-slate-950 cursor-pointer"
                onClick={() => navigate(`/explore/${item.type}/${item.id}`)}
              >
                <img
                  src={item.poster_path}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                  loading="lazy"
                />



                {/* Watched Badge */}
                {watched && (
                  <div className="absolute top-2 right-2 bg-emerald-500/90 backdrop-blur text-white p-1 rounded-lg shadow-lg border border-emerald-400/20">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              {/* Title & Action */}
              <div className="p-3 flex flex-col justify-between flex-grow">
                <h3 
                  className="font-bold text-xs text-slate-200 line-clamp-2 group-hover/card:text-violet-400 transition-colors cursor-pointer"
                  onClick={() => navigate(`/explore/${item.type}/${item.id}`)}
                >
                  {item.title}
                </h3>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function ExploreAnilist({ watchedItems, onAddItem, onRemoveItem, user, query, setQuery }) {
  const navigate = useNavigate()
  const [dashboardData, setDashboardData] = useState(null)
  const [searchResults, setSearchResults] = useState([])
  const [searchPageInfo, setSearchPageInfo] = useState({ total: 0, currentPage: 1, hasNextPage: false })
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchActive, setSearchActive] = useState(false)
  const [page, setPage] = useState(1)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)

  // Dialog / Modal States
  const [addingItem, setAddingItem] = useState(null)
  const [userRating, setUserRating] = useState(8)
  const [userReview, setUserReview] = useState('')
  const [userStatus, setUserStatus] = useState('completed')

  // Load Dashboard Data
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchAnilistDashboard()
        setDashboardData(data)
      } catch (err) {
        console.error('Failed to load AniList Dashboard:', err)
        setError(err.message || 'Failed to connect to AniList. Please verify your connection.')
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [retryCount])

  // Trigger search when query or page changes
  useEffect(() => {
    if (!query.trim()) {
      setSearchActive(false)
      setSearchResults([])
      return
    }

    const delayDebounce = setTimeout(async () => {
      setSearchLoading(true)
      setSearchActive(true)
      setError(null)
      try {
        const data = await fetchAnilistBrowse({ search: query, page })
        setSearchResults(data.items)
        setSearchPageInfo(data.pageInfo)
      } catch (err) {
        console.error('Failed to search anime:', err)
        setError(err.message || 'Failed to search AniList catalog.')
      } finally {
        setSearchLoading(false)
      }
    }, 400)

    return () => clearTimeout(delayDebounce)
  }, [query, page])



  const openAddDialog = (item) => {
    setAddingItem(item)
    setUserRating(8)
    setUserReview('')
    setUserStatus('completed')
  }

  const handleAddConfirm = async () => {
    if (!addingItem) return

    const newItem = {
      ...addingItem,
      rating: userRating,
      review: userReview.trim(),
      status: userStatus
    }

    await onAddItem(newItem)
    setAddingItem(null)
  }

  const getWatchedInstance = (item) => {
    return watchedItems.find(wi => wi.tmdb_id === item.tmdb_id && wi.status !== 'list_only')
  }

  const handleRemoveClick = (item) => {
    const watched = getWatchedInstance(item)
    if (watched && window.confirm(`Remove "${item.title}" from watchlist?`)) {
      onRemoveItem(watched.id)
    }
  }

  // Hero banner item: first trending anime
  const heroItem = dashboardData?.trending?.[0]

  return (
    <div className="py-6 px-4">


      {loading ? (
        <div className="flex flex-col items-center justify-center py-36 text-slate-500 gap-3">
          <span className="w-10 h-10 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
          <p className="text-sm font-semibold">Loading AniList dashboard...</p>
        </div>
      ) : error && !searchActive ? (
        <div className="flex flex-col items-center justify-center py-36 text-slate-400 gap-4">
          <div className="text-rose-500 font-medium text-center max-w-md px-4">
            <p className="text-lg font-bold mb-2">Error Loading Dashboard</p>
            <p className="text-sm text-slate-550">{error}</p>
          </div>
          <button
            onClick={() => setRetryCount(prev => prev + 1)}
            className="bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 px-6 rounded-xl border border-slate-700 hover:border-slate-650 transition-all active:scale-95 cursor-pointer shadow-md text-sm"
          >
            Retry Connection
          </button>
        </div>
      ) : searchActive ? (
        // Search Results View
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-300">
              {searchLoading ? 'Searching...' : `Search Results for "${query}"`}
            </h2>
            {searchPageInfo.total > 0 && (
              <span className="text-xs font-semibold text-slate-550">
                Page {page} of {searchPageInfo.lastPage || 1} ({searchPageInfo.total} results)
              </span>
            )}
          </div>

          {searchLoading && searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-500">
              <span className="w-8 h-8 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin mb-3" />
              <p className="text-xs">Searching anime catalog...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {searchResults.map((item) => {
                  const watched = getWatchedInstance(item)

                  return (
                    <div
                      key={item.id}
                      className="group relative bg-slate-900/40 border border-slate-800 hover:border-slate-700/60 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 flex flex-col h-full hover:-translate-y-1"
                    >
                      <div 
                        className="aspect-[2/3] w-full relative overflow-hidden bg-slate-950 cursor-pointer"
                        onClick={() => navigate(`/explore/${item.type}/${item.id}`)}
                      >
                        <img
                          src={item.poster_path}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />


                        {watched && (
                          <div className="absolute top-2 right-2 bg-emerald-500/90 backdrop-blur text-white p-1.5 rounded-lg shadow-lg border border-emerald-400/20">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      <div className="p-4 flex flex-col justify-between flex-grow">
                        <h3 
                          className="font-bold text-sm text-slate-200 line-clamp-2 group-hover:text-violet-400 transition-colors cursor-pointer"
                          onClick={() => navigate(`/explore/${item.type}/${item.id}`)}
                        >
                          {item.title}
                        </h3>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Pagination Controls */}
              {searchPageInfo.hasNextPage || page > 1 ? (
                <div className="flex items-center justify-center gap-4 mt-12 pt-6 border-t border-slate-900">
                  <button
                    disabled={page === 1}
                    onClick={() => {
                      setPage(prev => Math.max(prev - 1, 1))
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-700 text-slate-200 font-semibold py-2.5 px-4 rounded-xl text-sm transition-all shadow-md cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <span className="text-sm font-semibold text-slate-400">
                    Page {page} of {searchPageInfo.lastPage || 1}
                  </span>
                  <button
                    disabled={!searchPageInfo.hasNextPage}
                    onClick={() => {
                      setPage(prev => prev + 1)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-700 text-slate-200 font-semibold py-2.5 px-4 rounded-xl text-sm transition-all shadow-md cursor-pointer"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="text-center py-24 text-slate-500">
              <Tv className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <h3 className="font-bold text-slate-400 mb-1">No anime found</h3>
              <p className="text-sm">Try typing different search terms or verify the spelling.</p>
            </div>
          )}
        </div>
      ) : (
        // Dashboard View (Trending Hero + Category Rows)
        <div className="animate-fade-in">
          {/* Hero Banner */}
          {heroItem && (
            <div className="relative mb-12 rounded-3xl overflow-hidden border border-slate-800/80 shadow-2xl h-[320px] sm:h-[450px] group/hero">
              {/* Hero Backdrop */}
              <div className="absolute inset-0 z-0">
                <img
                  src={heroItem.backdrop_path || heroItem.poster_path}
                  alt={heroItem.title}
                  className="w-full h-full object-cover object-center scale-100 group-hover/hero:scale-[1.02] transition-transform duration-700"
                />
                {/* Visual Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                <div className="absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-black via-black/80 to-transparent" />
              </div>

              {/* Hero Content */}
              <div className="absolute inset-0 z-10 flex flex-col justify-end p-6 sm:p-10 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 bg-violet-600/20 backdrop-blur-md border border-violet-500/30 text-violet-300 text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full mb-3 self-start">
                  <Flame className="w-3.5 h-3.5 fill-violet-400" />
                  #1 Trending Anime
                </div>

                <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-2 leading-tight drop-shadow-md">
                  {heroItem.title}
                </h2>

                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-350 mb-3 sm:mb-4">
                  <span className="flex items-center gap-1 text-amber-400">
                    <Star className="w-4 h-4 fill-amber-400" />
                    {heroItem.vote_average}/10
                  </span>
                  <span>•</span>
                  <span>{heroItem.release_year}</span>
                  <span>•</span>
                  <span className="bg-slate-900/60 backdrop-blur-sm border border-slate-850 px-2 py-0.5 rounded text-[10px]">
                    {heroItem.type.toUpperCase()}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 line-clamp-3 leading-relaxed mb-6 drop-shadow">
                  {heroItem.overview}
                </p>

                {/* Hero Actions */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate(`/explore/${heroItem.type}/${heroItem.id}`)}
                    className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg active:scale-95 cursor-pointer"
                  >
                    <Info className="w-4 h-4" />
                    View Details
                  </button>

                  {getWatchedInstance(heroItem) ? (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold px-4 py-2.5 rounded-xl text-sm">
                      <Check className="w-4 h-4 text-emerald-400" />
                      In Watchlist
                    </span>
                  ) : (
                    <button
                      onClick={() => openAddDialog(heroItem)}
                      className="inline-flex items-center justify-center gap-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-750 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all backdrop-blur shadow-lg active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-violet-400" />
                      Add to Watchlist
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Category Rows */}
          {dashboardData && (
            <div className="space-y-6">
              <CategoryRow
                title="Trending Now"
                icon={Flame}
                items={dashboardData.trending}
                watchedItems={watchedItems}
                openAddDialog={openAddDialog}
                navigate={navigate}
              />
              <CategoryRow
                title="All-Time Popular"
                icon={Sparkles}
                items={dashboardData.popular}
                watchedItems={watchedItems}
                openAddDialog={openAddDialog}
                navigate={navigate}
              />
              <CategoryRow
                title="Top Rated Anime"
                icon={Trophy}
                items={dashboardData.topRated}
                watchedItems={watchedItems}
                openAddDialog={openAddDialog}
                navigate={navigate}
              />
              <CategoryRow
                title="Currently Airing (On Air)"
                icon={Tv}
                items={dashboardData.onAir}
                watchedItems={watchedItems}
                openAddDialog={openAddDialog}
                navigate={navigate}
              />
            </div>
          )}
        </div>
      )}

      {/* Adding Configuration Modal */}
      {addingItem && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <h3 className="text-xl font-bold text-white mb-2">
              Log Watched Anime
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Customize your rating, status, and optional review for <strong className="text-slate-200">{addingItem.title}</strong>.
            </p>

            <div className="space-y-4">
              {/* Rating Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Your Rating</span>
                  <span className="text-violet-400 font-bold">{userRating}/10</span>
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={userRating}
                    onChange={(e) => setUserRating(parseInt(e.target.value))}
                    className="flex-1 accent-violet-600 bg-slate-850 h-2 rounded-lg cursor-pointer"
                  />
                  <div className="w-12 h-9 rounded-lg bg-slate-850 flex items-center justify-center border border-slate-800 text-slate-200 font-bold text-sm">
                    {userRating}
                  </div>
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Watch Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'completed', label: 'Completed', icon: CheckSquare, style: 'peer-checked:border-emerald-500 peer-checked:bg-emerald-950/20 text-emerald-400' },
                    { key: 'watching', label: 'Watching', icon: Play, style: 'peer-checked:border-violet-500 peer-checked:bg-violet-950/20 text-violet-400' },
                    { key: 'planned', label: 'Plan to Watch', icon: BookOpen, style: 'peer-checked:border-sky-500 peer-checked:bg-sky-950/20 text-sky-400' },
                    { key: 'backlog', label: 'Backlog', icon: Clock, style: 'peer-checked:border-slate-500 peer-checked:bg-slate-800 text-slate-300' },
                    { key: 'paused', label: 'On Hold', icon: X, style: 'peer-checked:border-amber-500 peer-checked:bg-amber-950/20 text-amber-400' },
                    { key: 'dropped', label: 'Dropped', icon: X, style: 'peer-checked:border-rose-500 peer-checked:bg-rose-950/20 text-rose-450' }
                  ].map(opt => {
                    const IconOpt = opt.icon
                    return (
                      <label key={opt.key} className="cursor-pointer">
                        <input
                          type="radio"
                          name="userStatus"
                          value={opt.key}
                          checked={userStatus === opt.key}
                          onChange={() => setUserStatus(opt.key)}
                          className="sr-only peer"
                        />
                        <div className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border border-slate-800/80 bg-slate-900/60 hover:bg-slate-850/60 text-slate-400 text-center transition-all ${opt.style}`}>
                          <IconOpt className="w-4 h-4" />
                          <span className="text-[10px] font-bold">{opt.label}</span>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Review Text Area */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Review (Optional)
                </label>
                <textarea
                  placeholder="Share your thoughts about this anime..."
                  rows="3"
                  value={userReview}
                  onChange={(e) => setUserReview(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-800 hover:border-slate-750 focus:border-violet-500 focus:outline-none rounded-xl p-3 text-xs text-slate-100 placeholder-slate-550 resize-none transition-all"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-800/80">
              <button
                onClick={() => setAddingItem(null)}
                className="flex-1 bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer border border-transparent hover:border-slate-700/60"
              >
                Cancel
              </button>
              <button
                onClick={handleAddConfirm}
                className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-lg shadow-violet-600/10 transition-colors cursor-pointer"
              >
                Log Watched Anime
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
