"use client"

import { useRouter } from "next/navigation"
import type { College } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, ArrowRight } from "lucide-react"

interface CompareBarProps {
  selectedColleges: College[]
  onRemove: (collegeId: string) => void
  onClear: () => void
}

export function CompareBar({
  selectedColleges,
  onRemove,
  onClear,
}: CompareBarProps) {
  const router = useRouter()

  if (selectedColleges.length === 0) return null

  function handleCompare() {
    const ids = selectedColleges.map((c) => c._id || c.id).join(",")
    router.push(`/compare?colleges=${ids}`)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 px-4 py-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-foreground">
            Compare ({selectedColleges.length}/3):
          </span>
          <div className="flex flex-wrap gap-2">
            {selectedColleges.map((college) => (
              <Badge
                key={college._id || college.id}
                variant="secondary"
                className="gap-1 py-1 pr-1"
              >
                <span className="max-w-[120px] truncate text-xs">
                  {college.name.length > 20
                    ? college.name.split(",")[0].split(" ").slice(0, 3).join(" ")
                    : college.name}
                </span>
                <button
                  onClick={() => onRemove(college._id || college.id)}
                  className="ml-1 rounded-full p-0.5 hover:bg-muted"
                  aria-label={`Remove ${college.name} from comparison`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onClear}>
            Clear
          </Button>
          <Button
            size="sm"
            onClick={handleCompare}
            disabled={selectedColleges.length < 2}
          >
            Compare
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
