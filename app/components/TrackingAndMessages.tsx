"use client"

import type React from "react"
import { useState } from "react"

interface TrackingItem {
  id: string
  message: string
  timestamp: string
}

interface Message {
  id: string
  content: string
  sender: string
  timestamp: string
}

interface TrackingAndMessagesProps {
  tracking: TrackingItem[]
  messages: Message[]
  onAddTracking: (item: Omit<TrackingItem, "id">) => void
  onAddMessage: (message: Omit<Message, "id">) => void
}

const TrackingAndMessages: React.FC<TrackingAndMessagesProps> = ({
  tracking,
  messages,
  onAddTracking,
  onAddMessage,
}) => {
  const [newTracking, setNewTracking] = useState("")
  const [newMessage, setNewMessage] = useState("")

  const handleAddTracking = () => {
    if (newTracking.trim()) {
      onAddTracking({
        message: newTracking,
        timestamp: new Date().toISOString(),
      })
      setNewTracking("")
    }
  }

  const handleAddMessage = () => {
    if (newMessage.trim()) {
      onAddMessage({
        content: newMessage,
        sender: "Current User", // This should be replaced with the actual user's name
        timestamp: new Date().toISOString(),
      })
      setNewMessage("")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Tracking</h3>
        <ul className="list-disc pl-5 mb-2">
          {tracking.map((item) => (
            <li key={item.id}>
              {item.message} - {new Date(item.timestamp).toLocaleString()}
            </li>
          ))}
        </ul>
        <div className="flex">
          <input
            type="text"
            className="form-control flex-grow mr-2"
            value={newTracking}
            onChange={(e) => setNewTracking(e.target.value)}
            placeholder="Add new tracking item"
          />
          <button className="btn btn-primary" onClick={handleAddTracking}>
            Add
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Messages</h3>
        <ul className="space-y-2 mb-2">
          {messages.map((message) => (
            <li key={message.id} className="border p-2 rounded">
              <p>{message.content}</p>
              <p className="text-sm text-gray-500">
                {message.sender} - {new Date(message.timestamp).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
        <div className="flex">
          <input
            type="text"
            className="form-control flex-grow mr-2"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Add new message"
          />
          <button className="btn btn-primary" onClick={handleAddMessage}>
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

export default TrackingAndMessages

