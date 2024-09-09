/**
 * 投票結果を取得し、選択肢と投票数を組み合わせてソートする関数
 * @param options 投票の選択肢とその投票数の配列
 * @returns ソートされた投票結果
 */
export function sortVoteResults(options: { name: string; count: number }[]) {
  return options
    .map((option) => ({ option: option.name, count: option.count }))
    .sort((a, b) => b.count - a.count)
}
