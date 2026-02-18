"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Menu,
  LogOut,
  LayoutDashboard,
  User,
  Sparkles,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { ModeToggle } from "@/components/mode-toggle"

const navLinks = [
  { href: "/colleges", label: "Colleges" },
  { href: "/compare", label: "Compare" },
]

export function PublicNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  function handleLogout() {
    logout()
    window.location.href = "/"
  }

  return (
    <header className="sticky top-0 z-[100] w-full border-b border-border bg-background/80 backdrop-blur-2xl transition-all duration-300">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-12">
          <Link href="/" className="group flex items-center gap-4 relative">
            <div className="absolute -inset-2 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
            <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white border border-border group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl">
              <Image
                src="/logo.png"
                alt="DegreeFYD Logo"
                width={32}
                height={32}
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tighter text-foreground leading-none">
                DegreeFYD
              </span>
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-primary mt-1 opacity-80">
                Future Bound
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 md:flex" aria-label="Main navigation">
            {navLinks
              .filter((link) => link.href !== "/compare" || isAuthenticated)
              .map((link) => {
                const isActive = pathname.startsWith(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "relative flex items-center gap-2 px-5 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all duration-300 rounded-xl group",
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    {isActive && (
                      <div className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
                    )}
                    {link.label === "Colleges" ? <Zap className={cn("h-3 w-3", isActive ? "text-primary" : "text-slate-600")} /> : <Sparkles className={cn("h-3 w-3", isActive ? "text-primary" : "text-slate-600")} />}
                    {link.label}
                  </Link>
                )
              })}
            {isAdmin && (
              <Link
                href="/admin"
                className={cn(
                  "px-5 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all rounded-xl",
                  pathname.startsWith("/admin")
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                Admin Node
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <ModeToggle />
          {isMounted && isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="hidden items-center gap-3 md:flex h-12 px-4 rounded-2xl bg-card border border-border hover:bg-accent transition-all group"
                >
                  <div className="relative h-7 w-7 rounded-xl overflow-hidden bg-primary/20 flex items-center justify-center border border-primary/30 group-hover:scale-110 transition-transform">
                    <span className="text-[10px] font-black text-primary uppercase">
                      {user?.name?.charAt(0)}
                    </span>
                  </div>
                  <div className="flex flex-col items-start translate-y-[-1px]">
                    <span className="text-xs font-black text-foreground">{user?.name?.split(' ')[0]}</span>
                    <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-tighter">Student</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2 bg-popover/90 backdrop-blur-2xl border-border shadow-2xl rounded-2xl">
                <div className="px-3 py-4 flex flex-col gap-1">
                  <p className="text-sm font-black text-foreground">{user?.name}</p>
                  <p className="text-[10px] font-bold text-muted-foreground truncate">{user?.email}</p>
                </div>
                <DropdownMenuSeparator className="bg-border mx-2" />
                <div className="p-1 space-y-1">
                  {isAdmin && (
                    <DropdownMenuItem
                      onClick={() => router.push("/admin")}
                      className="rounded-xl px-3 py-2.5 text-xs font-black uppercase tracking-widest focus:bg-primary/20 focus:text-primary transition-all cursor-pointer"
                    >
                      <LayoutDashboard className="mr-3 h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>
                  )}

                </div>
                <DropdownMenuSeparator className="bg-border mx-2" />
                <div className="p-1">
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="rounded-xl px-3 py-2.5 text-xs font-black uppercase tracking-widest text-red-400 focus:bg-red-500/10 focus:text-red-400 transition-all cursor-pointer"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden gap-3 md:flex">
              <Button variant="ghost" size="sm" asChild className="h-11 px-6 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground hover:bg-accent">
                <Link href="/login">Log In</Link>
              </Button>
              <Button size="sm" asChild className="h-11 px-8 rounded-xl bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-[1.05] active:scale-[0.98] transition-all">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          )}

          {/* Mobile menu trigger */}
          {isMounted && (
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden h-10 w-10 rounded-xl bg-card border border-border text-muted-foreground">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 bg-background/95 backdrop-blur-2xl border-border p-0 overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(var(--foreground)_1px,transparent_1px)] [background-size:24px_24px]" />

                <div className="relative z-10 flex flex-col h-full bg-gradient-to-b from-primary/5 to-transparent">
                  <div className="p-8 pb-4">
                    <Link href="/" onClick={() => setSheetOpen(false)} className="flex items-center gap-3 mb-10">
                      <div className="h-10 w-10 rounded-xl bg-white border border-border flex items-center justify-center p-2">
                        <Image src="/logo.png" alt="DegreeFYD Logo" width={32} height={32} />
                      </div>
                      <span className="text-xl font-black text-foreground tracking-tighter">DegreeFYD</span>
                    </Link>

                    <nav className="flex flex-col gap-2">
                      {navLinks
                        .filter((link) => link.href !== "/compare" || isAuthenticated)
                        .map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setSheetOpen(false)}
                            className={cn(
                              "flex items-center gap-3 px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
                              pathname.startsWith(link.href)
                                ? "bg-primary/20 text-primary border border-primary/20"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent"
                            )}
                          >
                            <Zap className="h-4 w-4" />
                            {link.label}
                          </Link>
                        ))}
                    </nav>
                  </div>

                  <div className="mt-auto p-8 border-t border-border bg-card/50">
                    {isAuthenticated ? (
                      <div className="flex flex-col gap-6">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                            <span className="text-sm font-black text-primary">{user?.name?.charAt(0)}</span>
                          </div>
                          <div className="flex flex-col">
                            <p className="text-sm font-black text-foreground leading-none mb-1">{user?.name}</p>
                            <p className="text-[10px] font-bold text-muted-foreground truncate max-w-[160px]">{user?.email}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          className="w-full h-12 rounded-2xl bg-red-500/10 text-red-400 font-black text-[10px] uppercase tracking-widest hover:bg-red-500/20"
                          onClick={() => {
                            handleLogout()
                            setSheetOpen(false)
                          }}
                        >
                          <LogOut className="mr-3 h-4 w-4" />
                          Sign Out
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <Button variant="ghost" asChild className="h-12 rounded-2xl bg-card text-foreground font-black text-[10px] uppercase tracking-widest">
                          <Link href="/login" onClick={() => setSheetOpen(false)}>Log In</Link>
                        </Button>
                        <Button asChild className="h-14 rounded-2xl bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20">
                          <Link href="/signup" onClick={() => setSheetOpen(false)}>Sign Up</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </header>
  )
}
