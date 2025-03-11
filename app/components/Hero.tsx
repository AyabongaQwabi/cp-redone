"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"

const headlines = [
  "Promoting Healthy Employees",
  "Empowering Healthy Work Environments",
  "Your Partner in Occupational Health",
]

export default function Hero() {
  const [currentHeadline, setCurrentHeadline] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeadline((prev) => (prev + 1) % headlines.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative h-screen flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')",
        }}
      >
        <div className="absolute inset-0 bg-black opacity-60" />
      </div>
      {/* Remove this line: <div className="absolute inset-0 bg-gray-900 opacity-50 z-10" /> */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
        <AnimatePresence mode="wait">
          <motion.h1
            key={currentHeadline}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-6xl font-bold text-white mb-4"
          >
            {headlines[currentHeadline]}
          </motion.h1>
        </AnimatePresence>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-xl md:text-2xl text-gray-200 mb-8"
        >
          ClinicPlus is dedicated to providing exceptional occupational health services for mining and construction
          companies, ensuring the well-being of your workforce and the safety of your work environments.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <Link
            href="/contact"
            className="bg-red-600 text-white hover:bg-red-700 px-8 py-3 rounded-md text-lg font-medium transition duration-300"
          >
            Get Started
          </Link>
        </motion.div>
      </div>
    </div>
  )
}

