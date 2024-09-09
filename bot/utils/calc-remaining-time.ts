/**
 * 期限切れかどうかを返す
 * @param deadline
 * @returns
 */
export function isExpired(
  /**
   * ユニックスタイム
   */
  deadline: number,
) {
  const now = Math.floor(Date.now() / 1000)

  return deadline - now < 0
}
