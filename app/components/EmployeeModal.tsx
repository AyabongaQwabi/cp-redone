"use client"

import type React from "react"
import { useState } from "react"
import { Dialog } from "@headlessui/react"
import { Input } from "./FormComponents"

interface Employee {
  id: string
  name: string
  idNumber: string
  occupation: string
}

interface EmployeeModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (employee: Employee) => void
}

const EmployeeModal: React.FC<EmployeeModalProps> = ({ isOpen, onClose, onSave }) => {
  const [employee, setEmployee] = useState<Employee>({
    id: "",
    name: "",
    idNumber: "",
    occupation: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEmployee((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ ...employee, id: Date.now().toString() })
    setEmployee({ id: "", name: "", idNumber: "", occupation: "" })
    onClose()
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 z-10 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen">
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
        <div className="relative bg-white rounded-lg max-w-md mx-auto p-6 shadow-xl">
          <Dialog.Title className="text-lg font-medium mb-4">Add Employee</Dialog.Title>
          <form onSubmit={handleSubmit}>
            <Input label="Name" id="name" name="name" value={employee.name} onChange={handleChange} required />
            <Input
              label="ID Number"
              id="idNumber"
              name="idNumber"
              value={employee.idNumber}
              onChange={handleChange}
              required
            />
            <Input
              label="Occupation"
              id="occupation"
              name="occupation"
              value={employee.occupation}
              onChange={handleChange}
              required
            />
            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={onClose}
                className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </Dialog>
  )
}

export default EmployeeModal

