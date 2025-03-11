"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Calendar,
  Building2,
  Settings,
  LogOut,
  Users,
  MessageSquare,
  Bell,
  Layers,
  User,
  Activity,
  Clipboard,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { logout } from "@/lib/auth"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

const sidebarItems = [
  { icon: Home, label: "Dashboard", href: "/admin" },
  { icon: Clipboard, label: "Pages", href: "/admin/pages" },
  { icon: Calendar, label: "Appointments", href: "/admin/appointments" },
  { icon: Building2, label: "Companies", href: "/admin/companies" },
  { icon: Activity, label: "Clinics", href: "/admin/clinics" },
  { icon: Layers, label: "Services", href: "/admin/services" },
  { icon: User, label: "Profile", href: "/admin/profile" },
  { icon: MessageSquare, label: "Messages", href: "/admin/messages" },
  { icon: Bell, label: "Notifications", href: "/admin/notifications" },
  { icon: Users, label: "Users", href: "/admin/users" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { isOpen, toggleSidebar } = useSidebar()

  const handleLogout = () => {
    logout()
  }

  return (
    <Sidebar className="bg-gray-900 text-white w-64 flex flex-col h-screen fixed left-0 top-0 z-40 shadow-lg">
      <SidebarHeader className="p-4 flex items-center justify-between border-b border-gray-800">
        <h2 className="text-2xl font-bold">Admin Panel</h2>
        <SidebarTrigger onClick={toggleSidebar} />
      </SidebarHeader>
      <SidebarContent className="flex-grow overflow-y-auto">
        <SidebarMenu>
          {sidebarItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                className={cn("w-full text-left hover:bg-gray-800 text-white", pathname === item.href && "bg-gray-800")}
              >
                <Link href={item.href} className="flex items-center p-2">
                  <item.icon className="mr-2 h-4 w-4" />
                  <span>{isOpen ? item.label : ""}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t border-gray-800 p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="w-full text-left hover:bg-gray-800 text-white">
              <button onClick={handleLogout} className="flex items-center p-2">
                <LogOut className="mr-2 h-4 w-4" />
                <span>{isOpen ? "Logout" : ""}</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

