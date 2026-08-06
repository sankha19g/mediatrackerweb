import { X, Film, Tv, Compass, Settings as SettingsIcon, Shield, Layers, HelpCircle, UploadCloud, LogOut, Play, Globe, BarChart2, Bookmark, Grid3x3, LogIn } from 'lucide-react'
import { isFirebaseConfigured } from '../lib/firebase'
import { isTMDBConfigured } from '../lib/tmdb'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Sidebar({
  isOpen,
  onClose,
  activeView,
  onNavigate,
  watchedCount,
  user,
  onLogout
}) {
  const navigate = useNavigate()
  const location = useLocation()
  if (!isOpen) return null

  const isConnectedToFirebase = isFirebaseConfigured()
  const isConnectedToTMDB = isTMDBConfigured()

  const handleLinkClick = (view) => {
    onNavigate(view)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300"
      />

      {/* Slide Drawer */}
      <aside className="relative flex w-full max-w-xs flex-col bg-slate-900 border-r border-slate-800 p-6 shadow-2xl animate-slide-in-left h-full">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2 mb-8 mt-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-violet-500/20">
            C
          </div>
          <span className="font-extrabold text-lg text-white">CineLog Tracker</span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-2">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-3">
            Discover & Collections
          </div>
          
          <button
            onClick={() => {
              navigate('/explore_tmdb')
              onClose()
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              location.pathname === '/explore_tmdb' && !location.search.includes('view=all')
                ? 'bg-violet-600 text-white shadow-md shadow-violet-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Explore TMDB</span>
          </button>

          <button
            onClick={() => {
              navigate('/explore_anilist')
              onClose()
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              location.pathname === '/explore_anilist'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>Explore AniList</span>
          </button>

          <button
            onClick={() => {
              navigate('/explore_tmdb?view=all')
              onClose()
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              location.pathname === '/explore_tmdb' && location.search.includes('view=all')
                ? 'bg-violet-600 text-white shadow-md shadow-violet-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <Grid3x3 className="w-4 h-4" />
            <span>Discover</span>
          </button>

          <button
            onClick={() => handleLinkClick('watchlist')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeView === 'watchlist'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>My list</span>
          </button>

          <button
            onClick={() => handleLinkClick('saved_sites')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeView === 'saved_sites'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Saved Sites</span>
          </button>

          <button
            onClick={() => handleLinkClick('statistics')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeView === 'statistics'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Statistics</span>
          </button>



          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pt-6 mb-2 px-3">
            Settings & Control
          </div>

          <button
            onClick={() => handleLinkClick('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeView === 'settings'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            <span>Settings</span>
          </button>

          {isConnectedToFirebase && !user && (
            <button
              onClick={() => {
                navigate('/auth')
                onClose()
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-violet-400 hover:text-violet-300 hover:bg-violet-950/20 transition-all cursor-pointer border border-transparent hover:border-violet-900/30"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}

          {user && (
            <button
              onClick={() => {
                onLogout()
                onClose()
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-450 hover:text-rose-400 hover:bg-rose-950/20 transition-all cursor-pointer border border-transparent hover:border-rose-900/30"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          )}
        </nav>

        {/* Footer Statistics */}
        {user && (
          <div className="border-t border-slate-800 pt-4 mt-auto">
            <div className="text-[10px] text-slate-500 line-clamp-1">
              Logged in as: <span className="text-slate-350">{user.email}</span>
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}
