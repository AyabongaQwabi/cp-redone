"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { db, auth } from "@/lib/firebase-client"
import { collection, getDocs, query } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { Clinic } from "@/app/types"

export default function ClinicsPage() {
  const router = useRouter()
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchClinics() {
      try {
        setIsLoading(true)
        const user = auth.currentUser
        if (!user) {
          router.push("/login")
          return
        }

        // For admin users, fetch all clinics
        // For regular users, only fetch clinics they have access to
        const clinicsQuery = query(collection(db, "clinics"))
        const clinicsSnapshot = await getDocs(clinicsQuery)
        const clinicsData = clinicsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Clinic[]

        setClinics(clinicsData)
        setError(null)
      } catch (error) {
        console.error("Error fetching clinics:", error)
        setError("Failed to load clinics")
      } finally {
        setIsLoading(false)
      }
    }

    fetchClinics()
  }, [router])

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Clinics</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Clinics</CardTitle>
        </CardHeader>
        <CardContent>
          {clinics.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No clinics available</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Daily Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clinics.map((clinic) => (
                  <TableRow key={clinic.id}>
                    <TableCell className="font-medium">{clinic.name}</TableCell>
                    <TableCell>
                      {clinic.city}
                      {clinic.province ? `, ${clinic.province}` : ""}
                    </TableCell>
                    <TableCell>{clinic.dailyCapacity} employees</TableCell>
                    <TableCell>
                      <Badge className={clinic.status === "Active" ? "bg-green-500" : "bg-gray-500"}>
                        {clinic.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{clinic.contactPhone || clinic.contactEmail || "N/A"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

