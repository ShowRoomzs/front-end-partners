import type { StatusBadgeVariant } from "@/common/components/StatusBadge/StatusBadge"
import type {
  SettlementListParams,
  SettlementSort,
  SettlementStatus,
  StatementLineStatus,
} from "@/features/settlement/types"

export const SETTLEMENT_LIST_PATH = "/settlement/history"

export const SETTLEMENT_QUERY_KEYS = {
  LIST: "sellerSettlementList",
  SUMMARY: "sellerSettlementSummary",
  DETAIL: "sellerSettlementDetail",
} as const

export const SETTLEMENT_STATUS_LABEL: Record<SettlementStatus, string> = {
  PENDING: "정산 대기",
  CONFIRMED: "정산 확정",
  ON_HOLD: "정산 보류",
  PAID: "지급 완료",
}

/**
 * 상태색 — 정산 대기·확정은 중립, 지급 완료는 성공, **정산 보류만 경고**.
 * 보류는 지급이 멈췄고 금액이 바뀔 수 있어 정상 진행과 같은 톤이면 놓친다. 위험색은 쓰지 않는다.
 */
export const SETTLEMENT_STATUS_VARIANT: Record<
  SettlementStatus,
  StatusBadgeVariant
> = {
  PENDING: "neutral",
  CONFIRMED: "neutral",
  ON_HOLD: "warning",
  PAID: "success",
}

export const SETTLEMENT_SORT_OPTIONS: Array<{
  value: SettlementSort
  label: string
}> = [
  { value: "CONFIRMED_AT_DESC", label: "정산 확정일 최신순" },
  { value: "PAYOUT_DESC", label: "수취액 높은순" },
]

export const SETTLEMENT_PAGE_SIZES = [20, 50] as const

export const SETTLEMENT_INITIAL_PARAMS: SettlementListParams = {
  statuses: ["PENDING", "CONFIRMED", "ON_HOLD", "PAID"],
  keyword: "",
  sort: "CONFIRMED_AT_DESC",
  page: 1,
  size: 20,
}

export const STATEMENT_LINE_LABEL: Record<StatementLineStatus, string> = {
  CONFIRMED: "확정",
  CANCELED: "취소",
  RETURNED: "반품",
  RETURN_PROCESSING: "반품 처리 중",
}

/** 성과 관리 · 기본정보 관리(정산 계좌) · 공구 관리 · 운영팀 스레드 */
export const PERFORMANCE_PATH = "/performance"
export const SETTLEMENT_ACCOUNT_PATH = "/store/basic?tab=settlement"
export const GROUP_BUY_LIST_PATH = "/group-buy"
export const OPERATOR_THREAD_PATH = "/connections?operator=1"
