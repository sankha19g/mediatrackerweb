import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Star, Clock, Film, Tv, Check, ExternalLink, Play, Plus, Minus, Tag, X, Eye, Lock, Award, Users, Bookmark } from 'lucide-react'
import { fetchAnilistAnimeDetails } from '../lib/anilist'

// Simple Cast Carousel for Anime Characters & Voice Actors
const CastCarousel = ({ cast }) => {
  const scrollRef = useRef(null)
  if (!cast || cast.length === 0) return null

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  return (
    <div className="bg-[#0a0a0a] border border-slate-800/80 rounded-2xl p-5 shadow-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Users className="w-4 h-4 text-violet-400" />
          Characters & Japanese Cast
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => scroll('left')}
            className="w-6 h-6 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-355 flex items-center justify-center cursor-pointer transition-colors"
          >
            ‹
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-6 h-6 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-355 flex items-center justify-center cursor-pointer transition-colors"
          >
            ›
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-none scroll-smooth pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {cast.map((actor) => (
          <div key={actor.id} className="flex-shrink-0 w-24 text-center group">
            <div className="w-24 h-32 rounded-xl overflow-hidden border border-slate-850 bg-slate-950 shadow-md mb-2 relative">
              {actor.profile_path ? (
                <img
                  src={actor.profile_path}
                  alt={actor.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-655 bg-slate-900 text-xs font-bold">
                  No Pic
                </div>
              )}
            </div>
            <h4 className="text-[11px] font-bold text-slate-200 truncate group-hover:text-violet-400 transition-colors leading-tight">
              {actor.name}
            </h4>
            <p className="text-[9px] text-slate-500 truncate leading-snug mt-0.5">
              {actor.character}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AnimeDetails({ items, onUpdateItem, onRemoveItem, onAddItem }) {
  const { id, tmdb_id, type } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Navigation Tabs state
  const [activeAnimeTab, setActiveAnimeTab] = useState('overview')
  const [isTrailerOpen, setIsTrailerOpen] = useState(false)

  // Tracker Logging Modal States
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [addStatus, setAddStatus] = useState('planned')
  const [addReview, setAddReview] = useState('')
  const [addRating, setAddRating] = useState(8)

  // Find if this anime is already logged in the watchlist
  const lookupId = id || tmdb_id
  let item = items.find(i => i.id === lookupId || (i.tmdb_id === lookupId && i.status !== 'list_only'))
  
  if (item && item.status === 'list_only') {
    item = { ...item, isExplore: true }
  }
  if (!item) {
    item = { tmdb_id: lookupId, type: 'tv', isExplore: true }
  }

  // Load details from AniList
  useEffect(() => {
    const loadDetails = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchAnilistAnimeDetails(lookupId)
        if (data) {
          setDetails(data)
        } else {
          setError('No details found for this anime.')
        }
      } catch (err) {
        console.error('Failed to load anime details:', err)
        setError(err.message || 'Failed to fetch details from AniList.')
      } finally {
        setLoading(false)
      }
    }
    if (lookupId) {
      loadDetails()
    }
  }, [lookupId])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400 gap-3">
        <span className="w-10 h-10 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
        <p className="text-sm font-semibold">Loading anime details...</p>
      </div>
    )
  }

  if (error || !details) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <div className="text-rose-500 font-medium max-w-md mx-auto bg-rose-500/10 border border-rose-500/20 p-6 rounded-2xl mb-6">
          <p className="text-lg font-bold mb-2">Error Loading Details</p>
          <p className="text-sm text-slate-400">{error || 'Anime not found'}</p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    )
  }

  // Calculated Progress Variables
  const currentEpisodesWatched = item.season_progress?.[1] || 0
  const maxEpisodes = details.seasons?.[0]?.episode_count || details.episodes || 12

  // Watched toggling
  const handleUpdateEpisodes = (newCount) => {
    if (item.isExplore) return
    const status = newCount >= maxEpisodes ? 'completed' : (newCount === 0 ? 'planned' : 'watching')
    onUpdateItem(item.id, {
      season_progress: { 1: newCount },
      status: status
    })
  }

  // Add Watchlist handler
  const handleAddConfirm = async () => {
    const newItem = {
      tmdb_id: details.tmdb_id,
      title: details.title,
      type: 'tv', // Anime defaults to tv watchlist tab
      poster_path: details.poster_path,
      release_year: details.release_date ? details.release_date.split('-')[0] : 'N/A',
      status: addStatus,
      rating: addRating,
      review: addReview.trim(),
      season_progress: { 1: addStatus === 'completed' ? maxEpisodes : 0 }
    }
    await onAddItem(newItem)
    setIsStatusModalOpen(false)
  }

  const handleDeleteItem = () => {
    if (window.confirm(`Remove "${details.title}" from your watchlist?`)) {
      onRemoveItem(item.id)
      navigate(-1)
    }
  }

  return (
    <div className="animate-fade-in pb-16">
      {/* Hero Header Banner */}
      <div className="w-screen relative left-1/2 -translate-x-1/2 overflow-hidden border-0 bg-black shadow-2xl mb-8">
        {details.backdrop_path && (
          <div className="absolute right-0 top-0 bottom-0 w-full md:w-3/4 lg:w-2/3 h-full z-0 overflow-hidden pointer-events-none">
            <img
              src={details.backdrop_path}
              alt="Backdrop"
              className="w-full h-full object-cover object-center opacity-100"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent z-10" />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black via-black/85 to-transparent z-10" />
          </div>
        )}

        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 relative z-10">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-855 border border-slate-800 text-slate-350 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-md"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-start pb-6 sm:pb-8">
            <div className="w-36 sm:w-44 md:w-52 aspect-[2/3] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex-shrink-0 bg-slate-950">
              <img
                src={details.poster_path}
                alt={details.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-between min-h-[260px] w-full gap-4">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold px-2.5 py-0.5 rounded bg-violet-500/10 border border-violet-500/20 text-violet-400 uppercase tracking-wide">
                    Anime
                  </span>
                  <span className="text-xs font-bold text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg">
                    {maxEpisodes} Episodes
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3.5xl font-black text-white tracking-tight leading-tight line-clamp-2">
                  {details.title}
                </h1>

                <div className="flex items-center gap-3 text-slate-350 text-xs font-bold flex-wrap">
                  {details.vote_average > 0 && (
                    <span className="flex items-center gap-1.5 text-amber-400">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      {details.vote_average.toFixed(1)}
                    </span>
                  )}
                  {details.release_date && (
                    <>
                      <span className="text-slate-650">·</span>
                      <span>{details.release_date.split('-')[0]}</span>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mt-1">
                  {details.genres?.slice(0, 3).map(g => (
                    <span key={g.id} className="text-xs font-semibold px-3 py-1 rounded-xl bg-[#14122b] text-[#a78bfa] border border-[#2e265c]">
                      {g.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-4 mt-2 w-full">
                <div className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl flex-1">
                  <p className="line-clamp-4">
                    {details.overview}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 flex-shrink-0">
                  <button
                    onClick={() => {
                      if (item.isExplore) {
                        setAddStatus('planned')
                        setIsStatusModalOpen(true)
                      } else {
                        setIsStatusModalOpen(true)
                      }
                    }}
                    className={`font-bold text-sm px-5 py-3 rounded-xl flex items-center gap-2 transition-all cursor-pointer border ${item.isExplore
                      ? 'bg-[#101424] hover:bg-[#181e36] text-slate-200 border-slate-800'
                      : 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border-emerald-500/40'
                      }`}
                  >
                    {item.isExplore ? (
                      <>
                        <Plus className="w-4 h-4 text-violet-400" />
                        <span>Add to List</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Saved</span>
                      </>
                    )}
                  </button>

                  {!item.isExplore && (
                    <button
                      onClick={handleDeleteItem}
                      className="bg-rose-950/30 hover:bg-rose-900/40 text-rose-450 border border-rose-500/20 hover:border-rose-500/35 p-3 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-md"
                      title="Remove From Watchlist"
                    >
                      <Trash2Icon />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigator */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex border-b border-slate-800">
          <button
            onClick={() => setActiveAnimeTab('overview')}
            className={`py-3 px-6 text-sm font-black border-b-2 transition-all cursor-pointer ${
              activeAnimeTab === 'overview'
                ? 'border-violet-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveAnimeTab('episodes')}
            className={`py-3 px-6 text-sm font-black border-b-2 transition-all cursor-pointer ${
              activeAnimeTab === 'episodes'
                ? 'border-violet-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Episodes ({maxEpisodes})
          </button>
        </div>
      </div>

      {/* Content Columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {activeAnimeTab === 'episodes' ? (
          /* Episodes List Tab */
          <div className="bg-[#0a0a0a] border border-slate-800/80 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-850 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-white">Episodes Tracker</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Click an episode to toggle its watched status.
                </p>
              </div>
              {!item.isExplore && (
                <div className="text-xs font-bold text-slate-400 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl">
                  {currentEpisodesWatched} of {maxEpisodes} watched
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: maxEpisodes }).map((_, idx) => {
                const epNum = idx + 1
                const isWatchedEp = epNum <= currentEpisodesWatched
                
                return (
                  <div
                    key={epNum}
                    onClick={() => {
                      if (item.isExplore) {
                        setAddStatus('watching')
                        setIsStatusModalOpen(true)
                      } else {
                        const newCount = isWatchedEp ? epNum - 1 : epNum
                        handleUpdateEpisodes(newCount)
                      }
                    }}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer select-none ${
                      isWatchedEp
                        ? 'bg-emerald-955/20 border-emerald-500/30 hover:border-emerald-500/50'
                        : 'bg-[#0f1422]/60 border-slate-800 hover:border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                        isWatchedEp
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-900 text-slate-450 border border-slate-800'
                      }`}>
                        {epNum}
                      </div>
                      <div className="min-w-0">
                        <h4 className={`text-sm font-bold truncate ${isWatchedEp ? 'text-emerald-300' : 'text-slate-200'}`}>
                          Episode {epNum}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          Watch Episode {epNum} of {details.title}.
                        </p>
                      </div>
                    </div>

                    {!item.isExplore && (
                      <button
                        type="button"
                        className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all ${
                          isWatchedEp
                            ? 'bg-emerald-500 border-emerald-400 text-white shadow-sm shadow-emerald-500/20'
                            : 'bg-slate-900 border-slate-800 text-transparent group-hover:border-slate-650'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          /* Overview Tab */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sidebar details */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="bg-[#0a0a0a] border border-slate-800/80 rounded-2xl p-5 shadow-2xl">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                  Anime details
                </h3>
                <div className="flex flex-col text-xs gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Release Year</span>
                    <span className="text-white font-bold">{details.release_date?.split('-')[0] || 'N/A'}</span>
                  </div>
                  {details.homepage && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">AniList Link</span>
                      <a
                        href={details.homepage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-violet-400 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        AniList <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                  {details.popularity > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Popularity Score</span>
                      <span className="text-white font-bold">{details.popularity.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Banners/trailer */}
              {details.videos?.results?.[0] && (
                <div className="bg-[#0a0a0a] border border-slate-800 rounded-2xl p-5 shadow-2xl">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                    Media Trailer
                  </h3>
                  <button
                    onClick={() => setIsTrailerOpen(true)}
                    className="w-full bg-violet-650 hover:bg-violet-500 text-white font-extrabold text-sm py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white stroke-white" />
                    Play Trailer
                  </button>
                </div>
              )}
            </div>

            {/* Main info panel */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* Episodes status panel (tracker box) */}
              {!item.isExplore && (
                <div className="bg-[#0a0a0a] border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Tv className="w-5 h-5 text-violet-400" />
                      <h3 className="text-sm font-extrabold text-white">Watch Progress</h3>
                    </div>
                    <span className="inline-flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-350 font-extrabold px-3 py-1 text-xs rounded-xl">
                      {currentEpisodesWatched} of {maxEpisodes} episodes watched
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                      <span>Overall Progress</span>
                      <span>{Math.round((currentEpisodesWatched / maxEpisodes) * 100)}%</span>
                    </div>
                    <div className="w-full bg-[#101424] rounded-full h-2 overflow-hidden border border-slate-850">
                      <div
                        className="bg-gradient-to-r from-violet-500 to-indigo-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.round((currentEpisodesWatched / maxEpisodes) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleUpdateEpisodes(Math.max(0, currentEpisodesWatched - 1))}
                      disabled={currentEpisodesWatched <= 0}
                      className="w-9 h-9 rounded-full bg-[#101424] hover:bg-[#181e36] disabled:opacity-40 border border-slate-800 text-slate-200 flex items-center justify-center transition-all cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleUpdateEpisodes(Math.min(maxEpisodes, currentEpisodesWatched + 1))}
                      disabled={currentEpisodesWatched >= maxEpisodes}
                      className="w-9 h-9 rounded-full bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 text-white flex items-center justify-center transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Characters cast */}
              <CastCarousel cast={details.credits?.cast} />

              {/* Recommendations */}
              {details.recommendations && details.recommendations.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">Recommended Anime</h3>
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {details.recommendations.map(rec => (
                      <div
                        key={rec.id}
                        onClick={() => navigate(`/explore/tv/${rec.id}`)}
                        className="flex-shrink-0 w-28 bg-[#0f1422] border border-slate-800 hover:border-slate-700/80 rounded-lg overflow-hidden shadow-lg group cursor-pointer transition-all hover:-translate-y-0.5"
                      >
                        <div className="aspect-[2/3] w-full bg-slate-950 relative overflow-hidden">
                          {rec.poster_path ? (
                            <img src={rec.poster_path} alt={rec.title} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-655 bg-slate-900 text-xs font-bold">
                              No Pic
                            </div>
                          )}
                        </div>
                        <div className="p-2">
                          <h4 className="text-[10px] font-bold text-slate-200 truncate">{rec.title}</h4>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Relations */}
              {details.similar && details.similar.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">Relations & Similar Anime</h3>
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {details.similar.map(rel => (
                      <div
                        key={rel.id}
                        onClick={() => navigate(`/explore/tv/${rel.id}`)}
                        className="flex-shrink-0 w-28 bg-[#0f1422] border border-slate-800 hover:border-slate-700/80 rounded-lg overflow-hidden shadow-lg group cursor-pointer transition-all hover:-translate-y-0.5"
                      >
                        <div className="aspect-[2/3] w-full bg-slate-950 relative overflow-hidden">
                          {rel.poster_path ? (
                            <img src={rel.poster_path} alt={rel.title} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-655 bg-slate-900 text-xs font-bold">
                              No Pic
                            </div>
                          )}
                        </div>
                        <div className="p-2">
                          <h4 className="text-[10px] font-bold text-slate-200 truncate">{rel.title}</h4>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status Log dialog modal */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#0f1424] border border-slate-800 p-6 rounded-2xl max-w-sm w-full space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsStatusModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-extrabold text-white text-base border-b border-slate-800 pb-3 flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-violet-400" />
              Log Watchlist Status
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Status</label>
                <select
                  value={addStatus}
                  onChange={(e) => setAddStatus(e.target.value)}
                  className="w-full bg-[#101424] border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-violet-500 font-bold"
                >
                  <option value="watching">Watching</option>
                  <option value="completed">Completed</option>
                  <option value="planned">Plan to Watch</option>
                  <option value="dropped">Dropped</option>
                  <option value="onhold">On Hold</option>
                </select>
              </div>

              {addStatus !== 'planned' && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Rating ({addRating}/10)</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={addRating}
                    onChange={(e) => setAddRating(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-violet-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-bold mt-1">
                    <span>1 (Terrible)</span>
                    <span>10 (Masterpiece)</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Notes / Review</label>
                <textarea
                  value={addReview}
                  onChange={(e) => setAddReview(e.target.value)}
                  placeholder="Any personal thoughts on this show..."
                  className="w-full h-20 bg-[#101424] border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-violet-500 resize-none font-medium placeholder-slate-650"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setIsStatusModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-350 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddConfirm}
                className="px-4 py-2 bg-violet-650 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trailer Modal Overlay */}
      {isTrailerOpen && details.videos?.results?.[0] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm animate-fade-in p-4 sm:p-8">
          <div className="relative w-full max-w-6xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
            <button
              onClick={() => setIsTrailerOpen(false)}
              className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10 flex items-center gap-2 bg-black/50 hover:bg-white/20 text-white px-4 py-2 rounded-full font-bold transition-colors cursor-pointer backdrop-blur-md border border-slate-800 shadow-lg"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Details
            </button>
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${details.videos.results[0].key}?autoplay=1`}
              title="Trailer"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Trash icon helper
function Trash2Icon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9 9m12 6c0 1.104-.896 2-2 2H5c-1.104 0-2-.896-2-2V7H21v8ZM9.75 5.25h4.5m-4.5 0a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75m-4.5 0H9m5.25 0h.75" />
    </svg>
  )
}
