import { NextResponse } from "next/server"
import { auth, db } from "@/lib/firebase"
import { z } from "zod"
import { cookies } from "next/headers"

// Define validation schema
const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate input
    const result = loginSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: result.error.flatten(),
        },
        { status: 400 },
      )
    }

    const { email, password } = result.data

    // Sign in with Firebase Auth REST API
    const signInResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      },
    )

    const signInData = await signInResponse.json()

    if (!signInResponse.ok) {
      return NextResponse.json(
        {
          error: "Invalid credentials",
        },
        { status: 401 },
      )
    }

    // Get user data from Firestore
    const userDoc = await db.collection("users").doc(signInData.localId).get()

    if (!userDoc.exists) {
      return NextResponse.json(
        {
          error: "User data not found",
        },
        { status: 404 },
      )
    }

    const userData = userDoc.data()

    // Create session cookie
    const expiresIn = 60 * 60 * 24 * 7 * 1000 // 7 days
    const sessionCookie = await auth.createSessionCookie(signInData.idToken, { expiresIn })

    // Set cookie
    cookies().set("session", sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
    })

    return NextResponse.json({
      message: "Login successful",
      user: {
        id: signInData.localId,
        email: userData.email,
        fullName: userData.fullName,
        companyName: userData.companyName,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      {
        error: "Failed to authenticate user",
      },
      { status: 500 },
    )
  }
}

