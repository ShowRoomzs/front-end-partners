import { parseServerDateTime } from "@/common/utils/formatDate"
import type { PerformanceFigure } from "@/features/performance/types"
import dayjs from "dayjs"

export type FigureUnit =
  | "won"
  | "people"
  | "orders"
  | "pieces"
  | "times"
  /** 비율 % — 소수 1자리(93.0%) */
  | "rate"
  /** 비율 % — 정수(44%) · 분포 카드처럼 시안이 정수로 쓰는 자리 */
  | "rate0"
  /** ROAS % 정수 */
  | "roas"
  | "days"
  | "hours"
  /** 단위 없는 수(방문 3,120) */
  | "plain"

const SUFFIX: Record<FigureUnit, string> = {
  won: "원",
  people: "명",
  orders: "건",
  pieces: "개",
  times: "회",
  rate: "%",
  rate0: "%",
  roas: "%",
  days: "일",
  hours: "시간",
  plain: "",
}

export function formatNumber(value: number) {
  return value.toLocaleString("ko-KR")
}

export function formatWon(value: number) {
  return `${formatNumber(value)}원`
}

/** 숫자 하나를 단위대로 — 비율 · 시간은 서버가 소수 1자리로 내린다(93.0이 JSON에서 93으로 온다) */
export function formatValue(value: number, unit: FigureUnit) {
  switch (unit) {
    case "rate":
    case "days":
    case "hours":
      return `${value.toFixed(1)}${SUFFIX[unit]}`
    case "rate0":
      return `${Math.round(value)}%`
    default:
      return `${formatNumber(value)}${SUFFIX[unit]}`
  }
}

/** 지표 값 — 값이 없으면 「—」(0은 측정된 0이라 그대로 그린다) */
export function formatFigure(
  figure: PerformanceFigure | null | undefined,
  unit: FigureUnit
) {
  if (figure?.value == null) return "—"
  return formatValue(figure.value, unit)
}

/**
 * 카드 보조줄 — 서버 근거 문장 + 원래 값.
 * 협의 중은 「원래 4,775,800원 · 리워드 합의 후 확정」(원래 값이 앞), 합의 반영은 「합의 반영 · 원래 4,775,800원」(근거가 앞)으로 시안과 같은 순서다.
 */
export function figureSub(
  figure: PerformanceFigure | null | undefined,
  unit: FigureUnit
) {
  if (!figure) return ""
  const basis = figure.basis ?? ""
  if (figure.original == null) return basis
  const original = `원래 ${formatValue(figure.original, unit)}`
  if (figure.state === "NEGOTIATING")
    return basis ? `${original} · ${basis}` : original
  return basis ? `${basis} · ${original}` : original
}

/** 08.01 ~ 08.07 · 상세는 2026.08.01 ~ 08.07 — 공구 기간은 입력 시각이라 KST 벽시계 그대로 */
export function formatPeriod(start: string, end: string, withYear = false) {
  const s = dayjs(start)
  const e = dayjs(end)
  const head = s.format(withYear ? "YYYY.MM.DD" : "MM.DD")
  const tail = e.format(
    withYear && s.year() !== e.year() ? "YYYY.MM.DD" : "MM.DD"
  )
  return `${head} ~ ${tail}`
}

/** 2026.07.18~08.07 — 목록 「조회기간」(LocalDate) */
export function formatListPeriod(from: string, to: string) {
  const s = dayjs(from)
  const e = dayjs(to)
  return `${s.format("YYYY.MM.DD")}~${e.format(s.year() === e.year() ? "MM.DD" : "YYYY.MM.DD")}`
}

/** 기한 · 예정일(KST 벽시계) → 10.20 */
export function formatMonthDay(date: string | null | undefined) {
  return date ? dayjs(date).format("MM.DD") : "—"
}

/** 이벤트 시각(UTC 벽시계 · 지급 완료 · 합의 응답) → 10.08 */
export function formatEventMonthDay(date: string | null | undefined) {
  return date ? parseServerDateTime(date).format("MM.DD") : "—"
}

/** 이벤트 시각(UTC 벽시계) → 2026.10.20 */
export function formatEventDate(date: string | null | undefined) {
  return date ? parseServerDateTime(date).format("YYYY.MM.DD") : "—"
}

/** 이벤트 시각(UTC 벽시계) → 2026.10.12 14:20 */
export function formatEventDateTime(date: string | null | undefined) {
  return date ? parseServerDateTime(date).format("YYYY.MM.DD HH:mm") : "—"
}

/** 정산 확인 기한(KST) → 10.13 23:59 */
export function formatDueDateTime(date: string | null | undefined) {
  return date ? dayjs(date).format("MM.DD HH:mm") : "—"
}

/** 원가 입력칸 — 숫자만 남겨 콤마를 찍는다. 빈칸은 미입력(null) */
export function parseCostInput(raw: string): number | null {
  const digits = raw.replace(/[^\d]/g, "")
  if (!digits) return null
  return Number(digits)
}

export function formatCostInput(value: number | null) {
  return value == null ? "" : formatNumber(value)
}
