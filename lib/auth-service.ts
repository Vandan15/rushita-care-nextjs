import { auth, isDemoMode } from "./firebase"
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, type User } from "firebase/auth"

// Demo user for demo mode
const DEMO_USER: User = {
  uid: "demo-user",
  email: "doctor@demo.com",
  displayName: "Dr. Demo",
  photoURL: null,
  phoneNumber: null,
  emailVerified: true,
  isAnonymous: false,
  metadata: {} as any,
  providerData: [],
  refreshToken: "",
  tenantId: null,
  delete: async () => {},
  getIdToken: async () => "demo-token",
  getIdTokenResult: async () => ({}) as any,
  reload: async () => {},
  toJSON: () => ({}),
} as User

class AuthService {
  private currentUser: User | null = null
  private listeners: ((user: User | null) => void)[] = []

  constructor() {
    if (isDemoMode) {
      this.currentUser = null
    }
  }

  async signIn(email: string, password: string): Promise<void> {
    if (isDemoMode) {
      if (email === "doctor@demo.com" && password === "password123") {
        this.currentUser = DEMO_USER
        this.notifyListeners()
        return
      } else {
        throw new Error("Invalid demo credentials. Use: doctor@demo.com / password123")
      }
    }

    if (!auth) {
      throw new Error("Firebase auth not initialized")
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    this.currentUser = userCredential.user
    this.notifyListeners()
  }

  async signOut(): Promise<void> {
    if (isDemoMode) {
      this.currentUser = null
      this.notifyListeners()
      return
    }

    if (!auth) {
      throw new Error("Firebase auth not initialized")
    }

    await signOut(auth)
    this.currentUser = null
    this.notifyListeners()
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    if (isDemoMode) {
      this.listeners.push(callback)
      callback(this.currentUser)

      return () => {
        this.listeners = this.listeners.filter((listener) => listener !== callback)
      }
    }

    if (!auth) {
      callback(null)
      return () => {}
    }

    return onAuthStateChanged(auth, callback)
  }

  getCurrentUser(): User | null {
    return this.currentUser
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.currentUser))
  }
}

export const authService = new AuthService()

export const updateUserProfile = async (profileData: { displayName?: string; photoURL?: string }) => {
  if (isDemoMode) {
    // In demo mode, just update the demo user object
    if (authService.getCurrentUser()) {
      const currentUser = authService.getCurrentUser()!
      if (profileData.displayName) currentUser.displayName = profileData.displayName
      if (profileData.photoURL) currentUser.photoURL = profileData.photoURL
    }
    return
  }

  if (!auth?.currentUser) {
    throw new Error("No authenticated user")
  }

  await updateProfile(auth.currentUser, profileData)
}
