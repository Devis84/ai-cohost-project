import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getMessaging, type Messaging } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let cachedApp: FirebaseApp | null = null
let cachedMessaging: Messaging | null = null

function getFirebaseApp(): FirebaseApp {
  if (cachedApp) {
    return cachedApp
  }

  const existingApps = getApps()
  if (existingApps.length > 0) {
    cachedApp = existingApps[0]
    return cachedApp
  }

  cachedApp = initializeApp(firebaseConfig)
  return cachedApp
}

export function getFirebaseMessaging(): Messaging | null {
  if (typeof window === 'undefined') {
    return null
  }

  if (cachedMessaging) {
    return cachedMessaging
  }

  try {
    const app = getFirebaseApp()
    cachedMessaging = getMessaging(app)
    return cachedMessaging
  } catch {
    return null
  }
}
