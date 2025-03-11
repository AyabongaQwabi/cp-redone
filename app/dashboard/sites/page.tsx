"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { PlusCircle, Search, Edit, Trash2, Eye, Filter, MapPin, Building, Users } from "lucide-react"
import { db, auth } from "@/lib/firebase-client"
import { collection, getDocs, query, where, deleteDoc, doc } from "firebase/firestore"
import type { Site, Company } from "@/app/types"
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

export default function SitesPage() {
  const router = useRouter()
  const [sites, setSites] = useState<Site[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [filteredSites, setFilteredSites] = useState<Site[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCompany, setFilterCompany] = useState<string>("all")
  const [selectedSite, setSelectedSite] = useState<Site | null>(null)
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

        // Fetch sites
        const sitesQuery = query(collection(db, "sites"), where("userId", "==", user.uid))
        const sitesSnapshot = await getDocs(sitesQuery)
        const sitesData = sitesSnapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            // Add company name to each site
            companyName: data.companyId ? companyMap[data.companyId] : undefined,
          }
        }) as Site[]

        setSites(sitesData)
        setFilteredSites(sitesData)
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
    // Filter sites based on search term and company filter
    let filtered = sites

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (site) =>
          site.name.toLowerCase().includes(term) ||
          site.address.toLowerCase().includes(term) ||
          site.city.toLowerCase().includes(term) ||
          (site.companyName && site.companyName.toLowerCase().includes(term)),
      )
    }

    // Apply company filter
    if (filterCompany !== "all") {
      filtered = filtered.filter((site) => site.companyId === filterCompany)
    }

    setFilteredSites(filtered)
  }, [searchTerm, filterCompany, sites])

  const handleDeleteSite = async () => {
    if (!selectedSite) return

    try {
      await deleteDoc(doc(db, "sites", selectedSite.id))

      // Update the sites list
      setSites(sites.filter((site) => site.id !== selectedSite.id))
      setIsDeleteDialogOpen(false)
      setSelectedSite(null)
    } catch (error) {
      console.error("Error deleting site:", error)
      setError("Failed to delete site")
    }
  }

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Sites</h1>
          <p className="text-gray-600">Manage your company sites and employee assignments</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/sites/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Site
          </Link>
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter sites by name, location, or company</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Search sites..."
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

      {filteredSites.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Site Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSites.map((site) => (
                  <TableRow key={site.id}>
                    <TableCell className="font-medium">{site.name}</TableCell>
                    <TableCell>
                      {site.companyName ? (
                        <div className="flex items-center">
                          <Building className="mr-1 h-4 w-4 text-gray-400" />
                          {site.companyName}
                        </div>
                      ) : (
                        <span className="text-gray-400">Unknown</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {site.city}, {site.province}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(site.status)}>{site.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="mr-1 h-4 w-4 text-gray-400" />
                        {site.employeeCount || 0}
                      </div>
                    </TableCell>
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
                            <Link href={`/dashboard/sites/${site.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/sites/${site.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/sites/${site.id}/employees`}>
                              <Users className="mr-2 h-4 w-4" />
                              Manage Employees
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedSite(site)
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
              Showing {filteredSites.length} of {sites.length} sites
            </p>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No sites found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || filterCompany !== "all"
                ? "No sites match your filters. Try adjusting your search criteria."
                : "Get started by adding your first company site."}
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
                <Link href="/dashboard/sites/create">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Site
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Site Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Site</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedSite?.name}? This action cannot be undone and will remove all
              employee assignments to this site.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSite}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

