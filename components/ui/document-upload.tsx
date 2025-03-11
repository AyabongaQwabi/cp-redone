"use client"

import type React from "react"

import { useState, useRef } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { FileText, Upload, X, CheckCircle, AlertCircle, Clock } from "lucide-react"
import { storage } from "@/lib/firebase-client"
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"
import { EmployeeDocumentType } from "@/app/types"

export interface DocumentUploadProps {
  documentType: EmployeeDocumentType
  onUploadComplete: (documentData: {
    name: string
    fileName: string
    fileSize: number
    fileType: string
    url: string
    documentType: EmployeeDocumentType
    uploadDate: Date
  }) => void
  onRemove?: () => void
  existingDocument?: {
    name: string
    fileName: string
    url: string
    status?: "Pending" | "Approved" | "Rejected"
  }
  required?: boolean
  accept?: string
  maxSize?: number // in MB
  className?: string
}

export function DocumentUpload({
  documentType,
  onUploadComplete,
  onRemove,
  existingDocument,
  required = false,
  accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png",
  maxSize = 10, // 10MB default
  className,
}: DocumentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [document, setDocument] = useState(existingDocument)
  const [fileName, setFileName] = useState("")

  const getDocumentTypeLabel = () => {
    switch (documentType) {
      case EmployeeDocumentType.JOB_SPECIFICATION:
        return "Job Specification"
      case EmployeeDocumentType.MEDICAL_CERTIFICATE:
        return "Medical Certificate of Fitness"
      case EmployeeDocumentType.HAZARDOUS_WORK_RECORD:
        return "Record of Hazardous Work"
      case EmployeeDocumentType.HEIGHTS_SPECIFICATION:
        return "Heights Work Specification"
      case EmployeeDocumentType.CONFINED_SPACES_SPECIFICATION:
        return "Confined Spaces Specification"
      case EmployeeDocumentType.NDA:
        return "Non-Disclosure Agreement (NDA)"
      default:
        return "Document"
    }
  }

  const getDocumentStatusIcon = (status?: string) => {
    switch (status) {
      case "Approved":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "Rejected":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case "Pending":
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size exceeds ${maxSize}MB limit`)
      return
    }

    setError(null)
    setIsUploading(true)
    setProgress(0)
    setFileName(file.name)

    try {
      // Create a unique file path
      const fileExtension = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`
      const filePath = `employee-documents/${documentType.toLowerCase().replace(/\s+/g, "-")}/${fileName}`

      // Create a reference to the storage location
      const storageRef = ref(storage, filePath)

      // Upload the file with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, file)

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          setProgress(progress)
        },
        (error) => {
          console.error("Error uploading file:", error)
          setError("Failed to upload file. Please try again.")
          setIsUploading(false)
        },
        async () => {
          // Get the download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)

          const documentData = {
            name: getDocumentTypeLabel(),
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            url: downloadURL,
            documentType: documentType,
            uploadDate: new Date(),
          }

          // Set document and call the callback
          setDocument({
            name: documentData.name,
            fileName: documentData.fileName,
            url: documentData.url,
            status: "Pending",
          })
          onUploadComplete(documentData)
          setIsUploading(false)
        },
      )
    } catch (error) {
      console.error("Error uploading file:", error)
      setError("Failed to upload file. Please try again.")
      setIsUploading(false)
    }
  }

  const handleRemove = () => {
    setDocument(undefined)
    setFileName("")
    if (inputRef.current) {
      inputRef.current.value = ""
    }
    if (onRemove) {
      onRemove()
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Label className={cn(required && "after:content-['*'] after:ml-0.5 after:text-red-500")}>
          {getDocumentTypeLabel()}
        </Label>
        {document && (
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            {getDocumentStatusIcon(document.status)}
            <span>{document.status || "Pending"}</span>
          </div>
        )}
      </div>

      {document ? (
        <div className="rounded-md border border-input bg-background p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 overflow-hidden">
              <FileText className="h-5 w-5 flex-shrink-0 text-blue-500" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{document.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date().toLocaleDateString()} • {document.status || "Pending"}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => window.open(document.url, "_blank")}
              >
                <span className="sr-only">View</span>
                <FileText className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-destructive"
                onClick={handleRemove}
              >
                <span className="sr-only">Remove</span>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative">
          <div
            className={cn(
              "flex flex-col items-center justify-center rounded-md border border-dashed border-input bg-background p-4 transition-colors hover:border-muted-foreground/50",
              error && "border-red-500",
            )}
          >
            <div className="flex flex-col items-center justify-center space-y-2 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Upload className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">{isUploading ? `Uploading ${fileName}...` : "Upload document"}</p>
                <p className="text-xs text-muted-foreground">
                  Drag and drop or click to upload. {accept.replace(/\./g, "").toUpperCase()} (Max: {maxSize}MB)
                </p>
              </div>
            </div>

            {isUploading && (
              <div className="mt-4 w-full space-y-1">
                <Progress value={progress} className="h-1 w-full" />
                <p className="text-xs text-center text-muted-foreground">{Math.round(progress)}%</p>
              </div>
            )}

            <Input
              ref={inputRef}
              type="file"
              className="absolute inset-0 cursor-pointer opacity-0"
              onChange={handleFileChange}
              accept={accept}
              required={required && !document}
            />
          </div>

          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
      )}
    </div>
  )
}

