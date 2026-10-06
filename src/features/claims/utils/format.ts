import { parseServerDateTime } from "@/common/utils/formatDate"

/** 목록 셀용 「08.22 14:10」 */
export function formatMonthDayTime(date: string | null) {
  return date ? parseServerDateTime(date).format("MM.DD HH:mm") : "—"
}

/** 「08.22」 */
export function formatMonthDay(date: string | null) {
  return date ? parseServerDateTime(date).format("MM.DD") : "—"
}

/** 상세용 「2026.08.22 14:10」 */
export function formatFullDateTime(date: string | null) {
  return date ? parseServerDateTime(date).format("YYYY.MM.DD HH:mm") : "—"
}

/** 「17,800원」 */
export function formatWon(amount: number) {
  return `${amount.toLocaleString("ko-KR")}원`
}

/** 송장번호는 숫자만 받는다 — 공백·하이픈은 서버도 지우지만 입력 중에 미리 걷어 대조를 쉽게 한다 */
export function digitsOnly(value: string) {
  return value.replace(/[^0-9]/g, "")
}
