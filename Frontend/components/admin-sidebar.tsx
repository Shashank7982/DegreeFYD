"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  GraduationCap,
  PlusCircle,
  LogOut,
  ChevronLeft,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const navItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Colleges",
    href: "/admin/colleges",
    icon: GraduationCap,
  },
  {
    title: "Add College",
    href: "/admin/colleges/new",
    icon: PlusCircle,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <Sidebar collapsible="icon" className="border-r border-border/60">
      <SidebarHeader className="h-16 border-b border-border/60 px-4 flex items-center justify-center">
        <Link href="/" className="flex items-center gap-3 px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary/50 p-1">
            <Image
              src="/logo.png"
              alt="DegreeFYD Logo"
              width={28}
              height={28}
              className="object-contain"
              priority
            />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground group-data-[collapsible=icon]:hidden">
            DegreeFYD
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/admin" && pathname.startsWith(item.href))
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Back to site">
                  <Link href="/colleges">
                    <ChevronLeft className="h-4 w-4" />
                    <span>Back to Site</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <Avatar className="h-8 w-8 shrink-0 border border-border">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {user?.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase() || "A"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-semibold text-foreground leading-tight">
              {user?.name || "Admin User"}
            </p>
            <p className="truncate text-[10px] text-muted-foreground uppercase tracking-wider">
              System Admin
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive group-data-[collapsible=icon]:hidden"
            onClick={() => {
              logout()
              window.location.href = "/"
            }}
          >
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Log out</span>
          </Button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
