import { FORM_SELECT_CHEVRON_STYLE } from "@/features/contracts/constants/params"
import { MINUTE_STEP } from "@/features/contracts/constants/rules"
import { SELECT_CLASS } from "@/features/contracts/components/shared/styles"
import { cn } from "@/lib/utils"

const HOURS = Array.from({ length: 24 }, (_, hour) => hour)
const MINUTES = Array.from(
  { length: 60 / MINUTE_STEP },
  (_, i) => i * MINUTE_STEP
)

function pad(value: number) {
  return String(value).padStart(2, "0")
}

interface TimeSelectProps {
  label: string
  hour: number
  minute: number
  onChange: (hour: number, minute: number) => void
}

/** 시안 `.cal-time` — 시(00~23) · 분(5분 단위) 드롭다운. 자유 입력이 아니라 값 자체를 제한한다 */
export default function TimeSelect(props: TimeSelectProps) {
  const { label, hour, minute, onChange } = props

  const selectClass = cn(SELECT_CLASS, "h-[34px] w-[70px] pr-6")

  return (
    <div className="mt-4 flex items-center justify-between gap-3 border-t border-sz-n-100 pt-[14px]">
      <span className="text-[12px] font-medium text-sz-n-600">{label}</span>
      <div className="flex items-center gap-[5px]">
        <select
          aria-label="시"
          value={hour}
          onChange={event => onChange(Number(event.target.value), minute)}
          style={FORM_SELECT_CHEVRON_STYLE}
          className={selectClass}
        >
          {HOURS.map(value => (
            <option key={value} value={value}>
              {pad(value)}
            </option>
          ))}
        </select>
        <span className="text-[12px] text-sz-n-500">시</span>
        <select
          aria-label="분"
          value={minute}
          onChange={event => onChange(hour, Number(event.target.value))}
          style={FORM_SELECT_CHEVRON_STYLE}
          className={selectClass}
        >
          {MINUTES.map(value => (
            <option key={value} value={value}>
              {pad(value)}
            </option>
          ))}
        </select>
        <span className="text-[12px] text-sz-n-500">분</span>
      </div>
    </div>
  )
}
