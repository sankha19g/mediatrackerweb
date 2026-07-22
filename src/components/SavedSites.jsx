import React, { useState } from 'react'
import { Plus, Trash2, ExternalLink, AlertTriangle, Globe, Film, Tv, Sparkles } from 'lucide-react'

export default function SavedSites({
  sites = [],
  onAddSite,
  onRemoveSite,
  onUpdateSite,
  user
}) {
  const [activeTab, setActiveTab] = useState('movies_tvshows') // 'movies_tvshows' or 'anime'
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [category, setCategory] = useState('movies_tvshows')
  const [error, setError] = useState('')

  // Context Menu State
  const [contextMenuSite, setContextMenuSite] = useState(null)
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 })

  // Edit Site State
  const [editingSite, setEditingSite] = useState(null)
  const [editName, setEditName] = useState('')
  const [editUrl, setEditUrl] = useState('')
  const [editImageUrl, setEditImageUrl] = useState('')
  const [editCategory, setEditCategory] = useState('movies_tvshows')
  const [editError, setEditError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Please enter a site name.')
      return
    }
    if (!url.trim()) {
      setError('Please enter a website link.')
      return
    }

    let formattedUrl = url.trim()
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`
    }

    let formattedImageUrl = imageUrl.trim()

    try {
      onAddSite(name.trim(), formattedUrl, formattedImageUrl, category)
      setName('')
      setUrl('')
      setImageUrl('')
      setIsFormOpen(false)
    } catch (err) {
      setError(err.message || 'Failed to add saved site.')
    }
  }

  const handleContextMenu = (e, site) => {
    e.preventDefault()
    setContextMenuSite(site)
    setContextMenuPos({ x: e.clientX, y: e.clientY })
  }

  const handleCloseContextMenu = () => {
    setContextMenuSite(null)
  }

  const handleOpenEdit = (site) => {
    setEditingSite(site)
    setEditName(site.name)
    setEditUrl(site.url)
    setEditImageUrl(site.image_url || '')
    setEditCategory(site.category)
    setEditError('')
    setContextMenuSite(null)
  }

  const handleEditSubmit = (e) => {
    e.preventDefault()
    setEditError('')

    if (!editName.trim()) {
      setEditError('Please enter a site name.')
      return
    }
    if (!editUrl.trim()) {
      setEditError('Please enter a website link.')
      return
    }

    let formattedUrl = editUrl.trim()
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`
    }

    try {
      onUpdateSite(editingSite.id, {
        name: editName.trim(),
        url: formattedUrl,
        image_url: editImageUrl.trim(),
        category: editCategory
      })
      setEditingSite(null)
    } catch (err) {
      setEditError(err.message || 'Failed to update saved site.')
    }
  }

  const filteredSites = sites.filter(site => site.category === activeTab)

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      {/* Header section with Title and Add Button */}
      <div className="flex items-center justify-between mb-8 relative">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent flex items-center gap-2">
            <Globe className="w-8 h-8 text-violet-400" />
            Saved Sites
          </h1>
          <p className="text-slate-400 text-sm">
            Quickly access your databases. <span className="text-slate-500 font-medium">Right-click any card to edit or delete.</span>
          </p>
        </div>

        {/* Add Button */}
        <div className="relative">
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-650 to-indigo-650 hover:from-violet-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl font-bold transition-all hover:scale-105 shadow-xl cursor-pointer text-sm"
          >
            <Plus className={`w-4 h-4 transition-transform duration-350 ${isFormOpen ? 'rotate-45' : ''}`} />
            Add Site
          </button>

          {/* Dropdown Add Form */}
          {isFormOpen && (
            <div className="absolute right-0 mt-3 w-80 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl z-50 animate-fade-in">
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  Add Site Details
                </h3>

                {error && (
                  <div className="p-2.5 rounded-lg text-xs bg-rose-950/40 border border-rose-500/30 text-rose-300 flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-455 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">
                    Site Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Netflix"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-700 focus:outline-none focus:border-violet-500 transition-colors text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-1">
                    Website Link
                  </label>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="e.g. netflix.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-700 focus:outline-none focus:border-violet-500 transition-colors text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-1">
                    Image URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="e.g. https://example.com/logo.png"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-700 focus:outline-none focus:border-violet-500 transition-colors text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-105 focus:outline-none focus:border-violet-550 transition-colors text-xs"
                  >
                    <option value="movies_tvshows">Movies & TV Shows</option>
                    <option value="anime">Anime</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-violet-650 hover:bg-violet-500 text-white font-bold py-2 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Save Website
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 mb-6">
        <button
          onClick={() => setActiveTab('movies_tvshows')}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'movies_tvshows'
              ? 'border-violet-500 text-white font-black'
              : 'border-transparent text-slate-400 hover:text-slate-205'
          }`}
        >
          <Film className="w-4 h-4" />
          Movies & TV Shows
        </button>
        <button
          onClick={() => setActiveTab('anime')}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'anime'
              ? 'border-violet-500 text-white font-black'
              : 'border-transparent text-slate-400 hover:text-slate-205'
          }`}
        >
          <Tv className="w-4 h-4" />
          Anime
        </button>
      </div>

      {/* Sites Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filteredSites.map((site) => (
          <div
            key={site.id}
            onContextMenu={(e) => handleContextMenu(e, site)}
            className="group relative flex flex-col items-center bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden hover:border-violet-500/30 hover:bg-slate-900 transition-all hover:-translate-y-0.5 shadow-md hover:shadow-violet-500/5 duration-300"
          >
            {/* Clickable Area for Image and Site Name */}
            <a
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex flex-col items-center p-4 cursor-pointer"
            >
              {/* Site Icon / Image Box */}
              <div className="w-full h-20 mb-3 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-all p-2 bg-slate-950/20 rounded-xl">
                {site.image_url ? (
                  <img
                    src={site.image_url}
                    alt={site.name}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      // Fallback if image fails to load
                      e.target.style.display = 'none'
                      const parent = e.target.parentElement
                      if (parent) {
                        const fallbackDiv = document.createElement('div')
                        fallbackDiv.className = "w-16 h-16 flex items-center justify-center bg-gradient-to-br from-violet-600/20 to-indigo-650/20 rounded-2xl font-black text-violet-400 text-xl font-bold"
                        fallbackDiv.innerText = site.name.charAt(0).toUpperCase()
                        parent.appendChild(fallbackDiv)
                      }
                    }}
                  />
                ) : (
                  <div className="w-16 h-16 flex items-center justify-center bg-gradient-to-br from-violet-600/10 to-indigo-650/10 rounded-2xl font-bold text-violet-400 text-xl font-black">
                    {site.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Site Name */}
              <span className="text-xs font-bold text-slate-200 group-hover:text-violet-400 text-center truncate w-full transition-colors">
                {site.name}
              </span>
            </a>

            {/* Delete button (hidden by default, shown on hover / touch) */}
            <button
              onClick={() => onRemoveSite(site.id)}
              className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-500 hover:text-rose-455 hover:border-rose-900/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
              title={`Delete ${site.name}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            {/* Visit link arrow */}
            <div className="absolute bottom-2 right-2 text-slate-650 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <ExternalLink className="w-3 h-3" />
            </div>
          </div>
        ))}

        {filteredSites.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-500">
            <Globe className="w-12 h-12 text-slate-800 mb-3" />
            <p className="text-sm">No saved sites here yet.</p>
            <p className="text-xs text-slate-600 mt-1">Click "Add Site" at the top right to get started.</p>
          </div>
        )}
      </div>

      {/* Right-click Context Menu */}
      {contextMenuSite && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-transparent cursor-default" 
            onClick={handleCloseContextMenu}
            onContextMenu={(e) => {
              e.preventDefault()
              handleCloseContextMenu()
            }}
          />
          <div
            style={{ 
              top: `${contextMenuPos.y}px`, 
              left: `${contextMenuPos.x}px` 
            }}
            className="fixed z-50 min-w-[160px] bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 animate-fade-in flex flex-col"
          >
            <button
              onClick={() => handleOpenEdit(contextMenuSite)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-violet-650 rounded-lg transition-colors cursor-pointer text-left w-full"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              Edit Site
            </button>
            <button
              onClick={() => {
                onRemoveSite(contextMenuSite.id)
                handleCloseContextMenu()
              }}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-650 rounded-lg transition-colors cursor-pointer text-left w-full border-t border-slate-800 mt-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Site
            </button>
          </div>
        </>
      )}

      {/* Edit Site Modal */}
      {editingSite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
            <button 
              onClick={() => setEditingSite(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white cursor-pointer text-lg font-bold"
            >
              &times;
            </button>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <h3 className="font-extrabold text-white text-lg border-b border-slate-800 pb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-400" />
                Edit Saved Site
              </h3>

              {editError && (
                <div className="p-2.5 rounded-lg text-xs bg-rose-950/40 border border-rose-500/30 text-rose-300 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-455 flex-shrink-0 mt-0.5" />
                  <span>{editError}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">
                  Site Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Netflix"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-700 focus:outline-none focus:border-violet-500 transition-colors text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-1">
                  Website Link
                </label>
                <input
                  type="text"
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  placeholder="e.g. netflix.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-105 placeholder-slate-700 focus:outline-none focus:border-violet-500 transition-colors text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-1">
                  Image URL (Optional)
                </label>
                <input
                  type="text"
                  value={editImageUrl}
                  onChange={(e) => setEditImageUrl(e.target.value)}
                  placeholder="e.g. https://example.com/logo.png"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-105 placeholder-slate-700 focus:outline-none focus:border-violet-500 transition-colors text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-105 focus:outline-none focus:border-violet-500 transition-colors text-xs"
                >
                  <option value="movies_tvshows">Movies & TV Shows</option>
                  <option value="anime">Anime</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSite(null)}
                  className="flex-1 bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-white font-bold py-2 rounded-lg text-xs transition-colors cursor-pointer border border-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-violet-650 hover:bg-violet-500 text-white font-bold py-2 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
