# Roue des noms

Application Next.js de roue interactive qui sélectionne un prénom aléatoirement.

## Commandes

```bash
npm run dev      # serveur de dev (port 3001)
npm run build    # build de prod
npm start        # serveur de prod
npm run lint     # lint
```

## Feature « Le saviez-vous ? »

Quand un prénom est sélectionné, l'application affiche une anecdote aléatoire issue de trois sources :

- **Behind the Name** — origine, signification, variantes, diminutifs, formes féminines/masculines.
- **Wikipédia (FR)** — extrait introductif de l'article du prénom.
- **INSEE / data.gouv.fr** — statistiques de naissances sur les 40 dernières années (via OpenDataSoft).

### Variables d'environnement

Crée un fichier `.env.local` à la racine :

```
BTN_API_KEY=ta_cle_behind_the_name
```

Sans cette clé, Behind the Name est ignoré silencieusement et l'app continue avec Wikipédia + INSEE.

### Endpoint

```
GET /api/name-fact?name=Antoine
```

Réponse :

```json
{
  "name": "Antoine",
  "fact": "En 1992, 6 245 enfants ont été appelés Antoine en France.",
  "totalFacts": 87
}
```

### Architecture

```
lib/nameFacts/
├── types.ts                # interfaces TS
├── normalize.ts            # normalisation (accents, tirets, formatage nombres)
├── fetchBehindTheName.ts   # appel API Behind the Name
├── fetchWikipedia.ts       # appel MediaWiki API
├── fetchFrenchStats.ts     # appel OpenDataSoft (dataset INSEE)
├── buildFacts.ts           # agrégation des anecdotes en string[]
├── getRandomFact.ts        # tirage aléatoire uniforme
└── getNameFact.ts          # orchestration + cache (unstable_cache, 7 jours)

app/api/name-fact/route.ts  # endpoint GET
```

Les trois sources sont appelées en parallèle avec `Promise.allSettled` : si une source échoue, les autres continuent. Le résultat est mis en cache 7 jours via `unstable_cache` de Next.js.
