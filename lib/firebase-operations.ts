import { db, storage, isDemoMode } from "./firebase"
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import type { Patient, AttendanceRecord } from "@/types/patient"

// Demo data storage
let demoPatients: Patient[] = [
  {
    id: "demo-1",
    name: "John Doe",
    patientId: "PT-ABC123",
    contact: "+1234567890",
    address: "123 Main St, City, State 12345",
    profileImage: "/placeholder.svg?height=100&width=100",
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    id: "demo-2",
    name: "Jane Smith",
    patientId: "PT-DEF456",
    contact: "+0987654321",
    address: "456 Oak Ave, Town, State 67890",
    profileImage: "/placeholder.svg?height=100&width=100",
    createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
  },
  {
    id: "demo-3",
    name: "Robert Johnson",
    patientId: "PT-GHI789",
    contact: "+1122334455",
    address: "789 Pine Ln, Village, State 98765",
    profileImage: "/placeholder.svg?height=100&width=100",
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
  },
  {
    id: "demo-4",
    name: "Emily White",
    patientId: "PT-JKL012",
    contact: "+9988776655",
    address: "101 Cedar Rd, Hamlet, State 54321",
    profileImage: "/placeholder.svg?height=100&width=100",
    createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
  },
]

let demoAttendance: AttendanceRecord[] = [
  {
    id: "att-1",
    patientId: "demo-1",
    status: "present",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "att-2",
    patientId: "demo-1",
    status: "present",
    timestamp: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: "att-3",
    patientId: "demo-2",
    status: "absent",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "att-4",
    patientId: "demo-3",
    status: "present",
    timestamp: new Date().toISOString(),
  },
]

// Demo mode listeners
const demoListeners: ((patients: Patient[]) => void)[] = []

const notifyDemoListeners = (): void => {
  demoListeners.forEach((listener) => listener([...demoPatients]))
}

// Function to generate a unique human-readable patient ID
const generateUniquePatientId = (): string => {
  const timestampPart = Date.now().toString().slice(-6)
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `PT-${timestampPart}-${randomPart}`
}

// Function to upload image to Firebase Storage
const uploadImageToStorage = async (imageDataUrl: string, patientId: string): Promise<string> => {
  if (!storage) {
    throw new Error("Firebase Storage not initialized")
  }

  try {
    // Convert data URL to blob
    const response = await fetch(imageDataUrl)
    const blob = await response.blob()

    // Create a reference to the storage location
    const imageRef = ref(storage, `patient-images/${patientId}-${Date.now()}`)

    // Upload the image
    const snapshot = await uploadBytes(imageRef, blob)

    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref)

    return downloadURL
  } catch (error) {
    console.error("Error uploading image:", error)
    throw new Error("Failed to upload image")
  }
}

// Function to delete image from Firebase Storage
const deleteImageFromStorage = async (imageUrl: string): Promise<void> => {
  if (!storage || !imageUrl || imageUrl.includes("placeholder.svg")) {
    return // Don't try to delete placeholder images or if storage is not available
  }

  try {
    const imageRef = ref(storage, imageUrl)
    await deleteObject(imageRef)
  } catch (error) {
    console.error("Error deleting image:", error)
    // Don't throw error here as it's not critical
  }
}

export const addPatient = async (patientData: Omit<Patient, "id" | "createdAt" | "patientId">): Promise<string> => {
  const newPatientId = generateUniquePatientId()

  if (isDemoMode) {
    const newPatient: Patient = {
      ...patientData,
      id: `demo-${Date.now()}`,
      patientId: newPatientId,
      createdAt: new Date().toISOString(),
    }
    demoPatients.unshift(newPatient)
    notifyDemoListeners()
    return newPatient.id
  }

  if (!db) {
    throw new Error("Firestore not initialized")
  }

  try {
    let profileImageUrl = patientData.profileImage

    // If there's a profile image and it's a data URL, upload it to Storage
    if (profileImageUrl && profileImageUrl.startsWith("data:")) {
      profileImageUrl = await uploadImageToStorage(profileImageUrl, newPatientId)
    }

    const docRef = await addDoc(collection(db, "patients"), {
      ...patientData,
      profileImage: profileImageUrl,
      patientId: newPatientId,
      createdAt: serverTimestamp(),
    })

    return docRef.id
  } catch (error) {
    console.error("Error adding patient:", error)
    throw error
  }
}

export const updatePatient = async (patientId: string, patientData: Partial<Patient>): Promise<void> => {
  if (isDemoMode) {
    const index = demoPatients.findIndex((p) => p.id === patientId)
    if (index !== -1) {
      demoPatients[index] = { ...demoPatients[index], ...patientData }
      notifyDemoListeners()
    }
    return
  }

  if (!db) {
    throw new Error("Firestore not initialized")
  }

  try {
    let profileImageUrl = patientData.profileImage

    // If there's a new profile image and it's a data URL, upload it to Storage
    if (profileImageUrl && profileImageUrl.startsWith("data:")) {
      // Get the current patient data to delete old image if exists
      const currentPatientDoc = await getDocs(query(collection(db, "patients"), where("__name__", "==", patientId)))
      const currentPatient = currentPatientDoc.docs[0]?.data() as Patient

      // Delete old image if it exists and is not a placeholder
      if (currentPatient?.profileImage) {
        await deleteImageFromStorage(currentPatient.profileImage)
      }

      // Upload new image
      profileImageUrl = await uploadImageToStorage(profileImageUrl, patientId)
    }

    const patientRef = doc(db, "patients", patientId)
    await updateDoc(patientRef, {
      ...patientData,
      profileImage: profileImageUrl,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error updating patient:", error)
    throw error
  }
}

export const deletePatient = async (patientId: string): Promise<void> => {
  if (isDemoMode) {
    demoPatients = demoPatients.filter((p) => p.id !== patientId)
    demoAttendance = demoAttendance.filter((a) => a.patientId !== patientId)
    notifyDemoListeners()
    return
  }

  if (!db) {
    throw new Error("Firestore not initialized")
  }

  try {
    // Get patient data to delete associated image
    const patientDoc = await getDocs(query(collection(db, "patients"), where("__name__", "==", patientId)))
    const patient = patientDoc.docs[0]?.data() as Patient

    // Delete profile image if it exists
    if (patient?.profileImage) {
      await deleteImageFromStorage(patient.profileImage)
    }

    // Delete patient document
    await deleteDoc(doc(db, "patients", patientId))

    // Delete associated attendance records
    const attendanceQuery = query(collection(db, "attendance"), where("patientId", "==", patientId))
    const attendanceSnapshot = await getDocs(attendanceQuery)
    const deletePromises = attendanceSnapshot.docs.map((doc) => deleteDoc(doc.ref))
    await Promise.all(deletePromises)
  } catch (error) {
    console.error("Error deleting patient:", error)
    throw error
  }
}

export const markAttendance = async (patientId: string, status: "present" | "absent"): Promise<void> => {
  if (isDemoMode) {
    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      patientId,
      status,
      timestamp: new Date().toISOString(),
    }
    demoAttendance.unshift(newRecord)
    return
  }

  if (!db) {
    throw new Error("Firestore not initialized")
  }

  await addDoc(collection(db, "attendance"), {
    patientId,
    status,
    timestamp: serverTimestamp(),
  })
}

export const updateAttendance = async (attendanceId: string, status: "present" | "absent"): Promise<void> => {
  if (isDemoMode) {
    const index = demoAttendance.findIndex((a) => a.id === attendanceId)
    if (index !== -1) {
      demoAttendance[index] = { ...demoAttendance[index], status, timestamp: new Date().toISOString() }
    }
    return
  }

  if (!db) {
    throw new Error("Firestore not initialized")
  }

  const attendanceRef = doc(db, "attendance", attendanceId)
  await updateDoc(attendanceRef, {
    status,
    timestamp: serverTimestamp(),
  })
}

export const getPatientAttendance = async (patientId: string): Promise<AttendanceRecord[]> => {
  if (isDemoMode) {
    return demoAttendance
      .filter((record) => record.patientId === patientId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  if (!db) {
    throw new Error("Firestore not initialized")
  }

  const q = query(collection(db, "attendance"), where("patientId", "==", patientId), orderBy("timestamp", "desc"))
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
  })) as AttendanceRecord[]
}

export const subscribeToPatients = (callback: (patients: Patient[]) => void): (() => void) => {
  if (isDemoMode) {
    demoListeners.push(callback)
    callback([...demoPatients])
    return () => {
      const index = demoListeners.indexOf(callback)
      if (index > -1) {
        demoListeners.splice(index, 1)
      }
    }
  }

  if (!db) {
    callback([])
    return () => {}
  }

  const q = query(collection(db, "patients"), orderBy("createdAt", "desc"))
  return onSnapshot(q, (snapshot) => {
    const patientsData = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    })) as Patient[]
    callback(patientsData)
  })
}
