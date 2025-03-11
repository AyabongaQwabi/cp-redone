"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Dropdown from "../../../components/Dropdown"
import DatePicker from "../../../components/DatePicker"
import MultiSelect from "../../../components/MultiSelect"
import FileUpload from "../../../components/FileUpload"

export default function EditAppointment({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [appointment, setAppointment] = useState({
    details: {
      company: null,
      date: "",
      purchaseOrderNumber: "",
      clinic: "Churchill",
      ndaAccepted: false,
      employees: [],
    },
    usersWhoCanEdit: [],
    usersWhoCanManage: [],
    payment: {
      proofOfPayment: "",
      amount: 0,
    },
    isVoided: false,
    isComplete: false,
    tracking: [],
    messages: [],
    status: "pending",
  })

  useEffect(() => {
    // Fetch appointment data
    const fetchAppointment = async () => {
      // This would typically be an API call
      const res = await fetch(`/api/appointments/${params.id}`)
      const data = await res.json()
      setAppointment(data)
    }

    fetchAppointment()
  }, [params.id])

  const handleInputChange = (field: string, value: any) => {
    setAppointment((prev) => ({ ...prev, [field]: value }))
  }

  const handleDetailsChange = (field: string, value: any) => {
    setAppointment((prev) => ({
      ...prev,
      details: { ...prev.details, [field]: value },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically send the updated data to your API
    console.log("Updating appointment:", appointment)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Redirect to dashboard after submission
    router.push("/dashboard")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Edit Appointment</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Dropdown
          label="Company"
          options={[
            { value: "company1", label: "Company 1" },
            { value: "company2", label: "Company 2" },
          ]}
          value={appointment.details.company || ""}
          onChange={(value) => handleDetailsChange("company", value)}
        />

        <DatePicker
          label="Date"
          value={appointment.details.date}
          onChange={(value) => handleDetailsChange("date", value)}
        />

        <div className="form-group">
          <label htmlFor="purchaseOrderNumber">Purchase Order Number</label>
          <input
            type="text"
            id="purchaseOrderNumber"
            className="form-control"
            value={appointment.details.purchaseOrderNumber}
            onChange={(e) => handleDetailsChange("purchaseOrderNumber", e.target.value)}
          />
        </div>

        <Dropdown
          label="Clinic"
          options={[
            { value: "Churchill", label: "Churchill" },
            { value: "OtherClinic", label: "Other Clinic" },
          ]}
          value={appointment.details.clinic}
          onChange={(value) => handleDetailsChange("clinic", value)}
        />

        <div className="form-group">
          <label htmlFor="ndaAccepted">
            <input
              type="checkbox"
              id="ndaAccepted"
              checked={appointment.details.ndaAccepted}
              onChange={(e) => handleDetailsChange("ndaAccepted", e.target.checked)}
            />{" "}
            Accept NDA
          </label>
        </div>

        <MultiSelect
          label="Users Who Can Edit"
          options={[
            { value: "user1", label: "User 1" },
            { value: "user2", label: "User 2" },
          ]}
          values={appointment.usersWhoCanEdit}
          onChange={(values) => handleInputChange("usersWhoCanEdit", values)}
        />

        <MultiSelect
          label="Users Who Can Manage"
          options={[
            { value: "user1", label: "User 1" },
            { value: "user2", label: "User 2" },
          ]}
          values={appointment.usersWhoCanManage}
          onChange={(values) => handleInputChange("usersWhoCanManage", values)}
        />

        <FileUpload
          label="Proof of Payment"
          onChange={(file) => handleInputChange("payment", { ...appointment.payment, proofOfPayment: file.name })}
        />

        <div className="form-group">
          <label htmlFor="amount">Amount</label>
          <input
            type="number"
            id="amount"
            className="form-control"
            value={appointment.payment.amount}
            onChange={(e) =>
              handleInputChange("payment", { ...appointment.payment, amount: Number.parseFloat(e.target.value) })
            }
          />
        </div>

        <div className="form-group">
          <label htmlFor="isVoided">
            <input
              type="checkbox"
              id="isVoided"
              checked={appointment.isVoided}
              onChange={(e) => handleInputChange("isVoided", e.target.checked)}
            />{" "}
            Is Voided
          </label>
        </div>

        <div className="form-group">
          <label htmlFor="isComplete">
            <input
              type="checkbox"
              id="isComplete"
              checked={appointment.isComplete}
              onChange={(e) => handleInputChange("isComplete", e.target.checked)}
            />{" "}
            Is Complete
          </label>
        </div>

        <Dropdown
          label="Status"
          options={[
            { value: "pending", label: "Pending" },
            { value: "confirmed", label: "Confirmed" },
            { value: "cancelled", label: "Cancelled" },
          ]}
          value={appointment.status}
          onChange={(value) => handleInputChange("status", value)}
        />

        <button type="submit" className="btn btn-primary">
          Update Appointment
        </button>
      </form>
    </div>
  )
}

