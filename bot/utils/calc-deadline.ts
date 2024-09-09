/**
 * UNIX時刻を返す
 * @param daysCount 日数
 */
export function calcDeadline(daysCount: number) {
  return Math.floor(Date.now() / 1000 + daysCount * 24 * 60 * 60)
}
