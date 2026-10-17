import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

/**
 * 시안 `.grp` — 금액 · 분배·지급 · 증빙 · 명세 묶음 제목. 위 여백은 언제나 20px —
 * 시안의 `.grp:first-of-type`(16px)은 앞에 같은 div 형제가 있어 실제로는 걸리지 않는다.
 */
export function Grp(props: { title: string; sub: string }) {
  return (
    <div className="mt-5 mb-3 flex items-baseline gap-[9px] border-b-[1.5px] border-sz-n-300 pb-2">
      <span className="text-[16px] font-semibold text-sz-n-900">
        {props.title}
      </span>
      <span className="text-[11px] text-sz-n-500">{props.sub}</span>
    </div>
  )
}

/** 시안 `.sec` / `.sec-h` / `.sec-b` */
export function Sec(props: {
  title?: string
  note?: ReactNode
  tone?: "warning"
  className?: string
  bodyClassName?: string
  children: ReactNode
}) {
  const { title, note, tone, className, bodyClassName, children } = props
  return (
    <div
      className={cn(
        "mb-4 rounded-[8px] border border-sz-n-200 bg-white",
        className
      )}
    >
      {title && (
        <div
          className={cn(
            "flex items-center gap-2 rounded-t-[8px] border-b px-4 py-3",
            tone === "warning"
              ? "border-[#E8DCC0] bg-sz-warning-bg"
              : "border-sz-n-200 bg-sz-n-50"
          )}
        >
          <span
            className={cn(
              "text-[13px] font-semibold",
              tone === "warning" ? "text-sz-warning-text" : "text-sz-n-900"
            )}
          >
            {title}
          </span>
          {note && (
            <span
              className={cn(
                "text-[11px]",
                tone === "warning" ? "text-sz-warning-text" : "text-sz-n-500"
              )}
            >
              {note}
            </span>
          )}
        </div>
      )}
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </div>
  )
}

/** 시안 `.note2` */
export function Note(props: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("mt-3 text-[11px] text-sz-n-500", props.className)}>
      {props.children}
    </div>
  )
}

/** 시안 `.mnote` — 셀 안 보조 줄 */
export function MNote({ children }: { children: ReactNode }) {
  return (
    <span className="mt-0.5 block text-[11px] font-normal text-sz-n-500 normal-nums">
      {children}
    </span>
  )
}

/** 시안 `.empty`(카드 안 축소판) — 정산 확정 전이라 값이 존재하지 않는 자리 */
export function SecEmpty({ children }: { children: ReactNode }) {
  return (
    <div className="px-5 py-7 text-center text-[12px] text-sz-n-500">
      {children}
    </div>
  )
}

/** 시안 `.frow.ro` — 140px 라벨 + 값 */
export function ReadRow(props: {
  label: string
  children: ReactNode
  sub?: ReactNode
  first?: boolean
  muted?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex gap-3 border-b border-sz-n-100 py-[9px] text-[12px] last:border-b-0",
        props.first && "pt-0",
        props.className
      )}
    >
      <div className="w-[140px] shrink-0 text-sz-n-500">{props.label}</div>
      <div
        className={cn(
          "min-w-0 flex-1 tabular-nums",
          props.muted ? "text-sz-n-500" : "text-sz-n-900"
        )}
      >
        {props.children}
        {props.sub && (
          <div className="mt-0.5 text-[11px] text-sz-n-500">{props.sub}</div>
        )}
      </div>
    </div>
  )
}

/** 시안 `.ltab` 머리 칸 */
export const LTAB_HEAD =
  "border-b border-sz-n-200 bg-sz-n-50 px-3 py-[9px] text-[11px] font-semibold text-sz-n-600"
/** 시안 `.ltab` 몸 칸 */
export const LTAB_CELL = "border-t border-sz-n-100 px-3 py-2.5 align-middle"

/** 시안 `.act-btn` — 표 안 작은 버튼 */
export function ActBtn(props: {
  children: ReactNode
  disabled?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      disabled={props.disabled}
      onClick={props.onClick}
      className="inline-flex h-[26px] items-center justify-center rounded-[6px] border border-sz-n-300 bg-white px-[11px] text-[11px] font-medium whitespace-nowrap text-sz-n-700 hover:border-sz-n-400 hover:bg-sz-n-100 disabled:cursor-not-allowed disabled:border-sz-n-200 disabled:bg-sz-n-100 disabled:text-sz-n-400"
    >
      {props.children}
    </button>
  )
}

/** [자문대기-…] · [미정] 표시 — 시안의 빨간 굵은 태그(`<b>` 기본 굵기) */
export function WaitTag({ children }: { children: ReactNode }) {
  return <b className="text-sz-danger-text">{children}</b>
}

/*
  시안 `.mtab`(금액 분해 · 조정 내역 · C1 미리보기) — 행 사이 n-100 구분선(시안 전역 `tbody td` 규칙),
  소계 행은 n-300 · 총계 행은 1.5px n-400. 선은 td에 그어야 border-collapse에서 색이 섞이지 않는다.
*/
export const MTAB_TBODY = "[&>tr:first-child>td]:border-t-0"
export const MTAB_ROW = "[&>td]:border-t [&>td]:border-sz-n-100"
export const MTAB_MID_ROW =
  "bg-sz-n-50 font-semibold [&>td]:border-t [&>td]:border-sz-n-300"
export const MTAB_TOT_ROW =
  "bg-sz-n-50 text-[16px] font-semibold text-sz-n-900 [&>td]:border-t-[1.5px] [&>td]:border-sz-n-400"
export const MTAB_CELL = "px-3 py-2.5"
export const MTAB_AMOUNT = "px-3 py-2.5 text-right tabular-nums"
