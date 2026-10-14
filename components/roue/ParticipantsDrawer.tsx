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
