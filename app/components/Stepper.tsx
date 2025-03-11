import type React from "react"

interface StepperProps {
  steps: string[]
  currentStep: number
}

const Stepper: React.FC<StepperProps> = ({ steps, currentStep }) => {
  return (
    <div className="mb-8">
      <div className="flex justify-between">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center w-full">
            <div className="relative w-full">
              <div className="absolute top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200"></div>
              <div
                className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                  index <= currentStep ? "bg-red-600 text-white" : "bg-white border-2 border-gray-300 text-gray-500"
                }`}
              >
                {index + 1}
              </div>
            </div>
            <span className="mt-2 text-sm text-gray-600">{step}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Stepper

