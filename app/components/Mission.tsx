"use client"

import { motion } from "framer-motion"

export default function Mission() {
  return (
    <div className="bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-3xl font-extrabold text-gray-950 sm:text-4xl">Our Mission</h2>
          <p className="mt-4 text-xl text-gray-600">
            At ClinicPlus, we are dedicated to promoting healthy employees and empowering healthy work environments in
            the mining and construction industries.
          </p>
        </motion.div>
        <div className="mt-20">
          <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
            {[
              {
                title: "Expert Care",
                description: "Our team of specialists brings years of experience in occupational health.",
              },
              {
                title: "Industry Focus",
                description: "Tailored solutions for the unique challenges of mining and construction.",
              },
              {
                title: "Cutting-edge Facilities",
                description: "State-of-the-art equipment for accurate diagnostics and efficient services.",
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-red-600 text-white">
                    {/* You can add icons here if desired */}
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-950">{item.title}</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-600">{item.description}</dd>
              </motion.div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
}

