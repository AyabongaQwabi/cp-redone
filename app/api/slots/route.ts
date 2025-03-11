import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    const clinic = searchParams.get("clinic")

    if (!date || !clinic) {
      return NextResponse.json({ error: "Date and clinic are required parameters" }, { status: 400 })
    }

    // Get the clinic's capacity
    const clinicDoc = await db.collection("clinics").where("name", "==", clinic).limit(1).get()

    if (clinicDoc.empty) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 })
    }

    const clinicData = clinicDoc.docs[0].data()
    const dailyCapacity = clinicData.dailyCapacity || 100 // Default to 100 if not specified

    // Count existing appointments for this date and clinic
    const appointmentsSnapshot = await db
      .collection("appointments")
      .where("date", "==", date)
      .where("clinicName", "==", clinic)
      .get()

    const bookedAppointments = appointmentsSnapshot.size
    const remainingSlots = dailyCapacity - bookedAppointments

    return NextResponse.json({
      clinic,
      date,
      totalCapacity: dailyCapacity,
      bookedAppointments,
      remainingSlots: Math.max(0, remainingSlots),
    })
  } catch (error) {
    console.error("Error checking slots:", error)
    return NextResponse.json({ error: "Failed to check available slots" }, { status: 500 })
  }
}

