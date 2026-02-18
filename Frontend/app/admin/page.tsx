"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  GraduationCap,
  Globe,
  FileText,
  BookOpen,
  PlusCircle,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Sparkles,
  Zap,
} from "lucide-react"
import { getDashboardStats, getAllCollegesAdmin } from "@/lib/api"
import type { DashboardStats, College } from "@/lib/types"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentColleges, setRecentColleges] = useState<College[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [s, colleges] = await Promise.all([
          getDashboardStats(),
          getAllCollegesAdmin(),
        ])
        setStats(s)
        setRecentColleges(
          colleges
            .sort(
              (a, b) =>
                new Date(b.updatedAt).getTime() -
                new Date(a.updatedAt).getTime()
            )
            .slice(0, 5)
        )
      } catch {
        // silently fail for mock
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center animate-pulse">
          <Zap className="h-6 w-6 text-primary" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 animate-pulse">Synchronizing Neural Data...</p>
      </div>
    )
  }

  const statCards = [
    {
      title: "Active Entities",
      value: stats?.totalColleges ?? 0,
      icon: GraduationCap,
      description: "Registered academic nodes",
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20",
    },
    {
      title: "Live Protocols",
      value: stats?.published ?? 0,
      icon: Globe,
      description: "Broadcasted to network",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      title: "Pending Syncs",
      value: stats?.drafts ?? 0,
      icon: FileText,
      description: "Awaiting final clearance",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      title: "Curriculum Units",
      value: stats?.totalCourses ?? 0,
      icon: BookOpen,
      description: "Distributed across units",
      color: "text-sky-400",
      bg: "bg-sky-500/10",
      border: "border-sky-500/20",
    },
  ]

  return (
    <div className="space-y-10 pb-16">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[9px] font-black uppercase tracking-[0.2em] text-primary">
            <Activity className="h-3.5 w-3.5" />
            Command Center
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-foreground">
            System <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Overview</span>
          </h1>
          <p className="text-slate-500 font-medium max-w-lg text-sm">
            Monitoring academic infrastructure and institution status in real-time.
          </p>
        </div>
        <Button asChild className="h-12 px-6 rounded-xl bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.05] active:scale-[0.98] transition-all">
          <Link href="/admin/colleges/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Initialize Entity
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <Card key={stat.title} className={cn(
            "bg-card/40 border-border/50 backdrop-blur-xl group hover:border-border transition-all rounded-[1.5rem] overflow-hidden relative",
            `animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[${i * 100}ms]`
          )}>
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 transition-opacity">
              <stat.icon className="h-16 w-16" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between pb-3 p-5">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                {stat.title}
              </span>
              <div className={cn("rounded-lg p-2 border", stat.bg, stat.border)}>
                <stat.icon className={cn("h-3.5 w-3.5", stat.color)} />
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="text-3xl font-black text-foreground tracking-tighter mb-1">
                {stat.value}
              </div>
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                {stat.description}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Sections */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Colleges List */}
        <Card className="lg:col-span-2 bg-card/30 border-border/50 backdrop-blur-2xl rounded-[1.5rem] overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between p-6 border-b border-border/50">
            <div className="space-y-1">
              <CardTitle className="text-lg font-black text-foreground tracking-tight">Recent Synchronizations</CardTitle>
              <CardDescription className="text-[9px] font-black uppercase tracking-widest text-slate-500">Latest academic node updates</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="h-9 rounded-lg border border-border/50 hover:bg-accent text-muted-foreground px-3 text-[10px] font-black uppercase tracking-widest">
              <Link href="/admin/colleges">
                Access Ledger
                <ArrowUpRight className="ml-2 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="space-y-4">
              {recentColleges.map((college, i) => (
                <div
                  key={college._id || college.id}
                  className={cn(
                    "flex items-center justify-between rounded-2xl bg-card/40 border border-border/50 p-3 hover:bg-accent/40 hover:border-border transition-all group",
                    `animate-in fade-in slide-in-from-left-4 duration-500 delay-[${i * 50}ms]`
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/50 border border-border/50 group-hover:scale-110 transition-transform overflow-hidden shadow-lg">
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-primary/40" />
                      <span className="text-base font-black text-foreground">{college.name.charAt(0)}</span>
                    </div>
                    <div className="space-y-1">
                      <p className="font-black text-foreground text-base leading-none tracking-tight">
                        {college.name}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        <Sparkles className="h-3 w-3 text-primary" />
                        {college.city} &middot; {college.courses.length} Units Found
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge
                      className={cn(
                        "rounded-lg px-3 py-1 text-[8px] font-black uppercase tracking-widest border transition-all",
                        college.status === "published"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                          : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                      )}
                    >
                      {college.status}
                    </Badge>
                    <Button variant="ghost" size="icon" asChild className="h-10 w-10 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-all">
                      <Link href={`/admin/colleges/${college._id || college.id}`}>
                        <Zap className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
              {recentColleges.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 bg-card/20 rounded-3xl border border-dashed border-border/50">
                  <Activity className="h-12 w-12 text-slate-700 animate-pulse" />
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                    Zero Data Streams Registered
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Analytics Simulation */}
        <Card className="bg-gradient-to-br from-primary/10 to-blue-600/5 border-border/50 backdrop-blur-2xl rounded-[1.5rem] p-8 flex flex-col justify-center gap-5 relative overflow-hidden group">
          <div className="absolute -bottom-10 -right-10 opacity-[0.05] group-hover:scale-125 transition-transform duration-1000">
            <Zap className="h-48 w-48 text-primary" />
          </div>
          <div className="relative z-10 space-y-4">
            <div className="h-11 w-11 rounded-xl bg-accent/50 border border-border/50 flex items-center justify-center">
              <Activity className="h-5 w-5 text-foreground" />
            </div>
            <h3 className="text-xl font-black text-foreground tracking-tight leading-none">System <br />Integrity</h3>
            <p className="text-muted-foreground font-medium text-sm leading-relaxed">
              All synchronization channels are operating at <span className="text-primary font-black">98.4%</span> efficiency. No packet loss detected in the last 24 cycles.
            </p>
            <div className="pt-4">
              <div className="h-2 w-full bg-accent/50 rounded-full overflow-hidden">
                <div className="h-full w-[98%] bg-gradient-to-r from-primary to-blue-400 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.5)]" />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-4">
              <div className="flex -space-x-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-8 w-8 rounded-xl border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase">
                    U{i}
                  </div>
                ))}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Verified Nodes Online</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
