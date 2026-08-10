import { cn } from "@/lib/utils"
import {
  PRODUCT_DISPLAY_STATUS,
  PRODUCT_GROUP_BUY_STATUS,
} from "@/features/productManagement/constants/params"
import type {
  ProductDisplayStatus,
  ProductGroupBuyStatus,
} from "@/features/productManagement/services/productService"
import type { ReactNode } from "react"

export type StatusBadgeVariant =
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "neutral"

const VARIANT_CLASS: Record<StatusBadgeVariant, string> = {
  info: "bg-sz-info-bg text-sz-info-text",
  success: "bg-sz-success-bg text-sz-success-text",
  warning: "bg-sz-warning-bg text-sz-warning-text",
  danger: "bg-sz-danger-bg text-sz-danger-text",
  neutral: "bg-sz-neutral-bg text-sz-neutral-text",
}

interface StatusBadgeProps {
  variant: StatusBadgeVariant
  children: ReactNode
  hideDot?: boolean
}

/** 시안 `.badge` — 좌측 점 + 라벨 */
export function StatusBadge({
  variant,
  children,
  hideDot = false,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[5px] whitespace-nowrap rounded-[10px] px-[9px] py-0.5 text-[11px] font-medium",
        VARIANT_CLASS[variant]
      )}
    >
      {!hideDot && (
        <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-current opacity-75" />
      )}
      {children}
    </span>
  )
}

/**
 * 진열 상태 → 배지 (§12-2 색상 매핑).
 * 미진열이 danger인 것은 상태색 4원칙의 공식 예외 — 소비자 노출이 실제로 막힌
 * "조치가 필요한 문제 상태"로 본다. 반면 미진열(요청)은 브랜드가 스스로 요청한
 * 것이라 문제 상황이 아니므로 neutral을 쓴다.
 */
export function DisplayStatusBadge({
  status,
}: {
  status: ProductDisplayStatus
}) {
  const label = PRODUCT_DISPLAY_STATUS[status]

  switch (status) {
    case "DISPLAY":
      return <StatusBadge variant="success">{label}</StatusBadge>
    case "HIDDEN":
      return <StatusBadge variant="danger">{label}</StatusBadge>
    case "PENDING_REVIEW":
      return <StatusBadge variant="warning">{label}</StatusBadge>
    case "HIDE_REQUEST":
      return <StatusBadge variant="neutral">{label}</StatusBadge>
  }
}

/** 공구 상태 → 배지. 연결 없음만 neutral, 나머지는 info */
export function GroupBuyStatusBadge({
  status,
}: {
  status: ProductGroupBuyStatus
}) {
  return (
    <StatusBadge
      variant={status === "NOT_CONNECTED" ? "neutral" : "info"}
      hideDot
    >
      {PRODUCT_GROUP_BUY_STATUS[status]}
    </StatusBadge>
  )
}

/** 재고 0이면 자동으로 붙는 품절 배지 — 별도 필드가 아니라 재고에서 파생된다 */
export function SoldOutBadge() {
  return (
    <StatusBadge variant="neutral" hideDot>
      품절
    </StatusBadge>
  )
}
