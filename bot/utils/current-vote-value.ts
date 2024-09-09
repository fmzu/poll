export async function currentVoteValue(
  currentVoteResults: { name: string; count: number }[],
) {
  const results: string[] = []
  for (let index = 0; index < currentVoteResults.length; index++) {
    const item = currentVoteResults[index]
    const result = `${index + 1}.${item.name} (${item.count}票)`
    results.push(result)
  }
  return results as string[]
}
