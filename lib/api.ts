import { auth as clientAuth } from "./firebase-client"

interface FetchOptions extends RequestInit {
  data?: any
}

export async function fetchAPI(endpoint: string, options: FetchOptions = {}) {
  const { data, ...customOptions } = options

  // Get the current user
  const user = clientAuth.currentUser

  // Prepare headers
  const headers = {
    "Content-Type": "application/json",
    ...customOptions.headers,
  }

  // Add authorization header if user is logged in
  if (user) {
    const token = await user.getIdToken()
    headers["Authorization"] = `Bearer ${token}`
  }

  // Prepare the request options
  const fetchOptions: RequestInit = {
    ...customOptions,
    headers,
  }

  // Add body if data is provided
  if (data) {
    fetchOptions.body = JSON.stringify(data)
  }

  // Make the request
  const response = await fetch(`/api/${endpoint}`, fetchOptions)

  // Parse the JSON response
  const result = await response.json()

  // If the response is not ok, throw an error
  if (!response.ok) {
    throw new Error(result.error || "An error occurred")
  }

  // Return the result
  return result
}

