"use client"

import { useEffect, useState } from "react"
import { motion, useAnimation } from "framer-motion"

interface ParallaxBackgroundProps {
  imageUrl: string
}

export default function ParallaxBackground({ imageUrl }: ParallaxBackgroundProps) {
  const [scrollY, setScrollY] = useState(0)
  const controls = useAnimation()

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener("scroll", handleScroll)

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  useEffect(() => {
    controls.start({ y: scrollY * 0.5 })
  }, [scrollY, controls])

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden">
      <motion.div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url('${imageUrl}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        animate={controls}
      />
      <div className="absolute inset-0 bg-white opacity-75" />
    </div>
  )
}

