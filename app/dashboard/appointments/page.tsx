"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { PlusCircle, FileEdit, Eye, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { db, auth } from "@/lib/firebase-client"
import { collection, getDocs, query, where, deleteDoc, doc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import type { Appointment } from "@/app/types"

export default function AppointmentsPage() {
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAppointments() {
      try {
        setIsLoading(true)
        const user = auth.currentUser
        if (!user) {
          router.push("/login")
          return
        }

        const appointmentsQuery = query(collection(db, "appointments"), where("userId", "==", user.uid))
        const appointmentsSnapshot = await getDocs(appointmentsQuery)
        const appointmentsData = appointmentsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Appointment[]

        setAppointments(appointmentsData)
        setError(null)
      } catch (error) {
        console.error("Error fetching appointments:", error)
        setError("Failed to load appointments")
      } finally {
        setIsLoading(false)
      }
    }

    fetchAppointments()
  }, [router])

  const handleDeleteAppointment = async (id: string) => {
    if (confirm("Are you sure you want to delete this appointment?")) {
      try {
        await deleteDoc(doc(db, "appointments", id))
        setAppointments(appointments.filter((appointment) => appointment.id !== id))
      } catch (error) {
        console.error("Error deleting appointment:", error)
        alert("Failed to delete appointment")
      }
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
        return <Badge className="bg-green-500">Approved</Badge>
      case "In Progress":
        return <Badge className="bg-blue-500">In Progress</Badge>
      case "Complete":
        return <Badge className="bg-purple-500">Complete</Badge>
      case "Declined":
        return <Badge className="bg-red-500">Declined</Badge>
      default:
        return <Badge className="bg-yellow-500">Pending</Badge>
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Appointments</h1>
        <Button asChild>
          <Link href="/dashboard/appointments/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Appointment
          </Link>
        </Button>
      </div>

      {error && <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

      <Card>
        <CardHeader>
          <CardTitle>Your Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">Loading...</div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-4">You haven't created any appointments yet.</p>
              <Button asChild>
                <Link href="/dashboard/appointments/create">Create your first appointment</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Purchase Order</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Clinic</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell className="font-medium">{appointment.purchaseOrderNumber}</TableCell>
                    <TableCell>{appointment.companyName}</TableCell>
                    <TableCell>{appointment.clinicName}</TableCell>
                    <TableCell>{formatDate(appointment.date)}</TableCell>
                    <TableCell>{appointment.employeeCount}</TableCell>
                    <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/appointments/${appointment.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/appointments/${appointment.id}/edit`}>
                              <FileEdit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteAppointment(appointment.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
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

