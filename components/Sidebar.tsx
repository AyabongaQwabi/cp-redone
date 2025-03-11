"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Building,
  Calendar,
  Users,
  Settings,
  FileText,
  MessageSquare,
  Bell,
  MapPin,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react"

const sidebarNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: FileText,
  },
  {
    title: "Companies",
    href: "/dashboard/companies",
    icon: Building,
    subItems: [
      { title: "Sites", href: "/dashboard/sites", icon: MapPin },
      { title: "Departments", href: "/dashboard/departments", icon: Briefcase },
    ],
  },
  {
    title: "Appointments",
    href: "/dashboard/appointments",
    icon: Calendar,
    subItems: [{ title: "Employee Appointments", href: "/dashboard/employee-appointments", icon: Calendar }],
  },
  {
    title: "Employees",
    href: "/dashboard/employees",
    icon: Users,
  },
  {
    title: "Profile",
    href: "/dashboard/profile",
    icon: User,
    subItems: [
      { title: "Messages", href: "/dashboard/messages", icon: MessageSquare },
      { title: "Notifications", href: "/dashboard/notifications", icon: Bell },
      { title: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-red-900 text-white transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex items-center justify-between p-4">
        {!isCollapsed && <h2 className="text-lg font-semibold">Dashboard</h2>}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="ml-auto text-white hover:bg-red-800"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {sidebarNavItems.map((item) => (
            <div key={item.href}>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={pathname === item.href ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start text-white hover:bg-red-800",
                        isCollapsed && "justify-center",
                        pathname === item.href && "bg-red-800",
                      )}
                      asChild
                    >
                      <Link href={item.href}>
                        <item.icon className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                        {!isCollapsed && item.title}
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">
                      <p>{item.title}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
              {!isCollapsed && item.subItems && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.subItems.map((subItem) => (
                    <Button
                      key={subItem.href}
                      variant={pathname === subItem.href ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start text-white hover:bg-red-800",
                        pathname === subItem.href && "bg-red-800",
                      )}
                      asChild
                    >
                      <Link href={subItem.href}>
                        <subItem.icon className="mr-2 h-4 w-4" />
                        {subItem.title}
                      </Link>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

