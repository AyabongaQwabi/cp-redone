import { initializeAnalytics } from "./firebase-client"

// Initialize analytics when this module is imported on the client side
let analytics = null

// Only initialize analytics on the client side
if (typeof window !== "undefined") {
  analytics = initializeAnalytics()
}

export { analytics }

