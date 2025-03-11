"use client"

import type React from "react"

interface DatePickerProps {
  label: string
  value: string
  onChange: (value: string) => void
}

const DatePicker: React.FC<DatePickerProps> = ({ label, value, onChange }) => {
  return (
    <div className="form-group">
      <label htmlFor={label}>{label}</label>
      <input type="date" id={label} className="form-control" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

export default DatePicker

