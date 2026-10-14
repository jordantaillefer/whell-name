import { Suspense } from "react"
import { NameWheelApp } from "@/components/roue/NameWheelApp"

export default function Page() {
  return (
    <Suspense fallback={null}>
      <NameWheelApp />
    </Suspense>
  )
}
