# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

« Roue des noms » : tirage au sort de noms pour les rituels d'équipe (daily, tour de table), pensé pour n'importe quel service de l'État. Next.js 15 (App Router), React 19, TypeScript, Tailwind + modules CSS, shadcn/ui. Style inspiré du DSFR **sans bibliothèque DSFR** (police Marianne, couleurs, formes, focus), sans bloc-marque.

## Commandes

```bash
npm run dev -- -p 3001   # serveur de dev
npm test                 # tests Vitest (logique pure dans lib/)
npm run typecheck        # tsc --noEmit (doit être vert)
npm run build
```

Pas de configuration ESLint : ne pas lancer `npm run lint` (assistant interactif).

## Architecture

- `app/page.tsx` → `<Suspense><NameWheelApp/></Suspense>`.
- `components/roue/NameWheelApp.tsx` orchestre l'app : état de jeu `stage` (`play | finale-spinning | finale | recap`), état de l'intro (`playing | revealing | settled | done`), nom tiré (`selected`), panneau Participants.
- Vues : `WheelView` (SVG), `GridView`, `StarView`, `FinaleView`, `RecapView`, `ResultPanel`, `ParticipantsDrawer` (Radix Dialog), `IntroSplash` (Web Animations API, FLIP du pictogramme `WheelMark` vers la roue).
- Hooks (`hooks/`) :
  - `useNamesUrlState` — l'URL est la source de vérité (`?names=a,b&mode=grid`), `pushState`.
  - `useDraw` — rotation de la roue / suite de cases surlignées, verrou anti-double tirage.
  - `useSpeakingTimer` — minuteur 2 min, démarrage auto.
  - `useSessionLog` — ordre de passage, mémoire seulement.
  - `useNameHistory` — `localStorage` `roue-des-noms:history:v1`, 30 noms max, « dernière liste » ; les noms d'un lien partagé sont comptés une fois au chargement.
  - `useShowExtras` — afficher/masquer « Le saviez-vous ? » et l'horoscope (`localStorage` `roue-des-noms:extras:v1`, affichés par défaut), réglable dans le panneau Participants.
  - `useNameFact`, `usePrefersReducedMotion`.
- Logique pure testée (`lib/`) :
  - `names` — normalisation, déduplication, URL.
  - `palette` — 12 pastels inspirés DSFR (texte ≥ 6:1), couleur stable par nom, toutes différentes tant que la palette suffit, jamais deux voisins identiques.
  - `geometry`, `spin` — angles en degrés (repère SVG), part 0 sous le pointeur au repos.
  - `history`, `timer`, `sessionLog`.
- Anecdotes : `lib/nameFacts/` + route `app/api/name-fact`.

## Conventions

- Couleurs : variables `--rn-*` dans `app/globals.css` (clair + `.dark`). Le participant tiré expose `--win` / `--win-ink` (déclarées avec `@property`, animables).
- Thème clair par défaut quel que soit le système (`enableSystem={false}`) ; le bouton « Thème » passe au sombre DSFR.
- Icônes : `@radix-ui/react-icons` uniquement (`lucide-react` reste pour `components/ui/`).
- **Ne pas modifier `components/ui/`** — restyler via les variables CSS et la config Tailwind.
- Toute animation respecte `prefers-reduced-motion`.
- Polices Marianne dans `app/fonts/` (extraites de `@gouvfr/dsfr@1.12.1`, usage réservé aux services de l'État).
- Ne pas remettre de glob racine (`"*.{js,ts,…}"`) dans `tailwind.config.ts` : il fait surveiller la racine du dépôt et provoque des boucles de Fast Refresh.
