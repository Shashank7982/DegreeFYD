"use client"

import Link from "next/link"
import Image from "next/image"
import type { College } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { MapPin, Star, TrendingUp, IndianRupee } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

function formatCurrency(value: number) {
  if (value >= 100000) return `${(value / 100000).toFixed(1)}L`
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
  return String(value)
}

interface CollegeCardProps {
  college: College
  isSelected?: boolean
  onToggleCompare?: (college: College) => void
  showCompare?: boolean
}

export function CollegeCard({
  college,
  isSelected = false,
  onToggleCompare,
  showCompare = true,
}: CollegeCardProps) {

  const { isAuthenticated } = useAuth()
  const router = useRouter()

  const handleCompareChange = () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to compare", {
        description: "You need to be logged in to compare colleges.",
        action: {
          label: "Sign In",
          onClick: () => router.push("/login"),
        },
      })
      return
    }
    onToggleCompare?.(college)
  }

  return (
    <Card className="group overflow-hidden border-border/60 transition-all hover:border-primary/30 hover:shadow-md">
      <div className="relative aspect-[2/1] overflow-hidden">
        {college.image ? (
          <Image
            src={college.image}
            alt={college.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            crossOrigin="anonymous"
          />
        ) : (
          <div className="h-full w-full bg-secondary/50 flex flex-col items-center justify-center p-6 text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <span className="text-2xl font-bold text-primary">
                {college.name.charAt(0)}
              </span>
            </div>
            <span className="text-sm font-medium text-muted-foreground">Image Not Available</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <Badge
            variant="secondary"
            className="bg-background/90 text-foreground backdrop-blur-sm"
          >
            <Star className="mr-1 h-3 w-3 fill-yellow-500 text-yellow-500" />
            {college.rating}
          </Badge>
          <Badge
            variant="secondary"
            className="bg-background/90 text-foreground backdrop-blur-sm"
          >
            #{college.ranking}
          </Badge>
        </div>
        {showCompare && onToggleCompare && (
          <div className="absolute right-3 top-3">
            <label
              className="flex cursor-pointer items-center gap-1.5 rounded-md bg-background/90 px-2 py-1.5 text-xs font-medium backdrop-blur-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={handleCompareChange}
                aria-label={`Compare ${college.name}`}
              />
              Compare
            </label>
          </div>
        )}
      </div>
      <CardContent className="flex flex-col gap-3 p-4">
        <div>
          <Link
            href={`/colleges/${college.slug}`}
            className="text-base font-semibold leading-tight text-foreground hover:text-primary"
          >
            <h3 className="text-balance">{college.name}</h3>
          </Link>
          <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {college.location}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {college.courses.slice(0, 3).map((course, i) => (
            <Badge key={course.id || i} variant="outline" className="text-xs font-normal">
              {course.name.replace(/^B\.Tech\s|^B\.E\.\s|^M\.Tech\s/, "")}
            </Badge>
          ))}
          {college.courses.length > 3 && (
            <Badge variant="outline" className="text-xs font-normal">
              +{college.courses.length - 3} more
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border/60 pt-3 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <IndianRupee className="h-3.5 w-3.5" />
            <span>
              {college.courses?.length > 0 ? (
                <>
                  {formatCurrency(Math.min(...college.courses.map((c) => c.fees)))}
                  {Math.min(...college.courses.map((c) => c.fees)) !== Math.max(...college.courses.map((c) => c.fees)) &&
                    ` - ${formatCurrency(Math.max(...college.courses.map((c) => c.fees)))}`}
                </>
              ) : (
                "Fees N/A"
              )}
            </span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>{college.placement?.percentage || 0}% placed</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
