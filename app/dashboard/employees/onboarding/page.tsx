"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { auth, db } from "@/lib/firebase-client"
import { collection, addDoc, getDocs, query, where, doc, updateDoc, getDoc } from "firebase/firestore"
import type { Company, EmployeeDocument } from "@/app/types"
import { EmployeeDocumentType } from "@/app/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { DocumentUpload } from "@/components/ui/document-upload"
import { ArrowLeft, UserPlus, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function EmployeeOnboardingPage() {
  const router = useRouter()
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("personal")
  const [documents, setDocuments] = useState<EmployeeDocument[]>([])
  const [formProgress, setFormProgress] = useState({
    personal: false,
    employment: false,
    documents: false,
    consent: false,
  })

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    cellPhone: "",
    position: "",
    occupation: "",
    governmentIdNumber: "",
    department: "",
    employeeNumber: "",
    companyId: "",
    startDate: "",
    status: "Onboarding",
    dataProcessingConsent: false,
    emergencyContact: {
      name: "",
      relationship: "",
      phone: "",
    },
    medicalInfo: {
      bloodType: "",
      allergies: "",
      medicalConditions: "",
      medications: "",
    },
    notes: "",
  })

  useEffect(() => {
    async function fetchCompanies() {
      try {
        const user = auth.currentUser
        if (!user) {
          router.push("/login")
          return
        }

        const companiesQuery = query(collection(db, "companies"), where("userId", "==", user.uid))
        const companiesSnapshot = await getDocs(companiesQuery)
        const companiesData = companiesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Company[]

        setCompanies(companiesData)
      } catch (error) {
        console.error("Error fetching companies:", error)
        setError("Failed to load companies")
      }
    }

    fetchCompanies()
  }, [router])

  useEffect(() => {
    // Update form progress
    const personal = !!(
      formData.firstName &&
      formData.lastName &&
      formData.email &&
      formData.cellPhone &&
      formData.governmentIdNumber
    )

    const employment = !!(formData.position && formData.occupation && formData.companyId)

    const requiredDocuments = [
      EmployeeDocumentType.JOB_SPECIFICATION,
      EmployeeDocumentType.MEDICAL_CERTIFICATE,
      EmployeeDocumentType.NDA,
    ]
    const hasRequiredDocs = requiredDocuments.every((docType) => documents.some((doc) => doc.documentType === docType))

    setFormProgress({
      personal,
      employment,
      documents: hasRequiredDocs,
      consent: formData.dataProcessingConsent,
    })
  }, [formData, documents])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    // Handle nested objects
    if (name.includes(".")) {
      const [parent, child] = name.split(".")
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value,
        },
      }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleDocumentUpload = (documentData: {
    name: string
    fileName: string
    fileSize: number
    fileType: string
    url: string
    documentType: EmployeeDocumentType
    uploadDate: Date
  }) => {
    // Check if document of this type already exists
    const existingDocIndex = documents.findIndex((doc) => doc.documentType === documentData.documentType)

    if (existingDocIndex >= 0) {
      // Replace existing document
      const updatedDocuments = [...documents]
      updatedDocuments[existingDocIndex] = {
        ...documentData,
        id: documents[existingDocIndex].id,
        employeeId: documents[existingDocIndex].employeeId,
        status: "Pending",
        userId: documents[existingDocIndex].userId,
      }
      setDocuments(updatedDocuments)
    } else {
      // Add new document
      setDocuments([
        ...documents,
        {
          ...documentData,
          id: `temp-${Date.now()}`,
          employeeId: "",
          status: "Pending",
          userId: "",
        },
      ])
    }
  }

  const handleDocumentRemove = (documentType: EmployeeDocumentType) => {
    setDocuments(documents.filter((doc) => doc.documentType !== documentType))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const user = auth.currentUser
      if (!user) {
        throw new Error("You must be logged in to create an employee")
      }

      // Process allergies, medical conditions, and medications as arrays
      const processedMedicalInfo = {
        bloodType: formData.medicalInfo.bloodType,
        allergies: formData.medicalInfo.allergies
          ? formData.medicalInfo.allergies.split(",").map((item) => item.trim())
          : [],
        medicalConditions: formData.medicalInfo.medicalConditions
          ? formData.medicalInfo.medicalConditions.split(",").map((item) => item.trim())
          : [],
        medications: formData.medicalInfo.medications
          ? formData.medicalInfo.medications.split(",").map((item) => item.trim())
          : [],
      }

      // Create employee in Firestore
      const employeeData = {
        ...formData,
        medicalInfo: processedMedicalInfo,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const employeeRef = await addDoc(collection(db, "employees"), employeeData)
      const employeeId = employeeRef.id

      // Upload documents with employee ID
      if (documents.length > 0) {
        const processedDocuments = documents.map((doc) => ({
          ...doc,
          employeeId,
          userId: user.uid,
        }))

        // Add documents to Firestore
        for (const document of processedDocuments) {
          await addDoc(collection(db, "employeeDocuments"), document)
        }

        // Update employee with document references
        await updateDoc(employeeRef, {
          documents: processedDocuments,
        })
      }

      // If employee is assigned to a company, update the company's employee count
      if (formData.companyId) {
        const companyRef = doc(db, "companies", formData.companyId)
        const companyDoc = await getDoc(companyRef)

        if (companyDoc.exists()) {
          const companyData = companyDoc.data()
          await updateDoc(companyRef, {
            employeeCount: (companyData.employeeCount || 0) + 1,
            updatedAt: new Date(),
          })
        }
      }

      // Redirect to employees page
      router.push("/dashboard/employees")
    } catch (error) {
      console.error("Error creating employee:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const getTabStatus = (tabName: string) => {
    if (formProgress[tabName as keyof typeof formProgress]) {
      return <CheckCircle className="ml-2 h-4 w-4 text-green-500" />
    }
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link href="/dashboard/employees">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Employee Onboarding</h1>
          <p className="text-gray-600">Complete the onboarding process for a new employee</p>
        </div>
      </div>

      {error && <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded">{error}</div>}

      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{
              width: `${Object.values(formProgress).filter(Boolean).length * 25}%`,
            }}
          ></div>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Onboarding Progress: {Object.values(formProgress).filter(Boolean).length} of 4 steps completed
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal" className="flex items-center justify-center">
              Personal Information {getTabStatus("personal")}
            </TabsTrigger>
            <TabsTrigger value="employment" className="flex items-center justify-center">
              Employment Details {getTabStatus("employment")}
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center justify-center">
              Required Documents {getTabStatus("documents")}
            </TabsTrigger>
            <TabsTrigger value="consent" className="flex items-center justify-center">
              Consent & Submit {getTabStatus("consent")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Enter the employee's personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone (Optional)</Label>
                    <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cellPhone" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                      Cell Phone
                    </Label>
                    <Input
                      id="cellPhone"
                      name="cellPhone"
                      type="tel"
                      value={formData.cellPhone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="governmentIdNumber" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                      Government ID Number
                    </Label>
                    <Input
                      id="governmentIdNumber"
                      name="governmentIdNumber"
                      value={formData.governmentIdNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContact.name">Name</Label>
                      <Input
                        id="emergencyContact.name"
                        name="emergencyContact.name"
                        value={formData.emergencyContact.name}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContact.relationship">Relationship</Label>
                      <Input
                        id="emergencyContact.relationship"
                        name="emergencyContact.relationship"
                        value={formData.emergencyContact.relationship}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContact.phone">Phone</Label>
                      <Input
                        id="emergencyContact.phone"
                        name="emergencyContact.phone"
                        type="tel"
                        value={formData.emergencyContact.phone}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" type="button" onClick={() => router.push("/dashboard/employees")}>
                  Cancel
                </Button>
                <Button type="button" onClick={() => setActiveTab("employment")}>
                  Next
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="employment">
            <Card>
              <CardHeader>
                <CardTitle>Employment Details</CardTitle>
                <CardDescription>Enter the employee's work information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="position" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                      Position
                    </Label>
                    <Input
                      id="position"
                      name="position"
                      value={formData.position}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="occupation" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                      Occupation
                    </Label>
                    <Input
                      id="occupation"
                      name="occupation"
                      value={formData.occupation}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employeeNumber">Employee Number</Label>
                    <Input
                      id="employeeNumber"
                      name="employeeNumber"
                      value={formData.employeeNumber}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyId" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                      Company
                    </Label>
                    <Select
                      value={formData.companyId}
                      onValueChange={(value) => handleSelectChange("companyId", value)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select company" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Select a company</SelectItem>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input id="department" name="department" value={formData.department} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Onboarding">Onboarding</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="On Leave">On Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" type="button" onClick={() => setActiveTab("personal")}>
                  Previous
                </Button>
                <Button type="button" onClick={() => setActiveTab("documents")}>
                  Next
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Required Documents</CardTitle>
                <CardDescription>Upload the required employee documents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded mb-4">
                  <h3 className="font-medium mb-1">Document Requirements</h3>
                  <p className="text-sm">
                    Please upload the following required documents. All documents should be in PDF, DOC, DOCX, JPG, or
                    PNG format.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <DocumentUpload
                    documentType={EmployeeDocumentType.JOB_SPECIFICATION}
                    onUploadComplete={handleDocumentUpload}
                    onRemove={() => handleDocumentRemove(EmployeeDocumentType.JOB_SPECIFICATION)}
                    required
                  />

                  <DocumentUpload
                    documentType={EmployeeDocumentType.MEDICAL_CERTIFICATE}
                    onUploadComplete={handleDocumentUpload}
                    onRemove={() => handleDocumentRemove(EmployeeDocumentType.MEDICAL_CERTIFICATE)}
                    required
                  />

                  <DocumentUpload
                    documentType={EmployeeDocumentType.HAZARDOUS_WORK_RECORD}
                    onUploadComplete={handleDocumentUpload}
                    onRemove={() => handleDocumentRemove(EmployeeDocumentType.HAZARDOUS_WORK_RECORD)}
                  />

                  <DocumentUpload
                    documentType={EmployeeDocumentType.HEIGHTS_SPECIFICATION}
                    onUploadComplete={handleDocumentUpload}
                    onRemove={() => handleDocumentRemove(EmployeeDocumentType.HEIGHTS_SPECIFICATION)}
                  />

                  <DocumentUpload
                    documentType={EmployeeDocumentType.CONFINED_SPACES_SPECIFICATION}
                    onUploadComplete={handleDocumentUpload}
                    onRemove={() => handleDocumentRemove(EmployeeDocumentType.CONFINED_SPACES_SPECIFICATION)}
                  />

                  <DocumentUpload
                    documentType={EmployeeDocumentType.NDA}
                    onUploadComplete={handleDocumentUpload}
                    onRemove={() => handleDocumentRemove(EmployeeDocumentType.NDA)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" type="button" onClick={() => setActiveTab("employment")}>
                  Previous
                </Button>
                <Button type="button" onClick={() => setActiveTab("consent")}>
                  Next
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="consent">
            <Card>
              <CardHeader>
                <CardTitle>Consent & Submit</CardTitle>
                <CardDescription>Review information and provide consent</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded mb-4">
                  <h3 className="font-medium mb-1">Data Privacy Notice</h3>
                  <p className="text-sm">
                    The personal information collected will be used for employment purposes and will be stored securely
                    in accordance with relevant data protection regulations. Your information may be shared with
                    authorized personnel within the company and with third parties as required by law.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="dataProcessingConsent"
                      checked={formData.dataProcessingConsent}
                      onCheckedChange={(checked) => handleCheckboxChange("dataProcessingConsent", checked as boolean)}
                      required
                    />
                    <div className="space-y-1 leading-none">
                      <Label
                        htmlFor="dataProcessingConsent"
                        className="font-medium after:content-['*'] after:ml-0.5 after:text-red-500"
                      >
                        Data Processing Consent
                      </Label>
                      <p className="text-sm text-gray-500">
                        I consent to the collection, processing, and storage of my personal information as described in
                        the data privacy notice. I understand that I have the right to access, rectify, and request
                        deletion of my data.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Any additional information about the employee"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" type="button" onClick={() => setActiveTab("documents")}>
                  Previous
                </Button>
                <Button type="submit" disabled={isLoading}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {isLoading ? "Submitting..." : "Complete Onboarding"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  )
}

