import {
  formatDateTimeShort,
  parseServerDateTime,
} from "@/common/utils/formatDate"
import dayjs from "dayjs"

export function formatNumber(value: number | null | undefined): string {
  return value === null || value === undefined
    ? "—"
    : value.toLocaleString("ko-KR")
}

export function formatKRW(value: number | null | undefined): string {
  return value === null || value === undefined
    ? "—"
    : `${value.toLocaleString("ko-KR")}원`
}

/** 리워드율 — "15%" / "12.5%". 서버가 소수 첫째 자리까지 내리므로 `.0`은 지운다 */
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—"
  }
  const text = Number.isInteger(value) ? String(value) : value.toFixed(1)
  return `${text.replace(/\.0$/, "")}%`
}

/** "2026.08.24 10:00 ~ 2026.08.31 23:55" — 어느 한쪽이 없으면 미설정 */
export function periodText(
  startAt: string | null,
  endAt: string | null
): string | null {
  if (!startAt || !endAt) {
    return null
  }
  return `${formatDateTimeShort(startAt)} ~ ${formatDateTimeShort(endAt)}`
}

/** 예상 리워드(1개당) — 서버와 같이 1원 단위 버림 */
export function unitReward(
  groupBuyPrice: number | null,
  rewardRate: number | null
): number | null {
  if (groupBuyPrice === null || rewardRate === null) {
    return null
  }
  return Math.floor((groupBuyPrice * rewardRate) / 100)
}

/** 할인율(%) — 검토 요청 확인 모달의 경고 문구용 */
export function discountRate(
  regularPrice: number | null,
  groupBuyPrice: number | null
): number | null {
  if (!regularPrice || groupBuyPrice === null) {
    return null
  }
  return Math.round((1 - groupBuyPrice / regularPrice) * 100)
}

/** 임시저장 메타 — "12분 전" / 오래됐으면 일시 */
export function relativeSavedText(savedAt: string | null): string | null {
  if (!savedAt) {
    return null
  }
  const date = parseServerDateTime(savedAt)
  const minutes = dayjs().diff(date, "minute")
  if (minutes < 1) {
    return "방금"
  }
  if (minutes < 60) {
    return `${minutes}분 전`
  }
  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours}시간 전`
  }
  return formatDateTimeShort(savedAt)
}

export function formatFileSize(bytes: number | null): string {
  if (bytes === null) {
    return "—"
  }
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }
  return `${Math.max(1, Math.round(bytes / 1024))}KB`
}
