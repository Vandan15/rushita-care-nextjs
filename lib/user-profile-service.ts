import { db, isDemoMode } from "./firebase"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import type { UserProfile } from "@/types/user-profile"

// In-memory store for demo mode
let demoUserProfile: UserProfile | null = null

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (isDemoMode) {
    return demoUserProfile
  }

  if (!db) {
    console.error("Firestore not initialized")
    return null
  }

  try {
    const docRef = doc(db, "userProfiles", uid)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return docSnap.data() as UserProfile
    }
    return null
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return null
  }
}

export async function updateUserProfileData(
  uid: string,
  data: Partial<Pick<UserProfile, "registrationNumber" | "address">>
): Promise<void> {
  if (isDemoMode) {
    demoUserProfile = {
      uid,
      registrationNumber: data.registrationNumber ?? demoUserProfile?.registrationNumber ?? "",
      address: data.address ?? demoUserProfile?.address ?? "",
      updatedAt: new Date().toISOString(),
    }
    return
  }

  if (!db) {
    throw new Error("Firestore not initialized")
  }

  try {
    const docRef = doc(db, "userProfiles", uid)
    await setDoc(
      docRef,
      {
        uid,
        ...data,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    )
  } catch (error) {
    console.error("Error updating user profile:", error)
    throw error
  }
}
