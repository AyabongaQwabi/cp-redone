"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { db, auth } from "@/lib/firebase-client"
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from "firebase/firestore"
import AppointmentCard from "@/app/components/AppointmentCard"
import type { Appointment, Company } from "@/app/types"

export default function CompanyAppointments({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [company, setCompany] = useState<Company | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)

        const user = auth.currentUser
        if (!user) {
          router.push("/login")
          return
        }

        // Fetch company details
        const companyDoc = await getDoc(doc(db, "companies", params.id))

        if (!companyDoc.exists()) {
          setError("Company not found")
          return
        }

        const companyData = { id: companyDoc.id, ...companyDoc.data() } as Company

        // Verify that this company belongs to the current user
        if (companyData.userId !== user.uid) {
          setError("You don't have permission to view this company")
          return
        }

        setCompany(companyData)

        // Fetch appointments for this company
        const appointmentsQuery = query(collection(db, "appointments"), where("companyId", "==", params.id))

        const appointmentsSnapshot = await getDocs(appointmentsQuery)
        const appointmentsData = appointmentsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Appointment[]

        setAppointments(appointmentsData)
      } catch (error) {
        console.error("Error fetching data:", error)
        setError(error instanceof Error ? error.message : "An error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [params.id, router])

  const handleCancelAppointment = async (id: string) => {
    try {
      // Update appointment status in Firestore
      await updateDoc(doc(db, "appointments", id), {
        status: "Cancelled",
        updatedAt: new Date(),
      })

      // Update the local state
      setAppointments(
        appointments.map((appointment) =>
          appointment.id === id ? { ...appointment, status: "Cancelled" } : appointment,
        ),
      )
    } catch (error) {
      console.error("Error cancelling appointment:", error)
      alert("Failed to cancel appointment")
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  if (error) {
    return <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">{error}</div>
  }

  if (!company) {
    return <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">Company not found</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{company.name} - Appointments</h1>
          <p className="text-gray-600">Manage appointments for this company</p>
        </div>
        <div className="space-x-2">
          <Link
            href={`/dashboard/company/${company.id}`}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Back to Company
          </Link>
          <Link
            href="/dashboard/create-appointment"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            New Appointment
          </Link>
        </div>
      </div>

      {appointments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {appointments.map((appointment) => (
            <AppointmentCard key={appointment.id} appointment={appointment} onCancel={handleCancelAppointment} />
          ))}
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <p className="text-gray-600 mb-4">No appointments found for this company.</p>
          <Link
            href="/dashboard/create-appointment"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Book an Appointment
          </Link>
        </div>
      )}
    </div>
  )
}

