import NotReady from "@/common/components/NotReady/NotReady"
import { isApiNotReady } from "@/common/utils/devMock"
import { HomeCard } from "@/features/home/components/HomeCard"
import {
  contractDetailPath,
  groupBuyDetailPath,
} from "@/features/home/constants/links"
import { CALENDAR_MAX_BAR_ROWS } from "@/features/home/constants/params"
import { useGetHomeCalendar } from "@/features/home/hooks/useHomeQueries"
import type {
  HomeCalendar,
  HomeCalendarDeadline,
  HomeCalendarGroupBuy,
} from "@/features/home/types"
import { cn } from "@/lib/utils"
import dayjs, { type Dayjs } from "dayjs"
import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"]
/** 막대 줄 높이 — 첫 줄 top 24px, 줄마다 20px(막대 17px + 간격) */
const BAR_TOP = 24
const BAR_STEP = 20

const BAR_TONE: Record<string, string> = {
  IN_PROGRESS: "bg-sz-accent-500 text-white",
  UPCOMING: "bg-sz-n-200 text-sz-n-700",
  ENDED: "bg-sz-n-100 text-sz-n-500",
}

/** 막대 첫 칸 라벨 꼬리 — 정지 중이면 오픈 예정 막대에 「승인 보류」(서버 hold 라벨의 앞 단계) */
function barSuffix(gb: HomeCalendarGroupBuy) {
  if (gb.status === "ENDED") return " · 종료"
  if (gb.status === "UPCOMING")
    return ` · ${gb.hold ? gb.hold.label.split(" · ")[0] : "오픈 예정"}`
  return ""
}

interface WeekBar {
  gb: HomeCalendarGroupBuy
  startCol: number
  endCol: number
  /** 이 주에서 시작 / 끝나는가 — 둥근 모서리 */
  starts: boolean
  ends: boolean
  row: number
}

interface CalendarWeek {
  days: Array<Dayjs>
  bars: Array<WeekBar>
  /** 3줄을 넘어 접힌 막대 수(칸별) */
  overflow: Array<number>
}

function buildWeeks(month: Dayjs, data: HomeCalendar | undefined) {
  const first = month.startOf("month")
  const gridStart = first.subtract(first.day(), "day")
  const last = month.endOf("month").startOf("day")
  const gridEnd = last.add(6 - last.day(), "day")
  const weeks: Array<CalendarWeek> = []

  for (
    let weekStart = gridStart;
    !weekStart.isAfter(gridEnd);
    weekStart = weekStart.add(7, "day")
  ) {
    const days = Array.from({ length: 7 }, (_, i) => weekStart.add(i, "day"))
    const weekEnd = days[6]
    const rowsEnd: Array<number> = []
    const overflow = Array<number>(7).fill(0)
    const bars: Array<WeekBar> = []

    const overlapping = (data?.groupBuys ?? [])
      .map(gb => ({
        gb,
        start: dayjs(gb.startAt).startOf("day"),
        end: dayjs(gb.endAt).startOf("day"),
      }))
      .filter(
        ({ start, end }) => !end.isBefore(weekStart) && !start.isAfter(weekEnd)
      )
      .sort((a, b) => a.start.valueOf() - b.start.valueOf())

    for (const { gb, start, end } of overlapping) {
      const startCol = start.isBefore(weekStart)
        ? 0
        : start.diff(weekStart, "day")
      const endCol = end.isAfter(weekEnd) ? 6 : end.diff(weekStart, "day")
      // 겹치는 공구는 줄을 쌓는다 — 동시에 몇 개가 도는지 보이게
      let row = rowsEnd.findIndex(lastCol => lastCol < startCol)
      if (row === -1) row = rowsEnd.length
      rowsEnd[row] = endCol
      if (row >= CALENDAR_MAX_BAR_ROWS) {
        for (let col = startCol; col <= endCol; col++) overflow[col] += 1
        continue
      }
      bars.push({
        gb,
        startCol,
        endCol,
        starts: !start.isBefore(weekStart),
        ends: !end.isAfter(weekEnd),
        row,
      })
    }
    weeks.push({ days, bars, overflow })
  }
  return weeks
}

/**
 * 공구 일정 월 달력 — 시안 `.cal-*`. 공구 기간은 가로 막대(진행중 · 오픈 예정 · 종료),
 * 하루짜리 기한(발송 · 서명)은 점 + 라벨, 주말 · 공휴일 칸은 회색, 오늘 칸은 인디고 테두리.
 */
export default function GroupBuyCalendar() {
  const navigate = useNavigate()
  const [month, setMonth] = useState(() => dayjs().startOf("month"))
  const monthKey = month.format("YYYY-MM")
  const { data, error } = useGetHomeCalendar(monthKey)

  const weeks = useMemo(() => buildWeeks(month, data), [month, data])
  const holidays = useMemo(
    () => new Map((data?.holidays ?? []).map(h => [h.date, h.name])),
    [data]
  )
  const deadlinesByDay = useMemo(() => {
    const map = new Map<string, Array<HomeCalendarDeadline>>()
    for (const deadline of data?.deadlines ?? []) {
      map.set(deadline.date, [...(map.get(deadline.date) ?? []), deadline])
    }
    return map
  }, [data])
  const isBlank =
    !!data && data.groupBuys.length === 0 && data.deadlines.length === 0
  const today = dayjs().format("YYYY-MM-DD")

  const openDeadline = (deadline: HomeCalendarDeadline) =>
    navigate(
      deadline.targetType === "CONTRACT"
        ? contractDetailPath(deadline.targetId)
        : groupBuyDetailPath(deadline.targetId)
    )

  return (
    <HomeCard
      title="공구 일정"
      headerExtra={
        <>
          <div className="ml-3 flex items-center gap-1.5">
            <MonthArrow
              label="이전 달"
              onClick={() => setMonth(prev => prev.subtract(1, "month"))}
            >
              ‹
            </MonthArrow>
            <span className="min-w-[86px] text-center text-[12px] font-semibold text-sz-n-900">
              {month.format("YYYY년 M월")}
            </span>
            <MonthArrow
              label="다음 달"
              onClick={() => setMonth(prev => prev.add(1, "month"))}
            >
              ›
            </MonthArrow>
          </div>
          {isBlank && (
            <span className="ml-3 text-[11px] text-sz-n-500">
              공구가 생기면 기간과 기한이 표시됩니다
            </span>
          )}
          <CalendarLegend />
        </>
      }
    >
      {isApiNotReady(error) ? (
        <NotReady title="준비 중인 기능입니다." />
      ) : (
        <>
          <div className="grid grid-cols-7 border-b border-sz-n-100">
            {WEEKDAYS.map(label => (
              <span
                key={label}
                className="px-2.5 py-1.5 text-[11px] text-sz-n-500"
              >
                {label}
              </span>
            ))}
          </div>
          {weeks.map(week => (
            <div
              key={week.days[0].format("YYYY-MM-DD")}
              className="relative grid grid-cols-7 border-t border-sz-n-100 first-of-type:border-t-0"
            >
              {week.days.map((date, col) => {
                const key = date.format("YYYY-MM-DD")
                const holiday = holidays.get(key)
                // 주말 · 공휴일(대체공휴일 포함) — 영업일 계산을 눈으로 보이게
                const off = date.day() === 0 || date.day() === 6 || !!holiday
                const outside = date.month() !== month.month()
                const deadlines = deadlinesByDay.get(key) ?? []
                const isToday = key === today
                return (
                  <div
                    key={key}
                    className={cn(
                      "relative h-[92px] border-l border-sz-n-100 px-2 py-[5px] first:border-l-0",
                      off && "bg-sz-n-50",
                      isToday &&
                        "shadow-[inset_0_0_0_1.5px_var(--color-sz-accent-500)]"
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-baseline gap-1 text-[11px] tabular-nums",
                        outside ? "text-sz-n-300" : "text-sz-n-700"
                      )}
                    >
                      <b className={cn(isToday && "text-sz-accent-500")}>
                        {date.date()}
                      </b>
                      {holiday && (
                        <em className="text-[10px] text-sz-n-500 not-italic">
                          {holiday}
                        </em>
                      )}
                    </div>
                    {week.overflow[col] > 0 && (
                      <span className="absolute top-[5px] right-1.5 text-[10px] text-sz-n-500">
                        +{week.overflow[col]}
                      </span>
                    )}
                    {deadlines.length > 0 && (
                      <button
                        type="button"
                        onClick={() => openDeadline(deadlines[0])}
                        title={deadlines.map(d => d.label).join("\n")}
                        className="absolute right-1.5 bottom-1.5 left-2 flex cursor-pointer items-center gap-1 overflow-hidden text-left text-[10px] whitespace-nowrap text-sz-n-700"
                      >
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sz-n-700" />
                        <span className="truncate">
                          {deadlines[0].label}
                          {deadlines.length > 1 &&
                            ` 외 ${deadlines.length - 1}`}
                        </span>
                      </button>
                    )}
                  </div>
                )
              })}

              {week.bars.map(bar => {
                const span = bar.endCol - bar.startCol + 1
                const inset = (bar.starts ? 4 : 0) + (bar.ends ? 4 : 0)
                return (
                  <button
                    key={bar.gb.groupBuyId}
                    type="button"
                    onClick={() =>
                      navigate(groupBuyDetailPath(bar.gb.groupBuyId))
                    }
                    title={`${bar.gb.name}${barSuffix(bar.gb)}`}
                    className={cn(
                      "absolute z-[1] flex h-[17px] cursor-pointer items-center overflow-hidden px-[7px] text-[10.5px] font-semibold text-ellipsis whitespace-nowrap",
                      BAR_TONE[bar.gb.status] ?? BAR_TONE.UPCOMING,
                      bar.starts && "rounded-l-[4px]",
                      bar.ends && "rounded-r-[4px]"
                    )}
                    style={{
                      left: `calc(${bar.startCol} * 100% / 7 + ${bar.starts ? 4 : 0}px)`,
                      width: `calc(${span} * 100% / 7 - ${inset}px)`,
                      top: BAR_TOP + bar.row * BAR_STEP,
                    }}
                  >
                    <span className="truncate">
                      {bar.gb.name}
                      {bar.starts && barSuffix(bar.gb)}
                    </span>
                  </button>
                )
              })}
            </div>
          ))}
        </>
      )}
    </HomeCard>
  )
}

function MonthArrow(props: {
  label: string
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      aria-label={props.label}
      onClick={props.onClick}
      className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-[6px] border border-sz-n-300 text-[12px] text-sz-n-600 hover:bg-sz-n-100"
    >
      {props.children}
    </button>
  )
}

function CalendarLegend() {
  const swatch = "mr-1 inline-block h-2 w-3.5 rounded-[2px] align-[0]"
  return (
    <div className="ml-auto flex items-center gap-3 text-[11px] text-sz-n-500">
      <span>
        <i className={cn(swatch, "bg-sz-accent-500")} />
        진행중
      </span>
      <span>
        <i className={cn(swatch, "bg-sz-n-200")} />
        오픈 예정
      </span>
      <span>
        <i className={cn(swatch, "bg-sz-n-100")} />
        종료
      </span>
      <span>
        <i className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-sz-n-700 align-[0]" />
        기한
      </span>
      <span>
        <i className={cn(swatch, "border border-sz-n-200 bg-sz-n-50")} />
        주말·공휴일
      </span>
    </div>
  )
}
