"use client"

import { useState } from "react"
import { signInWithPopup } from "firebase/auth"
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore"
import { auth, db, googleProvider } from "@/lib/firebase-client"
import { useRouter } from "next/navigation"
import Image from "next/image"

interface GoogleAuthButtonProps {
  mode: "login" | "register"
  className?: string
}

export default function GoogleAuthButton({ mode, className = "" }: GoogleAuthButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleGoogleAuth = async () => {
    setIsLoading(true)
    setError("")

    try {
      // Sign in with Google
      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user

      // Check if this is a new user
      const userDoc = await getDoc(doc(db, "users", user.uid))

      if (!userDoc.exists() && mode === "register") {
        // Create a new user document in Firestore
        await setDoc(doc(db, "users", user.uid), {
          fullName: user.displayName || "",
          email: user.email || "",
          photoURL: user.photoURL || "",
          role: "client",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      } else if (!userDoc.exists() && mode === "login") {
        // If user doesn't exist and trying to login, create a basic record
        await setDoc(doc(db, "users", user.uid), {
          fullName: user.displayName || "",
          email: user.email || "",
          photoURL: user.photoURL || "",
          role: "client",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      }

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (error: any) {
      console.error("Google auth error:", error)

      if (error.code === "auth/popup-closed-by-user") {
        setError("Authentication cancelled")
      } else if (error.code === "auth/account-exists-with-different-credential") {
        setError("An account already exists with the same email address but different sign-in credentials")
      } else {
        setError(error.message || "An error occurred during authentication")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mt-4">
      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}
      <button
        type="button"
        onClick={handleGoogleAuth}
        disabled={isLoading}
        className={`w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 ${className}`}
      >
        <Image src="/google-logo.svg" alt="Google logo" width={18} height={18} className="mr-2" />
        {isLoading ? "Processing..." : mode === "login" ? "Sign in with Google" : "Register with Google"}
      </button>
    </div>
  )
}

