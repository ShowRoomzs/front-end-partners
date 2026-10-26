import StatusBadge from "@/common/components/StatusBadge/StatusBadge"
import type { PerformanceFigure } from "@/features/performance/types"
import {
  figureSub,
  formatFigure,
  type FigureUnit,
} from "@/features/performance/utils/format"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import type { ReactNode } from "react"

/** 시안 라벨 옆 `.badge.b-neutral` 10px 「예정」 — 집계 중 값이 줄어들 수 있다는 표시 */
export function ProjectedTag() {
  return (
    <span className="ml-[5px] inline-flex align-middle [&>span]:text-[10px]">
      <StatusBadge variant="neutral">예정</StatusBadge>
    </span>
  )
}

/** 정산 후 확정 · 집계 준비 중 — 숫자 대신 글자를 13px 회색으로 */
const PENDING_TEXT: Partial<Record<PerformanceFigure["state"], string>> = {
  PENDING_SETTLEMENT: "정산 후 확정",
  NOT_AVAILABLE: "집계 준비 중",
}

/**
 * 시안 `.kc` — 지표 카드 하나. 상태 표현은 서버 `state`가 정한다.
 * PROJECTED = 회색 + 「예정」 · PENDING_SETTLEMENT = 「정산 후 확정」 · NEGOTIATING = 「협의 중」 +
 * 원래 값 · 값 없음 = 「—」(0으로 채우지 않는다 — 0원이 실적처럼 읽힌다).
 */
export function KpiCard(props: {
  label: string
  figure?: PerformanceFigure | null
  unit?: FigureUnit
  /** 숫자가 아닌 값(상품명 · 성비) — figure 대신 쓴다 */
  text?: string | null
  sub?: string | null
  small?: boolean
}) {
  const { label, figure, unit = "plain", text, sub, small = false } = props
  const state = figure?.state ?? "FINAL"
  const pendingText = PENDING_TEXT[state]
  const negotiating = state === "NEGOTIATING"
  const empty = text === undefined ? figure?.value == null : text == null
  const value =
    text !== undefined
      ? (text ?? "—")
      : negotiating
        ? "협의 중"
        : formatFigure(figure, unit)
  const subText = sub !== undefined ? sub : figureSub(figure, unit)

  return (
    <div className="rounded-[8px] border border-sz-n-200 bg-white px-4 py-3.5">
      <div className="text-[11px] text-sz-n-600">
        {label}
        {state === "PROJECTED" && <ProjectedTag />}
      </div>
      {pendingText ? (
        <div className="mt-[5px] text-[13px] leading-[1.2] font-medium text-sz-n-500">
          {pendingText}
        </div>
      ) : (
        <div
          className={cn(
            "mt-[5px] leading-[1.2] font-semibold tabular-nums",
            small ? "text-[17px]" : "text-[21px]",
            negotiating || state === "PROJECTED"
              ? "text-sz-n-500"
              : empty && !negotiating
                ? "text-sz-n-300"
                : "text-sz-n-900"
          )}
        >
          {value}
        </div>
      )}
      {subText && (
        <div
          className={cn(
            "mt-1 text-[11px] tabular-nums",
            empty && state === "FINAL" ? "text-sz-n-400" : "text-sz-n-500"
          )}
        >
          {subText}
        </div>
      )}
    </div>
  )
}

/** 시안 `.kgrid` — c3 · c4 */
export function KpiGrid(props: {
  cols: 3 | 4
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        "mb-4 grid gap-3",
        props.cols === 4 ? "grid-cols-4" : "grid-cols-3",
        props.className
      )}
    >
      {props.children}
    </div>
  )
}

/** 시안 `.fp-item` — 색 없는 체크 + 건수(정산 관리와 같은 모양) */
export function StatusCheck(props: {
  checked: boolean
  label: string
  count: number
  onToggle: () => void
}) {
  const { checked, label, count, onToggle } = props
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center gap-1.5 text-[12px]",
        checked ? "font-medium text-sz-n-900" : "text-sz-n-600"
      )}
    >
      <span
        className={cn(
          "flex size-[15px] shrink-0 items-center justify-center rounded-[4px] border-[1.5px]",
          checked
            ? "border-sz-accent-500 bg-sz-accent-500"
            : "border-sz-n-300 bg-white"
        )}
      >
        {checked && <Check className="size-[9px] text-white" strokeWidth={3} />}
      </span>
      {label}
      <span
        className={cn(
          "text-[11px]",
          checked ? "text-sz-n-500" : "text-sz-n-400"
        )}
      >
        {count}
      </span>
    </button>
  )
}

export function FilterLabel({ children }: { children: ReactNode }) {
  return (
    <span className="w-[62px] shrink-0 text-[11px] font-semibold text-sz-n-500">
      {children}
    </span>
  )
}

/** 시안 `.note2` 안의 `<b>` — 진하게만 */
export function B({ children }: { children: ReactNode }) {
  return <b className="font-semibold">{children}</b>
}
