# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a "Roue des noms" (Name Wheel) application - an interactive wheel spinner that randomly selects names. Built with Next.js 15, React 19, and TypeScript, using shadcn/ui components and Tailwind CSS.

## Development Commands

```bash
# Development server (runs on port 3001)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint
npm run lint
```

## Architecture

### Single-Page Application Structure

The entire application is contained in a single page component at `app/page.tsx`. This is intentional - the app is simple enough that splitting into multiple components would add unnecessary complexity.

**Key architectural decision**: Names are stored in URL query parameters (`?names=name1,name2,name3`) to enable easy sharing. The URL is the source of truth and is synced bidirectionally with component state.

### Main Component State (`app/page.tsx`)

The NameWheel component manages several interconnected pieces of state:

- **names**: Array of name strings, synced with URL params
- **spinning**: Boolean for animation state
- **selectedName**: Currently selected name (null when not spinning/selected)
- **rotationAngle**: Current rotation in degrees
- **isTransitioning**: Controls CSS transition (disabled during angle reset)
- **buttonMode**: Either "spin" or "remove" (changes after selection)
- **timerActive/timeLeft**: 2-minute countdown timer state

### URL Sync Pattern

The component uses a bidirectional sync pattern with `useSearchParams` and `window.history.pushState`:

1. URL changes trigger state updates via `useEffect` (lines 110-117)
2. State changes update URL via separate `useEffect` (lines 91-107)
3. Uses `isUpdatingFromUrl` ref to prevent infinite loops

### Wheel Rendering System

The wheel uses CSS `conic-gradient` for colored segments (lines 263-270) rather than individual div elements. This is more performant and enables smooth gradients.

**Name positioning**: Names are positioned using absolute positioning with rotation transforms. Each name's angle is calculated based on segment count, with the text counter-rotated to remain readable (lines 286-329).

**Selection indicator**: A red segment border rotates to point at the winning segment. This rotates while the wheel background remains fixed (lines 432-458).

### Animation Mechanics

When spinning (lines 198-242):
1. Calculate random target segment
2. Add 5-8 full rotations for dramatic effect
3. Apply 4-second cubic-bezier transition
4. After animation, reset angle to normalized position (without transition) to prevent accumulating rotation values
5. Re-enable transition after 50ms delay

### Timer System

After name selection, a 2-minute countdown timer can be started (lines 119-158):
- Changes color from green → amber → red as time decreases
- Uses `setInterval` with proper cleanup
- Resets when selected name is removed

## Key Implementation Notes

- **Port**: Dev server runs on port 3001 (not default 3000)
- **TypeScript/ESLint**: Build errors are ignored in `next.config.mjs` - this is a v0.dev generated project
- **Client-side only**: The main page uses `"use client"` directive
- **No backend**: Pure client-side application, no API routes or database
- **shadcn/ui**: Uses pre-built UI components from `components/ui/` - these should not be modified directly
