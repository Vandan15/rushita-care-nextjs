"use client";

import { useState } from "react";
import type { Patient } from "@/types/patient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  Phone,
  MapPin,
  User,
  Calendar,
  Plus,
  Edit,
  ChevronRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNowStrict } from "date-fns";

interface PatientListProps {
  patients: Patient[];
  loading: boolean;
  onEdit: (patient: Patient) => void;
  onViewDetails: (patient: Patient) => void;
  onAddPatient: () => void;
  onViewAnalytics: () => void;
}

export default function PatientList({
  patients,
  loading,
  onEdit,
  onViewDetails,
  onAddPatient,
  onViewAnalytics
}: PatientListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPatients = patients.filter((patient) => {
    console.log(patient);
    return (
      patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient?.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient?.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient?.contact?.includes(searchTerm)
    );
  });

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4 sm:h-5 sm:w-5" />
          <Input
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 sm:pl-10 h-10 sm:h-12 border-slate-200 focus:border-blue-400 focus:ring-blue-400 bg-white text-sm sm:text-base"
          />
        </div>
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-white border-slate-200 shadow-lg">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <Skeleton className="h-12 w-12 sm:h-16 sm:w-16 rounded-full" />
                  <div className="space-y-2 sm:space-y-3 flex-1">
                    <Skeleton className="h-4 sm:h-5 w-24 sm:w-32" />
                    <Skeleton className="h-3 sm:h-4 w-16 sm:w-24" />
                    <Skeleton className="h-3 sm:h-4 w-32 sm:w-40" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Search and Add Patient Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4 sm:h-5 sm:w-5" />
          <Input
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 sm:pl-10 h-10 sm:h-12 border-slate-200 focus:border-blue-400 focus:ring-blue-400 bg-white text-sm sm:text-base"
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={onViewAnalytics}
            className="hidden sm:flex w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
          >
            View Analytics
          </Button>
          <Button
            onClick={onAddPatient}
            className="hidden sm:flex w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
          >
            <Plus className="h-4 w-4" />
            Add Patient
          </Button>
        </div>
      </div>

      {filteredPatients.length === 0 ? (
        <Card className="bg-white border-slate-200 shadow-lg">
          <CardContent className="p-8 sm:p-12 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-700 mb-2">
              No patients found
            </h3>
            <p className="text-sm sm:text-base text-slate-500 mb-4 sm:mb-6">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Add your first patient to get started"}
            </p>
            {!searchTerm && (
              <Button
                onClick={onAddPatient}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              >
                <Plus className="h-4 w-4" />
                Add Your First Patient
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPatients.map((patient) => (
            <Card
              key={patient.id}
              className="bg-white border-slate-200 shadow-lg hover:shadow-xl hover:shadow-blue-100/30 transition-all duration-300 cursor-pointer group"
              onClick={() => onViewDetails(patient)}
            >
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center space-x-3 sm:space-x-4 mb-3">
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-14 w-14 sm:h-16 sm:w-16 ring-2 ring-blue-100 group-hover:ring-blue-200 transition-all">
                      <AvatarImage
                        src={patient.profileImage || "/placeholder.svg"}
                        alt={patient?.name}
                      />
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold text-base sm:text-lg">
                        {patient?.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 text-lg sm:text-xl mb-0.5 group-hover:text-blue-600 transition-colors truncate">
                      {patient.name}
                    </h3>
                    <Badge
                      variant="secondary"
                      className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-medium"
                    >
                      ID: {patient.patientId}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-slate-600 mb-4">
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{patient.contact}</span>
                  </div>
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 mr-2 text-slate-400 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{patient.address}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-slate-400 flex-shrink-0" />
                    <span className="truncate">
                      Added{" "}
                      {formatDistanceToNowStrict(new Date(patient.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(patient);
                    }}
                    className="text-blue-600 hover:bg-blue-50 px-2 py-1 h-auto"
                  >
                    <Edit className="h-4 w-4 mr-1.5" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-600 hover:bg-slate-50 px-2 py-1 h-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetails(patient);
                    }}
                  >
                    View Details
                    <ChevronRight className="h-4 w-4 ml-1.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
