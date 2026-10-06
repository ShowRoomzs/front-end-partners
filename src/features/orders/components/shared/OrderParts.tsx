import StatusBadge from "@/common/components/StatusBadge/StatusBadge"
import { SELECT_CHEVRON_STYLE } from "@/features/contracts/constants/params"
import { toneToVariant } from "@/features/orders/utils/view"
import type { OrderBadgeTone } from "@/features/orders/types"
import { cn } from "@/lib/utils"
import type {
  ButtonHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react"

/*
  시안 ui-partner-10a~10e의 원자 조각 — 주문 관리 안에서만 쓴다.
  모달·요약 박스(.modal · .msum · .mlabel …)는 공구 관리와 같은 규격이라 GbParts를 가져다 쓰고,
  주문에만 있는 조각(.cb · .act-btn · .xt · .sel-sm · .mbox …)을 여기 둔다.
*/

export function OrderBadge(props: {
  tone: OrderBadgeTone
  children: ReactNode
}) {
  return (
    <StatusBadge variant={toneToVariant(props.tone)}>
      {props.children}
    </StatusBadge>
  )
}

/** 시안 `.cb` — 15px · 1.5px 테두리. 공용 Checkbox(16px · 다른 색)와 규격이 달라 따로 둔다 */
export function Cb(props: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  disabled?: boolean
}) {
  const { checked, onChange, label, disabled = false } = props
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={event => {
        event.stopPropagation()
        onChange(!checked)
      }}
      className={cn(
        "inline-flex size-[15px] shrink-0 cursor-pointer items-center justify-center rounded-[4px] border-[1.5px] align-middle disabled:cursor-not-allowed disabled:opacity-50",
        checked
          ? "border-sz-accent-500 bg-sz-accent-500"
          : "border-sz-n-300 bg-white"
      )}
    >
      {checked && (
        <svg viewBox="0 0 9 9" className="size-[9px]" aria-hidden>
          <path
            d="M1 4.5L3.3 7L8 1.5"
            stroke="#fff"
            strokeWidth="1.6"
            fill="none"
          />
        </svg>
      )}
    </button>
  )
}

/** 시안 `.act-btn` — 목록 관리 열의 26px 버튼 */
export function ActBtn(
  props: ButtonHTMLAttributes<HTMLButtonElement> & { primary?: boolean }
) {
  const { primary = false, className, type = "button", ...rest } = props
  return (
    <button
      type={type}
      {...rest}
      className={cn(
        "inline-flex h-[26px] cursor-pointer items-center justify-center whitespace-nowrap rounded-[6px] border px-[11px] text-[11px] font-medium",
        "disabled:cursor-not-allowed disabled:border-sz-n-200 disabled:bg-sz-n-100 disabled:text-sz-n-400",
        primary
          ? "border-sz-accent-500 bg-sz-accent-500 text-white hover:border-sz-accent-600 hover:bg-sz-accent-600"
          : "border-sz-n-300 bg-white text-sz-n-700 hover:border-sz-n-400 hover:bg-sz-n-100",
        className
      )}
    />
  )
}

/** 시안 `.sel-sm` — 28px 기본, 조회 조건 줄에서는 32px로 키운다 */
export function SelectSm(
  props: SelectHTMLAttributes<HTMLSelectElement> & { tall?: boolean }
) {
  const { tall = false, className, style, ...rest } = props
  return (
    <select
      {...rest}
      style={{ ...SELECT_CHEVRON_STYLE, ...style }}
      className={cn(
        "cursor-pointer appearance-none rounded-[6px] border border-sz-n-300 bg-white py-0 pl-2 text-[12px] text-sz-n-700 outline-none focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50 disabled:cursor-not-allowed disabled:bg-sz-n-100 disabled:text-sz-n-400",
        tall ? "h-8 pr-[26px]" : "h-7 pr-[22px]",
        className
      )}
    />
  )
}

/** 시안 `.sort` — 정렬 표시 ▼(켜지면 액센트) */
export function SortMark(props: { active?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "ml-[3px] text-[8px]",
        props.active ? "text-sz-accent-600" : "text-sz-n-400"
      )}
    >
      ▼
    </span>
  )
}

/** 시안 `.xt` — 행 확장 토글(▶/▼) */
export function ExpandToggle(props: {
  expanded: boolean
  onToggle: () => void
}) {
  const { expanded, onToggle } = props
  return (
    <button
      type="button"
      aria-expanded={expanded}
      aria-label={expanded ? "주문 항목 접기" : "주문 항목 펼치기"}
      onClick={event => {
        event.stopPropagation()
        onToggle()
      }}
      className={cn(
        "inline-flex size-4 cursor-pointer items-center justify-center rounded-[3px] text-[9px] hover:bg-sz-n-100 hover:text-sz-n-700",
        expanded ? "text-sz-accent-600" : "text-sz-n-400"
      )}
    >
      {expanded ? "▼" : "▶"}
    </button>
  )
}

/** 시안 `.t-note` — 셀 안 보조 줄 */
export function TNote(props: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "mt-[3px] block text-[11px] text-sz-n-600",
        props.className
      )}
    >
      {props.children}
    </span>
  )
}

// ── 상세 모달 상자(.mbox) ────────────────────────────

export function MBox(props: {
  title: ReactNode
  sub?: ReactNode
  children: ReactNode
  tight?: boolean
}) {
  const { title, sub, children, tight = false } = props
  return (
    <div className="rounded-[8px] border border-sz-n-200 bg-white">
      <div className="flex items-center gap-2 rounded-t-[8px] border-b border-sz-n-200 bg-sz-n-50 px-4 py-[11px] text-[13px] font-semibold text-sz-n-900">
        {title}
        {sub && (
          <span className="text-[11px] font-normal text-sz-n-500">{sub}</span>
        )}
      </div>
      <div className={tight ? "px-4 py-3" : "p-4"}>{children}</div>
    </div>
  )
}

/** 시안 `.mrow` — 우 레일 메타 행 */
export function MRow(props: {
  label: string
  children: ReactNode
  tone?: "warn" | "danger"
}) {
  const { label, children, tone } = props
  return (
    <div className="flex justify-between gap-2.5 border-b border-sz-n-100 py-[7px] text-[12px] last:border-b-0">
      <span className="shrink-0 text-sz-n-500">{label}</span>
      <span
        className={cn(
          "text-right font-medium tabular-nums",
          tone === "warn" && "text-sz-warning-text",
          tone === "danger" && "text-sz-danger-text",
          !tone && "text-sz-n-900"
        )}
      >
        {children}
      </span>
    </div>
  )
}

/** 시안 `.st-hint` */
export function StHint(props: { children: ReactNode }) {
  return (
    <div className="mt-2.5 text-[11px] leading-[1.55] text-sz-n-500 [&_b]:font-semibold [&_b]:text-sz-n-700">
      {props.children}
    </div>
  )
}

/** 시안 `.shiprow` — 배송 정보 행 */
export function ShipRow(props: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-2.5 py-1.5 text-[12px]">
      <span className="shrink-0 text-sz-n-500">{props.label}</span>
      <span className="text-right text-sz-n-900">{props.children}</span>
    </div>
  )
}

/** 시안 `.track` — 최종 추적 상태 상자. 위험 톤은 반송·추적 정지 */
export function TrackBox(props: {
  title: ReactNode
  meta: ReactNode
  danger?: boolean
}) {
  const { title, meta, danger = false } = props
  return (
    <div
      className={cn(
        "mt-2 rounded-[6px] border px-3 py-2.5",
        danger
          ? "border-[#E9C9C9] bg-sz-danger-bg"
          : "border-sz-n-200 bg-sz-n-50"
      )}
    >
      <div
        className={cn(
          "text-[12px] font-medium",
          danger ? "text-sz-danger-text" : "text-sz-n-900"
        )}
      >
        {title}
      </div>
      <div
        className={cn(
          "mt-[3px] text-[11px] tabular-nums",
          danger ? "text-sz-danger-text" : "text-sz-n-500"
        )}
      >
        {meta}
      </div>
    </div>
  )
}

/** 시안 `.dcount` — 구매확정 D-N */
export function DCount(props: {
  days: number
  label?: string
  small?: boolean
}) {
  const { days, label, small = false } = props
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span
        className={cn(
          "font-semibold tabular-nums text-sz-accent-600",
          small ? "text-[15px]" : "text-[19px]"
        )}
      >
        D-{days}
      </span>
      {label && <span className="text-[11px] text-sz-n-500">{label}</span>}
    </span>
  )
}
