import { cn } from "@/lib/utils"
import type { Dayjs } from "dayjs"

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"]

interface CalendarGridProps {
  month: Dayjs
  /** 일 단위 경계(양끝 포함) — 밖은 회색으로 잠긴다 */
  min: Dayjs | null
  max: Dayjs | null
  /** 선택된 날짜 */
  selected: Dayjs | null
  /** 종료 모달의 앵커(시작일) — 있으면 앵커~선택 사이가 연한 면으로 칠해진다 */
  rangeStart: Dayjs | null
  /** 점 표시(검토 요청일 = 오늘) */
  marker: Dayjs | null
  onSelect: (date: Dayjs) => void
}

type CellState = {
  date: Dayjs | null
  off: boolean
  on: boolean
  isStart: boolean
  isEnd: boolean
  mid: boolean
  today: boolean
}

/**
 * 시안 `.cal-g` — 7칸 격자. 잠긴 날은 클릭이 안 되고(에러 문구가 아니라 선택 자체를 막는다 · §25-6-2),
 * 구간이 있으면 시작·끝만 채우고 사이는 연한 면이다. 행 끝에서 잘린 것처럼 보이지 않도록
 * 각 행의 첫/끝 칸 모서리를 둥글린다.
 */
export default function CalendarGrid(props: CalendarGridProps) {
  const { month, min, max, selected, rangeStart, marker, onSelect } = props

  const daysInMonth = month.daysInMonth()
  const leadingBlanks = month.startOf("month").day()
  const cells: Array<CellState> = []

  for (let i = 0; i < leadingBlanks; i += 1) {
    cells.push({
      date: null,
      off: false,
      on: false,
      isStart: false,
      isEnd: false,
      mid: false,
      today: false,
    })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = month.date(day)
    const off =
      (min !== null && date.isBefore(min, "day")) ||
      (max !== null && date.isAfter(max, "day"))
    const isStart = rangeStart !== null && date.isSame(rangeStart, "day")
    const isEnd = selected !== null && date.isSame(selected, "day")
    const mid =
      rangeStart !== null &&
      selected !== null &&
      date.isAfter(rangeStart, "day") &&
      date.isBefore(selected, "day")
    cells.push({
      date,
      off,
      on: isStart || isEnd,
      isStart,
      isEnd,
      mid,
      today: marker !== null && date.isSame(marker, "day"),
    })
  }

  while (cells.length % 7 !== 0) {
    cells.push({
      date: null,
      off: false,
      on: false,
      isStart: false,
      isEnd: false,
      mid: false,
      today: false,
    })
  }

  const rows: Array<Array<CellState>> = []
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7))
  }

  return (
    <div>
      <div className="grid grid-cols-7">
        {WEEKDAYS.map(weekday => (
          <div
            key={weekday}
            className="pb-2 text-center text-[10px] font-semibold tracking-[.4px] text-sz-n-400"
          >
            {weekday}
          </div>
        ))}
      </div>
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-7 gap-y-[2px]">
          {row.map((cell, cellIndex) => {
            if (!cell.date) {
              return <div key={`blank-${cellIndex}`} className="h-[38px]" />
            }
            const { date } = cell
            const hasRange = rangeStart !== null && selected !== null
            return (
              <button
                key={date.date()}
                type="button"
                disabled={cell.off}
                onClick={() => onSelect(date)}
                className={cn(
                  "relative flex h-[38px] items-center justify-center rounded-[6px] text-[12px] tabular-nums text-sz-n-700 transition-colors",
                  !cell.off && !cell.on && !cell.mid && "hover:bg-sz-n-100",
                  cell.off && "cursor-not-allowed text-sz-n-300",
                  cell.mid && "rounded-none bg-sz-accent-50 text-sz-accent-600",
                  cell.on && "bg-sz-accent-500 font-semibold text-white",
                  // 구간의 시작·끝은 바깥쪽만 둥글다 — 단, 행 끝에 걸리면 안쪽도 둥글린다
                  cell.on &&
                    hasRange &&
                    cell.isStart &&
                    !cell.isEnd &&
                    "rounded-r-none",
                  cell.on &&
                    hasRange &&
                    cell.isEnd &&
                    !cell.isStart &&
                    "rounded-l-none",
                  cell.mid && cellIndex === 0 && "rounded-l-[6px]",
                  cell.mid && cellIndex === 6 && "rounded-r-[6px]",
                  cell.on && cell.isStart && cellIndex === 6 && "rounded-[6px]",
                  cell.on && cell.isEnd && cellIndex === 0 && "rounded-[6px]"
                )}
              >
                {date.date()}
                {cell.today && (
                  <span
                    aria-hidden
                    className={cn(
                      "absolute bottom-[5px] left-1/2 h-1 w-1 -translate-x-1/2 rounded-full",
                      cell.on ? "bg-white/90" : "bg-sz-n-400"
                    )}
                  />
                )}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
