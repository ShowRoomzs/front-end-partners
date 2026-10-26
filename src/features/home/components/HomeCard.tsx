import { cn } from "@/lib/utils"
import type { ReactNode } from "react"
import { Link } from "react-router-dom"

/** 시안 `.hm-sec` + `.hm-h` — 홈 섹션(제목 · 보조 설명) */
export function HomeSection(props: {
  title?: string
  hint?: string
  className?: string
  children: ReactNode
}) {
  const { title, hint, className, children } = props
  return (
    <section className={cn("mb-6", className)}>
      {title && (
        <div className="mb-2.5 flex items-baseline gap-2">
          <span className="text-[13px] font-semibold text-sz-n-900">
            {title}
          </span>
          {hint && <span className="text-[11px] text-sz-n-500">{hint}</span>}
        </div>
      )}
      {children}
    </section>
  )
}

/** 시안 `.hm-card` + `.hc-h` — 제목 · 건수 · 오른쪽 메뉴 링크 */
export function HomeCard(props: {
  title: ReactNode
  count?: string
  link?: { label: string; to: string }
  /** 제목 줄에 붙는 것(달력 월 이동 · 실시간 점 등) */
  headerExtra?: ReactNode
  className?: string
  children: ReactNode
}) {
  const { title, count, link, headerExtra, className, children } = props
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-[8px] border border-sz-n-200 bg-white",
        className
      )}
    >
      <div className="flex items-center gap-2 border-b border-sz-n-100 px-4 py-3">
        <span className="text-[12px] font-semibold text-sz-n-900">{title}</span>
        {count && <span className="text-[11px] text-sz-n-500">{count}</span>}
        {headerExtra}
        {link && (
          <Link
            to={link.to}
            className="ml-auto shrink-0 text-[11px] text-sz-accent-500 hover:text-sz-accent-600"
          >
            {link.label}
          </Link>
        )}
      </div>
      {children}
    </div>
  )
}

/** 시안 `.hm-empty` — 카드 안 빈 상태 한 줄 */
export function HomeEmpty(props: { children: ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-[22px] text-center text-[12px] text-sz-n-500">
      {props.children}
    </div>
  )
}
