"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { getCollegeById } from "@/lib/api"
import type { College } from "@/lib/types"
import { CollegeForm } from "@/components/college-form"
import { Spinner } from "@/components/ui/spinner"

export default function EditCollegePage() {
  const params = useParams()
  const id = params.id as string
  const [college, setCollege] = useState<College | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const data = await getCollegeById(id)
        if (!data) {
          setNotFound(true)
        } else {
          setCollege(data)
        }
      } catch {
        setNotFound(true)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [id])

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center">
        <h2 className="text-xl font-semibold text-foreground">
          College Not Found
        </h2>
        <p className="text-muted-foreground mt-2">
          The college you are looking for does not exist.
        </p>
      </div>
    )
  }

  return <CollegeForm college={college} mode="edit" />
}
