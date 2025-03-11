import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { z } from "zod"

// Define validation schema
const appointmentSchema = z.object({
  date: z.string(),
  time: z.string(),
  companyId: z.string(),
  clinicName: z.string(),
  appointmentType: z.string(),
  patientName: z.string().optional(),
  patientContact: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["Pending", "Confirmed", "Cancelled"]).default("Pending"),
})

export async function GET(request: Request) {
  try {
    // Get appointments from Firestore
    const appointmentsSnapshot = await db.collection("appointments").get()

    const appointments = appointmentsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return NextResponse.json(appointments)
  } catch (error) {
    console.error("Error fetching appointments:", error)
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate input
    const result = appointmentSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: result.error.flatten(),
        },
        { status: 400 },
      )
    }

    const appointmentData = result.data

    // Create new appointment
    const newAppointment = {
      ...appointmentData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Add appointment to Firestore
    const appointmentRef = await db.collection("appointments").add(newAppointment)

    return NextResponse.json(
      {
        message: "Appointment created successfully",
        appointment: { id: appointmentRef.id, ...newAppointment },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Appointment creation error:", error)
    return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 })
  }
}

