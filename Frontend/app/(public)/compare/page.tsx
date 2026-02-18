"use client"

import { useCallback, useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import useSWR from "swr"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/components/auth-provider"
import { getColleges, getCollegeById } from "@/lib/api"
import { College } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Plus,
  X,
  Star,
  MapPin,
  Trophy,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react"
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts"

function formatCurrency(value: number) {
  if (value >= 10000000) return `${(value / 10000000).toFixed(2)} Cr`
  if (value >= 100000) return `${(value / 100000).toFixed(1)} L`
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
  return `${value}`
}

function getBestValue(
  colleges: College[],
  getValue: (c: College) => number,
  mode: "max" | "min" = "max"
): string {
  if (colleges.length === 0) return ""
  const values = colleges.map(getValue)
  const best = mode === "max" ? Math.max(...values) : Math.min(...values)
  const idx = values.indexOf(best)
  return colleges[idx] ? (colleges[idx]._id || colleges[idx].id) : ""
}

function CompareContent() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedIds = searchParams.get("colleges")?.split(",") || []
  const [colleges, setColleges] = useState<College[]>([])
  const [isLoadingColleges, setIsLoadingColleges] = useState(false)

  // Auth guard
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/login?callbackUrl=/compare")
    }
  }, [isAuthenticated, isAuthLoading, router])

  const { data: allCollegesData, isLoading: isLoadingAll } = useSWR(
    isAuthenticated ? "all-colleges-for-compare" : null,
    () => getColleges({ limit: 5000 })
  )
  const allColleges = allCollegesData?.data || []

  // Load pre-selected colleges
  useEffect(() => {
    if (preselectedIds.length > 0 && colleges.length === 0) {
      setIsLoadingColleges(true)
      Promise.all(preselectedIds.map((id) => getCollegeById(id))).then(
        (results) => {
          setColleges(results.filter(Boolean) as College[])
          setIsLoadingColleges(false)
        }
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addCollege = useCallback(
    (college: College) => {
      if (colleges.length >= 3) return
      const collegeId = college._id || college.id
      if (colleges.find((c) => (c._id || c.id) === collegeId)) return
      setColleges((prev) => [...prev, college])
    },
    [colleges]
  )

  const removeCollege = useCallback((id: string) => {
    setColleges((prev) => prev.filter((c) => (c._id || c.id) !== id))
  }, [])

  const availableColleges = allColleges.filter(
    (c) => !colleges.find((sc) => (sc._id || sc.id) === (c._id || c.id))
  )

  // Radar chart data
  const radarData =
    colleges.length >= 2
      ? [
        {
          metric: "Rating",
          ...Object.fromEntries(
            colleges.map((c) => [c.name.split(" ").slice(0, 2).join(" "), (c.rating / 5) * 100])
          ),
        },
        {
          metric: "Placement",
          ...Object.fromEntries(
            colleges.map((c) => [c.name.split(" ").slice(0, 2).join(" "), c.placement.percentage])
          ),
        },
        {
          metric: "Courses",
          ...Object.fromEntries(
            colleges.map((c) => [
              c.name.split(" ").slice(0, 2).join(" "),
              Math.min((c.courses.length / 5) * 100, 100),
            ])
          ),
        },
        {
          metric: "Facilities",
          ...Object.fromEntries(
            colleges.map((c) => [
              c.name.split(" ").slice(0, 2).join(" "),
              Math.min((c.facilities.length / 8) * 100, 100),
            ])
          ),
        },
        {
          metric: "Package",
          ...Object.fromEntries(
            colleges.map((c) => [
              c.name.split(" ").slice(0, 2).join(" "),
              Math.min((c.placement.averagePackage / 4000000) * 100, 100),
            ])
          ),
        },
      ]
      : []

  const radarColors = ["oklch(0.45 0.18 260)", "oklch(0.60 0.15 200)", "oklch(0.55 0.12 150)"]

  // Comparison rows
  const comparisonRows = [
    {
      label: "Rating",
      getValue: (c: College) => (
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
          <span className="font-semibold">{c.rating}</span>
          <span className="text-muted-foreground">/ 5</span>
        </div>
      ),
      getBestId: () => getBestValue(colleges, (c) => c.rating),
    },
    {
      label: "Ranking",
      getValue: (c: College) => (
        <span className="font-semibold">#{c.ranking}</span>
      ),
      getBestId: () => getBestValue(colleges, (c) => c.ranking, "min"),
    },
    {
      label: "Location",
      getValue: (c: College) => (
        <div className="flex items-center gap-1 text-sm">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
          {c.location}
        </div>
      ),
      getBestId: () => "",
    },
    {
      label: "Established",
      getValue: (c: College) => <span>{c.established}</span>,
      getBestId: () => getBestValue(colleges, (c) => c.established, "min"),
    },
    {
      label: "Type",
      getValue: (c: College) => <Badge variant="outline">{c.type}</Badge>,
      getBestId: () => "",
    },
    {
      label: "Accreditation",
      getValue: (c: College) => (
        <Badge variant="secondary">{c.accreditation}</Badge>
      ),
      getBestId: () => "",
    },
    {
      label: "Courses Count",
      getValue: (c: College) => (
        <span className="font-semibold">{c.courses.length}</span>
      ),
      getBestId: () => getBestValue(colleges, (c) => c.courses.length),
    },
    {
      label: "Min Fee",
      getValue: (c: College) => (
        <span className="font-semibold">
          {formatCurrency(Math.min(...c.courses.map((course) => course.fees)))}
        </span>
      ),
      getBestId: () =>
        getBestValue(
          colleges,
          (c) => Math.min(...c.courses.map((course) => course.fees)),
          "min"
        ),
    },
    {
      label: "Placement Rate",
      getValue: (c: College) => (
        <span className="font-semibold">{c.placement.percentage}%</span>
      ),
      getBestId: () =>
        getBestValue(colleges, (c) => c.placement.percentage),
    },
    {
      label: "Avg Package",
      getValue: (c: College) => (
        <span className="font-semibold">
          {formatCurrency(c.placement.averagePackage)}
        </span>
      ),
      getBestId: () =>
        getBestValue(colleges, (c) => c.placement.averagePackage),
    },
    {
      label: "Highest Package",
      getValue: (c: College) => (
        <span className="font-semibold">
          {formatCurrency(c.placement.highestPackage)}
        </span>
      ),
      getBestId: () =>
        getBestValue(colleges, (c) => c.placement.highestPackage),
    },
    {
      label: "Facilities",
      getValue: (c: College) => (
        <div className="flex flex-wrap gap-1">
          {c.facilities.slice(0, 4).map((f) => (
            <Badge key={f} variant="outline" className="text-xs">
              {f}
            </Badge>
          ))}
          {c.facilities.length > 4 && (
            <Badge variant="outline" className="text-xs">
              +{c.facilities.length - 4}
            </Badge>
          )}
        </div>
      ),
      getBestId: () =>
        getBestValue(colleges, (c) => c.facilities.length),
    },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href="/colleges">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to colleges
        </Link>
      </Button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
          Compare Colleges
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Select up to 3 colleges to compare side by side
        </p>
      </div>

      {/* College Selection Headers */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-[200px_repeat(3,_1fr)]">
        <div className="hidden sm:flex flex-col justify-center p-4 rounded-lg border border-border/60 bg-muted/20 relative overflow-hidden group">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, oklch(0.50 0.02 260) 1px, transparent 0)`,
              backgroundSize: '16px 16px'
            }} />
          </div>
          <div className="relative z-10 flex flex-col items-center gap-2 text-center">
            <div className="p-2 rounded-full bg-primary/10 text-primary mb-1 group-hover:scale-110 transition-transform">
              <Trophy className="h-6 w-6" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">Comparison</p>
            <p className="text-[10px] text-muted-foreground leading-tight">Finding your perfect future match</p>
          </div>
        </div>
        {[0, 1, 2].map((i) => {
          const college = colleges[i]
          const preselectedId = preselectedIds[i]

          if (isLoadingColleges && preselectedId && !college) {
            return <Skeleton key={`skeleton-${i}`} className="h-40 rounded-lg" />
          }

          if (college) {
            return (
              <Card key={college._id || college.id} className="relative border-border/60">
                <button
                  onClick={() => removeCollege(college._id || college.id)}
                  className="absolute right-2 top-2 rounded-full p-1 hover:bg-muted"
                  aria-label={`Remove ${college.name}`}
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
                <CardContent className="flex flex-col items-center gap-2 p-4 pt-8 text-center">
                  <div className="relative h-16 w-full overflow-hidden rounded-md">
                    {college.image ? (
                      <Image
                        src={college.image}
                        alt={college.name}
                        fill
                        className="object-cover"
                        sizes="200px"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="h-full w-full bg-secondary/50 flex items-center justify-center">
                        <span className="text-2xl font-bold text-primary/50">
                          {college.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold leading-tight text-foreground text-balance">
                    {college.name}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {college.city}
                  </div>
                </CardContent>
              </Card>
            )
          }

          return (
            <CollegeSelector
              key={`selector-${i}`}
              colleges={availableColleges}
              isLoading={isLoadingAll}
              onSelect={addCollege}
            />
          )
        })}
      </div>

      {/* Comparison Rows */}
      {colleges.length >= 2 && (
        <div className="space-y-4">
          <Card className="border-border/60 overflow-hidden">
            <div className="flex flex-col">
              {comparisonRows.map((row, rowIndex) => {
                const bestId = row.getBestId()
                return (
                  <div
                    key={row.label}
                    className={cn(
                      "grid grid-cols-1 items-stretch sm:grid-cols-[200px_repeat(3,_1fr)] gap-4 border-b border-border/40 last:border-0",
                      rowIndex % 2 === 0 ? "bg-muted/5" : "bg-transparent"
                    )}
                  >
                    {/* Label Column */}
                    <div className="bg-muted/30 px-4 py-3 text-sm font-semibold text-foreground flex items-center border-r border-border/40 sm:border-r-0">
                      {row.label}
                    </div>

                    {/* Data Columns */}
                    {[0, 1, 2].map((i) => {
                      const college = colleges[i]
                      const isBest = college && (college._id || college.id) === bestId

                      return (
                        <div
                          key={college?._id || college?.id || `empty-${i}`}
                          className={cn(
                            "px-4 py-3 text-sm flex items-center min-h-[50px]",
                            isBest ? "bg-primary/5 font-medium" : ""
                          )}
                        >
                          {college ? (
                            <div className="flex items-center gap-2">
                              {row.getValue(college)}
                              {isBest && (
                                <Trophy className="h-3.5 w-3.5 text-primary shrink-0" />
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground/30">-</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Radar Chart */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-lg">Visual Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <div className="h-80 w-full max-w-lg">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid className="stroke-border" />
                      <PolarAngleAxis
                        dataKey="metric"
                        className="text-xs"
                        tick={{ fill: "oklch(0.50 0.02 260)", fontSize: 12 }}
                      />
                      {colleges.map((college, i) => (
                        <Radar
                          key={college._id || college.id || i}
                          name={college.name.split(" ").slice(0, 2).join(" ")}
                          dataKey={college.name.split(" ").slice(0, 2).join(" ")}
                          stroke={radarColors[i]}
                          fill={radarColors[i]}
                          fillOpacity={0.15}
                          strokeWidth={2}
                        />
                      ))}
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-4">
                  {colleges.map((college, i) => (
                    <div key={college._id || college.id || i} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: radarColors[i] }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {college.name.split(" ").slice(0, 3).join(" ")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {colleges.length < 2 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            Select at least 2 colleges
          </h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Choose colleges from the dropdowns above to start comparing them
            side by side.
          </p>
        </div>
      )}
    </div>
  )
}

function CollegeSelector({
  colleges,
  isLoading,
  onSelect,
}: {
  colleges: College[]
  isLoading: boolean
  onSelect: (college: College) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex h-full min-h-[160px] items-center justify-center rounded-lg border-2 border-dashed border-border transition-colors hover:border-primary/40 hover:bg-muted/30">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Plus className="h-6 w-6" />
            <span className="text-sm font-medium">Add College</span>
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="center">
        <Command>
          <CommandInput placeholder="Search colleges..." />
          <CommandList>
            <CommandEmpty>
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  Loading colleges...
                </div>
              ) : (
                `No college found. (${colleges.length} available)`
              )}
            </CommandEmpty>
            <CommandGroup>
              {!isLoading && colleges.length > 0 && colleges.map((college, i) => (
                <CommandItem
                  key={college._id || college.id || i}
                  value={college.name}
                  onSelect={() => {
                    onSelect(college)
                    setOpen(false)
                  }}
                  className="cursor-pointer"
                >
                  <div>
                    <p className="text-sm font-medium">{college.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {college.city} - Rating: {college.rating}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}


export default function ComparePage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <CompareContent />
    </Suspense>
  )
}
