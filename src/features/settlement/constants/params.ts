import type { StatusBadgeVariant } from "@/common/components/StatusBadge/StatusBadge"
import type {
  SettlementListParams,
  SettlementSort,
  SettlementStatus,
  StatementLineStatus,
  TaxInvoiceStatus,
} from "@/features/settlement/types"

export const SETTLEMENT_LIST_PATH = "/settlement/history"

export const SETTLEMENT_QUERY_KEYS = {
  LIST: "sellerSettlementList",
  SUMMARY: "sellerSettlementSummary",
  DETAIL: "sellerSettlementDetail",
} as const

export const SETTLEMENT_STATUS_LABEL: Record<SettlementStatus, string> = {
  REVIEWING: "정산 확인 중",
  ADJUSTING: "조정 협의",
  SCHEDULED: "지급 예정",
  PAID: "지급 완료",
}

/**
 * 상태색(§41-2 · 시안 HEAD [상태색 — 조정 협의만 경고]) — 정산 확인 중 = 정보 · 지급 예정 = 중립
 * (어드민·스튜디오와 통일) · 지급 완료 = 성공 · **조정 협의만 경고**(전액 보류 · 합의 기한이 흐른다).
 * 위험색은 쓰지 않는다.
 */
export const SETTLEMENT_STATUS_VARIANT: Record<
  SettlementStatus,
  StatusBadgeVariant
> = {
  REVIEWING: "info",
  ADJUSTING: "warning",
  SCHEDULED: "neutral",
  PAID: "success",
}

export const TAX_INVOICE_STATUS_LABEL: Record<TaxInvoiceStatus, string> = {
  WAITING: "발행 대기",
  ISSUED: "발행 완료",
}

/** 발행 대기 = 중립(지급과 무관한 사무 대기) · 발행 완료 = 성공 */
export const TAX_INVOICE_STATUS_VARIANT: Record<
  TaxInvoiceStatus,
  StatusBadgeVariant
> = {
  WAITING: "neutral",
  ISSUED: "success",
}

export const SETTLEMENT_SORT_OPTIONS: Array<{
  value: SettlementSort
  label: string
}> = [
  { value: "CREATED_AT_DESC", label: "정산 생성일 최신순" },
  { value: "RECEIVABLE_DESC", label: "수취액 높은순" },
]

export const SETTLEMENT_PAGE_SIZES = [20, 50] as const

export const SETTLEMENT_INITIAL_PARAMS: SettlementListParams = {
  statuses: ["REVIEWING", "ADJUSTING", "SCHEDULED", "PAID"],
  keyword: "",
  sort: "CREATED_AT_DESC",
  page: 1,
  size: 20,
}

export const STATEMENT_LINE_LABEL: Record<StatementLineStatus, string> = {
  CONFIRMED: "확정",
  CANCELED: "취소",
  RETURNED: "반품",
  RETURN_PROCESSING: "반품 처리 중",
}

/** 성과 관리 · 기본정보 관리(정산 계좌) · 공구 관리 */
export const PERFORMANCE_PATH = "/performance"
export const SETTLEMENT_ACCOUNT_PATH = "/store/basic?tab=settlement"
export const GROUP_BUY_LIST_PATH = "/group-buy"
