import { auth as clientAuth } from "./firebase-client"
import { signOut as firebaseSignOut, onAuthStateChanged, type User } from "firebase/auth"

export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(clientAuth, (user) => {
      unsubscribe()
      resolve(user)
    })
  })
}

export const isAuthenticated = async (): Promise<boolean> => {
  const user = await getCurrentUser()
  return !!user
}

export const logout = async () => {
  try {
    // Call the logout API to clear the session cookie
    await fetch("/api/auth/logout", {
      method: "POST",
    })

    // Sign out from Firebase client
    await firebaseSignOut(clientAuth)

    // Redirect to login page
    window.location.href = "/login"
  } catch (error) {
    console.error("Logout error:", error)
    throw error
  }
}

