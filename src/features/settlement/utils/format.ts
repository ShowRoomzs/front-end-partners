import dayjs from "dayjs"

export function formatWon(value: number) {
  return `${value.toLocaleString("ko-KR")}원`
}

/** 차감 행 — 0원은 부호 없이 */
export function formatMinusWon(value: number) {
  return value === 0 ? "0원" : `−${formatWon(value)}`
}

export function formatPlusWon(value: number) {
  return `+${formatWon(value)}`
}

/** 08.31 */
export function formatMonthDay(date: string | null) {
  return date ? dayjs(date).format("MM.DD") : "—"
}

/** 09.24 23:59 — 정산 확인 기간 마감 */
export function formatMonthDayTime(date: string | null) {
  return date ? dayjs(date).format("MM.DD HH:mm") : "—"
}

/** 2026.08.31 */
export function formatFullDate(date: string | null) {
  return date ? dayjs(date).format("YYYY.MM.DD") : "—"
}

/** 목록 08.20 ~ 08.26 · 상세 2026.08.20 ~ 08.26 */
export function formatPeriod(start: string, end: string, withYear = false) {
  const head = withYear ? formatFullDate(start) : formatMonthDay(start)
  const sameYear = dayjs(start).year() === dayjs(end).year()
  const tail = withYear && !sameYear ? formatFullDate(end) : formatMonthDay(end)
  return `${head} ~ ${tail}`
}

/** 3 → "3.0" · 3.3 → "3.3" — 요율은 시안대로 소수 한 자리 */
export function formatRate(rate: number) {
  return rate.toFixed(1)
}

/** 10 → "10" · 3.3 → "3.3" — 「10%」 · 「3.3%」처럼 정수면 소수점을 붙이지 않는다 */
export function formatPercent(rate: number) {
  return `${Number.isInteger(rate) ? rate : rate.toFixed(1)}%`
}
