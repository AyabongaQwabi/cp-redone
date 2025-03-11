"use client"

import type React from "react"
import { useState, useEffect } from "react"

interface QuotationFormProps {
  onSubmit: (data: QuotationData) => void
}

interface QuotationData {
  appointmentType: string
  additionalRequirements: string
  totalCost: number
}

const QuotationForm: React.FC<QuotationFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<QuotationData>({
    appointmentType: "",
    additionalRequirements: "",
    totalCost: 0,
  })

  useEffect(() => {
    calculateTotalCost()
  }, [formData.appointmentType, formData.additionalRequirements])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const calculateTotalCost = () => {
    let cost = 0
    switch (formData.appointmentType) {
      case "General Checkup":
        cost = 100
        break
      case "Specialized Consultation":
        cost = 200
        break
      case "Occupational Health Assessment":
        cost = 300
        break
      default:
        cost = 0
    }

    if (formData.additionalRequirements.length > 0) {
      cost += 50 // Add a flat fee for additional requirements
    }

    setFormData((prev) => ({ ...prev, totalCost: cost }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="appointmentType" className="block text-sm font-medium text-gray-700">
          Appointment Type
        </label>
        <select
          id="appointmentType"
          name="appointmentType"
          value={formData.appointmentType}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        >
          <option value="">Select an appointment type</option>
          <option value="General Checkup">General Checkup</option>
          <option value="Specialized Consultation">Specialized Consultation</option>
          <option value="Occupational Health Assessment">Occupational Health Assessment</option>
        </select>
      </div>
      <div>
        <label htmlFor="additionalRequirements" className="block text-sm font-medium text-gray-700">
          Additional Requirements
        </label>
        <textarea
          id="additionalRequirements"
          name="additionalRequirements"
          value={formData.additionalRequirements}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        ></textarea>
      </div>
      <div>
        <p className="text-lg font-semibold">Total Cost: ${formData.totalCost}</p>
      </div>
      <div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Generate Quotation
        </button>
      </div>
    </form>
  )
}

export default QuotationForm

