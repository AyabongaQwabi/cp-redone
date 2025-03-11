"use client"

import type React from "react"

interface FileUploadProps {
  label: string
  onChange: (file: File) => void
}

const FileUpload: React.FC<FileUploadProps> = ({ label, onChange }) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onChange(file)
    }
  }

  return (
    <div className="form-group">
      <label htmlFor={label}>{label}</label>
      <input type="file" id={label} className="form-control-file" onChange={handleFileChange} />
    </div>
  )
}

export default FileUpload

