import type React from "react"

interface SummarySectionProps {
  totalAppointments: number
  totalCompanies: number
}

const SummarySection: React.FC<SummarySectionProps> = ({ totalAppointments, totalCompanies }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <h2 className="text-2xl font-semibold mb-4">Summary</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-gray-600">Total Appointments</p>
          <p className="text-3xl font-bold">{totalAppointments}</p>
        </div>
        <div>
          <p className="text-gray-600">Total Companies</p>
          <p className="text-3xl font-bold">{totalCompanies}</p>
        </div>
      </div>
    </div>
  )
}

export default SummarySection

