"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db, auth } from "@/lib/firebase-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Edit } from "lucide-react"
import type { Company } from "@/app/types"

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchCompanies = async () => {
      const user = auth.currentUser
      if (!user) {
        router.push("/login")
        return
      }

      const q = query(collection(db, "companies"), where("userId", "==", user.uid))
      const querySnapshot = await getDocs(q)
      const fetchedCompanies = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Company)
      setCompanies(fetchedCompanies)
      setLoading(false)
    }

    fetchCompanies()
  }, [router])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Companies</h1>
        <Link href="/dashboard/create-company">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create Company
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => (
            <Card key={company.id}>
              <CardHeader>
                <CardTitle>{company.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{company.industry}</p>
                <p className="text-sm text-gray-600">{company.contactEmail}</p>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/dashboard/edit-company/${company.id}`)}
                >
                  <Edit className="mr-2 h-4 w-4" /> Edit Company
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

