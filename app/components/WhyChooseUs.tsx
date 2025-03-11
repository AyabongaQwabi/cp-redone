"use client"

import { motion } from "framer-motion"
import { CheckCircle, Truck, Users } from "lucide-react"

export default function WhyChooseUs() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Why Choose ClinicPlus</h2>
          <p className="mt-4 text-xl text-gray-600">Your trusted partner in occupational health since 2007</p>
        </motion.div>
        <div className="mt-10">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-gray-50 rounded-lg p-6"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-md bg-red-500 text-white mb-4">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Expertise in Mining and Construction</h3>
              <p className="mt-2 text-base text-gray-600">
                Specialized services tailored for the unique needs of mining and construction companies in Witbank and
                Hendrina regions.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-gray-50 rounded-lg p-6"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-md bg-red-500 text-white mb-4">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Mobile Clinic Services</h3>
              <p className="mt-2 text-base text-gray-600">
                Our state-of-the-art mobile clinic brings occupational health services directly to your worksite,
                maximizing convenience and efficiency.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-gray-50 rounded-lg p-6"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-md bg-red-500 text-white mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Comprehensive Care</h3>
              <p className="mt-2 text-base text-gray-600">
                From health and safety inductions to specialized Dover Vienna Testing, we offer a full spectrum of
                occupational health services.
              </p>
            </motion.div>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-lg text-gray-600">
            Founded in 2007 by Bertha van der Spuy-Lombaard, ClinicPlus has been at the forefront of occupational health
            services for over 15 years. Our mission is to promote healthy workplaces through exceptional care and
            tailored solutions for mining and construction companies.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

