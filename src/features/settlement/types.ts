import type { BaseParams } from "@/common/types/page"

/*
  정산 관리(ui-partner-13 rev.4 · 요구사항 §41 · §42 · §43) 화면 모델.

  ⚠️ 백엔드에 정산 API가 아직 없다 — 이 타입은 시안·요구사항에서 역산한 **요청 사양**이다.
  API가 생기면 서버 DTO와 대조해 이름을 맞추고 `services/settlementService.ts` 본문만 바꾼다.

  정산은 공구의 주문이 전부 종결된 뒤에 생긴다 — 그래서 금액이 미확정인 행(구 「정산 대기」)이 없다.
  브랜드가 금액을 바꾸는 경로는 정산 확인 기간의 [정산 조정 요청] 하나뿐이다(§42-1).
*/

/**
 * 정산 확인 중(정보) · 조정 협의(경고) · 지급 예정(중립) · 지급 완료(성공) — §41-2.
 * 「분배 실패」는 어드민 전용 상태라 파트너센터에는 오지 않는다.
 */
export const SETTLEMENT_STATUSES = [
  "REVIEWING",
  "ADJUSTING",
  "SCHEDULED",
  "PAID",
] as const

export type SettlementStatus = (typeof SETTLEMENT_STATUSES)[number]

/** 정산 생성일 최신순(기본) · 수취액 높은순 */
export type SettlementSort = "CREATED_AT_DESC" | "RECEIVABLE_DESC"

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
  confirmedSales: number
  /** PG 결제 수수료 + 플랫폼 수수료 */
  feeAmount: number
  rewardAmount: number
  /** 리워드 부가세 10% 별도 — 목록 리워드 칸에 「+ 부가세」로 병기 */
  rewardVatAmount: number
  /** 내 수취액(차감 반영 전) */
  brandReceivable: number
  /** 정산 확인 중 — 확인 기간 마감(LocalDateTime) */
  reviewDeadlineAt: string | null
  /** 지급 예정 = 지급 예정일 · 지급 완료 = 실지급일 · 그 외 null */
  payoutDate: string | null
}

export interface SettlementSummary {
  paidTotal: number
  paidCount: number
  /** 지급 예정 건의 이번 지급액 합계(차감 반영 후) */
  scheduledTotal: number
  scheduledCount: number
  /** 지급 예정 건 중 가장 이른 지급 예정일 */
  nextPayoutDate: string | null
  /** 지급 예정 건 중 차감 반영이 있으면 KPI에 「차감 반영 후」를 붙인다 */
  scheduledHasDeduction: boolean
  reviewingCount: number
  /** 정산 확인 중 건 중 가장 이른 확인 기간 마감 */
  nextReviewDeadlineAt: string | null
  statusCounts: Record<SettlementStatus, number>
}

/** 차감 반영 — 이전 정산 뒤 환불된 주문을 이번 정산에서 뺀다(§41-7) */
export interface SettlementDeduction {
  orderNumber: string
  /** 원 공구 — 한 공구는 한 정산 타임라인이라 다른 공구에서 넘어온 값임을 적는다 */
  sourceGroupBuyTitle: string
  reason: string
  amount: number
  /** 마이너스 수정세금계산서 — 정산 세금계산서와 같은 수동 발행 규칙 */
  revisedInvoiceStatus: TaxInvoiceStatus
}

/** 브랜드 축 금액 분해(§41-4) — 계산 순서 그대로 */
export interface SettlementBreakdown {
  totalOrderAmount: number
  cancel: { count: number; amount: number }
  return: { count: number; amount: number }
  deliveryException: { count: number; amount: number }
  confirmedSales: number
  platformFee: number
  /** 베타 0% · 정상 2% — 백엔드 변수 */
  platformFeeRate: number
  pgFee: number
  /** 카드·간편결제 3.0% 잠정 — [자문대기-PG] */
  pgFeeRate: number
  reward: number
  /** 계약 리워드율 — 조정 내역의 「원래 리워드」 캡션 */
  rewardRate: number
  rewardVat: number
  /** 10% — 백엔드 변수 */
  rewardVatRate: number
  /** 교환·반려 재발송비 — 브랜드 수취액에만 더한다(리워드 기준에는 포함하지 않음) */
  reshipFee: number
  /** 내 수취액 = 확정 거래액 − PG − 플랫폼 − 리워드 − 리워드 부가세 + 재발송비 */
  brandReceivable: number
  deductions: Array<SettlementDeduction>
  /** 이번 지급액 = 내 수취액 − 차감 반영 합계 */
  payoutAmount: number
}

export type AdjustmentParty = "BRAND" | "INFLUENCER"

export interface AdjustmentProposal {
  seq: number
  by: AdjustmentParty
  /** 화면 표기용 이름 — 브랜드명 또는 인플루언서 쇼룸명 */
  byName: string
  at: string
  rewardAmount: number
  /** 첫 요청은 필수 · 다른 금액 제안은 선택 */
  reason: string | null
}

/** 조정 협의 — 응답(동의·제안·반대)은 이슈 스레드에서만 한다. 이 화면은 조정 내역 조회만(§43-3) */
export interface SettlementAdjustment {
  requestedAt: string
  /** 요청 + 10영업일 · 연장 없음(§42-3) */
  deadlineAt: string
  /** 영업일 기준 남은 일수(D-N) — 서버가 공휴일까지 반영해 계산한다 */
  remainingBusinessDays: number
  originalReward: number
  proposals: Array<AdjustmentProposal>
  /** 최신 제안을 받은 쪽이 답할 차례 — 내 응답 대기(경고) / 상대 응답 대기(정보) */
  turn: "MINE" | "THEIRS"
  /** 이슈 스레드 — 화면이 생기면 [이슈 스레드 열기]가 이리로 간다 */
  threadId: number | null
}

/** 3자 분배(PG 직접 지급) — 정산 확인 중에는 일정·계좌가 정해지지 않아 null */
export interface SettlementDistribution {
  creatorIsBusiness: boolean
  /** 비사업자 3.3% · 사업자 0 */
  withholdingAmount: number
  /** 비사업자 = 리워드 − 원천징수 · 사업자 = 리워드 + 부가세 */
  creatorNetAmount: number
  /** 비사업자 = 리워드 부가세 + 플랫폼 수수료 · 사업자 = 플랫폼 수수료(부가세는 인플루언서에게) */
  platformAmount: number
}

export interface SettlementPayoutInfo {
  bankName: string
  maskedAccountNumber: string
  accountHolder: string
  /** 조정 협의 중이면 null(보류 해제 후 결정) */
  scheduledDate: string | null
  paidDate: string | null
  /** 지급 시 부여 */
  pgReference: string | null
}

/** 발행 대기(중립) · 발행 완료(성공) — 【MVP】 운영팀이 홈택스에서 수동 발행 */
export type TaxInvoiceStatus = "WAITING" | "ISSUED"

/** SHOWROOMZ → 브랜드 세금계산서 — 정산 1건당 1장 · 공급가액 = 리워드 + 플랫폼 수수료 */
export interface SettlementTaxInvoice {
  supplyAmount: number
  vatAmount: number
  status: TaxInvoiceStatus
  issuedAt: string | null
  approvalNumber: string | null
  /** 발행 기한 = 정산 확정일이 속한 달의 다음 달 10일 — 확정 전이면 null */
  dueDate: string | null
}

/** 인플루언서 세무 — 플랫폼이 처리하고 브랜드 화면은 표시만 한다 */
export interface SettlementCreatorTax {
  isBusiness: boolean
  /** 비사업자 원천징수율(3.3%) — 백엔드 변수 */
  withholdingRate: number
}

export type ShippingFeePayer = "CONSUMER" | "BRAND" | "UNDECIDED"

export interface SettlementShippingFee {
  payer: ShippingFeePayer
  reasonLabel: string
  count: number
  /** 판정 대기는 금액 없음 */
  amount: number | null
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
  /** STL-YYMM-NNN(체계 임의 · §46 C-12) */
  settlementNumber: string
  groupBuyId: number | null
  groupBuyTitle: string
  creatorShowroomName: string
  periodStart: string
  periodEnd: string
  status: SettlementStatus
  /** 정산 생성 = 마지막 주문 종결 시점(금액 공개) */
  createdAt: string
  /** 정산 확인 기간 마감(3영업일째 23:59) */
  reviewDeadlineAt: string
  /** 자동 확정일 — 정산 확인 중이면 예정일(마감 다음 날), 조정 협의면 null */
  autoConfirmedAt: string | null
  /** 지급 예정일 계산 근거 — 자동 확정일 + N영업일 */
  payoutBusinessDays: number
  /** 지급 예정일 계산에서 건너뛴 공휴일 */
  excludedHolidays: Array<{ date: string; name: string }>
  breakdown: SettlementBreakdown
  adjustment: SettlementAdjustment | null
  distribution: SettlementDistribution | null
  payoutInfo: SettlementPayoutInfo | null
  taxInvoice: SettlementTaxInvoice
  creatorTax: SettlementCreatorTax
  shippingFees: Array<SettlementShippingFee>
  statementPreview: Array<SettlementStatementLine>
}

/** C1 정산 조정 요청 — 입력은 조정할 리워드 금액 · 사유 둘뿐(근거 첨부는 2026.10.07 삭제) */
export interface SettlementAdjustmentRequest {
  rewardAmount: number
  reason: string
}
