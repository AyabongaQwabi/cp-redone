"use client"

import { useState, useEffect } from "react"
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase-client"
import type { Service } from "@/app/types"
import { ServiceForm } from "./ServiceForm"
import { ServiceList } from "./ServiceList"
import { ServicePreview } from "./ServicePreview"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    const servicesCollection = collection(db, "services")
    const servicesSnapshot = await getDocs(servicesCollection)
    const servicesList = servicesSnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as Service)
    setServices(servicesList)
  }

  const handleCreateService = async (newService: Omit<Service, "id" | "createdAt" | "updatedAt">) => {
    const servicesCollection = collection(db, "services")
    await addDoc(servicesCollection, {
      ...newService,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    fetchServices()
    setIsAddModalOpen(false)
  }

  const handleUpdateService = async (updatedService: Service) => {
    const serviceRef = doc(db, "services", updatedService.id)
    await updateDoc(serviceRef, {
      ...updatedService,
      updatedAt: new Date(),
    })
    fetchServices()
    setEditingService(null)
    setIsEditModalOpen(false)
  }

  const handleDeleteService = async (serviceId: string) => {
    const serviceRef = doc(db, "services", serviceId)
    await deleteDoc(serviceRef)
    fetchServices()
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Manage Services</h1>
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogTrigger asChild>
          <Button>Add Service</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Service</DialogTitle>
          </DialogHeader>
          <ServiceForm onSubmit={handleCreateService} />
        </DialogContent>
      </Dialog>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <ServiceList
            services={services}
            onEdit={(service) => {
              setEditingService(service)
              setIsEditModalOpen(true)
            }}
            onDelete={handleDeleteService}
          />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Service Preview</h2>
          {editingService && <ServicePreview service={editingService} />}
        </div>
      </div>
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
          </DialogHeader>
          {editingService && <ServiceForm onSubmit={handleUpdateService} initialData={editingService} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}

