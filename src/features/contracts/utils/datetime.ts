import { parseServerDateTime } from "@/common/utils/formatDate"
import {
  LEAD_DAYS,
  MAX_PERIOD_DAYS,
  MIN_PERIOD_DAYS,
} from "@/features/contracts/constants/rules"
import dayjs, { type Dayjs } from "dayjs"
import utc from "dayjs/plugin/utc"

dayjs.extend(utc)

/**
 * 서버 `LocalDateTime`은 시간대가 없는 UTC 벽시계다(`parseServerDateTime` 주석 참고).
 * 표시가 UTC→로컬로 읽으므로 전송은 로컬→UTC로 써야 저장→재조회가 같은 시각으로 돌아온다.
 */
export function toServerDateTime(value: Dayjs): string {
  return value.utc().format("YYYY-MM-DDTHH:mm:ss")
}

export function fromServerDateTime(value: string | null): Dayjs | null {
  return value ? parseServerDateTime(value) : null
}

/** 서버 `LocalDate`(yyyy-MM-dd) — 시간대와 무관한 날짜라 그대로 쓴다 */
export function toServerDate(value: Dayjs): string {
  return value.format("YYYY-MM-DD")
}

export function fromServerDate(value: string | null): Dayjs | null {
  return value ? dayjs(value) : null
}

/** 공구 시작 하한 — 오늘(검토 요청일) + 7일(H5). 달력이 그 앞을 잠근다 */
export function startLowerBound(today: Dayjs = dayjs()): Dayjs {
  return today.startOf("day").add(LEAD_DAYS, "day")
}

/** 종료 선택 범위 — 시작일 기준 양끝 포함 3~30일(H4) */
export function endBounds(start: Dayjs): { min: Dayjs; max: Dayjs } {
  const base = start.startOf("day")
  return {
    min: base.add(MIN_PERIOD_DAYS - 1, "day"),
    max: base.add(MAX_PERIOD_DAYS - 1, "day"),
  }
}

/** 일수 — 시작·종료 일자 양끝 포함(서버 `period.days`와 같은 계산) */
export function inclusiveDays(start: Dayjs, end: Dayjs): number {
  return end.startOf("day").diff(start.startOf("day"), "day") + 1
}

/** 스텝퍼 `.who` 등 좁은 자리용 — "08.13 16:40" */
export function formatMonthDayTime(value: string | null): string {
  if (!value) {
    return "—"
  }
  return parseServerDateTime(value).format("MM.DD HH:mm")
}

/** 종결 헤더 등 날짜만 — "07.24" */
export function formatMonthDay(value: string | null): string {
  if (!value) {
    return "—"
  }
  return parseServerDateTime(value).format("MM.DD")
}
