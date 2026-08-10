import { useState, useRef, useEffect } from "react"
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react"

export interface DateRange {
  from: Date | null
  to: Date | null
}

interface FormDateRangePickerProps {
  value?: DateRange
  onChange?: (value: DateRange) => void
  disabled?: boolean
}

const DAYS_OF_WEEK = ["일", "월", "화", "수", "목", "금", "토"]

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function isInRange(date: Date, from: Date, to: Date): boolean {
  const t = date.getTime()
  return t > from.getTime() && t < to.getTime()
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

interface CalendarProps {
  month: Date
  range: DateRange
  hovered: Date | null
  onDateClick: (date: Date) => void
  onDateHover: (date: Date | null) => void
  onPrevMonth: () => void
  onNextMonth: () => void
}

function Calendar(props: CalendarProps) {
  const {
    month,
    range,
    hovered,
    onDateClick,
    onDateHover,
    onPrevMonth,
    onNextMonth,
  } = props

  const year = month.getFullYear()
  const monthIdx = month.getMonth()
  const daysInMonth = getDaysInMonth(year, monthIdx)
  const firstDayOfWeek = startOfMonth(month).getDay()
  const today = new Date()

  const cells: (Date | null)[] = []
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, monthIdx, d))

  const MONTH_NAMES = [
    "1월",
    "2월",
    "3월",
    "4월",
    "5월",
    "6월",
    "7월",
    "8월",
    "9월",
    "10월",
    "11월",
    "12월",
  ]

  return (
    <div className="bg-white border border-sz-n-200 rounded-lg shadow-lg p-4 w-72">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={onPrevMonth}
          className="p-1 rounded hover:bg-sz-n-100"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold">
          {year}년 {MONTH_NAMES[monthIdx]}
        </span>
        <button
          type="button"
          onClick={onNextMonth}
          className="p-1 rounded hover:bg-sz-n-100"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {DAYS_OF_WEEK.map(day => (
          <div
            key={day}
            className="text-center text-xs text-sz-n-500 py-1 font-medium"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((date, idx) => {
          if (!date) return <div key={`empty-${idx}`} />

          const isFrom = range.from && isSameDay(date, range.from)
          const isTo = range.to && isSameDay(date, range.to)
          const isToday = isSameDay(date, today)

          const effectiveTo =
            range.to ?? (range.from && hovered ? hovered : null)
          const inRange =
            range.from &&
            effectiveTo &&
            isInRange(
              date,
              range.from < effectiveTo ? range.from : effectiveTo,
              range.from < effectiveTo ? effectiveTo : range.from
            )

          const isSelected = isFrom || isTo

          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => onDateClick(date)}
              onMouseEnter={() => onDateHover(date)}
              onMouseLeave={() => onDateHover(null)}
              className={[
                "text-center text-sm py-1.5 rounded transition-colors",
                isSelected
                  ? "bg-sz-accent-500 text-white font-medium"
                  : inRange
                    ? "bg-sz-accent-100 text-sz-accent-600"
                    : isToday
                      ? "border border-sz-accent-100 text-sz-accent-600"
                      : "hover:bg-sz-n-100 text-sz-n-700",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function FormDateRangePicker(props: FormDateRangePickerProps) {
  const { value, onChange, disabled = false } = props

  const range: DateRange = value ?? { from: null, to: null }

  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState(() => new Date())
  const [hovered, setHovered] = useState<Date | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleDateClick = (date: Date) => {
    if (!range.from || (range.from && range.to)) {
      onChange?.({ from: date, to: null })
    } else {
      const from = range.from
      if (date < from) {
        onChange?.({ from: date, to: from })
      } else {
        onChange?.({ from, to: date })
        setOpen(false)
      }
    }
  }

  const displayText = () => {
    if (range.from && range.to) {
      return `${formatDate(range.from)} ~ ${formatDate(range.to)}`
    }
    if (range.from) return `${formatDate(range.from)} ~`
    return ""
  }

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(prev => !prev)}
        className={[
          "flex items-center gap-2 px-3 h-10 rounded-md border text-sm min-w-64",
          "transition-colors focus:outline-none focus:ring-2 focus:ring-sz-accent-500/20",
          disabled
            ? "bg-sz-n-50 text-sz-n-400 cursor-not-allowed border-sz-n-200"
            : "bg-white text-sz-n-700 border-sz-n-300 hover:border-sz-n-400",
          range.from ? "text-sz-n-900" : "text-sz-n-400",
        ].join(" ")}
      >
        <CalendarIcon size={16} className="text-sz-n-400 shrink-0" />
        <span>{displayText() || "날짜를 선택해 주세요"}</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50">
          <Calendar
            month={month}
            range={range}
            hovered={hovered}
            onDateClick={handleDateClick}
            onDateHover={setHovered}
            onPrevMonth={() =>
              setMonth(
                prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
              )
            }
            onNextMonth={() =>
              setMonth(
                prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
              )
            }
          />
        </div>
      )}
    </div>
  )
}
