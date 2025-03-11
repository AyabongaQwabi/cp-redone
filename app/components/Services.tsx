"use client"

import { motion } from "framer-motion"
import { Stethoscope, Truck, Users, Activity, Clipboard } from "lucide-react"

const services = [
  {
    name: "Health and Safety Inductions",
    description: "Comprehensive inductions to ensure workplace safety compliance.",
    icon: Users,
  },
  {
    name: "Fitness-to-work Screenings",
    description: "Thorough assessments to ensure employees are fit for their roles.",
    icon: Clipboard,
  },
  {
    name: "Wellness Campaigns",
    description: "Proactive health initiatives to promote overall employee wellbeing.",
    icon: Activity,
  },
  {
    name: "Mobile Occupational Health Services",
    description: "On-site health services for convenience and efficiency.",
    icon: Truck,
  },
  {
    name: "Dover Vienna Testing",
    description: "Specialized testing for specific occupational health requirements.",
    icon: Stethoscope,
  },
]

export default function Services() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Our Core Services</h2>
          <p className="mt-4 text-xl text-gray-600">
            Comprehensive occupational health solutions tailored for the mining and construction industries.
          </p>
        </motion.div>
        <div className="mt-10">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, index) => (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-lg p-6"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-md bg-red-500 text-white mb-4">
                  <service.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">{service.name}</h3>
                <p className="mt-2 text-base text-gray-600">{service.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

