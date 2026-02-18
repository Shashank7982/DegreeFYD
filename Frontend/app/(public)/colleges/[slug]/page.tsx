"use client"

import { use } from "react"
import useSWR from "swr"
import Image from "next/image"
import Link from "next/link"
import { getCollegeBySlug } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  MapPin,
  Star,
  Calendar,
  Award,
  Building2,
  Users,
  TrendingUp,
  IndianRupee,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Sparkles,
  Zap,
  ShieldCheck,
} from "lucide-react"
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

function formatCurrency(value: number) {
  if (value >= 10000000) return `${(value / 10000000).toFixed(2)} Cr`
  if (value >= 100000) return `${(value / 100000).toFixed(1)} L`
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
  return `${value}`
}

export default function CollegeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)

  const { data: college, isLoading } = useSWR(
    ["college", slug],
    () => getCollegeBySlug(slug)
  )

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 lg:px-8 space-y-12">
        <Skeleton className="h-10 w-48 bg-muted/50 rounded-2xl" />
        <Skeleton className="aspect-[21/9] rounded-[3rem] bg-muted/50" />
        <div className="grid gap-6 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-3xl bg-muted/50" />
          ))}
        </div>
      </div>
    )
  }

  if (!college) {
    return (
      <div className="flex flex-col items-center justify-center py-48 text-center bg-background">
        <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center mb-8 border border-primary/20">
          <Zap className="h-12 w-12 text-primary animate-pulse" />
        </div>
        <h2 className="text-4xl font-black text-foreground tracking-tighter mb-4">
          Entity Not Synced
        </h2>
        <p className="text-muted-foreground max-w-sm mb-12">
          The requested institution is currently offline or does not exist in our neural map.
        </p>
        <Button asChild className="h-14 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-lg">
          <Link href="/colleges">
            <ArrowLeft className="mr-3 h-5 w-5" />
            Re-enter Navigation
          </Link>
        </Button>
      </div>
    )
  }

  const chartData = college.placement.yearWiseData.map((d) => ({
    year: d.year,
    "Avg Package (L)": d.avgPackage ? Number((d.avgPackage / 100000).toFixed(1)) : 0,
    "Placement %": d.percentage || 0,
  }))

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8 space-y-12 pb-24 animate-in fade-in duration-1000">
      {/* Navigation Matrix */}
      <Button variant="ghost" size="sm" asChild className="group h-10 px-4 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
        <Link href="/colleges">
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Return to Core Directory
        </Link>
      </Button>

      {/* Cinematic Hero */}
      <div className="relative overflow-hidden rounded-[3rem] border border-border shadow-[0_40px_100px_rgba(0,0,0,0.6)] group">
        <div className="relative aspect-[21/9] md:aspect-[3/1]">
          {college.image ? (
            <Image
              src={college.image}
              alt={college.name}
              fill
              className="object-cover transition-transform duration-1000 group-hover:scale-105"
              priority
              sizes="(max-width: 1200px) 100vw, 1200px"
              crossOrigin="anonymous"
            />
          ) : (
            <div className="absolute inset-0 bg-muted/30 flex flex-col items-center justify-center">
              <div className="h-32 w-32 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <span className="text-6xl font-black text-primary/50">
                  {college.name.charAt(0)}
                </span>
              </div>
            </div>
          )}
          {/* Layered Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background to-transparent opacity-80" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-14 flex flex-col items-start gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="bg-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-none shadow-[0_0_20px_rgba(37,99,235,0.4)]">
              Ranked #{college.ranking}
            </Badge>
            <Badge variant="outline" className="bg-background/20 border-border backdrop-blur-xl px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-foreground">
              <Star className="mr-1.5 h-3 w-3 fill-yellow-500 text-yellow-500" />
              {college.rating} Score
            </Badge>
            <Badge variant="outline" className="bg-background/20 border-border backdrop-blur-xl px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {college.type} Institution
            </Badge>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl md:text-7xl font-black text-foreground tracking-tighter leading-none text-balance">
              {college.name}
            </h1>
            <div className="flex items-center gap-2 text-primary font-bold tracking-wide">
              <MapPin className="h-5 w-5" />
              <span className="text-lg opacity-80">{college.location}, {college.state}</span>
            </div>
          </div>
        </div>

        {/* Glowing Accent */}
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/20 blur-[150px] -z-10 rounded-full" />
      </div>

      {/* Synchronized Protocol Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Established", value: college.established, icon: Calendar, color: "text-blue-400" },
          { label: "Foundation", value: college.accreditation, icon: ShieldCheck, color: "text-emerald-400" },
          { label: "Efficiency", value: `${college.placement.percentage}%`, icon: TrendingUp, color: "text-primary" },
          { label: "Architecture", value: `${college.courses.length} Units`, icon: BookOpen, color: "text-purple-400" },
        ].map((stat, i) => (
          <Card key={i} className="bg-card/50 border-border backdrop-blur-xl rounded-3xl overflow-hidden group hover:border-primary/50 transition-colors duration-500">
            <CardContent className="flex items-center gap-5 p-6">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50 border border-border group-hover:scale-110 transition-transform ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-foreground tracking-tight">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Analysis Tabs */}
      <Tabs defaultValue="overview" className="space-y-10">
        <div className="flex justify-center md:justify-start">
          <TabsList className="bg-muted/50 border border-border p-1.5 h-16 rounded-[2rem] gap-2 mb-2">
            {["Overview", "Courses", "Fees", "Placement", "Eligibility"].map((tab) => (
              <TabsTrigger key={tab.toLowerCase()} value={tab.toLowerCase()} className="rounded-[1.5rem] px-8 h-full font-black text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Overview Tab UI */}
        <TabsContent value="overview" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Card className="bg-card/50 border-border backdrop-blur-2xl rounded-[2.5rem] p-4">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <CardTitle className="text-2xl font-black text-foreground tracking-tight italic">Abstract</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-[1.8] text-lg font-medium opacity-90">
                    {college.description}
                  </p>
                </CardContent>
              </Card>

              {college.facilities.length > 0 && (
                <Card className="bg-card/50 border-border backdrop-blur-2xl rounded-[2.5rem] p-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-2xl font-black text-foreground tracking-tight">Environmental Features</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      {college.facilities.map((facility, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-muted/50 border border-border text-muted-foreground font-bold text-sm hover:border-primary/50 transition-colors"
                        >
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          {facility}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-8">
              <Card className="bg-card/50 border-border backdrop-blur-2xl rounded-[2.5rem] p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
                <CardHeader>
                  <CardTitle className="text-xl font-black text-foreground tracking-tight">Metadata</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {[
                    { label: "System Type", value: `${college.type} Institution`, icon: Building2 },
                    { label: "Vector Node", value: `${college.location}, ${college.state}`, icon: MapPin },
                    { label: "Input Capacity", value: `${college.courses.reduce((sum, c) => sum + c.seats, 0)} Seats`, icon: Users },
                    { label: "Value Output", value: `${formatCurrency(college.placement.averagePackage)} Avg`, icon: IndianRupee },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="h-10 w-10 shrink-0 bg-muted/50 rounded-xl flex items-center justify-center text-primary border border-border">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{item.label}</p>
                        <p className="text-sm font-bold text-foreground">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Placement Tab Analysis */}
        <TabsContent value="placement" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="space-y-12">
            <div className="grid gap-8 sm:grid-cols-3">
              {[
                { label: "Success Rate", value: `${college.placement.percentage}%`, icon: TrendingUp, color: "text-emerald-400" },
                { label: "Standard Flow", value: formatCurrency(college.placement.averagePackage), icon: IndianRupee, color: "text-primary" },
                { label: "Peak Signal", value: formatCurrency(college.placement.highestPackage), icon: Award, color: "text-purple-400" },
              ].map((item, i) => (
                <Card key={i} className="bg-card/50 border-border backdrop-blur-2xl rounded-[2.5rem] p-8 text-center group hover:bg-accent/50 transition-all">
                  <div className={`mx-auto h-16 w-16 mb-6 rounded-3xl bg-muted/50 border border-border flex items-center justify-center ${item.color}`}>
                    <item.icon className="h-8 w-8" />
                  </div>
                  <p className="text-4xl font-black text-foreground tracking-tighter mb-2">{item.value}</p>
                  <p className="text-[10px] uppercase tracking-[0.3em] font-black text-muted-foreground">{item.label}</p>
                </Card>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
              <Card className="bg-card/50 border-border backdrop-blur-2xl rounded-[2.5rem] p-8">
                <h3 className="text-2xl font-black text-foreground tracking-tight mb-8">Performance Spectrum</h3>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 700 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 700 }} />
                      <Tooltip
                        cursor={{ fill: 'hsl(var(--accent)/0.2)' }}
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "20px",
                          padding: "12px 20px",
                          boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
                        }}
                      />
                      <Bar dataKey="Avg Package (L)" fill="#3b82f6" radius={[10, 10, 10, 10]} barSize={25} />
                      <Bar dataKey="Placement %" fill="#8b5cf6" radius={[10, 10, 10, 10]} barSize={25} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="bg-card/50 border-border backdrop-blur-2xl rounded-[2.5rem] p-8">
                <h3 className="text-2xl font-black text-foreground tracking-tight mb-8">Strategic Partners</h3>
                <div className="flex flex-wrap gap-4">
                  {college.placement.topRecruiters.map((recruiter) => (
                    <div key={recruiter} className="px-6 py-4 rounded-2xl bg-muted/50 border border-border text-muted-foreground font-black text-sm tracking-tight hover:bg-accent hover:border-primary/50 transition-all cursor-default">
                      {recruiter}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Dynamic Tables (Courses, Fees, Eligibility) */}
        {["courses", "fees", "eligibility"].map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Card className="bg-card/50 border-border backdrop-blur-2xl rounded-[2.5rem] overflow-hidden">
              <div className="p-8 pb-0 flex flex-col gap-2">
                <h3 className="text-3xl font-black text-foreground tracking-tight capitalize">{tabValue} Protocol</h3>
                <p className="text-muted-foreground font-bold text-sm">Synchronized data for the current academic cycle.</p>
              </div>
              <div className="p-8">
                {tabValue === "eligibility" ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    {college.eligibility.map((elig, i) => (
                      <div key={i} className="p-6 rounded-3xl bg-muted/50 border border-border hover:border-primary/50 transition-colors">
                        <h4 className="text-lg font-black text-foreground mb-4">{elig.courseName}</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground font-bold uppercase tracking-widest">Entry Modules</span>
                            <span className="text-primary font-bold">{elig.entranceExams?.join(" | ") || "Sync Failure"}</span>
                          </div>
                          <Separator className="bg-border" />
                          <p className="text-sm font-medium text-muted-foreground leading-relaxed italic">
                            "{elig.criteria}"
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Table className="text-foreground">
                    <TableHeader className="border-b border-border">
                      <TableRow className="hover:bg-transparent border-none">
                        <TableHead className="text-muted-foreground font-black uppercase tracking-wider text-[10px] h-12">Reference</TableHead>
                        {tabValue === "courses" ? (
                          <>
                            <TableHead className="text-muted-foreground font-black uppercase tracking-wider text-[10px]">Timing</TableHead>
                            <TableHead className="text-muted-foreground font-black uppercase tracking-wider text-[10px]">Volume</TableHead>
                            <TableHead className="text-right text-muted-foreground font-black uppercase tracking-wider text-[10px]">Investment</TableHead>
                          </>
                        ) : (
                          <>
                            <TableHead className="text-right text-muted-foreground font-black uppercase tracking-wider text-[10px]">Academic</TableHead>
                            <TableHead className="text-right text-muted-foreground font-black uppercase tracking-wider text-[10px]">Residency</TableHead>
                            <TableHead className="text-right text-muted-foreground font-black uppercase tracking-wider text-[10px]">Compute</TableHead>
                            <TableHead className="text-right text-primary font-black uppercase tracking-wider text-[10px]">Total Core</TableHead>
                          </>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(tabValue === "courses" ? college.courses : college.feeStructure).map((item, i) => (
                        <TableRow key={i} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <TableCell className="font-black text-foreground py-6">
                            {tabValue === "courses" ? (item as any).name : (item as any).courseName}
                            {tabValue === "courses" && (
                              <p className="text-[10px] font-medium text-muted-foreground mt-1 max-w-xs leading-relaxed italic">{(item as any).description}</p>
                            )}
                          </TableCell>
                          {tabValue === "courses" ? (
                            <>
                              <TableCell className="font-bold text-muted-foreground">{(item as any).duration}</TableCell>
                              <TableCell className="font-bold text-muted-foreground">{(item as any).seats} Seats</TableCell>
                              <TableCell className="text-right font-black text-primary">{formatCurrency((item as any).fees)}</TableCell>
                            </>
                          ) : (
                            <>
                              <TableCell className="text-right font-medium">{formatCurrency((item as any).tuition)}</TableCell>
                              <TableCell className="text-right font-medium">{formatCurrency((item as any).hostel)}</TableCell>
                              <TableCell className="text-right font-medium">{formatCurrency((item as any).other)}</TableCell>
                              <TableCell className="text-right font-black text-primary bg-primary/5">{formatCurrency((item as any).total)}</TableCell>
                            </>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
