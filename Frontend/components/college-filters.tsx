"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { X } from "lucide-react"

const CITIES = [
  "Mumbai",
  "New Delhi",
  "Bangalore",
  "Chennai",
  "Ahmedabad",
  "Pilani",
  "Tiruchirappalli",
  "Vellore",
]

const TYPES = ["Public", "Private", "Deemed"]

interface CollegeFiltersProps {
  selectedCities: string[]
  selectedTypes: string[]
  feeRange: [number, number]
  onCitiesChange: (cities: string[]) => void
  onTypesChange: (types: string[]) => void
  onFeeRangeChange: (range: [number, number]) => void
  onReset: () => void
}

function formatFee(value: number) {
  if (value >= 100000) return `${(value / 100000).toFixed(0)}L`
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
  return String(value)
}

export function CollegeFilters({
  selectedCities,
  selectedTypes,
  feeRange,
  onCitiesChange,
  onTypesChange,
  onFeeRangeChange,
  onReset,
}: CollegeFiltersProps) {
  const hasActiveFilters =
    selectedCities.length > 0 ||
    selectedTypes.length > 0 ||
    feeRange[0] > 0 ||
    feeRange[1] < 5000000

  function toggleCity(city: string) {
    if (selectedCities.includes(city)) {
      onCitiesChange(selectedCities.filter((c) => c !== city))
    } else {
      onCitiesChange([...selectedCities, city])
    }
  }

  function toggleType(type: string) {
    if (selectedTypes.includes(type)) {
      onTypesChange(selectedTypes.filter((t) => t !== type))
    } else {
      onTypesChange([...selectedTypes, type])
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-auto px-2 py-1 text-xs text-muted-foreground"
          >
            <X className="mr-1 h-3 w-3" />
            Clear all
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Location
        </h4>
        <div className="flex flex-col gap-2">
          {CITIES.map((city) => (
            <label
              key={city}
              className="flex cursor-pointer items-center gap-2"
            >
              <Checkbox
                checked={selectedCities.includes(city)}
                onCheckedChange={() => toggleCity(city)}
              />
              <span className="text-sm text-foreground">{city}</span>
            </label>
          ))}
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-3">
        <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Institution Type
        </h4>
        <div className="flex flex-col gap-2">
          {TYPES.map((type) => (
            <label
              key={type}
              className="flex cursor-pointer items-center gap-2"
            >
              <Checkbox
                checked={selectedTypes.includes(type)}
                onCheckedChange={() => toggleType(type)}
              />
              <span className="text-sm text-foreground">{type}</span>
            </label>
          ))}
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-3">
        <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Fee Range (per year)
        </h4>
        <Slider
          value={[feeRange[0], feeRange[1]]}
          min={0}
          max={5000000}
          step={50000}
          onValueChange={(value) =>
            onFeeRangeChange([value[0], value[1]])
          }
          className="py-2"
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatFee(feeRange[0])}</span>
          <span>{formatFee(feeRange[1])}</span>
        </div>
      </div>
    </div>
  )
}
