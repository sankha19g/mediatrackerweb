import React from 'react'
import { Menu, LogIn, LogOut, Settings as SettingsIcon, Film, Tv, Gamepad, Search, X, ListChecks, Bookmark } from 'lucide-react'
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
  setIsSelectMode
}) {
  const isAuthEnabled = isFirebaseConfigured()
  const navigate = useNavigate()
  const location = useLocation()

  const isExplorePage = location.pathname.startsWith('/explore_tmdb')
  const isMediaPage = location.pathname.startsWith('/media/') || location.pathname.startsWith('/explore/')
  const shouldShowSearch = isExplorePage || isMediaPage

  const params = new URLSearchParams(location.search)
  const isPersonOrCompany = params.has('type')
  const isSearching = searchQuery.trim().length >= 3
  const showSelectButton = isExplorePage && (!isPersonOrCompany || isSearching)

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

        {/* Mobile active state indicator (if on mobile, show current category title) */}
        {activeView === 'watchlist' && (
          <div className="md:hidden font-semibold text-sm text-violet-400 border border-violet-950/40 bg-violet-950/15 px-3 py-1 rounded-full">
            {currentTab === 'movie' ? 'Movies' : currentTab === 'tv' ? 'TV Shows' : currentTab === 'game' ? 'Games' : 'Saved Lists'}
          </div>
        )}

        {/* Search Bar & Multi-Select Action Button for Explore/Media pages */}
        {shouldShowSearch && (
          <div className="flex items-center gap-3 flex-1 max-w-xl mx-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  const val = e.target.value
                  setSearchQuery(val)
                  if (val.trim().length >= 3 && location.pathname !== '/explore_tmdb') {
                    navigate('/explore_tmdb')
                  }
                }}
                placeholder="Search all Movies, TV Shows, People..."
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

            {showSelectButton && (
              <button
                type="button"
                onClick={() => setIsSelectMode(!isSelectMode)}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${
                  isSelectMode
                    ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
                }`}
                title={isSelectMode ? 'Cancel Selection' : 'Select Items'}
              >
                <ListChecks className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isSelectMode ? 'Cancel' : 'Select'}</span>
              </button>
            )}
          </div>
        )}

        {/* Right Nav Options */}
        <div className="flex items-center gap-3">
          {/* Auth Button */}
          {isAuthEnabled ? (
            user ? null : (
              <button
                onClick={onNavigateToAuth}
                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
            )
          ) : (
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
