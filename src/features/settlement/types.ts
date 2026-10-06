import type { BaseParams } from "@/common/types/page"

/*
  정산 관리(ui-partner-13) 화면 모델.

  ⚠️ 백엔드에 정산 API가 아직 없다 — 이 타입은 시안에서 역산한 **요청 사양**이다.
  API가 생기면 서버 DTO와 대조해 이름을 맞추고 `services/settlementService.ts` 본문만 바꾼다.
  조회 전용 화면이라 쓰기 요청 타입은 없다(브랜드는 돈을 만지지 않는다).
*/

/** 정산 대기 · 정산 확정 · 정산 보류 · 지급 완료 — 색은 중립·중립·경고·성공 */
export const SETTLEMENT_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "ON_HOLD",
  "PAID",
] as const

export type SettlementStatus = (typeof SETTLEMENT_STATUSES)[number]

export type SettlementSort = "CONFIRMED_AT_DESC" | "PAYOUT_DESC"

export interface SettlementListParams extends BaseParams {
  statuses: Array<SettlementStatus>
  keyword: string
  sort: SettlementSort
}

export interface SettlementListItem {
  settlementId: number
  groupBuyTitle: string
  creatorShowroomName: string
  /** 정산 대상 기간 = 공구 기간(LocalDate) */
  periodStart: string
  periodEnd: string
  status: SettlementStatus
  /** 정산 대기에서는 금액이 확정되지 않아 전부 null */
  confirmedSales: number | null
  /** 플랫폼 수수료 + PG 결제 수수료 */
  feeAmount: number | null
  rewardAmount: number | null
  payoutAmount: number | null
  /** 정산 확정 = 지급 예정일 · 지급 완료 = 실지급일 · 그 외 null */
  payoutDate: string | null
}

export interface SettlementSummary {
  paidTotal: number
  paidCount: number
  scheduledTotal: number
  scheduledCount: number
  /** 정산 확정 건 중 가장 이른 지급 예정일 */
  nextPayoutDate: string | null
  pendingCount: number
  statusCounts: Record<SettlementStatus, number>
}

export interface SettlementBreakdown {
  totalOrderAmount: number
  cancel: { count: number; amount: number }
  /** processingCount — 정산 대기에서 아직 처리 중인 반품 건(차감 금액에 포함) */
  return: { count: number; processingCount: number; amount: number }
  deliveryException: { count: number; amount: number }
  confirmedSales: number
  platformFee: number
  /** 베타 0% · 정상 2% */
  platformFeeRate: number
  pgFee: number
  /** 카드·간편결제 3.0% 잠정 — [자문대기-PG] */
  pgFeeRate: number
  reward: number
  /** 교환·반려 재발송비 — 브랜드 수취액에만 더한다(리워드 기준에는 포함하지 않음) */
  reshipFee: number
  payout: number
}

export interface SettlementHold {
  heldAt: string
  reason: string
  reasonDetail: string
  releaseCondition: string
  releaseDetail: string
  /** 보류 대상 금액 — 부분 지급은 하지 않는다 */
  heldAmount: number
}

export interface SettlementPayoutInfo {
  bankName: string
  maskedAccountNumber: string
  accountHolder: string
  /** null이면 보류 해제 후 결정 */
  scheduledDate: string | null
  paidDate: string | null
  /** 지급 시 부여 */
  pgReference: string | null
}

export interface SettlementWithholding {
  /** 인플루언서가 사업자면 세금계산서 수취, 비사업자면 3.3% 원천징수 */
  creatorIsBusiness: boolean
  withholdingRate: number
  withholdingAmount: number
  /** 인플루언서 실수령액 = 리워드 − 원천징수 */
  creatorNetAmount: number
  /** 사업자 세금계산서 수취 여부 — 발행은 인플루언서 쪽 행위 */
  taxInvoiceReceived: boolean
}

export type ShippingFeePayer = "CONSUMER" | "BRAND" | "UNDECIDED"

export interface SettlementShippingFee {
  payer: ShippingFeePayer
  reasonLabel: string
  count: number
  /** 판정 대기는 금액 없음 */
  amount: number | null
}

export interface SettlementFixedFee {
  amount: number
  brandPaidAt: string
  creatorPaidAt: string | null
}

export type StatementLineStatus =
  | "CONFIRMED"
  | "CANCELED"
  | "RETURNED"
  | "RETURN_PROCESSING"

export interface SettlementStatementLine {
  orderNumber: string
  /** 마스킹된 소비자명(김**) */
  consumerName: string
  productOption: string
  quantity: number
  paidAmount: number
  status: StatementLineStatus
  /** 처리 중이면 null(미확정) */
  reflectedAmount: number | null
}

export interface SettlementDetail {
  settlementId: number
  groupBuyId: number | null
  groupBuyTitle: string
  creatorShowroomName: string
  periodStart: string
  periodEnd: string
  status: SettlementStatus
  /** 정산 대기면 null */
  confirmedAt: string | null
  /** 마지막 구매확정일 — 정산 대기면 null */
  lastPurchaseConfirmedAt: string | null
  /** 정산 시점 = 마지막 구매확정 + N일 */
  settlementLagDays: number
  /** 정산 대기에서 남은 반품·교환 건 */
  pendingClaimCount: number
  breakdown: SettlementBreakdown
  hold: SettlementHold | null
  /** 정산 대기면 null */
  payoutInfo: SettlementPayoutInfo | null
  withholding: SettlementWithholding | null
  shippingFees: Array<SettlementShippingFee>
  fixedFees: Array<SettlementFixedFee>
  statementPreview: Array<SettlementStatementLine>
}
