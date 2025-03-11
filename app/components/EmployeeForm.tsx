"use client"

import type React from "react"
import { useState } from "react"
import { Input, Checkbox, TextArea } from "./FormComponents"
import CloudinaryUpload from "./CloudinaryUpload"

interface Employee {
  id: string
  name: string
  idNumber: string
  comments: string[]
  occupation: string
  services: string[]
  sites: { siteName: string; requiresAccessCard: boolean }[]
  isMinimized: boolean
  dover: { required: boolean }
  xray: { required: boolean }
  jobSpecFileUrl?: string
}

interface EmployeeFormProps {
  employee: Employee
  onUpdate: (updatedEmployee: Employee) => void
  onDelete: () => void
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ employee, onUpdate, onDelete }) => {
  const [isMinimized, setIsMinimized] = useState(employee.isMinimized)

  const handleInputChange = (field: keyof Employee, value: any) => {
    onUpdate({ ...employee, [field]: value })
  }

  const handleServiceChange = (service: string, isChecked: boolean) => {
    const updatedServices = isChecked ? [...employee.services, service] : employee.services.filter((s) => s !== service)

    const updatedEmployee = {
      ...employee,
      services: updatedServices,
      dover: { required: updatedServices.includes("Dover") },
      xray: { required: updatedServices.includes("X-ray") },
    }
    onUpdate(updatedEmployee)
  }

  const handleSiteChange = (index: number, field: "siteName" | "requiresAccessCard", value: string | boolean) => {
    const updatedSites = [...employee.sites]
    updatedSites[index] = { ...updatedSites[index], [field]: value }
    onUpdate({ ...employee, sites: updatedSites })
  }

  const addSite = () => {
    onUpdate({
      ...employee,
      sites: [...employee.sites, { siteName: "", requiresAccessCard: false }],
    })
  }

  const removeSite = (index: number) => {
    const updatedSites = employee.sites.filter((_, i) => i !== index)
    onUpdate({ ...employee, sites: updatedSites })
  }

  const handleFileUpload = (url: string) => {
    onUpdate({ ...employee, jobSpecFileUrl: url })
  }

  if (isMinimized) {
    return (
      <div className="border p-4 rounded-md mb-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{employee.name || "New Employee"}</h3>
          <button onClick={() => setIsMinimized(false)} className="text-blue-600 hover:text-blue-800">
            Expand
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="border p-4 rounded-md mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{employee.name || "New Employee"}</h3>
        <div>
          <button onClick={() => setIsMinimized(true)} className="text-blue-600 hover:text-blue-800 mr-2">
            Minimize
          </button>
          <button onClick={onDelete} className="text-red-600 hover:text-red-800">
            Delete
          </button>
        </div>
      </div>

      <Input label="Name" value={employee.name} onChange={(e) => handleInputChange("name", e.target.value)} />
      <Input
        label="ID Number"
        value={employee.idNumber}
        onChange={(e) => handleInputChange("idNumber", e.target.value)}
      />
      <TextArea
        label="Comments"
        value={employee.comments.join("\n")}
        onChange={(e) => handleInputChange("comments", e.target.value.split("\n"))}
      />
      <Input
        label="Occupation"
        value={employee.occupation}
        onChange={(e) => handleInputChange("occupation", e.target.value)}
      />

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Services</label>
        <div className="space-y-2">
          {["General Checkup", "Dover", "X-ray"].map((service) => (
            <Checkbox
              key={service}
              label={service}
              checked={employee.services.includes(service)}
              onChange={(e) => handleServiceChange(service, e.target.checked)}
            />
          ))}
        </div>
      </div>

      {employee.dover.required && (
        <TextArea
          label="Dover Details"
          value={employee.dover.details || ""}
          onChange={(e) => handleInputChange("dover", { ...employee.dover, details: e.target.value })}
        />
      )}

      {employee.xray.required && (
        <TextArea
          label="X-ray Details"
          value={employee.xray.details || ""}
          onChange={(e) => handleInputChange("xray", { ...employee.xray, details: e.target.value })}
        />
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Sites</label>
        {employee.sites.map((site, index) => (
          <div key={index} className="flex items-center space-x-2 mb-2">
            <Input
              value={site.siteName}
              onChange={(e) => handleSiteChange(index, "siteName", e.target.value)}
              placeholder="Site Name"
            />
            <Checkbox
              label="Requires Access Card"
              checked={site.requiresAccessCard}
              onChange={(e) => handleSiteChange(index, "requiresAccessCard", e.target.checked)}
            />
            <button onClick={() => removeSite(index)} className="text-red-600 hover:text-red-800">
              Remove
            </button>
          </div>
        ))}
        <button onClick={addSite} className="text-blue-600 hover:text-blue-800">
          Add Site
        </button>
      </div>

      <CloudinaryUpload onUploadComplete={handleFileUpload} />
      {employee.jobSpecFileUrl && (
        <div className="mt-2">
          <a
            href={employee.jobSpecFileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800"
          >
            View Uploaded Job Spec File
          </a>
        </div>
      )}
    </div>
  )
}

export default EmployeeForm

