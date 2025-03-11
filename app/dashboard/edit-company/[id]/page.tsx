"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SearchableSelect, type Option } from "@/components/ui/searchable-select"
import { FileUpload } from "@/components/ui/file-upload"
import type { Company } from "@/app/types"
import { getDocs, collection } from "firebase/firestore"

// South African provinces
const provinces = [
  { value: "eastern-cape", label: "Eastern Cape" },
  { value: "free-state", label: "Free State" },
  { value: "gauteng", label: "Gauteng" },
  { value: "kwazulu-natal", label: "KwaZulu-Natal" },
  { value: "limpopo", label: "Limpopo" },
  { value: "mpumalanga", label: "Mpumalanga" },
  { value: "north-west", label: "North West" },
  { value: "northern-cape", label: "Northern Cape" },
  { value: "western-cape", label: "Western Cape" },
]

export default function EditCompanyPage({ params }: { params: { id: string } }) {
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // State for options
  const [industries, setIndustries] = useState<Option[]>([])
  const [towns, setTowns] = useState<Option[]>([])
  const [suburbs, setSuburbs] = useState<Option[]>([])

  useEffect(() => {
    const fetchCompany = async () => {
      const user = auth.currentUser
      if (!user) {
        router.push("/login")
        return
      }

      const docRef = doc(db, "companies", params.id)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const fetchedCompany = { id: docSnap.id, ...docSnap.data() } as Company
        if (fetchedCompany.userId !== user.uid) {
          router.push("/dashboard/companies")
          return
        }
        setCompany(fetchedCompany)
      } else {
        router.push("/dashboard/companies")
      }
      setLoading(false)
    }

    fetchCompany()
  }, [params.id, router])

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        // Fetch industries
        const industriesSnapshot = await getDocs(collection(db, "industries"))
        const industriesData = industriesSnapshot.docs.map((doc) => ({
          value: doc.id,
          label: doc.data().name,
        }))
        setIndustries(industriesData)

        // Fetch towns
        const townsSnapshot = await getDocs(collection(db, "towns"))
        const townsData = townsSnapshot.docs.map((doc) => ({
          value: doc.id,
          label: doc.data().name,
        }))
        setTowns(townsData)

        // Fetch suburbs
        const suburbsSnapshot = await getDocs(collection(db, "suburbs"))
        const suburbsData = suburbsSnapshot.docs.map((doc) => ({
          value: doc.id,
          label: doc.data().name,
        }))
        setSuburbs(suburbsData)
      } catch (error) {
        console.error("Error fetching options:", error)
        setError("Failed to load form options")
      }
    }

    fetchOptions()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setCompany((prev) => (prev ? { ...prev, [name]: value } : null))
  }

  const handleSave = async () => {
    if (!company) return

    setSaving(true)
    try {
      const docRef = doc(db, "companies", company.id)
      await updateDoc(docRef, {
        ...company,
        updatedAt: new Date(),
      })
      router.push("/dashboard/companies")
    } catch (error) {
      console.error("Error updating company:", error)
      setError("Failed to update company")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!company) {
    return <div>Company not found</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Edit Company: {company.name}</h1>

      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSave()
        }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <div>
          <Label htmlFor="name">Company Name</Label>
          <Input id="name" name="name" value={company.name} onChange={handleInputChange} required />
        </div>

        <div>
          <Label htmlFor="industry">Industry</Label>
          <SearchableSelect
            options={industries}
            value={company.industry}
            onChange={(value) => setCompany((prev) => (prev ? { ...prev, industry: value } : null))}
            placeholder="Select or create an industry"
          />
        </div>

        <div>
          <Label htmlFor="contactEmail">Contact Email</Label>
          <Input
            id="contactEmail"
            name="contactEmail"
            type="email"
            value={company.contactEmail}
            onChange={handleInputChange}
            required
          />
        </div>

        <div>
          <Label htmlFor="invoicesEmail">Invoices Email</Label>
          <Input
            id="invoicesEmail"
            name="invoicesEmail"
            type="email"
            value={company.invoicesEmail || ""}
            onChange={handleInputChange}
          />
        </div>

        <div>
          <Label htmlFor="contactPhone">Contact Phone</Label>
          <Input
            id="contactPhone"
            name="contactPhone"
            type="tel"
            value={company.contactPhone || ""}
            onChange={handleInputChange}
          />
        </div>

        <div>
          <Label htmlFor="address">Street Address</Label>
          <Textarea id="address" name="address" value={company.address || ""} onChange={handleInputChange} rows={2} />
        </div>

        <div>
          <Label htmlFor="town">Town</Label>
          <SearchableSelect
            options={towns}
            value={company.town || ""}
            onChange={(value) => setCompany((prev) => (prev ? { ...prev, town: value } : null))}
            placeholder="Select or create a town"
          />
        </div>

        <div>
          <Label htmlFor="suburb">Suburb</Label>
          <SearchableSelect
            options={suburbs}
            value={company.suburb || ""}
            onChange={(value) => setCompany((prev) => (prev ? { ...prev, suburb: value } : null))}
            placeholder="Select or create a suburb"
          />
        </div>

        <div>
          <Label htmlFor="province">Province</Label>
          <select
            id="province"
            name="province"
            value={company.province || ""}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
          >
            <option value="">Select a province</option>
            {provinces.map((province) => (
              <option key={province.value} value={province.value}>
                {province.label}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <FileUpload
            label="Company Logo (optional)"
            accept="image/*"
            maxSize={2}
            onUploadComplete={(url) => setCompany((prev) => (prev ? { ...prev, logo: url } : null))}
            value={company.logo || ""}
          />
        </div>

        <div className="md:col-span-2">
          <Button type="submit" disabled={saving} className="w-full">
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  )
}

