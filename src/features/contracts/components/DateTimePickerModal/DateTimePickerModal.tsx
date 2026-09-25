import { ModalShell } from "@/common/components/ModalShell/ModalShell"
import CalendarGrid from "@/features/contracts/components/DateTimePickerModal/CalendarGrid"
import TimeSelect from "@/features/contracts/components/DateTimePickerModal/TimeSelect"
import { useCalendarMonth } from "@/features/contracts/components/DateTimePickerModal/useCalendarMonth"
import Btn from "@/features/contracts/components/shared/Btn"
import { FLINK_CLASS } from "@/features/contracts/components/shared/styles"
import { cn } from "@/lib/utils"
import dayjs, { type Dayjs } from "dayjs"
import type { ReactNode } from "react"
import { useState } from "react"

interface DateTimePickerModalProps {
  title: string
  /** 일 단위 경계(양끝 포함). 밖은 잠긴다 */
  minDate: Dayjs | null
  maxDate: Dayjs | null
  /** 현재 값 — 재진입 시 그 달·그 시각으로 연다 */
  value: Dayjs | null
  /** 종료 모달의 앵커(시작 일시) — 격자에 구간을 칠하고 상단 앵커 행을 그린다 */
  rangeStart?: Dayjs | null
  /** 앵커 행의 [변경] — 시작 모달로 되돌아간다 */
  onChangeAnchor?: () => void
  /** 점 표시(검토 요청일 = 오늘) */
  marker?: Dayjs | null
  /** 시안 `.cal-note` */
  note: ReactNode
  /** false면 날짜만 고른다(게시 완료 기한) */
  withTime?: boolean
  defaultTime?: { hour: number; minute: number }
  timeLabel?: string
  submitLabel: string
  /** 푸터 좌측 요약(`.cal-sum`) */
  renderSummary: (value: Dayjs | null) => ReactNode
  onCancel: () => void
  onSubmit: (value: Dayjs) => void
}

/**
 * 시안 C1·C2 — 달력 모달. 시작·종료를 **각각 다른 모달**에서 고르고, 제한값은 에러가 아니라
 * 선택 자체를 잠근다(§25-6-2). 시각은 시·분 드롭다운으로만 받는다.
 */
export default function DateTimePickerModal(props: DateTimePickerModalProps) {
  const {
    title,
    minDate,
    maxDate,
    value,
    rangeStart = null,
    onChangeAnchor,
    marker = null,
    note,
    withTime = true,
    defaultTime = { hour: 0, minute: 0 },
    timeLabel = "시각",
    submitLabel,
    renderSummary,
    onCancel,
    onSubmit,
  } = props

  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(
    value ? value.startOf("day") : null
  )
  const [hour, setHour] = useState(value ? value.hour() : defaultTime.hour)
  const [minute, setMinute] = useState(
    value ? value.minute() : defaultTime.minute
  )

  const { month, canPrev, canNext, prev, next } = useCalendarMonth(
    value ?? minDate ?? dayjs(),
    minDate,
    maxDate
  )

  const composed = selectedDate
    ? withTime
      ? selectedDate.hour(hour).minute(minute).second(0).millisecond(0)
      : selectedDate
    : null

  return (
    <ModalShell
      isOpen
      title={title}
      width={392}
      onClose={onCancel}
      bodyClassName="p-5"
      footer={
        <>
          <span className="mr-auto self-center text-[12px] tabular-nums text-sz-n-700">
            {renderSummary(composed)}
          </span>
          <Btn variant="ghost" onClick={onCancel}>
            취소
          </Btn>
          <Btn
            variant="primary"
            disabled={composed === null}
            onClick={() => composed && onSubmit(composed)}
          >
            {submitLabel}
          </Btn>
        </>
      }
    >
      {rangeStart && (
        <div className="mb-[14px] flex items-center gap-2 rounded-[6px] border border-sz-n-200 bg-sz-n-50 px-3 py-[9px] text-[12px] tabular-nums text-sz-n-900">
          <span className="text-sz-n-500">시작</span>
          {rangeStart.format("YYYY.MM.DD HH:mm")}
          {onChangeAnchor && (
            <button
              type="button"
              className={cn(FLINK_CLASS, "ml-auto")}
              onClick={onChangeAnchor}
            >
              변경
            </button>
          )}
        </div>
      )}

      <div className="mb-[2px] flex items-center justify-between">
        <button
          type="button"
          aria-label="이전 달"
          disabled={!canPrev}
          onClick={prev}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-[6px] border bg-white text-[15px] leading-none",
            canPrev
              ? "border-sz-n-200 text-sz-n-600 hover:border-sz-n-300 hover:bg-sz-n-100 hover:text-sz-n-900"
              : "cursor-not-allowed border-sz-n-100 text-sz-n-300"
          )}
        >
          ‹
        </button>
        <span className="text-[13px] font-semibold tabular-nums text-sz-n-900">
          {month.format("YYYY년 M월")}
        </span>
        <button
          type="button"
          aria-label="다음 달"
          disabled={!canNext}
          onClick={next}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-[6px] border bg-white text-[15px] leading-none",
            canNext
              ? "border-sz-n-200 text-sz-n-600 hover:border-sz-n-300 hover:bg-sz-n-100 hover:text-sz-n-900"
              : "cursor-not-allowed border-sz-n-100 text-sz-n-300"
          )}
        >
          ›
        </button>
      </div>

      <div className="my-2 mb-3 text-[11px] leading-[1.6] text-sz-n-500">
        {note}
      </div>

      <CalendarGrid
        month={month}
        min={minDate}
        max={maxDate}
        selected={selectedDate}
        rangeStart={rangeStart}
        marker={marker}
        onSelect={setSelectedDate}
      />

      {withTime && (
        <TimeSelect
          label={timeLabel}
          hour={hour}
          minute={minute}
          onChange={(nextHour, nextMinute) => {
            setHour(nextHour)
            setMinute(nextMinute)
          }}
        />
      )}
    </ModalShell>
  )
}
