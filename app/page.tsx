"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Trash2, Plus, RotateCw, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

// Add custom CSS for the triangle pointer and wheel
const customStyles = `
  .clip-triangle {
    clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
  }
  
  .wheel-segment-container {
    position: absolute;
    inset: 0;
    margin: auto;
    border-radius: 50%;
    overflow: hidden;
  }
  
  .wheel-name {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.7);
    pointer-events: none;
    transform-origin: center;
  }
  
  .name-text {
    position: absolute;
    left: 50%;
    width: 80px;
    text-align: center;
    transform-origin: left center;
  }
  
  .selector-segment {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    clip-path: polygon(50% 50%, 50% 0%, calc(50% + 40px) 0%, calc(50% + 40px) 50%);
    border: 3px solid white;
    background-color: rgba(255, 255, 255, 0.1);
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
    pointer-events: none;
    z-index: 10;
  }
`;

export default function NameWheel() {
  const searchParams = useSearchParams()

  // Parse names from URL only on initial render
  const getNamesFromUrl = (): string[] => {
    const namesParam = searchParams.get("names")
    return namesParam ? namesParam.split(",") : []
  }

  // State
  const [names, setNames] = useState<string[]>(() => getNamesFromUrl())
  const [newName, setNewName] = useState("")
  const [spinning, setSpinning] = useState(false)
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const wheelRef = useRef<HTMLDivElement>(null)
  const [rotationAngle, setRotationAngle] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(true)
  const [buttonMode, setButtonMode] = useState<"spin" | "remove">("spin")
  // Nouveaux états pour le timer
  const [timerActive, setTimerActive] = useState(false)
  const [timeLeft, setTimeLeft] = useState(120) // 2 minutes en secondes
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  // États pour les modes d'affichage alternatifs
  const [displayMode, setDisplayMode] = useState<"wheel" | "grid" | "star">(() => {
    const modeParam = searchParams.get("mode")
    return modeParam === "grid" ? "grid" : modeParam === "star" ? "star" : "wheel"
  })
  const [gridAnimating, setGridAnimating] = useState(false)
  const [starAnimating, setStarAnimating] = useState(false)
  const [currentHighlightIndex, setCurrentHighlightIndex] = useState<number | null>(null)
  const gridIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const starIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Track if we're updating from URL to prevent loops
  const isUpdatingFromUrl = useRef(false)

  // Update URL when names or displayMode change, but only if not updating from URL
  useEffect(() => {
    if (isUpdatingFromUrl.current) {
      isUpdatingFromUrl.current = false
      return
    }

    const params = new URLSearchParams()
    if (names.length > 0) {
      params.set("names", names.join(","))
    }
    if (displayMode !== "wheel") {
      params.set("mode", displayMode)
    }

    // Create new URL with updated params
    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`

    // Update URL without full page reload
    window.history.pushState({}, "", newUrl)
  }, [names, displayMode])

  // Sync state with URL on navigation, but only when searchParams actually change
  useEffect(() => {
    const newNames = getNamesFromUrl()
    const modeParam = searchParams.get("mode")
    const newMode: "wheel" | "grid" | "star" =
      modeParam === "grid" ? "grid" : modeParam === "star" ? "star" : "wheel"

    // Only update if the names or mode are different to prevent loops
    if (JSON.stringify(newNames) !== JSON.stringify(names) || newMode !== displayMode) {
      isUpdatingFromUrl.current = true
      setNames(newNames)
      setDisplayMode(newMode)
    }
  }, [searchParams, names, displayMode])

  // Fonction pour démarrer le timer
  const startTimer = () => {
    if (timerActive) return
    setTimerActive(true)
    setTimeLeft(120)
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timerRef.current!)
          setTimerActive(false)
          return 0
        }
        return prevTime - 1
      })
    }, 1000)
  }

  // Nettoyer les timers et intervalles quand le composant est démonté
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (gridIntervalRef.current) {
        clearInterval(gridIntervalRef.current)
      }
      if (starIntervalRef.current) {
        clearInterval(starIntervalRef.current)
      }
    }
  }, [])

  // Calculer la couleur du timer en fonction du temps restant
  const getTimerColor = () => {
    if (timeLeft > 60) return 'bg-emerald-600'
    if (timeLeft > 30) return 'bg-amber-500'
    return 'bg-red-600'
  }

  // Calculer l'intensité de l'animation de pulsation
  const getPulseIntensity = () => {
    if (timeLeft > 60) return 'animate-pulse'
    if (timeLeft > 30) return 'animate-pulse'
    return 'animate-pulse animate-duration-500'
  }

  // Add a new name to the wheel
  const addName = (e: React.FormEvent) => {
    e.preventDefault()
    if (newName.trim() && !names.includes(newName.trim())) {
      setNames([...names, newName.trim()])
      setNewName("")
    }
  }

  // Remove a name from the wheel
  const removeName = (nameToRemove: string) => {
    setNames(names.filter((name) => name !== nameToRemove))
    if (nameToRemove === selectedName) {
      setSelectedName(null)
      setButtonMode("spin")
      // Réinitialiser le timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      setTimerActive(false)
      setTimeLeft(120)
    }
  }

  // Handle button click based on current mode
  const handleButtonClick = () => {
    if (buttonMode === "spin") {
      if (displayMode === "wheel") {
        spinWheel()
      } else if (displayMode === "grid") {
        animateGrid()
      } else {
        animateStar()
      }
    } else {
      // Remove the selected name
      if (selectedName) {
        removeName(selectedName)
      }
    }
  }

  // Spin the wheel
  const spinWheel = () => {
    if (names.length < 2 || spinning) return

    setSpinning(true)
    setSelectedName(null)
    setIsTransitioning(true)

    // Calculate segment angle
    const segmentAngle = 360 / names.length
    
    // Pick a random name (segment) to land on
    const randomSegment = Math.floor(Math.random() * names.length)
    
    // Calculate the target angle for the selected segment
    // Le segment 0 est en haut (0 degrés), et on tourne dans le sens horaire
    const targetAngle = randomSegment * segmentAngle
    
    // Nombre de tours complets entre 5 et 8 pour plus de dynamisme
    const fullRotations = 5 + Math.floor(Math.random() * 3)
    
    // La nouvelle rotation est calculée à partir de zéro
    const totalRotation = (fullRotations * 360) + targetAngle + segmentAngle / 2
    
    console.log("New rotation angle:", totalRotation)
    
    setRotationAngle(totalRotation)

    // Calculate which name is selected after spinning
    setTimeout(() => {
      setSelectedName(names[randomSegment])
      setSpinning(false)
      setButtonMode("remove")
      
      // Réinitialiser l'angle après l'animation en désactivant la transition
      setTimeout(() => {
        setIsTransitioning(false)
        setRotationAngle(targetAngle + segmentAngle / 2)
        
        // Réactiver la transition après la réinitialisation
        setTimeout(() => {
          setIsTransitioning(true)
        }, 50)
      }, 100)
    }, 4000)
  }

  // Calculate grid size for square grid
  const calculateGridSize = (nameCount: number) => {
    const size = Math.ceil(Math.sqrt(nameCount))
    return { rows: size, cols: size }
  }

  // Generate star points (alternating between outer and inner radius)
  const generateStarPoints = (
    centerX: number,
    centerY: number,
    branches: number,
    outerRadius: number,
    innerRadius: number
  ): { x: number; y: number }[] => {
    const points: { x: number; y: number }[] = []
    const angleStep = (Math.PI * 2) / branches

    for (let i = 0; i < branches; i++) {
      // Pointe (outer point)
      const outerAngle = i * angleStep - Math.PI / 2
      points.push({
        x: centerX + Math.cos(outerAngle) * outerRadius,
        y: centerY + Math.sin(outerAngle) * outerRadius
      })

      // Creux (inner point)
      const innerAngle = outerAngle + angleStep / 2
      points.push({
        x: centerX + Math.cos(innerAngle) * innerRadius,
        y: centerY + Math.sin(innerAngle) * innerRadius
      })
    }

    return points
  }

  // Generate star segments with SVG
  const generateStarSegments = () => {
    if (names.length === 0) return null

    const colors = [
      "#10b981", // emerald-500
      "#0d9488", // teal-600
      "#0ea5e9", // sky-500
      "#8b5cf6", // violet-500
      "#ec4899", // pink-500
      "#f59e0b", // amber-500
      "#ef4444", // red-500
      "#84cc16", // lime-500
      "#6366f1", // indigo-500
      "#14b8a6"  // teal-500
    ]

    const size = 384 // w-96 in pixels
    const centerX = size / 2
    const centerY = size / 2
    const outerRadius = size / 2 - 10
    const innerRadius = outerRadius * 0.4

    const points = generateStarPoints(centerX, centerY, names.length, outerRadius, innerRadius)

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-lg">
        {names.map((name, index) => {
          const color = colors[index % colors.length]
          const isHighlighted = index === currentHighlightIndex
          const isSelected = name === selectedName

          // Calculate points for this branch polygon
          const branchPoints = [
            points[index * 2], // Outer point (tip)
            points[(index * 2 + 1) % points.length], // Inner point right
            { x: centerX, y: centerY }, // Center
            points[(index * 2 - 1 + points.length) % points.length], // Inner point left
          ]

          const pathD = `M ${branchPoints.map(p => `${p.x},${p.y}`).join(' L ')} Z`

          // Calculate angle for text positioning
          const angle = (index * 360) / names.length
          const textRadius = outerRadius * 0.45 // Plus proche du centre (45% au lieu de 60%)
          const textAngle = (angle - 90) * (Math.PI / 180)
          const textX = centerX + Math.cos(textAngle) * textRadius
          const textY = centerY + Math.sin(textAngle) * textRadius

          return (
            <g key={name} style={{ transformOrigin: `${centerX}px ${centerY}px` }}>
              {/* Branch */}
              <path
                d={pathD}
                fill={color}
                stroke={isHighlighted ? "#10b981" : "white"}
                strokeWidth={isHighlighted ? 4 : 2}
                className={cn(
                  "transition-all",
                  isSelected && "animate-pulse"
                )}
                style={{
                  ...(isHighlighted ? { filter: 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.6))' } : {}),
                  transformOrigin: `${centerX}px ${centerY}px`,
                  transformBox: 'fill-box'
                }}
              />

              {/* Name - kept horizontal relative to screen */}
              <text
                x={textX}
                y={textY}
                fill="white"
                fontSize={names.length > 8 ? "14" : names.length > 5 ? "16" : "18"}
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)', pointerEvents: 'none' }}
              >
                {name}
              </text>
            </g>
          )
        })}

        {/* Center circle */}
        <circle cx={centerX} cy={centerY} r={10} fill="#1f2937" stroke="white" strokeWidth={2} />
      </svg>
    )
  }

  // Animate star by randomly highlighting branches
  const animateStar = () => {
    if (names.length < 2 || starAnimating) return

    setStarAnimating(true)
    setSelectedName(null)
    setCurrentHighlightIndex(null)

    const randomFinalIndex = Math.floor(Math.random() * names.length)
    let jumpCount = 0
    const totalJumps = 33 // ~4 seconds at 120ms per jump

    starIntervalRef.current = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * names.length)
      setCurrentHighlightIndex(randomIndex)
      jumpCount++

      if (jumpCount >= totalJumps) {
        if (starIntervalRef.current) {
          clearInterval(starIntervalRef.current)
          starIntervalRef.current = null
        }
        setCurrentHighlightIndex(randomFinalIndex)

        setTimeout(() => {
          setSelectedName(names[randomFinalIndex])
          setCurrentHighlightIndex(null)
          setStarAnimating(false)
          setButtonMode("remove")
        }, 200)
      }
    }, 120)
  }

  // Generate grid cells with names and empty cells
  const generateGridCells = () => {
    if (names.length === 0) return null

    const { rows, cols } = calculateGridSize(names.length)
    const totalCells = rows * cols
    const colors = [
      "#10b981", // emerald-500
      "#0d9488", // teal-600
      "#0ea5e9", // sky-500
      "#8b5cf6", // violet-500
      "#ec4899", // pink-500
      "#f59e0b", // amber-500
      "#ef4444", // red-500
      "#84cc16", // lime-500
      "#6366f1", // indigo-500
      "#14b8a6"  // teal-500
    ]

    // Create array of cells (names + empty)
    const cells = Array.from({ length: totalCells }, (_, i) => {
      const name = names[i] || null
      const color = name ? colors[i % colors.length] : null
      const isHighlighted = i === currentHighlightIndex
      const isSelected = name === selectedName

      return { name, color, isHighlighted, isSelected, index: i }
    })

    return (
      <div className="grid gap-2 w-full h-full" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {cells.map(cell => (
          <div
            key={cell.index}
            className={cn(
              "aspect-square flex items-center justify-center rounded-lg font-semibold transition-all",
              cell.name ? "text-white shadow-md" : "bg-muted/30",
              cell.isHighlighted && "ring-4 ring-emerald-500 shadow-lg shadow-emerald-500/50",
              cell.isSelected && "ring-4 ring-emerald-600 animate-pulse"
            )}
            style={cell.color ? { backgroundColor: cell.color } : undefined}
          >
            {cell.name && (
              <span className={cn(
                "text-center px-2",
                rows <= 2 ? "text-lg" : rows === 3 ? "text-base" : "text-sm"
              )}>
                {cell.name}
              </span>
            )}
          </div>
        ))}
      </div>
    )
  }

  // Animate grid by randomly highlighting cells
  const animateGrid = () => {
    if (names.length < 2 || gridAnimating) return

    setGridAnimating(true)
    setSelectedName(null)
    setCurrentHighlightIndex(null)

    const randomFinalIndex = Math.floor(Math.random() * names.length)
    let jumpCount = 0
    const totalJumps = 33 // ~4 seconds at 120ms per jump

    gridIntervalRef.current = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * names.length)
      setCurrentHighlightIndex(randomIndex)
      jumpCount++

      if (jumpCount >= totalJumps) {
        if (gridIntervalRef.current) {
          clearInterval(gridIntervalRef.current)
          gridIntervalRef.current = null
        }
        setCurrentHighlightIndex(randomFinalIndex)

        setTimeout(() => {
          setSelectedName(names[randomFinalIndex])
          setCurrentHighlightIndex(null)
          setGridAnimating(false)
          setButtonMode("remove")
        }, 200)
      }
    }, 120)
  }

  // Generate wheel with conic gradient and properly positioned text
  const generateWheelSegments = () => {
    if (names.length === 0) return null
    
    const segmentAngle = 360 / names.length
    const colors = [
      "#10b981", // emerald-500
      "#0d9488", // teal-600
      "#0ea5e9", // sky-500
      "#8b5cf6", // violet-500
      "#ec4899", // pink-500
      "#f59e0b", // amber-500
      "#ef4444", // red-500
      "#84cc16", // lime-500
      "#6366f1", // indigo-500
      "#14b8a6"  // teal-500
    ]
    
    // Create conic gradient for the wheel background
    let gradientStops = ""
    names.forEach((_, index) => {
      const startAngle = index * segmentAngle
      const endAngle = (index + 1) * segmentAngle
      const color = colors[index % colors.length]
      
      gradientStops += `${color} ${startAngle}deg ${endAngle}deg${index < names.length - 1 ? ',' : ''}`
    })
    
    return (
      <>
        {/* Background segments using conic-gradient */}
        <div 
          className="wheel-segment-container"
          style={{
            background: `conic-gradient(${gradientStops})`,
            position: 'absolute',
            inset: 0,
            margin: 'auto'
          }}
        />
        
        {/* Names directly embedded in the wheel */}
        {names.map((name, index) => {
          // Calculate angle for this segment center
          const angle = index * segmentAngle
          const midAngle = angle + (segmentAngle / 2)
          
          // Adjust positioning based on segment count
          // This formula ensures names appear visually centered in each segment
          // For 2-4 segments: ~25-22%
          // For 5-8 segments: ~20-18%
          // For 9+ segments: ~16-12%
          const topPosition = Math.max(12, 28 - Math.sqrt(names.length) * 3)
          
          return (
            <div
              key={name}
              className="wheel-name"
              style={{
                position: 'absolute',
                inset: 0,
                margin: 'auto',
                transform: `rotate(${midAngle}deg)`,
                textAlign: 'center',
                fontSize: names.length > 12 ? '0.7rem' : '0.85rem',
                fontWeight: 'bold',
                color: 'white',
                textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: `${topPosition}%`,
                  width: `${Math.min(120, 800/names.length)}px`,
                  maxWidth: '120px',
                  transform: `translateX(-50%) rotate(-${midAngle}deg)`,
                  display: 'inline-block',
                }}
              >
                {name}
              </span>
            </div>
          )
        })}
      </>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Add the styles to the document */}
      <style jsx global>{customStyles}</style>
      
      <h1 className="text-3xl font-bold text-center mb-8">Roue des noms Pilote</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col items-center">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Ajouter des Noms</CardTitle>
              <CardDescription>
                Ajoutez des noms à la roue. Ils seront stockés dans l'URL pour un partage facile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={addName} className="flex gap-2 mb-4">
                <Input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Entrez un nom"
                  className="flex-1"
                />
                <Button type="submit" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </form>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {names.length === 0 ? (
                  <Alert>
                    <AlertDescription>Aucun nom ajouté. Ajoutez des noms pour commencer.</AlertDescription>
                  </Alert>
                ) : (
                  names.map((name) => (
                    <div
                      key={name}
                      className={`flex items-center justify-between p-2 rounded-md ${
                        name === selectedName ? "bg-emerald-100 text-emerald-800" : "bg-muted"
                      }`}
                    >
                      <span>{name}</span>
                      <Button variant="ghost" size="sm" onClick={() => removeName(name)} className="h-8 w-8 p-0">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {selectedName && (
            <div className="mt-6 text-center">
              <h2 className="text-xl font-semibold">Sélectionné:</h2>
              <div className="text-2xl font-bold mt-2 p-4 bg-emerald-100 text-emerald-800 rounded-lg animate-pulse">
                {selectedName}
              </div>
              
              {/* Nouveau bouton de timer */}
              {!timerActive ? (
                <Button
                  onClick={startTimer}
                  className="mt-4 px-8 bg-emerald-600 hover:bg-emerald-700"
                  size="lg"
                >
                  <Clock className="h-5 w-5 mr-2" />
                  Démarrer le Timer (2 min)
                </Button>
              ) : (
                <div className={`mt-4 p-4 rounded-lg text-white text-2xl font-bold ${getTimerColor()} ${getPulseIntensity()}`}>
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center">
          <Tabs value={displayMode} onValueChange={(v) => setDisplayMode(v as "wheel" | "grid" | "star")} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="wheel" disabled={spinning || gridAnimating || starAnimating}>
                Roue
              </TabsTrigger>
              <TabsTrigger value="grid" disabled={spinning || gridAnimating || starAnimating}>
                Grille
              </TabsTrigger>
              <TabsTrigger value="star" disabled={spinning || gridAnimating || starAnimating}>
                Étoile
              </TabsTrigger>
            </TabsList>

            <TabsContent value="wheel" className="mt-0">
              <div className="relative w-96 h-96 sm:w-96 sm:h-96 mx-auto">
                {/* Fixed wheel container */}
                <div
                  className="absolute inset-0 rounded-full border-4 border-gray-300 overflow-hidden shadow-lg"
                  style={{
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    margin: 'auto'
                  }}
                >
                  {generateWheelSegments()}
                </div>

                {/* Rotating selector segment */}
                <div
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    transform: `rotate(${rotationAngle}deg)`,
                    transition: isTransitioning ? "transform 4s cubic-bezier(0.2, 0.8, 0.2, 1)" : "none",
                    pointerEvents: 'none',
                    zIndex: 5,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      backgroundClip: 'content-box',
                      border: '4px solid red',
                      borderRadius: '50%',
                      clipPath: `polygon(50% 50%, ${50 - (360/names.length)/2}% 0%, ${50 + (360/names.length)/2}% 0%)`,
                      backgroundColor: 'transparent',
                    }}
                  />
                </div>

                {/* Center point */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-gray-800 rounded-full z-10 shadow-md"></div>
              </div>
            </TabsContent>

            <TabsContent value="grid" className="mt-0">
              <div className="w-96 h-96 sm:w-96 sm:h-96 mx-auto flex items-center justify-center p-4">
                {generateGridCells()}
              </div>
            </TabsContent>

            <TabsContent value="star" className="mt-0">
              <div className="w-96 h-96 sm:w-96 sm:h-96 mx-auto flex items-center justify-center">
                {generateStarSegments()}
              </div>
            </TabsContent>
          </Tabs>

          <Button
            onClick={handleButtonClick}
            disabled={names.length < 2 || spinning || gridAnimating || starAnimating}
            className={`mt-8 px-8 ${
              buttonMode === "spin" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
            }`}
            size="lg"
          >
            {(spinning || gridAnimating || starAnimating) ? (
              <>
                <RotateCw className="h-5 w-5 mr-2 animate-spin" />
                {displayMode === "wheel" ? "Rotation en cours..." : displayMode === "grid" ? "Animation en cours..." : "Animation en cours..."}
              </>
            ) : buttonMode === "spin" ? (
              <>
                <RotateCw className="h-5 w-5 mr-2" />
                {displayMode === "wheel" ? "Tourner la Roue" : displayMode === "grid" ? "Animer la Grille" : "Animer l'Étoile"}
              </>
            ) : (
              <>
                <Trash2 className="h-5 w-5 mr-2" />
                Passer au suivant
              </>
            )}
          </Button>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {names.length < 2 && buttonMode === "spin"
              ? "Ajoutez au moins 2 noms pour commencer"
              : buttonMode === "spin"
                ? `Cliquez pour ${
                    displayMode === "wheel" ? "faire tourner la roue" :
                    displayMode === "grid" ? "animer la grille" :
                    "animer l'étoile"
                  } et sélectionner un nom aléatoirement`
                : "Cliquez pour supprimer le nom sélectionné et tourner à nouveau"}
          </p>

          {names.length > 0 && (
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">Partagez cette roue en copiant l'URL</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
