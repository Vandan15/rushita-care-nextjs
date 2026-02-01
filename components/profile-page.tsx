"use client";

import type React from "react";
import { useState, useRef } from "react";
import type { User } from "firebase/auth";
import { updateUserProfile } from "@/lib/auth-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { authService } from "@/lib/auth-service";
import {
  Upload,
  UserIcon,
  Mail,
  Phone,
  Stethoscope,
  LogOut,
  Save,
  ArrowLeft,
} from "lucide-react";

interface ProfilePageProps {
  user: User;
  onBack: () => void;
}

export default function ProfilePage({ user, onBack }: ProfilePageProps) {
  const [formData, setFormData] = useState({
    displayName: user.displayName || "",
    email: user.email || "",
    phone: user.phoneNumber || "",
    specialization: "Physiotherapist",
    bio: "Dedicated physiotherapist committed to helping patients recover and improve their quality of life.",
    photoURL: user.photoURL || "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await updateUserProfile({
        displayName: formData.displayName,
        photoFile: selectedFile || undefined,
        photoURL: selectedFile ? undefined : formData.photoURL,
      });
      setMessage("Profile updated successfully!");
      
      // Clear the file input after successful upload
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage(error instanceof Error ? error.message : "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Create a preview URL for the image
      const previewUrl = URL.createObjectURL(file);
      setPreviewUrl(previewUrl);
      // Set a preview in the form data (this won't be used for upload, just for display)
      setFormData(prev => ({ ...prev, photoURL: previewUrl }));
    }
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
      {/* <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-sm sm:text-base text-gray-600">Manage your account information and preferences</p>
      </div> */}
      <Button
        variant="outline"
        size="sm"
        onClick={onBack}
        className="hidden sm:flex items-center space-x-2 bg-white border-slate-200"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Patients</span>
      </Button>

      {/* Profile Overview */}
      <Card className="bg-white border-slate-200 shadow-lg">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
            <div className="relative">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24 ring-4 ring-blue-100">
                <AvatarImage
                  src={previewUrl || formData.photoURL || "/placeholder.svg"}
                  alt="Profile"
                  className="object-cover"
                />
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xl sm:text-2xl font-bold">
                  {(formData.displayName || formData.email)
                    ?.charAt(0)
                    .toUpperCase()}
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
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            <div className="text-center md:text-left">
              <h2 className="text-lg sm:text-2xl font-bold text-slate-800">
                {formData.displayName || formData.email?.split("@")[0]}
              </h2>
              <Badge className="bg-blue-50 text-blue-700 border-blue-200 mb-2">
                {formData.specialization}
              </Badge>
              <p className="text-slate-600 max-w-md text-sm">{formData.bio}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <Card className="bg-white border-slate-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-base sm:text-lg">
            <UserIcon className="h-5 w-5 mr-2 text-blue-600" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="displayName"
                  className="text-slate-700 font-medium"
                >
                  Full Name *
                </Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="displayName"
                    value={formData.displayName}
                    onChange={(e) =>
                      handleChange("displayName", e.target.value)
                    }
                    placeholder="Enter your full name"
                    className="pl-10 border-slate-200 focus:border-blue-400 focus:ring-blue-400 bg-white text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    value={formData.email}
                    disabled
                    className="pl-10 border-slate-200 bg-slate-50 text-slate-500 text-sm"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Email cannot be changed
                </p>
              </div>
            </div>

            {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-700 font-medium">
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="Enter your phone number"
                    className="pl-10 border-slate-200 focus:border-blue-400 focus:ring-blue-400 bg-white text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="specialization"
                  className="text-slate-700 font-medium"
                >
                  Specialization
                </Label>
                <div className="relative">
                  <Stethoscope className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="specialization"
                    value={formData.specialization}
                    onChange={(e) =>
                      handleChange("specialization", e.target.value)
                    }
                    placeholder="Enter your specialization"
                    className="pl-10 border-slate-200 focus:border-blue-400 focus:ring-blue-400 bg-white text-sm"
                  />
                </div>
              </div>
            </div> */}

            {/* <div className="space-y-2">
              <Label htmlFor="bio" className="text-slate-700 font-medium">
                Professional Bio
              </Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleChange("bio", e.target.value)}
                placeholder="Tell us about your professional background and expertise"
                rows={4}
                className="border-slate-200 focus:border-blue-400 focus:ring-blue-400 bg-white text-sm"
              />
            </div> */}

            {message && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  message.includes("successfully")
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
              >
                <Save className="h-4 w-4" />
                {loading ? "Updating..." : "Update Profile"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card className="bg-white border-slate-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg text-slate-800">
            Account Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* <Separator /> */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="font-medium text-slate-800">Sign Out</h3>
                <p className="text-sm text-slate-600">
                  Sign out of your account on this device
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 bg-white"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
