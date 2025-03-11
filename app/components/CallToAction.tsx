"use client"

import Link from "next/link"
import { motion } from "framer-motion"

export default function CallToAction() {
  return (
    <div className="bg-red-600">
      <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-extrabold text-white sm:text-4xl"
        >
          <span className="block">Ready to ensure your workforce's health?</span>
          <span className="block">Start with ClinicPlus today.</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-4 text-lg leading-6 text-yellow-500"
        >
          Book your occupational health services now and take the first step towards a healthier, more productive
          workplace.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Link
            href="/bookings"
            className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-red-600 bg-white hover:bg-yellow-500 hover:text-white sm:w-auto"
          >
            Book an Appointment Today!
          </Link>
        </motion.div>
      </div>
    </div>
  )
}

