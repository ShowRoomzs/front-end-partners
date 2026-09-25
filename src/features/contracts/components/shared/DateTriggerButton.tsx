import { cn } from "@/lib/utils"

interface DateTriggerButtonProps {
  /** 선택된 값의 표시 문자열 — 없으면 placeholder를 회색으로 보인다 */
  value: string | null
  placeholder: string
  onClick: () => void
  disabled?: boolean
  /** 시안 `.dur` — 종료 트리거 우측의 "8일" */
  trailing?: string | null
  className?: string
}

/** 시안 `.dtrig` — 달력 모달을 여는 트리거. 직접 입력은 받지 않는다(§25-6-2) */
export default function DateTriggerButton(props: DateTriggerButtonProps) {
  const {
    value,
    placeholder,
    onClick,
    disabled = false,
    trailing,
    className,
  } = props

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-9 min-w-[260px] items-center gap-2 rounded-[6px] border border-sz-n-300 bg-white px-3 text-[13px] text-sz-n-900",
        !disabled && "cursor-pointer hover:border-sz-accent-500",
        value === null && "text-sz-n-400",
        disabled &&
          "cursor-not-allowed border-sz-n-200 bg-sz-n-100 text-sz-n-400 hover:border-sz-n-200",
        className
      )}
    >
      <svg
        className="h-3.5 w-3.5 shrink-0 text-sz-n-500"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden
      >
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 3v4M16 3v4" />
      </svg>
      <span className="tabular-nums">{value ?? placeholder}</span>
      {trailing && (
        <span className="ml-auto text-[11px] text-sz-n-500">{trailing}</span>
      )}
    </button>
  )
}
