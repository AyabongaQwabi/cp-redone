"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { PlusCircle, Search, Edit, Trash2, Eye, Filter, Briefcase, Building, Users } from "lucide-react"
import { db, auth } from "@/lib/firebase-client"
import { collection, getDocs, query, where, deleteDoc, doc } from "firebase/firestore"
import type { Department, Company } from "@/app/types"
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

export default function DepartmentsPage() {
  const router = useRouter()
  const [departments, setDepartments] = useState<Department[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCompany, setFilterCompany] = useState<string>("all")
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

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

        // Fetch departments
        const departmentsQuery = query(collection(db, "departments"), where("userId", "==", user.uid))
        const departmentsSnapshot = await getDocs(departmentsQuery)
        const departmentsData = departmentsSnapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            // Add company name to each department
            companyName: data.companyId ? companyMap[data.companyId] : undefined,
          }
        }) as Department[]

        setDepartments(departmentsData)
        setFilteredDepartments(departmentsData)
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
    // Filter departments based on search term and company filter
    let filtered = departments

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (department) =>
          department.name.toLowerCase().includes(term) ||
          (department.description && department.description.toLowerCase().includes(term)) ||
          (department.companyName && department.companyName.toLowerCase().includes(term)),
      )
    }

    // Apply company filter
    if (filterCompany !== "all") {
      filtered = filtered.filter((department) => department.companyId === filterCompany)
    }

    setFilteredDepartments(filtered)
  }, [searchTerm, filterCompany, departments])

  const handleDeleteDepartment = async () => {
    if (!selectedDepartment) return

    try {
      await deleteDoc(doc(db, "departments", selectedDepartment.id))

      // Update the departments list
      setDepartments(departments.filter((dept) => dept.id !== selectedDepartment.id))
      setIsDeleteDialogOpen(false)
      setSelectedDepartment(null)
    } catch (error) {
      console.error("Error deleting department:", error)
      setError("Failed to delete department")
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800"
      case "Inactive":
        return "bg-red-100 text-red-800"
      case "Restructuring":
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
          <h1 className="text-3xl font-bold">Departments</h1>
          <p className="text-gray-600">Manage your company departments and employee assignments</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/departments/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Department
          </Link>
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter departments by name or company</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Search departments..."
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
          </div>
        </CardContent>
      </Card>

      {filteredDepartments.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDepartments.map((department) => (
                  <TableRow key={department.id}>
                    <TableCell className="font-medium">{department.name}</TableCell>
                    <TableCell>
                      {department.companyName ? (
                        <div className="flex items-center">
                          <Building className="mr-1 h-4 w-4 text-gray-400" />
                          {department.companyName}
                        </div>
                      ) : (
                        <span className="text-gray-400">Unknown</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(department.status)}>{department.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="mr-1 h-4 w-4 text-gray-400" />
                        {department.employeeCount || 0}
                      </div>
                    </TableCell>
                    <TableCell>{department.location || "Not specified"}</TableCell>
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
                            <Link href={`/dashboard/departments/${department.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/departments/${department.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/departments/${department.id}/employees`}>
                              <Users className="mr-2 h-4 w-4" />
                              Manage Employees
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedDepartment(department)
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
              Showing {filteredDepartments.length} of {departments.length} departments
            </p>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Briefcase className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No departments found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || filterCompany !== "all"
                ? "No departments match your filters. Try adjusting your search criteria."
                : "Get started by adding your first company department."}
            </p>
            {searchTerm || filterCompany !== "all" ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setFilterCompany("all")
                }}
              >
                Clear Filters
              </Button>
            ) : (
              <Button asChild>
                <Link href="/dashboard/departments/create">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Department
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Department Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Department</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedDepartment?.name}? This action cannot be undone and will remove
              all employee assignments to this department.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteDepartment}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

