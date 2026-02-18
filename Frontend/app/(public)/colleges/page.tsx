"use client"

import { useCallback, useEffect, useState } from "react"
import useSWR from "swr"
import { getColleges } from "@/lib/api"
import type { College, CollegeListParams } from "@/lib/types"
import { CollegeCard } from "@/components/college-card"
import { CollegeFilters } from "@/components/college-filters"
import { CompareBar } from "@/components/compare-bar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, SlidersHorizontal, GraduationCap } from "lucide-react"

export default function CollegesPage() {
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [selectedCities, setSelectedCities] = useState<string[]>([])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [feeRange, setFeeRange] = useState<[number, number]>([0, 5000000])
  const [sort, setSort] = useState<CollegeListParams["sort"]>("ranking")
  const [page, setPage] = useState(1)
  const [compareList, setCompareList] = useState<College[]>([])
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  // Reset page on filter change
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, selectedCities, selectedTypes, feeRange, sort])

  const params: CollegeListParams = {
    search: debouncedSearch || undefined,
    city: selectedCities.length ? selectedCities : undefined,
    type: selectedTypes.length ? selectedTypes : undefined,
    minFee: feeRange[0] > 0 ? feeRange[0] : undefined,
    maxFee: feeRange[1] < 5000000 ? feeRange[1] : undefined,
    sort,
    page,
    limit: 6,
  }

  const { data, isLoading } = useSWR(
    ["colleges", JSON.stringify(params)],
    () => getColleges(params),
    { keepPreviousData: true }
  )

  const toggleCompare = useCallback(
    (college: College) => {
      setCompareList((prev) => {
        if (prev.find((c) => (c._id || c.id) === (college._id || college.id))) {
          return prev.filter((c) => (c._id || c.id) !== (college._id || college.id))
        }
        if (prev.length >= 3) return prev
        return [...prev, college]
      })
    },
    []
  )

  function resetFilters() {
    setSelectedCities([])
    setSelectedTypes([])
    setFeeRange([0, 5000000])
    setSearch("")
  }

  const filterPanel = (
    <CollegeFilters
      selectedCities={selectedCities}
      selectedTypes={selectedTypes}
      feeRange={feeRange}
      onCitiesChange={setSelectedCities}
      onTypesChange={setSelectedTypes}
      onFeeRangeChange={setFeeRange}
      onReset={resetFilters}
    />
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
            Explore Colleges
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data?.total
              ? `${data.total} colleges found`
              : "Find your perfect college"}
          </p>
        </div>

        {/* Search and Sort */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search colleges, cities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Sheet
              open={mobileFiltersOpen}
              onOpenChange={setMobileFiltersOpen}
            >
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="lg:hidden"
                >
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 overflow-y-auto">
                <div className="pt-6">{filterPanel}</div>
              </SheetContent>
            </Sheet>
            <Select
              value={sort}
              onValueChange={(v) => setSort(v as CollegeListParams["sort"])}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ranking">By Ranking</SelectItem>
                <SelectItem value="rating">By Rating</SelectItem>
                <SelectItem value="fees-low">Fees: Low to High</SelectItem>
                <SelectItem value="fees-high">Fees: High to Low</SelectItem>
                <SelectItem value="placement">Placement Rate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex gap-8">
        {/* Desktop Filters Sidebar */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 rounded-lg border border-border/60 bg-card p-5">
            {filterPanel}
          </div>
        </aside>

        {/* College Grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-3">
                  <Skeleton className="aspect-[2/1] rounded-lg" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : data && data.data.length > 0 ? (
            <>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {data.data.map((college, i) => (
                  <CollegeCard
                    key={college._id || college.id || i}
                    college={college}
                    isSelected={!!compareList.find((c) => c.id === college.id)}
                    onToggleCompare={toggleCompare}
                  />
                ))}
              </div>

              {/* Pagination */}
              {data.totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <span className="px-3 text-sm text-muted-foreground">
                    Page {page} of {data.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= data.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <GraduationCap className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                No colleges found
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your search or filters
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={resetFilters}
              >
                Reset filters
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Compare Bar */}
      <CompareBar
        selectedColleges={compareList}
        onRemove={(id) =>
          setCompareList((prev) => prev.filter((c) => c.id !== id))
        }
        onClear={() => setCompareList([])}
      />

      {/* Spacer when compare bar is visible */}
      {compareList.length > 0 && <div className="h-20" />}
    </div>
  )
}
