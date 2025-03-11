"use client"

import type React from "react"
import Link from "next/link"
import type { Appointment } from "../types"

interface AppointmentCardProps {
  appointment: Appointment
  onCancel: (id: string) => void
  companyName?: string
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment, onCancel, companyName }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{appointment.clinicName}</h3>
        <span
          className={`px-2 py-1 rounded-full text-sm ${
            appointment.status === "Confirmed"
              ? "bg-green-200 text-green-800"
              : appointment.status === "Pending"
                ? "bg-yellow-200 text-yellow-800"
                : "bg-red-200 text-red-800"
          }`}
        >
          {appointment.status}
        </span>
      </div>
      {companyName && <p className="text-gray-600 mb-2">Company: {companyName}</p>}
      <p className="text-gray-600 mb-2">Date: {new Date(appointment.date).toLocaleDateString()}</p>
      <p className="text-gray-600 mb-4">Time: {appointment.time}</p>
      <div className="flex justify-between">
        <Link href={`/dashboard/edit-appointment/${appointment.id}`} className="text-blue-600 hover:text-blue-800">
          Edit
        </Link>
        <button onClick={() => onCancel(appointment.id)} className="text-red-600 hover:text-red-800">
          Cancel
        </button>
      </div>
    </div>
  )
}

export default AppointmentCard

