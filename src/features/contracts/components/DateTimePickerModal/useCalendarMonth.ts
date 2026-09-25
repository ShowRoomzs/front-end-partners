import type { Dayjs } from "dayjs"
import { useCallback, useState } from "react"

/**
 * 한 달씩 보여주는 달력의 월 상태 — 선택 가능일이 없는 방향은 ‹ ›를 잠근다(시안 C1).
 * `min`·`max`는 일 단위 경계(양끝 포함)다.
 */
export function useCalendarMonth(
  initial: Dayjs,
  min: Dayjs | null,
  max: Dayjs | null
) {
  const [month, setMonth] = useState(() => initial.startOf("month"))

  const canPrev = !min || month.isAfter(min.startOf("month"))
  const canNext = !max || month.isBefore(max.startOf("month"))

  const prev = useCallback(() => {
    setMonth(current => current.subtract(1, "month"))
  }, [])
  const next = useCallback(() => {
    setMonth(current => current.add(1, "month"))
  }, [])

  return { month, canPrev, canNext, prev, next }
}
