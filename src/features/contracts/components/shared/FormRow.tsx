import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface FormRowProps {
  label: string
  required?: boolean
  children: ReactNode
  /** 읽기 전용 행(시안 `.frow.ro`) — 라벨 위 여백을 없앤다 */
  readOnly?: boolean
  className?: string
}

/**
 * 시안 `.frow` — 라벨 140px + 값. 입력이 들어가는 행은 라벨을 인풋 글자선에 맞춰 8px 내린다.
 * 공용 `FieldRow`(DetailCard)는 읽기 전용이라 필수 표시·라벨 정렬이 없어 따로 둔다.
 */
export default function FormRow(props: FormRowProps) {
  const {
    label,
    required = false,
    children,
    readOnly = false,
    className,
  } = props

  return (
    <div
      className={cn(
        "flex gap-3 border-b border-sz-n-100 py-[9px] text-[12px] first:pt-0 last:border-b-0",
        className
      )}
    >
      <div
        className={cn("w-[140px] shrink-0 text-sz-n-500", !readOnly && "pt-2")}
      >
        {label}
        {required && <span className="ml-0.5 text-sz-danger-text">*</span>}
      </div>
      <div className="min-w-0 flex-1 text-sz-n-900">{children}</div>
    </div>
  )
}
