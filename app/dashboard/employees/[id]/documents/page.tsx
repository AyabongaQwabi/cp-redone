"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { auth, db } from "@/lib/firebase-client"
import { doc, getDoc, collection, query, where, getDocs, updateDoc, deleteDoc, addDoc } from "firebase/firestore"
import type { Employee, EmployeeDocument } from "@/app/types"
import { EmployeeDocumentType } from "@/app/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DocumentUpload } from "@/components/ui/document-upload"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, FileText, Download, Trash2, CheckCircle, XCircle, Clock, Upload } from "lucide-react"
import Link from "next/link"

export default function EmployeeDocumentsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [documents, setDocuments] = useState<EmployeeDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("all")
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [selectedDocumentType, setSelectedDocumentType] = useState<EmployeeDocumentType | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<EmployeeDocument | null>(null)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [documentToUpdateStatus, setDocumentToUpdateStatus] = useState<EmployeeDocument | null>(null)
  const [newStatus, setNewStatus] = useState<"Approved" | "Rejected" | "Pending">("Pending")

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)

        const user = auth.currentUser
        if (!user) {
          router.push("/login")
          return
        }

        // Fetch employee
        const employeeDoc = await getDoc(doc(db, "employees", params.id))

        if (!employeeDoc.exists()) {
          setError("Employee not found")
          return
        }

        const employeeData = { id: employeeDoc.id, ...employeeDoc.data() } as Employee

        // Verify that this employee belongs to the current user
        if (employeeData.userId !== user.uid) {
          setError("You don't have permission to view this employee")
          return
        }

        setEmployee(employeeData)

        // Fetch documents
        const documentsQuery = query(
          collection(db, "employeeDocuments"),
          where("employeeId", "==", params.id),
          where("userId", "==", user.uid),
        )
        const documentsSnapshot = await getDocs(documentsQuery)
        const documentsData = documentsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as EmployeeDocument[]

        setDocuments(documentsData)
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

  const handleDocumentUpload = async (documentData: {
    name: string
    fileName: string
    fileSize: number
    fileType: string
    url: string
    documentType: EmployeeDocumentType
    uploadDate: Date
  }) => {
    try {
      const user = auth.currentUser
      if (!user) {
        throw new Error("You must be logged in to upload documents")
      }

      // Check if document of this type already exists
      const existingDoc = documents.find((doc) => doc.documentType === documentData.documentType)

      if (existingDoc) {
        // Update existing document
        await updateDoc(doc(db, "employeeDocuments", existingDoc.id), {
          ...documentData,
          status: "Pending",
          updatedAt: new Date(),
        })

        // Update documents list
        setDocuments(
          documents.map((doc) =>
            doc.id === existingDoc.id
              ? {
                  ...doc,
                  ...documentData,
                  status: "Pending",
                }
              : doc,
          ),
        )
      } else {
        // Create new document
        const newDocumentData = {
          ...documentData,
          employeeId: params.id,
          status: "Pending",
          userId: user.uid,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        const docRef = await addDoc(collection(db, "employeeDocuments"), newDocumentData)

        // Add to documents list
        setDocuments([
          ...documents,
          {
            ...newDocumentData,
            id: docRef.id,
          },
        ])
      }

      setIsUploadDialogOpen(false)
      setSelectedDocumentType(null)
    } catch (error) {
      console.error("Error uploading document:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
    }
  }

  const handleDeleteDocument = async () => {
    if (!documentToDelete) return

    try {
      await deleteDoc(doc(db, "employeeDocuments", documentToDelete.id))

      // Update documents list
      setDocuments(documents.filter((doc) => doc.id !== documentToDelete.id))
      setIsDeleteDialogOpen(false)
      setDocumentToDelete(null)
    } catch (error) {
      console.error("Error deleting document:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
    }
  }

  const handleUpdateDocumentStatus = async () => {
    if (!documentToUpdateStatus || !newStatus) return

    try {
      await updateDoc(doc(db, "employeeDocuments", documentToUpdateStatus.id), {
        status: newStatus,
        updatedAt: new Date(),
      })

      // Update documents list
      setDocuments(
        documents.map((doc) =>
          doc.id === documentToUpdateStatus.id
            ? {
                ...doc,
                status: newStatus,
              }
            : doc,
        ),
      )
      setIsStatusDialogOpen(false)
      setDocumentToUpdateStatus(null)
      setNewStatus("Pending")
    } catch (error) {
      console.error("Error updating document status:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Approved":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "Rejected":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "Pending":
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />
    }
  }

  const filteredDocuments = activeTab === "all" ? documents : documents.filter((doc) => doc.status === activeTab)

  const getDocumentTypeIcon = (documentType: EmployeeDocumentType) => {
    switch (documentType) {
      case EmployeeDocumentType.JOB_SPECIFICATION:
      case EmployeeDocumentType.HEIGHTS_SPECIFICATION:
      case EmployeeDocumentType.CONFINED_SPACES_SPECIFICATION:
        return <FileText className="h-5 w-5 text-blue-500" />
      case EmployeeDocumentType.MEDICAL_CERTIFICATE:
        return <FileText className="h-5 w-5 text-green-500" />
      case EmployeeDocumentType.HAZARDOUS_WORK_RECORD:
        return <FileText className="h-5 w-5 text-yellow-500" />
      case EmployeeDocumentType.NDA:
        return <FileText className="h-5 w-5 text-purple-500" />
      default:
        return <FileText className="h-5 w-5 text-gray-500" />
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  if (error) {
    return <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">{error}</div>
  }

  if (!employee) {
    return <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">Employee not found</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link href={`/dashboard/employees/${params.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Employee Documents</h1>
          <p className="text-gray-600">
            Manage documents for {employee.firstName} {employee.lastName}
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="all">All Documents</TabsTrigger>
            <TabsTrigger value="Pending">Pending</TabsTrigger>
            <TabsTrigger value="Approved">Approved</TabsTrigger>
            <TabsTrigger value="Rejected">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>

        <Button onClick={() => setIsUploadDialogOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No documents found</h3>
            <p className="text-gray-500 mb-4">
              {activeTab === "all"
                ? "No documents have been uploaded for this employee yet."
                : `No documents with status "${activeTab}" found.`}
            </p>
            <Button onClick={() => setIsUploadDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((document) => (
            <Card key={document.id} className="overflow-hidden">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getDocumentTypeIcon(document.documentType)}
                    <CardTitle className="text-base">{document.name}</CardTitle>
                  </div>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(document.status)}
                    <span className="text-xs font-medium">{document.status}</span>
                  </div>
                </div>
                <CardDescription className="text-xs truncate mt-1">{document.fileName}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="text-xs text-gray-500 mb-3">
                  Uploaded: {new Date(document.uploadDate).toLocaleDateString()}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open(document.url, "_blank")}
                  >
                    <Download className="mr-1 h-3 w-3" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDocumentToUpdateStatus(document)
                      setNewStatus(document.status)
                      setIsStatusDialogOpen(true)
                    }}
                  >
                    <CheckCircle className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive"
                    onClick={() => {
                      setDocumentToDelete(document)
                      setIsDeleteDialogOpen(true)
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Document Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>Select a document type and upload the file</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Document Type</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                value={selectedDocumentType || ""}
                onChange={(e) => setSelectedDocumentType(e.target.value as EmployeeDocumentType)}
              >
                <option value="">Select document type</option>
                {Object.values(EmployeeDocumentType).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {selectedDocumentType && (
              <DocumentUpload documentType={selectedDocumentType} onUploadComplete={handleDocumentUpload} required />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Document Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteDocument}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Document Status</DialogTitle>
            <DialogDescription>Change the status of this document</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Document Status</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as "Approved" | "Rejected" | "Pending")}
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateDocumentStatus}>Update Status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

