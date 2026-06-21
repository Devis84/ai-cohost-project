import { initializeApp, getApps, cert, type App } from 'firebase-admin/app'
import { getMessaging, type Messaging } from 'firebase-admin/messaging'

let cachedApp: App | null = null

function isFirebaseConfigured(): boolean {
  return Boolean(process.env.FIREBASE_PROJECT_ID)
}

function createFirebaseApp(): App {
  const existingApps = getApps()
  if (existingApps.length > 0) {
    return existingApps[0]
  }

  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY ?? ''
  const privateKey = privateKeyRaw.replace(/\\n/g, '\n')

  const app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  })

  return app
}

export function getFirebaseAdmin(): App | null {
  if (!isFirebaseConfigured()) {
    return null
  }

  if (!cachedApp) {
    cachedApp = createFirebaseApp()
  }

  return cachedApp
}

export function getFirebaseMessaging(): Messaging | null {
  const app = getFirebaseAdmin()
  if (!app) {
    return null
  }

  return getMessaging(app)
}
