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
import type { Department, Employee, DepartmentEmployee } from "@/app/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function ManageDepartmentEmployeesPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [department, setDepartment] = useState<Department | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [assignedEmployees, setAssignedEmployees] = useState<
    (Employee & { assignmentId?: string; role?: string; isManager?: boolean })[]
  >([])
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([])
  const [selectedEmployees, setSelectedEmployees] = useState<Record<string, boolean>>({})
  const [employeeRoles, setEmployeeRoles] = useState<Record<string, string>>({})
  const [employeeManagers, setEmployeeManagers] = useState<Record<string, boolean>>({})
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

        // Fetch department
        const departmentDoc = await getDoc(doc(db, "departments", params.id))

        if (!departmentDoc.exists()) {
          setError("Department not found")
          return
        }

        const departmentData = { id: departmentDoc.id, ...departmentDoc.data() } as Department

        // Verify that this department belongs to the current user
        if (departmentData.userId !== user.uid) {
          setError("You don't have permission to manage this department")
          return
        }

        setDepartment(departmentData)

        // Fetch all employees for this company
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

        // Fetch department-employee assignments
        const assignmentsQuery = query(
          collection(db, "departmentEmployees"),
          where("departmentId", "==", params.id),
          where("userId", "==", user.uid),
        )
        const assignmentsSnapshot = await getDocs(assignmentsQuery)
        const assignments = assignmentsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as DepartmentEmployee[]

        // Combine employee data with assignment data
        const assignedEmployeesData = employeesData
          .filter((employee) => assignments.some((a) => a.employeeId === employee.id))
          .map((employee) => {
            const assignment = assignments.find((a) => a.employeeId === employee.id)
            return {
              ...employee,
              assignmentId: assignment?.id,
              role: assignment?.role,
              isManager: assignment?.isManager,
            }
          })

        setAssignedEmployees(assignedEmployeesData)

        // Set available employees (those not already assigned)
        const availableEmployeesData = employeesData.filter(
          (employee) => !assignments.some((a) => a.employeeId === employee.id),
        )
        setAvailableEmployees(availableEmployeesData)

        // Initialize selected employees, roles, and manager status
        const initialSelectedEmployees: Record<string, boolean> = {}
        const initialEmployeeRoles: Record<string, string> = {}
        const initialEmployeeManagers: Record<string, boolean> = {}

        assignedEmployeesData.forEach((employee) => {
          initialSelectedEmployees[employee.id] = true
          initialEmployeeRoles[employee.id] = employee.role || ""
          initialEmployeeManagers[employee.id] = employee.isManager || false
        })

        setSelectedEmployees(initialSelectedEmployees)
        setEmployeeRoles(initialEmployeeRoles)
        setEmployeeManagers(initialEmployeeManagers)

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

    // Initialize role and manager status for newly selected employees
    if (isSelected && !employeeRoles[employeeId]) {
      setEmployeeRoles((prev) => ({
        ...prev,
        [employeeId]: "",
      }))
      setEmployeeManagers((prev) => ({
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

  const handleManagerChange = (employeeId: string, isManager: boolean) => {
    setEmployeeManagers((prev) => ({
      ...prev,
      [employeeId]: isManager,
    }))
  }

  const handleSave = async () => {
    if (!department) return

    try {
      setIsSaving(true)
      setError(null)

      const user = auth.currentUser
      if (!user) {
        throw new Error("You must be logged in to manage department employees")
      }

      const batch = writeBatch(db)
      const departmentRef = doc(db, "departments", department.id)

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
            (employee.role !== employeeRoles[employee.id] || employee.isManager !== employeeManagers[employee.id]),
        )
        .map((employee) => ({
          id: employee.assignmentId,
          employeeId: employee.id,
          role: employeeRoles[employee.id],
          isManager: employeeManagers[employee.id],
        }))
        .filter(
          (item): item is { id: string; employeeId: string; role: string; isManager: boolean } => item.id !== undefined,
        )

      // Add new assignments
      const addPromises = employeesToAdd.map((employeeId) =>
        addDoc(collection(db, "departmentEmployees"), {
          departmentId: department.id,
          employeeId,
          role: employeeRoles[employeeId] || "",
          isManager: employeeManagers[employeeId] || false,
          assignmentDate: new Date().toISOString(),
          userId: user.uid,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      )

      // Remove assignments
      const removePromises = employeesToRemove.map((assignmentId) =>
        deleteDoc(doc(db, "departmentEmployees", assignmentId)),
      )

      // Update assignments
      const updatePromises = employeesToUpdate.map((item) =>
        updateDoc(doc(db, "departmentEmployees", item.id), {
          role: item.role,
          isManager: item.isManager,
          updatedAt: new Date(),
        }),
      )

      // Execute all operations
      await Promise.all([...addPromises, ...removePromises, ...updatePromises])

      // Update department employee count
      const newEmployeeCount = Object.values(selectedEmployees).filter(Boolean).length
      await updateDoc(departmentRef, {
        employeeCount: newEmployeeCount,
        updatedAt: new Date(),
      })

      // Update department manager if needed
      const newManagers = Object.entries(employeeManagers)
        .filter(([id, isManager]) => isManager && selectedEmployees[id])
        .map(([id]) => id)

      if (newManagers.length > 0) {
        // If there are multiple managers, just pick the first one
        const newManagerId = newManagers[0]
        const managerEmployee = employees.find((e) => e.id === newManagerId)

        if (managerEmployee) {
          await updateDoc(departmentRef, {
            managerId: newManagerId,
            managerName: `${managerEmployee.firstName} ${managerEmployee.lastName}`,
            updatedAt: new Date(),
          })
        }
      } else if (department.managerId) {
        // If there was a manager but now there isn't one
        await updateDoc(departmentRef, {
          managerId: null,
          managerName: null,
          updatedAt: new Date(),
        })
      }

      // Redirect back to department details
      router.push(`/dashboard/departments/${department.id}`)
    } catch (error) {
      console.error("Error saving department employees:", error)
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
  }
\
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link href={`/dashboard/departments/${department?.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Department
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Manage Department Employees</h1>
          <p className="text-gray-600">
            Assign or remove employees for <span className="font-medium">{department?.name}</span>
          </p>
        </div>
      </div>

      {error && <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Currently Assigned</CardTitle>
            <CardDescription>Employees currently assigned to this department</CardDescription>
          </CardHeader>
          <CardContent>
            {assignedEmployees.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Assigned</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Role in Department</TableHead>
                    <TableHead className="w-20">Manager</TableHead>
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
                          placeholder="Role in department"
                          value={employeeRoles[employee.id] || ""}
                          onChange={(e) => handleRoleChange(employee.id, e.target.value)}
                          disabled={!selectedEmployees[employee.id]}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={employeeManagers[employee.id] || false}
                          onCheckedChange={(checked) => handleManagerChange(employee.id, !!checked)}
                          disabled={!selectedEmployees[employee.id]}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No employees are currently assigned to this department</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Available Employees</CardTitle>
            <CardDescription>Employees from this company that can be assigned to the department</CardDescription>
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
                    <TableHead>Role in Department</TableHead>
                    <TableHead className="w-20">Manager</TableHead>
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
                          placeholder="Role in department"
                          value={employeeRoles[employee.id] || ""}
                          onChange={(e) => handleRoleChange(employee.id, e.target.value)}
                          disabled={!selectedEmployees[employee.id]}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={employeeManagers[employee.id] || false}
                          onCheckedChange={(checked) => handleManagerChange(employee.id, !!checked)}
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
                  <p className="text-gray-500">All employees are already assigned to this department</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex justify-end space-x-2">
        <Button variant="outline" asChild>
          <Link href={`/dashboard/departments/${department?.id}`}>Cancel</Link>
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save Assignments"}
        </Button>
      </div>
    </div>
  )
}

