import { X, Film, Tv, Compass, Settings as SettingsIcon, Shield, Layers, HelpCircle, UploadCloud, LogOut, Play, Globe } from 'lucide-react'
import { isFirebaseConfigured } from '../lib/firebase'
import { isTMDBConfigured } from '../lib/tmdb'

export default function Sidebar({
  isOpen,
  onClose,
  activeView,
  onNavigate,
  watchedCount,
  user,
  onLogout
}) {
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
            Core Collections
          </div>
          
          <button
            onClick={() => handleLinkClick('watchlist')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeView === 'watchlist'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Home</span>
            {watchedCount > 0 && (
              <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-bold ${
                activeView === 'watchlist' ? 'bg-violet-800 text-violet-200' : 'bg-slate-800 text-slate-400'
              }`}>
                {watchedCount}
              </span>
            )}
          </button>

          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pt-6 mb-2 px-3">
            Discover Media
          </div>

          <button
            onClick={() => handleLinkClick('explore_tmdb')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeView === 'explore_tmdb'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Explore TMDB</span>
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
        <div className="border-t border-slate-800 pt-4 mt-auto space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Database Connection:</span>
            <span className={isConnectedToFirebase ? 'text-emerald-400 font-semibold' : 'text-amber-500'}>
              {isConnectedToFirebase ? 'Firebase Sync' : 'Local Sandbox'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>TMDB Provider:</span>
            <span className={isConnectedToTMDB ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
              {isConnectedToTMDB ? 'Live Access' : 'Demo Offline'}
            </span>
          </div>
          {user && (
            <div className="text-[10px] text-slate-500 line-clamp-1 border-t border-slate-800/60 pt-2 mt-1">
              Logged in as: <span className="text-slate-350">{user.email}</span>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
