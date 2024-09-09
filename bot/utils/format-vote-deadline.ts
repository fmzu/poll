/**
 * 投票の締め切り日をフォーマットする関数
 * @param unixTime 投票の締め切り日
 * @returns フォーマットされた日付文字列
 */
export function formatDeadline(unixTime: number): string {
  // 日付をフォーマットするためのオプション
  const formatter = new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Tokyo", // 日本時間に設定
  })

  // ロケールを日本に設定して日付をフォーマット
  return formatter.format(unixTime * 1000)
}
