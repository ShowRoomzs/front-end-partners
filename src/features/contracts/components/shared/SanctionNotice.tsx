import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

export type SanctionNoticeTone = "warn" | "danger" | "neutral"

const TONE_CLASS: Record<SanctionNoticeTone, string> = {
  warn: "bg-sz-warning-bg text-sz-warning-text",
  danger: "bg-sz-danger-bg text-sz-danger-text",
  neutral: "bg-sz-n-100 text-sz-n-700",
}

/**
 * 시안 ui-partner-15 `.szn` — 계정 이용 정지 · 상대 계정 보류 안내(화면 머리 아래 · 카드 밖).
 * 공용 `Notice`는 카드 안 배너(11px · 6px 모서리)라 크기가 달라 따로 둔다(12px · 8px · 아래 12px).
 * 내 정지로 막힌 일은 경고, 지급 정지 사유는 위험, 상대 사정 · 열람 전용은 중립이다.
 */
export default function SanctionNotice(props: {
  tone: SanctionNoticeTone
  title: string
  children?: ReactNode
  className?: string
}) {
  const { tone, title, children, className } = props
  return (
    <div
      className={cn(
        "mb-3 rounded-[8px] px-3.5 py-2.5 text-left text-[12px] leading-[1.6]",
        TONE_CLASS[tone],
        className
      )}
    >
      <b className="font-semibold">{title}</b>
      {children && <> {children}</>}
    </div>
  )
}
