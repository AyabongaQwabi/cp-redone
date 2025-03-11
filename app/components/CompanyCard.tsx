import type React from "react"
import Link from "next/link"
import type { Company } from "../types"

interface CompanyCardProps {
  company: Company
}

const CompanyCard: React.FC<CompanyCardProps> = ({ company }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-4">
      <h3 className="text-lg font-semibold mb-2">{company.name}</h3>
      <p className="text-gray-600 mb-1">Industry: {company.industry}</p>
      <p className="text-gray-600 mb-1">Email: {company.contactEmail}</p>
      {company.contactPhone && <p className="text-gray-600 mb-1">Phone: {company.contactPhone}</p>}
      <p className="text-gray-600 mb-4">Employees: {company.employeeCount || 0}</p>
      <div className="flex justify-between">
        <Link href={`/dashboard/company/${company.id}`} className="text-blue-600 hover:text-blue-800">
          Manage
        </Link>
        <Link href={`/dashboard/company/${company.id}/appointments`} className="text-green-600 hover:text-green-800">
          View Appointments
        </Link>
      </div>
    </div>
  )
}

export default CompanyCard

