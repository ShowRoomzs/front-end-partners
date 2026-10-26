import type { BaseParams } from "@/common/types/page"

/*
  정산 관리(ui-partner-13 rev.4) — 서버 응답 그대로의 타입.

  원본: back-end `SellerSettlementDto`(목록·요약·상세·명세) · `SettlementPartyDto`(KPI·분해 행·조정 내역 —
  스튜디오와 공용) · `SettlementAdjustmentDto`(조정 미리보기·요청). 이름은 서버를 따른다.

  - 날짜: `LocalDateTime`은 "2026-10-05T23:59:59", `LocalDate`는 "2026-10-12" 문자열(시간대 없음)
  - 요율: 분해 행의 `rate`는 **비율**(0.0300 = 3%)이고 명세 행의 `rewardRate`만 **% 값**(10.0 = 10%)이다
  - 라벨·톤은 서버가 정한다(`statusLabel` · `statusTone` · `turnLabel` …) — 화면은 그대로 그린다
  - 응답에 없는 것은 서버가 안 내리는 것이다: 고정 지급비 · 인플루언서 원천징수 분해 · 이력 · 소비자 식별 정보
*/

/**
 * 정산 확인 중 · 조정 협의 · 지급 예정 · 지급 완료. 분배 실패(`PAYOUT_FAILED`)는 어드민 전용이라
 * 서버가 지급 완료로 접어서 내린다 — 필터로 보내면 400이다.
 */
export const SETTLEMENT_STATUSES = [
  "REVIEWING",
  "ADJUSTING",
  "PAYOUT_SCHEDULED",
  "PAID",
] as const

export type SettlementStatus = (typeof SETTLEMENT_STATUSES)[number]

export type SettlementTone =
  | "NEUTRAL"
  | "INFO"
  | "WARNING"
  | "SUCCESS"
  | "DANGER"

/** 정산 생성일 최신순(기본) · 브랜드 수취액 높은순 */
export const SETTLEMENT_SORTS = ["CREATED_DESC", "PAYOUT_DESC"] as const

export type SettlementPartySort = (typeof SETTLEMENT_SORTS)[number]

/** `GET /v1/seller/settlements` — `status`는 복수(생략하면 전부) · `page`는 1부터 · `size` 1~100 */
export interface SettlementListParams extends BaseParams {
  status: Array<SettlementStatus>
  keyword: string
  sort: SettlementPartySort
}

export interface SettlementInfluencer {
  creatorId: number
  showroomName: string
}

/**
 * 목록 「지급(예정)일」 칸 — 브랜드 지급 행 기준.
 * REVIEW_DUE 「09.28까지 확인」 · PAYOUT_DUE 「10.12 예정」 · PAID 「07.24」 · NONE 「—」(date = null)
 */
export interface SettlementSchedule {
  kind: "REVIEW_DUE" | "PAYOUT_DUE" | "PAID" | "NONE"
  date: string | null
}

export interface SettlementListItem {
  settlementId: number
  /** STL-YYMM-NNN */
  settlementNumber: string
  groupBuyId: number
  groupBuyTitle: string
  influencer: SettlementInfluencer
  periodStartAt: string
  periodEndAt: string
  /** 확정 거래액 */
  confirmedSalesAmount: number
  /** PG 결제 수수료 + 플랫폼 수수료 */
  feeAmount: number
  rewardAmount: number
  rewardVatAmount: number
  /** 브랜드 수취액 — 차감 반영 후(이번 지급액) */
  brandPayoutAmount: number
  status: SettlementStatus
  statusLabel: string
  statusTone: SettlementTone
  schedule: SettlementSchedule
  /** 내 지급 행 보류 이유 — 보류가 아니면 null · 배포 전 서버는 없음 */
  payoutHold?: PayoutHold | null
}

/** KPI 칸 — 건수가 0이면 `amount = null`(0원은 실적처럼 읽혀 화면은 「—」) */
export interface SettlementKpi {
  amount: number | null
  count: number
}

export type SettlementStatusCounts = Record<SettlementStatus, number>

/** `GET /summary` — 마켓 전체 기준(검색어·상태 칩과 무관) */
export interface SettlementSummary {
  /** 누적 지급 — 브랜드 지급 행 PAID */
  paid: SettlementKpi
  /** 지급 예정 — 브랜드 지급 행 SCHEDULED · 처리 중 */
  scheduled: SettlementKpi
  nextPayoutDate: string | null
  /** 지급 예정 중 차감(이전 회차 환불 회수) 반영 건이 있는가 */
  scheduledHasClawback: boolean
  /** 조정 요청 창이 열린 정산 확인 중 건수 */
  reviewingCount: number
  /** 가장 임박한 확인 마감 */
  reviewingDueAt: string | null
  adjustingCount: number
  /** 상태 칩 숫자 — 분배 실패는 PAID에 포함 */
  statusCounts: SettlementStatusCounts
  /** GNB 「정산 관리」 배지 = 요청 창이 열린 정산 확인 중 건수 */
  attentionCount: number
  /** 조정 협의 「내 응답 필요」 수(1017 · 개발 서버 배포 전에는 없다) */
  adjustmentMyTurnCount?: number
}

/**
 * 내 지급 행 보류 이유(1017 · ui-partner-15 S5) — 정산 상태는 「지급 예정」 그대로이고 이 보조 정보로 보인다.
 * 개발 서버 배포 전에는 응답에 없다(undefined).
 */
export interface PayoutHold {
  /** PayoutBlockReason — BRAND_SUSPENDED 등 */
  reason: string
  /** 「계정 이용 정지 · 지급 정지」 */
  label: string
  /** 「정지 해제 다음 영업일 지급」 */
  scheduleLabel: string
  /** 원래 지급 예정일(KST 날짜) */
  originalDueDate: string | null
  /** 계정 이용 정지로 인한 보류인가 */
  sanction: boolean
}

/** 금액 + 건수(분해 행) */
export interface SettlementAmountCount {
  amount: number
  count: number
}

/** `rate`는 비율 — 0.0300 = 3% */
export interface SettlementRateAmount {
  rate: number
  amount: number
}

export interface SettlementPlatformFee extends SettlementRateAmount {
  /** 정상 요율(베타 종료 후) */
  normalRate: number
}

/** 차감 반영 — 이전 회차 정산 뒤 환불된 주문의 회수 */
export interface SettlementClawback {
  clawbackNumber: string
  originSettlementNumber: string | null
  originGroupBuyTitle: string | null
  orderNumber: string
  reasonLabel: string
  amount: number
  /** 수정세금계산서 상태 */
  creditInvoiceStatus: TaxDocumentStatus | null
}

/** 정산 금액 분해 — 브랜드 축 · 계산 순서 */
export interface SettlementBreakdown {
  grossOrderAmount: number
  cancel: SettlementAmountCount
  return: SettlementAmountCount
  deliveryException: SettlementAmountCount
  confirmedSalesAmount: number
  pgFee: SettlementRateAmount
  platformFee: SettlementPlatformFee
  /** 원래 리워드 — `rewardAmount`와 다르면 조정 합의로 바뀐 것 */
  originalRewardAmount: number
  rewardAmount: number
  rewardVat: SettlementRateAmount
  /** 교환·반려 재발송비 — 브랜드 수취액에 가산 */
  reshipFee: SettlementAmountCount
  /** 소비자 결제 배송비 — 브랜드 가산(§46 B-6 미결 행) */
  consumerDeliveryFee: number
  /**
   * + 반품 시 차감한 최초 배송비(1021 기-18) — 무료배송 · 소비자 귀책 반품에서 환불액에서 뺀 금액 · 브랜드 정산에 남는다.
   * 개발 서버 배포 전에는 없다(undefined) — 그때는 줄을 그리지 않는다.
   */
  returnDeductionFee?: SettlementAmountCount
  /** ± 운임 정산(1021 기-93) — amount는 부호 있음(소비자 부담 +, 환급 −). 배포 전에는 없다 */
  freightAdjustment?: SettlementAmountCount
  /** 차감 전 브랜드 수취액 */
  brandPayoutBeforeClawback: number
  /** 없으면 [] */
  clawbacks: Array<SettlementClawback>
  brandClawbackAmount: number
  /** 이번 지급액 */
  brandPayoutAmount: number
}

export type SettlementPayee = "BRAND" | "CREATOR" | "PLATFORM"

export type PayoutStatus =
  | "WAITING"
  | "HELD"
  | "BLOCKED"
  | "SCHEDULED"
  | "REQUESTED"
  | "PAID"
  | "FAILED"
  | "NOT_APPLICABLE"

/** 3자 분배 행 — 남의 행의 분배 실패는 SCHEDULED로 접혀 오고, 브랜드 행 실패만 FAILED(「지급 확인 중」) */
export interface SettlementPayout {
  payee: SettlementPayee
  /** 브랜드 「우리」 · 인플루언서 쇼룸명 · 「플랫폼」 */
  label: string
  amount: number
  /** 「리워드 548,000 − 원천징수 18,084(3.3%)」 · 플랫폼 「리워드 부가세」 */
  note: string | null
  status: PayoutStatus
  statusLabel: string
  dueDate: string | null
  paidAt: string | null
  /** [내 행] 보류 이유 — 「지급 정지 · 해제 다음 영업일 지급」(1017 · 배포 전 서버는 없음) */
  hold?: PayoutHold | null
}

/** 지급 정보 — 지시 후엔 지급 시점 계좌 스냅샷, 지시 전엔 현재 등록 계좌(뒤 6자리 노출) */
export interface SettlementPayment {
  bankName: string | null
  accountMasked: string | null
  accountHolder: string | null
  payoutDueDate: string | null
  paidAt: string | null
  /** 브랜드 행 지급 완료 뒤에만 */
  pgReference: string | null
}

export type TaxDocumentStatus = "PENDING_ISSUE" | "ISSUED"

/** SHOWROOMZ 발행 세금계산서 — 브랜드 세금계산서 1행 + 차감이 있으면 수정세금계산서 N행 */
export interface SettlementTaxDocument {
  documentId: number
  type: "BRAND_TAX_INVOICE" | "BRAND_TAX_INVOICE_CREDIT"
  typeLabel: string
  supplyAmount: number
  vatAmount: number
  totalAmount: number
  status: TaxDocumentStatus
  /** 「발행 대기 · 운영팀이 11.10까지 발행합니다」 · 「발행 완료」 */
  statusLabel: string
  dueDate: string | null
  issuedDate: string | null
  approvalNumber: string | null
  downloadable: boolean
}

/** 인플루언서 세무 — 표시값만(브랜드가 챙길 인플루언서 증빙은 없다) */
export interface SettlementInfluencerTax {
  businessType: "INDIVIDUAL" | "BUSINESS"
  withholdingType: string | null
  /** 「비사업자 · 원천징수 3.3% · 플랫폼 신고」 */
  label: string
}

/** 반품·교환 배송비 — 분해 밖 · 표시 전용 */
export interface SettlementClaimShipping {
  /** 소비자 부담 — 반품 배송비 차감 합 · 브랜드 수취 */
  consumer: SettlementAmountCount
  /** 브랜드 부담 — 요금표 × 건수 · 정산 대상 아님 */
  brand: SettlementAmountCount
}

export type SettlementItemStatus =
  | "CONFIRMED"
  | "PARTIAL_RETURNED"
  | "RETURNED"
  | "CANCELLED"
  | "DELIVERY_EXCEPTION"

/** 명세 1행(주문 항목) — 상세 미리보기와 `GET /{id}/items`가 같은 모양 */
export interface SettlementItem {
  orderNumber: string
  subOrderNumber: string | null
  consumerNameMasked: string
  productName: string
  optionName: string | null
  quantity: number
  /** 정산 반영 수량 — 부분 반품은 「확정 2/3」 */
  settledQuantity: number
  unitPrice: number
  paidAmount: number
  status: SettlementItemStatus
  statusLabel: string
  /** 단가 × 반영 수량 */
  settledAmount: number
  /** % 값(10.0 = 10%) */
  rewardRate: number
  rewardAmount: number
}

export interface SettlementDates {
  createdAt: string
  ordersClosedAt: string
  reviewDueAt: string
  confirmedAt: string | null
  confirmReason: "AUTO" | "AGREED" | "EXPIRED" | null
  /** 「자동 확정」 · 「합의 확정」 · 「기한 만료 확정」 */
  confirmReasonLabel: string | null
  /** 브랜드 행 지급 예정일 */
  payoutDueDate: string | null
  /** 브랜드 행 지급 완료 시각 */
  paidAt: string | null
  /** 「자동 확정 10.06 + 3영업일 · 10.09 한글날 제외」 — 확정 전 null */
  payoutBasis: string | null
}

export type AdjustmentParty = "SELLER" | "CREATOR"

export type AdjustmentProposalStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "COUNTERED"
  | "CLOSED"

export interface SettlementAdjustmentProposal {
  seq: number
  proposerType: AdjustmentParty
  /** 내가(브랜드) 낸 제안인가 */
  mine: boolean
  rewardAmount: number
  reason: string | null
  status: AdjustmentProposalStatus
  proposedAt: string
  respondedAt: string | null
}

/**
 * 조정 내역 — 협의가 열린 뒤 항상(종결 뒤에도 이력으로) · 없으면 null.
 * 차례(`turn`) · 내/상대 최신 제안은 나(브랜드) 기준. 응답은 이슈 스레드에서만 한다.
 */
export interface SettlementAdjustmentBlock {
  adjustmentId: number
  threadId: number
  status: "OPEN" | "AGREED" | "EXPIRED"
  statusLabel: string
  requesterType: AdjustmentParty
  openedAt: string
  /** 개설 + 10영업일 23:59:59 · 연장 없음 */
  deadlineAt: string
  /** D-N — 종결 뒤 null */
  remainingBusinessDays: number | null
  originalRewardAmount: number
  maxRewardAmount: number
  agreedRewardAmount: number | null
  finalRewardAmount: number | null
  myLatestAmount: number | null
  counterpartLatestAmount: number | null
  counterpartLatestAt: string | null
  turn: "MY_TURN" | "THEIR_TURN" | "OPEN_FLOOR" | "CLOSED"
  turnLabel: string
  turnTone: SettlementTone
  /** seq 오름차순 전량 */
  proposals: Array<SettlementAdjustmentProposal>
}

export interface SettlementActions {
  /** 정산 확인 중 ∧ 마감 전 ∧ 협의 없음 */
  canRequestAdjustment: boolean
  /** 조정 협의의 내 차례(MY_TURN · OPEN_FLOOR) */
  canRespondAdjustment: boolean
  /** 확정 후만 */
  canDownloadStatement: boolean
  /** 브랜드 세금계산서 발행본 등록 후 */
  canDownloadTaxInvoice: boolean
}

/** `GET /{id}` — 상태에 따라 블록이 null이 된다(null 블록은 그리지 않는다) */
export interface SettlementDetail {
  settlementId: number
  settlementNumber: string
  groupBuy: { groupBuyId: number; title: string }
  influencer: SettlementInfluencer
  periodStartAt: string
  periodEndAt: string
  status: SettlementStatus
  statusLabel: string
  statusTone: SettlementTone
  dates: SettlementDates
  adjustment: SettlementAdjustmentBlock | null
  breakdown: SettlementBreakdown
  /** 확정 전(정산 확인 중 · 조정 협의) null */
  payouts: Array<SettlementPayout> | null
  /** 확정 전 null */
  payment: SettlementPayment | null
  /** 확정 시 생긴다 · 확정 전 null */
  taxDocuments: Array<SettlementTaxDocument> | null
  influencerTax: SettlementInfluencerTax
  claimShipping: SettlementClaimShipping
  /** 명세 미리보기 5건 — 주문번호 내림차순 */
  items: Array<SettlementItem>
  itemTotalCount: number
  actions: SettlementActions
  /** 내 지급 행 보류 이유(S5 「지급 정지 · 계정 이용 정지 중」) — 보류가 아니면 null · 배포 전 서버는 없음 */
  payoutHold?: PayoutHold | null
}

/** 정산 포트의 계산값 — 전 항목 절사 */
export interface SettlementAdjustmentAmounts {
  rewardAmount: number
  rewardVatAmount: number
  withholdingAmount: number
  /** 인플루언서 실지급 */
  creatorNetAmount: number
  /** 브랜드 수취액 */
  brandPayoutAmount: number
}

/** `GET /{id}/adjustment/preview` — 조정 요청 모달의 상한 · 자동 계산 */
export interface SettlementAdjustmentPreview {
  settlementId: number
  settlementNumber: string
  /** false면 버튼 비활성(에러 문구 없이) */
  canRequest: boolean
  cannotRequestReason: "REVIEW_CLOSED" | "ALREADY_ADJUSTING" | null
  reviewEndsAt: string
  originalRewardAmount: number
  /** 「조정 후 브랜드 수취액 ≥ 0」 상한 · 10원 미만 절사 */
  maxRewardAmount: number
  /** rewardAmount를 보내지 않으면 null */
  input: { rewardAmount: number } | null
  /** 범위 안 입력의 계산 — 입력이 없거나 범위 밖이면 null */
  preview: SettlementAdjustmentAmounts | null
  original: SettlementAdjustmentAmounts
  /** 0 ≤ 입력 ≤ 상한 — 입력이 없으면 null */
  inRange: boolean | null
}

/** `POST /{id}/adjustment` — 리워드(공급가) · 사유(필수 · 1,000자). 근거 첨부 칸은 없다 */
export interface SettlementAdjustmentRequest {
  rewardAmount: number
  reason: string
}

export interface SettlementAdjustmentRequestResponse {
  adjustmentId: number
  /** 자동 개설된 3자 이슈 스레드 */
  threadId: number
  proposalId: number
  deadlineAt: string
}
