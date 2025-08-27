import { auth, isDemoMode, storage } from "./firebase"
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, type User } from "firebase/auth"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

// Demo user for demo mode
const DEMO_USER: User = {
  uid: "demo-user",
  email: "doctor@demo.com",
  displayName: "Dr. Demo",
  photoURL: null,
  phoneNumber: null,
  emailVerified: true,
  isAnonymous: false,
  providerId: "",
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

interface UpdateProfileData {
  displayName?: string;
  photoURL?: string | null;
  photoFile?: File;
}

export const updateUserProfile = async (profileData: UpdateProfileData) => {
  if (isDemoMode) {
    // In demo mode, just update the demo user object
    if (authService.getCurrentUser()) {
      const currentUser = authService.getCurrentUser()!;
      // Create a new object with updated properties
      const updatedUser = {
        ...currentUser,
        displayName: profileData.displayName !== undefined ? profileData.displayName : currentUser.displayName,
        photoURL: profileData.photoURL !== undefined ? profileData.photoURL : currentUser.photoURL,
      };
      // @ts-ignore - We know this is a private method, but we need to update the user
      authService['currentUser'] = updatedUser;
      // @ts-ignore - Notify listeners of the update
      authService.notifyListeners();
    }
    return
  }

  if (!auth?.currentUser) {
    throw new Error("No authenticated user")
  }

  if (!storage) {
    throw new Error('Storage is not initialized');
  }

  try {
    let photoURL = profileData.photoURL;
    
    // If there's a file to upload, upload it to Firebase Storage first
    if (profileData.photoFile) {
      const fileExtension = profileData.photoFile.name.split('.').pop();
      const storageRef = ref(storage, `profile-pictures/${auth.currentUser.uid}.${fileExtension}`);
      
      // Upload the file
      const snapshot = await uploadBytes(storageRef, profileData.photoFile);
      
      // Get the download URL
      photoURL = await getDownloadURL(snapshot.ref);
    }
    
    // Prepare update data
    const updateData: { displayName?: string; photoURL?: string | null } = {};
    
    if (profileData.displayName !== undefined) {
      updateData.displayName = profileData.displayName;
    }
    
    if (photoURL !== undefined) {
      updateData.photoURL = photoURL;
    } else if (profileData.photoURL === null) {
      // If explicitly setting photoURL to null
      updateData.photoURL = null;
    }
    
    // Only update if there's something to update
    if (Object.keys(updateData).length > 0) {
      await updateProfile(auth.currentUser, updateData);
      
      // Update the local user object by creating a new object with updated properties
      const updatedUser = {
        ...auth.currentUser,
        displayName: profileData.displayName !== undefined ? profileData.displayName : auth.currentUser.displayName,
        photoURL: photoURL !== undefined ? photoURL : auth.currentUser.photoURL,
      };
      
      // Update the auth service's current user
      // @ts-ignore - We know this is a private method, but we need to update the user
      authService['currentUser'] = updatedUser;
      // @ts-ignore - We know this is a private method, but we need to notify listeners
      authService.notifyListeners();
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
}
