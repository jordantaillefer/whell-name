# Refonte UI « Roue des noms » — style DSFR + pastel

Date : 2026-10-14
Statut : validé en brainstorming, en attente de relecture

## 1. Intention

Rendre l'app utilisable par n'importe quel service de l'État : une interface qui suit les codes visuels du DSFR (Système de Design de l'État), accessible (RGAA), avec un vrai « effet wow » (intro animée, tirage mis en scène, finale), **sans changer le concept** : liste de noms partageable par URL, trois modes de tirage (roue, grille, étoile), minuteur de 2 min, « Le saviez-vous ? » et horoscope du prénom.

**Critère de réussite** : un agent de n'importe quel ministère ouvre l'app et la perçoit comme un outil sérieux, cohérent avec les sites `.gouv.fr`, agréable à projeter en réunion, sans perte de fonctionnalité.

### Décisions prises

| Sujet | Décision |
|---|---|
| Identité | Titre « Roue des noms » seul. **Pas** de bloc-marque « République Française », pas de Marianne, pas de nom de projet (« Pilote » disparaît). |
| Intégration DSFR | **Pas de bibliothèque DSFR** (`@codegouvfr/react-dsfr`, `@gouvfr/dsfr` exclus). On garde shadcn/Tailwind, restylés avec les règles DSFR (couleurs, typo, formes, focus). |
| Thème | **Clair par défaut, quel que soit le système.** Bouton en en-tête pour passer au mode sombre DSFR ; choix mémorisé. |
| Icônes | `@radix-ui/react-icons` remplace `lucide-react` partout. |
| Disposition | « Scène centrale » : roue au centre, résultat à droite, participants dans un panneau latéral. |
| Couleurs | Pastels de la palette illustrative DSFR, **une couleur par participant**. Le bleu France reste réservé aux actions. |
| Intro | Pictogramme mini-roue pastel qui se transforme en roue. Jouée à chaque chargement, passable. |
| Historique | Noms des sessions précédentes conservés en `localStorage`, proposés en ajout rapide. |
| Dernier participant | Finale dédiée + récap du tour de table. L'incitation à cliquer sera réglée en live. |

Maquettes de référence (non versionnées) : `.superpowers/brainstorm/6348-1791979630/content/` — `pastel-wow.html` (scène + tirage), `intro.html`, `finale.html` (finale, récap, panneau en 2 colonnes).

## 2. Fondations visuelles

### Couleurs (variables CSS dans `app/globals.css`)

On remplace les variables shadcn par les valeurs DSFR ; les composants `components/ui/` s'adaptent sans être modifiés.

| Rôle | Clair | Sombre (DSFR) |
|---|---|---|
| Action principale (`--primary`) | bleu France `#000091` | `#8585F6` |
| Survol action | `#1212FF` | `#ADADF9` |
| Fond | `#FFFFFF` | `#161616` |
| Fond alternatif | `#F6F6F6` | `#1E1E1E` |
| Fond contrasté (champs) | `#EEEEEE` | `#242424` |
| Bordure | `#DDDDDD` | `#3A3A3A` |
| Texte | `#161616` | `#CECECE` |
| Texte secondaire | `#666666` | `#929292` |
| Erreur / destructive | rouge Marianne `#E1000F` | `#FF5655` |
| Succès | `#18753C` | `#27A658` |
| Avertissement | `#B34000` | `#FC5D00` |
| Bleu clair (accents) | `#E3E3FD` / `#F5F5FE` | `#21213F` / `#1B1B35` |

### Palette pastel des participants (`lib/palette.ts`)

Chaque entrée = `{ bg, ink }`. Le texte `ink` sur `bg` doit avoir un contraste ≥ 4,5:1 (vérifié par un test).

| Nom | bg | ink |
|---|---|---|
| bleu | `#E3E3FD` | `#000091` |
| menthe | `#C3FAD5` | `#1F5C3A` |
| tuile | `#FEE9E5` | `#8D3A2B` |
| tilleul | `#FEF7DA` | `#5E5A2A` |
| glycine | `#FEE7FC` | `#6E445A` |
| archipel | `#C7F6FC` | `#00585E` |
| café crème | `#F7EBE5` | `#6B4532` |
| cumulus | `#E6EEFE` | `#2F3E66` |

En mode sombre, on garde les mêmes pastels pour la roue (ce sont des « objets » colorés), mais sur fond sombre.

**Attribution** : `colorsFor(names: string[]): Palette[]`
1. Index de départ = hash stable du nom normalisé (minuscules, sans accents) modulo 8.
2. Si la couleur est identique à celle du voisin précédent (et, pour le dernier, du premier), on prend la suivante libre.
3. Résultat déterministe pour une liste donnée : même personne, même couleur d'une session à l'autre et dans les trois modes.

### Typographie

- Police **Marianne** (Light 300, Regular 400, Medium 500, Bold 700, ExtraBold 800), en `woff2` dans `public/fonts/`, chargée via `next/font/local` ; repli `Arial, sans-serif`.
- Échelle DSFR dans `tailwind.config.ts` (`xs` 12/20, `sm` 14/24, `base` 16/24, `lg` 18/28, `xl` 20/28, `2xl` 22/28, `3xl` 28/36, `4xl` 32/40, `5xl` 40/48, `display` 46/52).

### Formes et interactions

- `--radius: 0` : coins carrés (exceptions volontaires : roue, pastilles, puces d'historique, avatars).
- Focus DSFR : `outline: 2px solid #0A76F6; outline-offset: 2px` sur tous les éléments focusables.
- Champs : fond `#EEEEEE`, coins supérieurs arrondis à 4px, bordure basse 2px `#3A3A3A`.
- Boutons : primaire plein bleu France, secondaire contour 1px bleu France, tertiaire texte bleu.
- Espacements sur grille de 8px.

## 3. Structure de la page

```
┌────────────────────────────────────────────────────────────────┐
│ [picto] Roue des noms                Participants ●●●+2 │ Partager │ Thème │
│         Tirage au sort pour vos rituels d'équipe                │
├────────────────────────────────────────────────────────────────┤
│  (fond « aurore » pastel)                                       │
│        [ Roue | Grille | Étoile ]                               │
│              ▼                         ┌──────────────────────┐ │
│          ( ROUE )                      │ AU TOUR DE           │ │
│                                        │ Chloé                │ │
│                                        │ Temps de parole 1:26 │ │
│      [ Lancer la roue ]                │ ▓▓▓▓▓▓▓░░░           │ │
│      ou appuyez sur Espace             │ Le saviez-vous ? |   │ │
│                                        │ Horoscope            │ │
│                                        │ [Pause][Retirer et…] │ │
│                                        └──────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

- **En-tête** (`AppHeader`) : pictogramme, titre, sous-titre ; à droite les boutons tertiaires « Participants » (avec les avatars pastel des 6 premiers, puis `+N`), « Partager » (copie l'URL, confirmation via toast `sonner`), « Thème ».
- **Scène** : grille 2 colonnes (`1fr` / `380px`). En dessous de 1024px, une seule colonne : la roue, puis le résultat. Sur mobile, la roue fait ~min(90vw, 420px).
- **Fond « aurore »** (`AuraBackground`) : 4 taches pastel floutées qui dérivent lentement (20 à 30 s) ; un halo de la couleur du gagnant apparaît derrière la roue après un tirage.
- **Sélecteur de mode** (`ModeSwitch`) : contrôle segmenté, l'option active est en bleu plein. Il est désactivé pendant une animation. Il reste synchronisé avec `?mode=`.
- **Bouton de tirage** (`SpinButton`) : primaire, grande taille ; libellé « Lancer la roue », puis « Relancer la roue » après un tirage ; « Lancer la grille » / « Lancer l'étoile » selon le mode. Raccourci **Espace**, sauf si le focus est dans un champ ou si le panneau est ouvert. Désactivé s'il y a moins de 2 noms, avec le message « Ajoutez au moins 2 participants ».
- **État vide** : s'il y a moins de 2 noms, la zone de résultat affiche « Ajoutez des participants pour commencer » et un bouton qui ouvre le panneau.

## 4. Roue et tirage

### Rendu (`WheelView`)

- SVG (remplace le `conic-gradient` actuel). Parts pastel séparées par un liseré blanc de 3px, anneau extérieur blanc et bordure `#DDDDDD`, moyeu blanc à point bleu France, ombre douce.
- Noms radiaux, à 64 % du rayon, dans la couleur `ink` ; taille 18px jusqu'à 8 noms, puis 15px jusqu'à 12, puis 13px. Au-delà de 16 caractères, le nom est tronqué avec une ellipse et l'attribut `title` contient le nom complet.
- **Lisibilité** : à l'arrêt, les noms qui se retrouvent sur la moitié gauche pivotent de 180° (transition de 0,45 s) pour rester à l'endroit.
- Pointeur : repère bleu France en haut, fixe. Il vibre légèrement pendant la rotation.

### Animation de tirage

1. Cible aléatoire, avec un léger décalage aléatoire à l'intérieur de la part (±30 %).
2. Rotation de 5 à 7 tours, en 4,2 s, avec l'easing `cubic-bezier(.12,.72,.1,1)`. Le calcul est dans `lib/spin.ts`, une fonction pure : `targetRotation(current, index, count, rng)`.
3. À l'arrêt :
   - la part gagnante ressort de 12px avec un contour de sa couleur `ink`, et les autres passent à 45 % d'opacité ;
   - l'app reçoit `--win` et `--win-ink`, qui teintent le halo, la carte de résultat et la barre du minuteur (transition de 1,2 s via `@property`) ;
   - les confettis partent du pointeur (`lib/confetti.ts`, environ 70 particules, Web Animations API, mélange de pastels et de bleu).
4. Comme aujourd'hui, l'angle est normalisé après l'animation pour ne pas accumuler les rotations.

### Grille (`GridView`) et étoile (`StarView`)

- Même logique de tirage qu'aujourd'hui (surbrillance qui saute de case en case puis ralentit).
- **Grille** : tuiles pastel (`bg`/`ink`). La tuile en surbrillance prend un contour bleu France de 2px et grossit légèrement (`scale(1.04)`). Le gagnant passe en couleur pleine, les autres s'estompent.
- **Étoile** : chaque branche prend la couleur pastel du participant ; on garde la pulsation actuelle. La révélation est la même que pour la roue.
- Le halo, les confettis et le panneau de résultat sont communs aux trois modes.

## 5. Panneau de résultat (`ResultPanel`)

- Avant le premier tirage, on affiche un encadré en pointillés : « Prêt pour le tirage » et le nombre de participants.
- Après un tirage :
  - **En-tête de la carte** : fond `--win`, bordure haute de 4px `--win-ink`, la mention « Au tour de » au-dessus, puis le nom en 46px ExtraBold, qui apparaît lettre par lettre.
  - **Minuteur** (`useSpeakingTimer`) : **démarre automatiquement** à la révélation. *Changement assumé : aujourd'hui il faut le lancer à la main.* Il affiche « Temps de parole » et le temps en chiffres tabulaires. La barre de progression est `--win-ink` pendant les 60 premières secondes, passe en avertissement à partir de 60 s puis en erreur à partir de 90 s (on conserve la logique vert → ambre → rouge). Le dépassement est affiché en `+0:12`.
  - **Encart contextuel** : un contrôle segmenté « Le saviez-vous ? | Horoscope ».
    - Le saviez-vous ? : contenu de `/api/name-fact` (`useNameFact`), avec un squelette pendant le chargement. L'encart est masqué si l'appel échoue.
    - Horoscope : `getDailyHoroscope`.
  - **Actions** (barre collée en bas de la carte) :
    - « Pause » / « Reprendre » (tertiaire) ;
    - « Retirer {nom} » (secondaire) ;
    - « Retirer et relancer » (primaire). Ce sont les deux actions qui existent déjà aujourd'hui (« Passer au suivant » et « Passer et tourner »), renommées.
- La carte est une zone `aria-live="polite"` : le nom tiré est annoncé aux lecteurs d'écran.

## 6. Finale et récap

### Dernier en lice (`FinaleView`)

- Quand il reste exactement 1 nom après un retrait, et que le journal de session contient au moins un passage :
  - la roue se réduit à un disque plein de la couleur du participant, avec son nom, et un anneau en pointillés qui tourne lentement ;
  - le bouton devient « Lancer la finale » (icône étoile).
- L'incitation à cliquer (pulsation du bouton, texte d'appel, etc.) sera **réglée en live** pendant l'implémentation.
- Au clic, la révélation se fait en mode projecteur : un tour d'honneur, des rayons coniques en rotation dans la couleur du participant, un médaillon avec l'initiale, la mention « Et pour finir… » et le nom en grand, puis une pluie de confettis continue pendant 3 s.
- Le minuteur et l'encart contextuel fonctionnent comme d'habitude. L'action principale devient « Terminer le tour de table ».
- Si la liste ne contient qu'un nom dès le départ (aucun passage enregistré), on garde l'état « Ajoutez au moins 2 participants ».

### Récap (`RecapView`)

- Contenu affiché :
  - le titre « Tour de table terminé », puis « Tout le monde est passé » ;
  - trois chiffres : nombre de participants, durée totale, durée moyenne ;
  - l'ordre de passage : rang, pastille de couleur, nom et durée. Les durées au-delà de 2:00 sont affichées en couleur d'avertissement.
- Actions :
  - « Rejouer avec les mêmes » : remet tous les noms du journal dans l'URL et vide le journal ;
  - « Nouvelle liste » : vide la roue et ouvre le panneau « Participants ».
- Le journal (`useSessionLog`) est conservé **en mémoire uniquement**, ni dans l'URL ni dans le `localStorage`. Chaque entrée = `{ name, durationMs }`, enregistrée au moment où le nom est retiré.

## 7. Panneau « Participants » (`ParticipantsDrawer`)

Construit directement sur `@radix-ui/react-dialog` (déjà en dépendance) : focus piégé, `Échap`, ARIA. On n'utilise pas le `Sheet` de shadcn, qui impose son propre bouton de fermeture avec une icône `lucide` et qu'on ne peut pas modifier. Il s'ouvre à droite, sur environ 760px de large ; sur mobile, il prend toute la largeur et les deux colonnes se superposent.

- **Colonne gauche, « Dans la roue (N) »** :
  - un champ « Ajouter des participants », avec l'indication « un ou plusieurs noms, séparés par des virgules », un bouton « Ajouter » et la validation avec Entrée ;
  - la liste des noms : pastille de couleur, nom, bouton « Retirer » ;
  - un lien « Vider ».
  - Les doublons sont ignorés (comparaison sans tenir compte de la casse ni des accents) et un message de champ DSFR s'affiche.
- **Colonne droite, « Déjà utilisés »** :
  - la carte « Reprendre la dernière liste » (nombre de noms et date relative), affichée **seulement si la roue est vide** et si une dernière liste existe ;
  - l'historique (`useNameHistory`) : les noms absents de la roue, triés par nombre d'utilisations décroissant puis par date. Chaque ligne a un bouton « ← » pour ajouter le nom, le compteur « N fois » et un « × » pour oublier le nom ;
  - un lien « Tout ajouter → ».
- **Pied du panneau** : « Historique conservé sur cet appareil uniquement » et un lien « Effacer l'historique », avec une confirmation via `AlertDialog`.
- Un nom ajouté apparaît avec une petite animation de glissement depuis la droite.

### Stockage de l'historique

- Clé `roue-des-noms:history:v1` → `{ names: { [normalized]: { label, count, lastUsed } }, lastList?: { names: string[], savedAt } }`.
- `count` augmente quand un nom est **ajouté à la roue**, que ce soit par saisie, depuis l'historique ou par « Reprendre ».
- `lastList` est mis à jour (avec un délai de 2 s) chaque fois que la liste dans l'URL contient au moins 2 noms.
- L'historique est plafonné à 30 noms : au-delà, on supprime le nom au `count` le plus faible puis au `lastUsed` le plus ancien.
- Toutes les lectures et écritures sont dans un `try/catch`. Si le `localStorage` est indisponible, la colonne de droite est masquée et l'app fonctionne normalement.
- Le choix de thème est stocké par `next-themes` (clé par défaut).

## 8. Intro animée (`IntroSplash`)

Jouée à chaque chargement, elle dure environ 2,8 s :

| Temps | Étape |
|---|---|
| 0 → 0,7 s | Les 8 parts du pictogramme apparaissent en spirale, avec un léger rebond ; puis l'anneau et le moyeu. |
| 0,5 → 1,3 s | « Roue des noms » monte lettre par lettre, puis le sous-titre apparaît. |
| 1,05 → 1,85 s | Tour d'élan : un recul de −12°, puis un tour complet. Le texte s'efface. |
| 1,85 → 2,55 s | **FLIP** : le pictogramme grandit et se pose exactement sur la roue (même centre, même diamètre d'anneau). L'en-tête, le sélecteur de mode, le bouton et le panneau de résultat apparaissent en décalé, et l'aurore se dévoile. |
| 2,55 → 2,85 s | Fondu croisé entre le pictogramme et la vraie roue. |

- Le bouton « Passer l'intro » (bas droite) et la touche `Échap` sautent directement à l'état final.
- La touche Espace est inactive pendant l'intro.
- Avec `prefers-reduced-motion: reduce`, l'intro n'est pas jouée.
- Le pictogramme est un composant partagé (`WheelMark`) : il sert à l'intro, à l'en-tête et au favicon (`app/icon.svg`).

## 9. Accessibilité (RGAA)

- Contrastes : texte ≥ 4,5:1 partout, y compris les noms sur les pastels (vérifié par un test sur la palette).
- Tout est utilisable au clavier : sélecteur de mode, tirage avec Espace, panneau, puces d'historique.
- Focus visible au style DSFR.
- Le nom tiré est annoncé (`aria-live`). La roue SVG a un `role="img"` et un `aria-label` qui liste les participants.
- `prefers-reduced-motion` coupe l'aurore animée, l'intro et les confettis, et ramène la rotation à environ 0,3 s (le résultat reste visible).
- `lang="fr"`. Les boutons qui n'affichent qu'une icône ont un `aria-label`.

## 10. Architecture du code

```
app/
  layout.tsx          Marianne (next/font/local), metadata « Roue des noms », ThemeProvider (light par défaut, enableSystem=false)
  page.tsx            <Suspense><NameWheelApp/></Suspense>
  globals.css         variables DSFR clair/sombre, @property --win/--win-ink, keyframes partagés
  icon.svg            pictogramme
components/roue/
  NameWheelApp.tsx    orchestration : état de tirage, mode, phases (intro → jeu → finale → récap)
  AppHeader.tsx  ThemeToggle.tsx  ShareButton.tsx  WheelMark.tsx
  IntroSplash.tsx  AuraBackground.tsx  ModeSwitch.tsx  SpinButton.tsx
  WheelView.tsx  GridView.tsx  StarView.tsx
  ResultPanel.tsx  FinaleView.tsx  RecapView.tsx
  ParticipantsDrawer.tsx
hooks/
  useNamesUrlState.ts     synchronisation bidirectionnelle URL ↔ état (logique actuelle reprise, garde contre les boucles)
  useNameHistory.ts       localStorage, plafond de 30, dernière liste
  useSpeakingTimer.ts     démarrer / pause / reprendre / réinitialiser, temps écoulé
  useSessionLog.ts        ordre de passage et durées
  useNameFact.ts          fetch /api/name-fact + annulation
  usePrefersReducedMotion.ts
lib/
  palette.ts          palette pastel + colorsFor()
  spin.ts             targetRotation(), normalizeAngle(), labelNeedsFlip()
  confetti.ts         burst(origin, colors)
  normalizeName.ts    (ou réutilise lib/nameFacts/normalize.ts s'il convient)
  nameFacts/          inchangé
```

- **Machine d'états** dans `NameWheelApp` : `intro | idle | spinning | revealed | finale-ready | finale-revealed | recap`. Les vues lisent la phase et ne gèrent pas elles-mêmes les transitions.
- **Contrat avec l'URL** inchangé : `?names=a,b,c&mode=wheel|grid|star`. Les liens existants continuent de fonctionner.
- **Dépendances** :
  - ajout de `@radix-ui/react-icons` ;
  - `lucide-react` reste dans `package.json`, car il est importé par `components/ui/` (qu'on ne modifie pas) ; en revanche, aucun nouveau code ne l'importe.
  - Pas de bibliothèque d'animation : CSS + Web Animations API.
- **`components/ui/`** n'est pas modifié. Le restyle passe par les variables CSS, la config Tailwind et les `className` au moment de l'utilisation.
- Le CSS inline actuel (`customStyles` dans `page.tsx`) disparaît.

## 11. Tests et vérification

- Ajout de **Vitest** (logique pure uniquement) :
  - `palette` : attribution déterministe, pas deux voisins de même couleur quand il y a au moins 3 noms, contrastes ≥ 4,5:1 ;
  - `spin` : l'angle cible amène bien la part visée sous le pointeur, normalisation, retournement des noms ;
  - `useNameHistory` (sous forme de store pur) : incrément, plafond, éviction, dernière liste, `localStorage` qui lève une exception ;
  - `useNamesUrlState` (parse/serialize) : aller-retour, doublons, noms vides.
- `npm run build` et `npm run lint` passent.
- Vérification manuelle avec Playwright sur les parcours : intro (complète et passée), tirage dans les 3 modes, retrait et relance, finale, récap, panneau avec historique, bascule de thème, mobile 375px, `prefers-reduced-motion`.

## 12. Hors périmètre

- Bloc-marque de l'État, en-tête et pied de page officiels du DSFR.
- Comptes, back-end, synchronisation de l'historique entre appareils.
- Personnalisation de la durée du minuteur (reste 2 min).
- Internationalisation.
- Mise à jour de `CLAUDE.md` : à faire à la fin de l'implémentation, pour refléter la nouvelle architecture.
