import { NextResponse } from "next/server"
import { auth } from "@/lib/firebase"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const { idToken, rememberMe } = await request.json()

    if (!idToken) {
      return NextResponse.json({ error: "ID token is required" }, { status: 400 })
    }

    // Verify the ID token
    const decodedToken = await auth.verifyIdToken(idToken)

    // Create a session cookie
    const expiresIn = rememberMe ? 60 * 60 * 24 * 14 * 1000 : 60 * 60 * 24 * 1000 // 14 days or 1 day
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn })

    // Set the session cookie
    cookies().set("session", sessionCookie, {
      maxAge: expiresIn / 1000, // Convert to seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Session creation error:", error)
    return NextResponse.json({ error: "Failed to create session" }, { status: 401 })
  }
}

