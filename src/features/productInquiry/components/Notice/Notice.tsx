import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

export type NoticeTone = "info" | "warn" | "danger" | "neutral"

const TONE_CLASS: Record<NoticeTone, string> = {
  info: "bg-sz-info-bg text-sz-info-text",
  warn: "bg-sz-warning-bg text-sz-warning-text",
  danger: "bg-sz-danger-bg text-sz-danger-text",
  neutral: "bg-sz-n-100 text-sz-n-600",
}

/**
 * 시안 `.notice` — 카드 안에 들어가는 안내 배너.
 *
 * 상태색 4원칙을 그대로 쓴다. 검토 중은 정보, 반려는 경고, 삭제 집행은 위험이다.
 * 이 화면에서 붉은 배너가 뜨는 경우는 **삭제된 문의 하나뿐**이며 입력 오류가 아니다 —
 * §23에는 에러 문구 자체가 없다.
 */
export default function Notice(props: {
  tone: NoticeTone
  children: ReactNode
  className?: string
}) {
  const { tone, children, className } = props

  return (
    <div
      className={cn(
        "rounded-[6px] px-[13px] py-[11px] text-[11px] leading-[1.6]",
        TONE_CLASS[tone],
        className
      )}
    >
      {children}
    </div>
  )
}
