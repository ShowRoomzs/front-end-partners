import type { StatusBadgeVariant } from "@/common/components/StatusBadge/StatusBadge"
import { parseServerDateTime } from "@/common/utils/formatDate"
import {
  defaultPeriodOf,
  SEARCH_RANGE_MAX_DAYS,
} from "@/features/orders/constants/params"
import type {
  OrderBadgeTone,
  OrderItem,
  OrderListParams,
  OrderQueryParams,
  OrderTab,
  PeriodPreset,
} from "@/features/orders/types"
import dayjs, { type Dayjs } from "dayjs"

const DATE_FORMAT = "YYYY-MM-DD"

/**
 * 프리셋 → 조회 기간. 시안 표기(7일 = 08.13~08.19)처럼 **오늘을 포함한** 일수다.
 * 프리셋은 요청 직전에 푼다 — URL에 날짜를 박아 두면 다음 날 열어도 어제 기준으로 조회된다.
 */
export function resolvePeriod(
  period: PeriodPreset | "",
  tab: OrderTab,
  custom: { from: string; to: string },
  today: Dayjs = dayjs()
): { from: string; to: string } {
  const end = today.startOf("day")
  switch (period || defaultPeriodOf(tab)) {
    case "TODAY":
      return { from: end.format(DATE_FORMAT), to: end.format(DATE_FORMAT) }
    case "WEEK":
      return {
        from: end.subtract(6, "day").format(DATE_FORMAT),
        to: end.format(DATE_FORMAT),
      }
    case "MONTH":
      return {
        from: end.subtract(1, "month").add(1, "day").format(DATE_FORMAT),
        to: end.format(DATE_FORMAT),
      }
    case "QUARTER":
      return {
        from: end.subtract(3, "month").add(1, "day").format(DATE_FORMAT),
        to: end.format(DATE_FORMAT),
      }
    case "CUSTOM":
    default:
      if (custom.from && custom.to) {
        return { from: custom.from, to: custom.to }
      }
      // 날짜를 비운 채 직접 입력으로 왔으면 탭 기본 기간으로 조회한다
      return resolvePeriod(defaultPeriodOf(tab), tab, custom, today)
  }
}

/** 직접 입력 기간 검사 — 역전·1년 초과는 서버가 400으로 막는다. 조회 전에 알린다 */
export function validateCustomRange(from: string, to: string) {
  if (!from || !to) {
    return "EMPTY" as const
  }
  const start = dayjs(from)
  const end = dayjs(to)
  if (start.isAfter(end)) {
    return "REVERSED" as const
  }
  if (end.diff(start, "day") > SEARCH_RANGE_MAX_DAYS) {
    return "EXCEEDED" as const
  }
  return null
}

export function toQueryParams(params: OrderListParams): OrderQueryParams {
  const range = resolvePeriod(params.period, params.tab, params)
  const keyword = params.keyword.trim()
  return {
    tab: params.tab,
    dateBasis: params.dateBasis,
    from: range.from,
    to: range.to,
    searchType: keyword ? params.searchType : undefined,
    keyword: keyword || undefined,
    sort: params.sort || undefined,
    page: Number(params.page) || 1,
    size: Number(params.size) || 20,
  }
}

/** 시안 기간 표기 — 2026.08.13 ~ 2026.08.19 */
export function formatRange(from: string, to: string) {
  return `${dayjs(from).format("YYYY.MM.DD")} ~ ${dayjs(to).format("YYYY.MM.DD")}`
}

/** 결과 요약 줄의 기간 — 같은 해면 끝 날짜의 연도를 뺀다(2026.08.13~08.19) */
export function formatRangeCompact(from: string, to: string) {
  const start = dayjs(from)
  const end = dayjs(to)
  const endFormat = start.year() === end.year() ? "MM.DD" : "YYYY.MM.DD"
  return `${start.format("YYYY.MM.DD")}~${end.format(endFormat)}`
}

export function formatDateTime(value: string | null) {
  return value ? parseServerDateTime(value).format("YYYY.MM.DD HH:mm") : "—"
}

export function formatWon(value: number) {
  return `${value.toLocaleString("ko-KR")}원`
}

export function formatNumber(value: number) {
  return value.toLocaleString("ko-KR")
}

/**
 * 경과(우 레일 · 취소 요청 「경과」 열) — 시안처럼 사흘 미만은 시간(「38시간」), 그 이상은 일(「7일」).
 * 기한 판단(24·72시간)이 시간 단위라 그 구간은 시간으로 읽혀야 한다.
 */
export function formatElapsedHours(hours: number) {
  if (hours < 72) {
    return `${Math.max(0, hours)}시간`
  }
  return `${Math.floor(hours / 24)}일`
}

export function hoursSince(value: string | null, now: Dayjs = dayjs()) {
  if (!value) {
    return null
  }
  return Math.max(0, now.diff(parseServerDateTime(value), "hour"))
}

export function isPast(value: string | null, now: Dayjs = dayjs()) {
  return Boolean(value) && parseServerDateTime(value as string).isBefore(now)
}

const TONE_TO_VARIANT: Record<OrderBadgeTone, StatusBadgeVariant> = {
  NEUTRAL: "neutral",
  INFO: "info",
  WARNING: "warning",
  SUCCESS: "success",
  DANGER: "danger",
}

/** 서버 배지 색 → 공용 StatusBadge variant. 상태→색 판단은 서버가 하고 여기선 이름만 바꾼다 */
export function toneToVariant(tone: OrderBadgeTone): StatusBadgeVariant {
  return TONE_TO_VARIANT[tone] ?? "neutral"
}

/**
 * 항목 상태 배지 — 문구는 서버(`itemStatusLabel`), 색은 항목 축으로 고른다.
 * 취소 요청 대상은 하위주문 상태가 아니라 「취소 요청」으로 짚는다(C11).
 */
export function itemBadge(
  item: OrderItem,
  groupTone: OrderBadgeTone
): { label: string; variant: StatusBadgeVariant } {
  if (item.cancelled) {
    return { label: item.itemStatusLabel, variant: "neutral" }
  }
  if (item.cancelRequested) {
    return { label: "취소 요청", variant: "warning" }
  }
  if (item.itemStatusLabel === "구매확정") {
    return { label: item.itemStatusLabel, variant: "success" }
  }
  if (item.itemStatusLabel === "반품") {
    return { label: item.itemStatusLabel, variant: "neutral" }
  }
  return { label: item.itemStatusLabel, variant: toneToVariant(groupTone) }
}

/** 옵션 표기 — 단일 상품(옵션 없음)은 시안처럼 「단품」 */
export function optionText(optionName: string | null) {
  return optionName ?? "단품"
}

/** 「소비자 취소 · 준비 시작 전」 → 주 문구 + 보조 줄(시안 A2e 취소 사유 열) */
export function splitLabel(label: string | null) {
  if (!label) {
    return { main: "—", sub: null }
  }
  const [main, ...rest] = label.split(" · ")
  return { main, sub: rest.length ? rest.join(" · ") : null }
}

/** 송장번호 입력 정제 — 공백·하이픈 등 숫자 외 문자는 입력 중에 걷어낸다(검사 ①) */
export function sanitizeTrackingNumber(value: string) {
  return value.replace(/\D/g, "")
}

/** 읽기 전용 송장번호 — 시안처럼 네 자리씩 띄운다(「6412 3389 4571」). 입력값은 숫자만 둔다 */
export function formatTrackingNumber(value: string | null) {
  if (!value) {
    return "—"
  }
  return /^\d+$/.test(value) ? value.replace(/(\d{4})(?=\d)/g, "$1 ") : value
}

/** 받침 유무로 목적격 조사를 고른다 — 「ORD-1을」 · 「선크림을」 */
export function objectParticle(word: string) {
  const last = word.charCodeAt(word.length - 1)
  const isHangul = last >= 0xac00 && last <= 0xd7a3
  if (isHangul) {
    return (last - 0xac00) % 28 === 0 ? "를" : "을"
  }
  // 숫자로 끝나면 읽는 소리의 받침을 따른다 — 2·4·5·9(이·사·오·구)만 받침이 없다
  const lastChar = word[word.length - 1]
  if (/\d/.test(lastChar)) {
    return "2459".includes(lastChar) ? "를" : "을"
  }
  return "을(를)"
}
