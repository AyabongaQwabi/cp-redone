"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Building, MapPin, Phone, Mail, Edit, Users } from "lucide-react"
import { db, auth } from "@/lib/firebase-client"
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import type { Site, Company, Employee, SiteEmployee } from "@/app/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function SiteDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [site, setSite] = useState<Site | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [assignedEmployees, setAssignedEmployees] = useState<(Employee & { role?: string; isPrimary?: boolean })[]>([])
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

        // Fetch site
        const siteDoc = await getDoc(doc(db, "sites", params.id))

        if (!siteDoc.exists()) {
          setError("Site not found")
          return
        }

        const siteData = { id: siteDoc.id, ...siteDoc.data() } as Site

        // Verify that this site belongs to the current user
        if (siteData.userId !== user.uid) {
          setError("You don't have permission to view this site")
          return
        }

        setSite(siteData)

        // Fetch company
        if (siteData.companyId) {
          const companyDoc = await getDoc(doc(db, "companies", siteData.companyId))
          if (companyDoc.exists()) {
            setCompany({ id: companyDoc.id, ...companyDoc.data() } as Company)
          }
        }

        // Fetch site-employee assignments
        const assignmentsQuery = query(
          collection(db, "siteEmployees"),
          where("siteId", "==", params.id),
          where("userId", "==", user.uid),
        )
        const assignmentsSnapshot = await getDocs(assignmentsQuery)
        const assignments = assignmentsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as SiteEmployee[]

        // If there are assignments, fetch the employee details
        if (assignments.length > 0) {
          const employeeIds = assignments.map((assignment) => assignment.employeeId)
          const employeesQuery = query(collection(db, "employees"), where("userId", "==", user.uid))
          const employeesSnapshot = await getDocs(employeesQuery)
          const employeesData = employeesSnapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
            .filter((employee) => employeeIds.includes(employee.id)) as Employee[]

          // Combine employee data with assignment data
          const assignedEmployeesData = employeesData.map((employee) => {
            const assignment = assignments.find((a) => a.employeeId === employee.id)
            return {
              ...employee,
              role: assignment?.role,
              isPrimary: assignment?.isPrimary,
            }
          })

          setAssignedEmployees(assignedEmployeesData)
        }

        setError(null)
      } catch (error) {
        console.error("Error fetching site:", error)
        setError(error instanceof Error ? error.message : "An error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [params.id, router])

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800"
      case "Inactive":
        return "bg-red-100 text-red-800"
      case "Under Construction":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  if (error) {
    return <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">{error}</div>
  }

  if (!site) {
    return <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">Site not found</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link href="/dashboard/sites">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sites
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{site.name}</h1>
          <div className="flex items-center mt-1">
            <Badge className={getStatusBadgeColor(site.status)}>{site.status}</Badge>
            {company && <span className="ml-2 text-gray-600">• {company.name}</span>}
          </div>
        </div>
        <div className="flex space-x-2">
          <Button asChild variant="outline">
            <Link href={`/dashboard/sites/${site.id}/employees`}>
              <Users className="mr-2 h-4 w-4" />
              Manage Employees
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/dashboard/sites/${site.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Location</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                <span className="whitespace-pre-wrap">{site.address}</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-600 w-24">City:</span>
                <span>{site.city}</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-600 w-24">Province:</span>
                <span>{site.province}</span>
              </div>
              {site.postalCode && (
                <div className="flex items-center">
                  <span className="text-gray-600 w-24">Postal Code:</span>
                  <span>{site.postalCode}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {site.contactName && (
                <div className="flex items-center">
                  <span className="text-gray-600 w-24">Contact:</span>
                  <span>{site.contactName}</span>
                </div>
              )}
              {site.contactEmail && (
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{site.contactEmail}</span>
                </div>
              )}
              {site.contactPhone && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{site.contactPhone}</span>
                </div>
              )}
              {!site.contactName && !site.contactEmail && !site.contactPhone && (
                <div className="text-gray-500">No contact information provided</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Company</CardTitle>
          </CardHeader>
          <CardContent>
            {company ? (
              <div className="space-y-2">
                <div className="flex items-center">
                  <Building className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{company.name}</span>
                </div>
                {company.industry && (
                  <div className="flex items-center">
                    <span className="text-gray-600 w-24">Industry:</span>
                    <span>{company.industry}</span>
                  </div>
                )}
                <Button variant="outline" size="sm" asChild className="mt-2">
                  <Link href={`/dashboard/company/${company.id}`}>View Company</Link>
                </Button>
              </div>
            ) : (
              <div className="text-gray-500">Company information not available</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="employees" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="employees">Assigned Employees</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="employees">
          <Card>
            <CardHeader>
              <CardTitle>Assigned Employees</CardTitle>
              <CardDescription>Employees currently assigned to this site</CardDescription>
            </CardHeader>
            <CardContent>
              {assignedEmployees.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Role at Site</TableHead>
                      <TableHead>Primary</TableHead>
                      <TableHead>Contact</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignedEmployees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">
                          <Link href={`/dashboard/employees/${employee.id}`} className="hover:underline text-blue-600">
                            {employee.firstName} {employee.lastName}
                          </Link>
                        </TableCell>
                        <TableCell>{employee.position}</TableCell>
                        <TableCell>{employee.role || "Not specified"}</TableCell>
                        <TableCell>{employee.isPrimary ? "Yes" : "No"}</TableCell>
                        <TableCell>
                          {employee.email && (
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-1 text-gray-400" />
                              <span className="text-sm">{employee.email}</span>
                            </div>
                          )}
                          {employee.phone && (
                            <div className="flex items-center mt-1">
                              <Phone className="h-4 w-4 mr-1 text-gray-400" />
                              <span className="text-sm">{employee.phone}</span>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No employees assigned</h3>
                  <p className="text-gray-500 mb-4">This site doesn't have any employees assigned to it yet.</p>
                  <Button asChild>
                    <Link href={`/dashboard/sites/${site.id}/employees`}>Assign Employees</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>Additional information about this site</CardDescription>
            </CardHeader>
            <CardContent>
              {site.notes ? (
                <div className="whitespace-pre-wrap">{site.notes}</div>
              ) : (
                <div className="text-gray-500">No notes available for this site</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

