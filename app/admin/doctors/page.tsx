"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { db } from "@/lib/firebase-client"
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { Doctor, Clinic } from "@/app/types"

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [newDoctor, setNewDoctor] = useState<Partial<Doctor>>({
    name: "",
    specialization: "",
    email: "",
    phone: "",
    clinicId: "",
    status: "Active",
  })
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null)

  useEffect(() => {
    fetchDoctors()
    fetchClinics()
  }, [])

  const fetchDoctors = async () => {
    const querySnapshot = await getDocs(collection(db, "doctors"))
    const doctorsList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Doctor)
    setDoctors(doctorsList)
  }

  const fetchClinics = async () => {
    const querySnapshot = await getDocs(collection(db, "clinics"))
    const clinicsList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Clinic)
    setClinics(clinicsList)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setNewDoctor({ ...newDoctor, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await addDoc(collection(db, "doctors"), {
        ...newDoctor,
        userId: "admin", // Replace with actual admin ID
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
      setNewDoctor({
        name: "",
        specialization: "",
        email: "",
        phone: "",
        clinicId: "",
        status: "Active",
      })
      setIsAddModalOpen(false)
      fetchDoctors()
    } catch (error) {
      console.error("Error adding doctor: ", error)
    }
  }

  const handleUpdateDoctor = async (doctorId: string, updates: Partial<Doctor>) => {
    try {
      const doctorRef = doc(db, "doctors", doctorId)
      await updateDoc(doctorRef, { ...updates, updatedAt: Timestamp.now() })
      setIsEditModalOpen(false)
      fetchDoctors()
    } catch (error) {
      console.error("Error updating doctor: ", error)
    }
  }

  const handleDeleteDoctor = async (doctorId: string) => {
    try {
      await deleteDoc(doc(db, "doctors", doctorId))
      fetchDoctors()
    } catch (error) {
      console.error("Error deleting doctor: ", error)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Manage Doctors</h1>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogTrigger asChild>
          <Button>Add Doctor</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Doctor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input name="name" value={newDoctor.name} onChange={handleInputChange} placeholder="Doctor Name" required />
            <Input
              name="specialization"
              value={newDoctor.specialization}
              onChange={handleInputChange}
              placeholder="Specialization"
              required
            />
            <Input
              name="email"
              value={newDoctor.email}
              onChange={handleInputChange}
              placeholder="Email"
              type="email"
              required
            />
            <Input name="phone" value={newDoctor.phone} onChange={handleInputChange} placeholder="Phone" required />
            <Select name="clinicId" value={newDoctor.clinicId} onChange={handleInputChange}>
              <option value="">Select Clinic</option>
              {clinics.map((clinic) => (
                <option key={clinic.id} value={clinic.id}>
                  {clinic.name}
                </option>
              ))}
            </Select>
            <Select name="status" value={newDoctor.status} onChange={handleInputChange}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </Select>
            <Button type="submit">Add Doctor</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Specialization</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Clinic</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {doctors.map((doctor) => (
            <TableRow key={doctor.id}>
              <TableCell>{doctor.name}</TableCell>
              <TableCell>{doctor.specialization}</TableCell>
              <TableCell>{doctor.email}</TableCell>
              <TableCell>{doctor.phone}</TableCell>
              <TableCell>{clinics.find((c) => c.id === doctor.clinicId)?.name || "Not assigned"}</TableCell>
              <TableCell>{doctor.status}</TableCell>
              <TableCell>
                <Button
                  onClick={() => {
                    setEditingDoctor(doctor)
                    setIsEditModalOpen(true)
                  }}
                >
                  Edit
                </Button>
                <Button onClick={() => handleDeleteDoctor(doctor.id)} variant="destructive">
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Doctor</DialogTitle>
          </DialogHeader>
          {editingDoctor && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleUpdateDoctor(editingDoctor.id, editingDoctor)
              }}
              className="space-y-4"
            >
              <Input
                name="name"
                value={editingDoctor.name}
                onChange={(e) => setEditingDoctor({ ...editingDoctor, name: e.target.value })}
                placeholder="Doctor Name"
                required
              />
              <Input
                name="specialization"
                value={editingDoctor.specialization}
                onChange={(e) => setEditingDoctor({ ...editingDoctor, specialization: e.target.value })}
                placeholder="Specialization"
                required
              />
              <Input
                name="email"
                value={editingDoctor.email}
                onChange={(e) => setEditingDoctor({ ...editingDoctor, email: e.target.value })}
                placeholder="Email"
                type="email"
                required
              />
              <Input
                name="phone"
                value={editingDoctor.phone}
                onChange={(e) => setEditingDoctor({ ...editingDoctor, phone: e.target.value })}
                placeholder="Phone"
                required
              />
              <Select
                name="clinicId"
                value={editingDoctor.clinicId}
                onChange={(e) => setEditingDoctor({ ...editingDoctor, clinicId: e.target.value })}
              >
                <option value="">Select Clinic</option>
                {clinics.map((clinic) => (
                  <option key={clinic.id} value={clinic.id}>
                    {clinic.name}
                  </option>
                ))}
              </Select>
              <Select
                name="status"
                value={editingDoctor.status}
                onChange={(e) =>
                  setEditingDoctor({ ...editingDoctor, status: e.target.value as "Active" | "Inactive" })
                }
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </Select>
              <Button type="submit">Update Doctor</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

