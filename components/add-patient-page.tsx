"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import type { Patient } from "@/types/patient"
import { addPatient, updatePatient } from "@/lib/firebase-operations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Camera, Upload, Save, UserPlus, Mic, Loader2 } from "lucide-react"

interface AddPatientPageProps {
  patient?: Patient
  onBack: () => void
}

interface ParsedPatientData {
  name?: string
  age?: number
  address?: string
  contact?: string
}

// Function to compress image
const compressImage = (file: File, maxWidth = 400, quality = 0.8): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")!
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
      canvas.width = img.width * ratio
      canvas.height = img.height * ratio

      // Draw and compress
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL("image/jpeg", quality))
    }

    img.src = URL.createObjectURL(file)
  })
}

export default function AddPatientPage({ patient, onBack }: AddPatientPageProps) {
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    address: "",
    profileImage: "",
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isListening, setIsListening] = useState(false)

  const isEditing = !!patient

  useEffect(() => {
    if (patient) {
      setFormData({
        name: patient.name,
        contact: patient.contact,
        address: patient.address,
        profileImage: patient.profileImage || "",
      })
    }
  }, [patient])

  // useEffect(() => {
  //   // Initialize SpeechRecognition
  //   if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
  //     const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  //     recognitionRef.current = new SpeechRecognition()
  //     recognitionRef.current.continuous = false
  //     recognitionRef.current.interimResults = false
  //     recognitionRef.current.lang = "en-US"

  //     recognitionRef.current.onresult = async (event) => {
  //       const transcript = event.results[0][0].transcript
  //       console.log("Transcript:", transcript)
  //       setIsListening(false)
  //       setVoiceProcessing(true)
  //       setMessage("Processing voice command...")

  //       try {
  //         const response = await fetch("/api/parse-patient-voice", {
  //           method: "POST",
  //           headers: {
  //             "Content-Type": "application/json",
  //           },
  //           body: JSON.stringify({ text: transcript }),
  //         })

  //         if (!response.ok) {
  //           throw new Error(`HTTP error! status: ${response.status}`)
  //         }

  //         const parsedData: ParsedPatientData = await response.json()
  //         console.log("Parsed Data:", parsedData)

  //         setFormData((prev) => ({
  //           ...prev,
  //           name: parsedData.name || prev.name,
  //           contact: parsedData.contact || prev.contact,
  //           address: parsedData.address || prev.address,
  //         }))
  //         setMessage("Patient details parsed from voice!")
  //       } catch (error) {
  //         console.error("Error parsing voice command:", error)
  //         setMessage("Failed to parse voice command. Please try again.")
  //       } finally {
  //         setVoiceProcessing(false)
  //         setTimeout(() => setMessage(""), 3000)
  //       }
  //     }

  //     recognitionRef.current.onerror = (event) => {
  //       console.error("Speech recognition error:", event.error)
  //       setIsListening(false)
  //       setVoiceProcessing(false)
  //       setMessage(`Voice input error: ${event.error}. Please try again.`)
  //       setTimeout(() => setMessage(""), 3000)
  //     }

  //     recognitionRef.current.onend = () => {
  //       setIsListening(false)
  //       if (!voiceProcessing && !message) {
  //         setMessage("Voice input ended.")
  //         setTimeout(() => setMessage(""), 2000)
  //       }
  //     }
  //   } else {
  //     console.warn("Speech Recognition API not supported in this browser.")
  //     setMessage("Voice input not supported in your browser.")
  //   }

  //   return () => {
  //     if (recognitionRef.current) {
  //       recognitionRef.current.stop()
  //     }
  //   }
  // }, [voiceProcessing, message])

  // const toggleListening = () => {
  //   if (recognitionRef.current) {
  //     if (isListening) {
  //       recognitionRef.current.stop()
  //       setIsListening(false)
  //       setMessage("Voice input stopped.")
  //     } else {
  //       setFormData({ name: "", contact: "", address: "", profileImage: "" })
  //       setMessage("Listening for patient details...")
  //       recognitionRef.current.start()
  //       setIsListening(true)
  //     }
  //   }
  // }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      if (isEditing && patient) {
        await updatePatient(patient.id, formData)
        setMessage("Patient updated successfully!")
      } else {
        await addPatient(formData)
        setMessage("Patient added successfully!")
        setFormData({ name: "", contact: "", address: "", profileImage: "" })
      }

      setTimeout(() => {
        onBack()
      }, 1500)
    } catch (error) {
      console.error("Error saving patient:", error)
      setMessage("Failed to save patient. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        // Check file size (limit to 5MB before compression)
        if (file.size > 5 * 1024 * 1024) {
          setMessage("Image is too large. Please choose an image smaller than 5MB.")
          return
        }

        setMessage("Compressing image...")

        // Compress the image
        const compressedDataUrl = await compressImage(file, 400, 0.8)
        setFormData((prev) => ({ ...prev, profileImage: compressedDataUrl }))
        setMessage("Image uploaded and compressed successfully!")

        setTimeout(() => setMessage(""), 2000)
      } catch (error) {
        console.error("Error processing image:", error)
        setMessage("Failed to process image. Please try again.")
      }
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-2xl mx-auto">
      {/* Header - Hide back button on mobile */}
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="hidden sm:flex items-center space-x-2 bg-white border-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Button>
        {/* <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {isEditing ? "Edit Patient" : "Add New Patient"}
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            {isEditing ? "Update patient information" : "Fill in the details to add a new patient"}
          </p>
        </div> */}
      </div>

      <Card className="bg-white border-slate-200 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-lg">
            {isEditing ? (
              <Save className="h-5 w-5 mr-2 text-blue-600" />
            ) : (
              <UserPlus className="h-5 w-5 mr-2 text-blue-600" />
            )}
            Patient Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Image Upload */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-20 w-20 sm:h-24 sm:w-24 ring-4 ring-blue-100">
                  <AvatarImage src={formData.profileImage || "/placeholder.svg"} alt="Profile" />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-lg sm:text-xl">
                    {formData.name ? (
                      formData.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                    ) : (
                      <Camera className="h-6 w-6 sm:h-8 sm:w-8" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <Button
                  type="button"
                  size="sm"
                  className="absolute -bottom-2 -right-2 h-7 w-7 sm:h-8 sm:w-8 rounded-full p-0 bg-blue-500 hover:bg-blue-600"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </Button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              <p className="text-xs sm:text-sm text-slate-500 text-center">
                Click the upload button to {isEditing ? "change" : "add"} profile picture
                <br />
                <span className="text-xs text-slate-400">Images will be automatically compressed</span>
              </p>
            </div>

            {/* Voice Input Button */}
            {/* {!isEditing && (
              <div className="flex flex-col items-center space-y-2">
                <Button
                  type="button"
                  onClick={toggleListening}
                  disabled={voiceProcessing || (message && !message.includes("Voice input not supported"))}
                  className={`w-full sm:w-auto px-6 py-3 rounded-full text-white font-semibold transition-all duration-200 ${
                    isListening
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  }`}
                >
                  {voiceProcessing ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <Mic className="h-5 w-5 mr-2" />
                  )}
                  {isListening ? "Stop Listening" : "Add Patient by Voice"}
                </Button>
                {isListening && <p className="text-sm text-purple-600 animate-pulse">Speak now...</p>}
              </div>
            )} */}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-700 font-medium">
                  Full Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Enter patient's full name"
                  className="border-slate-200 focus:border-blue-400 focus:ring-blue-400 bg-white text-sm"
                  required
                />
              </div>

              {isEditing && patient && (
                <div className="space-y-2">
                  <Label htmlFor="patientId" className="text-slate-700 font-medium">
                    Patient ID
                  </Label>
                  <Input
                    id="patientId"
                    value={patient.patientId}
                    disabled
                    className="border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed text-sm"
                  />
                  <p className="text-xs text-slate-500">Patient ID is auto-generated and cannot be changed.</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact" className="text-slate-700 font-medium">
                Contact Number *
              </Label>
              <Input
                id="contact"
                type="tel"
                value={formData.contact}
                onChange={(e) => handleChange("contact", e.target.value)}
                placeholder="Enter contact number"
                className="border-slate-200 focus:border-blue-400 focus:ring-blue-400 bg-white text-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-slate-700 font-medium">
                Address *
              </Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Enter patient's complete address"
                rows={3}
                className="border-slate-200 focus:border-blue-400 focus:ring-blue-400 bg-white text-sm"
                required
              />
            </div>

            {message && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  message.includes("successfully") || message.includes("parsed") || message.includes("compressed")
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : message.includes("Compressing") || message.includes("Processing")
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="w-full sm:w-auto border-slate-200 hover:bg-slate-50 bg-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>{isEditing ? "Updating..." : "Adding..."}</span>
                  </div>
                ) : (
                  <>
                    {isEditing ? <Save className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                    {isEditing ? "Update Patient" : "Add Patient"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
