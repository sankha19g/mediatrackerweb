import { initializeApp, getApps, getApp } from 'firebase/app'
import { 
  getAuth,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously
} from 'firebase/auth'
import { 
  getFirestore,
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where,
  writeBatch
} from 'firebase/firestore'

// Permanent hardcoded Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBuY215PkLdU1A9HIpFKjiZe5x0h-yO29I",
  authDomain: "media-tracker-sankha.firebaseapp.com",
  projectId: "media-tracker-sankha",
  storageBucket: "media-tracker-sankha.firebasestorage.app",
  messagingSenderId: "642405405496",
  appId: "1:642405405496:web:85b7fc19cc69c1dc2467cd"
};

export const getFirebaseConfig = () => {
  return firebaseConfig
}

export const isFirebaseConfigured = () => {
  return true
}

let app = null
let auth = null
let db = null

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
  auth = getAuth(app)
  db = getFirestore(app)
} catch (error) {
  console.error("Failed to initialize Firebase client:", error)
}

export const getFirebaseApp = () => app
export const getFirebaseAuth = () => auth
export const getFirebaseDb = () => db

// Auth Helpers
let qrUser = null
try {
  const savedQrUser = localStorage.getItem('qr_user_session')
  if (savedQrUser) {
    qrUser = JSON.parse(savedQrUser)
  }
} catch (e) {
  console.error("Failed to load QR user session:", e)
}

let authListeners = []

export const setQrUser = (user) => {
  qrUser = user
  if (user) {
    localStorage.setItem('qr_user_session', JSON.stringify(user))
  } else {
    localStorage.removeItem('qr_user_session')
  }
  authListeners.forEach(listener => {
    try {
      listener(user)
    } catch (e) {
      console.error("Error in auth listener:", e)
    }
  })
}

export const firebaseSignInAnonymously = async () => {
  const authInstance = getFirebaseAuth()
  if (!authInstance) throw new Error("Firebase Auth not initialized")
  try {
    const userCredential = await signInAnonymously(authInstance)
    return userCredential.user
  } catch (err) {
    console.warn("Failed to sign in anonymously (Anonymous Auth might be disabled in Firebase Console):", err)
    return null
  }
}

export const firebaseSignUp = async (email, password) => {
  const authInstance = getFirebaseAuth()
  if (!authInstance) throw new Error("Firebase Auth not initialized")
  const userCredential = await createUserWithEmailAndPassword(authInstance, email, password)
  return userCredential.user
}

export const firebaseSignIn = async (email, password) => {
  const authInstance = getFirebaseAuth()
  if (!authInstance) throw new Error("Firebase Auth not initialized")
  const userCredential = await signInWithEmailAndPassword(authInstance, email, password)
  return userCredential.user
}

export const firebaseSignInWithGoogle = async () => {
  const authInstance = getFirebaseAuth()
  if (!authInstance) throw new Error("Firebase Auth not initialized")
  const provider = new GoogleAuthProvider()
  // Add prompt select_account to allow choosing account every time
  provider.setCustomParameters({ prompt: 'select_account' })
  const userCredential = await signInWithPopup(authInstance, provider)
  return userCredential.user
}

export const firebaseSignOut = async () => {
  const authInstance = getFirebaseAuth()
  if (!authInstance) throw new Error("Firebase Auth not initialized")
  setQrUser(null)
  await signOut(authInstance)
}

export const onFirebaseAuthStateChanged = (callback) => {
  authListeners.push(callback)
  
  if (qrUser) {
    callback(qrUser)
  }
  
  const authInstance = getFirebaseAuth()
  let unsubscribeAuth = () => {}
  if (authInstance) {
    unsubscribeAuth = onAuthStateChanged(authInstance, (user) => {
      if (!qrUser) {
        callback(user)
      }
    })
  }
  
  return () => {
    authListeners = authListeners.filter(l => l !== callback)
    unsubscribeAuth()
  }
}

// Firestore Helpers
export const loadFirebaseItems = async (userId) => {
  const dbInstance = getFirebaseDb()
  if (!dbInstance) throw new Error("Firebase database not initialized")
  const q = query(collection(dbInstance, 'media_items'), where('user_id', '==', userId))
  const querySnapshot = await getDocs(q)
  const items = []
  querySnapshot.forEach((doc) => {
    items.push({ id: doc.id, ...doc.data() })
  })
  // Sort by watched_at descending
  return items.sort((a, b) => new Date(b.watched_at || 0) - new Date(a.watched_at || 0))
}

export const addFirebaseItem = async (userId, item) => {
  const dbInstance = getFirebaseDb()
  if (!dbInstance) throw new Error("Firebase database not initialized")
  const itemData = {
    user_id: userId,
    title: item.title || '',
    type: item.type || 'movie',
    tmdb_id: item.tmdb_id || '',
    season_number: item.season_number || null,
    season_progress: item.season_progress !== undefined ? item.season_progress : null,
    seasons_watched: Array.isArray(item.seasons_watched) ? item.seasons_watched : [],
    poster_path: item.poster_path || '',
    rating: Number(item.rating) || 0,
    review: item.review || '',
    release_year: item.release_year || '',
    release_date: item.release_date || '',
    status: item.status || 'completed',
    country: item.country || '',
    original_language: item.original_language || '',
    vote_average: item.vote_average !== undefined ? Number(item.vote_average) : 0,
    popularity: item.popularity !== undefined ? Number(item.popularity) : 0,
    watched_at: item.watched_at || new Date().toISOString(),
    created_at: item.created_at || new Date().toISOString()
  }
  const docRef = await addDoc(collection(dbInstance, 'media_items'), itemData)
  return { id: docRef.id, ...itemData }
}

export const migrateLocalItemsToFirebase = async (userId, localItems) => {
  const dbInstance = getFirebaseDb()
  if (!dbInstance) throw new Error("Firebase database not initialized")
  const batch = writeBatch(dbInstance)
  const itemsCollection = collection(dbInstance, 'media_items')
  const addedItems = []

  for (const item of localItems) {
    const docRef = doc(itemsCollection) // generate random doc ID
    const itemData = {
      user_id: userId,
      title: item.title || '',
      type: item.type || 'movie',
      tmdb_id: item.tmdb_id || '',
      season_number: item.season_number || null,
      season_progress: item.season_progress !== undefined ? item.season_progress : null,
      seasons_watched: Array.isArray(item.seasons_watched) ? item.seasons_watched : [],
      poster_path: item.poster_path || '',
      rating: Number(item.rating) || 0,
      review: item.review || '',
      release_year: item.release_year || '',
      release_date: item.release_date || '',
      status: item.status || 'completed',
      country: item.country || '',
      original_language: item.original_language || '',
      vote_average: item.vote_average !== undefined ? Number(item.vote_average) : 0,
      popularity: item.popularity !== undefined ? Number(item.popularity) : 0,
      watched_at: item.watched_at || new Date().toISOString(),
      created_at: item.created_at || new Date().toISOString()
    }
    batch.set(docRef, itemData)
    addedItems.push({ id: docRef.id, ...itemData })
  }

  await batch.commit()
  return addedItems
}

export const updateFirebaseItem = async (itemId, updates) => {
  const dbInstance = getFirebaseDb()
  if (!dbInstance) throw new Error("Firebase database not initialized")
  const docRef = doc(dbInstance, 'media_items', itemId)
  
  // Dynamic update of all fields that are provided
  const firestoreUpdates = {}
  Object.keys(updates).forEach(key => {
    if (updates[key] !== undefined && key !== 'id' && key !== 'user_id') {
      firestoreUpdates[key] = updates[key]
    }
  })
  
  await updateDoc(docRef, firestoreUpdates)
}

export const deleteFirebaseItem = async (itemId) => {
  const dbInstance = getFirebaseDb()
  if (!dbInstance) throw new Error("Firebase database not initialized")
  const docRef = doc(dbInstance, 'media_items', itemId)
  await deleteDoc(docRef)
}

// Custom Lists Firestore Helpers
export const loadFirebaseLists = async (userId, type) => {
  const dbInstance = getFirebaseDb()
  if (!dbInstance) throw new Error("Firebase database not initialized")
  const q = query(
    collection(dbInstance, 'custom_lists'), 
    where('user_id', '==', userId), 
    where('type', '==', type)
  )
  const querySnapshot = await getDocs(q)
  const lists = []
  querySnapshot.forEach((doc) => {
    lists.push({ id: doc.id, ...doc.data() })
  })
  return lists.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
}

export const addFirebaseList = async (userId, name, description, type, thumbnailUrl = '', bannerUrl = '', extraFields = {}) => {
  const dbInstance = getFirebaseDb()
  if (!dbInstance) throw new Error("Firebase database not initialized")
  const listData = {
    user_id: userId,
    name: name || '',
    description: description || '',
    type: type || 'movie',
    thumbnail_url: thumbnailUrl || '',
    banner_url: bannerUrl || '',
    item_ids: [],
    created_at: new Date().toISOString(),
    ...extraFields
  }
  const docRef = await addDoc(collection(dbInstance, 'custom_lists'), listData)
  return { id: docRef.id, ...listData }
}

export const updateFirebaseListItems = async (listId, itemIds) => {
  const dbInstance = getFirebaseDb()
  if (!dbInstance) throw new Error("Firebase database not initialized")
  const docRef = doc(dbInstance, 'custom_lists', listId)
  await updateDoc(docRef, { item_ids: itemIds })
}

export const updateFirebaseList = async (listId, updates) => {
  const dbInstance = getFirebaseDb()
  if (!dbInstance) throw new Error("Firebase database not initialized")
  const docRef = doc(dbInstance, 'custom_lists', listId)
  
  const firestoreUpdates = {}
  Object.keys(updates).forEach(key => {
    if (updates[key] !== undefined && key !== 'id' && key !== 'user_id') {
      firestoreUpdates[key] = updates[key]
    }
  })
  
  await updateDoc(docRef, firestoreUpdates)
}

export const deleteFirebaseList = async (listId) => {
  const dbInstance = getFirebaseDb()
  if (!dbInstance) throw new Error("Firebase database not initialized")
  const docRef = doc(dbInstance, 'custom_lists', listId)
  await deleteDoc(docRef)
}

export const batchAddFirebaseItems = async (userId, itemsList) => {
  const dbInstance = getFirebaseDb()
  if (!dbInstance) throw new Error("Firebase database not initialized")
  
  const CHUNK_SIZE = 400
  const addedItems = []
  const itemsCollection = collection(dbInstance, 'media_items')
  
  for (let i = 0; i < itemsList.length; i += CHUNK_SIZE) {
    const chunk = itemsList.slice(i, i + CHUNK_SIZE)
    const batch = writeBatch(dbInstance)
    
    for (const item of chunk) {
      const docRef = doc(itemsCollection)
      const itemData = {
        user_id: userId,
        title: item.title || '',
        type: item.type || 'movie',
        tmdb_id: item.tmdb_id || '',
        season_number: item.season_number || null,
        season_progress: item.season_progress !== undefined ? item.season_progress : null,
        seasons_watched: Array.isArray(item.seasons_watched) ? item.seasons_watched : [],
        poster_path: item.poster_path || '',
        rating: Number(item.rating) || 0,
        review: item.review || '',
        release_year: item.release_year || '',
        release_date: item.release_date || '',
        status: item.status || 'completed',
        country: item.country || '',
        original_language: item.original_language || '',
        vote_average: item.vote_average !== undefined ? Number(item.vote_average) : 0,
        popularity: item.popularity !== undefined ? Number(item.popularity) : 0,
        watched_at: item.watched_at || new Date().toISOString(),
        created_at: item.created_at || new Date().toISOString()
      }
      batch.set(docRef, itemData)
      addedItems.push({ id: docRef.id, ...itemData })
    }
    
    await batch.commit()
  }
  
  return addedItems
}

// Video Sources Helpers
export const loadFirebaseSources = async (userId) => {
  const dbInstance = getFirebaseDb()
  if (!dbInstance) throw new Error("Firebase database not initialized")

  const sourcesMap = new Map()

  // Query user's private sources
  if (userId) {
    const qUser = query(collection(dbInstance, 'video_sources'), where('user_id', '==', userId))
    const userSnapshot = await getDocs(qUser)
    userSnapshot.forEach((doc) => {
      sourcesMap.set(doc.id, { id: doc.id, ...doc.data() })
    })
  }

  // Query public sources
  const qPublic = query(collection(dbInstance, 'video_sources'), where('is_public', '==', true))
  const publicSnapshot = await getDocs(qPublic)
  publicSnapshot.forEach((doc) => {
    sourcesMap.set(doc.id, { id: doc.id, ...doc.data() })
  })

  const sources = Array.from(sourcesMap.values())
  return sources.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0))
}

export const addFirebaseSource = async (userId, name, url, isPublic = false) => {
  const dbInstance = getFirebaseDb()
  if (!dbInstance) throw new Error("Firebase database not initialized")
  const sourceData = {
    user_id: userId,
    name: name || '',
    url: url || '',
    is_public: !!isPublic,
    created_at: new Date().toISOString()
  }
  const docRef = await addDoc(collection(dbInstance, 'video_sources'), sourceData)
  return { id: docRef.id, ...sourceData }
}

export const deleteFirebaseSource = async (sourceId) => {
  const dbInstance = getFirebaseDb()
  if (!dbInstance) throw new Error("Firebase database not initialized")
  const docRef = doc(dbInstance, 'video_sources', sourceId)
  await deleteDoc(docRef)
}

export const updateFirebaseSource = async (sourceId, name, url, isPublic) => {
  const dbInstance = getFirebaseDb()
  if (!dbInstance) throw new Error("Firebase database not initialized")
  const docRef = doc(dbInstance, 'video_sources', sourceId)
  const updateData = {}
  if (name !== undefined) updateData.name = name
  if (url !== undefined) updateData.url = url
  if (isPublic !== undefined) updateData.is_public = !!isPublic
  await updateDoc(docRef, updateData)
}

// Download Sources Helpers
export const loadFirebaseDownloadSources = async (userId) => {
  const dbInstance = getFirebaseDb()
  if (!dbInstance) throw new Error("Firebase database not initialized")

  const sourcesMap = new Map()

  // Query user's private sources
  if (userId) {
    const qUser = query(collection(dbInstance, 'download_sources'), where('user_id', '==', userId))
    const userSnapshot = await getDocs(qUser)
    userSnapshot.forEach((doc) => {
      sourcesMap.set(doc.id, { id: doc.id, ...doc.data() })
    })
  }

  // Query public download sources
  const qPublic = query(collection(dbInstance, 'download_sources'), where('is_public', '==', true))
  const publicSnapshot = await getDocs(qPublic)
  publicSnapshot.forEach((doc) => {
    sourcesMap.set(doc.id, { id: doc.id, ...doc.data() })
  })

  const sources = Array.from(sourcesMap.values())
  return sources.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0))
}

export const addFirebaseDownloadSource = async (userId, name, url, isPublic = false) => {
  const dbInstance = getFirebaseDb()
  if (!dbInstance) throw new Error("Firebase database not initialized")
  const sourceData = {
    user_id: userId,
    name: name || '',
    url: url || '',
    is_public: !!isPublic,
    created_at: new Date().toISOString()
  }
  const docRef = await addDoc(collection(dbInstance, 'download_sources'), sourceData)
  return { id: docRef.id, ...sourceData }
}

export const deleteFirebaseDownloadSource = async (sourceId) => {
  const dbInstance = getFirebaseDb()
  if (!dbInstance) throw new Error("Firebase database not initialized")
  const docRef = doc(dbInstance, 'download_sources', sourceId)
  await deleteDoc(docRef)
}

export const updateFirebaseDownloadSource = async (sourceId, name, url, isPublic) => {
  const dbInstance = getFirebaseDb()
  if (!dbInstance) throw new Error("Firebase database not initialized")
  const docRef = doc(dbInstance, 'download_sources', sourceId)
  const updateData = {}
  if (name !== undefined) updateData.name = name
  if (url !== undefined) updateData.url = url
  if (isPublic !== undefined) updateData.is_public = !!isPublic
  await updateDoc(docRef, updateData)
}

// Saved Sites Helpers
export const loadFirebaseSavedSites = async (userId) => {
  const dbInstance = getFirebaseDb()
  if (!dbInstance) throw new Error("Firebase database not initialized")
  const q = query(collection(dbInstance, 'saved_sites'), where('user_id', '==', userId))
  const querySnapshot = await getDocs(q)
  const sites = []
  querySnapshot.forEach((doc) => {
    sites.push({ id: doc.id, ...doc.data() })
  })
  return sites.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0))
}

export const addFirebaseSavedSite = async (userId, name, url, imageUrl, category) => {
  const dbInstance = getFirebaseDb()
  if (!dbInstance) throw new Error("Firebase database not initialized")
  const siteData = {
    user_id: userId,
    name: name || '',
    url: url || '',
    image_url: imageUrl || '',
    category: category || 'movies_tvshows',
    created_at: new Date().toISOString()
  }
  const docRef = await addDoc(collection(dbInstance, 'saved_sites'), siteData)
  return { id: docRef.id, ...siteData }
}

export const deleteFirebaseSavedSite = async (siteId) => {
  const dbInstance = getFirebaseDb()
  if (!dbInstance) throw new Error("Firebase database not initialized")
  const docRef = doc(dbInstance, 'saved_sites', siteId)
  await deleteDoc(docRef)
}

export const updateFirebaseSavedSite = async (siteId, siteData) => {
  const dbInstance = getFirebaseDb()
  if (!dbInstance) throw new Error("Firebase database not initialized")
  const docRef = doc(dbInstance, 'saved_sites', siteId)
  // Omit created_at and id if passed
  const { id, created_at, ...updateData } = siteData
  await updateDoc(docRef, updateData)
}


