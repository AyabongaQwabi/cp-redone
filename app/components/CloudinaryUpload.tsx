"use client"

import type React from "react"
import { useState } from "react"
import { useCallback } from "react"
import { useDropzone } from "react-dropzone"

interface CloudinaryUploadProps {
  onUploadComplete: (url: string) => void
}

const CloudinaryUpload: React.FC<CloudinaryUploadProps> = ({ onUploadComplete }) => {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      uploadToCloudinary(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  const uploadToCloudinary = async (file: File) => {
    setIsUploading(true)
    setUploadProgress(0)

    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", "your_cloudinary_upload_preset") // Replace with your Cloudinary upload preset

    try {
      const response = await fetch("https://api.cloudinary.com/v1_1/your_cloud_name/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const data = await response.json()
      onUploadComplete(data.secure_url)
      setUploadProgress(100)
    } catch (error) {
      console.error("Upload error:", error)
      // Handle error (e.g., show error message to user)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="mb-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed border-gray-300 rounded-md p-4 text-center cursor-pointer ${
          isDragActive ? "bg-blue-50" : ""
        }`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the file here ...</p>
        ) : (
          <p>Drag 'n' drop job spec file here, or click to select file</p>
        )}
      </div>
      {isUploading && (
        <div className="mt-2">
          <div className="bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
          </div>
          <p className="text-sm text-gray-500 mt-1">Uploading: {uploadProgress}%</p>
        </div>
      )}
    </div>
  )
}

export default CloudinaryUpload

