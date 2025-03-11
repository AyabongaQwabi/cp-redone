import type { Service } from "@/app/types"
import Image from "next/image"

interface ServicePreviewProps {
  service: Service
}

export function ServicePreview({ service }: ServicePreviewProps) {
  return (
    <div className="border p-4 rounded-md">
      <h3 className="text-xl font-bold mb-2">{service.name}</h3>
      <p className="text-gray-600 mb-4">{service.description}</p>
      <p className="font-semibold mb-4">Price: ${service.price.toFixed(2)}</p>
      <div className="grid grid-cols-2 gap-2">
        {service.images &&
          service.images.map((image, index) => (
            <div key={index} className="relative h-40">
              <Image
                src={image || "/placeholder.svg"}
                alt={`${service.name} image ${index + 1}`}
                layout="fill"
                objectFit="cover"
                className="rounded-md"
              />
            </div>
          ))}
      </div>
    </div>
  )
}

