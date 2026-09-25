import { cn } from "@/lib/utils"

interface SegmentedControlProps<T extends string> {
  options: Array<{ value: T; label: string }>
  value: T | null
  onChange: (value: T) => void
  disabled?: boolean
  /** 시안 `.seg-i` — 32px(지급 시점). 기본은 `.sg` 34px */
  compact?: boolean
}

/** 시안 `.seg` — 배타적 선택 세그먼트. 선택 값은 액센트로 채운다 */
export default function SegmentedControl<T extends string>(
  props: SegmentedControlProps<T>
) {
  const { options, value, onChange, disabled = false, compact = false } = props

  return (
    <div
      role="radiogroup"
      className="inline-flex overflow-hidden rounded-[6px] border border-sz-n-300 bg-white"
    >
      {options.map(option => {
        const isOn = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isOn}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex items-center whitespace-nowrap border-r border-sz-n-200 text-[12px] last:border-r-0",
              compact ? "h-8 px-3.5" : "h-[34px] px-[15px]",
              isOn
                ? "bg-sz-accent-500 font-medium text-white"
                : "text-sz-n-600 hover:bg-sz-n-50 hover:text-sz-n-900",
              disabled && "cursor-not-allowed bg-sz-n-100 text-sz-n-400",
              disabled && isOn && "bg-sz-accent-500 text-white"
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
