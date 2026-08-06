import React, { useState, useEffect, useRef } from 'react'
import { Menu, LogIn, LogOut, Settings as SettingsIcon, Film, Tv, Gamepad, Search, X, ListChecks, Bookmark, Grid3x3, ArrowLeft, Filter } from 'lucide-react'
import { isFirebaseConfigured } from '../lib/firebase'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Navbar({ 
  currentTab, 
  setCurrentTab, 
  onToggleSidebar, 
  user, 
  onLogout, 
  onNavigateToAuth, 
  onNavigateToSettings,
  activeView,
  searchQuery = '',
  setSearchQuery,
  isSelectMode = false,
  setIsSelectMode,
  isFilterOpen = false,
  setIsFilterOpen
}) {
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
  const [isSearchExpanded, setIsSearchExpanded] = useState(!!searchQuery)
  const searchRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (searchQuery) {
      setIsSearchExpanded(true)
    }
  }, [searchQuery])

  useEffect(() => {
    // Collapse search bar when route changes
    setIsSearchExpanded(false)
  }, [location.pathname])

  useEffect(() => {
    // Collapse search bar when clicking outside
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchExpanded(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const isAuthEnabled = isFirebaseConfigured()

  const isExplorePage = location.pathname.startsWith('/explore_tmdb') || location.pathname.startsWith('/explore_anilist')
  const isTMDBExplore = location.pathname.startsWith('/explore_tmdb')
  const isMediaPage = location.pathname.startsWith('/media/') || location.pathname.startsWith('/explore/')
  const isWatchlistPage = location.pathname === '/'
  const shouldShowDesktopSearch = isExplorePage || isMediaPage
  const shouldShowMobileSearch = isExplorePage || isMediaPage || (isWatchlistPage && currentTab !== 'lists')

  const params = new URLSearchParams(location.search)
  const isPersonOrCompany = params.has('type')
  const isSearching = searchQuery.trim().length >= 3
  const showSelectButton = (isTMDBExplore && (!isPersonOrCompany || isSearching)) || (isWatchlistPage && currentTab !== 'lists')

  if (shouldShowMobileSearch && isMobileSearchOpen) {
    return (
      <header className="sticky top-0 z-40 w-full border-b border-slate-900 bg-black/95 backdrop-blur-md">
        <div className="flex h-16 items-center gap-3 px-4">
          <button
            onClick={() => {
              setIsMobileSearchOpen(false)
              setSearchQuery('')
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-all cursor-pointer"
            aria-label="Close Search"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value
                setSearchQuery(val)
                if (val.trim().length >= 3 && location.pathname !== '/explore_tmdb' && location.pathname !== '/explore_anilist' && location.pathname !== '/') {
                  navigate('/explore_tmdb')
                }
              }}
              placeholder={location.pathname === '/explore_anilist' ? "Search anime..." : isWatchlistPage ? "Search watchlist..." : "Search all Movies, TV Shows, People..."}
              className="w-full bg-slate-900/80 border border-slate-800 focus:border-violet-500 focus:outline-none rounded-xl pl-9 pr-8 py-2 text-white text-sm placeholder-slate-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-900 bg-black/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        
        {/* Brand & Menu */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-all cursor-pointer"
            aria-label="Toggle Sidebar"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform">
              C
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-violet-400 transition-colors">
              CineLog
            </span>
          </div>
        </div>

        {/* Media Filters (Movies, TV Shows, Games) */}
        {activeView === 'watchlist' && (
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/50 p-1 border border-slate-900 rounded-xl">
            {[
              { id: 'movie', label: 'Movies', icon: Film },
              { id: 'tv', label: 'TV Shows', icon: Tv },
              { id: 'game', label: 'Games', icon: Gamepad },
              { id: 'lists', label: 'Saved Lists', icon: Bookmark }
            ].map((tab) => {
              const Icon = tab.icon
              const isActive = currentTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        )}

        {/* Right Nav Options */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Desktop Expandable Search Bar */}
          {shouldShowDesktopSearch && (
            <div ref={searchRef} className="hidden md:flex items-center transition-all duration-300">
              {isSearchExpanded ? (
                <div className="relative flex items-center w-64 animate-fade-in">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => {
                      const val = e.target.value
                      setSearchQuery(val)
                      if (val.trim().length >= 3 && location.pathname !== '/explore_tmdb' && location.pathname !== '/explore_anilist') {
                        navigate('/explore_tmdb')
                      }
                    }}
                    placeholder={location.pathname === '/explore_anilist' ? "Search anime..." : "Search all Movies, TV Shows, People..."}
                    className="w-full bg-slate-900/80 border border-slate-800 focus:border-violet-500 focus:outline-none rounded-xl pl-9 pr-8 py-2 text-white text-sm placeholder-slate-500 transition-all shadow-inner"
                  />
                  <button
                    onClick={() => {
                      if (searchQuery) {
                        setSearchQuery('')
                      } else {
                        setIsSearchExpanded(false)
                      }
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-800 text-slate-550 hover:text-white transition-all cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSearchExpanded(true)}
                  className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all cursor-pointer flex items-center justify-center shadow-md active:scale-95"
                  title="Search"
                >
                  <Search className="w-4 h-4 text-violet-400" />
                </button>
              )}
            </div>
          )}

          {/* Select Button on Desktop */}
          {shouldShowDesktopSearch && showSelectButton && (
            <button
              type="button"
              onClick={() => setIsSelectMode(!isSelectMode)}
              className={`hidden md:flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${
                isSelectMode
                  ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
              title={isSelectMode ? 'Cancel Selection' : 'Select Items'}
            >
              <ListChecks className="w-3.5 h-3.5" />
              <span>{isSelectMode ? 'Cancel' : 'Select'}</span>
            </button>
          )}

          {/* Mobile Search/Filter/Select Action Buttons (Float Right) */}
          {shouldShowMobileSearch && (
            <div className="flex md:hidden items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsMobileSearchOpen(true)}
                className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all cursor-pointer flex items-center justify-center"
                title="Search"
              >
                <Search className="w-3.5 h-3.5 text-violet-400" />
              </button>

              {isWatchlistPage && (
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                    isFilterOpen
                      ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                  title="Filter & Sort"
                >
                  <Filter className="w-3.5 h-3.5 text-violet-400" />
                </button>
              )}

              {showSelectButton && (
                <button
                  type="button"
                  onClick={() => setIsSelectMode(!isSelectMode)}
                  className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                    isSelectMode
                      ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                  title={isSelectMode ? 'Cancel Selection' : 'Select Items'}
                >
                  <ListChecks className="w-3.5 h-3.5 text-violet-400" />
                </button>
              )}
            </div>
          )}
          {/* Auth Button moved to Hamburger menu. Only show Demo Mode indicator if not auth enabled */}
          {!isAuthEnabled && (
            <span className="text-[10px] text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
              Demo Mode
            </span>
          )}
        </div>
      </div>

      {/* Mobile top filter tabs (below main nav) */}
      {activeView === 'watchlist' && (
        <div className="flex md:hidden items-center justify-around border-t border-slate-900 bg-black p-2">
          {[
            { id: 'movie', label: 'Movies', icon: Film },
            { id: 'tv', label: 'TV Shows', icon: Tv },
            { id: 'game', label: 'Games', icon: Gamepad },
            { id: 'lists', label: 'Saved Lists', icon: Bookmark }
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = currentTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            )
          })}
        </div>
      )}
    </header>
  )
}
