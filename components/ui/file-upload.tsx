"use client"

import type * as React from "react"
import { useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Upload, X } from "lucide-react"
import { storage } from "@/lib/firebase-client"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

interface FileUploadProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onUploadComplete: (url: string, file: File) => void
  label: string
  accept?: string
  maxSize?: number // in MB
  className?: string
  value?: string
}

export function FileUpload({
  onUploadComplete,
  label,
  accept = "image/*",
  maxSize = 5, // 5MB default
  className,
  value,
  ...props
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(value || null)

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

    try {
      // Create a unique file path
      const fileExtension = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`
      const filePath = `uploads/${fileName}`

      // Create a reference to the storage location
      const storageRef = ref(storage, filePath)

      // Upload the file
      await uploadBytes(storageRef, file)

      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef)

      // Set preview and call the callback
      setPreview(downloadURL)
      onUploadComplete(downloadURL, file)

      setProgress(100)
    } catch (error) {
      console.error("Error uploading file:", error)
      setError("Failed to upload file. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onUploadComplete("", new File([], ""))
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      {preview ? (
        <div className="relative">
          {accept.includes("image/") && (
            <img src={preview || "/placeholder.svg"} alt="Preview" className="max-h-40 rounded-md object-contain" />
          )}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm text-gray-500 truncate flex-1">{preview.split("/").pop()}</span>
            <Button type="button" variant="destructive" size="sm" onClick={handleRemove}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-6 transition-colors hover:border-gray-400">
            <Upload className="h-10 w-10 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 mb-1">Click to upload or drag and drop</p>
            <p className="text-xs text-gray-400">
              {accept.replace("image/*", "Images")} (Max: {maxSize}MB)
            </p>

            {isUploading && (
              <div className="w-full mt-2">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-center mt-1">Uploading: {progress}%</p>
              </div>
            )}

            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          </div>
          <input
            ref={inputRef}
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileChange}
            accept={accept}
            {...props}
          />
        </div>
      )}
    </div>
  )
}

