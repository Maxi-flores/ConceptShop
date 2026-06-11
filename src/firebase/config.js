import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAnalytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
}

const requiredFirebaseVars = ['apiKey', 'authDomain', 'projectId']
const optionalFirebaseVars = ['storageBucket', 'messagingSenderId', 'appId', 'measurementId']

const missingRequiredFirebaseVars = requiredFirebaseVars.filter((key) => !firebaseConfig[key])
const missingOptionalFirebaseVars = optionalFirebaseVars.filter((key) => !firebaseConfig[key])

if (missingRequiredFirebaseVars.length > 0 && typeof console !== 'undefined') {
  console.error('Missing required Firebase environment variables:', missingRequiredFirebaseVars.join(', '))
}

if (missingOptionalFirebaseVars.length > 0 && typeof console !== 'undefined') {
  console.warn('Missing optional Firebase environment variables:', missingOptionalFirebaseVars.join(', '))
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const analytics =
  typeof window !== 'undefined' && firebaseConfig.appId && firebaseConfig.measurementId
    ? getAnalytics(app)
    : null

export default app
