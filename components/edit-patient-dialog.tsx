"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import type { Patient } from "@/types/patient"
import { updatePatient } from "@/lib/firebase-operations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Camera, Upload } from "lucide-react"

interface EditPatientDialogProps {
  patient: Patient | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function EditPatientDialog({ patient, open, onOpenChange }: EditPatientDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    patientId: "",
    contact: "",
    address: "",
    profileImage: "",
  })
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (patient) {
      setFormData({
        name: patient.name,
        patientId: patient.patientId,
        contact: patient.contact,
        address: patient.address,
        profileImage: patient.profileImage || "",
      })
    }
  }, [patient])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!patient) return

    setLoading(true)

    try {
      await updatePatient(patient.id, formData)
      onOpenChange(false)
    } catch (error) {
      console.error("Error updating patient:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setFormData((prev) => ({ ...prev, profileImage: result }))
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-800">Edit Patient</DialogTitle>
          <DialogDescription className="text-slate-600">Update the patient's information.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Image Upload */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="h-24 w-24 ring-4 ring-blue-100">
                <AvatarImage src={formData.profileImage || "/placeholder.svg"} alt="Profile" />
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xl">
                  {formData.name ? (
                    formData.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                  ) : (
                    <Camera className="h-8 w-8" />
                  )}
                </AvatarFallback>
              </Avatar>
              <Button
                type="button"
                size="sm"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 bg-blue-500 hover:bg-blue-600"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 text-white" />
              </Button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <p className="text-sm text-slate-500">Click the upload button to change profile picture</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-slate-700 font-medium">
                Full Name *
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Enter patient's full name"
                className="border-slate-200 focus:border-blue-400 focus:ring-blue-400"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-patientId" className="text-slate-700 font-medium">
                Patient ID *
              </Label>
              <Input
                id="edit-patientId"
                value={formData.patientId}
                onChange={(e) => handleChange("patientId", e.target.value)}
                placeholder="Enter unique patient ID"
                className="border-slate-200 focus:border-blue-400 focus:ring-blue-400"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-contact" className="text-slate-700 font-medium">
              Contact Number *
            </Label>
            <Input
              id="edit-contact"
              type="tel"
              value={formData.contact}
              onChange={(e) => handleChange("contact", e.target.value)}
              placeholder="Enter contact number"
              className="border-slate-200 focus:border-blue-400 focus:ring-blue-400"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-address" className="text-slate-700 font-medium">
              Address *
            </Label>
            <Textarea
              id="edit-address"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="Enter patient's complete address"
              rows={3}
              className="border-slate-200 focus:border-blue-400 focus:ring-blue-400"
              required
            />
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto border-slate-200 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Updating...</span>
                </div>
              ) : (
                "Update Patient"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
