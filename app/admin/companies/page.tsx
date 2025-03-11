"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/firebase-client"
import { collection, getDocs } from "firebase/firestore"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Company } from "@/app/types"

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    const querySnapshot = await getDocs(collection(db, "companies"))
    const companiesList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Company)
    setCompanies(companiesList)
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Companies</h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((company) => (
            <TableRow key={company.id}>
              <TableCell>{company.name}</TableCell>
              <TableCell>{company.address}</TableCell>
              <TableCell>{company.phone}</TableCell>
              <TableCell>{company.email}</TableCell>
              <TableCell>{company.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

