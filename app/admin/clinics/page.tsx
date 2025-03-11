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
import type { Clinic, Doctor, User } from "@/app/types"

export default function ClinicsPage() {
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [admins, setAdmins] = useState<User[]>([])
  const [newClinic, setNewClinic] = useState<Partial<Clinic>>({
    name: "",
    address: "",
    phone: "",
    email: "",
    maxDailyAppointments: 0,
    doctors: [],
    admins: [],
    status: "Active",
  })
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null)
  const [isAssignDoctorModalOpen, setIsAssignDoctorModalOpen] = useState(false)
  const [selectedClinicForAssignment, setSelectedClinicForAssignment] = useState<Clinic | null>(null)

  useEffect(() => {
    fetchClinics()
    fetchDoctors()
    fetchAdmins()
  }, [])

  const fetchClinics = async () => {
    const querySnapshot = await getDocs(collection(db, "clinics"))
    const clinicsList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Clinic)
    setClinics(clinicsList)
  }

  const fetchDoctors = async () => {
    const querySnapshot = await getDocs(collection(db, "doctors"))
    const doctorsList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Doctor)
    setDoctors(doctorsList)
  }

  const fetchAdmins = async () => {
    const querySnapshot = await getDocs(collection(db, "users"))
    const adminsList = querySnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }) as User)
      .filter((user) => user.role === "admin")
    setAdmins(adminsList)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.name === "maxDailyAppointments" ? Number.parseInt(e.target.value) : e.target.value
    setNewClinic({ ...newClinic, [e.target.name]: value })
  }

  const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const values = Array.from(e.target.selectedOptions, (option) => option.value)
    setNewClinic({ ...newClinic, [e.target.name]: values })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await addDoc(collection(db, "clinics"), {
        ...newClinic,
        userId: "admin", // Replace with actual admin ID
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
      setNewClinic({
        name: "",
        address: "",
        phone: "",
        email: "",
        maxDailyAppointments: 0,
        doctors: [],
        admins: [],
        status: "Active",
      })
      setIsAddModalOpen(false)
      fetchClinics()
    } catch (error) {
      console.error("Error adding clinic: ", error)
    }
  }

  const handleUpdateClinic = async (clinicId: string, updates: Partial<Clinic>) => {
    try {
      const clinicRef = doc(db, "clinics", clinicId)
      await updateDoc(clinicRef, { ...updates, updatedAt: Timestamp.now() })
      setIsEditModalOpen(false)
      fetchClinics()
    } catch (error) {
      console.error("Error updating clinic: ", error)
    }
  }

  const handleDeleteClinic = async (clinicId: string) => {
    try {
      await deleteDoc(doc(db, "clinics", clinicId))
      fetchClinics()
    } catch (error) {
      console.error("Error deleting clinic: ", error)
    }
  }

  const handleAssignDoctors = async (clinicId: string, doctorIds: string[]) => {
    try {
      const clinicRef = doc(db, "clinics", clinicId)
      await updateDoc(clinicRef, {
        doctors: doctorIds,
        updatedAt: Timestamp.now(),
      })
      setIsAssignDoctorModalOpen(false)
      fetchClinics()
    } catch (error) {
      console.error("Error assigning doctors: ", error)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Manage Clinics</h1>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogTrigger asChild>
          <Button>Add Clinic</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Clinic</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input name="name" value={newClinic.name} onChange={handleInputChange} placeholder="Clinic Name" required />
            <Input
              name="address"
              value={newClinic.address}
              onChange={handleInputChange}
              placeholder="Address"
              required
            />
            <Input name="phone" value={newClinic.phone} onChange={handleInputChange} placeholder="Phone" required />
            <Input
              name="email"
              value={newClinic.email}
              onChange={handleInputChange}
              placeholder="Email"
              type="email"
              required
            />
            <Input
              name="maxDailyAppointments"
              value={newClinic.maxDailyAppointments}
              onChange={handleInputChange}
              placeholder="Max Daily Appointments"
              type="number"
              required
            />
            <Select name="admins" multiple value={newClinic.admins} onChange={handleMultiSelectChange}>
              {admins.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {admin.fullName}
                </option>
              ))}
            </Select>
            <Select name="status" value={newClinic.status} onChange={handleInputChange}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </Select>
            <Button type="submit">Add Clinic</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Max Daily Appointments</TableHead>
            <TableHead>Doctors</TableHead>
            <TableHead>Admins</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clinics.map((clinic) => (
            <TableRow key={clinic.id}>
              <TableCell>{clinic.name}</TableCell>
              <TableCell>{clinic.address}</TableCell>
              <TableCell>{clinic.phone}</TableCell>
              <TableCell>{clinic.email}</TableCell>
              <TableCell>{clinic.maxDailyAppointments}</TableCell>
              <TableCell>{clinic.doctors.map((id) => doctors.find((d) => d.id === id)?.name).join(", ")}</TableCell>
              <TableCell>{clinic.admins.map((id) => admins.find((a) => a.id === id)?.fullName).join(", ")}</TableCell>
              <TableCell>{clinic.status}</TableCell>
              <TableCell>
                <Button
                  onClick={() => {
                    setEditingClinic(clinic)
                    setIsEditModalOpen(true)
                  }}
                >
                  Edit
                </Button>
                <Button onClick={() => handleDeleteClinic(clinic.id)} variant="destructive">
                  Delete
                </Button>
                <Button
                  onClick={() => {
                    setSelectedClinicForAssignment(clinic)
                    setIsAssignDoctorModalOpen(true)
                  }}
                >
                  Assign Doctors
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Clinic</DialogTitle>
          </DialogHeader>
          {editingClinic && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleUpdateClinic(editingClinic.id, editingClinic)
              }}
              className="space-y-4"
            >
              <Input
                name="name"
                value={editingClinic.name}
                onChange={(e) => setEditingClinic({ ...editingClinic, name: e.target.value })}
                placeholder="Clinic Name"
                required
              />
              <Input
                name="address"
                value={editingClinic.address}
                onChange={(e) => setEditingClinic({ ...editingClinic, address: e.target.value })}
                placeholder="Address"
                required
              />
              <Input
                name="phone"
                value={editingClinic.phone}
                onChange={(e) => setEditingClinic({ ...editingClinic, phone: e.target.value })}
                placeholder="Phone"
                required
              />
              <Input
                name="email"
                value={editingClinic.email}
                onChange={(e) => setEditingClinic({ ...editingClinic, email: e.target.value })}
                placeholder="Email"
                type="email"
                required
              />
              <Input
                name="maxDailyAppointments"
                value={editingClinic.maxDailyAppointments}
                onChange={(e) =>
                  setEditingClinic({ ...editingClinic, maxDailyAppointments: Number.parseInt(e.target.value) })
                }
                placeholder="Max Daily Appointments"
                type="number"
                required
              />
              <Select
                name="admins"
                multiple
                value={editingClinic.admins}
                onChange={(e) =>
                  setEditingClinic({
                    ...editingClinic,
                    admins: Array.from(e.target.selectedOptions, (option) => option.value),
                  })
                }
              >
                {admins.map((admin) => (
                  <option key={admin.id} value={admin.id}>
                    {admin.fullName}
                  </option>
                ))}
              </Select>
              <Select
                name="status"
                value={editingClinic.status}
                onChange={(e) =>
                  setEditingClinic({ ...editingClinic, status: e.target.value as "Active" | "Inactive" })
                }
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </Select>
              <Button type="submit">Update Clinic</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isAssignDoctorModalOpen} onOpenChange={setIsAssignDoctorModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Doctors to Clinic</DialogTitle>
          </DialogHeader>
          {selectedClinicForAssignment && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleAssignDoctors(selectedClinicForAssignment.id, selectedClinicForAssignment.doctors)
              }}
              className="space-y-4"
            >
              <Select
                name="doctors"
                multiple
                value={selectedClinicForAssignment.doctors}
                onChange={(e) =>
                  setSelectedClinicForAssignment({
                    ...selectedClinicForAssignment,
                    doctors: Array.from(e.target.selectedOptions, (option) => option.value),
                  })
                }
              >
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name}
                  </option>
                ))}
              </Select>
              <Button type="submit">Assign Doctors</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

