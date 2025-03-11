"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Plus, X } from "lucide-react"
import { db, auth } from "@/lib/firebase-client"
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore"
import type { Department, Employee } from "@/app/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function EditDepartmentPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [department, setDepartment] = useState<Department | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [metadataFields, setMetadataFields] = useState<{ key: string; value: string }[]>([])

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    managerId: "",
    location: "",
    budget: "",
    status: "Active",
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

        // Fetch department
        const departmentDoc = await getDoc(doc(db, "departments", params.id))

        if (!departmentDoc.exists()) {
          setError("Department not found")
          return
        }

        const departmentData = { id: departmentDoc.id, ...departmentDoc.data() } as Department

        // Verify that this department belongs to the current user
        if (departmentData.userId !== user.uid) {
          setError("You don't have permission to edit this department")
          return
        }

        setDepartment(departmentData)
        setFormData({
          name: departmentData.name || "",
          description: departmentData.description || "",
          managerId: departmentData.managerId || "",
          location: departmentData.location || "",
          budget: departmentData.budget ? departmentData.budget.toString() : "",
          status: departmentData.status || "Active",
        })

        // Process metadata
        if (departmentData.metadata) {
          const metadataArray = Object.entries(departmentData.metadata).map(([key, value]) => ({
            key,
            value: value.toString(),
          }))
          setMetadataFields(metadataArray.length > 0 ? metadataArray : [{ key: "", value: "" }])
        } else {
          setMetadataFields([{ key: "", value: "" }])
        }

        // Fetch employees for this company
        if (departmentData.companyId) {
          const employeesQuery = query(
            collection(db, "employees"),
            where("userId", "==", user.uid),
            where("companyId", "==", departmentData.companyId),
          )
          const employeesSnapshot = await getDocs(employeesQuery)
          const employeesData = employeesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Employee[]

          setEmployees(employeesData)
        }

        setError(null)
      } catch (error) {
        console.error("Error fetching department:", error)
        setError(error instanceof Error ? error.message : "An error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [params.id, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleMetadataChange = (index: number, field: "key" | "value", value: string) => {
    const updatedFields = [...metadataFields]
    updatedFields[index][field] = value
    setMetadataFields(updatedFields)
  }

  const addMetadataField = () => {
    setMetadataFields([...metadataFields, { key: "", value: "" }])
  }

  const removeMetadataField = (index: number) => {
    const updatedFields = metadataFields.filter((_, i) => i !== index)
    setMetadataFields(updatedFields)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!department) return

    try {
      setIsSaving(true)
      setError(null)

      const user = auth.currentUser
      if (!user) {
        throw new Error("You must be logged in to update a department")
      }

      // Get manager name if a manager is selected
      let managerName = ""
      if (formData.managerId) {
        const selectedManager = employees.find((employee) => employee.id === formData.managerId)
        if (selectedManager) {
          managerName = `${selectedManager.firstName} ${selectedManager.lastName}`
        }
      }

      // Process metadata
      const metadata: Record<string, string> = {}
      metadataFields.forEach((field) => {
        if (field.key.trim() && field.value.trim()) {
          metadata[field.key.trim()] = field.value.trim()
        }
      })

      // Update department in Firestore
      await updateDoc(doc(db, "departments", department.id), {
        ...formData,
        managerName: formData.managerId ? managerName : null,
        budget: formData.budget ? Number.parseFloat(formData.budget) : null,
        metadata: Object.keys(metadata).length > 0 ? metadata : null,
        updatedAt: new Date(),
      })

      // Redirect to department details
      router.push(`/dashboard/departments/${department.id}`)
    } catch (error) {
      console.error("Error updating department:", error)
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

  if (!department) {
    return <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">Department not found</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link href={`/dashboard/departments/${department.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Department</h1>
          <p className="text-gray-600">Update department information for {department.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Department Information</CardTitle>
                <CardDescription>Update the details for this department</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Department Name</Label>
                  <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Restructuring">Restructuring</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" name="location" value={formData.location} onChange={handleInputChange} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget">Budget</Label>
                  <Input
                    id="budget"
                    name="budget"
                    type="number"
                    value={formData.budget}
                    onChange={handleInputChange}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="managerId">Department Manager</Label>
                  <Select value={formData.managerId} onValueChange={(value) => handleSelectChange("managerId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a manager" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-manager">No Manager</SelectItem>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.firstName} {employee.lastName} - {employee.position}
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
                  onClick={() => router.push(`/dashboard/departments/${department.id}`)}
                >
                  Cancel
                </Button>
                <Button type="button" onClick={() => document.querySelector('[data-value="metadata"]')?.click()}>
                  Next
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="metadata">
            <Card>
              <CardHeader>
                <CardTitle>Department Metadata</CardTitle>
                <CardDescription>Update custom fields and metadata for this department</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {metadataFields.map((field, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex-1">
                        <Label htmlFor={`metadata-key-${index}`} className="sr-only">
                          Key
                        </Label>
                        <Input
                          id={`metadata-key-${index}`}
                          placeholder="Key"
                          value={field.key}
                          onChange={(e) => handleMetadataChange(index, "key", e.target.value)}
                        />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor={`metadata-value-${index}`} className="sr-only">
                          Value
                        </Label>
                        <Input
                          id={`metadata-value-${index}`}
                          placeholder="Value"
                          value={field.value}
                          onChange={(e) => handleMetadataChange(index, "value", e.target.value)}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMetadataField(index)}
                        disabled={metadataFields.length === 1}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addMetadataField} className="mt-2">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Field
                  </Button>
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

