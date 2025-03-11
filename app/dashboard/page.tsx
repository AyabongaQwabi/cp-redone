"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import AppointmentCard from "../components/AppointmentCard"
import CompanyCard from "../components/CompanyCard"
import SummarySection from "../components/SummarySection"
import type { Appointment, Company } from "../types"
import { db, auth } from "@/lib/firebase-client"
import { collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore"

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize analytics safely
  useEffect(() => {
    const loadAnalytics = async () => {
      if (typeof window !== "undefined") {
        try {
          const { getAnalytics } = await import("@/lib/analytics")
          await getAnalytics()
        } catch (error) {
          console.error("Failed to load analytics:", error)
        }
      }
    }

    loadAnalytics()
  }, [])

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)

        // Get current user
        const currentUser = auth.currentUser
        if (currentUser) {
          setUser({
            id: currentUser.uid,
            fullName: currentUser.displayName,
            email: currentUser.email,
          })

          // Fetch user's companies
          const companiesQuery = query(collection(db, "companies"), where("userId", "==", currentUser.uid))
          const companiesSnapshot = await getDocs(companiesQuery)
          const companiesData = companiesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Company[]

          setCompanies(companiesData)

          // Create a map of company IDs to company names for quick lookup
          const companyMap = companiesData.reduce(
            (map, company) => {
              map[company.id] = company.name
              return map
            },
            {} as Record<string, string>,
          )

          // Fetch user's appointments
          const appointmentsQuery = query(collection(db, "appointments"), where("userId", "==", currentUser.uid))
          const appointmentsSnapshot = await getDocs(appointmentsQuery)
          const appointmentsData = appointmentsSnapshot.docs.map((doc) => {
            const data = doc.data()
            return {
              id: doc.id,
              ...data,
              // Add company name to each appointment
              companyName: data.companyId ? companyMap[data.companyId] : "Unknown Company",
            }
          }) as (Appointment & { companyName: string })[]

          setAppointments(appointmentsData)
        }

        setError(null)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        setError(error instanceof Error ? error.message : "An error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

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
    return <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">Error: {error}</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {user && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-2">Welcome, {user.fullName || "User"}!</h2>
          <p className="text-gray-600">Email: {user.email}</p>
        </div>
      )}

      <SummarySection totalAppointments={appointments.length} totalCompanies={companies.length} />
      <div className="flex justify-between mb-6">
        <Link
          href="/dashboard/create-appointment"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Book Appointment
        </Link>
        <Link href="/dashboard/create-company" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
          Create Company
        </Link>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Your Appointments</h2>
          {appointments.length > 0 ? (
            appointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onCancel={handleCancelAppointment}
                companyName={(appointment as any).companyName}
              />
            ))
          ) : (
            <p className="text-gray-500">No appointments found</p>
          )}
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-4">Your Companies</h2>
          {companies.length > 0 ? (
            companies.map((company) => <CompanyCard key={company.id} company={company} />)
          ) : (
            <p className="text-gray-500">
              No companies found.{" "}
              <Link href="/dashboard/create-company" className="text-blue-500 hover:underline">
                Create one now
              </Link>
              .
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

