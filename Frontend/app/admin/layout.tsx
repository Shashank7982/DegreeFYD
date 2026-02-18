"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { AdminSidebar } from "@/components/admin-sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { usePathname } from "next/navigation"
import { Sparkles } from "lucide-react"

function getBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean)
  const crumbs: { label: string; href?: string }[] = []

  if (segments[0] === "admin") {
    crumbs.push({ label: "Admin Protocol", href: "/admin" })
    if (segments[1] === "colleges") {
      crumbs.push({ label: "Entity Terminal", href: "/admin/colleges" })
      if (segments[2] === "new") {
        crumbs.push({ label: "Initialize New" })
      } else if (segments[2]) {
        crumbs.push({ label: "Modifying Unit" })
      }
    }
  }

  return crumbs
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const crumbs = getBreadcrumbs(pathname)

  return (
    <ProtectedRoute requireAdmin>
      <div className="relative flex min-h-screen bg-background text-foreground overflow-hidden" suppressHydrationWarning>
        {/* Global Glassmorphism Background */}
        <div className="fixed inset-0 -z-10 h-full w-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[100px]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(128,128,128,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(128,128,128,0.1)_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>

        <SidebarProvider>
          <AdminSidebar />
          <SidebarInset className="bg-transparent min-w-0">
            <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl px-6 sticky top-0 z-40 transition-all">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="-ml-2 h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-all" />
                <Separator orientation="vertical" className="mx-2 h-6 bg-border" />
                <Breadcrumb>
                  <BreadcrumbList>
                    {crumbs.map((crumb, i) => (
                      <BreadcrumbItem key={i} className="flex items-center gap-2">
                        {i > 0 && <BreadcrumbSeparator className="text-muted-foreground" />}
                        {i === crumbs.length - 1 ? (
                          <BreadcrumbPage className="font-black text-xs uppercase tracking-[0.2em] text-foreground">
                            {crumb.label}
                          </BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink href={crumb.href} className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors">
                            {crumb.label}
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    ))}
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-widest text-primary">
                  <Sparkles className="h-3 w-3" />
                  Secure Uplink
                </div>
                <ModeToggle />
              </div>
            </header>
            <main className="relative z-10 flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden">
              <div className="mx-auto max-w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
                {children}
              </div>
            </main>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </ProtectedRoute>
  )
}
