import { NextResponse } from "next/server"
import { auth, db } from "@/lib/firebase"
import { z } from "zod"

// Define validation schema
const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate input
    const result = registerSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: result.error.flatten(),
        },
        { status: 400 },
      )
    }

    const { fullName, email, password } = result.data

    // Check if user already exists
    try {
      const userRecord = await auth.getUserByEmail(email)
      if (userRecord) {
        return NextResponse.json(
          {
            error: "User with this email already exists",
          },
          { status: 409 },
        )
      }
    } catch (error) {
      // User doesn't exist, which is what we want
    }

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: fullName,
    })

    // Set custom claims for user role
    await auth.setCustomUserClaims(userRecord.uid, {
      role: "client",
    })

    // Store additional user data in Firestore
    await db.collection("users").doc(userRecord.uid).set({
      fullName,
      email,
      role: "client",
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json(
      {
        message: "User registered successfully",
        userId: userRecord.uid,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      {
        error: "Failed to register user",
      },
      { status: 500 },
    )
  }
}

