import type { StatusBadgeVariant } from "@/common/components/StatusBadge/StatusBadge"
import {
  SETTLEMENT_STATUSES,
  type AdjustmentProposalStatus,
  type SettlementListParams,
  type SettlementPartySort,
  type SettlementStatus,
  type SettlementTone,
  type TaxDocumentStatus,
} from "@/features/settlement/types"

export const SETTLEMENT_LIST_PATH = "/settlement/history"

export const SETTLEMENT_QUERY_KEYS = {
  LIST: "sellerSettlementList",
  SUMMARY: "sellerSettlementSummary",
  DETAIL: "sellerSettlementDetail",
  ITEMS: "sellerSettlementItems",
  ADJUSTMENT_PREVIEW: "sellerSettlementAdjustmentPreview",
  COMPANY_INFO: "commonCompanyInfo",
} as const

/**
 * 세금계산서 공급자(기-35 · 시안 13 rev.9) — 서버 `GET /v1/common/company-info`가 개발 서버에 배포되기 전에 쓰는 값.
 * 배포되면 서버 값이 우선한다(설정값 `company.*`). 「(주)」는 붙이지 않는다.
 */
export const TAX_INVOICE_SUPPLIER_FALLBACK = {
  name: "쇼룸즈",
  representative: "소병서",
  registrationNumber: "791-12-03353",
  address:
    "경기도 용인시 수지구 죽전로 152, 글로컬산학협력단 B211-3호(죽전동, 단국대학교)",
} as const

/**
 * 상태 칩 이름 — 칩은 요약이 오기 전에도 그려야 해서 화면이 이름을 든다(서버 `SettlementStatus` 라벨과 같다).
 * 행·상세의 배지는 서버가 내린 `statusLabel`을 그대로 쓴다.
 */
export const SETTLEMENT_STATUS_CHIP_LABEL: Record<SettlementStatus, string> = {
  REVIEWING: "정산 확인 중",
  ADJUSTING: "조정 협의",
  PAYOUT_SCHEDULED: "지급 예정",
  PAID: "지급 완료",
}

/** 서버 톤 → 배지 색. 정산 확인 중 = INFO · 조정 협의 = WARNING · 지급 예정 = NEUTRAL · 지급 완료 = SUCCESS */
export const SETTLEMENT_TONE_VARIANT: Record<
  SettlementTone,
  StatusBadgeVariant
> = {
  NEUTRAL: "neutral",
  INFO: "info",
  WARNING: "warning",
  SUCCESS: "success",
  DANGER: "danger",
}

/** 서버 톤 → 글자색(조정 내역의 「진행」 칸) */
export const SETTLEMENT_TONE_TEXT: Record<SettlementTone, string> = {
  NEUTRAL: "text-sz-n-700",
  INFO: "text-sz-info-text",
  WARNING: "text-sz-warning-text",
  SUCCESS: "text-sz-success-text",
  DANGER: "text-sz-danger-text",
}

/**
 * 세금계산서 배지 — 서버 `statusLabel`은 「발행 대기 · 운영팀이 11.10까지 발행합니다」처럼 기한이 붙어 와서
 * 배지에는 상태 이름만, 기한은 아래 보조 줄(`dueDate`)로 나눠 그린다.
 */
export const TAX_DOCUMENT_STATUS_LABEL: Record<TaxDocumentStatus, string> = {
  PENDING_ISSUE: "발행 대기",
  ISSUED: "발행 완료",
}

/** 발행 대기 = 중립(지급과 무관한 사무 대기) · 발행 완료 = 성공 */
export const TAX_DOCUMENT_STATUS_VARIANT: Record<
  TaxDocumentStatus,
  StatusBadgeVariant
> = {
  PENDING_ISSUE: "neutral",
  ISSUED: "success",
}

/**
 * 조정 제안 상태 — 상세 응답의 제안 행에는 라벨이 없다(서버 `ProposalStatus` 라벨과 같은 문구).
 * 「다른 금액 제안으로 응답됨」은 다음 행이 말해 주므로 적지 않는다.
 */
export const PROPOSAL_STATUS_NOTE: Partial<
  Record<AdjustmentProposalStatus, string>
> = {
  PENDING: "응답 대기",
  ACCEPTED: "동의",
  REJECTED: "반대",
  CLOSED: "기한 만료",
}

export const SETTLEMENT_SORT_OPTIONS: Array<{
  value: SettlementPartySort
  label: string
}> = [
  { value: "CREATED_DESC", label: "정산 생성일 최신순" },
  { value: "PAYOUT_DESC", label: "수취액 높은순" },
]

export const SETTLEMENT_PAGE_SIZES = [20, 50] as const

export const SETTLEMENT_INITIAL_PARAMS: SettlementListParams = {
  status: [...SETTLEMENT_STATUSES],
  keyword: "",
  sort: "CREATED_DESC",
  page: 1,
  size: 20,
}

/** 전체 명세 펼침의 한 페이지 */
export const STATEMENT_PAGE_SIZE = 20

/** 성과 관리 · 기본정보 관리(정산 계좌) · 공구 관리 */
export const PERFORMANCE_PATH = "/performance"
/** 연결·소통 — 이슈 스레드는 `?threadId=`로 연다 */
export const CONNECTIONS_PATH = "/connections"
export const SETTLEMENT_ACCOUNT_PATH = "/store/basic?tab=settlement"
export const GROUP_BUY_LIST_PATH = "/group-buy"
