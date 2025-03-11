"use client"

import type React from "react"

interface MultiSelectProps {
  label: string
  options: { value: string; label: string }[]
  values: string[]
  onChange: (values: string[]) => void
}

const MultiSelect: React.FC<MultiSelectProps> = ({ label, options, values, onChange }) => {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValues = Array.from(event.target.selectedOptions, (option) => option.value)
    onChange(selectedValues)
  }

  return (
    <div className="form-group">
      <label htmlFor={label}>{label}</label>
      <select id={label} multiple className="form-control" value={values} onChange={handleChange}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default MultiSelect

