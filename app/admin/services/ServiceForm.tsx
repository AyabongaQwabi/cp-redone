"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { Service } from "@/app/types"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ImageUpload } from "./ImageUpload"

interface ServiceFormProps {
  onSubmit: (service: Omit<Service, "id" | "createdAt" | "updatedAt">) => void
  initialData?: Service | null
}

export function ServiceForm({ onSubmit, initialData }: ServiceFormProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [images, setImages] = useState<string[]>([])

  useEffect(() => {
    if (initialData) {
      setName(initialData.name)
      setDescription(initialData.description)
      setPrice(initialData.price.toString())
      setImages(initialData.images || [])
    }
  }, [initialData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      name,
      description,
      price: Number.parseFloat(price),
      images,
      status: "active",
    })
    resetForm()
  }

  const resetForm = () => {
    setName("")
    setDescription("")
    setPrice("")
    setImages([])
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Service Name" required />
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Service Description"
        required
      />
      <Input
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Price"
        required
        min="0"
        step="0.01"
      />
      <ImageUpload images={images} setImages={setImages} />
      <Button type="submit">{initialData ? "Update" : "Create"} Service</Button>
    </form>
  )
}

