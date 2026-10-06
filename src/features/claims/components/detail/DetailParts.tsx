import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import { useEffect } from "react"
import type { ReactNode } from "react"

/** 시안 `.mbox` — 상세 모달 안의 카드 */
export function MBox(props: {
  title: ReactNode
  note?: ReactNode
  tight?: boolean
  children: ReactNode
  tone?: "default" | "warn"
}) {
  const { title, note, tight = false, children, tone = "default" } = props
  return (
    <div className="rounded-[8px] border border-sz-n-200 bg-white">
      <div
        className={cn(
          "flex items-center gap-2 rounded-t-[8px] border-b px-4 py-[11px] text-[13px] font-semibold",
          tone === "warn"
            ? "border-[#E8DCC0] bg-sz-warning-bg text-sz-warning-text"
            : "border-sz-n-200 bg-sz-n-50 text-sz-n-900"
        )}
      >
        {title}
        {note && (
          <span className="text-[11px] font-normal text-sz-n-500">{note}</span>
        )}
      </div>
      <div className={tight ? "px-4 py-3" : "p-4"}>{children}</div>
    </div>
  )
}

/** 시안 `.frow.ro` — 라벨 140px 읽기 행 */
export function FRow(props: {
  label: string
  children: ReactNode
  sub?: ReactNode
}) {
  return (
    <div className="flex gap-3 border-b border-sz-n-100 py-[9px] text-[12px] first:pt-0 last:border-b-0">
      <div className="w-[140px] shrink-0 text-sz-n-500">{props.label}</div>
      <div className="min-w-0 flex-1 text-sz-n-900">
        {props.children}
        {props.sub && (
          <div className="mt-[2px] text-[11px] text-sz-n-500">{props.sub}</div>
        )}
      </div>
    </div>
  )
}

/** 시안 `.st-hint` */
export function Hint(props: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "mt-2.5 text-[11px] leading-[1.55] text-sz-n-500 [&_b]:font-semibold [&_b]:text-sz-n-700",
        props.className
      )}
    >
      {props.children}
    </div>
  )
}

/** 시안 `.hitem` 목록 — 처리 이력(최신순) */
export function HistoryRows(props: {
  items: Array<{ key: string; text: ReactNode; meta: string; tone?: string }>
}) {
  const DOT: Record<string, string> = {
    success: "bg-sz-success-text",
    info: "bg-sz-info-text",
    warning: "bg-sz-warning-text",
    danger: "bg-sz-danger-text",
  }
  if (props.items.length === 0) {
    return (
      <div className="py-2 text-[12px] text-sz-n-500">이력이 없습니다.</div>
    )
  }
  return (
    <div>
      {props.items.map(item => (
        <div key={item.key} className="flex gap-2.5 py-[9px]">
          <span
            className={cn(
              "mt-1.5 size-[7px] shrink-0 rounded-full",
              (item.tone && DOT[item.tone]) ?? "bg-sz-n-300"
            )}
          />
          <div>
            <div className="text-[12px] text-sz-n-900">{item.text}</div>
            <div className="text-[11px] text-sz-n-500">{item.meta}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * 시안 `.modal.wide` — 1040px · 헤더(제목 + 배지 + [‹ 이전][다음 ›] + ✕) · 좌 본문 + 우 레일 300px.
 * 모달 위에 모달을 띄우지 않는다 — 반려 폼·송장 입력은 우 레일에서 펼친다.
 */
export function WideModal(props: {
  title: ReactNode
  onClose: () => void
  onPrev?: () => void
  onNext?: () => void
  children: ReactNode
}) {
  const { title, onClose, onPrev, onNext, children } = props

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleKey)
      document.body.style.overflow = "unset"
    }
  }, [onClose])

  const NAV =
    "inline-flex h-8 cursor-pointer items-center gap-[5px] whitespace-nowrap rounded-[6px] border border-sz-n-300 bg-white px-3 text-[12px] font-medium text-sz-n-700 hover:border-sz-n-400 hover:bg-sz-n-100 hover:text-sz-n-900 disabled:cursor-not-allowed disabled:text-sz-n-300 disabled:hover:bg-white"

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(26,27,31,0.4)]">
      <div className="flex max-h-[92vh] w-[1040px] flex-col overflow-hidden rounded-[8px] bg-white shadow-[0_8px_24px_rgba(26,27,31,0.12),0_2px_6px_rgba(26,27,31,0.08)]">
        <div className="flex shrink-0 items-center justify-between border-b border-sz-n-200 px-5 py-3.5 text-[13px] font-semibold">
          <span className="flex items-center gap-2.5">{title}</span>
          <span className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              className={NAV}
              disabled={!onPrev}
              onClick={onPrev}
            >
              ‹ 이전
            </button>
            <button
              type="button"
              className={NAV}
              disabled={!onNext}
              onClick={onNext}
            >
              다음 ›
            </button>
            <button
              type="button"
              aria-label="닫기"
              onClick={onClose}
              className="ml-1.5 cursor-pointer text-sz-n-400 hover:text-sz-n-600"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </span>
        </div>
        <div className="min-h-0 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
