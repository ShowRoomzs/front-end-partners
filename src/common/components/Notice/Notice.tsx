import { cn } from "@/lib/utils"
import type { ReactNode } from "react"
import {
  NOTE_CLASS,
  NOTICE_BASE_CLASS,
  NOTICE_TONE_CLASS,
} from "./noticeStyles"

export type NoticeTone =
  | "info"
  | "warn"
  | "danger"
  | "neutral"
  | "consent"
  | "success"

/**
 * 안내 배너 — 디자인시스템 v1.3 `.notice`(정보 · 경고 · 위험)와 `.sec-note`(중립).
 *
 * 상태색 원칙을 그대로 쓴다. 검토 중은 정보, 반려는 경고, 삭제 집행·거절은 위험,
 * 만료·취소 같은 중립 종결은 무채색이다. `consent`만 색이 아니라 **동의를 받는 자리**라
 * 중립 상자 모양에 본문색(n-700)을 쓴다.
 *
 * 원래 상품 문의 전용이었으나 계약 관리가 같은 배너를 쓰면서 공용으로 올렸다.
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
        tone === "neutral" || tone === "consent"
          ? NOTE_CLASS
          : [NOTICE_BASE_CLASS, NOTICE_TONE_CLASS[tone]],
        tone === "consent" && "text-sz-n-700",
        className
      )}
    >
      {children}
    </div>
  )
}
