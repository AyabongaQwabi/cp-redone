"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface ImageUploadProps {
  images: string[]
  setImages: (images: string[]) => void
}

export function ImageUpload({ images, setImages }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setUploading(true)

    const uploadPromises = Array.from(files).map(async (file) => {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("upload_preset", "your_cloudinary_upload_preset")

      const response = await fetch("https://api.cloudinary.com/v1_1/your_cloud_name/image/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      return data.secure_url
    })

    const uploadedUrls = await Promise.all(uploadPromises)
    setImages([...images, ...uploadedUrls])
    setUploading(false)
  }

  const handleRemove = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  return (
    <div>
      <input
        type="file"
        multiple
        onChange={handleUpload}
        className="hidden"
        id="image-upload"
        accept="image/*"
        disabled={uploading}
      />
      <label htmlFor="image-upload">
        <Button as="span" disabled={uploading}>
          {uploading ? "Uploading..." : "Upload Images"}
        </Button>
      </label>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {images.map((image, index) => (
          <div key={index} className="relative">
            <Image
              src={image || "/placeholder.svg"}
              alt={`Uploaded image ${index + 1}`}
              width={100}
              height={100}
              objectFit="cover"
              className="rounded-md"
            />
            <button
              onClick={() => handleRemove(index)}
              className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
            >
              X
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

