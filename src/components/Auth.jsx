import React, { useState } from 'react'
import { firebaseSignUp, firebaseSignIn, firebaseSignInWithGoogle, isFirebaseConfigured } from '../lib/firebase'
import { Mail, Lock, LogIn, UserPlus, Settings as SettingsIcon, AlertCircle } from 'lucide-react'

export default function Auth({ onAuthSuccess, onNavigateToSettings }) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  if (!isFirebaseConfigured()) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl text-center">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Firebase Connection Required</h2>
        <p className="text-slate-400 text-sm mb-6">
          To enable user authentication and protect your lists, you must configure a Firebase project connection first.
        </p>
        <button
          onClick={onNavigateToSettings}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-2.5 px-5 rounded-xl transition-all transform active:scale-95 shadow-lg shadow-violet-500/20 cursor-pointer"
        >
          <SettingsIcon className="w-4 h-4" />
          Go to Settings
        </button>
      </div>
    )
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      if (isSignUp) {
        const user = await firebaseSignUp(email.trim(), password)
        setMessage('Registration successful! Welcome to CineLog.')
        if (onAuthSuccess) {
          onAuthSuccess(user)
        }
      } else {
        const user = await firebaseSignIn(email.trim(), password)
        if (onAuthSuccess) {
          onAuthSuccess(user)
        }
      }
    } catch (err) {
      setError(err.message || 'An error occurred during authentication.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const user = await firebaseSignInWithGoogle()
      if (onAuthSuccess) {
        onAuthSuccess(user)
      }
    } catch (err) {
      setError(err.message || 'An error occurred during Google authentication.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto my-12 p-8 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl -z-10" />
      
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p className="text-slate-400 text-sm">
          {isSignUp ? 'Register to secure and sync your watchlist data' : 'Sign in to access your saved movies, TV shows and games'}
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/40 border border-rose-500/30 text-rose-300 rounded-xl mb-4 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 rounded-xl mb-4 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleAuth} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@domain.com"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-violet-800 disabled:to-indigo-800 text-white font-semibold py-3 rounded-xl transition-all transform active:scale-95 shadow-lg flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : isSignUp ? (
            <>
              <UserPlus className="w-5 h-5" />
              Sign Up
            </>
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              Sign In
            </>
          )}
        </button>
      </form>

      <div className="relative my-6 text-center">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-800/60" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-slate-900 px-3 text-slate-500 rounded-full">Or continue with</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGoogleAuth}
        disabled={loading}
        className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-white font-semibold py-3 rounded-xl transition-all transform active:scale-95 shadow-md flex items-center justify-center gap-2 cursor-pointer"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#EA4335"
            d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.19 2.698 1.24 6.65l4.026 3.115Z"
          />
          <path
            fill="#FBBC05"
            d="M16.04 15.345c-1.077.736-2.427 1.164-4.04 1.164a7.076 7.076 0 0 1-6.734-4.856L1.24 14.77C3.19 18.72 7.27 21.42 12 21.42c2.99 0 5.864-.99 8.018-2.827l-3.977-3.248Z"
          />
          <path
            fill="#4285F4"
            d="M23.518 12.273c0-.818-.082-1.609-.227-2.373H12v4.545h6.473a5.553 5.553 0 0 1-2.41 3.655l3.978 3.248c2.327-2.146 3.477-5.327 3.477-9.075Z"
          />
          <path
            fill="#34A853"
            d="M5.266 14.236A7.16 7.16 0 0 1 4.91 12c0-.79.13-1.545.356-2.236L1.24 6.65A11.96 11.96 0 0 0 0 12c0 1.92.454 3.736 1.24 5.35l4.026-3.114Z"
          />
        </svg>
        Sign in with Google
      </button>

      <div className="mt-6 pt-6 border-t border-slate-800/60 text-center">
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp)
            setError('')
            setMessage('')
          }}
          className="text-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
        </button>
      </div>
    </div>
  )
}
