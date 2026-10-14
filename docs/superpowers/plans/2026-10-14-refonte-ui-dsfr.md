# Refonte UI « Roue des noms » (style DSFR + pastel) — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer l'interface monolithique actuelle (`app/page.tsx`, 950 lignes) par une interface au style DSFR, avec des couleurs pastel par participant, une intro animée, un historique local des noms, une finale pour le dernier participant et un récap. Le concept ne change pas : noms dans l'URL, trois modes de tirage, minuteur de 2 min, anecdotes et horoscope.

**Architecture :**
- La logique pure (noms, palette, géométrie, rotation, historique, minuteur) est dans `lib/` et testée avec Vitest.
- L'état React est dans des hooks dédiés (`hooks/`).
- L'interface est découpée en composants `components/roue/*`, chacun avec son module CSS.
- `NameWheelApp` orchestre l'ensemble avec une machine d'états simple : `play | finale-spinning | finale | recap`, plus l'état de l'intro.
- Les animations utilisent uniquement CSS et la Web Animations API.

**Tech Stack :** Next.js 15 (App Router), React 19, TypeScript, Tailwind 3 + modules CSS, shadcn/ui (non modifié), `@radix-ui/react-dialog`, `@radix-ui/react-icons`, `next-themes`, `sonner`, Vitest.

**Spec :** `docs/superpowers/specs/2026-10-14-refonte-ui-dsfr-design.md`

## Global Constraints

- Pas de bibliothèque DSFR installée (`@codegouvfr/react-dsfr`, `@gouvfr/dsfr` interdits en dépendance). Le paquet `@gouvfr/dsfr@1.12.1` sert uniquement à extraire les polices Marianne, avec `npm pack`.
- Pas de bloc-marque « République Française », pas de Marianne (logo), pas de nom de projet. Le titre est exactement « Roue des noms » et le sous-titre exactement « Tirage au sort pour vos rituels d'équipe ».
- Icônes : uniquement `@radix-ui/react-icons` dans le nouveau code. Aucun nouvel import de `lucide-react`, qui reste dans `package.json` parce que `components/ui/` l'utilise.
- Ne jamais modifier `components/ui/*`. Seule exception : le correctif TypeScript de `components/ui/calendar.tsx` (API `Chevron` de react-day-picker v9), déjà commité avant la tâche 1 à la demande de l'utilisateur.
- Thème : clair par défaut, quel que soit le système (`defaultTheme="light"`, `enableSystem={false}`). Le mode sombre est celui du DSFR.
- Contrat d'URL inchangé : `?names=a,b,c&mode=wheel|grid|star`. Les anciens liens (virgules non encodées) doivent continuer de fonctionner.
- Historique `localStorage` sous la clé `roue-des-noms:history:v1`, plafonné à 30 noms. Le journal de session reste en mémoire uniquement.
- Minuteur : 2 minutes (`120_000` ms), démarrage automatique à la révélation du nom.
- Tous les textes d'interface sont en français et au féminin/masculin neutre (« Dernière personne en lice », pas « Dernière en lice »).
- `prefers-reduced-motion: reduce` coupe l'intro, l'aurore animée et les confettis, et ramène la rotation à 300 ms.
- Vérifications à la fin de chaque tâche :
  - `npm test` doit être vert ;
  - `npx tsc --noEmit` ne doit signaler **aucune** erreur ;
  - `npm run build` doit réussir (quand la tâche touche l'interface).
  - Ne pas lancer `npm run lint` : il n'y a pas de configuration ESLint et la commande ouvre un assistant interactif.
- Serveur de dev : `npm run dev -- -p 3001`.

## Review Focus

1. **Noms très longs ou très nombreux sur la roue** (20 noms, « Marie-Bénédicte-Alexandrine ») : les libellés sont tronqués à 16 caractères avec « … » et la taille de police diminue avec le nombre de parts. Testé dans la tâche 1 (`truncateLabel`) et la tâche 3 (`labelFontSize`).
2. **`localStorage` indisponible, plein ou corrompu** (navigation privée, quota, JSON invalide) : l'app fonctionne, la colonne « Déjà utilisés » est masquée et rien ne plante. Testé dans la tâche 4 (`loadHistory` / `persistHistory`).
3. **Anciens liens partagés et paramètres invalides** (`?names=Alice,,alice&mode=bogus`) : doublons et vides ignorés, mode `wheel` par défaut. Testé dans la tâche 1.
4. **Actions répétées pendant un tirage** (Espace maintenu, double clic sur « Retirer et relancer ») : un seul tirage à la fois. Le verrou `drawingRef` est dans la tâche 5, et la vérification manuelle dans la tâche 11, étape « Parcours ».
5. **Navigation précédent / suivant après des modifications** : l'état suit l'URL sans boucle ni entrée d'historique en double au chargement. La logique de comparaison (`sameList`) est testée dans la tâche 1, la vérification manuelle est dans la tâche 11.

---

## Structure des fichiers

```
app/
  fonts/Marianne-{Light,Regular,Medium,Bold}.woff2   (tâche 6)
  globals.css            réécrit (tâche 6)
  icon.svg               nouveau (tâche 6)
  layout.tsx             réécrit (tâche 6)
  page.tsx               réécrit (tâche 11)
components/roue/
  WheelMark.tsx                                       (tâche 6)
  AppHeader.tsx  AppHeader.module.css  ThemeToggle.tsx  ShareButton.tsx   (tâche 7)
  AuraBackground.tsx  AuraBackground.module.css       (tâche 7)
  ModeSwitch.tsx  ModeSwitch.module.css               (tâche 7)
  SpinButton.tsx  SpinButton.module.css               (tâche 7)
  WheelView.tsx  WheelView.module.css                 (tâche 8)
  GridView.tsx  GridView.module.css                   (tâche 8)
  StarView.tsx  StarView.module.css                   (tâche 8)
  ResultPanel.tsx  ResultPanel.module.css             (tâche 9)
  ParticipantsDrawer.tsx  ParticipantsDrawer.module.css   (tâche 10)
  NameWheelApp.tsx  NameWheelApp.module.css           (tâche 11, complété en 12 et 13)
  FinaleView.tsx  FinaleView.module.css               (tâche 12)
  RecapView.tsx  RecapView.module.css                 (tâche 12)
  IntroSplash.tsx  IntroSplash.module.css             (tâche 13)
hooks/
  useNamesUrlState.ts  useNameHistory.ts  useSpeakingTimer.ts  useSessionLog.ts
  useNameFact.ts  usePrefersReducedMotion.ts  useDraw.ts   (tâche 5)
lib/
  names.ts + names.test.ts          (tâche 1)
  palette.ts + palette.test.ts      (tâche 2)
  geometry.ts + geometry.test.ts    (tâche 3)
  spin.ts + spin.test.ts            (tâche 3)
  history.ts + history.test.ts      (tâche 4)
  timer.ts + timer.test.ts          (tâche 5)
  sessionLog.ts + sessionLog.test.ts (tâche 5)
  confetti.ts                       (tâche 8, complété en 12)
vitest.config.ts                    (tâche 1)
```

---

### Task 1 : Outillage de test et logique des noms (`lib/names.ts`)

**Files :**
- Modify : `package.json` (scripts et dépendances)
- Create : `vitest.config.ts`, `lib/names.ts`, `lib/names.test.ts`

**Interfaces :**
- Consumes : rien
- Produces :
  - `type DisplayMode = "wheel" | "grid" | "star"`
  - `nameKey(name: string): string`
  - `cleanName(name: string): string`
  - `splitInput(input: string): string[]`
  - `mergeNames(current: readonly string[], incoming: readonly string[]): { names: string[]; added: string[]; duplicates: string[] }`
  - `removeName(names: readonly string[], name: string): string[]`
  - `sameList(a: readonly string[], b: readonly string[]): boolean`
  - `parseNamesParam(raw: string | null): string[]`
  - `parseMode(raw: string | null): DisplayMode`
  - `buildSearch(names: readonly string[], mode: DisplayMode): string`
  - `truncateLabel(name: string, max?: number): string`

- [ ] **Step 1 : Créer une branche de travail**

```bash
git checkout -b feat/refonte-ui-dsfr
```

- [ ] **Step 2 : Installer les dépendances**

```bash
npm install @radix-ui/react-icons@1.3.2
npm install -D vitest@5.0.4
```

Vérifier que toutes les icônes utilisées dans ce plan existent :

```bash
node -e 'const i=require("@radix-ui/react-icons");const need=["ArrowLeftIcon","ArrowRightIcon","CheckIcon","CounterClockwiseClockIcon","Cross2Icon","GridIcon","InfoCircledIcon","Link2Icon","LockClosedIcon","MoonIcon","PauseIcon","PersonIcon","PlayIcon","PlusIcon","ReloadIcon","StarFilledIcon","StarIcon","SunIcon","TargetIcon","TrackNextIcon","TrashIcon"];const miss=need.filter(n=>!i[n]);console.log(miss.length?"MANQUANTES: "+miss:"OK")'
```

Expected : `OK`

- [ ] **Step 3 : Ajouter les scripts dans `package.json`**

Dans `"scripts"`, ajouter ces trois lignes après `"lint": "next lint"` (penser à la virgule) :

```json
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
```

- [ ] **Step 4 : Créer `vitest.config.ts`**

```ts
import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    include: ["lib/**/*.test.ts"],
    environment: "node",
  },
})
```

- [ ] **Step 5 : Écrire le test qui échoue — `lib/names.test.ts`**

```ts
import { describe, expect, it } from "vitest"
import {
  buildSearch,
  mergeNames,
  nameKey,
  parseMode,
  parseNamesParam,
  removeName,
  sameList,
  splitInput,
  truncateLabel,
} from "./names"

describe("nameKey", () => {
  it("ignore la casse, les accents et les espaces superflus", () => {
    expect(nameKey("  Élodie  ")).toBe("elodie")
    expect(nameKey("Jean   Marc")).toBe("jean marc")
  })
})

describe("splitInput", () => {
  it("découpe sur les virgules et retire les entrées vides", () => {
    expect(splitInput("Alice, Bruno ,, Chloé")).toEqual(["Alice", "Bruno", "Chloé"])
  })
})

describe("mergeNames", () => {
  it("ajoute les nouveaux noms et signale les doublons", () => {
    expect(mergeNames(["Alice"], ["alice", "Bruno", " ", "BRUNO"])).toEqual({
      names: ["Alice", "Bruno"],
      added: ["Bruno"],
      duplicates: ["alice", "BRUNO"],
    })
  })

  it("normalise les espaces du libellé", () => {
    expect(mergeNames([], ["  Jean   Marc "]).names).toEqual(["Jean Marc"])
  })
})

describe("removeName", () => {
  it("retire sans tenir compte de la casse ni des accents", () => {
    expect(removeName(["Élodie", "Bruno"], "elodie")).toEqual(["Bruno"])
  })
})

describe("sameList", () => {
  it("compare l'ordre et le contenu", () => {
    expect(sameList(["a", "b"], ["a", "b"])).toBe(true)
    expect(sameList(["a", "b"], ["b", "a"])).toBe(false)
    expect(sameList(["a"], ["a", "b"])).toBe(false)
  })
})

describe("parseNamesParam", () => {
  it("accepte les anciens liens avec des virgules non encodées", () => {
    expect(parseNamesParam("Alice,Bruno")).toEqual(["Alice", "Bruno"])
  })

  it("ignore les entrées vides et les doublons", () => {
    expect(parseNamesParam("Alice,,alice, Bruno ")).toEqual(["Alice", "Bruno"])
  })

  it("renvoie une liste vide sans paramètre", () => {
    expect(parseNamesParam(null)).toEqual([])
    expect(parseNamesParam("")).toEqual([])
  })
})

describe("parseMode", () => {
  it("reconnaît les modes et retombe sur la roue", () => {
    expect(parseMode("grid")).toBe("grid")
    expect(parseMode("star")).toBe("star")
    expect(parseMode("wheel")).toBe("wheel")
    expect(parseMode("bogus")).toBe("wheel")
    expect(parseMode(null)).toBe("wheel")
  })
})

describe("buildSearch", () => {
  it("fait l'aller-retour avec URLSearchParams", () => {
    const search = buildSearch(["Élodie", "Jean Marc"], "star")
    const params = new URLSearchParams(search)
    expect(parseNamesParam(params.get("names"))).toEqual(["Élodie", "Jean Marc"])
    expect(parseMode(params.get("mode"))).toBe("star")
  })

  it("omet les valeurs par défaut", () => {
    expect(buildSearch([], "wheel")).toBe("")
    expect(buildSearch(["A", "B"], "wheel")).toBe("?names=A%2CB")
  })
})

describe("truncateLabel", () => {
  it("laisse les noms courts intacts", () => {
    expect(truncateLabel("Alice")).toBe("Alice")
  })

  it("tronque au-delà de 16 caractères avec une ellipse", () => {
    expect(truncateLabel("Marie-Bénédicte-Alexandrine")).toBe("Marie-Bénédicte…")
    expect(truncateLabel("Marie-Bénédicte-Alexandrine")).toHaveLength(16)
  })

  it("accepte une longueur maximale personnalisée", () => {
    expect(truncateLabel("Alexandrine", 6)).toBe("Alexa…")
  })
})
```

- [ ] **Step 6 : Lancer le test pour vérifier qu'il échoue**

Run : `npm test`
Expected : FAIL, `Failed to resolve import "./names"`

- [ ] **Step 7 : Implémenter `lib/names.ts`**

```ts
export type DisplayMode = "wheel" | "grid" | "star"

/** Clé de comparaison : sans accents, sans casse, espaces normalisés. */
export function nameKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

/** Libellé affiché : espaces normalisés, casse et accents conservés. */
export function cleanName(name: string): string {
  return name.replace(/\s+/g, " ").trim()
}

export function splitInput(input: string): string[] {
  return input.split(",").map(cleanName).filter(Boolean)
}

export function mergeNames(
  current: readonly string[],
  incoming: readonly string[],
): { names: string[]; added: string[]; duplicates: string[] } {
  const seen = new Set(current.map(nameKey))
  const names = [...current]
  const added: string[] = []
  const duplicates: string[] = []

  for (const raw of incoming) {
    const label = cleanName(raw)
    if (!label) continue
    const key = nameKey(label)
    if (seen.has(key)) {
      duplicates.push(label)
      continue
    }
    seen.add(key)
    names.push(label)
    added.push(label)
  }

  return { names, added, duplicates }
}

export function removeName(names: readonly string[], name: string): string[] {
  const key = nameKey(name)
  return names.filter((n) => nameKey(n) !== key)
}

export function sameList(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((value, i) => value === b[i])
}

export function parseNamesParam(raw: string | null): string[] {
  if (!raw) return []
  return mergeNames([], raw.split(",")).names
}

export function parseMode(raw: string | null): DisplayMode {
  return raw === "grid" || raw === "star" ? raw : "wheel"
}

export function buildSearch(names: readonly string[], mode: DisplayMode): string {
  const params = new URLSearchParams()
  if (names.length > 0) params.set("names", names.join(","))
  if (mode !== "wheel") params.set("mode", mode)
  const search = params.toString()
  return search ? `?${search}` : ""
}

export function truncateLabel(name: string, max = 16): string {
  return name.length > max ? `${name.slice(0, max - 1)}…` : name
}
```

- [ ] **Step 8 : Lancer les tests**

Run : `npm test`
Expected : PASS (tous les tests de `lib/names.test.ts`)

- [ ] **Step 9 : Commit**

```bash
git add package.json package-lock.json vitest.config.ts lib/names.ts lib/names.test.ts
git commit -m "feat: logique des noms testée + outillage Vitest et icônes Radix"
```

---

### Task 2 : Palette pastel et attribution des couleurs (`lib/palette.ts`)

**Files :**
- Create : `lib/palette.ts`, `lib/palette.test.ts`

**Interfaces :**
- Consumes : `nameKey` (tâche 1)
- Produces :
  - `type Swatch = { id: string; bg: string; ink: string }`
  - `PASTELS: readonly Swatch[]` (8 entrées, dans l'ordre de la spec)
  - `hashString(input: string): number`
  - `colorsFor(names: readonly string[]): Swatch[]`
  - `luminance(hex: string): number`
  - `contrastRatio(a: string, b: string): number`

- [ ] **Step 1 : Écrire le test qui échoue — `lib/palette.test.ts`**

```ts
import { describe, expect, it } from "vitest"
import { PASTELS, colorsFor, contrastRatio } from "./palette"

const POOL = [
  "Alice", "Bruno", "Chloé", "David", "Emma", "Farid", "Gaëlle", "Hugo", "Inès", "Jules",
  "Karim", "Léa", "Mona", "Nils", "Océane", "Paul", "Quentin", "Rose", "Sami", "Théo",
]

describe("contrastRatio", () => {
  it("donne 21:1 pour le noir sur blanc", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 1)
  })
})

describe("PASTELS", () => {
  it("contient 8 teintes", () => {
    expect(PASTELS).toHaveLength(8)
  })

  it("garantit un contraste RGAA ≥ 4,5:1 entre le texte et le fond", () => {
    for (const swatch of PASTELS) {
      expect(contrastRatio(swatch.bg, swatch.ink)).toBeGreaterThanOrEqual(4.5)
    }
  })
})

describe("colorsFor", () => {
  it("est déterministe", () => {
    expect(colorsFor(["Alice", "Bruno", "Chloé"])).toEqual(colorsFor(["Alice", "Bruno", "Chloé"]))
  })

  it("donne la même couleur quelle que soit la casse ou les accents", () => {
    expect(colorsFor(["élodie"])[0]).toEqual(colorsFor(["ELODIE"])[0])
  })

  it("ne met jamais deux voisins de la même couleur, y compris entre le dernier et le premier", () => {
    for (let n = 2; n <= POOL.length; n++) {
      const colors = colorsFor(POOL.slice(0, n))
      for (let i = 1; i < n; i++) expect(colors[i].id).not.toBe(colors[i - 1].id)
      if (n >= 3) expect(colors[n - 1].id).not.toBe(colors[0].id)
    }
  })

  it("renvoie une liste vide pour une roue vide", () => {
    expect(colorsFor([])).toEqual([])
  })
})
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

Run : `npm test -- lib/palette.test.ts`
Expected : FAIL, `Failed to resolve import "./palette"`

- [ ] **Step 3 : Implémenter `lib/palette.ts`**

```ts
import { nameKey } from "./names"

export type Swatch = { id: string; bg: string; ink: string }

/** Teintes 925 de la palette illustrative DSFR + texte foncé de la même famille. */
export const PASTELS: readonly Swatch[] = [
  { id: "bleu", bg: "#E3E3FD", ink: "#000091" },
  { id: "menthe", bg: "#C3FAD5", ink: "#1F5C3A" },
  { id: "tuile", bg: "#FEE9E5", ink: "#8D3A2B" },
  { id: "tilleul", bg: "#FEF7DA", ink: "#5E5A2A" },
  { id: "glycine", bg: "#FEE7FC", ink: "#6E445A" },
  { id: "archipel", bg: "#C7F6FC", ink: "#00585E" },
  { id: "cafe-creme", bg: "#F7EBE5", ink: "#6B4532" },
  { id: "cumulus", bg: "#E6EEFE", ink: "#2F3E66" },
]

/** FNV-1a 32 bits. */
export function hashString(input: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/**
 * Couleur dérivée du nom (stable d'une session à l'autre), décalée à la
 * teinte suivante si elle est identique au voisin précédent — ou, pour le
 * dernier nom, au premier (la roue boucle).
 */
export function colorsFor(names: readonly string[]): Swatch[] {
  const count = PASTELS.length
  const indexes: number[] = []

  names.forEach((name, i) => {
    const avoid = new Set<number>()
    if (i > 0) avoid.add(indexes[i - 1])
    if (i === names.length - 1 && names.length > 2) avoid.add(indexes[0])

    let index = hashString(nameKey(name)) % count
    for (let step = 0; step < count && avoid.has(index); step++) index = (index + 1) % count
    indexes.push(index)
  })

  return indexes.map((index) => PASTELS[index])
}

function channel(value: number): number {
  const s = value / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

export function luminance(hex: string): number {
  const raw = hex.replace("#", "")
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(raw.slice(i, i + 2), 16))
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}
```

- [ ] **Step 4 : Lancer les tests**

Run : `npm test`
Expected : PASS

- [ ] **Step 5 : Commit**

```bash
git add lib/palette.ts lib/palette.test.ts
git commit -m "feat: palette pastel DSFR et couleur stable par participant"
```

---

### Task 3 : Géométrie et calcul de rotation (`lib/geometry.ts`, `lib/spin.ts`)

**Files :**
- Create : `lib/geometry.ts`, `lib/geometry.test.ts`, `lib/spin.ts`, `lib/spin.test.ts`

**Interfaces :**
- Consumes : rien
- Produces :
  - `geometry.ts` :
    - `polar(radius: number, deg: number): { x: number; y: number }`
    - `wedgePath(radius: number, startDeg: number, endDeg: number): string`
    - `starPoints(cx: number, cy: number, branches: number, outer: number, inner: number): { x: number; y: number }[]`
    - `labelFontSize(count: number): number`
  - `spin.ts` :
    - `SPIN_DURATION_MS = 4200`, `REDUCED_SPIN_DURATION_MS = 300`, `JUMP_COUNT = 33`
    - `normalizeAngle(deg)`, `segmentAngle(count)`, `segmentCenter(index, count)`
    - `targetRotation(current, index, count, rng?)`, `landedIndex(rotation, count)`
    - `labelNeedsFlip(index, count, rotation)`
    - `jumpSequence(count, finalIndex, jumps?, rng?)`, `jumpDelay(step, total)`

Convention : les angles sont en degrés, en repère SVG (0° = à droite, sens horaire). Le pointeur est en haut (−90°). Au repos (rotation 0), le centre de la part 0 est sous le pointeur.

- [ ] **Step 1 : Écrire les tests qui échouent — `lib/geometry.test.ts`**

```ts
import { describe, expect, it } from "vitest"
import { labelFontSize, polar, starPoints, wedgePath } from "./geometry"

describe("polar", () => {
  it("convertit un angle en coordonnées", () => {
    const p = polar(10, 90)
    expect(p.x).toBeCloseTo(0)
    expect(p.y).toBeCloseTo(10)
  })
})

describe("wedgePath", () => {
  it("trace une part de roue centrée en 0,0", () => {
    expect(wedgePath(17, -112.5, -67.5)).toBe("M0 0L-6.506 -15.706A17 17 0 0 1 6.506 -15.706Z")
  })

  it("utilise le grand arc au-delà de 180°", () => {
    expect(wedgePath(10, 0, 270)).toContain("A10 10 0 1 1")
  })
})

describe("starPoints", () => {
  it("place la première pointe en haut et alterne pointes et creux", () => {
    const points = starPoints(100, 100, 5, 90, 36)
    expect(points).toHaveLength(10)
    expect(points[0].x).toBeCloseTo(100)
    expect(points[0].y).toBeCloseTo(10)
    expect(Math.hypot(points[1].x - 100, points[1].y - 100)).toBeCloseTo(36)
  })
})

describe("labelFontSize", () => {
  it("réduit la police quand la roue se remplit", () => {
    expect(labelFontSize(2)).toBe(18)
    expect(labelFontSize(8)).toBe(18)
    expect(labelFontSize(12)).toBe(15)
    expect(labelFontSize(20)).toBe(13)
  })
})
```

- [ ] **Step 2 : Écrire les tests qui échouent — `lib/spin.test.ts`**

```ts
import { describe, expect, it } from "vitest"
import {
  jumpDelay,
  jumpSequence,
  labelNeedsFlip,
  landedIndex,
  normalizeAngle,
  segmentCenter,
  targetRotation,
} from "./spin"

function seeded(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

describe("normalizeAngle", () => {
  it("ramène dans [0, 360)", () => {
    expect(normalizeAngle(-30)).toBe(330)
    expect(normalizeAngle(725)).toBe(5)
    expect(normalizeAngle(360)).toBe(0)
  })
})

describe("segmentCenter", () => {
  it("place la part 0 sous le pointeur", () => {
    expect(segmentCenter(0, 6)).toBe(-90)
    expect(segmentCenter(1, 4)).toBe(0)
  })
})

describe("landedIndex", () => {
  it("désigne la part 0 au repos", () => {
    expect(landedIndex(0, 6)).toBe(0)
  })

  it("désigne la part 1 après un recul d'une part", () => {
    expect(landedIndex(-60, 6)).toBe(1)
  })
})

describe("targetRotation", () => {
  it("amène toujours la part visée sous le pointeur", () => {
    const rng = seeded(42)
    for (let count = 2; count <= 24; count++) {
      for (let index = 0; index < count; index++) {
        const current = rng() * 720
        expect(landedIndex(targetRotation(current, index, count, rng), count)).toBe(index)
      }
    }
  })

  it("fait entre 5 et 8 tours complets", () => {
    const rng = seeded(7)
    for (let k = 0; k < 200; k++) {
      const current = rng() * 360
      const delta = targetRotation(current, 3, 8, rng) - current
      expect(delta).toBeGreaterThanOrEqual(5 * 360)
      expect(delta).toBeLessThan(8 * 360)
    }
  })
})

describe("labelNeedsFlip", () => {
  it("retourne les libellés de la moitié gauche", () => {
    expect(labelNeedsFlip(0, 4, 0)).toBe(false)
    expect(labelNeedsFlip(1, 4, 0)).toBe(false)
    expect(labelNeedsFlip(2, 4, 0)).toBe(false)
    expect(labelNeedsFlip(3, 4, 0)).toBe(true)
    expect(labelNeedsFlip(1, 4, 180)).toBe(true)
  })
})

describe("jumpSequence", () => {
  it("se termine sur l'index final", () => {
    const sequence = jumpSequence(6, 4, 33, seeded(1))
    expect(sequence).toHaveLength(33)
    expect(sequence[sequence.length - 1]).toBe(4)
  })

  it("ne montre jamais deux fois de suite la même case (≥ 3 noms)", () => {
    const rng = seeded(3)
    for (let count = 3; count <= 12; count++) {
      const sequence = jumpSequence(count, count - 1, 33, rng)
      for (let i = 1; i < sequence.length; i++) expect(sequence[i]).not.toBe(sequence[i - 1])
    }
  })

  it("se réduit à l'index final pour un seul saut", () => {
    expect(jumpSequence(5, 2, 1)).toEqual([2])
  })
})

describe("jumpDelay", () => {
  it("ralentit progressivement de 70 à 260 ms", () => {
    expect(jumpDelay(0, 33)).toBe(70)
    expect(jumpDelay(32, 33)).toBe(260)
    expect(jumpDelay(10, 33)).toBeLessThan(jumpDelay(20, 33))
  })
})
```

- [ ] **Step 3 : Lancer les tests pour vérifier qu'ils échouent**

Run : `npm test`
Expected : FAIL, `Failed to resolve import "./geometry"` et `"./spin"`

- [ ] **Step 4 : Implémenter `lib/geometry.ts`**

```ts
export type Point = { x: number; y: number }

const round = (n: number) => Number(n.toFixed(3))

export function polar(radius: number, deg: number): Point {
  const rad = (deg * Math.PI) / 180
  return { x: radius * Math.cos(rad), y: radius * Math.sin(rad) }
}

/** Part de disque centrée en (0, 0), angles en degrés (repère SVG). */
export function wedgePath(radius: number, startDeg: number, endDeg: number): string {
  const a = polar(radius, startDeg)
  const b = polar(radius, endDeg)
  const large = endDeg - startDeg > 180 ? 1 : 0
  return `M0 0L${round(a.x)} ${round(a.y)}A${radius} ${radius} 0 ${large} 1 ${round(b.x)} ${round(b.y)}Z`
}

/** Pointes (rayon `outer`) et creux (rayon `inner`) alternés, première pointe en haut. */
export function starPoints(cx: number, cy: number, branches: number, outer: number, inner: number): Point[] {
  const points: Point[] = []
  const step = (Math.PI * 2) / branches
  for (let i = 0; i < branches; i++) {
    const tip = i * step - Math.PI / 2
    points.push({ x: cx + Math.cos(tip) * outer, y: cy + Math.sin(tip) * outer })
    const hollow = tip + step / 2
    points.push({ x: cx + Math.cos(hollow) * inner, y: cy + Math.sin(hollow) * inner })
  }
  return points
}

export function labelFontSize(count: number): number {
  if (count > 12) return 13
  if (count > 8) return 15
  return 18
}
```

- [ ] **Step 5 : Implémenter `lib/spin.ts`**

```ts
export const SPIN_DURATION_MS = 4200
export const REDUCED_SPIN_DURATION_MS = 300
export const JUMP_COUNT = 33

export function normalizeAngle(deg: number): number {
  const angle = ((deg % 360) + 360) % 360
  return angle === 0 ? 0 : angle
}

export function segmentAngle(count: number): number {
  return 360 / count
}

/** Centre de la part `index` au repos ; la part 0 est sous le pointeur (−90°). */
export function segmentCenter(index: number, count: number): number {
  return -90 + index * segmentAngle(count)
}

/** Rotation absolue qui amène `index` sous le pointeur après 5 à 7 tours, avec un léger décalage. */
export function targetRotation(current: number, index: number, count: number, rng: () => number = Math.random): number {
  const seg = segmentAngle(count)
  const jitter = (rng() - 0.5) * 0.6 * seg
  const turns = 5 + Math.floor(rng() * 3)
  const delta = normalizeAngle(-index * seg + jitter - current)
  return current + turns * 360 + delta
}

export function landedIndex(rotation: number, count: number): number {
  return Math.round(normalizeAngle(-rotation) / segmentAngle(count)) % count
}

/** Un libellé radial sur la moitié gauche se lirait à l'envers : on le retourne. */
export function labelNeedsFlip(index: number, count: number, rotation: number): boolean {
  const angle = normalizeAngle(segmentCenter(index, count) + rotation)
  return angle > 90 && angle < 270
}

/** Suite de cases surlignées pour la grille et l'étoile, terminée par `finalIndex`. */
export function jumpSequence(count: number, finalIndex: number, jumps = JUMP_COUNT, rng: () => number = Math.random): number[] {
  if (count < 1) return []
  const sequence: number[] = []
  for (let step = 0; step < jumps - 1; step++) {
    const avoid = new Set<number>()
    if (sequence.length > 0) avoid.add(sequence[sequence.length - 1])
    if (step === jumps - 2) avoid.add(finalIndex)
    let next = Math.floor(rng() * count)
    for (let k = 0; k < count && avoid.has(next); k++) next = (next + 1) % count
    sequence.push(next)
  }
  sequence.push(finalIndex)
  return sequence
}

/** Délai avant le saut `step` : de 70 ms à 260 ms, en ralentissant. */
export function jumpDelay(step: number, total: number): number {
  if (total <= 1) return 0
  const t = step / (total - 1)
  return Math.round(70 + 190 * t * t)
}
```

- [ ] **Step 6 : Lancer les tests**

Run : `npm test`
Expected : PASS

- [ ] **Step 7 : Commit**

```bash
git add lib/geometry.ts lib/geometry.test.ts lib/spin.ts lib/spin.test.ts
git commit -m "feat: géométrie de la roue et calcul de rotation testés"
```

---

### Task 4 : Historique des noms (`lib/history.ts`)

**Files :**
- Create : `lib/history.ts`, `lib/history.test.ts`

**Interfaces :**
- Consumes : `cleanName`, `nameKey` (tâche 1)
- Produces :
  - types `HistoryEntry = { label: string; count: number; lastUsed: number }`, `LastList = { names: string[]; savedAt: number }`, `HistoryState = { names: Record<string, HistoryEntry>; lastList?: LastList }`
  - constantes `HISTORY_KEY`, `HISTORY_LIMIT`
  - `emptyHistory(): HistoryState`
  - `recordAdded(state, labels, now): HistoryState`
  - `forget(state, label): HistoryState`
  - `saveLastList(state, names, now): HistoryState`
  - `suggestions(state, exclude): HistoryEntry[]`
  - `loadHistory(storage: Pick<Storage, "getItem"> | null): HistoryState`
  - `persistHistory(storage: Pick<Storage, "setItem"> | null, state): boolean`
  - `formatSavedAt(savedAt: number, now: number): string`

- [ ] **Step 1 : Écrire le test qui échoue — `lib/history.test.ts`**

```ts
import { describe, expect, it } from "vitest"
import {
  HISTORY_LIMIT,
  emptyHistory,
  forget,
  formatSavedAt,
  loadHistory,
  persistHistory,
  recordAdded,
  saveLastList,
  suggestions,
} from "./history"
import { nameKey } from "./names"

const T0 = new Date(2026, 9, 14, 9, 32).getTime()

describe("recordAdded", () => {
  it("compte les ajouts sans tenir compte de la casse et garde la dernière graphie", () => {
    let state = recordAdded(emptyHistory(), ["Alice"], T0)
    state = recordAdded(state, ["alice"], T0 + 1000)
    expect(Object.values(state.names)).toEqual([{ label: "alice", count: 2, lastUsed: T0 + 1000 }])
  })

  it("ignore les libellés vides", () => {
    expect(recordAdded(emptyHistory(), ["  "], T0)).toEqual(emptyHistory())
  })

  it(`plafonne à ${HISTORY_LIMIT} noms sans évincer ceux qu'on vient d'ajouter`, () => {
    let state = emptyHistory()
    for (let i = 0; i < HISTORY_LIMIT; i++) {
      state = recordAdded(state, [`Nom ${i}`], T0 + i)
      state = recordAdded(state, [`Nom ${i}`], T0 + i)
    }
    state = recordAdded(state, ["Nouveau"], T0 + 100)
    expect(Object.keys(state.names)).toHaveLength(HISTORY_LIMIT)
    expect(state.names[nameKey("Nouveau")]).toBeDefined()
    expect(state.names[nameKey("Nom 0")]).toBeUndefined()
  })
})

describe("forget", () => {
  it("supprime un nom de l'historique", () => {
    const state = forget(recordAdded(emptyHistory(), ["Alice", "Bruno"], T0), "ALICE")
    expect(Object.values(state.names).map((e) => e.label)).toEqual(["Bruno"])
  })
})

describe("suggestions", () => {
  it("exclut les noms déjà dans la roue et trie par usage puis par récence", () => {
    let state = recordAdded(emptyHistory(), ["Alice", "Bruno", "Chloé"], T0)
    state = recordAdded(state, ["Bruno"], T0 + 10)
    state = recordAdded(state, ["Chloé"], T0 + 20)
    expect(suggestions(state, ["alice"]).map((e) => e.label)).toEqual(["Chloé", "Bruno"])
  })
})

describe("saveLastList", () => {
  it("ignore les listes de moins de 2 noms", () => {
    expect(saveLastList(emptyHistory(), ["Alice"], T0).lastList).toBeUndefined()
  })

  it("enregistre une nouvelle liste", () => {
    expect(saveLastList(emptyHistory(), ["A", "B"], T0).lastList).toEqual({ names: ["A", "B"], savedAt: T0 })
  })

  it("ignore une liste qui n'est qu'un sous-ensemble de la dernière (les retraits du tour de table)", () => {
    let state = saveLastList(emptyHistory(), ["A", "B", "C"], T0)
    state = saveLastList(state, ["A", "C"], T0 + 5)
    expect(state.lastList).toEqual({ names: ["A", "B", "C"], savedAt: T0 })
  })

  it("remplace la liste dès qu'un nouveau nom apparaît", () => {
    let state = saveLastList(emptyHistory(), ["A", "B"], T0)
    state = saveLastList(state, ["A", "D"], T0 + 5)
    expect(state.lastList).toEqual({ names: ["A", "D"], savedAt: T0 + 5 })
  })
})

describe("loadHistory / persistHistory", () => {
  it("fait l'aller-retour", () => {
    const state = saveLastList(recordAdded(emptyHistory(), ["Alice", "Bruno"], T0), ["Alice", "Bruno"], T0)
    let stored = ""
    expect(persistHistory({ setItem: (_k, v) => { stored = v } }, state)).toBe(true)
    expect(loadHistory({ getItem: () => stored })).toEqual(state)
  })

  it("revient à un historique vide si le JSON est corrompu", () => {
    expect(loadHistory({ getItem: () => "{oops" })).toEqual(emptyHistory())
  })

  it("ignore les entrées mal formées", () => {
    const raw = JSON.stringify({
      names: { a: { label: "A", count: 1, lastUsed: 1 }, b: { label: 3 } },
      lastList: { names: "x" },
    })
    expect(loadHistory({ getItem: () => raw })).toEqual({ names: { a: { label: "A", count: 1, lastUsed: 1 } } })
  })

  it("supporte l'absence de stockage ou une lecture qui échoue", () => {
    expect(loadHistory(null)).toEqual(emptyHistory())
    expect(loadHistory({ getItem: () => { throw new Error("SecurityError") } })).toEqual(emptyHistory())
  })

  it("renvoie false si l'écriture échoue (quota, navigation privée)", () => {
    expect(persistHistory({ setItem: () => { throw new Error("QuotaExceededError") } }, emptyHistory())).toBe(false)
    expect(persistHistory(null, emptyHistory())).toBe(false)
  })
})

describe("formatSavedAt", () => {
  const now = new Date(2026, 9, 14, 18, 0).getTime()

  it("formate aujourd'hui, hier, les derniers jours puis la date", () => {
    expect(formatSavedAt(new Date(2026, 9, 14, 9, 5).getTime(), now)).toBe("aujourd'hui, 9 h 05")
    expect(formatSavedAt(new Date(2026, 9, 13, 9, 32).getTime(), now)).toBe("hier, 9 h 32")
    expect(formatSavedAt(new Date(2026, 9, 11, 9, 32).getTime(), now)).toBe("il y a 3 jours")
    expect(formatSavedAt(new Date(2026, 9, 2, 9, 32).getTime(), now)).toBe("le 2 octobre")
  })
})
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

Run : `npm test -- lib/history.test.ts`
Expected : FAIL, `Failed to resolve import "./history"`

- [ ] **Step 3 : Implémenter `lib/history.ts`**

```ts
import { cleanName, nameKey } from "./names"

export type HistoryEntry = { label: string; count: number; lastUsed: number }
export type LastList = { names: string[]; savedAt: number }
export type HistoryState = { names: Record<string, HistoryEntry>; lastList?: LastList }

export const HISTORY_KEY = "roue-des-noms:history:v1"
export const HISTORY_LIMIT = 30

export function emptyHistory(): HistoryState {
  return { names: {} }
}

function byUsage(a: HistoryEntry, b: HistoryEntry): number {
  return b.count - a.count || b.lastUsed - a.lastUsed
}

function evict(names: Record<string, HistoryEntry>, protectedKeys: Set<string>): Record<string, HistoryEntry> {
  const keys = Object.keys(names)
  if (keys.length <= HISTORY_LIMIT) return names
  const candidates = keys.filter((k) => !protectedKeys.has(k)).sort((a, b) => byUsage(names[a], names[b]))
  const dropCount = keys.length - HISTORY_LIMIT
  const dropped = new Set(candidates.slice(candidates.length - dropCount))
  return Object.fromEntries(keys.filter((k) => !dropped.has(k)).map((k) => [k, names[k]]))
}

export function recordAdded(state: HistoryState, labels: readonly string[], now: number): HistoryState {
  const names = { ...state.names }
  const touched = new Set<string>()
  for (const raw of labels) {
    const label = cleanName(raw)
    if (!label) continue
    const key = nameKey(label)
    names[key] = { label, count: (names[key]?.count ?? 0) + 1, lastUsed: now }
    touched.add(key)
  }
  if (touched.size === 0) return state
  return { ...state, names: evict(names, touched) }
}

export function forget(state: HistoryState, label: string): HistoryState {
  const key = nameKey(label)
  if (!(key in state.names)) return state
  const names = { ...state.names }
  delete names[key]
  return { ...state, names }
}

/**
 * Mémorise la liste en cours pour « Reprendre la dernière liste ».
 * Une liste qui n'est qu'un sous-ensemble de la précédente (on retire les
 * personnes au fil du tour de table) ne la remplace pas.
 */
export function saveLastList(state: HistoryState, names: readonly string[], now: number): HistoryState {
  if (names.length < 2) return state
  const previous = new Set((state.lastList?.names ?? []).map(nameKey))
  if (state.lastList && names.every((n) => previous.has(nameKey(n)))) return state
  return { ...state, lastList: { names: [...names], savedAt: now } }
}

export function suggestions(state: HistoryState, exclude: readonly string[]): HistoryEntry[] {
  const excluded = new Set(exclude.map(nameKey))
  return Object.entries(state.names)
    .filter(([key]) => !excluded.has(key))
    .map(([, entry]) => entry)
    .sort(byUsage)
}

function isEntry(value: unknown): value is HistoryEntry {
  if (!value || typeof value !== "object") return false
  const v = value as Record<string, unknown>
  return typeof v.label === "string" && typeof v.count === "number" && typeof v.lastUsed === "number"
}

function isLastList(value: unknown): value is LastList {
  if (!value || typeof value !== "object") return false
  const v = value as Record<string, unknown>
  return Array.isArray(v.names) && v.names.every((n) => typeof n === "string") && typeof v.savedAt === "number"
}

export function loadHistory(storage: Pick<Storage, "getItem"> | null): HistoryState {
  if (!storage) return emptyHistory()
  try {
    const raw = storage.getItem(HISTORY_KEY)
    if (!raw) return emptyHistory()
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object") return emptyHistory()
    const data = parsed as Record<string, unknown>
    const names: Record<string, HistoryEntry> = {}
    if (data.names && typeof data.names === "object") {
      for (const [key, entry] of Object.entries(data.names as Record<string, unknown>)) {
        if (isEntry(entry)) names[key] = { label: entry.label, count: entry.count, lastUsed: entry.lastUsed }
      }
    }
    const state: HistoryState = { names }
    if (isLastList(data.lastList)) state.lastList = { names: [...data.lastList.names], savedAt: data.lastList.savedAt }
    return state
  } catch {
    return emptyHistory()
  }
}

export function persistHistory(storage: Pick<Storage, "setItem"> | null, state: HistoryState): boolean {
  if (!storage) return false
  try {
    storage.setItem(HISTORY_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

export function formatSavedAt(savedAt: number, now: number): string {
  const date = new Date(savedAt)
  const time = `${date.getHours()} h ${String(date.getMinutes()).padStart(2, "0")}`
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const days = Math.round((startOfDay(new Date(now)) - startOfDay(date)) / 86_400_000)
  if (days <= 0) return `aujourd'hui, ${time}`
  if (days === 1) return `hier, ${time}`
  if (days < 7) return `il y a ${days} jours`
  return `le ${date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`
}
```

- [ ] **Step 4 : Lancer les tests**

Run : `npm test`
Expected : PASS

- [ ] **Step 5 : Commit**

```bash
git add lib/history.ts lib/history.test.ts
git commit -m "feat: historique local des noms (plafond, dernière liste, stockage robuste)"
```

---

### Task 5 : Minuteur, journal de session et hooks

**Files :**
- Create : `lib/timer.ts`, `lib/timer.test.ts`, `lib/sessionLog.ts`, `lib/sessionLog.test.ts`
- Create : `hooks/useSpeakingTimer.ts`, `hooks/useSessionLog.ts`, `hooks/useNameFact.ts`, `hooks/usePrefersReducedMotion.ts`, `hooks/useNamesUrlState.ts`, `hooks/useNameHistory.ts`, `hooks/useDraw.ts`

**Interfaces :**
- Consumes : tâches 1, 3, 4
- Produces :
  - `lib/timer.ts` : `SPEAKING_LIMIT_MS`, `formatDuration(ms)`, `formatCountdown(elapsedMs, limitMs?)`, `type TimerTone = "ok" | "warn" | "danger"`, `timerTone(elapsedMs)`, `timerProgress(elapsedMs, limitMs?)`
  - `lib/sessionLog.ts` : `type PassEntry = { name: string; durationMs: number }`, `sessionStats(entries): { count: number; totalMs: number; averageMs: number }`
  - `useSpeakingTimer(): SpeakingTimer`, avec `SpeakingTimer = { elapsedMs; running; start(); pause(); resume(); reset(); read(): number }`
  - `useSessionLog(): { entries: PassEntry[]; record(name, durationMs): void; clear(): void }`
  - `useNameFact(name: string | null): NameFactState`, avec `NameFactState = { fact: string | null; total: number; loading: boolean }`
  - `usePrefersReducedMotion(): boolean`
  - `useNamesUrlState(): { names; mode; setNames(next: string[]): void; setMode(mode): void }`
  - `useNameHistory(currentNames: string[]): NameHistory`, avec `NameHistory = { available; size; suggestions: HistoryEntry[]; lastList: LastList | null; recordAdded(labels): void; forget(label): void; clear(): void }`
  - `useDraw(options): DrawController`, avec `DrawController = { rotation; animateRotation; durationMs; highlightIndex: number | null; drawing; start(names: string[]): void; reset(): void }`

- [ ] **Step 1 : Écrire les tests qui échouent — `lib/timer.test.ts` et `lib/sessionLog.test.ts`**

```ts
// lib/timer.test.ts
import { describe, expect, it } from "vitest"
import { formatCountdown, formatDuration, timerProgress, timerTone } from "./timer"

describe("formatDuration", () => {
  it("affiche m:ss", () => {
    expect(formatDuration(0)).toBe("0:00")
    expect(formatDuration(65_000)).toBe("1:05")
    expect(formatDuration(-5)).toBe("0:00")
  })
})

describe("formatCountdown", () => {
  it("affiche le temps restant puis le dépassement", () => {
    expect(formatCountdown(0)).toBe("2:00")
    expect(formatCountdown(500)).toBe("2:00")
    expect(formatCountdown(1_000)).toBe("1:59")
    expect(formatCountdown(120_000)).toBe("0:00")
    expect(formatCountdown(132_000)).toBe("+0:12")
  })
})

describe("timerTone", () => {
  it("passe d'ok à avertissement à 60 s puis à danger à 90 s", () => {
    expect(timerTone(59_999)).toBe("ok")
    expect(timerTone(60_000)).toBe("warn")
    expect(timerTone(90_000)).toBe("danger")
  })
})

describe("timerProgress", () => {
  it("renvoie la fraction restante, bornée à 0", () => {
    expect(timerProgress(0)).toBe(1)
    expect(timerProgress(60_000)).toBe(0.5)
    expect(timerProgress(200_000)).toBe(0)
  })
})
```

```ts
// lib/sessionLog.test.ts
import { describe, expect, it } from "vitest"
import { sessionStats } from "./sessionLog"

describe("sessionStats", () => {
  it("calcule le nombre, le total et la moyenne", () => {
    expect(sessionStats([{ name: "A", durationMs: 60_000 }, { name: "B", durationMs: 120_000 }])).toEqual({
      count: 2,
      totalMs: 180_000,
      averageMs: 90_000,
    })
  })

  it("gère un journal vide", () => {
    expect(sessionStats([])).toEqual({ count: 0, totalMs: 0, averageMs: 0 })
  })
})
```

- [ ] **Step 2 : Lancer les tests pour vérifier qu'ils échouent**

Run : `npm test`
Expected : FAIL, `Failed to resolve import "./timer"` et `"./sessionLog"`

- [ ] **Step 3 : Implémenter `lib/timer.ts` et `lib/sessionLog.ts`**

```ts
// lib/timer.ts
export const SPEAKING_LIMIT_MS = 120_000

export type TimerTone = "ok" | "warn" | "danger"

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`
}

export function formatCountdown(elapsedMs: number, limitMs = SPEAKING_LIMIT_MS): string {
  if (elapsedMs <= limitMs) return formatDuration(Math.ceil((limitMs - elapsedMs) / 1000) * 1000)
  return `+${formatDuration(elapsedMs - limitMs)}`
}

export function timerTone(elapsedMs: number): TimerTone {
  if (elapsedMs < 60_000) return "ok"
  if (elapsedMs < 90_000) return "warn"
  return "danger"
}

export function timerProgress(elapsedMs: number, limitMs = SPEAKING_LIMIT_MS): number {
  return Math.max(0, 1 - elapsedMs / limitMs)
}
```

```ts
// lib/sessionLog.ts
export type PassEntry = { name: string; durationMs: number }

export function sessionStats(entries: readonly PassEntry[]): { count: number; totalMs: number; averageMs: number } {
  const totalMs = entries.reduce((sum, e) => sum + e.durationMs, 0)
  return { count: entries.length, totalMs, averageMs: entries.length ? Math.round(totalMs / entries.length) : 0 }
}
```

- [ ] **Step 4 : Lancer les tests**

Run : `npm test`
Expected : PASS

- [ ] **Step 5 : Créer les hooks simples**

```ts
// hooks/useSpeakingTimer.ts
"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export type SpeakingTimer = {
  elapsedMs: number
  running: boolean
  start: () => void
  pause: () => void
  resume: () => void
  reset: () => void
  /** Temps écoulé exact, sans attendre le prochain rafraîchissement. */
  read: () => number
}

export function useSpeakingTimer(): SpeakingTimer {
  const [elapsedMs, setElapsedMs] = useState(0)
  const [running, setRunning] = useState(false)
  const startedAt = useRef<number | null>(null)
  const accumulated = useRef(0)

  const read = useCallback(
    () => accumulated.current + (startedAt.current === null ? 0 : performance.now() - startedAt.current),
    [],
  )

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => setElapsedMs(read()), 250)
    return () => window.clearInterval(id)
  }, [running, read])

  const start = useCallback(() => {
    accumulated.current = 0
    startedAt.current = performance.now()
    setElapsedMs(0)
    setRunning(true)
  }, [])

  const pause = useCallback(() => {
    if (startedAt.current === null) return
    accumulated.current = read()
    startedAt.current = null
    setElapsedMs(accumulated.current)
    setRunning(false)
  }, [read])

  const resume = useCallback(() => {
    if (startedAt.current !== null) return
    startedAt.current = performance.now()
    setRunning(true)
  }, [])

  const reset = useCallback(() => {
    accumulated.current = 0
    startedAt.current = null
    setElapsedMs(0)
    setRunning(false)
  }, [])

  return { elapsedMs, running, start, pause, resume, reset, read }
}
```

```ts
// hooks/useSessionLog.ts
"use client"

import { useCallback, useState } from "react"
import type { PassEntry } from "@/lib/sessionLog"

export function useSessionLog() {
  const [entries, setEntries] = useState<PassEntry[]>([])
  const record = useCallback((name: string, durationMs: number) => {
    setEntries((previous) => [...previous, { name, durationMs }])
  }, [])
  const clear = useCallback(() => setEntries([]), [])
  return { entries, record, clear }
}
```

```ts
// hooks/useNameFact.ts
"use client"

import { useEffect, useState } from "react"

export type NameFactState = { fact: string | null; total: number; loading: boolean }

const IDLE: NameFactState = { fact: null, total: 0, loading: false }

export function useNameFact(name: string | null): NameFactState {
  const [state, setState] = useState<NameFactState>(IDLE)

  useEffect(() => {
    if (!name) {
      setState(IDLE)
      return
    }
    const controller = new AbortController()
    setState({ fact: null, total: 0, loading: true })
    fetch(`/api/name-fact?name=${encodeURIComponent(name)}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { fact?: string; totalFacts?: number } | null) => {
        setState({ fact: data?.fact || null, total: data?.totalFacts ?? 0, loading: false })
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        setState(IDLE)
      })
    return () => controller.abort()
  }, [name])

  return state
}
```

```ts
// hooks/usePrefersReducedMotion.ts
"use client"

import { useSyncExternalStore } from "react"

const QUERY = "(prefers-reduced-motion: reduce)"

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY)
  media.addEventListener("change", onChange)
  return () => media.removeEventListener("change", onChange)
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  )
}
```

- [ ] **Step 6 : Créer `hooks/useNamesUrlState.ts`**

Cette version reprend le comportement actuel : `pushState`, et l'URL fait foi. Elle remplace le drapeau `isUpdatingFromUrl` par une comparaison des valeurs.

```ts
"use client"

import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { buildSearch, parseMode, parseNamesParam, sameList, type DisplayMode } from "@/lib/names"

export function useNamesUrlState() {
  const searchParams = useSearchParams()
  const [names, setNamesState] = useState<string[]>(() => parseNamesParam(searchParams.get("names")))
  const [mode, setModeState] = useState<DisplayMode>(() => parseMode(searchParams.get("mode")))

  // URL → état (précédent/suivant, lien collé)
  useEffect(() => {
    const urlNames = parseNamesParam(searchParams.get("names"))
    setNamesState((previous) => (sameList(previous, urlNames) ? previous : urlNames))
    setModeState(parseMode(searchParams.get("mode")))
  }, [searchParams])

  // État → URL, seulement si l'URL décrit autre chose (évite les boucles et
  // l'entrée d'historique en double au chargement d'un ancien lien)
  useEffect(() => {
    const current = new URLSearchParams(window.location.search)
    if (sameList(parseNamesParam(current.get("names")), names) && parseMode(current.get("mode")) === mode) return
    window.history.pushState(null, "", `${window.location.pathname}${buildSearch(names, mode)}`)
  }, [names, mode])

  const setNames = useCallback((next: string[]) => setNamesState(next), [])
  const setMode = useCallback((next: DisplayMode) => setModeState(next), [])

  return { names, mode, setNames, setMode }
}
```

- [ ] **Step 7 : Créer `hooks/useNameHistory.ts`**

```ts
"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  emptyHistory,
  forget as forgetEntry,
  loadHistory,
  persistHistory,
  recordAdded as recordEntries,
  saveLastList,
  suggestions as suggestionsFor,
  type HistoryEntry,
  type HistoryState,
  type LastList,
} from "@/lib/history"

export type NameHistory = {
  available: boolean
  size: number
  suggestions: HistoryEntry[]
  lastList: LastList | null
  recordAdded: (labels: string[]) => void
  forget: (label: string) => void
  clear: () => void
}

function getStorage(): Storage | null {
  try {
    const storage = window.localStorage
    const probe = "roue-des-noms:probe"
    storage.setItem(probe, "1")
    storage.removeItem(probe)
    return storage
  } catch {
    return null
  }
}

export function useNameHistory(currentNames: string[]): NameHistory {
  const [storage, setStorage] = useState<Storage | null>(null)
  const [state, setState] = useState<HistoryState>(emptyHistory)

  useEffect(() => {
    const found = getStorage()
    setStorage(found)
    setState(loadHistory(found))
  }, [])

  const update = useCallback(
    (change: (previous: HistoryState) => HistoryState) => {
      setState((previous) => {
        const next = change(previous)
        if (next !== previous) persistHistory(storage, next)
        return next
      })
    },
    [storage],
  )

  useEffect(() => {
    if (!storage || currentNames.length < 2) return
    const id = window.setTimeout(() => update((s) => saveLastList(s, currentNames, Date.now())), 2000)
    return () => window.clearTimeout(id)
  }, [storage, currentNames, update])

  const suggestions = useMemo(() => suggestionsFor(state, currentNames), [state, currentNames])
  const recordAdded = useCallback((labels: string[]) => update((s) => recordEntries(s, labels, Date.now())), [update])
  const forget = useCallback((label: string) => update((s) => forgetEntry(s, label)), [update])
  const clear = useCallback(() => update(() => emptyHistory()), [update])

  return {
    available: storage !== null,
    size: Object.keys(state.names).length,
    suggestions,
    lastList: state.lastList ?? null,
    recordAdded,
    forget,
    clear,
  }
}
```

- [ ] **Step 8 : Créer `hooks/useDraw.ts`**

Ce hook gère le tirage dans les trois modes : rotation de la roue, ou suite de cases surlignées pour la grille et l'étoile. Le verrou `drawingRef` empêche deux tirages simultanés (Review Focus n° 4).

```ts
"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { DisplayMode } from "@/lib/names"
import {
  JUMP_COUNT,
  REDUCED_SPIN_DURATION_MS,
  SPIN_DURATION_MS,
  jumpDelay,
  jumpSequence,
  normalizeAngle,
  targetRotation,
} from "@/lib/spin"

export type DrawController = {
  rotation: number
  animateRotation: boolean
  durationMs: number
  highlightIndex: number | null
  drawing: boolean
  start: (names: string[]) => void
  reset: () => void
}

type Options = {
  mode: DisplayMode
  reducedMotion: boolean
  onLanded: (index: number, names: string[]) => void
}

export function useDraw({ mode, reducedMotion, onLanded }: Options): DrawController {
  const [rotation, setRotation] = useState(0)
  const [animateRotation, setAnimateRotation] = useState(true)
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null)
  const [drawing, setDrawing] = useState(false)
  const rotationRef = useRef(0)
  const drawingRef = useRef(false)
  const timers = useRef<number[]>([])
  const onLandedRef = useRef(onLanded)

  useEffect(() => {
    onLandedRef.current = onLanded
  }, [onLanded])

  const durationMs = reducedMotion ? REDUCED_SPIN_DURATION_MS : SPIN_DURATION_MS

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }, [])

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current = []
  }, [])

  useEffect(() => clearTimers, [clearTimers])

  const land = useCallback(
    (index: number, names: string[], wheel: boolean) => {
      drawingRef.current = false
      setDrawing(false)
      setHighlightIndex(null)
      if (wheel) {
        // On ramène l'angle dans [0, 360) sans transition pour ne pas accumuler les tours
        const normalized = normalizeAngle(rotationRef.current)
        rotationRef.current = normalized
        setAnimateRotation(false)
        setRotation(normalized)
        later(() => setAnimateRotation(true), 50)
      }
      onLandedRef.current(index, names)
    },
    [later],
  )

  const start = useCallback(
    (names: string[]) => {
      if (names.length < 2 || drawingRef.current) return
      drawingRef.current = true
      setDrawing(true)
      setHighlightIndex(null)
      const finalIndex = Math.floor(Math.random() * names.length)

      if (mode === "wheel") {
        const target = targetRotation(rotationRef.current, finalIndex, names.length)
        rotationRef.current = target
        setAnimateRotation(true)
        setRotation(target)
        later(() => land(finalIndex, names, true), durationMs + 50)
        return
      }

      const sequence = jumpSequence(names.length, finalIndex, reducedMotion ? 1 : JUMP_COUNT)
      let elapsed = 0
      sequence.forEach((index, step) => {
        elapsed += reducedMotion ? 0 : jumpDelay(step, sequence.length)
        later(() => setHighlightIndex(index), elapsed)
      })
      later(() => land(finalIndex, names, false), elapsed + 200)
    },
    [mode, reducedMotion, durationMs, later, land],
  )

  const reset = useCallback(() => {
    clearTimers()
    drawingRef.current = false
    setDrawing(false)
    setHighlightIndex(null)
    rotationRef.current = 0
    setAnimateRotation(false)
    setRotation(0)
    later(() => setAnimateRotation(true), 50)
  }, [clearTimers, later])

  return { rotation, animateRotation, durationMs, highlightIndex, drawing, start, reset }
}
```

- [ ] **Step 9 : Vérifier les types**

Run : `npx tsc --noEmit`
Expected : aucune erreur

- [ ] **Step 10 : Commit**

```bash
git add lib/timer.ts lib/timer.test.ts lib/sessionLog.ts lib/sessionLog.test.ts hooks/
git commit -m "feat: hooks minuteur, journal, URL, historique, anecdote et tirage"
```

---

### Task 6 : Fondations visuelles (police, couleurs, thème, pictogramme)

**Files :**
- Create : `app/fonts/Marianne-Light.woff2`, `Marianne-Regular.woff2`, `Marianne-Medium.woff2`, `Marianne-Bold.woff2`
- Rewrite : `app/globals.css`, `app/layout.tsx`
- Modify : `tailwind.config.ts`
- Create : `app/icon.svg`, `components/roue/WheelMark.tsx`

**Interfaces :**
- Consumes : `PASTELS` (tâche 2), `wedgePath` (tâche 3)
- Produces :
  - variables CSS globales `--rn-*` (clair et `.dark`), `@property --win` et `@property --win-ink`
  - `<WheelMark size? ref? title? />` : SVG `viewBox="-20 -20 40 40"`. Ses éléments portent les attributs `data-mark-ring`, `data-mark-part="0..7"` et `data-mark-hub`, que l'intro de la tâche 13 utilise.

- [ ] **Step 1 : Extraire les polices Marianne (sans installer le DSFR)**

```bash
REPO="$(pwd)"
TMP="$(mktemp -d)"
(cd "$TMP" && npm pack @gouvfr/dsfr@1.12.1 --silent && tar -xzf gouvfr-dsfr-1.12.1.tgz package/dist/fonts)
mkdir -p "$REPO/app/fonts"
for w in Light Regular Medium Bold; do cp "$TMP/package/dist/fonts/Marianne-$w.woff2" "$REPO/app/fonts/"; done
ls app/fonts
```

Expected : `Marianne-Bold.woff2  Marianne-Light.woff2  Marianne-Medium.woff2  Marianne-Regular.woff2`

- [ ] **Step 2 : Réécrire `app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Couleur du participant tiré, animable (transition de teinte de la scène) */
@property --win {
  syntax: "<color>";
  inherits: true;
  initial-value: #f5f5fe;
}
@property --win-ink {
  syntax: "<color>";
  inherits: true;
  initial-value: #000091;
}

@layer base {
  :root {
    /* DSFR — thème clair */
    --rn-blue: #000091;
    --rn-blue-hover: #1212ff;
    --rn-blue-925: #e3e3fd;
    --rn-blue-975: #f5f5fe;
    --rn-bg: #ffffff;
    --rn-bg-alt: #f6f6f6;
    --rn-bg-contrast: #eeeeee;
    --rn-border: #dddddd;
    --rn-text: #161616;
    --rn-text-2: #3a3a3a;
    --rn-mute: #666666;
    --rn-error: #e1000f;
    --rn-success: #18753c;
    --rn-warning: #b34000;
    --rn-focus: #0a76f6;
    --rn-input-line: #3a3a3a;
    --rn-wheel-ring: #ffffff;
    --rn-aura-opacity: 0.75;

    /* shadcn (triplets HSL) dérivés des valeurs DSFR */
    --background: 0 0% 100%;
    --foreground: 0 0% 8.6%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 8.6%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 8.6%;
    --primary: 240 100% 28.4%;
    --primary-foreground: 0 0% 100%;
    --secondary: 0 0% 96.5%;
    --secondary-foreground: 240 100% 28.4%;
    --muted: 0 0% 96.5%;
    --muted-foreground: 0 0% 40%;
    --accent: 240 84% 97.8%;
    --accent-foreground: 240 100% 28.4%;
    --destructive: 356 100% 44.1%;
    --destructive-foreground: 0 0% 100%;
    --border: 0 0% 86.7%;
    --input: 0 0% 93.3%;
    --ring: 213 93% 50.2%;
    --radius: 0rem;
  }

  .dark {
    /* DSFR — thème sombre */
    --rn-blue: #8585f6;
    --rn-blue-hover: #adadf9;
    --rn-blue-925: #21213f;
    --rn-blue-975: #1b1b35;
    --rn-bg: #161616;
    --rn-bg-alt: #1e1e1e;
    --rn-bg-contrast: #242424;
    --rn-border: #3a3a3a;
    --rn-text: #cecece;
    --rn-text-2: #cecece;
    --rn-mute: #929292;
    --rn-error: #ff5655;
    --rn-success: #27a658;
    --rn-warning: #fc5d00;
    --rn-input-line: #cecece;
    --rn-wheel-ring: #2a2a2a;
    --rn-aura-opacity: 0.18;

    --background: 0 0% 8.6%;
    --foreground: 0 0% 80.8%;
    --card: 0 0% 11.8%;
    --card-foreground: 0 0% 80.8%;
    --popover: 0 0% 11.8%;
    --popover-foreground: 0 0% 80.8%;
    --primary: 240 86.2% 74.3%;
    --primary-foreground: 0 0% 8.6%;
    --secondary: 0 0% 11.8%;
    --secondary-foreground: 240 86.2% 74.3%;
    --muted: 0 0% 14.1%;
    --muted-foreground: 0 0% 57.3%;
    --accent: 240 31.3% 18.8%;
    --accent-foreground: 240 86.2% 74.3%;
    --destructive: 0 100% 66.9%;
    --destructive-foreground: 0 0% 8.6%;
    --border: 0 0% 22.7%;
    --input: 0 0% 14.1%;
    --ring: 213 93% 50.2%;
  }

  * {
    @apply border-border;
  }

  html {
    -webkit-font-smoothing: antialiased;
  }

  body {
    @apply bg-background text-foreground;
  }

  /* Focus DSFR */
  :focus-visible {
    outline: 2px solid var(--rn-focus);
    outline-offset: 2px;
  }
}
```

- [ ] **Step 3 : Mettre à jour `tailwind.config.ts`**

Dans `theme.extend`, ajouter `fontFamily` et `fontSize` (juste avant `colors`), puis remplacer le bloc `borderRadius` :

```ts
  		fontFamily: {
  			sans: ['var(--font-marianne)', 'Arial', 'sans-serif']
  		},
  		fontSize: {
  			xs: ['0.75rem', { lineHeight: '1.25rem' }],
  			sm: ['0.875rem', { lineHeight: '1.5rem' }],
  			base: ['1rem', { lineHeight: '1.5rem' }],
  			lg: ['1.125rem', { lineHeight: '1.75rem' }],
  			xl: ['1.25rem', { lineHeight: '1.75rem' }],
  			'2xl': ['1.375rem', { lineHeight: '1.75rem' }],
  			'3xl': ['1.75rem', { lineHeight: '2.25rem' }],
  			'4xl': ['2rem', { lineHeight: '2.5rem' }],
  			'5xl': ['2.5rem', { lineHeight: '3rem' }],
  			display: ['2.875rem', { lineHeight: '3.25rem' }]
  		},
```

```ts
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'var(--radius)',
  			sm: 'var(--radius)'
  		},
```

- [ ] **Step 4 : Réécrire `app/layout.tsx`**

```tsx
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
```

- [ ] **Step 5 : Créer `components/roue/WheelMark.tsx`**

```tsx
import type { Ref, SVGProps } from "react"
import { wedgePath } from "@/lib/geometry"
import { PASTELS } from "@/lib/palette"

const PARTS = PASTELS.map((swatch, i) => ({
  d: wedgePath(17, -112.5 + i * 45, -67.5 + i * 45),
  fill: i === 0 ? "#000091" : swatch.bg,
}))

const ORIGIN = { transformBox: "view-box", transformOrigin: "0 0" } as const

type Props = Omit<SVGProps<SVGSVGElement>, "ref"> & {
  size?: number
  title?: string
  ref?: Ref<SVGSVGElement>
}

/** Pictogramme : mini-roue pastel, part du haut en bleu France. */
export function WheelMark({ size = 40, title, ref, ...rest }: Props) {
  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="-20 -20 40 40"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      {...rest}
    >
      {title && <title>{title}</title>}
      <circle data-mark-ring r={19} fill="#fff" stroke="#DDDDDD" strokeWidth={0.8} />
      {PARTS.map((part, i) => (
        <path key={i} data-mark-part={i} d={part.d} fill={part.fill} stroke="#fff" strokeWidth={0.9} style={ORIGIN} />
      ))}
      <g data-mark-hub style={ORIGIN}>
        <circle r={4.5} fill="#fff" stroke="#DDDDDD" strokeWidth={0.6} />
        <circle r={1.8} fill="#000091" />
      </g>
    </svg>
  )
}
```

- [ ] **Step 6 : Créer `app/icon.svg` (favicon, même dessin)**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-20 -20 40 40">
  <circle r="19" fill="#fff" stroke="#DDDDDD" stroke-width=".8"/>
  <path d="M0 0L-6.506 -15.706A17 17 0 0 1 6.506 -15.706Z" fill="#000091" stroke="#fff" stroke-width=".9"/>
  <path d="M0 0L6.506 -15.706A17 17 0 0 1 15.706 -6.506Z" fill="#C3FAD5" stroke="#fff" stroke-width=".9"/>
  <path d="M0 0L15.706 -6.506A17 17 0 0 1 15.706 6.506Z" fill="#FEE9E5" stroke="#fff" stroke-width=".9"/>
  <path d="M0 0L15.706 6.506A17 17 0 0 1 6.506 15.706Z" fill="#FEF7DA" stroke="#fff" stroke-width=".9"/>
  <path d="M0 0L6.506 15.706A17 17 0 0 1 -6.506 15.706Z" fill="#FEE7FC" stroke="#fff" stroke-width=".9"/>
  <path d="M0 0L-6.506 15.706A17 17 0 0 1 -15.706 6.506Z" fill="#C7F6FC" stroke="#fff" stroke-width=".9"/>
  <path d="M0 0L-15.706 6.506A17 17 0 0 1 -15.706 -6.506Z" fill="#F7EBE5" stroke="#fff" stroke-width=".9"/>
  <path d="M0 0L-15.706 -6.506A17 17 0 0 1 -6.506 -15.706Z" fill="#E6EEFE" stroke="#fff" stroke-width=".9"/>
  <circle r="4.5" fill="#fff" stroke="#DDDDDD" stroke-width=".6"/>
  <circle r="1.8" fill="#000091"/>
</svg>
```

- [ ] **Step 7 : Vérifier**

Run : `npx tsc --noEmit && npm run build`
Expected : aucune erreur de type, et le build réussit. L'ancienne page reste en place et s'affiche maintenant en Marianne, avec des coins carrés.

- [ ] **Step 8 : Commit**

```bash
git add app/fonts app/globals.css app/layout.tsx app/icon.svg tailwind.config.ts components/roue/WheelMark.tsx
git commit -m "feat: fondations DSFR (Marianne, couleurs clair/sombre, thème clair par défaut, pictogramme)"
```

---

### Task 7 : Éléments de structure (en-tête, aurore, sélecteur de mode, bouton de tirage)

**Files :**
- Create : `components/roue/AppHeader.tsx`, `AppHeader.module.css`, `ThemeToggle.tsx`, `ShareButton.tsx`
- Create : `components/roue/AuraBackground.tsx`, `AuraBackground.module.css`
- Create : `components/roue/ModeSwitch.tsx`, `ModeSwitch.module.css`
- Create : `components/roue/SpinButton.tsx`, `SpinButton.module.css`

**Interfaces :**
- Consumes : `WheelMark` (tâche 6), `Swatch` (tâche 2), `DisplayMode` (tâche 1)
- Produces :
  - `<AppHeader names colors onOpenParticipants markRef? />`
  - `<AuraBackground visible? />`
  - `<ModeSwitch value onChange disabled? />`
  - `<SpinButton label icon="spin"|"finale" busy disabled pulse? hint onClick />`

- [ ] **Step 1 : `components/roue/AppHeader.module.css`**

```css
.header {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 80px;
  padding: 0 40px;
  border-bottom: 1px solid var(--rn-border);
  background: color-mix(in srgb, var(--rn-bg) 85%, transparent);
  backdrop-filter: blur(8px);
}
.brand { display: flex; align-items: center; gap: 14px; min-width: 0; }
.title { margin: 0; font-size: 20px; line-height: 26px; font-weight: 700; letter-spacing: -0.01em; color: var(--rn-text); }
.subtitle { margin: 0; font-size: 13px; line-height: 18px; color: var(--rn-mute); }
.tools { display: flex; align-items: center; }
.tool {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  color: var(--rn-blue);
  background: none;
  border: 0;
  cursor: pointer;
}
.tool:hover { background: var(--rn-bg-alt); }
.tool + .tool { border-left: 1px solid var(--rn-border); }
.tool svg { width: 16px; height: 16px; }
.avatars { display: flex; margin-left: 4px; }
.avatar {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  margin-left: -6px;
  border: 2px solid var(--rn-bg);
  border-radius: 50%;
  font-size: 10px;
  font-weight: 700;
}
.avatar:first-child { margin-left: 0; }
.avatarMore { background: var(--rn-blue); color: var(--rn-bg); }
.count {
  padding: 0 8px;
  line-height: 20px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  background: var(--rn-blue-925);
  color: var(--rn-blue);
}

@media (max-width: 640px) {
  .header { height: 64px; padding: 0 16px; }
  .subtitle { display: none; }
  .tool { padding: 8px; }
  .toolLabel {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
}
```

- [ ] **Step 2 : `components/roue/ThemeToggle.tsx` et `ShareButton.tsx`**

```tsx
// components/roue/ThemeToggle.tsx
"use client"

import { useEffect, useState } from "react"
import { MoonIcon, SunIcon } from "@radix-ui/react-icons"
import { useTheme } from "next-themes"
import styles from "./AppHeader.module.css"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const dark = mounted && resolvedTheme === "dark"

  return (
    <button
      type="button"
      className={styles.tool}
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-pressed={dark}
      title={dark ? "Passer en thème clair" : "Passer en thème sombre"}
    >
      {dark ? <SunIcon aria-hidden /> : <MoonIcon aria-hidden />}
      <span className={styles.toolLabel}>Thème</span>
    </button>
  )
}
```

```tsx
// components/roue/ShareButton.tsx
"use client"

import { Link2Icon } from "@radix-ui/react-icons"
import { toast } from "sonner"
import styles from "./AppHeader.module.css"

export function ShareButton() {
  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success("Lien copié", { description: "La liste des participants est incluse dans le lien." })
    } catch {
      toast.error("Impossible de copier le lien", { description: window.location.href })
    }
  }

  return (
    <button type="button" className={styles.tool} onClick={share}>
      <Link2Icon aria-hidden />
      <span className={styles.toolLabel}>Partager</span>
    </button>
  )
}
```

- [ ] **Step 3 : `components/roue/AppHeader.tsx`**

```tsx
"use client"

import type { Ref } from "react"
import { PersonIcon } from "@radix-ui/react-icons"
import type { Swatch } from "@/lib/palette"
import { cn } from "@/lib/utils"
import { ShareButton } from "./ShareButton"
import { ThemeToggle } from "./ThemeToggle"
import { WheelMark } from "./WheelMark"
import styles from "./AppHeader.module.css"

type Props = {
  names: string[]
  colors: Swatch[]
  onOpenParticipants: () => void
  markRef?: Ref<SVGSVGElement>
}

export function AppHeader({ names, colors, onOpenParticipants, markRef }: Props) {
  const shown = names.slice(0, 6)
  const extra = names.length - shown.length

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <WheelMark ref={markRef} size={40} />
        <div>
          <h1 className={styles.title}>Roue des noms</h1>
          <p className={styles.subtitle}>Tirage au sort pour vos rituels d'équipe</p>
        </div>
      </div>
      <nav className={styles.tools} aria-label="Outils">
        <button type="button" className={styles.tool} onClick={onOpenParticipants} aria-haspopup="dialog">
          <PersonIcon aria-hidden />
          <span className={styles.toolLabel}>Participants</span>
          <span className="sr-only">{`(${names.length})`}</span>
          {names.length === 0 ? (
            <span className={styles.count} aria-hidden>0</span>
          ) : (
            <span className={styles.avatars} aria-hidden>
              {shown.map((name, i) => (
                <span key={name} className={styles.avatar} style={{ background: colors[i].bg, color: colors[i].ink }}>
                  {name.charAt(0).toUpperCase()}
                </span>
              ))}
              {extra > 0 && <span className={cn(styles.avatar, styles.avatarMore)}>+{extra}</span>}
            </span>
          )}
        </button>
        <ShareButton />
        <ThemeToggle />
      </nav>
    </header>
  )
}
```

- [ ] **Step 4 : `components/roue/AuraBackground.tsx` et son CSS**

```tsx
import { cn } from "@/lib/utils"
import styles from "./AuraBackground.module.css"

/** Taches pastel floutées qui dérivent lentement derrière la scène. */
export function AuraBackground({ visible = true }: { visible?: boolean }) {
  return (
    <div className={cn(styles.aura, !visible && styles.hidden)} aria-hidden>
      <span className={cn(styles.blob, styles.b1)} />
      <span className={cn(styles.blob, styles.b2)} />
      <span className={cn(styles.blob, styles.b3)} />
      <span className={cn(styles.blob, styles.b4)} />
    </div>
  )
}
```

```css
/* components/roue/AuraBackground.module.css */
.aura { position: absolute; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; }
.blob {
  position: absolute;
  width: 460px;
  height: 460px;
  border-radius: 50%;
  filter: blur(70px);
  opacity: var(--rn-aura-opacity);
  transition: opacity 1.2s ease;
  animation: drift 22s ease-in-out infinite alternate;
}
.hidden .blob { opacity: 0; }
.b1 { background: #e3e3fd; left: -120px; top: -140px; }
.b2 { background: #c3fad5; right: -80px; bottom: -200px; animation-duration: 26s; animation-delay: -6s; }
.b3 { background: #fee7fc; right: 20%; top: -220px; animation-duration: 30s; animation-delay: -12s; }
.b4 { background: #fef7da; left: 15%; bottom: -260px; animation-duration: 24s; animation-delay: -3s; }

@keyframes drift {
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(60px, 40px) scale(1.08); }
  100% { transform: translate(-40px, 70px) scale(0.95); }
}

@media (prefers-reduced-motion: reduce) {
  .blob { animation: none; }
}
```

- [ ] **Step 5 : `components/roue/ModeSwitch.tsx` et son CSS**

Le sélecteur est un groupe radio accessible : les flèches gauche/droite changent de mode.

```tsx
"use client"

import type { KeyboardEvent } from "react"
import { GridIcon, StarIcon, TargetIcon } from "@radix-ui/react-icons"
import type { DisplayMode } from "@/lib/names"
import { cn } from "@/lib/utils"
import styles from "./ModeSwitch.module.css"

const OPTIONS: { value: DisplayMode; label: string; Icon: typeof TargetIcon }[] = [
  { value: "wheel", label: "Roue", Icon: TargetIcon },
  { value: "grid", label: "Grille", Icon: GridIcon },
  { value: "star", label: "Étoile", Icon: StarIcon },
]

type Props = { value: DisplayMode; onChange: (mode: DisplayMode) => void; disabled?: boolean }

export function ModeSwitch({ value, onChange, disabled }: Props) {
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return
    event.preventDefault()
    const index = OPTIONS.findIndex((o) => o.value === value)
    const next = OPTIONS[(index + (event.key === "ArrowRight" ? 1 : OPTIONS.length - 1)) % OPTIONS.length]
    onChange(next.value)
    const target = event.currentTarget.querySelector<HTMLButtonElement>(`[data-mode="${next.value}"]`)
    target?.focus()
  }

  return (
    <div role="radiogroup" aria-label="Mode de tirage" className={styles.switch} onKeyDown={disabled ? undefined : onKeyDown}>
      {OPTIONS.map(({ value: mode, label, Icon }) => {
        const active = mode === value
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            data-mode={mode}
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            disabled={disabled}
            className={cn(styles.option, active && styles.active)}
            onClick={() => onChange(mode)}
          >
            <Icon aria-hidden />
            {label}
          </button>
        )
      })}
    </div>
  )
}
```

```css
/* components/roue/ModeSwitch.module.css */
.switch {
  display: inline-flex;
  gap: 2px;
  padding: 3px;
  background: color-mix(in srgb, var(--rn-bg) 90%, transparent);
  border: 1px solid var(--rn-border);
}
.option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 16px;
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  color: var(--rn-text-2);
  background: none;
  border: 0;
  cursor: pointer;
}
.option:hover:not(:disabled):not(.active) { background: var(--rn-bg-alt); }
.option:disabled { cursor: not-allowed; opacity: 0.6; }
.active { background: var(--rn-blue); color: var(--rn-bg); }
```

- [ ] **Step 6 : `components/roue/SpinButton.tsx` et son CSS**

```tsx
import type { ReactNode } from "react"
import { ReloadIcon, StarFilledIcon } from "@radix-ui/react-icons"
import { cn } from "@/lib/utils"
import styles from "./SpinButton.module.css"

type Props = {
  label: string
  icon: "spin" | "finale"
  busy: boolean
  disabled: boolean
  pulse?: boolean
  hint: ReactNode
  onClick: () => void
}

export function SpinButton({ label, icon, busy, disabled, pulse, hint, onClick }: Props) {
  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={cn(styles.button, pulse && !disabled && styles.pulse)}
        disabled={disabled}
        aria-busy={busy}
        onClick={onClick}
      >
        {icon === "finale" ? (
          <StarFilledIcon aria-hidden />
        ) : (
          <ReloadIcon aria-hidden className={busy ? styles.busyIcon : undefined} />
        )}
        <span>{label}</span>
      </button>
      <p className={styles.hint}>{hint}</p>
    </div>
  )
}
```

```css
/* components/roue/SpinButton.module.css */
.wrap { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.button {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 28px;
  font: inherit;
  font-size: 17px;
  line-height: 24px;
  font-weight: 500;
  color: var(--rn-bg);
  background: var(--rn-blue);
  border: 0;
  cursor: pointer;
  transition: background 0.15s ease;
}
.button:hover:not(:disabled) { background: var(--rn-blue-hover); }
.button:disabled { color: var(--rn-mute); background: var(--rn-bg-contrast); cursor: not-allowed; }
.button svg { width: 18px; height: 18px; }
.busyIcon { animation: spin 1s linear infinite; }
.pulse { animation: pulse 1.6s ease-out infinite; }
.hint { margin: 0; font-size: 12px; color: var(--rn-mute); text-align: center; }
.hint kbd {
  padding: 1px 6px;
  font-family: inherit;
  font-size: 11px;
  background: var(--rn-bg);
  border: 1px solid var(--rn-border);
  border-bottom-width: 2px;
  border-radius: 3px;
}

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--rn-blue) 45%, transparent); }
  100% { box-shadow: 0 0 0 18px transparent; }
}

@media (prefers-reduced-motion: reduce) {
  .busyIcon, .pulse { animation: none; }
}
```

- [ ] **Step 7 : Vérifier les types**

Run : `npx tsc --noEmit`
Expected : aucune erreur

- [ ] **Step 8 : Commit**

```bash
git add components/roue
git commit -m "feat: en-tête, aurore pastel, sélecteur de mode et bouton de tirage"
```

---

### Task 8 : Vues de tirage (roue, grille, étoile) et confettis

**Files :**
- Create : `components/roue/WheelView.tsx`, `WheelView.module.css`, `GridView.tsx`, `GridView.module.css`, `StarView.tsx`, `StarView.module.css`
- Create : `lib/confetti.ts`

**Interfaces :**
- Consumes : `wedgePath`, `starPoints`, `labelFontSize` (tâche 3) ; `segmentCenter`, `segmentAngle`, `labelNeedsFlip` (tâche 3) ; `truncateLabel` (tâche 1) ; `Swatch` (tâche 2)
- Produces :
  - `<WheelView names colors rotation animate durationMs spinning winnerIndex svgRef? />`
  - `<GridView names colors highlightIndex winnerIndex />`
  - `<StarView names colors highlightIndex winnerIndex />`
  - `burstConfetti(container: HTMLElement, origin: { x: number; y: number }, colors: readonly string[], count?: number): void`
  - `createConfettiPiece(container: HTMLElement, color: string, k: number): HTMLSpanElement` (réutilisée par la tâche 12)

- [ ] **Step 1 : `lib/confetti.ts`**

```ts
/** Crée une particule positionnée en (0, 0) du conteneur (qui doit être en position relative). */
export function createConfettiPiece(container: HTMLElement, color: string, k: number): HTMLSpanElement {
  const piece = document.createElement("span")
  piece.setAttribute("aria-hidden", "true")
  const thin = k % 4 === 1
  Object.assign(piece.style, {
    position: "absolute",
    left: "0",
    top: "0",
    width: thin ? "5px" : "9px",
    height: thin ? "12px" : "9px",
    background: color,
    borderRadius: k % 3 === 0 ? "50%" : "0",
    pointerEvents: "none",
    zIndex: "5",
  })
  container.appendChild(piece)
  return piece
}

/** Gerbe de confettis depuis `origin` (coordonnées relatives au conteneur). */
export function burstConfetti(
  container: HTMLElement,
  origin: { x: number; y: number },
  colors: readonly string[],
  count = 70,
): void {
  if (typeof container.animate !== "function") return
  for (let k = 0; k < count; k++) {
    const piece = createConfettiPiece(container, colors[k % colors.length], k)
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3
    const speed = 180 + Math.random() * 260
    const dx = Math.cos(angle) * speed
    const dy = Math.sin(angle) * speed
    const animation = piece.animate(
      [
        { transform: `translate(${origin.x}px, ${origin.y}px) rotate(0deg)`, opacity: 1 },
        {
          transform: `translate(${origin.x + dx * 0.7}px, ${origin.y + dy * 0.7}px) rotate(${Math.random() * 360}deg)`,
          opacity: 1,
          offset: 0.45,
        },
        {
          transform: `translate(${origin.x + dx}px, ${origin.y + dy + 380}px) rotate(${Math.random() * 720}deg)`,
          opacity: 0,
        },
      ],
      { duration: 1600 + Math.random() * 900, easing: "cubic-bezier(.2,.7,.4,1)" },
    )
    animation.onfinish = () => piece.remove()
    animation.oncancel = () => piece.remove()
  }
}
```

- [ ] **Step 2 : `components/roue/WheelView.tsx`**

```tsx
"use client"

import type { CSSProperties, Ref } from "react"
import { labelFontSize, polar, wedgePath } from "@/lib/geometry"
import { truncateLabel } from "@/lib/names"
import type { Swatch } from "@/lib/palette"
import { labelNeedsFlip, segmentAngle, segmentCenter } from "@/lib/spin"
import { cn } from "@/lib/utils"
import styles from "./WheelView.module.css"

const R = 196

type Props = {
  names: string[]
  colors: Swatch[]
  rotation: number
  animate: boolean
  durationMs: number
  spinning: boolean
  winnerIndex: number | null
  svgRef?: Ref<SVGSVGElement>
}

export function WheelView({ names, colors, rotation, animate, durationMs, spinning, winnerIndex, svgRef }: Props) {
  const count = names.length
  const seg = count > 0 ? segmentAngle(count) : 360
  const fontSize = labelFontSize(count)
  const wheelStyle: CSSProperties = {
    transform: `rotate(${rotation}deg)`,
    transition: animate ? `transform ${durationMs}ms cubic-bezier(.12,.72,.1,1)` : "none",
  }

  return (
    <div className={cn(styles.wrap, spinning && styles.spinning, winnerIndex !== null && styles.won)}>
      <svg
        ref={svgRef}
        className={styles.wheel}
        viewBox="-210 -210 420 420"
        style={wheelStyle}
        role="img"
        aria-label={count ? `Roue avec ${count} participants : ${names.join(", ")}` : "Roue vide"}
      >
        <circle r={206} className={styles.rim} />
        {count === 0 && (
          <>
            <circle r={R} className={styles.empty} />
            <text className={styles.emptyText} textAnchor="middle" y={-70}>
              Ajoutez des participants
            </text>
          </>
        )}
        {names.map((name, i) => {
          const center = segmentCenter(i, count)
          const swatch = colors[i]
          const win = i === winnerIndex
          const offset = win ? polar(12, center) : null
          return (
            <g
              key={name}
              className={cn(styles.segment, win && styles.winner)}
              style={offset ? { transform: `translate(${offset.x}px, ${offset.y}px) scale(1.04)` } : undefined}
            >
              {count === 1 ? (
                <circle r={R} fill={swatch.bg} />
              ) : (
                <path
                  d={wedgePath(R, center - seg / 2, center + seg / 2)}
                  fill={swatch.bg}
                  stroke={win ? swatch.ink : "var(--rn-wheel-ring)"}
                  strokeWidth={3}
                />
              )}
              <g transform={`rotate(${center}) translate(${R * 0.64} 0)`}>
                <text
                  className={cn(styles.label, !spinning && labelNeedsFlip(i, count, rotation) && styles.flip)}
                  fill={swatch.ink}
                  fontSize={fontSize}
                  fontWeight={win ? 700 : 500}
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {truncateLabel(name)}
                  <title>{name}</title>
                </text>
              </g>
            </g>
          )
        })}
        <circle r={44} className={styles.hubOuter} />
        <circle r={30} className={styles.hubInner} />
        <circle r={9} className={styles.hubDot} />
      </svg>
      <svg className={styles.pointer} viewBox="0 0 30 38" aria-hidden>
        <path d="M15 37 3.2 15.5A13 13 0 1 1 26.8 15.5Z" />
        <circle cx="15" cy="13" r="4.5" />
      </svg>
    </div>
  )
}
```

- [ ] **Step 3 : `components/roue/WheelView.module.css`**

```css
.wrap { position: relative; width: min(420px, 86vw); aspect-ratio: 1; }
.wheel {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
  filter: drop-shadow(0 18px 30px rgba(0, 0, 90, 0.14));
}
.rim { fill: var(--rn-wheel-ring); stroke: var(--rn-border); }
.empty { fill: var(--rn-bg-alt); }
.emptyText { fill: var(--rn-mute); font-size: 16px; font-family: inherit; }
.segment { transition: transform 0.5s cubic-bezier(.3, 1.6, .5, 1), opacity 0.5s ease; }
.won .segment:not(.winner) { opacity: 0.45; }
.label {
  font-family: inherit;
  pointer-events: none;
  transform-box: fill-box;
  transform-origin: center;
  transition: transform 0.45s cubic-bezier(.3, 1.4, .5, 1);
}
.flip { transform: rotate(180deg); }
.hubOuter { fill: var(--rn-wheel-ring); stroke: var(--rn-border); }
.hubInner { fill: var(--rn-blue-975); }
.hubDot { fill: var(--rn-blue); }
.pointer {
  position: absolute;
  top: -14px;
  left: 50%;
  z-index: 2;
  width: 30px;
  height: 38px;
  transform: translateX(-50%);
  transform-origin: 50% 35%;
  filter: drop-shadow(0 3px 4px rgba(0, 0, 60, 0.25));
}
.pointer path { fill: var(--rn-blue); }
.pointer circle { fill: var(--rn-bg); }
.spinning .pointer { animation: tick 0.11s ease-in-out infinite alternate; }

@keyframes tick {
  from { transform: translateX(-50%) rotate(-7deg); }
  to { transform: translateX(-50%) rotate(5deg); }
}

@media (prefers-reduced-motion: reduce) {
  .spinning .pointer { animation: none; }
  .segment, .label { transition: none; }
}
```

- [ ] **Step 4 : `components/roue/GridView.tsx` et son CSS**

```tsx
"use client"

import type { CSSProperties } from "react"
import type { Swatch } from "@/lib/palette"
import { cn } from "@/lib/utils"
import styles from "./GridView.module.css"

type Props = { names: string[]; colors: Swatch[]; highlightIndex: number | null; winnerIndex: number | null }

export function GridView({ names, colors, highlightIndex, winnerIndex }: Props) {
  const columns = Math.ceil(Math.sqrt(Math.max(names.length, 1)))
  return (
    <ul
      className={cn(styles.grid, winnerIndex !== null && styles.won)}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      aria-label={`Grille de ${names.length} participants`}
    >
      {names.map((name, i) => (
        <li
          key={name}
          className={cn(styles.tile, i === highlightIndex && styles.highlight, i === winnerIndex && styles.winner)}
          style={{ "--tile-bg": colors[i].bg, "--tile-ink": colors[i].ink } as CSSProperties}
        >
          <span className={styles.name} title={name}>{name}</span>
        </li>
      ))}
    </ul>
  )
}
```

```css
/* components/roue/GridView.module.css */
.grid {
  display: grid;
  gap: 10px;
  width: min(420px, 86vw);
  aspect-ratio: 1;
  align-content: center;
  margin: 0;
  padding: 0;
  list-style: none;
}
.tile {
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  padding: 8px;
  overflow: hidden;
  color: var(--tile-ink);
  background: var(--tile-bg);
  box-shadow: 0 6px 14px -8px rgba(0, 0, 60, 0.25);
  transition: transform 0.12s ease, opacity 0.4s ease, background 0.4s ease, color 0.4s ease;
}
.name {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: clamp(12px, 2.2vw, 18px);
  font-weight: 500;
}
.highlight { outline: 2px solid var(--rn-blue); outline-offset: 2px; transform: scale(1.04); }
.won .tile:not(.winner) { opacity: 0.45; }
.winner {
  color: var(--tile-bg);
  background: var(--tile-ink);
  transform: scale(1.06);
  box-shadow: 0 14px 28px -12px var(--tile-ink);
}
.winner .name { font-weight: 700; }

@media (prefers-reduced-motion: reduce) {
  .tile { transition: none; }
}
```

- [ ] **Step 5 : `components/roue/StarView.tsx` et son CSS**

```tsx
"use client"

import { starPoints } from "@/lib/geometry"
import { truncateLabel } from "@/lib/names"
import type { Swatch } from "@/lib/palette"
import { cn } from "@/lib/utils"
import styles from "./StarView.module.css"

const SIZE = 420
const C = SIZE / 2
const OUTER = C - 10
const INNER = OUTER * 0.4

type Props = { names: string[]; colors: Swatch[]; highlightIndex: number | null; winnerIndex: number | null }

export function StarView({ names, colors, highlightIndex, winnerIndex }: Props) {
  const count = names.length
  const points = starPoints(C, C, Math.max(count, 1), OUTER, INNER)
  const fontSize = count > 8 ? 14 : count > 5 ? 16 : 18

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className={cn(styles.star, winnerIndex !== null && styles.won)}
      role="img"
      aria-label={`Étoile avec ${count} participants : ${names.join(", ")}`}
    >
      {names.map((name, i) => {
        const swatch = colors[i]
        const corners = [points[i * 2], points[(i * 2 + 1) % points.length], { x: C, y: C }, points[(i * 2 - 1 + points.length) % points.length]]
        const d = `M ${corners.map((p) => `${p.x},${p.y}`).join(" L ")} Z`
        const angle = ((i * 360) / count - 90) * (Math.PI / 180)
        const highlighted = i === highlightIndex
        const win = i === winnerIndex
        return (
          <g key={name} className={cn(styles.branch, highlighted && styles.highlight, win && styles.winner)}>
            <path
              d={d}
              fill={swatch.bg}
              stroke={highlighted ? "var(--rn-blue)" : win ? swatch.ink : "var(--rn-wheel-ring)"}
              strokeWidth={highlighted ? 4 : 2}
            />
            <text
              x={C + Math.cos(angle) * OUTER * 0.45}
              y={C + Math.sin(angle) * OUTER * 0.45}
              fill={swatch.ink}
              fontSize={fontSize}
              fontWeight={win ? 700 : 500}
              textAnchor="middle"
              dominantBaseline="middle"
              className={styles.label}
            >
              {truncateLabel(name, 12)}
              <title>{name}</title>
            </text>
          </g>
        )
      })}
      <circle cx={C} cy={C} r={10} className={styles.hub} />
    </svg>
  )
}
```

```css
/* components/roue/StarView.module.css */
.star {
  width: min(420px, 86vw);
  aspect-ratio: 1;
  overflow: visible;
  filter: drop-shadow(0 18px 30px rgba(0, 0, 90, 0.14));
}
.branch { transform-box: fill-box; transform-origin: center; transition: opacity 0.4s ease; }
.branch path { transition: stroke 0.12s ease; }
.won .branch:not(.winner) { opacity: 0.45; }
.winner { animation: pulse 1s ease-in-out infinite; }
.label { font-family: inherit; pointer-events: none; }
.hub { fill: var(--rn-blue); stroke: var(--rn-wheel-ring); stroke-width: 2; }

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@media (prefers-reduced-motion: reduce) {
  .winner { animation: none; }
}
```

- [ ] **Step 6 : Vérifier les types**

Run : `npx tsc --noEmit`
Expected : aucune erreur

- [ ] **Step 7 : Commit**

```bash
git add lib/confetti.ts components/roue/WheelView.* components/roue/GridView.* components/roue/StarView.*
git commit -m "feat: vues roue, grille, étoile en pastel + confettis"
```

---

### Task 9 : Panneau de résultat

**Files :**
- Create : `components/roue/ResultPanel.tsx`, `components/roue/ResultPanel.module.css`

**Interfaces :**
- Consumes : `SpeakingTimer` et `NameFactState` (tâche 5), `formatCountdown`, `timerProgress`, `timerTone`, `SPEAKING_LIMIT_MS` (tâche 5), `getDailyHoroscope` (existant)
- Produces : `<ResultPanel selectedName participantCount drawing isFinale finalistName timer fact onRemove onRemoveAndSpin onFinish onOpenParticipants />`

La carte lit `--win` et `--win-ink` sur un ancêtre ; `NameWheelApp` les définira en tâche 11.

- [ ] **Step 1 : `components/roue/ResultPanel.tsx`**

```tsx
"use client"

import { useState, type CSSProperties } from "react"
import { ArrowRightIcon, CheckIcon, Cross2Icon, InfoCircledIcon, PauseIcon, PlayIcon, PlusIcon, StarIcon } from "@radix-ui/react-icons"
import type { NameFactState } from "@/hooks/useNameFact"
import type { SpeakingTimer } from "@/hooks/useSpeakingTimer"
import { getDailyHoroscope } from "@/lib/nameFacts/horoscopeTemplates"
import { SPEAKING_LIMIT_MS, formatCountdown, timerProgress, timerTone } from "@/lib/timer"
import { cn } from "@/lib/utils"
import styles from "./ResultPanel.module.css"

type Props = {
  selectedName: string | null
  participantCount: number
  drawing: boolean
  isFinale: boolean
  finalistName: string | null
  timer: SpeakingTimer
  fact: NameFactState
  onRemove: () => void
  onRemoveAndSpin: () => void
  onFinish: () => void
  onOpenParticipants: () => void
}

const TONE_COLOR = { ok: "var(--win-ink)", warn: "var(--rn-warning)", danger: "var(--rn-error)" } as const

export function ResultPanel(props: Props) {
  const { selectedName, isFinale } = props
  return (
    <div className={styles.root}>
      <p className="sr-only" aria-live="polite">
        {selectedName ? `${isFinale ? "Et pour finir" : "Au tour de"} ${selectedName}` : ""}
      </p>
      {selectedName ? <SelectedCard key={selectedName} {...props} selectedName={selectedName} /> : <EmptyState {...props} />}
    </div>
  )
}

function EmptyState({ participantCount, drawing, finalistName, onOpenParticipants }: Props) {
  if (drawing) {
    return (
      <div className={styles.empty}>
        <strong className={styles.emptyTitle}>Tirage en cours…</strong>
        Qui sera tiré au sort ?
      </div>
    )
  }
  if (finalistName) {
    return (
      <div className={styles.empty}>
        <strong className={styles.emptyTitle}>Plus qu'une personne</strong>
        Tout le monde est passé sauf {finalistName}. Lancez la finale pour clore le tour de table.
      </div>
    )
  }
  if (participantCount < 2) {
    return (
      <div className={styles.empty}>
        <strong className={styles.emptyTitle}>Ajoutez des participants pour commencer</strong>
        Il faut au moins 2 noms pour lancer un tirage.
        <button type="button" className={styles.emptyAction} onClick={onOpenParticipants}>
          <PlusIcon aria-hidden />
          Ajouter des participants
        </button>
      </div>
    )
  }
  return (
    <div className={styles.empty}>
      <strong className={styles.emptyTitle}>Prêt pour le tirage</strong>
      {participantCount} participants dans la roue. Lancez le tirage : le nom tiré, un minuteur de 2 minutes et une
      anecdote s'afficheront ici.
    </div>
  )
}

function SelectedCard({
  selectedName,
  participantCount,
  isFinale,
  timer,
  fact,
  onRemove,
  onRemoveAndSpin,
  onFinish,
}: Props & { selectedName: string }) {
  const [tab, setTab] = useState<"fact" | "horoscope">("fact")
  const factAvailable = fact.loading || fact.fact !== null
  const activeTab = factAvailable ? tab : "horoscope"
  const tone = timerTone(timer.elapsedMs)
  const countdown = formatCountdown(timer.elapsedMs)

  return (
    <section className={styles.card} aria-labelledby="result-name">
      <div className={styles.top}>
        <p className={styles.eyebrow}>{isFinale ? "Et pour finir…" : "Au tour de"}</p>
        <h2 id="result-name" className={styles.name}>
          <span className="sr-only">{selectedName}</span>
          {[...selectedName].map((char, i) => (
            <span key={i} className={styles.letter} style={{ "--i": i } as CSSProperties} aria-hidden>
              {char === " " ? " " : char}
            </span>
          ))}
        </h2>
      </div>

      <div className={styles.timer}>
        <div className={styles.timerRow}>
          <span className={styles.eyebrow}>Temps de parole</span>
          <span className={styles.clock} data-tone={tone}>{countdown}</span>
        </div>
        <div
          className={styles.bar}
          role="progressbar"
          aria-label="Temps de parole restant"
          aria-valuemin={0}
          aria-valuemax={SPEAKING_LIMIT_MS / 1000}
          aria-valuenow={Math.max(0, Math.ceil((SPEAKING_LIMIT_MS - timer.elapsedMs) / 1000))}
          aria-valuetext={countdown}
        >
          <span
            className={styles.barFill}
            style={{ transform: `scaleX(${timerProgress(timer.elapsedMs)})`, background: TONE_COLOR[tone] }}
          />
        </div>
      </div>

      {factAvailable && (
        <div className={styles.tabs} role="tablist" aria-label="Pour aller plus loin">
          <button
            type="button"
            role="tab"
            id="tab-fact"
            aria-controls="result-extra"
            aria-selected={activeTab === "fact"}
            className={styles.tab}
            onClick={() => setTab("fact")}
          >
            <InfoCircledIcon aria-hidden />
            Le saviez-vous ?
          </button>
          <button
            type="button"
            role="tab"
            id="tab-horoscope"
            aria-controls="result-extra"
            aria-selected={activeTab === "horoscope"}
            className={styles.tab}
            onClick={() => setTab("horoscope")}
          >
            <StarIcon aria-hidden />
            Horoscope
          </button>
        </div>
      )}
      <div
        id="result-extra"
        role={factAvailable ? "tabpanel" : undefined}
        aria-labelledby={factAvailable ? (activeTab === "fact" ? "tab-fact" : "tab-horoscope") : undefined}
        className={styles.panel}
      >
        {activeTab === "fact" ? (
          fact.loading ? (
            <>
              <span className={styles.skeleton} />
              <span className={styles.skeleton} style={{ width: "70%" }} />
            </>
          ) : (
            <>
              <p>« {fact.fact} »</p>
              {fact.total > 1 && (
                <p className={styles.panelMeta}>1 anecdote choisie parmi {fact.total.toLocaleString("fr-FR")} possibles.</p>
              )}
            </>
          )
        ) : (
          <>
            {!factAvailable && (
              <p className={styles.panelTitle}>
                <StarIcon aria-hidden />
                Horoscope du jour
              </p>
            )}
            <p>« {getDailyHoroscope(selectedName)} »</p>
          </>
        )}
      </div>

      <div className={styles.actions}>
        <button type="button" className={cn(styles.action, styles.pause)} onClick={timer.running ? timer.pause : timer.resume}>
          {timer.running ? <PauseIcon aria-hidden /> : <PlayIcon aria-hidden />}
          {timer.running ? "Pause" : "Reprendre"}
        </button>
        {isFinale ? (
          <button type="button" className={cn(styles.action, styles.actionPrimary)} onClick={onFinish}>
            <CheckIcon aria-hidden />
            Terminer le tour de table
          </button>
        ) : participantCount > 2 ? (
          <>
            <button type="button" className={styles.action} onClick={onRemove}>
              <Cross2Icon aria-hidden />
              Retirer {selectedName}
            </button>
            <button type="button" className={cn(styles.action, styles.actionPrimary)} onClick={onRemoveAndSpin}>
              <ArrowRightIcon aria-hidden />
              Retirer et relancer
            </button>
          </>
        ) : (
          <button type="button" className={cn(styles.action, styles.actionPrimary)} onClick={onRemove}>
            <ArrowRightIcon aria-hidden />
            Retirer {selectedName}
          </button>
        )}
      </div>
    </section>
  )
}
```

- [ ] **Step 2 : `components/roue/ResultPanel.module.css`**

```css
.root { width: 100%; }
.empty {
  padding: 28px;
  font-size: 15px;
  line-height: 24px;
  color: var(--rn-mute);
  background: color-mix(in srgb, var(--rn-bg) 70%, transparent);
  backdrop-filter: blur(6px);
  border: 1px dashed var(--rn-border);
}
.emptyTitle { display: block; margin-bottom: 6px; font-size: 20px; font-weight: 700; color: var(--rn-text); }
.emptyAction {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 8px 16px;
  font: inherit;
  font-size: 15px;
  font-weight: 500;
  color: var(--rn-bg);
  background: var(--rn-blue);
  border: 0;
  cursor: pointer;
}
.card {
  background: var(--rn-bg);
  border: 1px solid var(--rn-border);
  box-shadow: 0 24px 40px -22px color-mix(in srgb, var(--win-ink) 55%, transparent);
  animation: cardIn 0.6s cubic-bezier(.2, 1.3, .4, 1) 0.1s both;
}
.top { padding: 22px 28px 20px; background: var(--win); border-top: 4px solid var(--win-ink); }
.eyebrow {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--rn-mute);
}
.top .eyebrow { color: var(--win-ink); opacity: 0.85; }
.name {
  display: flex;
  flex-wrap: wrap;
  margin: 2px 0 0;
  overflow: hidden;
  font-size: 46px;
  line-height: 52px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--win-ink);
}
.letter {
  display: inline-block;
  animation: rise 0.5s cubic-bezier(.2, 1.2, .4, 1) both;
  animation-delay: calc(0.15s + var(--i) * 0.04s);
}
.timer { display: grid; gap: 10px; padding: 20px 28px; }
.timerRow { display: flex; align-items: baseline; justify-content: space-between; }
.clock { font-size: 28px; font-weight: 700; font-variant-numeric: tabular-nums; color: var(--rn-text); }
.clock[data-tone="warn"] { color: var(--rn-warning); }
.clock[data-tone="danger"] { color: var(--rn-error); }
.bar { height: 6px; overflow: hidden; border-radius: 3px; background: var(--rn-bg-contrast); }
.barFill {
  display: block;
  height: 100%;
  transform-origin: left;
  transition: transform 0.3s linear, background-color 0.6s ease;
}
.tabs { display: flex; gap: 2px; margin: 0 28px; border-bottom: 1px solid var(--rn-border); }
.tab {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: -1px;
  padding: 8px 12px;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  color: var(--rn-text-2);
  background: none;
  border: 0;
  border-bottom: 2px solid transparent;
  cursor: pointer;
}
.tab[aria-selected="true"] { color: var(--win-ink); border-bottom-color: var(--win-ink); }
.panel {
  margin: 12px 28px 20px;
  padding: 14px 16px 14px 18px;
  font-size: 14px;
  line-height: 22px;
  color: var(--rn-text-2);
  background: color-mix(in srgb, var(--win) 45%, var(--rn-bg));
  border-left: 3px solid var(--win-ink);
}
.panel p { margin: 0; }
.panelTitle { display: flex; align-items: center; gap: 6px; margin-bottom: 4px !important; font-weight: 700; color: var(--win-ink); }
.panelMeta { margin-top: 6px !important; font-size: 12px; color: var(--rn-mute); }
.skeleton {
  display: block;
  height: 12px;
  margin: 6px 0;
  background: linear-gradient(90deg, var(--rn-bg-contrast), var(--rn-bg-alt), var(--rn-bg-contrast));
  background-size: 200% 100%;
  animation: shimmer 1.2s linear infinite;
}
.actions { display: flex; flex-wrap: wrap; border-top: 1px solid var(--rn-border); }
.action {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 16px;
  font: inherit;
  font-size: 15px;
  font-weight: 500;
  color: var(--rn-blue);
  overflow-wrap: anywhere;
  background: var(--rn-bg);
  border: 0;
  cursor: pointer;
}
.action + .action { border-left: 1px solid var(--rn-border); }
.action:hover { background: var(--rn-bg-alt); }
.pause { flex: 0 0 auto; }
.actionPrimary { color: var(--rn-bg); background: var(--rn-blue); }
.actionPrimary:hover { background: var(--rn-blue-hover); }

@keyframes cardIn {
  from { opacity: 0; transform: translateY(16px) scale(0.98); }
  to { opacity: 1; transform: none; }
}
@keyframes rise {
  from { transform: translateY(110%); }
  to { transform: none; }
}
@keyframes shimmer { to { background-position: -200% 0; } }

@media (prefers-reduced-motion: reduce) {
  .card, .letter, .skeleton { animation: none; }
}
```

- [ ] **Step 3 : Vérifier les types**

Run : `npx tsc --noEmit`
Expected : aucune erreur

- [ ] **Step 4 : Commit**

```bash
git add components/roue/ResultPanel.*
git commit -m "feat: panneau de résultat (nom, minuteur auto, anecdote/horoscope, actions)"
```

---

### Task 10 : Panneau « Participants » en deux colonnes

**Files :**
- Create : `components/roue/ParticipantsDrawer.tsx`, `components/roue/ParticipantsDrawer.module.css`

**Interfaces :**
- Consumes : `NameHistory` (tâche 5), `formatSavedAt` (tâche 4), `splitInput` (tâche 1), `Swatch` (tâche 2), `AlertDialog*` de `components/ui/alert-dialog`
- Produces : `<ParticipantsDrawer open onOpenChange names colors history onAdd onRemove onClear onResumeLastList />`, où `onAdd(labels: string[]) => { added: string[]; duplicates: string[] }`

- [ ] **Step 1 : `components/roue/ParticipantsDrawer.tsx`**

```tsx
"use client"

import { useState, type FormEvent } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { ArrowLeftIcon, CounterClockwiseClockIcon, Cross2Icon, LockClosedIcon, PlusIcon } from "@radix-ui/react-icons"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { NameHistory } from "@/hooks/useNameHistory"
import { formatSavedAt } from "@/lib/history"
import { nameKey, splitInput } from "@/lib/names"
import type { Swatch } from "@/lib/palette"
import { cn } from "@/lib/utils"
import styles from "./ParticipantsDrawer.module.css"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  names: string[]
  colors: Swatch[]
  history: NameHistory
  onAdd: (labels: string[]) => { added: string[]; duplicates: string[] }
  onRemove: (name: string) => void
  onClear: () => void
  onResumeLastList: () => void
}

export function ParticipantsDrawer({ open, onOpenChange, names, colors, history, onAdd, onRemove, onClear, onResumeLastList }: Props) {
  const [input, setInput] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [recent, setRecent] = useState<Set<string>>(new Set())

  const add = (labels: string[]) => {
    const { added, duplicates } = onAdd(labels)
    setRecent(new Set(added.map(nameKey)))
    if (duplicates.length === 0) setMessage(null)
    else setMessage(`${duplicates.join(", ")} ${duplicates.length > 1 ? "sont déjà" : "est déjà"} dans la roue.`)
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const labels = splitInput(input)
    if (labels.length === 0) return
    add(labels)
    setInput("")
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.panel} aria-describedby={undefined}>
          <header className={styles.head}>
            <Dialog.Title className={styles.title}>Participants</Dialog.Title>
            <Dialog.Close className={styles.close}>
              Fermer <Cross2Icon aria-hidden />
            </Dialog.Close>
          </header>

          <div className={cn(styles.cols, !history.available && styles.single)}>
            <section className={styles.col} aria-labelledby="in-wheel-title">
              <div className={styles.colHead}>
                <h3 id="in-wheel-title" className={styles.colTitle}>
                  Dans la roue <span className={styles.colCount}>({names.length})</span>
                </h3>
                {names.length > 0 && (
                  <button type="button" className={styles.link} onClick={onClear}>
                    Vider
                  </button>
                )}
              </div>

              <form onSubmit={submit}>
                <label htmlFor="participants-input" className={styles.label}>
                  Ajouter des participants
                </label>
                <span id="participants-hint" className={styles.hint}>
                  Un ou plusieurs noms, séparés par des virgules
                </span>
                <div className={styles.field}>
                  <input
                    id="participants-input"
                    className={styles.input}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ex. : Alice, Bruno"
                    autoComplete="off"
                    aria-describedby={message ? "participants-hint participants-message" : "participants-hint"}
                  />
                  <button type="submit" className={styles.submit}>
                    <PlusIcon aria-hidden />
                    Ajouter
                  </button>
                </div>
                {message && (
                  <p id="participants-message" role="status" className={styles.message}>
                    {message}
                  </p>
                )}
              </form>

              {names.length === 0 ? (
                <p className={styles.emptyText}>
                  Aucun participant. Ajoutez des noms{history.available ? " ou piochez dans l'historique" : ""}.
                </p>
              ) : (
                <ul className={styles.list}>
                  {names.map((name, i) => (
                    <li key={name} className={cn(styles.item, recent.has(nameKey(name)) && styles.new)}>
                      <span
                        className={styles.swatch}
                        style={{ background: colors[i].bg, boxShadow: `inset 0 0 0 1px ${colors[i].ink}44` }}
                        aria-hidden
                      />
                      <span className={styles.itemName}>{name}</span>
                      <button type="button" className={styles.remove} onClick={() => onRemove(name)} aria-label={`Retirer ${name}`}>
                        Retirer <Cross2Icon aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {history.available && (
              <section className={cn(styles.col, styles.historyCol)} aria-labelledby="history-title">
                <div className={styles.colHead}>
                  <h3 id="history-title" className={styles.colTitle}>
                    <CounterClockwiseClockIcon aria-hidden />
                    Déjà utilisés
                  </h3>
                  {history.suggestions.length > 0 && (
                    <button type="button" className={styles.link} onClick={() => add(history.suggestions.map((s) => s.label))}>
                      Tout ajouter →
                    </button>
                  )}
                </div>

                {names.length === 0 && history.lastList && (
                  <div className={styles.resume}>
                    <div>
                      <p className={styles.resumeTitle}>Reprendre la dernière liste</p>
                      <p className={styles.resumeMeta}>
                        {history.lastList.names.length} noms · {formatSavedAt(history.lastList.savedAt, Date.now())}
                      </p>
                    </div>
                    <button type="button" className={styles.secondary} onClick={onResumeLastList}>
                      Reprendre
                    </button>
                  </div>
                )}

                {history.suggestions.length === 0 ? (
                  <p className={styles.emptyText}>
                    {history.size === 0
                      ? "Les noms que vous ajoutez apparaîtront ici pour les prochaines fois."
                      : "Tous les noms connus sont déjà dans la roue."}
                  </p>
                ) : (
                  <ul className={styles.list}>
                    {history.suggestions.map((entry) => (
                      <li key={entry.label} className={styles.historyItem}>
                        <button
                          type="button"
                          className={styles.historyAdd}
                          onClick={() => add([entry.label])}
                          aria-label={`Ajouter ${entry.label} à la roue`}
                        >
                          <span className={styles.plus} aria-hidden>
                            <ArrowLeftIcon />
                          </span>
                          <span className={styles.historyName}>{entry.label}</span>
                          <span className={styles.historyCount}>{entry.count} fois</span>
                        </button>
                        <button
                          type="button"
                          className={styles.forget}
                          onClick={() => history.forget(entry.label)}
                          aria-label={`Oublier ${entry.label}`}
                          title="Oublier ce nom"
                        >
                          <Cross2Icon aria-hidden />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </div>

          {history.available && (
            <footer className={styles.foot}>
              <span className={styles.footNote}>
                <LockClosedIcon aria-hidden />
                Historique conservé sur cet appareil uniquement
              </span>
              <AlertDialog>
                <AlertDialogTrigger className={styles.link} disabled={history.size === 0 && !history.lastList}>
                  Effacer l'historique
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Effacer l'historique ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Les noms déjà utilisés et la dernière liste seront oubliés sur cet appareil. La roue en cours n'est pas
                      modifiée.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={history.clear}>Effacer</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </footer>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
```

- [ ] **Step 2 : `components/roue/ParticipantsDrawer.module.css`**

```css
.overlay { position: fixed; inset: 0; z-index: 40; background: rgba(22, 22, 22, 0.32); animation: fadeIn 0.2s ease; }
.overlay[data-state="closed"] { animation: fadeOut 0.2s ease forwards; }
.panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 41;
  display: flex;
  flex-direction: column;
  width: min(760px, 100vw);
  background: var(--rn-bg);
  border-left: 1px solid var(--rn-border);
  box-shadow: -18px 0 40px -18px rgba(0, 0, 60, 0.35);
  animation: slideIn 0.3s cubic-bezier(.2, 1, .3, 1);
}
.panel[data-state="closed"] { animation: slideOut 0.2s ease forwards; }
.head { display: flex; align-items: center; justify-content: space-between; padding: 18px 24px 14px; border-bottom: 1px solid var(--rn-border); }
.title { margin: 0; font-size: 22px; font-weight: 700; color: var(--rn-text); }
.close {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  color: var(--rn-blue);
  background: none;
  border: 0;
  cursor: pointer;
}
.cols { display: grid; flex: 1; grid-template-columns: 1fr 1fr; min-height: 0; }
.single { grid-template-columns: 1fr; }
.col { display: flex; flex-direction: column; gap: 14px; min-height: 0; padding: 18px 24px; overflow: auto; }
.historyCol { background: var(--rn-bg-alt); border-left: 1px solid var(--rn-border); }
.colHead { display: flex; align-items: baseline; justify-content: space-between; }
.colTitle {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--rn-mute);
}
.colCount { color: var(--rn-blue); }
.link {
  padding: 0;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  color: var(--rn-blue);
  text-decoration: underline;
  text-underline-offset: 3px;
  background: none;
  border: 0;
  cursor: pointer;
}
.link:disabled { color: var(--rn-mute); cursor: not-allowed; }
.label { display: block; font-size: 15px; color: var(--rn-text); }
.hint { display: block; margin: 2px 0 8px; font-size: 12px; color: var(--rn-mute); }
.field { display: flex; }
.input {
  flex: 1;
  min-width: 0;
  padding: 9px 12px;
  font: inherit;
  font-size: 16px;
  color: var(--rn-text);
  background: var(--rn-bg-contrast);
  border: 0;
  border-radius: 4px 4px 0 0;
  box-shadow: inset 0 -2px 0 var(--rn-input-line);
}
.submit {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 14px;
  font: inherit;
  font-weight: 500;
  color: var(--rn-bg);
  background: var(--rn-blue);
  border: 0;
  cursor: pointer;
}
.message { margin: 6px 0 0; font-size: 13px; color: var(--rn-warning); }
.emptyText { margin: 0; font-size: 14px; color: var(--rn-mute); }
.list { margin: 0; padding: 0; list-style: none; }
.item { display: flex; align-items: center; gap: 10px; padding: 8px 2px; font-size: 15px; border-bottom: 1px solid var(--rn-border); }
.new { animation: pop 0.45s cubic-bezier(.3, 1.5, .5, 1); }
.swatch { flex: none; width: 14px; height: 14px; border-radius: 50%; }
.itemName { flex: 1; font-weight: 500; overflow-wrap: anywhere; color: var(--rn-text); }
.remove {
  display: flex;
  align-items: center;
  gap: 4px;
  font: inherit;
  font-size: 13px;
  color: var(--rn-blue);
  background: none;
  border: 0;
  cursor: pointer;
}
.resume { display: flex; align-items: center; gap: 10px; padding: 12px; background: var(--rn-blue-975); border: 1px solid var(--rn-border); }
.resumeTitle { margin: 0; font-size: 14px; font-weight: 700; color: var(--rn-text); }
.resumeMeta { margin: 0; font-size: 13px; color: var(--rn-mute); }
.secondary {
  margin-left: auto;
  padding: 7px 12px;
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  color: var(--rn-blue);
  background: var(--rn-bg);
  border: 0;
  box-shadow: inset 0 0 0 1px var(--rn-blue);
  cursor: pointer;
}
.historyItem { display: flex; align-items: center; }
.historyAdd {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 10px;
  padding: 7px 8px;
  font: inherit;
  font-size: 15px;
  text-align: left;
  color: var(--rn-text);
  background: none;
  border: 1px dashed transparent;
  cursor: pointer;
}
.historyAdd:hover { color: var(--rn-blue); background: var(--rn-bg); border-color: var(--rn-blue); }
.plus { display: grid; flex: none; place-items: center; width: 22px; height: 22px; border-radius: 50%; color: var(--rn-blue); background: var(--rn-blue-925); }
.historyName { flex: 1; font-weight: 500; }
.historyCount { font-size: 11px; color: var(--rn-mute); }
.forget { display: grid; place-items: center; width: 28px; height: 28px; color: var(--rn-mute); background: none; border: 0; cursor: pointer; }
.forget:hover { color: var(--rn-error); }
.foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 24px;
  font-size: 12px;
  color: var(--rn-mute);
  border-top: 1px solid var(--rn-border);
}
.footNote { display: flex; align-items: center; gap: 6px; }

@keyframes fadeIn { from { opacity: 0; } }
@keyframes fadeOut { to { opacity: 0; } }
@keyframes slideIn { from { transform: translateX(100%); } }
@keyframes slideOut { to { transform: translateX(100%); } }
@keyframes pop {
  from { opacity: 0; transform: translateX(16px); background: var(--rn-blue-925); }
  to { opacity: 1; transform: none; background: transparent; }
}

@media (max-width: 720px) {
  .cols { grid-template-columns: 1fr; overflow: auto; }
  .col { overflow: visible; }
  .historyCol { border-left: 0; border-top: 1px solid var(--rn-border); }
  .foot { flex-direction: column; align-items: flex-start; }
}

@media (prefers-reduced-motion: reduce) {
  .overlay, .panel, .new { animation: none; }
}
```

- [ ] **Step 3 : Vérifier les types**

Run : `npx tsc --noEmit`
Expected : aucune erreur

- [ ] **Step 4 : Commit**

```bash
git add components/roue/ParticipantsDrawer.*
git commit -m "feat: panneau Participants en 2 colonnes avec ajout rapide depuis l'historique"
```

---

### Task 11 : Assemblage `NameWheelApp` et remplacement de la page

**Files :**
- Create : `components/roue/NameWheelApp.tsx`, `components/roue/NameWheelApp.module.css`
- Rewrite : `app/page.tsx`

**Interfaces :**
- Consumes : toutes les tâches précédentes
- Produces : `<NameWheelApp />`, la page complète, au même niveau fonctionnel que l'ancienne page.

- [ ] **Step 1 : `components/roue/NameWheelApp.module.css`**

```css
.app {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100dvh;
  overflow: hidden;
  background: var(--rn-bg);
  transition: --win 1.2s ease, --win-ink 1.2s ease;
}
.stage {
  position: relative;
  z-index: 1;
  display: grid;
  flex: 1;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: 56px;
  align-items: center;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 32px 64px;
}
.stageSingle { grid-template-columns: minmax(0, 1fr); }
.drawCol { display: flex; flex-direction: column; align-items: center; gap: 24px; }
.drawArea { position: relative; display: grid; place-items: center; isolation: isolate; }
.glow {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: -1;
  width: 170%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(closest-side, var(--win) 0%, color-mix(in srgb, var(--win) 50%, transparent) 55%, transparent 100%);
  opacity: 0;
  transform: translate(-50%, -50%);
  transition: opacity 1s ease;
  pointer-events: none;
}
.won .glow { opacity: 1; }

@media (max-width: 1024px) {
  .stage { grid-template-columns: minmax(0, 1fr); gap: 32px; padding: 24px 16px 40px; }
}
```

- [ ] **Step 2 : `components/roue/NameWheelApp.tsx`**

```tsx
"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import { useDraw } from "@/hooks/useDraw"
import { useNameFact } from "@/hooks/useNameFact"
import { useNameHistory } from "@/hooks/useNameHistory"
import { useNamesUrlState } from "@/hooks/useNamesUrlState"
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion"
import { useSessionLog } from "@/hooks/useSessionLog"
import { useSpeakingTimer } from "@/hooks/useSpeakingTimer"
import { burstConfetti } from "@/lib/confetti"
import { mergeNames, nameKey, removeName, type DisplayMode } from "@/lib/names"
import { PASTELS, colorsFor } from "@/lib/palette"
import { cn } from "@/lib/utils"
import { AppHeader } from "./AppHeader"
import { AuraBackground } from "./AuraBackground"
import { GridView } from "./GridView"
import { ModeSwitch } from "./ModeSwitch"
import { ParticipantsDrawer } from "./ParticipantsDrawer"
import { ResultPanel } from "./ResultPanel"
import { SpinButton } from "./SpinButton"
import { StarView } from "./StarView"
import { WheelView } from "./WheelView"
import styles from "./NameWheelApp.module.css"

const MODE_TARGET: Record<DisplayMode, string> = { wheel: "la roue", grid: "la grille", star: "l'étoile" }

function isInteractiveTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    target.closest("input, textarea, select, button, a, [contenteditable='true'], [role='radio'], [role='tab']") !== null
  )
}

export function NameWheelApp() {
  const { names, mode, setNames, setMode } = useNamesUrlState()
  const colors = useMemo(() => colorsFor(names), [names])
  const reducedMotion = usePrefersReducedMotion()
  const history = useNameHistory(names)
  const { recordAdded, lastList } = history
  const timer = useSpeakingTimer()
  const { start: startTimer, reset: resetTimer, read: readTimer } = timer
  const log = useSessionLog()
  const { record } = log
  const [selected, setSelected] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const appRef = useRef<HTMLDivElement>(null)
  const drawAreaRef = useRef<HTMLDivElement>(null)
  const fact = useNameFact(selected)

  const handleLanded = useCallback(
    (index: number, drawn: string[]) => {
      setSelected(drawn[index])
      startTimer()
      const app = appRef.current
      const area = drawAreaRef.current
      if (!app || !area || reducedMotion) return
      const a = app.getBoundingClientRect()
      const r = area.getBoundingClientRect()
      const swatch = colorsFor(drawn)[index]
      burstConfetti(app, { x: r.left - a.left + r.width / 2, y: r.top - a.top + 12 }, [
        swatch.bg,
        swatch.ink,
        "#000091",
        ...PASTELS.map((p) => p.bg),
      ])
    },
    [startTimer, reducedMotion],
  )

  const draw = useDraw({ mode, reducedMotion, onLanded: handleLanded })
  const { start: startDraw, drawing } = draw

  const selectedIndex = selected === null ? -1 : names.findIndex((n) => nameKey(n) === nameKey(selected))
  const winnerIndex = selectedIndex >= 0 ? selectedIndex : null
  const selectedSwatch = winnerIndex !== null ? colors[winnerIndex] : null

  const launch = useCallback(() => {
    if (names.length < 2 || drawing) return
    resetTimer()
    setSelected(null)
    startDraw(names)
  }, [names, drawing, resetTimer, startDraw])

  const removeSelected = useCallback(
    (thenSpin: boolean) => {
      if (!selected) return
      record(selected, readTimer())
      resetTimer()
      const next = removeName(names, selected)
      setSelected(null)
      setNames(next)
      if (thenSpin && next.length >= 2) window.setTimeout(() => startDraw(next), 50)
    },
    [selected, names, record, readTimer, resetTimer, setNames, startDraw],
  )

  const addNames = useCallback(
    (labels: string[]) => {
      const result = mergeNames(names, labels)
      if (result.added.length > 0) {
        setNames(result.names)
        recordAdded(result.added)
      }
      return { added: result.added, duplicates: result.duplicates }
    },
    [names, setNames, recordAdded],
  )

  const removeFromDrawer = useCallback(
    (name: string) => {
      if (selected && nameKey(name) === nameKey(selected)) {
        removeSelected(false)
        return
      }
      setNames(removeName(names, name))
    },
    [selected, names, removeSelected, setNames],
  )

  const clearNames = useCallback(() => {
    resetTimer()
    setSelected(null)
    setNames([])
  }, [resetTimer, setNames])

  const resumeLastList = useCallback(() => {
    if (lastList) addNames(lastList.names)
  }, [lastList, addNames])

  const primaryRef = useRef(launch)
  useEffect(() => {
    primaryRef.current = launch
  }, [launch])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" || event.repeat || drawerOpen || isInteractiveTarget(event.target)) return
      event.preventDefault()
      primaryRef.current()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [drawerOpen])

  const winStyle = selectedSwatch
    ? ({ "--win": selectedSwatch.bg, "--win-ink": selectedSwatch.ink } as CSSProperties)
    : undefined
  const spinLabel = drawing ? "Tirage en cours…" : `${selected ? "Relancer" : "Lancer"} ${MODE_TARGET[mode]}`

  return (
    <div ref={appRef} className={cn(styles.app, selected && styles.won)} style={winStyle}>
      <AuraBackground />
      <AppHeader names={names} colors={colors} onOpenParticipants={() => setDrawerOpen(true)} />

      <main className={styles.stage}>
        <div className={styles.drawCol}>
          <ModeSwitch value={mode} onChange={setMode} disabled={drawing} />
          <div ref={drawAreaRef} className={styles.drawArea}>
            <span className={styles.glow} aria-hidden />
            {mode === "wheel" && (
              <WheelView
                names={names}
                colors={colors}
                rotation={draw.rotation}
                animate={draw.animateRotation}
                durationMs={draw.durationMs}
                spinning={drawing}
                winnerIndex={winnerIndex}
              />
            )}
            {mode === "grid" && (
              <GridView names={names} colors={colors} highlightIndex={draw.highlightIndex} winnerIndex={winnerIndex} />
            )}
            {mode === "star" && (
              <StarView names={names} colors={colors} highlightIndex={draw.highlightIndex} winnerIndex={winnerIndex} />
            )}
          </div>
          <SpinButton
            label={spinLabel}
            icon="spin"
            busy={drawing}
            disabled={names.length < 2 || drawing}
            onClick={launch}
            hint={
              names.length < 2 ? (
                "Ajoutez au moins 2 participants"
              ) : (
                <>
                  ou appuyez sur <kbd>Espace</kbd>
                </>
              )
            }
          />
        </div>

        <ResultPanel
          selectedName={selected}
          participantCount={names.length}
          drawing={drawing}
          isFinale={false}
          finalistName={null}
          timer={timer}
          fact={fact}
          onRemove={() => removeSelected(false)}
          onRemoveAndSpin={() => removeSelected(true)}
          onFinish={() => removeSelected(false)}
          onOpenParticipants={() => setDrawerOpen(true)}
        />
      </main>

      <ParticipantsDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        names={names}
        colors={colors}
        history={history}
        onAdd={addNames}
        onRemove={removeFromDrawer}
        onClear={clearNames}
        onResumeLastList={resumeLastList}
      />
    </div>
  )
}
```

- [ ] **Step 3 : Réécrire `app/page.tsx`**

```tsx
import { Suspense } from "react"
import { NameWheelApp } from "@/components/roue/NameWheelApp"

export default function Page() {
  return (
    <Suspense fallback={null}>
      <NameWheelApp />
    </Suspense>
  )
}
```

- [ ] **Step 4 : Vérifier les types, les tests et le build**

Run : `npm test && npx tsc --noEmit && npm run build`
Expected :
- les tests passent ;
- `tsc` ne signale aucune erreur ;
- le build réussit.

- [ ] **Step 5 : Parcours dans le navigateur (Playwright ou à la main) avec `npm run dev -- -p 3001`**

Ouvrir `http://localhost:3001/?names=Alice,Bruno,Chloé,David`, puis vérifier chacun des points ci-dessous :
1. L'en-tête affiche « Roue des noms », 4 avatars pastel, et les boutons « Partager » et « Thème ». Aucun « République Française ».
2. « Lancer la roue » : la roue tourne environ 4 s, le pointeur vibre, la part gagnante ressort et les autres pâlissent. Le halo et la carte prennent la couleur du gagnant, les confettis partent, le minuteur démarre seul et le nom apparaît lettre par lettre.
3. Appuyer plusieurs fois sur Espace pendant la rotation : **un seul** tirage (Review Focus n° 4). Double-cliquer sur « Retirer et relancer » : un seul nom est retiré.
4. Les libellés de la moitié gauche se lisent à l'endroit une fois la roue arrêtée.
5. Les onglets « Le saviez-vous ? » et « Horoscope » fonctionnent, et « Pause » / « Reprendre » agissent sur le minuteur.
6. Modes Grille et Étoile : la surbrillance saute de case en case en ralentissant, puis la même révélation se produit. L'URL contient `mode=grid` ou `mode=star`.
7. Panneau « Participants » :
   - on peut ajouter « Emma, alice » et le message « alice est déjà dans la roue. » s'affiche ;
   - les noms ajoutés apparaissent ensuite dans « Déjà utilisés » après un rechargement ;
   - « Vider », puis la carte « Reprendre la dernière liste » s'affiche ;
   - `Échap` ferme le panneau et le focus revient sur le bouton qui l'a ouvert.
8. Ajouter un nom, puis utiliser Précédent et Suivant du navigateur : la roue suit l'URL. Recharger `?names=A,B` ne crée pas d'entrée d'historique supplémentaire (Review Focus n° 5).
9. Le bouton « Thème » passe en sombre DSFR. Après un rechargement, l'app reste en sombre. Revenir en clair et vérifier qu'un système en mode sombre ne force pas le sombre.
10. Largeur 375 px : une seule colonne, pas de défilement horizontal, en-tête compact.

Si un point échoue, corriger avant de commiter.

- [ ] **Step 6 : Commit**

```bash
git add components/roue/NameWheelApp.* app/page.tsx
git commit -m "feat: nouvelle page Roue des noms (scène DSFR pastel) en remplacement de l'ancienne"
```

---

### Task 12 : Finale du dernier participant et récap du tour de table

**Files :**
- Create : `components/roue/FinaleView.tsx`, `FinaleView.module.css`, `RecapView.tsx`, `RecapView.module.css`
- Modify : `lib/confetti.ts` (ajout de `rainConfetti`)
- Rewrite : `components/roue/NameWheelApp.tsx` (version complète ci-dessous)

**Interfaces :**
- Consumes : `PassEntry`, `sessionStats`, `formatDuration`, `SPEAKING_LIMIT_MS` (tâche 5), `createConfettiPiece` (tâche 8)
- Produces :
  - `<FinaleView name swatch stage="ready"|"spinning"|"revealed" />`
  - `<RecapView entries onReplay onNewList />`
  - `rainConfetti(container, colors, durationMs?, perSecond?): () => void`
  - `FINALE_SPIN_MS = 1200` (exporté par `FinaleView.tsx`)

- [ ] **Step 1 : Ajouter `rainConfetti` à la fin de `lib/confetti.ts`**

```ts
/** Pluie de confettis depuis le haut du conteneur pendant `durationMs`. Renvoie une fonction d'arrêt. */
export function rainConfetti(container: HTMLElement, colors: readonly string[], durationMs = 3000, perSecond = 40): () => void {
  if (typeof container.animate !== "function") return () => {}
  const timers: number[] = []
  const total = Math.round((durationMs / 1000) * perSecond)
  for (let k = 0; k < total; k++) {
    timers.push(
      window.setTimeout(() => {
        const width = container.clientWidth
        const height = container.clientHeight
        const piece = createConfettiPiece(container, colors[k % colors.length], k)
        const x = Math.random() * width
        const drift = (Math.random() - 0.5) * 160
        const animation = piece.animate(
          [
            { transform: `translate(${x}px, -20px) rotate(0deg)`, opacity: 1 },
            { transform: `translate(${x + drift}px, ${height + 20}px) rotate(${Math.random() * 720}deg)`, opacity: 0.9 },
          ],
          { duration: 2200 + Math.random() * 1200, easing: "linear" },
        )
        animation.onfinish = () => piece.remove()
        animation.oncancel = () => piece.remove()
      }, (k / total) * durationMs),
    )
  }
  return () => timers.forEach((id) => window.clearTimeout(id))
}
```

- [ ] **Step 2 : `components/roue/FinaleView.tsx` et son CSS**

```tsx
import type { CSSProperties } from "react"
import type { Swatch } from "@/lib/palette"
import { cn } from "@/lib/utils"
import styles from "./FinaleView.module.css"

export const FINALE_SPIN_MS = 1200

type Props = { name: string; swatch: Swatch; stage: "ready" | "spinning" | "revealed" }

export function FinaleView({ name, swatch, stage }: Props) {
  const revealed = stage === "revealed"
  return (
    <div
      className={cn(styles.finale, styles[stage])}
      style={{ "--fin-bg": swatch.bg, "--fin-ink": swatch.ink } as CSSProperties}
    >
      {revealed && <span className={styles.rays} aria-hidden />}
      <p className={styles.eyebrow}>{revealed ? "Et pour finir…" : "Dernière personne en lice"}</p>
      <div className={styles.discWrap}>
        {!revealed && (
          <svg className={styles.pointer} viewBox="0 0 30 38" aria-hidden>
            <path d="M15 37 3.2 15.5A13 13 0 1 1 26.8 15.5Z" />
            <circle cx="15" cy="13" r="4.5" />
          </svg>
        )}
        <div className={styles.disc}>
          <span className={styles.discName}>{revealed ? name.charAt(0).toUpperCase() : name}</span>
        </div>
      </div>
      {revealed && <p className={styles.bigName}>{name}</p>}
    </div>
  )
}
```

```css
/* components/roue/FinaleView.module.css */
.finale {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  width: min(420px, 86vw);
  aspect-ratio: 1;
}
.eyebrow {
  position: relative;
  z-index: 1;
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--fin-ink);
}
.discWrap { position: relative; z-index: 1; }
.discWrap::before {
  content: "";
  position: absolute;
  inset: -22px;
  border: 2px dashed color-mix(in srgb, var(--fin-ink) 35%, transparent);
  border-radius: 50%;
  animation: turn 18s linear infinite;
}
.disc {
  display: grid;
  place-items: center;
  width: min(260px, 60vw);
  aspect-ratio: 1;
  background: var(--fin-bg);
  border: 8px solid var(--rn-wheel-ring);
  border-radius: 50%;
  box-shadow: 0 0 0 1px var(--rn-border), 0 16px 30px -10px color-mix(in srgb, var(--fin-ink) 45%, transparent);
  transition: width 0.6s cubic-bezier(.3, 1.4, .5, 1);
}
.discName { padding: 0 16px; font-size: 30px; font-weight: 700; text-align: center; overflow-wrap: anywhere; color: var(--fin-ink); }
.pointer { position: absolute; top: -34px; left: 50%; z-index: 2; width: 26px; transform: translateX(-50%); }
.pointer path { fill: var(--rn-blue); }
.pointer circle { fill: var(--rn-bg); }
.spinning .disc { animation: honour 1.2s cubic-bezier(.5, 0, .2, 1); }
.revealed .discWrap::before { display: none; }
.revealed .disc {
  width: 150px;
  border-width: 6px;
  box-shadow: 0 0 0 2px var(--fin-ink), 0 20px 40px -12px color-mix(in srgb, var(--fin-ink) 55%, transparent);
  animation: medal 0.6s cubic-bezier(.3, 1.6, .5, 1);
}
.revealed .discName { font-size: 56px; }
.rays {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 150%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: repeating-conic-gradient(from 0deg, transparent 0 10deg, color-mix(in srgb, var(--fin-bg) 80%, var(--fin-ink)) 10deg 20deg);
  -webkit-mask: radial-gradient(circle, #000 20%, transparent 68%);
  mask: radial-gradient(circle, #000 20%, transparent 68%);
  opacity: 0.8;
  transform: translate(-50%, -50%);
  animation: turnCentered 30s linear infinite, raysIn 0.8s ease both;
}
.bigName {
  position: relative;
  z-index: 1;
  margin: 0;
  font-size: 40px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--fin-ink);
  animation: rise 0.5s cubic-bezier(.2, 1.2, .4, 1) 0.2s both;
}
:global(.dark) .eyebrow,
:global(.dark) .bigName { color: var(--fin-bg); }

@keyframes turn { to { transform: rotate(360deg); } }
@keyframes turnCentered {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to { transform: translate(-50%, -50%) rotate(360deg); }
}
@keyframes raysIn { from { opacity: 0; } to { opacity: 0.8; } }
@keyframes honour {
  from { transform: rotate(0deg); }
  30% { transform: rotate(-14deg); }
  to { transform: rotate(360deg); }
}
@keyframes medal { from { transform: scale(0.6); } to { transform: scale(1); } }
@keyframes rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }

@media (prefers-reduced-motion: reduce) {
  .discWrap::before, .spinning .disc, .revealed .disc, .rays, .bigName { animation: none; }
}
```

- [ ] **Step 3 : `components/roue/RecapView.tsx` et son CSS**

```tsx
import type { CSSProperties } from "react"
import { ReloadIcon } from "@radix-ui/react-icons"
import { colorsFor } from "@/lib/palette"
import { sessionStats, type PassEntry } from "@/lib/sessionLog"
import { SPEAKING_LIMIT_MS, formatDuration } from "@/lib/timer"
import { cn } from "@/lib/utils"
import styles from "./RecapView.module.css"

type Props = { entries: PassEntry[]; onReplay: () => void; onNewList: () => void }

export function RecapView({ entries, onReplay, onNewList }: Props) {
  const colors = colorsFor(entries.map((e) => e.name))
  const stats = sessionStats(entries)

  return (
    <section className={styles.recap} aria-labelledby="recap-title">
      <p className={styles.eyebrow}>Tour de table terminé</p>
      <h2 id="recap-title" className={styles.title}>
        Tout le monde est passé <span aria-hidden>🎉</span>
      </h2>
      <dl className={styles.stats}>
        <div className={styles.stat}>
          <dt>participants</dt>
          <dd>{stats.count}</dd>
        </div>
        <div className={styles.stat}>
          <dt>durée totale</dt>
          <dd>{formatDuration(stats.totalMs)}</dd>
        </div>
        <div className={styles.stat}>
          <dt>moyenne</dt>
          <dd>{formatDuration(stats.averageMs)}</dd>
        </div>
      </dl>
      <ol className={styles.timeline} aria-label="Ordre de passage">
        {entries.map((entry, i) => {
          const over = entry.durationMs > SPEAKING_LIMIT_MS
          return (
            <li key={`${entry.name}-${i}`} className={cn(styles.row, over && styles.over)} style={{ "--i": i } as CSSProperties}>
              <span className={styles.rank}>{i + 1}</span>
              <span
                className={styles.dot}
                style={{ background: colors[i].bg, boxShadow: `inset 0 0 0 1px ${colors[i].ink}55` }}
                aria-hidden
              />
              <span className={styles.name}>{entry.name}</span>
              <span className={styles.time}>
                {formatDuration(entry.durationMs)}
                {over && <span className="sr-only"> (au-delà de 2 minutes)</span>}
              </span>
            </li>
          )
        })}
      </ol>
      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={onReplay}>
          <ReloadIcon aria-hidden />
          Rejouer avec les mêmes
        </button>
        <button type="button" className={styles.secondary} onClick={onNewList}>
          Nouvelle liste
        </button>
      </div>
    </section>
  )
}
```

```css
/* components/roue/RecapView.module.css */
.recap {
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: min(560px, 100%);
  margin: 0 auto;
  padding: 28px;
  background: var(--rn-bg);
  border: 1px solid var(--rn-border);
  box-shadow: 0 24px 40px -22px rgba(0, 0, 80, 0.25);
  animation: cardIn 0.6s cubic-bezier(.2, 1.3, .4, 1) both;
}
.eyebrow { margin: 0; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--rn-mute); }
.title { margin: -10px 0 0; font-size: 28px; line-height: 36px; font-weight: 700; color: var(--rn-text); }
.stats { display: grid; grid-template-columns: repeat(3, 1fr); margin: 0; border: 1px solid var(--rn-border); }
.stat { display: flex; flex-direction: column-reverse; padding: 10px 14px; }
.stat + .stat { border-left: 1px solid var(--rn-border); }
.stat dt { font-size: 12px; color: var(--rn-mute); }
.stat dd { margin: 0; font-size: 22px; font-weight: 700; font-variant-numeric: tabular-nums; color: var(--rn-text); }
.timeline { max-height: min(40vh, 360px); margin: 0; padding: 0; overflow: auto; list-style: none; }
.row {
  display: grid;
  grid-template-columns: 24px 14px 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 7px 0;
  font-size: 15px;
  color: var(--rn-text);
  border-bottom: 1px solid var(--rn-border);
  animation: rowIn 0.4s ease both;
  animation-delay: calc(0.2s + var(--i) * 0.05s);
}
.rank { font-size: 12px; text-align: right; color: var(--rn-mute); }
.dot { width: 12px; height: 12px; border-radius: 50%; }
.name { overflow-wrap: anywhere; }
.time { font-size: 14px; font-variant-numeric: tabular-nums; color: var(--rn-mute); }
.over .time { font-weight: 700; color: var(--rn-warning); }
.actions { display: flex; flex-wrap: wrap; gap: 8px; }
.primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  font: inherit;
  font-size: 15px;
  font-weight: 500;
  color: var(--rn-bg);
  background: var(--rn-blue);
  border: 0;
  cursor: pointer;
}
.primary:hover { background: var(--rn-blue-hover); }
.secondary {
  padding: 10px 20px;
  font: inherit;
  font-size: 15px;
  font-weight: 500;
  color: var(--rn-blue);
  background: var(--rn-bg);
  border: 0;
  box-shadow: inset 0 0 0 1px var(--rn-blue);
  cursor: pointer;
}

@keyframes cardIn { from { opacity: 0; transform: translateY(16px) scale(0.98); } to { opacity: 1; transform: none; } }
@keyframes rowIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: none; } }

@media (prefers-reduced-motion: reduce) {
  .recap, .row { animation: none; }
}
```

- [ ] **Step 4 : Réécrire `components/roue/NameWheelApp.tsx` (version avec finale et récap)**

Par rapport à la tâche 11, cette version ajoute :
- le type `Stage` et l'état `stage` ;
- les valeurs dérivées `finaleReady` et `inFinale` ;
- les actions `launchFinale`, `finishRound`, `replay` et `newList` ;
- l'arrêt de la pluie de confettis ;
- le rendu conditionnel de la finale et du récap.

```tsx
"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import { useDraw } from "@/hooks/useDraw"
import { useNameFact } from "@/hooks/useNameFact"
import { useNameHistory } from "@/hooks/useNameHistory"
import { useNamesUrlState } from "@/hooks/useNamesUrlState"
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion"
import { useSessionLog } from "@/hooks/useSessionLog"
import { useSpeakingTimer } from "@/hooks/useSpeakingTimer"
import { burstConfetti, rainConfetti } from "@/lib/confetti"
import { mergeNames, nameKey, removeName, type DisplayMode } from "@/lib/names"
import { PASTELS, colorsFor } from "@/lib/palette"
import { cn } from "@/lib/utils"
import { AppHeader } from "./AppHeader"
import { AuraBackground } from "./AuraBackground"
import { FINALE_SPIN_MS, FinaleView } from "./FinaleView"
import { GridView } from "./GridView"
import { ModeSwitch } from "./ModeSwitch"
import { ParticipantsDrawer } from "./ParticipantsDrawer"
import { RecapView } from "./RecapView"
import { ResultPanel } from "./ResultPanel"
import { SpinButton } from "./SpinButton"
import { StarView } from "./StarView"
import { WheelView } from "./WheelView"
import styles from "./NameWheelApp.module.css"

type Stage = "play" | "finale-spinning" | "finale" | "recap"

const MODE_TARGET: Record<DisplayMode, string> = { wheel: "la roue", grid: "la grille", star: "l'étoile" }

function isInteractiveTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    target.closest("input, textarea, select, button, a, [contenteditable='true'], [role='radio'], [role='tab']") !== null
  )
}

function confettiColors(bg: string, ink: string): string[] {
  return [bg, ink, "#000091", ...PASTELS.map((p) => p.bg)]
}

export function NameWheelApp() {
  const { names, mode, setNames, setMode } = useNamesUrlState()
  const colors = useMemo(() => colorsFor(names), [names])
  const reducedMotion = usePrefersReducedMotion()
  const history = useNameHistory(names)
  const { recordAdded, lastList } = history
  const timer = useSpeakingTimer()
  const { start: startTimer, reset: resetTimer, read: readTimer } = timer
  const log = useSessionLog()
  const { record, clear: clearLog, entries } = log
  const [selected, setSelected] = useState<string | null>(null)
  const [stage, setStage] = useState<Stage>("play")
  const [drawerOpen, setDrawerOpen] = useState(false)
  const appRef = useRef<HTMLDivElement>(null)
  const drawAreaRef = useRef<HTMLDivElement>(null)
  const stopRainRef = useRef<(() => void) | null>(null)
  const fact = useNameFact(selected)

  useEffect(() => () => stopRainRef.current?.(), [])

  const handleLanded = useCallback(
    (index: number, drawn: string[]) => {
      setSelected(drawn[index])
      startTimer()
      const app = appRef.current
      const area = drawAreaRef.current
      if (!app || !area || reducedMotion) return
      const a = app.getBoundingClientRect()
      const r = area.getBoundingClientRect()
      const swatch = colorsFor(drawn)[index]
      burstConfetti(app, { x: r.left - a.left + r.width / 2, y: r.top - a.top + 12 }, confettiColors(swatch.bg, swatch.ink))
    },
    [startTimer, reducedMotion],
  )

  const draw = useDraw({ mode, reducedMotion, onLanded: handleLanded })
  const { start: startDraw, reset: resetDraw, drawing } = draw

  const selectedIndex = selected === null ? -1 : names.findIndex((n) => nameKey(n) === nameKey(selected))
  const winnerIndex = selectedIndex >= 0 ? selectedIndex : null
  const selectedSwatch = winnerIndex !== null ? colors[winnerIndex] : null
  const finaleReady = stage === "play" && names.length === 1 && entries.length > 0 && selected === null && !drawing
  const inFinale = stage === "finale-spinning" || stage === "finale"

  const launch = useCallback(() => {
    if (names.length < 2 || drawing) return
    resetTimer()
    setSelected(null)
    startDraw(names)
  }, [names, drawing, resetTimer, startDraw])

  const launchFinale = useCallback(() => {
    if (!finaleReady) return
    const finalist = names[0]
    setStage("finale-spinning")
    window.setTimeout(
      () => {
        setStage("finale")
        setSelected(finalist)
        startTimer()
        if (appRef.current && !reducedMotion) {
          const swatch = colorsFor([finalist])[0]
          stopRainRef.current = rainConfetti(appRef.current, confettiColors(swatch.bg, swatch.ink), 3000)
        }
      },
      reducedMotion ? 0 : FINALE_SPIN_MS,
    )
  }, [finaleReady, names, startTimer, reducedMotion])

  const removeSelected = useCallback(
    (thenSpin: boolean) => {
      if (!selected) return
      record(selected, readTimer())
      resetTimer()
      const next = removeName(names, selected)
      setSelected(null)
      setNames(next)
      if (thenSpin && next.length >= 2) window.setTimeout(() => startDraw(next), 50)
    },
    [selected, names, record, readTimer, resetTimer, setNames, startDraw],
  )

  const finishRound = useCallback(() => {
    if (!selected) return
    record(selected, readTimer())
    resetTimer()
    stopRainRef.current?.()
    setNames(removeName(names, selected))
    setSelected(null)
    setStage("recap")
  }, [selected, names, record, readTimer, resetTimer, setNames])

  const replay = useCallback(() => {
    const again = mergeNames([], entries.map((e) => e.name)).names
    clearLog()
    resetDraw()
    setStage("play")
    setNames(again)
  }, [entries, clearLog, resetDraw, setNames])

  const newList = useCallback(() => {
    clearLog()
    resetDraw()
    setStage("play")
    setNames([])
    setDrawerOpen(true)
  }, [clearLog, resetDraw, setNames])

  const addNames = useCallback(
    (labels: string[]) => {
      const result = mergeNames(names, labels)
      if (result.added.length > 0) {
        setNames(result.names)
        recordAdded(result.added)
      }
      return { added: result.added, duplicates: result.duplicates }
    },
    [names, setNames, recordAdded],
  )

  const removeFromDrawer = useCallback(
    (name: string) => {
      if (selected && nameKey(name) === nameKey(selected)) {
        if (stage === "finale") finishRound()
        else removeSelected(false)
        return
      }
      setNames(removeName(names, name))
    },
    [selected, stage, names, finishRound, removeSelected, setNames],
  )

  const clearNames = useCallback(() => {
    resetTimer()
    setSelected(null)
    setNames([])
  }, [resetTimer, setNames])

  const resumeLastList = useCallback(() => {
    if (lastList) addNames(lastList.names)
  }, [lastList, addNames])

  const primary = finaleReady ? launchFinale : launch
  const primaryRef = useRef(primary)
  useEffect(() => {
    primaryRef.current = stage === "play" ? primary : () => {}
  }, [primary, stage])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" || event.repeat || drawerOpen || isInteractiveTarget(event.target)) return
      event.preventDefault()
      primaryRef.current()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [drawerOpen])

  const winStyle = selectedSwatch
    ? ({ "--win": selectedSwatch.bg, "--win-ink": selectedSwatch.ink } as CSSProperties)
    : undefined
  const spinLabel = finaleReady
    ? "Lancer la finale"
    : drawing
      ? "Tirage en cours…"
      : `${selected ? "Relancer" : "Lancer"} ${MODE_TARGET[mode]}`
  const spinHint = finaleReady ? (
    <>
      Dernière personne en lice · <kbd>Espace</kbd>
    </>
  ) : names.length < 2 ? (
    "Ajoutez au moins 2 participants"
  ) : (
    <>
      ou appuyez sur <kbd>Espace</kbd>
    </>
  )

  return (
    <div ref={appRef} className={cn(styles.app, selected && styles.won)} style={winStyle}>
      <AuraBackground />
      <AppHeader names={names} colors={colors} onOpenParticipants={() => setDrawerOpen(true)} />

      <main className={cn(styles.stage, stage === "recap" && styles.stageSingle)}>
        {stage === "recap" ? (
          <RecapView entries={entries} onReplay={replay} onNewList={newList} />
        ) : (
          <>
            <div className={styles.drawCol}>
              <ModeSwitch value={mode} onChange={setMode} disabled={drawing || inFinale} />
              <div ref={drawAreaRef} className={styles.drawArea}>
                <span className={styles.glow} aria-hidden />
                {finaleReady || inFinale ? (
                  <FinaleView
                    name={names[0] ?? selected ?? ""}
                    swatch={colors[0] ?? PASTELS[0]}
                    stage={stage === "finale" ? "revealed" : stage === "finale-spinning" ? "spinning" : "ready"}
                  />
                ) : (
                  <>
                    {mode === "wheel" && (
                      <WheelView
                        names={names}
                        colors={colors}
                        rotation={draw.rotation}
                        animate={draw.animateRotation}
                        durationMs={draw.durationMs}
                        spinning={drawing}
                        winnerIndex={winnerIndex}
                      />
                    )}
                    {mode === "grid" && (
                      <GridView names={names} colors={colors} highlightIndex={draw.highlightIndex} winnerIndex={winnerIndex} />
                    )}
                    {mode === "star" && (
                      <StarView names={names} colors={colors} highlightIndex={draw.highlightIndex} winnerIndex={winnerIndex} />
                    )}
                  </>
                )}
              </div>
              {stage === "play" && (
                <SpinButton
                  label={spinLabel}
                  icon={finaleReady ? "finale" : "spin"}
                  busy={drawing}
                  pulse={finaleReady}
                  disabled={!finaleReady && (names.length < 2 || drawing)}
                  onClick={primary}
                  hint={spinHint}
                />
              )}
            </div>

            <ResultPanel
              selectedName={selected}
              participantCount={names.length}
              drawing={drawing || stage === "finale-spinning"}
              isFinale={stage === "finale"}
              finalistName={finaleReady ? names[0] : null}
              timer={timer}
              fact={fact}
              onRemove={() => removeSelected(false)}
              onRemoveAndSpin={() => removeSelected(true)}
              onFinish={finishRound}
              onOpenParticipants={() => setDrawerOpen(true)}
            />
          </>
        )}
      </main>

      <ParticipantsDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        names={names}
        colors={colors}
        history={history}
        onAdd={addNames}
        onRemove={removeFromDrawer}
        onClear={clearNames}
        onResumeLastList={resumeLastList}
      />
    </div>
  )
}
```

- [ ] **Step 5 : Vérifier**

Run : `npm test && npx tsc --noEmit && npm run build`
Expected : les tests passent, `tsc` ne signale aucune erreur et le build réussit.

- [ ] **Step 6 : Parcours dans le navigateur avec `?names=Alice,Bruno,Chloé`**

1. Tirer, puis « Retirer et relancer », puis tirer et « Retirer X ». Il reste 1 nom : la roue devient un disque à sa couleur, le bouton « Lancer la finale » pulse, et le panneau dit « Plus qu'une personne ».
2. Appuyer sur Espace ou cliquer : le disque fait un tour d'honneur, puis les rayons et le médaillon apparaissent avec « Et pour finir… » et la pluie de confettis. Le minuteur démarre.
3. « Terminer le tour de table » : le récap affiche 3 participants, la durée totale, la moyenne et l'ordre de passage, avec les durées supérieures à 2:00 en orange.
4. « Rejouer avec les mêmes » remet les 3 noms dans la roue. « Nouvelle liste » vide la roue et ouvre le panneau.
5. Charger `?names=Alice` directement : aucune finale, l'état indique « Ajoutez des participants pour commencer ».

**Réglage en live de l'incitation à cliquer :** montrer l'état ① à l'utilisateur et ajuster le texte d'aide, la pulsation (`SpinButton.module.css`, `.pulse`) ou l'anneau en pointillés (`FinaleView.module.css`) selon ses retours, avant de commiter.

- [ ] **Step 7 : Commit**

```bash
git add lib/confetti.ts components/roue/FinaleView.* components/roue/RecapView.* components/roue/NameWheelApp.tsx
git commit -m "feat: finale du dernier participant et récap du tour de table"
```

---

### Task 13 : Intro animée (pictogramme → roue)

**Files :**
- Create : `components/roue/IntroSplash.tsx`, `components/roue/IntroSplash.module.css`
- Modify : `components/roue/NameWheelApp.tsx`, `components/roue/NameWheelApp.module.css`

**Interfaces :**
- Consumes : `WheelMark` (attributs `data-mark-*`), et `svgRef` de `WheelView`
- Produces : `<IntroSplash targetRef ringRatio onReveal onSettle onExited />`
  - `onReveal` : l'interface commence à apparaître (420 ms après le début du FLIP) ;
  - `onSettle` : le pictogramme est posé, la vraie roue peut apparaître en fondu ;
  - `onExited` : le splash peut être démonté.
  - Le saut de l'intro (bouton ou `Échap`) et `prefers-reduced-motion` appellent les trois callbacks immédiatement.

- [ ] **Step 1 : `components/roue/IntroSplash.module.css`**

```css
.splash { position: fixed; inset: 0; z-index: 30; display: grid; place-items: center; pointer-events: none; }
.mark { display: flex; flex-direction: column; align-items: center; gap: 20px; }
.markSvg { overflow: visible; }
.markSvg [data-mark-part],
.markSvg [data-mark-ring],
.markSvg [data-mark-hub] { opacity: 0; }
.word {
  display: flex;
  margin: 0;
  overflow: hidden;
  font-size: 34px;
  line-height: 44px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--rn-text);
}
.letter { display: inline-block; transform: translateY(105%); }
.tag { margin: 0; font-size: 15px; color: var(--rn-mute); opacity: 0; }
.skip {
  position: fixed;
  right: 24px;
  bottom: 20px;
  z-index: 31;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  color: var(--rn-blue);
  background: color-mix(in srgb, var(--rn-bg) 90%, transparent);
  border: 1px solid var(--rn-blue);
  cursor: pointer;
}
.skip kbd { padding: 0 4px; font-family: inherit; font-size: 11px; color: var(--rn-mute); border: 1px solid var(--rn-border); }
```

- [ ] **Step 2 : `components/roue/IntroSplash.tsx`**

```tsx
"use client"

import { useEffect, useRef, type RefObject } from "react"
import { TrackNextIcon } from "@radix-ui/react-icons"
import { WheelMark } from "./WheelMark"
import styles from "./IntroSplash.module.css"

const MARK_SIZE = 132
const WORD = "Roue des noms"

type Props = {
  targetRef: RefObject<Element | null>
  /** Diamètre de l'anneau cible / largeur de l'élément cible (412/420 pour la roue). */
  ringRatio: number
  onReveal: () => void
  onSettle: () => void
  onExited: () => void
}

export function IntroSplash({ targetRef, ringRatio, onReveal, onSettle, onExited }: Props) {
  const markRef = useRef<SVGSVGElement>(null)
  const wordRef = useRef<HTMLParagraphElement>(null)
  const tagRef = useRef<HTMLParagraphElement>(null)
  const callbacks = useRef({ onReveal, onSettle, onExited })
  const skipRef = useRef<() => void>(() => {})

  useEffect(() => {
    callbacks.current = { onReveal, onSettle, onExited }
  })

  useEffect(() => {
    const animations: Animation[] = []
    const timers: number[] = []
    let finished = false

    const animate = (el: Element | null, keyframes: Keyframe[], options: KeyframeAnimationOptions) => {
      if (!el) return null
      const animation = el.animate(keyframes, { fill: "both", ...options })
      animations.push(animation)
      return animation
    }
    const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms))
    const finish = () => {
      if (finished) return
      finished = true
      animations.forEach((a) => a.cancel())
      timers.forEach((id) => window.clearTimeout(id))
      callbacks.current.onReveal()
      callbacks.current.onSettle()
      callbacks.current.onExited()
    }
    skipRef.current = finish

    const mark = markRef.current
    if (!mark || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish()
      return
    }

    // 1. Les parts se déploient en spirale, puis l'anneau et le moyeu
    mark.querySelectorAll("[data-mark-part]").forEach((part, i) =>
      animate(
        part,
        [
          { transform: "rotate(-60deg) scale(0)", opacity: 0 },
          { transform: "rotate(0deg) scale(1.06)", opacity: 1, offset: 0.7 },
          { transform: "rotate(0deg) scale(1)", opacity: 1 },
        ],
        { duration: 520, delay: 60 + i * 45, easing: "cubic-bezier(.2,.9,.3,1.2)" },
      ),
    )
    animate(mark.querySelector("[data-mark-ring]"), [{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: 520 })
    animate(mark.querySelector("[data-mark-hub]"), [{ opacity: 0, transform: "scale(0)" }, { opacity: 1, transform: "scale(1)" }], {
      duration: 300,
      delay: 560,
      easing: "cubic-bezier(.3,1.6,.5,1)",
    })

    // 2. Le nom monte lettre par lettre, puis le sous-titre
    wordRef.current?.querySelectorAll("[data-letter]").forEach((letter, k) =>
      animate(letter, [{ transform: "translateY(105%)" }, { transform: "translateY(0)" }], {
        duration: 420,
        delay: 520 + k * 26,
        easing: "cubic-bezier(.2,1.1,.4,1)",
      }),
    )
    animate(tagRef.current, [{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 400, delay: 860 })

    // 3. Tour d'élan
    animate(mark, [{ transform: "rotate(0deg)" }, { transform: "rotate(-12deg)", offset: 0.25 }, { transform: "rotate(360deg)" }], {
      duration: 800,
      delay: 1050,
      easing: "cubic-bezier(.5,0,.2,1)",
    })
    later(() => {
      animate(wordRef.current, [{ opacity: 1 }, { opacity: 0, transform: "translateY(8px)" }], { duration: 250 })
      animate(tagRef.current, [{ opacity: 1 }, { opacity: 0 }], { duration: 200 })
    }, 1300)

    // 4. FLIP : le pictogramme se pose exactement sur la roue
    later(() => {
      const target = targetRef.current
      if (!target) {
        finish()
        return
      }
      const from = mark.getBoundingClientRect()
      const to = target.getBoundingClientRect()
      const scale = (to.width * ringRatio) / ((MARK_SIZE * 38) / 40)
      const dx = to.left + to.width / 2 - (from.left + from.width / 2)
      const dy = to.top + to.height / 2 - (from.top + from.height / 2)
      const move = animate(
        mark,
        [
          { transform: "translate(0px, 0px) scale(1) rotate(360deg)" },
          { transform: `translate(${dx}px, ${dy}px) scale(${scale}) rotate(360deg)` },
        ],
        { duration: 700, easing: "cubic-bezier(.6,0,.15,1)" },
      )
      later(() => callbacks.current.onReveal(), 420)
      if (move) {
        move.onfinish = () => {
          if (finished) return
          callbacks.current.onSettle()
          const fade = animate(mark, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: "forwards" })
          if (fade) fade.onfinish = finish
        }
      }
    }, 1860)

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      animations.forEach((a) => a.cancel())
      timers.forEach((id) => window.clearTimeout(id))
    }
  }, [targetRef, ringRatio])

  return (
    <>
      <div className={styles.splash} aria-hidden>
        <div className={styles.mark}>
          <WheelMark ref={markRef} size={MARK_SIZE} className={styles.markSvg} />
          <p ref={wordRef} className={styles.word}>
            {[...WORD].map((char, i) => (
              <span key={i} data-letter className={styles.letter}>
                {char === " " ? " " : char}
              </span>
            ))}
          </p>
          <p ref={tagRef} className={styles.tag}>
            Tirage au sort pour vos rituels d'équipe
          </p>
        </div>
      </div>
      <button type="button" className={styles.skip} onClick={() => skipRef.current()}>
        <TrackNextIcon aria-hidden />
        Passer l'intro <kbd>Échap</kbd>
      </button>
    </>
  )
}
```

- [ ] **Step 3 : Ajouter les styles de révélation à la fin de `NameWheelApp.module.css`**

```css
/* Intro : l'interface reste cachée puis apparaît en décalé */
.reveal {
  position: relative;
  z-index: 2;
  transition: opacity 0.5s ease var(--d, 0s), transform 0.6s cubic-bezier(.2, 1, .3, 1) var(--d, 0s);
}
.pre .reveal { opacity: 0; pointer-events: none; }
.pre .fromTop { transform: translateY(-16px); }
.pre .fromBottom { transform: translateY(14px); }
.pre .fromRight { transform: translateX(30px); }
.view { transition: opacity 0.35s ease; }
.hideView .view { opacity: 0; }
```

- [ ] **Step 4 : Modifier `components/roue/NameWheelApp.tsx`**

4a. Imports : ajouter `IntroSplash`.

```tsx
import { IntroSplash } from "./IntroSplash"
```

4b. Juste après `const stopRainRef = useRef<(() => void) | null>(null)`, donc **après** la déclaration de `drawAreaRef` (sinon `introTargetRef` lirait une constante pas encore déclarée), ajouter l'état de l'intro et la référence de la roue :

```tsx
  const [intro, setIntro] = useState<"playing" | "revealing" | "settled" | "done">("playing")
  const wheelSvgRef = useRef<SVGSVGElement>(null)
  const introTargetRef = mode === "wheel" ? wheelSvgRef : drawAreaRef
  const onIntroReveal = useCallback(() => setIntro((s) => (s === "playing" ? "revealing" : s)), [])
  const onIntroSettle = useCallback(() => setIntro((s) => (s === "playing" || s === "revealing" ? "settled" : s)), [])
  const onIntroExited = useCallback(() => setIntro("done"), [])
  const introActive = intro === "playing" || intro === "revealing"
```

4c. Rendre la barre d'espace inactive pendant l'intro. Remplacer l'effet `primaryRef` par :

```tsx
  useEffect(() => {
    primaryRef.current = stage === "play" && !introActive ? primary : () => {}
  }, [primary, stage, introActive])
```

4d. Dans le JSX :
- l'élément racine reçoit les classes `pre` et `hideView` ;
- les éléments de l'interface sont enveloppés dans des `div` de révélation, avec un délai `--d` ;
- `WheelView` reçoit `svgRef` ;
- les vues sont enveloppées dans `.view` ;
- `IntroSplash` est rendu tant que `intro !== "done"`.

Voici le `return` complet après modification :

```tsx
  return (
    <div
      ref={appRef}
      className={cn(styles.app, selected && styles.won, intro === "playing" && styles.pre, introActive && styles.hideView)}
      style={winStyle}
    >
      <AuraBackground visible={intro !== "playing"} />
      <div className={cn(styles.reveal, styles.fromTop)} style={{ "--d": "0.05s" } as CSSProperties}>
        <AppHeader names={names} colors={colors} onOpenParticipants={() => setDrawerOpen(true)} />
      </div>

      <main className={cn(styles.stage, stage === "recap" && styles.stageSingle)}>
        {stage === "recap" ? (
          <RecapView entries={entries} onReplay={replay} onNewList={newList} />
        ) : (
          <>
            <div className={styles.drawCol}>
              <div className={cn(styles.reveal, styles.fromTop)} style={{ "--d": "0.15s" } as CSSProperties}>
                <ModeSwitch value={mode} onChange={setMode} disabled={drawing || inFinale} />
              </div>
              <div ref={drawAreaRef} className={styles.drawArea}>
                <span className={styles.glow} aria-hidden />
                <div className={styles.view}>
                  {finaleReady || inFinale ? (
                    <FinaleView
                      name={names[0] ?? selected ?? ""}
                      swatch={colors[0] ?? PASTELS[0]}
                      stage={stage === "finale" ? "revealed" : stage === "finale-spinning" ? "spinning" : "ready"}
                    />
                  ) : (
                    <>
                      {mode === "wheel" && (
                        <WheelView
                          names={names}
                          colors={colors}
                          rotation={draw.rotation}
                          animate={draw.animateRotation}
                          durationMs={draw.durationMs}
                          spinning={drawing}
                          winnerIndex={winnerIndex}
                          svgRef={wheelSvgRef}
                        />
                      )}
                      {mode === "grid" && (
                        <GridView names={names} colors={colors} highlightIndex={draw.highlightIndex} winnerIndex={winnerIndex} />
                      )}
                      {mode === "star" && (
                        <StarView names={names} colors={colors} highlightIndex={draw.highlightIndex} winnerIndex={winnerIndex} />
                      )}
                    </>
                  )}
                </div>
              </div>
              {stage === "play" && (
                <div className={cn(styles.reveal, styles.fromBottom)} style={{ "--d": "0.25s" } as CSSProperties}>
                  <SpinButton
                    label={spinLabel}
                    icon={finaleReady ? "finale" : "spin"}
                    busy={drawing}
                    pulse={finaleReady}
                    disabled={!finaleReady && (names.length < 2 || drawing)}
                    onClick={primary}
                    hint={spinHint}
                  />
                </div>
              )}
            </div>

            <div className={cn(styles.reveal, styles.fromRight)} style={{ "--d": "0.3s" } as CSSProperties}>
              <ResultPanel
                selectedName={selected}
                participantCount={names.length}
                drawing={drawing || stage === "finale-spinning"}
                isFinale={stage === "finale"}
                finalistName={finaleReady ? names[0] : null}
                timer={timer}
                fact={fact}
                onRemove={() => removeSelected(false)}
                onRemoveAndSpin={() => removeSelected(true)}
                onFinish={finishRound}
                onOpenParticipants={() => setDrawerOpen(true)}
              />
            </div>
          </>
        )}
      </main>

      <ParticipantsDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        names={names}
        colors={colors}
        history={history}
        onAdd={addNames}
        onRemove={removeFromDrawer}
        onClear={clearNames}
        onResumeLastList={resumeLastList}
      />

      {intro !== "done" && (
        <IntroSplash
          targetRef={introTargetRef}
          ringRatio={mode === "wheel" ? 412 / 420 : 0.9}
          onReveal={onIntroReveal}
          onSettle={onIntroSettle}
          onExited={onIntroExited}
        />
      )}
    </div>
  )
```

- [ ] **Step 5 : Vérifier**

Run : `npm test && npx tsc --noEmit && npm run build`
Expected : les tests passent, `tsc` ne signale aucune erreur et le build réussit.

- [ ] **Step 6 : Parcours de l'intro dans le navigateur**

1. Charger `http://localhost:3001/?names=Alice,Bruno,Chloé,David`. Sur environ 2,8 s, on doit voir :
   - les parts en spirale ;
   - « Roue des noms » lettre par lettre ;
   - le tour d'élan ;
   - le pictogramme qui se pose sur la roue ;
   - l'interface qui apparaît en décalé, puis la roue en fondu.
2. Contrôle d'alignement, à exécuter juste après le rechargement dans la console (ou avec `browser_evaluate`) :

```js
await new Promise(r => setTimeout(r, 2540));
const a = document.querySelector('[class*="markSvg"]').getBoundingClientRect();
const b = document.querySelector('svg[aria-label^="Roue avec"]').getBoundingClientRect();
console.log(Math.abs((a.left + a.width/2) - (b.left + b.width/2)) < 2, Math.abs((a.top + a.height/2) - (b.top + b.height/2)) < 2);
```

   Expected : `true true`
3. Recharger puis appuyer sur `Échap` dès le début : l'interface s'affiche immédiatement. Le bouton « Passer l'intro » fait la même chose.
4. Espace pendant l'intro : aucun tirage.
5. En mode Grille (`&mode=grid`), le pictogramme se pose sur la grille.
6. Avec l'émulation `prefers-reduced-motion: reduce` (DevTools > Rendering, ou Playwright `browser_emulate_media`) : pas d'intro, pas de confettis, aurore figée, et la roue tourne en environ 0,3 s.

- [ ] **Step 7 : Commit**

```bash
git add components/roue/IntroSplash.* components/roue/NameWheelApp.*
git commit -m "feat: intro animée — le pictogramme se transforme en roue"
```

---

### Task 14 : Finitions, documentation et vérification finale

**Files :**
- Rewrite : `CLAUDE.md`

- [ ] **Step 1 : Vérifier l'absence de reliquats**

```bash
grep -rn "lucide-react" app components/roue hooks lib || echo "OK: pas de lucide dans le nouveau code"
grep -rn "emerald\|Pilote\|République" app components/roue || echo "OK: pas de reliquat"
```

Expected : les deux commandes affichent `OK: …`

- [ ] **Step 2 : Réécrire `CLAUDE.md`**

````markdown
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
- `components/roue/NameWheelApp.tsx` orchestre l'app. Il gère :
  - l'état de jeu `stage` : `play | finale-spinning | finale | recap` ;
  - l'état de l'intro : `playing | revealing | settled | done` ;
  - le nom tiré (`selected`) et l'ouverture du panneau « Participants ».
- Vues : `WheelView` (SVG), `GridView`, `StarView`, `FinaleView`, `RecapView`, `ResultPanel`, `ParticipantsDrawer` (Radix Dialog), `IntroSplash` (Web Animations API, FLIP du pictogramme `WheelMark` vers la roue).
- Hooks (`hooks/`) :
  - `useNamesUrlState` : l'URL est la source de vérité (`?names=a,b&mode=grid`), avec `pushState` ;
  - `useDraw` : rotation de la roue ou suite de cases surlignées, avec un verrou anti-double tirage ;
  - `useSpeakingTimer` : minuteur de 2 min, qui démarre automatiquement ;
  - `useSessionLog` : ordre de passage, en mémoire uniquement ;
  - `useNameHistory` : `localStorage` `roue-des-noms:history:v1`, 30 noms maximum, et « dernière liste » ;
  - `useNameFact` et `usePrefersReducedMotion`.
- Logique pure testée (`lib/`) :
  - `names` : normalisation, déduplication, lecture et écriture de l'URL ;
  - `palette` : 8 pastels DSFR, couleur stable par nom, jamais deux voisins identiques ;
  - `geometry` et `spin` : angles en degrés, repère SVG, la part 0 est sous le pointeur au repos ;
  - `history`, `timer`, `sessionLog`.
  - Anecdotes : `lib/nameFacts/` et la route `app/api/name-fact`.

## Conventions

- Couleurs : variables `--rn-*` dans `app/globals.css`, en clair et en `.dark`. Le participant tiré est exposé dans `--win` et `--win-ink` (déclarées avec `@property`, donc animables).
- Thème clair par défaut, quel que soit le système (`enableSystem={false}`). Le bouton « Thème » passe au sombre DSFR.
- Icônes : `@radix-ui/react-icons` uniquement. `lucide-react` ne reste que pour `components/ui/`.
- **Ne pas modifier `components/ui/`** : on restyle avec les variables CSS et la config Tailwind.
- Toute animation doit respecter `prefers-reduced-motion`.
- Polices Marianne dans `app/fonts/`, extraites de `@gouvfr/dsfr@1.12.1`. Leur usage est réservé aux services de l'État.
````

- [ ] **Step 3 : Vérification complète**

Run : `npm test && npx tsc --noEmit && npm run build`
Expected : tous les tests passent, `tsc` ne signale aucune erreur et le build réussit.

Puis refaire, d'un seul trait, les parcours des tâches 11 (étape 5), 12 (étape 6) et 13 (étape 6), en mode clair puis en mode sombre, à 1280 px puis à 375 px. Noter tout écart et le corriger avant le commit.

- [ ] **Step 4 : Commit**

```bash
git add CLAUDE.md
git commit -m "docs: CLAUDE.md à jour pour la nouvelle architecture"
```
