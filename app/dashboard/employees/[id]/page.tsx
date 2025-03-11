"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { doc, getDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase-client"
import type { Employee, Company } from "@/app/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Building, Calendar, Edit, Mail, Phone, User, FileText } from "lucide-react"

export default function EmployeeDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
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

        // Fetch employee
        const employeeDoc = await getDoc(doc(db, "employees", params.id))

        if (!employeeDoc.exists()) {
          setError("Employee not found")
          return
        }

        const employeeData = { id: employeeDoc.id, ...employeeDoc.data() } as Employee

        // Verify that this employee belongs to the current user
        if (employeeData.userId !== user.uid) {
          setError("You don't have permission to view this employee")
          return
        }

        setEmployee(employeeData)

        // If employee has a company, fetch company details
        if (employeeData.companyId) {
          const companyDoc = await getDoc(doc(db, "companies", employeeData.companyId))
          if (companyDoc.exists()) {
            setCompany({ id: companyDoc.id, ...companyDoc.data() } as Company)
          }
        }

        setError(null)
      } catch (error) {
        console.error("Error fetching employee:", error)
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
      case "On Leave":
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

  if (!employee) {
    return <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">Employee not found</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link href="/dashboard/employees">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Employees
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">
            {employee.firstName} {employee.lastName}
          </h1>
          <div className="flex items-center mt-1">
            <Badge className={getStatusBadgeColor(employee.status)}>{employee.status}</Badge>
            {employee.position && <span className="ml-2 text-gray-600">{employee.position}</span>}
          </div>
        </div>
        <Button asChild>
          <Link href={`/dashboard/employees/${employee.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
        <Button asChild variant="outline" className="ml-2">
          <Link href={`/dashboard/employees/${params.id}/documents`}>
            <FileText className="mr-2 h-4 w-4" />
            View Documents
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                <span>{employee.email}</span>
              </div>
              {employee.phone && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{employee.phone}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Employment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {employee.employeeNumber && (
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  <span>Employee #: {employee.employeeNumber}</span>
                </div>
              )}
              {employee.department && (
                <div className="flex items-center">
                  <span className="text-gray-600 w-24">Department:</span>
                  <span>{employee.department}</span>
                </div>
              )}
              {employee.startDate && (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  <span>Started: {new Date(employee.startDate).toLocaleDateString()}</span>
                </div>
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
              <div className="text-gray-500">Not assigned to any company</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="emergency" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="emergency">Emergency Contact</TabsTrigger>
          <TabsTrigger value="medical">Medical Information</TabsTrigger>
        </TabsList>

        <TabsContent value="emergency">
          <Card>
            <CardHeader>
              <CardTitle>Emergency Contact</CardTitle>
              <CardDescription>Contact information in case of emergency</CardDescription>
            </CardHeader>
            <CardContent>
              {employee.emergencyContact &&
              (employee.emergencyContact.name ||
                employee.emergencyContact.relationship ||
                employee.emergencyContact.phone) ? (
                <div className="space-y-4">
                  {employee.emergencyContact.name && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Name</h4>
                      <p>{employee.emergencyContact.name}</p>
                    </div>
                  )}
                  {employee.emergencyContact.relationship && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Relationship</h4>
                      <p>{employee.emergencyContact.relationship}</p>
                    </div>
                  )}
                  {employee.emergencyContact.phone && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Phone</h4>
                      <p>{employee.emergencyContact.phone}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No emergency contact information provided</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medical">
          <Card>
            <CardHeader>
              <CardTitle>Medical Information</CardTitle>
              <CardDescription>Medical details and health information</CardDescription>
            </CardHeader>
            <CardContent>
              {employee.medicalInfo &&
              (employee.medicalInfo.bloodType ||
                (employee.medicalInfo.allergies && employee.medicalInfo.allergies.length > 0) ||
                (employee.medicalInfo.medicalConditions && employee.medicalInfo.medicalConditions.length > 0) ||
                (employee.medicalInfo.medications && employee.medicalInfo.medications.length > 0)) ? (
                <div className="space-y-4">
                  {employee.medicalInfo.bloodType && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Blood Type</h4>
                      <p>{employee.medicalInfo.bloodType}</p>
                    </div>
                  )}

                  {employee.medicalInfo.allergies && employee.medicalInfo.allergies.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Allergies</h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {employee.medicalInfo.allergies.map((allergy, index) => (
                          <Badge key={index} variant="outline">
                            {allergy}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {employee.medicalInfo.medicalConditions && employee.medicalInfo.medicalConditions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Medical Conditions</h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {employee.medicalInfo.medicalConditions.map((condition, index) => (
                          <Badge key={index} variant="outline">
                            {condition}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {employee.medicalInfo.medications && employee.medicalInfo.medications.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Medications</h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {employee.medicalInfo.medications.map((medication, index) => (
                          <Badge key={index} variant="outline">
                            {medication}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No medical information provided</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {employee.notes && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line">{employee.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

