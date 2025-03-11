"use client"

import { useState, useEffect } from "react"
import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, UserPlus, Building2, Bell, Search, CheckCircle, XCircle } from "lucide-react"
import { db } from "@/lib/firebase-client"
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore"

interface Metrics {
  upcomingAppointments: number
  pendingApprovals: number
  doctors: number
  clinics: number
}

interface Activity {
  id: string
  action: string
  timestamp: string
}

interface Notification {
  id: string
  message: string
  urgent: boolean
}

export default function AdminDashboard() {
  const [searchQuery, setSearchQuery] = useState("")
  const [metrics, setMetrics] = useState<Metrics>({
    upcomingAppointments: 0,
    pendingApprovals: 0,
    doctors: 0,
    clinics: 0,
  })
  const [recentActivity, setRecentActivity] = useState<Activity[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    const fetchData = async () => {
      // Fetch metrics
      const appointmentsSnapshot = await getDocs(
        query(collection(db, "appointments"), where("date", ">=", Timestamp.now())),
      )
      const doctorsSnapshot = await getDocs(collection(db, "doctors"))
      const clinicsSnapshot = await getDocs(collection(db, "clinics"))
      const pendingApprovalsSnapshot = await getDocs(
        query(collection(db, "appointments"), where("status", "==", "pending")),
      )

      setMetrics({
        upcomingAppointments: appointmentsSnapshot.size,
        pendingApprovals: pendingApprovalsSnapshot.size,
        doctors: doctorsSnapshot.size,
        clinics: clinicsSnapshot.size,
      })

      // Fetch recent activity
      const activitySnapshot = await getDocs(
        query(collection(db, "activity"), where("timestamp", ">=", Timestamp.now() - 86400000)),
      ) // Last 24 hours
      setRecentActivity(
        activitySnapshot.docs.map((doc) => ({
          id: doc.id,
          action: doc.data().action,
          timestamp: doc.data().timestamp.toDate().toLocaleString(),
        })),
      )

      // Fetch notifications
      const notificationsSnapshot = await getDocs(collection(db, "notifications"))
      setNotifications(
        notificationsSnapshot.docs.map((doc) => ({
          id: doc.id,
          message: doc.data().message,
          urgent: doc.data().urgent,
        })),
      )
    }

    fetchData()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Implement search logic here
    console.log("Searching for:", searchQuery)
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Welcome to the Admin Dashboard</h1>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search appointments, doctors, or clinics"
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </form>

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
          <Button>
            <CheckCircle className="mr-2 h-4 w-4" />
            Approve Appointments
          </Button>
          <Button>
            <XCircle className="mr-2 h-4 w-4" />
            Decline Appointments
          </Button>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Add New Doctor
          </Button>
          <Button>
            <Building2 className="mr-2 h-4 w-4" />
            Add New Clinic
          </Button>
          <Button>
            <CalendarDays className="mr-2 h-4 w-4" />
            View Appointment Calendar
          </Button>
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

