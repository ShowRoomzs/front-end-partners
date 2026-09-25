import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface ConsentCheckProps {
  checked: boolean
  onChange: (checked: boolean) => void
  children: ReactNode
  required?: boolean
  className?: string
}

/** 시안 `.chk`/`.cbox` — 고지 확인 체크(고정 지급비 고지 · 검토 요청 경고 확인) */
export default function ConsentCheck(props: ConsentCheckProps) {
  const { checked, onChange, children, required = false, className } = props

  return (
    <label
      className={cn(
        "inline-flex cursor-pointer items-center gap-[7px] text-[11px] font-medium",
        className
      )}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={event => onChange(event.target.checked)}
      />
      <span
        aria-hidden
        className={cn(
          "flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-[4px] border-[1.5px] bg-white",
          checked ? "border-sz-accent-500 bg-sz-accent-500" : "border-sz-n-400"
        )}
      >
        {checked && (
          <svg viewBox="0 0 10 10" className="h-2.5 w-2.5">
            <path
              d="M1.5 5L4 7.5L8.5 2"
              stroke="#fff"
              strokeWidth={1.9}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span>
        {children}
        {required && <span className="ml-0.5 text-sz-danger-text">*</span>}
      </span>
    </label>
  )
}
