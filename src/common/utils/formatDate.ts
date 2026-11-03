import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"

dayjs.extend(utc)

export function formatDate(date: Date) {
  return dayjs(date).format("YYYY.MM.DD HH:mm:ss")
}

/**
 * 서버가 내려준 시각 문자열을 로컬 시각으로 파싱한다.
 *
 * 백엔드 시각(`LocalDateTime`)은 UTC 순간이고 "...Z"가 붙어 온다(58 시간대 규약 · 기한도
 * 서버가 KST 날짜로 계산한 뒤 UTC로 바꿔 내린다). "Z"가 없는 값도 UTC로 읽는다 —
 * 그대로 dayjs에 넘기면 브라우저 로컬(KST)로 해석돼 9시간 어긋난다.
 */
export function parseServerDateTime(date: string) {
  const hasTimeZone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(date)
  return hasTimeZone ? dayjs(date) : dayjs.utc(date).local()
}

/** 날짜만 (예: 2026.07.10) — 목록 등 밀도 높은 화면용 */
export function formatDateOnly(date: string | null): string {
  if (!date) {
    return "—"
  }
  return parseServerDateTime(date).format("YYYY.MM.DD")
}

/** 날짜 + 분 (예: 2026.07.10 14:22) — 상세 메타 정보용 */
export function formatDateTimeShort(date: string | null): string {
  if (!date) {
    return "—"
  }
  return parseServerDateTime(date).format("YYYY.MM.DD HH:mm")
}
