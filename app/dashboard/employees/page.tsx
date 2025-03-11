"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { PlusCircle, Search, Edit, Trash2, Eye, Filter, UserPlus, Building, X } from "lucide-react"
import { db, auth } from "@/lib/firebase-client"
import { collection, getDocs, query, where, deleteDoc, doc, getDoc, updateDoc } from "firebase/firestore"
import type { Employee, Company } from "@/app/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function EmployeesPage() {
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCompany, setFilterCompany] = useState<string>("all")
  const [showUnassigned, setShowUnassigned] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isRemoveFromCompanyDialogOpen, setIsRemoveFromCompanyDialogOpen] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)

        const user = auth.currentUser
        if (!user) {
          router.push("/login")
          return
        }

        // Fetch companies
        const companiesQuery = query(collection(db, "companies"), where("userId", "==", user.uid))
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

        // Fetch employees
        const employeesQuery = query(collection(db, "employees"), where("userId", "==", user.uid))
        const employeesSnapshot = await getDocs(employeesQuery)
        const employeesData = employeesSnapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            // Add company name to each employee if they have a company
            companyName: data.companyId ? companyMap[data.companyId] : undefined,
          }
        }) as Employee[]

        setEmployees(employeesData)
        setFilteredEmployees(employeesData)
        setError(null)
      } catch (error) {
        console.error("Error fetching data:", error)
        setError(error instanceof Error ? error.message : "An error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [router])

  useEffect(() => {
    // Filter employees based on search term and company filter
    let filtered = employees

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (employee) =>
          employee.firstName.toLowerCase().includes(term) ||
          employee.lastName.toLowerCase().includes(term) ||
          employee.email.toLowerCase().includes(term) ||
          employee.position.toLowerCase().includes(term) ||
          (employee.companyName && employee.companyName.toLowerCase().includes(term)),
      )
    }

    // Apply company filter
    if (filterCompany !== "all") {
      filtered = filtered.filter((employee) => employee.companyId === filterCompany)
    }

    // Apply unassigned filter
    if (showUnassigned) {
      filtered = filtered.filter((employee) => !employee.companyId)
    }

    setFilteredEmployees(filtered)
  }, [searchTerm, filterCompany, showUnassigned, employees])

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return

    try {
      await deleteDoc(doc(db, "employees", selectedEmployee.id))

      // Update the employees list
      setEmployees(employees.filter((emp) => emp.id !== selectedEmployee.id))
      setIsDeleteDialogOpen(false)
      setSelectedEmployee(null)
    } catch (error) {
      console.error("Error deleting employee:", error)
      setError("Failed to delete employee")
    }
  }

  const handleRemoveFromCompany = async () => {
    if (!selectedEmployee) return

    try {
      // Update employee to remove company association
      await updateDoc(doc(db, "employees", selectedEmployee.id), {
        companyId: null,
        companyName: null,
        updatedAt: new Date(),
      })

      // Update the company's employee count
      if (selectedEmployee.companyId) {
        const companyDoc = await getDoc(doc(db, "companies", selectedEmployee.companyId))
        if (companyDoc.exists()) {
          const companyData = companyDoc.data()
          await updateDoc(doc(db, "companies", selectedEmployee.companyId), {
            employeeCount: Math.max(0, (companyData.employeeCount || 1) - 1),
            updatedAt: new Date(),
          })
        }
      }

      // Update the employees list
      setEmployees(
        employees.map((emp) =>
          emp.id === selectedEmployee.id ? { ...emp, companyId: undefined, companyName: undefined } : emp,
        ),
      )

      setIsRemoveFromCompanyDialogOpen(false)
      setSelectedEmployee(null)
    } catch (error) {
      console.error("Error removing employee from company:", error)
      setError("Failed to remove employee from company")
    }
  }

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Employees</h1>
          <p className="text-gray-600">Manage your employees and their company assignments</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/employees/create">
            <UserPlus className="mr-2 h-4 w-4" />
            Add Employee
          </Link>
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter employees by name, company, or status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Search employees..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterCompany} onValueChange={setFilterCompany}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2">
              <Button
                variant={showUnassigned ? "default" : "outline"}
                onClick={() => setShowUnassigned(!showUnassigned)}
                className="flex items-center"
              >
                {showUnassigned ? <X className="mr-2 h-4 w-4" /> : <Filter className="mr-2 h-4 w-4" />}
                {showUnassigned ? "Clear Filter" : "Show Unassigned"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredEmployees.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">
                      {employee.firstName} {employee.lastName}
                    </TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>
                      {employee.companyName ? (
                        <div className="flex items-center">
                          <Building className="mr-1 h-4 w-4 text-gray-400" />
                          {employee.companyName}
                        </div>
                      ) : (
                        <span className="text-gray-400">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(employee.status)}>{employee.status}</Badge>
                    </TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <span className="sr-only">Open menu</span>
                            <Filter className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/employees/${employee.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/employees/${employee.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {employee.companyId && (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedEmployee(employee)
                                setIsRemoveFromCompanyDialogOpen(true)
                              }}
                              className="text-yellow-600"
                            >
                              <Building className="mr-2 h-4 w-4" />
                              Remove from Company
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedEmployee(employee)
                              setIsDeleteDialogOpen(true)
                            }}
                            className="text-red-600"
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
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <p className="text-sm text-gray-500">
              Showing {filteredEmployees.length} of {employees.length} employees
            </p>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserPlus className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No employees found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || filterCompany !== "all" || showUnassigned
                ? "No employees match your filters. Try adjusting your search criteria."
                : "Get started by adding your first employee."}
            </p>
            {searchTerm || filterCompany !== "all" || showUnassigned ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setFilterCompany("all")
                  setShowUnassigned(false)
                }}
              >
                Clear Filters
              </Button>
            ) : (
              <Button asChild>
                <Link href="/dashboard/employees/create">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Employee
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Employee Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Employee</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedEmployee?.firstName} {selectedEmployee?.lastName}? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteEmployee}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove from Company Dialog */}
      <Dialog open={isRemoveFromCompanyDialogOpen} onOpenChange={setIsRemoveFromCompanyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove from Company</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedEmployee?.firstName} {selectedEmployee?.lastName} from{" "}
              {selectedEmployee?.companyName}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRemoveFromCompanyDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="default" onClick={handleRemoveFromCompany}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

