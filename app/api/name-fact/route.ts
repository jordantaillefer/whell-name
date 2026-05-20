import { NextResponse } from "next/server"
import { getNameFact } from "@/lib/nameFacts/getNameFact"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get("name")

  if (!name || !name.trim()) {
    return NextResponse.json(
      { error: "Missing required query parameter: name" },
      { status: 400 }
    )
  }

  try {
    const result = await getNameFact(name)
    return NextResponse.json(result)
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[/api/name-fact] error:", err)
    }
    return NextResponse.json(
      { name, fact: "", totalFacts: 0 },
      { status: 200 }
    )
  }
}
