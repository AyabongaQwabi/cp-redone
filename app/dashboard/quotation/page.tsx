"use client"
import { useRouter } from "next/navigation"
import QuotationForm from "../../components/QuotationForm"

export default function Quotation() {
  const router = useRouter()

  const handleSubmit = async (data: any) => {
    // Here you would typically send the data to your API to generate a quotation
    console.log("Generating quotation:", data)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // For this example, we'll just log the data
    console.log("Quotation generated:", data)

    // In a real application, you might redirect to a page showing the generated quotation
    // or provide options to download/email it
    alert("Quotation generated successfully!")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Generate Quotation</h1>
      <div className="max-w-md mx-auto">
        <QuotationForm onSubmit={handleSubmit} />
      </div>
    </div>
  )
}

