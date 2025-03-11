"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, X, Search } from "lucide-react"
import { db, auth } from "@/lib/firebase-client"
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore"
import type { Site, Employee, SiteEmployee } from "@/app/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function ManageSiteEmployeesPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [site, setSite] = useState<Site | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [assignedEmployees, setAssignedEmployees] = useState<
    (Employee & { assignmentId?: string; role?: string; isPrimary?: boolean })[]
  >([])
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([])
  const [selectedEmployees, setSelectedEmployees] = useState<Record<string, boolean>>({})
  const [employeeRoles, setEmployeeRoles] = useState<Record<string, string>>({})
  const [employeePrimary, setEmployeePrimary] = useState<Record<string, boolean>>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
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
          setError("You don't have permission to manage this site")
          return
        }

        setSite(siteData)

        // Fetch all employees for this company
        const employeesQuery = query(
          collection(db, "employees"),
          where("userId", "==", user.uid),
          where("companyId", "==", siteData.companyId),
        )
        const employeesSnapshot = await getDocs(employeesQuery)
        const employeesData = employeesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Employee[]

        setEmployees(employeesData)

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

        // Combine employee data with assignment data
        const assignedEmployeesData = employeesData
          .filter((employee) => assignments.some((a) => a.employeeId === employee.id))
          .map((employee) => {
            const assignment = assignments.find((a) => a.employeeId === employee.id)
            return {
              ...employee,
              assignmentId: assignment?.id,
              role: assignment?.role,
              isPrimary: assignment?.isPrimary,
            }
          })

        setAssignedEmployees(assignedEmployeesData)

        // Set available employees (those not already assigned)
        const availableEmployeesData = employeesData.filter(
          (employee) => !assignments.some((a) => a.employeeId === employee.id),
        )
        setAvailableEmployees(availableEmployeesData)

        // Initialize selected employees, roles, and primary status
        const initialSelectedEmployees: Record<string, boolean> = {}
        const initialEmployeeRoles: Record<string, string> = {}
        const initialEmployeePrimary: Record<string, boolean> = {}

        assignedEmployeesData.forEach((employee) => {
          initialSelectedEmployees[employee.id] = true
          initialEmployeeRoles[employee.id] = employee.role || ""
          initialEmployeePrimary[employee.id] = employee.isPrimary || false
        })

        setSelectedEmployees(initialSelectedEmployees)
        setEmployeeRoles(initialEmployeeRoles)
        setEmployeePrimary(initialEmployeePrimary)

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

  const handleEmployeeSelection = (employeeId: string, isSelected: boolean) => {
    setSelectedEmployees((prev) => ({
      ...prev,
      [employeeId]: isSelected,
    }))

    // Initialize role and primary status for newly selected employees
    if (isSelected && !employeeRoles[employeeId]) {
      setEmployeeRoles((prev) => ({
        ...prev,
        [employeeId]: "",
      }))
      setEmployeePrimary((prev) => ({
        ...prev,
        [employeeId]: false,
      }))
    }
  }

  const handleRoleChange = (employeeId: string, role: string) => {
    setEmployeeRoles((prev) => ({
      ...prev,
      [employeeId]: role,
    }))
  }

  const handlePrimaryChange = (employeeId: string, isPrimary: boolean) => {
    setEmployeePrimary((prev) => ({
      ...prev,
      [employeeId]: isPrimary,
    }))
  }

  const handleSave = async () => {
    if (!site) return

    try {
      setIsSaving(true)
      setError(null)

      const user = auth.currentUser
      if (!user) {
        throw new Error("You must be logged in to manage site employees")
      }

      const batch = writeBatch(db)
      const siteRef = doc(db, "sites", site.id)

      // Get all currently assigned employees
      const currentlyAssignedIds = assignedEmployees.map((employee) => employee.id)

      // Determine which employees to add and which to remove
      const employeesToAdd = Object.entries(selectedEmployees)
        .filter(([id, isSelected]) => isSelected && !currentlyAssignedIds.includes(id))
        .map(([id]) => id)

      const employeesToRemove = assignedEmployees
        .filter((employee) => !selectedEmployees[employee.id])
        .map((employee) => employee.assignmentId)
        .filter((id): id is string => id !== undefined)

      const employeesToUpdate = assignedEmployees
        .filter(
          (employee) =>
            selectedEmployees[employee.id] &&
            (employee.role !== employeeRoles[employee.id] || employee.isPrimary !== employeePrimary[employee.id]),
        )
        .map((employee) => ({
          id: employee.assignmentId,
          employeeId: employee.id,
          role: employeeRoles[employee.id],
          isPrimary: employeePrimary[employee.id],
        }))
        .filter(
          (item): item is { id: string; employeeId: string; role: string; isPrimary: boolean } => item.id !== undefined,
        )

      // Add new assignments
      const addPromises = employeesToAdd.map((employeeId) =>
        addDoc(collection(db, "siteEmployees"), {
          siteId: site.id,
          employeeId,
          role: employeeRoles[employeeId] || "",
          isPrimary: employeePrimary[employeeId] || false,
          assignmentDate: new Date().toISOString(),
          userId: user.uid,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      )

      // Remove assignments
      const removePromises = employeesToRemove.map((assignmentId) => deleteDoc(doc(db, "siteEmployees", assignmentId)))

      // Update assignments
      const updatePromises = employeesToUpdate.map((item) =>
        updateDoc(doc(db, "siteEmployees", item.id), {
          role: item.role,
          isPrimary: item.isPrimary,
          updatedAt: new Date(),
        }),
      )

      // Execute all operations
      await Promise.all([...addPromises, ...removePromises, ...updatePromises])

      // Update site employee count
      const newEmployeeCount = Object.values(selectedEmployees).filter(Boolean).length
      await updateDoc(siteRef, {
        employeeCount: newEmployeeCount,
        updatedAt: new Date(),
      })

      // Redirect back to site details
      router.push(`/dashboard/sites/${site.id}`)
    } catch (error) {
      console.error("Error saving site employees:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  const filteredAvailableEmployees = availableEmployees.filter((employee) => {
    if (!searchTerm) return true
    const fullName = `${employee.firstName} ${employee.lastName}`.toLowerCase()
    return (
      fullName.includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employee.email && employee.email.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  })

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
          <Link href={`/dashboard/sites/${site.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Site
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Manage Site Employees</h1>
          <p className="text-gray-600">
            Assign or remove employees for <span className="font-medium">{site.name}</span>
          </p>
        </div>
      </div>

      {error && <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Currently Assigned</CardTitle>
            <CardDescription>Employees currently assigned to this site</CardDescription>
          </CardHeader>
          <CardContent>
            {assignedEmployees.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Assigned</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Role at Site</TableHead>
                    <TableHead className="w-20">Primary</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignedEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedEmployees[employee.id] || false}
                          onCheckedChange={(checked) => handleEmployeeSelection(employee.id, !!checked)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {employee.firstName} {employee.lastName}
                      </TableCell>
                      <TableCell>{employee.position}</TableCell>
                      <TableCell>
                        <Input
                          placeholder="Role at site"
                          value={employeeRoles[employee.id] || ""}
                          onChange={(e) => handleRoleChange(employee.id, e.target.value)}
                          disabled={!selectedEmployees[employee.id]}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={employeePrimary[employee.id] || false}
                          onCheckedChange={(checked) => handlePrimaryChange(employee.id, !!checked)}
                          disabled={!selectedEmployees[employee.id]}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No employees are currently assigned to this site</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Available Employees</CardTitle>
            <CardDescription>Employees from this company that can be assigned to the site</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Search employees..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {filteredAvailableEmployees.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Assign</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Role at Site</TableHead>
                    <TableHead className="w-20">Primary</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAvailableEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedEmployees[employee.id] || false}
                          onCheckedChange={(checked) => handleEmployeeSelection(employee.id, !!checked)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {employee.firstName} {employee.lastName}
                      </TableCell>
                      <TableCell>{employee.position}</TableCell>
                      <TableCell>
                        <Input
                          placeholder="Role at site"
                          value={employeeRoles[employee.id] || ""}
                          onChange={(e) => handleRoleChange(employee.id, e.target.value)}
                          disabled={!selectedEmployees[employee.id]}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={employeePrimary[employee.id] || false}
                          onCheckedChange={(checked) => handlePrimaryChange(employee.id, !!checked)}
                          disabled={!selectedEmployees[employee.id]}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                {employees.length === 0 ? (
                  <>
                    <p className="text-gray-500 mb-2">No employees found for this company</p>
                    <Button asChild size="sm">
                      <Link href="/dashboard/employees/create">Add Employees</Link>
                    </Button>
                  </>
                ) : searchTerm ? (
                  <>
                    <p className="text-gray-500">No employees match your search</p>
                    <Button variant="ghost" size="sm" onClick={() => setSearchTerm("")} className="mt-2">
                      <X className="mr-2 h-4 w-4" />
                      Clear Search
                    </Button>
                  </>
                ) : (
                  <p className="text-gray-500">All employees are already assigned to this site</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex justify-end space-x-2">
        <Button variant="outline" asChild>
          <Link href={`/dashboard/sites/${site.id}`}>Cancel</Link>
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save Assignments"}
        </Button>
      </div>
    </div>
  )
}

