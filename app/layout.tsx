import type React from "react"
import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"

const marianne = localFont({
  src: [
    { path: "./fonts/Marianne-Light.woff2", weight: "300", style: "normal" },
    { path: "./fonts/Marianne-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Marianne-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Marianne-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-marianne",
  display: "swap",
  fallback: ["Arial", "sans-serif"],
})

export const metadata: Metadata = {
  title: "Roue des noms",
  description: "Tirage au sort pour vos rituels d'équipe : une roue de noms partageable par simple lien.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${marianne.variable} font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          storageKey="roue-des-noms:theme"
          disableTransitionOnChange
        >
          {children}
          <Toaster position="bottom-center" />
        </ThemeProvider>
      </body>
    </html>
  )
}
