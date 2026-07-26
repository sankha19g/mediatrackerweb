import React, { useState } from 'react'
import { Shield, Play, UploadCloud, User, LogOut } from 'lucide-react'
import Auth from './Auth'
import Sources from './Sources'
import ImportExport from './ImportExport'

export default function Settings({
  // Auth / Account props
  user,
  isAdmin,
  onAuthSuccess,
  onLogout,
  
  // Sources props
  sources,
  onAddSource,
  onRemoveSource,
  onUpdateSource,
  downloadSources,
  onAddDownloadSource,
  onRemoveDownloadSource,
  onUpdateDownloadSource,
  
  // Import/Export props
  items,
  onAddImportedItems
}) {
  const [activeTab, setActiveTab] = useState('account') // 'account', 'sources', 'import_export'

  const tabs = [
    { id: 'account', label: 'Account Protection', icon: Shield },
    { id: 'sources', label: 'Choose Sources', icon: Play },
    { id: 'import_export', label: 'Import / Export', icon: UploadCloud }
  ]

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-8 border-b border-slate-800 pb-5">
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
          CineLog Configuration & Settings
        </h1>
        <p className="text-slate-400 text-sm">
          Customize your account protection, media streaming sources, and import/export lists.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Sidebar/Tabs */}
        <div className="md:col-span-1 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-none border-b md:border-b-0 md:border-r border-slate-800/80 pr-0 md:pr-4">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap md:w-full ${
                  isActive
                    ? 'bg-violet-600/10 text-violet-300 border border-violet-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-violet-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Active Tab Panel */}
        <div className="md:col-span-3">
          {activeTab === 'account' && (
            <div className="space-y-6">
              {user ? (
                <div className="max-w-md mx-auto p-8 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl -z-10" />
                  
                  <div className="text-center mb-8">
                    <User className="w-12 h-12 text-violet-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-extrabold text-white tracking-tight mb-2">
                      Account Information
                    </h2>
                    <p className="text-slate-455 text-xs leading-relaxed">
                      Your watchlist, ratings, reviews, and custom lists are actively synced in the cloud.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-[#101424] border border-slate-800 rounded-xl p-4 text-center">
                      <span className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Signed in as</span>
                      <span className="block text-sm font-semibold text-white truncate">{user.email}</span>
                      {user.isQrUser && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded-full mt-2 border border-violet-500/20 uppercase tracking-wider">
                          Linked via QR Code
                        </span>
                      )}
                    </div>

                    <button
                      onClick={onLogout}
                      className="w-full bg-slate-900 hover:bg-rose-950/20 hover:text-rose-455 border border-slate-800 hover:border-rose-900/30 text-slate-300 font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out of Account
                    </button>
                  </div>
                </div>
              ) : (
                <Auth 
                  onAuthSuccess={onAuthSuccess} 
                />
              )}
            </div>
          )}

          {activeTab === 'sources' && (
            <Sources
              sources={sources}
              onAddSource={onAddSource}
              onRemoveSource={onRemoveSource}
              onUpdateSource={onUpdateSource}
              downloadSources={downloadSources}
              onAddDownloadSource={onAddDownloadSource}
              onRemoveDownloadSource={onRemoveDownloadSource}
              onUpdateDownloadSource={onUpdateDownloadSource}
              user={user}
              isAdmin={isAdmin}
            />
          )}

          {activeTab === 'import_export' && (
            <ImportExport
              items={items}
              onAddImportedItems={onAddImportedItems}
              user={user}
            />
          )}
        </div>
      </div>
    </div>
  )
}

