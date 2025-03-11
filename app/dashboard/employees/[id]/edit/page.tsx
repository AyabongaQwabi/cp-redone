"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { auth, db } from "@/lib/firebase-client"
import { doc, getDoc, updateDoc, collection, getDocs, query, where } from "firebase/firestore"
import type { Employee, Company, Site, Department } from "@/app/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

export default function EditEmployeePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [companies, setCompanies] = useState<Company[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [originalCompanyId, setOriginalCompanyId] = useState<string | undefined>(undefined)

  const [formData, setFormData] = useState<Employee>({
    id: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    position: "",
    department: "",
    employeeNumber: "",
    companyId: "",
    siteId: "",
    departmentId: "",
    startDate: "",
    status: "Active",
    emergencyContact: {
      name: "",
      relationship: "",
      phone: "",
    },
    medicalInfo: {
      bloodType: "",
      allergies: [],
      medicalConditions: [],
      medications: [],
    },
    notes: "",
    userId: "",
  })

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
          setError("You don't have permission to edit this employee")
          return
        }

        // Convert arrays to strings for form fields
        const formattedEmployee = {
          ...employeeData,
          medicalInfo: {
            ...employeeData.medicalInfo,
            allergies: employeeData.medicalInfo?.allergies?.join(", ") || "",
            medicalConditions: employeeData.medicalInfo?.medicalConditions?.join(", ") || "",
            medications: employeeData.medicalInfo?.medications?.join(", ") || "",
          },
        }

        setFormData(formattedEmployee as any)
        setOriginalCompanyId(employeeData.companyId)

        // Fetch companies, sites, and departments
        const companiesQuery = query(collection(db, "companies"), where("userId", "==", user.uid))
        const companiesSnapshot = await getDocs(companiesQuery)
        const companiesData = companiesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Company[]

        const sitesQuery = query(collection(db, "sites"), where("userId", "==", user.uid))
        const sitesSnapshot = await getDocs(sitesQuery)
        const sitesData = sitesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Site[]

        const departmentsQuery = query(collection(db, "departments"), where("userId", "==", user.uid))
        const departmentsSnapshot = await getDocs(departmentsQuery)
        const departmentsData = departmentsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Department[]

        setCompanies(companiesData)
        setSites(sitesData)
        setDepartments(departmentsData)
        setError(null)
      } catch (error) {
        console.error("Error fetching data:", error)
        setError(error instanceof Error ? error.message : "An error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [params.id, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    // Handle nested objects
    if (name.includes(".")) {
      const [parent, child] = name.split(".")
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value,
        },
      }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      // Process allergies, medical conditions, and medications as arrays
      const processedMedicalInfo = {
        bloodType: formData.medicalInfo.bloodType,
        allergies:
          typeof formData.medicalInfo.allergies === "string"
            ? formData.medicalInfo.allergies.split(",").map((item) => item.trim())
            : formData.medicalInfo.allergies,
        medicalConditions:
          typeof formData.medicalInfo.medicalConditions === "string"
            ? formData.medicalInfo.medicalConditions.split(",").map((item) => item.trim())
            : formData.medicalInfo.medicalConditions,
        medications:
          typeof formData.medicalInfo.medications === "string"
            ? formData.medicalInfo.medications.split(",").map((item) => item.trim())
            : formData.medicalInfo.medications,
      }

      // Update employee in Firestore
      const employeeData = {
        ...formData,
        medicalInfo: processedMedicalInfo,
        updatedAt: new Date(),
      }

      await updateDoc(doc(db, "employees", params.id), employeeData)

      // Handle company assignment changes
      if (formData.companyId !== originalCompanyId) {
        // If employee was previously assigned to a company, decrease that company's employee count
        if (originalCompanyId) {
          const oldCompanyRef = doc(db, "companies", originalCompanyId)
          const oldCompanyDoc = await getDoc(oldCompanyRef)

          if (oldCompanyDoc.exists()) {
            const oldCompanyData = oldCompanyDoc.data()
            await updateDoc(oldCompanyRef, {
              employeeCount: Math.max(0, (oldCompanyData.employeeCount || 1) - 1),
              updatedAt: new Date(),
            })
          }
        }

        // If employee is now assigned to a company, increase that company's employee count
        if (formData.companyId) {
          const newCompanyRef = doc(db, "companies", formData.companyId)
          const newCompanyDoc = await getDoc(newCompanyRef)

          if (newCompanyDoc.exists()) {
            const newCompanyData = newCompanyDoc.data()
            await updateDoc(newCompanyRef, {
              employeeCount: (newCompanyData.employeeCount || 0) + 1,
              updatedAt: new Date(),
            })
          }
        }
      }

      // Redirect to employee details page
      router.push(`/dashboard/employees/${params.id}`)
    } catch (error) {
      console.error("Error updating employee:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  if (error) {
    return <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">{error}</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link href={`/dashboard/employees/${params.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Employee</h1>
          <p className="text-gray-600">Update employee information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="employment">Employment Details</TabsTrigger>
            <TabsTrigger value="additional">Additional Information</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Edit the employee's personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="On Leave">On Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => router.push(`/dashboard/employees/${params.id}`)}
                >
                  Cancel
                </Button>
                <Button type="button" onClick={() => document.querySelector('[data-value="employment"]')?.click()}>
                  Next
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="employment">
            <Card>
              <CardHeader>
                <CardTitle>Employment Details</CardTitle>
                <CardDescription>Edit the employee's work information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      name="position"
                      value={formData.position}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input id="department" name="department" value={formData.department} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employeeNumber">Employee Number</Label>
                    <Input
                      id="employeeNumber"
                      name="employeeNumber"
                      value={formData.employeeNumber}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyId">Company</Label>
                  <Select value={formData.companyId} onValueChange={(value) => handleSelectChange("companyId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteId">Site</Label>
                  <Select value={formData.siteId} onValueChange={(value) => handleSelectChange("siteId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select site" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {sites.map((site) => (
                        <SelectItem key={site.id} value={site.id}>
                          {site.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="departmentId">Department</Label>
                  <Select
                    value={formData.departmentId}
                    onValueChange={(value) => handleSelectChange("departmentId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {departments.map((department) => (
                        <SelectItem key={department.id} value={department.id}>
                          {department.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => document.querySelector('[data-value="basic"]')?.click()}
                >
                  Previous
                </Button>
                <Button type="button" onClick={() => document.querySelector('[data-value="additional"]')?.click()}>
                  Next
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="additional">
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
                <CardDescription>Edit emergency contact and medical information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContact.name">Name</Label>
                      <Input
                        id="emergencyContact.name"
                        name="emergencyContact.name"
                        value={formData.emergencyContact.name}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContact.relationship">Relationship</Label>
                      <Input
                        id="emergencyContact.relationship"
                        name="emergencyContact.relationship"
                        value={formData.emergencyContact.relationship}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContact.phone">Phone</Label>
                      <Input
                        id="emergencyContact.phone"
                        name="emergencyContact.phone"
                        type="tel"
                        value={formData.emergencyContact.phone}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Medical Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="medicalInfo.bloodType">Blood Type</Label>
                      <Select
                        value={formData.medicalInfo.bloodType}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            medicalInfo: {
                              ...prev.medicalInfo,
                              bloodType: value,
                            },
                          }))
                        }
                      >
                        <SelectTrigger id="medicalInfo.bloodType">
                          <SelectValue placeholder="Select blood type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unknown">Unknown</SelectItem>
                          <SelectItem value="A+">A+</SelectItem>
                          <SelectItem value="A-">A-</SelectItem>
                          <SelectItem value="B+">B+</SelectItem>
                          <SelectItem value="B-">B-</SelectItem>
                          <SelectItem value="AB+">AB+</SelectItem>
                          <SelectItem value="AB-">AB-</SelectItem>
                          <SelectItem value="O+">O+</SelectItem>
                          <SelectItem value="O-">O-</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medicalInfo.allergies">Allergies (comma separated)</Label>
                    <Textarea
                      id="medicalInfo.allergies"
                      name="medicalInfo.allergies"
                      value={
                        typeof formData.medicalInfo.allergies === "string"
                          ? formData.medicalInfo.allergies
                          : formData.medicalInfo.allergies.join(", ")
                      }
                      onChange={handleInputChange}
                      placeholder="e.g., Peanuts, Penicillin, Latex"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medicalInfo.medicalConditions">Medical Conditions (comma separated)</Label>
                    <Textarea
                      id="medicalInfo.medicalConditions"
                      name="medicalInfo.medicalConditions"
                      value={
                        typeof formData.medicalInfo.medicalConditions === "string"
                          ? formData.medicalInfo.medicalConditions
                          : formData.medicalInfo.medicalConditions.join(", ")
                      }
                      onChange={handleInputChange}
                      placeholder="e.g., Asthma, Diabetes, Hypertension"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medicalInfo.medications">Medications (comma separated)</Label>
                    <Textarea
                      id="medicalInfo.medications"
                      name="medicalInfo.medications"
                      value={
                        typeof formData.medicalInfo.medications === "string"
                          ? formData.medicalInfo.medications
                          : formData.medicalInfo.medications.join(", ")
                      }
                      onChange={handleInputChange}
                      placeholder="e.g., Insulin, Ventolin, Lisinopril"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Any additional information about the employee"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => document.querySelector('[data-value="employment"]')?.click()}
                >
                  Previous
                </Button>
                <Button type="submit" disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  )
}

