import React, { useState, useEffect } from 'react'
import { 
  firebaseSignUp, 
  firebaseSignIn, 
  firebaseSignInWithGoogle, 
  isFirebaseConfigured,
  onFirebaseAuthStateChanged,
  getFirebaseDb,
  firebaseSignInAnonymously,
  setQrUser
} from '../lib/firebase'
import { Mail, Lock, LogIn, UserPlus, Settings as SettingsIcon, AlertCircle, QrCode, CheckCircle } from 'lucide-react'
import { doc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore'

// Sub-component for clean reusable login forms
function AuthForm({
  email,
  setEmail,
  password,
  setPassword,
  loading,
  handleAuth,
  isSignUp,
  setIsSignUp,
  handleGoogleAuth,
  error,
  setError,
  message,
  setMessage
}) {
  return (
    <>
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
    </>
  )
}

export default function Auth({ onAuthSuccess, onNavigateToSettings }) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  // QR Auth states
  const [showQrModal, setShowQrModal] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [qrTimeLeft, setQrTimeLeft] = useState(300)
  const [qrSessionId, setQrSessionId] = useState('')

  const [qrScanSessionId, setQrScanSessionId] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('qr_session') || ''
  })
  const [qrConfirmStatus, setQrConfirmStatus] = useState('idle')
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const unsubscribe = onFirebaseAuthStateChanged((user) => {
      if (user && !user.isQrUser) {
        setCurrentUser(user)
      } else {
        setCurrentUser(null)
      }
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!showQrModal) return

    const timer = setInterval(() => {
      setQrTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          const dbInstance = getFirebaseDb()
          if (dbInstance && qrSessionId) {
            const sessionDocRef = doc(dbInstance, 'qr_logins', qrSessionId)
            updateDoc(sessionDocRef, { status: 'expired' }).catch(() => {})
          }
          if (window.qrListenerUnsubscribe) {
            window.qrListenerUnsubscribe()
          }
          setShowQrModal(false)
          setError("QR code validity expired. Please try again.")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [showQrModal, qrSessionId])

  useEffect(() => {
    return () => {
      if (window.qrListenerUnsubscribe) {
        window.qrListenerUnsubscribe()
      }
    }
  }, [])

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

  const handleQrAuthStart = async () => {
    setError('')
    setLoading(true)
    try {
      const dbInstance = getFirebaseDb()
      if (!dbInstance) throw new Error("Firebase database not initialized")

      const sessionId = 'qr_' + Math.random().toString(36).substring(2, 15)
      setQrSessionId(sessionId)

      const sessionDocRef = doc(dbInstance, 'qr_logins', sessionId)
      await setDoc(sessionDocRef, {
        status: 'pending',
        createdAt: new Date().toISOString()
      })

      const qrUrl = `${window.location.origin}/auth?qr_session=${sessionId}`
      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrUrl)}`
      setQrCodeUrl(qrImageUrl)
      setShowQrModal(true)
      setQrTimeLeft(300)

      const unsubscribe = onSnapshot(sessionDocRef, async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data()
          if (data.status === 'authenticated') {
            unsubscribe()
            setShowQrModal(false)
            setLoading(true)
            
            await firebaseSignInAnonymously()

            const qrUserObj = {
              uid: data.uid,
              email: data.email,
              displayName: data.displayName,
              photoURL: data.photoURL,
              isQrUser: true
            }
            setQrUser(qrUserObj)

            if (onAuthSuccess) {
              onAuthSuccess(qrUserObj)
            }
            setLoading(false)
          } else if (data.status === 'rejected') {
            unsubscribe()
            setShowQrModal(false)
            setError("Sign-in request was rejected by your phone.")
            setLoading(false)
          }
        }
      })

      window.qrListenerUnsubscribe = unsubscribe

    } catch (err) {
      console.error("Failed to start QR authorization:", err)
      setError("Could not initialize QR authentication session.")
      setLoading(false)
    }
  }

  const handleCloseQrModal = () => {
    if (window.qrListenerUnsubscribe) {
      window.qrListenerUnsubscribe()
    }
    setShowQrModal(false)
    setLoading(false)
  }

  const handleConfirmQrLogin = async () => {
    if (!currentUser || !qrScanSessionId) return
    setQrConfirmStatus('loading')
    try {
      const dbInstance = getFirebaseDb()
      if (!dbInstance) throw new Error("Firebase not configured")

      const sessionDocRef = doc(dbInstance, 'qr_logins', qrScanSessionId)
      await updateDoc(sessionDocRef, {
        status: 'authenticated',
        uid: currentUser.uid,
        email: currentUser.email || '',
        displayName: currentUser.displayName || '',
        photoURL: currentUser.photoURL || '',
        authenticatedAt: new Date().toISOString()
      })
      setQrConfirmStatus('success')
    } catch (err) {
      console.error("Failed to approve QR login session:", err)
      setError("Failed to authorize. The session may have expired or is invalid.")
      setQrConfirmStatus('error')
    }
  }

  const handleRejectQrLogin = async () => {
    if (!qrScanSessionId) return
    try {
      const dbInstance = getFirebaseDb()
      if (dbInstance) {
        const sessionDocRef = doc(dbInstance, 'qr_logins', qrScanSessionId)
        await updateDoc(sessionDocRef, {
          status: 'rejected',
          rejectedAt: new Date().toISOString()
        })
      }
    } catch (err) {
      console.error("Failed to reject QR login session:", err)
    }
    setQrScanSessionId('')
    window.history.replaceState({}, document.title, window.location.pathname)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  if (qrScanSessionId) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl -z-10" />
        
        <div className="text-center mb-8">
          <QrCode className="w-12 h-12 text-violet-400 mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-extrabold text-white tracking-tight mb-2">
            Device Authentication
          </h2>
          <p className="text-slate-400 text-sm">
            Sync your watchlist account to another device.
          </p>
        </div>

        {qrConfirmStatus === 'success' ? (
          <div className="text-center space-y-4 py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Authorization Complete</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              You have successfully authorized the other device. You can now close this window on your phone.
            </p>
            <button
              onClick={() => {
                setQrScanSessionId('')
                window.history.replaceState({}, document.title, window.location.pathname)
              }}
              className="mt-2 w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2.5 rounded-xl text-xs cursor-pointer"
            >
              Back to Sign In
            </button>
          </div>
        ) : currentUser ? (
          <div className="space-y-6 py-2">
            <div className="bg-[#101424] border border-slate-800 rounded-xl p-4 text-center">
              <span className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Signed in as</span>
              <span className="block text-sm font-semibold text-white truncate">{currentUser.email}</span>
            </div>

            <p className="text-xs text-slate-400 text-center">
              Clicking below will securely authorize the request and log you in on the other device.
            </p>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleConfirmQrLogin}
                disabled={qrConfirmStatus === 'loading'}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {qrConfirmStatus === 'loading' ? (
                  <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  "Confirm Sign In"
                )}
              </button>
              <button
                onClick={handleRejectQrLogin}
                className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-semibold py-2.5 rounded-xl transition-all text-xs cursor-pointer"
              >
                Reject Request
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-3 bg-amber-950/40 border border-amber-500/30 text-amber-300 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>You are not signed in on this phone. Please sign in below to authorize the other device.</span>
            </div>

            <div className="border border-slate-800/80 rounded-xl p-4 bg-[#0a0d18]">
              <AuthForm 
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                loading={loading}
                handleAuth={handleAuth}
                isSignUp={isSignUp}
                setIsSignUp={setIsSignUp}
                handleGoogleAuth={handleGoogleAuth}
                error={error}
                setError={setError}
                message={message}
                setMessage={setMessage}
              />
            </div>
            
            <button
              onClick={() => {
                setQrScanSessionId('')
                window.history.replaceState({}, document.title, window.location.pathname)
              }}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Cancel Sync Request
            </button>
          </div>
        )}
      </div>
    )
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

      <AuthForm 
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        loading={loading}
        handleAuth={handleAuth}
        isSignUp={isSignUp}
        setIsSignUp={setIsSignUp}
        handleGoogleAuth={handleGoogleAuth}
        error={error}
        setError={setError}
        message={message}
        setMessage={setMessage}
      />

      {!isSignUp && (
        <>
          <div className="relative my-4 text-center">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-800/40" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-slate-900 px-3 text-slate-500 rounded-full">Or use Device Sync</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleQrAuthStart}
            disabled={loading}
            className="w-full bg-[#101424] hover:bg-[#181e36] border border-slate-800 hover:border-slate-700 text-slate-200 font-semibold py-3 rounded-xl transition-all transform active:scale-95 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <QrCode className="w-5 h-5 text-violet-400" />
            Sign in with QR Code
          </button>
        </>
      )}

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-[#0b0e17] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-violet-600/10 rounded-full blur-3xl -z-10" />

            <div>
              <h3 className="text-xl font-bold text-white flex items-center justify-center gap-2">
                <QrCode className="w-5 h-5 text-violet-400" />
                Scan to Sign In
              </h3>
              <p className="text-xs text-slate-400 mt-2 max-w-[260px] mx-auto leading-relaxed">
                Scan this QR code with a phone where you are already signed in to CineLog to authorize this browser.
              </p>
            </div>

            {/* QR Code display */}
            <div className="relative bg-white p-4 rounded-2xl inline-block shadow-lg mx-auto">
              <img
                src={qrCodeUrl}
                alt="Sign In QR Code"
                className="w-48 h-48 sm:w-56 sm:h-56 mx-auto object-contain"
              />
              <div className="absolute inset-0 border border-slate-100 rounded-2xl pointer-events-none" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-300">
                <span className="w-2.5 h-2.5 bg-violet-500 rounded-full animate-ping" />
                <span>Waiting for approval from phone...</span>
              </div>

              <div className="text-xs text-slate-500">
                Code expires in <span className="text-amber-400 font-bold">{formatTime(qrTimeLeft)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCloseQrModal}
              className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-semibold py-2.5 rounded-xl transition-all cursor-pointer text-xs"
            >
              Cancel Sync
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
