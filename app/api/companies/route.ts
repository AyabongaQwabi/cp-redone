import { NextResponse } from "next/server"
import { db, auth } from "@/lib/firebase"
import { z } from "zod"

// Define validation schema
const companySchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters"),
  industry: z.string().min(2, "Industry must be at least 2 characters"),
  contactEmail: z.string().email("Invalid email format"),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Extract the token
    const token = authHeader.split("Bearer ")[1]

    // Verify the token
    const decodedToken = await auth.verifyIdToken(token)
    const userId = decodedToken.uid

    // Get companies from Firestore for this user
    const companiesSnapshot = await db.collection("companies").where("userId", "==", userId).get()

    const companies = companiesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return NextResponse.json(companies)
  } catch (error) {
    console.error("Error fetching companies:", error)
    return NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Extract the token
    const token = authHeader.split("Bearer ")[1]

    // Verify the token
    const decodedToken = await auth.verifyIdToken(token)
    const userId = decodedToken.uid

    const body = await request.json()

    // Validate input
    const result = companySchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: result.error.flatten(),
        },
        { status: 400 },
      )
    }

    const { name, industry, contactEmail, contactPhone, address } = result.data

    // Create new company
    const newCompany = {
      name,
      industry,
      contactEmail,
      contactPhone,
      address,
      userId, // Associate the company with the user
      employeeCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Add company to Firestore
    const companyRef = await db.collection("companies").add(newCompany)

    return NextResponse.json(
      {
        message: "Company created successfully",
        company: { id: companyRef.id, ...newCompany },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Company creation error:", error)
    return NextResponse.json({ error: "Failed to create company" }, { status: 500 })
  }
}

