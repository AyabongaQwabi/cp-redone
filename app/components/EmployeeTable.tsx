"use client"

import type React from "react"

interface Employee {
  id: string
  name: string
  idNumber: string
  occupation: string
}

interface EmployeeTableProps {
  employees: Employee[]
  onDelete: (id: string) => void
}

const EmployeeTable: React.FC<EmployeeTableProps> = ({ employees, onDelete }) => {
  return (
    <div className="overflow-x-auto bg-white shadow-md rounded-lg">
      <table className="min-w-full">
        <thead>
          <tr className="bg-gray-50 border-b">
            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ID Number
            </th>
            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Occupation
            </th>
            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {employees.map((employee) => (
            <tr key={employee.id}>
              <td className="py-4 px-4 whitespace-nowrap">{employee.name}</td>
              <td className="py-4 px-4 whitespace-nowrap">{employee.idNumber}</td>
              <td className="py-4 px-4 whitespace-nowrap">{employee.occupation}</td>
              <td className="py-4 px-4 whitespace-nowrap">
                <button onClick={() => onDelete(employee.id)} className="text-red-600 hover:text-red-900">
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default EmployeeTable

