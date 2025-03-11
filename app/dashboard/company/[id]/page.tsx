"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { db, auth } from "@/lib/firebase-client"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import type { Company } from "@/app/types"

export default function CompanyDetail({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [company, setCompany] = useState<Company | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
  })

  useEffect(() => {
    async function fetchCompany() {
      try {
        setIsLoading(true)

        const user = auth.currentUser
        if (!user) {
          router.push("/login")
          return
        }

        const companyDoc = await getDoc(doc(db, "companies", params.id))

        if (!companyDoc.exists()) {
          setError("Company not found")
          return
        }

        const companyData = { id: companyDoc.id, ...companyDoc.data() } as Company

        // Verify that this company belongs to the current user
        if (companyData.userId !== user.uid) {
          setError("You don't have permission to view this company")
          return
        }

        setCompany(companyData)
        setFormData({
          name: companyData.name || "",
          industry: companyData.industry || "",
          contactEmail: companyData.contactEmail || "",
          contactPhone: companyData.contactPhone || "",
          address: companyData.address || "",
        })
      } catch (error) {
        console.error("Error fetching company:", error)
        setError(error instanceof Error ? error.message : "An error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchCompany()
  }, [params.id, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (!company) return

      await updateDoc(doc(db, "companies", company.id), {
        ...formData,
        updatedAt: new Date(),
      })

      // Update local state
      setCompany({
        ...company,
        ...formData,
        updatedAt: new Date(),
      })

      setIsEditing(false)
    } catch (error) {
      console.error("Error updating company:", error)
      alert("Failed to update company")
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  if (error) {
    return <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">{error}</div>
  }

  if (!company) {
    return <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">Company not found</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{company.name}</h1>
        <div className="space-x-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {isEditing ? "Cancel" : "Edit"}
          </button>
          <Link
            href={`/dashboard/company/${company.id}/appointments`}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            View Appointments
          </Link>
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Company Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
              Industry
            </label>
            <input
              type="text"
              id="industry"
              name="industry"
              value={formData.industry}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
              Contact Email
            </label>
            <input
              type="email"
              id="contactEmail"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-1">
              Contact Phone
            </label>
            <input
              type="tel"
              id="contactPhone"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
            ></textarea>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Save Changes
          </button>
        </form>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Company Details</h3>
              <p className="text-gray-600 mb-1">
                <span className="font-medium">Industry:</span> {company.industry}
              </p>
              <p className="text-gray-600 mb-1">
                <span className="font-medium">Contact Email:</span> {company.contactEmail}
              </p>
              {company.contactPhone && (
                <p className="text-gray-600 mb-1">
                  <span className="font-medium">Contact Phone:</span> {company.contactPhone}
                </p>
              )}
              {company.address && (
                <p className="text-gray-600 mb-1">
                  <span className="font-medium">Address:</span> {company.address}
                </p>
              )}
              <p className="text-gray-600 mb-1">
                <span className="font-medium">Employees:</span> {company.employeeCount || 0}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Company Statistics</h3>
              <p className="text-gray-600 mb-1">
                <span className="font-medium">Created:</span>{" "}
                {company.createdAt ? new Date(company.createdAt.seconds * 1000).toLocaleDateString() : "Unknown"}
              </p>
              <p className="text-gray-600 mb-1">
                <span className="font-medium">Last Updated:</span>{" "}
                {company.updatedAt ? new Date(company.updatedAt.seconds * 1000).toLocaleDateString() : "Unknown"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

