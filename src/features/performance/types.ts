import type { BaseParams, PageInfo } from "@/common/types/page"

/*
  성과 관리(ui-partner-12 rev.8) — 백엔드 `SellerPerformanceDto`(origin/main · 48 설계서 3절) 그대로.
  비율은 % 값(소수 1자리 · 93.0 = 93.0%) · ROAS는 % 정수(578 = 578%) · 금액은 원.
  날짜: 공구 기간(`periodStart` · `periodEnd`)과 지급 예정일 · 정산 확인 기한은 입력 · 기한이라 KST 벽시계,
  원가 저장 시각 · 지급 완료 시각은 이벤트 시각이라 UTC 벽시계(`parseServerDateTime`).
*/

/** 성과 상태 5종 = 정산 상태 + 집계 중(서버가 파생 · 분배 실패는 지급 완료로 접힌다) */
export const PERFORMANCE_STATUSES = [
  "AGGREGATING",
  "REVIEWING",
  "ADJUSTING",
  "PAYOUT_SCHEDULED",
  "PAID",
] as const

export type PerformanceStatus = (typeof PERFORMANCE_STATUSES)[number]

/** 성과 화면은 조치 화면이 아니라 위험색 · 정보색을 쓰지 않는다 */
export type PerformanceTone = "NEUTRAL" | "WARNING" | "SUCCESS"

export const PERFORMANCE_SORTS = ["ENDED_DESC", "SALES_DESC"] as const

export type PerformanceSort = (typeof PERFORMANCE_SORTS)[number]

/**
 * 지표 값 하나의 상태 — 어느 값이 어느 상태인지는 서버가 정하고 화면은 태그 · 회색 · 「—」만 그린다.
 * FINAL 확정 · PROJECTED 예정 · PENDING_SETTLEMENT 정산 후 확정 · NEGOTIATING 협의 중 · NOT_AVAILABLE 집계 준비 중
 */
export type FigureState =
  | "FINAL"
  | "PROJECTED"
  | "PENDING_SETTLEMENT"
  | "NEGOTIATING"
  | "NOT_AVAILABLE"

/** `value = null`은 「—」(아직 없음) · 0은 측정된 0이다. `original`은 조정 협의 · 합의 반영의 원래 값 */
export interface PerformanceFigure<T = number> {
  value: T | null
  state: FigureState
  original?: T | null
  basis?: string | null
}

export interface PerformanceInfluencer {
  creatorId: number
  showroomName: string
}

// ── 목록(3-2) ──

export interface PerformanceListParams extends BaseParams {
  status: Array<PerformanceStatus>
  keyword: string
  sort: PerformanceSort
  /** 개발 서버 `?mock=` 시나리오 — 필터를 바꿔도 주소에서 사라지지 않게 검색 조건과 같이 든다(서버에는 안 보낸다) */
  mock: string | null
}

export interface PerformanceListItem {
  groupBuyId: number
  groupBuyTitle: string
  influencer: PerformanceInfluencer
  periodStart: string
  periodEnd: string
  status: PerformanceStatus
  statusLabel: string
  statusTone: PerformanceTone
  visitors: PerformanceFigure
  conversionRate: PerformanceFigure
  confirmedSales: PerformanceFigure
  payout: PerformanceFigure
  confirmedQuantity: PerformanceFigure
  confirmRate: PerformanceFigure
  /** 집계 중 행도 상세(D2)가 열려 항상 true */
  detailAvailable: boolean
}

export interface PerformanceListPage {
  content: Array<PerformanceListItem>
  pageInfo: PageInfo
  /** 「조회기간 2026.07.18~08.07」 — 결과가 없으면 null */
  listPeriod: { from: string; to: string } | null
}

// ── 요약(3-3) ──

export type PerformanceStatusCounts = Record<PerformanceStatus, number>

export interface PerformanceSummary {
  /** KPI 모집단 = 지급 예정 + 지급 완료. count 0이면 빈 상태(L2) */
  population: {
    count: number
    statuses: Array<PerformanceStatus>
    breakdown: Partial<Record<PerformanceStatus, number>>
  }
  confirmedSales: PerformanceFigure
  visitors: PerformanceFigure
  avgAov: PerformanceFigure
  avgConversionRate: PerformanceFigure
  avgRoas: PerformanceFigure
  /** 정수 % — 아는 성별이 없으면 null · 큰 쪽을 앞에 두는 것은 화면 */
  genderRatio: {
    female: number | null
    male: number | null
    basis: string | null
  }
  avgConfirmRate: PerformanceFigure
  avgRepurchaseRate: PerformanceFigure
  /** 상태 칩 숫자 — 다섯 키가 항상 있다 */
  statusCounts: PerformanceStatusCounts
}

// ── 상세(3-4) ──

export interface PerformanceStage {
  stage: string
  label: string
  count: number
}

export interface PerformanceAggregating {
  unclosedCount: number
  /** 미처리 반품(건) — D2 배너 「미처리 반품 N건이 남아 있습니다」 */
  openReturnCount: number
  unclosedStages: Array<PerformanceStage>
}

export interface PerformanceContractBar {
  contractId: number
  fixedFeeAmount: number | null
  fixedFeeTriggerLabel: string | null
  /** 「고정 지급비 400,000원 · 지급 시점: 공구 게시물 등록 후 · 브랜드 직접 지급」 */
  fixedFeeText: string | null
  /** 상품마다 같으면 「10%」 · 다르면 「상품별」 */
  rewardRateLabel: string | null
  reward: PerformanceFigure
  /** 고정 지급비 + 리워드(리워드 부가세 제외) */
  totalSpend: PerformanceFigure
  /** 시작일 · 종료일 포함 */
  periodDays: number
}

export interface PerformanceKpi {
  confirmedSales: PerformanceFigure
  /** 이 공구의 브랜드 수취액(이전 정산 차감 전 · 10-24 수정) — 차감 후 「이번 지급액」은 정산 연결 분해 */
  payout: PerformanceFigure
  conversionRate: PerformanceFigure
  confirmRate: PerformanceFigure
  confirmedQuantity: PerformanceFigure
  orderedQuantity: number
  aov: PerformanceFigure
  roas: PerformanceFigure
  repurchaseRate: PerformanceFigure
}

export type PerformanceSourceKey =
  | "INTERNAL"
  | "PROFILE_LINK"
  | "POST_LINK"
  | "PRODUCT_LINK"

export interface PerformanceSource {
  source: PerformanceSourceKey
  label: string
  count: number
  ratio: number | null
}

export interface PerformancePost {
  postId: number
  impressionCount: number
  uniqueViewerCount: number
  productViewCount: PerformanceFigure
  orderCount: PerformanceFigure
  likeCount: number
  /** 원천 로그가 없어 항상 NOT_AVAILABLE(「집계 준비 중」) */
  shareCount: PerformanceFigure
}

export interface PerformanceFunnel {
  visitors: number
  orders: number
  notOrdered: number
  orderRate: number | null
  shipped: number
  delivered: number
  confirmed: PerformanceFigure
  shippedRate: number | null
  deliveredRate: number | null
  confirmedRate: number | null
  cancelled: number
  returned: number
  deliveryException: number
  conversionRate: PerformanceFigure
}

export interface PerformanceTraffic {
  visitorCount: number
  visitCount: number
  /** 항상 4행 · 합 = visitorCount */
  sources: Array<PerformanceSource>
  post: PerformancePost | null
  funnel: PerformanceFunnel
  /** 커버리지 한계 고지(서버 문장 그대로 · 순서대로) */
  limits: Array<string>
}

export interface PerformanceProductRow {
  contractItemId: number | null
  productId: number | null
  productName: string
  rewardRate: number | null
  detailViews: number
  viewers: number
  orderCount: number
  conversionRate: PerformanceFigure
  confirmedQuantity: PerformanceFigure
  confirmedSales: PerformanceFigure
  returnRate: PerformanceFigure
}

export interface PerformanceHighlight {
  productName: string
  basis: string
}

export interface PerformanceSales {
  products: Array<PerformanceProductRow>
  /** 합계 행 — 조회자는 중복 제거 · returnRate.basis에 공구 전체 반품률 */
  total: PerformanceProductRow
  highlights: {
    mostViewed: PerformanceHighlight | null
    bestConversion: PerformanceHighlight | null
    highestReturn: PerformanceHighlight | null
  }
}

export interface PerformanceDelivery {
  shipOnTimeRate: PerformanceFigure
  avgShipDays: PerformanceFigure
  claimRate: PerformanceFigure
  avgInquiryHours: PerformanceFigure
}

export interface PerformanceBreakdownLine {
  key: string
  label: string
  quantity: number
  amount: number
  count: number
}

export interface PerformanceBreakdownGroup {
  count: number
  amount: number
  lines: Array<PerformanceBreakdownLine>
}

export interface PerformanceBreakdown {
  totalCount: number
  deductionTotal: PerformanceFigure
  cancel: PerformanceBreakdownGroup
  returned: PerformanceBreakdownGroup
  deliveryException: PerformanceBreakdownGroup
  /** 집계 중일 때만 */
  pendingReturnCount: number | null
}

export interface PerformanceAgeBand {
  band:
    | "TEENS"
    | "TWENTIES"
    | "THIRTIES"
    | "FORTIES"
    | "FIFTIES_PLUS"
    | "OTHER"
    | "UNKNOWN"
  label: string
  female: number
  male: number
  total: number
  ratio: number | null
  /** 5명 미만 구간을 합친 「기타」 행 */
  merged: boolean
}

export interface PerformanceConsumers {
  /** 판매 · 소비자 블록이 예정값인가(집계 중) */
  estimated: boolean
  confirmedOrderCount: number
  confirmedBuyerCount: number
  newBuyerCount: PerformanceFigure
  repurchaseBuyerCount: PerformanceFigure
  followerShare: PerformanceFigure
  acquisitionCost: PerformanceFigure
  gender: {
    female: number
    male: number
    unknown: number
    femaleRatio: number | null
    maleRatio: number | null
  }
  ageBands: Array<PerformanceAgeBand>
}

export interface PerformanceCostItem {
  contractItemId: number
  productName: string
  confirmedQuantity: PerformanceFigure
  unitCost: number | null
  subtotal: number | null
}

/** 원가 · 수익 — 브랜드 전용. 개당 원가가 하나라도 비면 totalCost.value = null(D1-C) */
export interface PerformanceCost {
  editable: boolean
  /** 집계 중이면 "AGGREGATING" */
  lockedReason: string | null
  items: Array<PerformanceCostItem>
  packagingCost: number | null
  shippingCost: number | null
  returnDisposalCost: number | null
  etcCost: number | null
  totalCost: PerformanceFigure
  profit: PerformanceFigure
  profitRate: PerformanceFigure
  updatedAt: string | null
}

export interface PerformanceAmountCount {
  amount: number
  count: number
}

/**
 * 정산 분해 — 파트너 정산 관리(13) 상세의 `SellerSettlementDto.Breakdown` 그대로.
 * 1021에 생긴 줄(`returnDeductionFee` · `freightAdjustment`)은 개발 서버가 아직 안 줄 수 있어 선택으로 둔다.
 */
export interface PerformanceSettlementBreakdown {
  grossOrderAmount: number
  cancel: PerformanceAmountCount
  return: PerformanceAmountCount
  deliveryException: PerformanceAmountCount
  confirmedSalesAmount: number
  pgFee: { rate: number; amount: number }
  platformFee: { rate: number; amount: number; normalRate: number }
  originalRewardAmount: number
  rewardAmount: number
  rewardVat: { rate: number; amount: number }
  reshipFee: PerformanceAmountCount
  consumerDeliveryFee: number
  returnDeductionFee?: PerformanceAmountCount | null
  /** 부호 있음(소비자 부담 +, 환급 −) */
  freightAdjustment?: PerformanceAmountCount | null
  brandPayoutBeforeClawback: number
  clawbacks: Array<{ amount: number }>
  brandClawbackAmount: number
  /** 이번 지급액 */
  brandPayoutAmount: number
}

export type PerformanceAdjustmentParty = "SELLER" | "CREATOR"

export interface PerformanceAdjustmentProposal {
  seq: number
  proposerType: PerformanceAdjustmentParty
  mine: boolean
  rewardAmount: number
  reason: string | null
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "COUNTERED" | "CLOSED"
  proposedAt: string
  respondedAt: string | null
}

/** `SettlementPartyDto.AdjustmentBlock` — 응답 버튼 · 권한은 없다(협의는 이슈 스레드에서만) */
export interface PerformanceAdjustment {
  adjustmentId: number
  threadId: number
  status: "OPEN" | "AGREED" | "EXPIRED" | "WITHDRAWN"
  statusLabel: string
  requesterType: PerformanceAdjustmentParty
  openedAt: string
  /** 합의 기한 — 개설 + 10영업일 23:59:59 */
  deadlineAt: string
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
  turnTone: string
  proposals?: Array<PerformanceAdjustmentProposal>
}

export interface PerformanceSettlementLink {
  settlementId: number
  status: PerformanceStatus
  statusLabel: string
  statusTone: PerformanceTone
  breakdown: PerformanceSettlementBreakdown | null
  payout: PerformanceFigure
  reviewDueAt: string | null
  payoutDueDate: string | null
  paidAt: string | null
  adjustment: PerformanceAdjustment | null
}

export interface PerformanceDetail {
  groupBuyId: number
  groupBuyTitle: string
  influencer: PerformanceInfluencer
  /** [이 인플루언서와 재협업 제안] — 연결이 없으면 null */
  connectionId: number | null
  periodStart: string
  periodEnd: string
  status: PerformanceStatus
  statusLabel: string
  statusTone: PerformanceTone
  /** D2 배너 — 집계 중일 때만 */
  aggregating: PerformanceAggregating | null
  contract: PerformanceContractBar
  kpi: PerformanceKpi
  traffic: PerformanceTraffic
  sales: PerformanceSales
  delivery: PerformanceDelivery
  breakdown: PerformanceBreakdown
  consumers: PerformanceConsumers
  cost: PerformanceCost
  /** 집계 중이면 null */
  settlement: PerformanceSettlementLink | null
}

// ── 원가 저장(4-1) — 전체 교체 · 계약 상품 전부 · 미입력은 null ──

export interface PerformanceCostRequest {
  items: Array<{ contractItemId: number; unitCost: number | null }>
  packagingCost: number | null
  shippingCost: number | null
  returnDisposalCost: number | null
  etcCost: number | null
}
