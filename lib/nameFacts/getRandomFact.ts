export function getRandomFact(facts: string[]): string {
  if (facts.length === 0) return ""
  const index = Math.floor(Math.random() * facts.length)
  return facts[index]
}
