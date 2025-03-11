"use client"

import type { Service } from "@/app/types"
import { Button } from "@/components/ui/button"

interface ServiceListProps {
  services: Service[]
  onEdit: (service: Service) => void
  onDelete: (serviceId: string) => void
}

export function ServiceList({ services, onEdit, onDelete }: ServiceListProps) {
  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Services List</h2>
      <ul className="space-y-4">
        {services.map((service) => (
          <li key={service.id} className="border p-4 rounded-md">
            <h3 className="font-bold">{service.name}</h3>
            <p className="text-sm text-gray-600">{service.description}</p>
            <p className="font-semibold mt-2">Price: ${service.price.toFixed(2)}</p>
            <div className="mt-2 space-x-2">
              <Button onClick={() => onEdit(service)} variant="outline">
                Edit
              </Button>
              <Button onClick={() => onDelete(service.id)} variant="destructive">
                Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

