import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from './config'

export const updateUserProfile = async (uid, partialProfile = {}) => {
  if (!uid) {
    throw new Error('Missing user id for profile update.')
  }

  await setDoc(
    doc(db, 'users', uid),
    {
      ...partialProfile,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  )
}
