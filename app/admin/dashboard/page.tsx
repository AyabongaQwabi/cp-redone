"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, UserPlus, Building2, Bell, Search } from "lucide-react"

// Placeholder data (replace with actual data fetching logic)
const metrics = {
  upcomingAppointments: 15,
  pendingApprovals: 5,
  doctors: 20,
  clinics: 8,
}

const recentActivity = [
  { id: 1, action: "New appointment created", timestamp: "2023-07-10 14:30" },
  { id: 2, action: "Doctor assigned to Clinic A", timestamp: "2023-07-10 13:45" },
  { id: 3, action: "Appointment approved", timestamp: "2023-07-10 11:20" },
]

const notifications = [
  { id: 1, message: "5 appointments pending approval", urgent: true },
  { id: 2, message: "New doctor registration needs review", urgent: false },
]

export default function AdminDashboard() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Welcome to the Admin Dashboard</h1>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search appointments, doctors, or clinics"
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.upcomingAppointments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.pendingApprovals}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doctors</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.doctors}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clinics</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.clinics}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button>Approve/Decline Appointments</Button>
          <Button>Add New Doctor</Button>
          <Button>Add New Clinic</Button>
          <Button>View Appointment Calendar</Button>
        </CardContent>
      </Card>

      {/* Recent Activity and Notifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recentActivity.map((activity) => (
                <li key={activity.id} className="flex justify-between items-center">
                  <span>{activity.action}</span>
                  <span className="text-sm text-muted-foreground">{activity.timestamp}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {notifications.map((notification) => (
                <li key={notification.id} className="flex items-center">
                  <Badge variant={notification.urgent ? "destructive" : "secondary"} className="mr-2">
                    {notification.urgent ? "Urgent" : "Info"}
                  </Badge>
                  <span>{notification.message}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

