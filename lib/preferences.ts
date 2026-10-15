/** Affichage des anecdotes « Le saviez-vous ? » et de l'horoscope, mémorisé sur l'appareil. */
export const EXTRAS_KEY = "roue-des-noms:extras:v1"

type Reader = Pick<Storage, "getItem">
type Writer = Pick<Storage, "setItem">

export function loadShowExtras(storage: Reader | null): boolean {
  try {
    return storage?.getItem(EXTRAS_KEY) !== "hidden"
  } catch {
    return true
  }
}

export function saveShowExtras(storage: Writer | null, show: boolean): void {
  try {
    storage?.setItem(EXTRAS_KEY, show ? "shown" : "hidden")
  } catch {
    // Stockage plein ou bloqué : le réglage vaut pour cette session seulement.
  }
}
