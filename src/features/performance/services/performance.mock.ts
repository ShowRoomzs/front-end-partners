import {
  ApiNotReadyError,
  mockDelay,
  mockScenario,
} from "@/common/utils/devMock"
import type {
  PerformanceCost,
  PerformanceCostRequest,
  PerformanceDetail,
  PerformanceFigure,
  PerformanceListItem,
  PerformanceListPage,
  PerformanceListParams,
  PerformanceSettlementBreakdown,
  PerformanceSettlementLink,
  PerformanceStatus,
  PerformanceSummary,
} from "@/features/performance/types"
import { AxiosError, type AxiosResponse } from "axios"

/*
  성과 관리 개발 서버 목업 — 시안 ui-partner-12 rev.8 숫자 그대로(1021 변경내역 ④: 데일리 선크림 공구 ·
  정산액 4,775,800 · 수익 1,287,200원 · 23.5% · D4 4,836,080 · 1,347,480 · 24.6% · 이번 지급액 4,751,650).
  `performanceService`가 가드(`callOrMock`) 안에서 동적 import한다 — 배포 번들에 들어가지 않는다.
  시나리오 값은 서비스 머리 주석에 있다.
*/

const fin = (
  value: number | null,
  basis?: string,
  original?: number | null
): PerformanceFigure => ({
  value,
  state: "FINAL",
  basis: basis ?? null,
  original: original ?? null,
})
const proj = (value: number | null, basis?: string): PerformanceFigure => ({
  value,
  state: "PROJECTED",
  basis: basis ?? null,
})
const pending = (basis: string): PerformanceFigure => ({
  value: null,
  state: "PENDING_SETTLEMENT",
  basis,
})
const nego = (original: number, basis: string): PerformanceFigure => ({
  value: null,
  state: "NEGOTIATING",
  original,
  basis,
})

const LABEL: Record<PerformanceStatus, string> = {
  AGGREGATING: "집계 중",
  REVIEWING: "정산 확인 중",
  ADJUSTING: "조정 협의",
  PAYOUT_SCHEDULED: "지급 예정",
  PAID: "지급 완료",
}
const TONE = {
  AGGREGATING: "NEUTRAL",
  REVIEWING: "NEUTRAL",
  ADJUSTING: "WARNING",
  PAYOUT_SCHEDULED: "NEUTRAL",
  PAID: "SUCCESS",
} as const

function statusOf(status: PerformanceStatus) {
  return { status, statusLabel: LABEL[status], statusTone: TONE[status] }
}

// ── 목록 · 요약(L1 · L2) ──

const AGG_ROW = {
  visitors: proj(null),
  conversionRate: proj(null),
  confirmedSales: proj(null),
  payout: proj(null),
  confirmedQuantity: proj(null),
  confirmRate: proj(null),
}

const LIST_ROWS: Array<PerformanceListItem> = [
  {
    groupBuyId: 64,
    groupBuyTitle: "글로우 크림 앵콜 공구",
    influencer: { creatorId: 15, showroomName: "글로우살롱" },
    periodStart: "2026-10-16T10:00:00",
    periodEnd: "2026-10-22T23:59:00",
    ...statusOf("AGGREGATING"),
    ...AGG_ROW,
    detailAvailable: true,
  },
  {
    groupBuyId: 63,
    groupBuyTitle: "수분 크림 공구",
    influencer: { creatorId: 12, showroomName: "데일리뷰티랩" },
    periodStart: "2026-10-14T10:00:00",
    periodEnd: "2026-10-20T23:59:00",
    ...statusOf("AGGREGATING"),
    ...AGG_ROW,
    detailAvailable: true,
  },
  {
    groupBuyId: 62,
    groupBuyTitle: "글로우 세럼 공구",
    influencer: { creatorId: 15, showroomName: "글로우살롱" },
    periodStart: "2026-08-24T10:00:00",
    periodEnd: "2026-08-30T23:59:00",
    ...statusOf("AGGREGATING"),
    ...AGG_ROW,
    detailAvailable: true,
  },
  {
    groupBuyId: 58,
    groupBuyTitle: "수분 토너 공구",
    influencer: { creatorId: 9, showroomName: "뷰티로그" },
    periodStart: "2026-08-10T10:00:00",
    periodEnd: "2026-08-16T23:59:00",
    ...statusOf("ADJUSTING"),
    visitors: fin(3120),
    conversionRate: fin(4.9),
    confirmedSales: fin(2940000),
    payout: nego(2531340, "리워드 합의 후 확정"),
    confirmedQuantity: fin(147),
    confirmRate: fin(92.0),
    detailAvailable: true,
  },
  {
    groupBuyId: 61,
    groupBuyTitle: "데일리 선크림 공구",
    influencer: { creatorId: 12, showroomName: "데일리뷰티랩" },
    periodStart: "2026-08-01T10:00:00",
    periodEnd: "2026-08-07T23:59:00",
    ...statusOf("PAYOUT_SCHEDULED"),
    visitors: fin(5010),
    conversionRate: fin(5.8),
    confirmedSales: fin(5480000),
    payout: fin(4775800),
    confirmedQuantity: fin(274),
    confirmRate: fin(93.0),
    detailAvailable: true,
  },
  {
    groupBuyId: 57,
    groupBuyTitle: "클렌징 밤 공구",
    influencer: { creatorId: 15, showroomName: "글로우살롱" },
    periodStart: "2026-07-30T10:00:00",
    periodEnd: "2026-08-05T23:59:00",
    ...statusOf("PAID"),
    visitors: fin(3630),
    conversionRate: fin(5.4),
    confirmedSales: fin(3710000),
    payout: fin(3190600),
    confirmedQuantity: fin(196),
    confirmRate: fin(89.9),
    detailAvailable: true,
  },
]

function guardNotReady() {
  if (mockScenario() === "not-ready") throw new ApiNotReadyError("성과 관리")
}

export function getListMock(
  params: PerformanceListParams
): Promise<PerformanceListPage> {
  guardNotReady()
  const source = mockScenario() === "empty" ? [] : LIST_ROWS
  const keyword = params.keyword.trim()
  const filtered = source
    .filter(row => params.status.includes(row.status))
    .filter(
      row =>
        !keyword ||
        row.groupBuyTitle.includes(keyword) ||
        row.influencer.showroomName.includes(keyword)
    )
    .sort((a, b) =>
      params.sort === "SALES_DESC"
        ? (b.confirmedSales.value ?? -1) - (a.confirmedSales.value ?? -1)
        : b.periodEnd.localeCompare(a.periodEnd)
    )
  const page = Number(params.page) || 1
  const size = Number(params.size) || 20
  const content = filtered.slice((page - 1) * size, page * size)
  const totalPages = Math.ceil(filtered.length / size)
  return mockDelay({
    content,
    pageInfo: {
      currentPage: page,
      totalPages,
      totalResults: filtered.length,
      limit: size,
      hasNext: page < totalPages,
    },
    listPeriod: filtered.length
      ? {
          from: filtered.map(row => row.periodStart.slice(0, 10)).sort()[0],
          to: filtered
            .map(row => row.periodEnd.slice(0, 10))
            .sort()
            .at(-1)!,
        }
      : null,
  })
}

const SCOPE = "정산 2건 합산(지급 예정 1 · 지급 완료 1)"
const NONE = "집계된 공구 없음"

export function getSummaryMock(): Promise<PerformanceSummary> {
  guardNotReady()
  if (mockScenario() === "empty") {
    return mockDelay({
      population: {
        count: 0,
        statuses: ["PAYOUT_SCHEDULED", "PAID"],
        breakdown: { PAYOUT_SCHEDULED: 0, PAID: 0 },
      },
      confirmedSales: fin(null, NONE),
      visitors: fin(null, NONE),
      avgAov: fin(null, NONE),
      avgConversionRate: fin(null, NONE),
      avgRoas: fin(null, NONE),
      genderRatio: { female: null, male: null, basis: NONE },
      avgConfirmRate: fin(null, NONE),
      avgRepurchaseRate: fin(null, NONE),
      statusCounts: {
        AGGREGATING: 0,
        REVIEWING: 0,
        ADJUSTING: 0,
        PAYOUT_SCHEDULED: 0,
        PAID: 0,
      },
    })
  }
  return mockDelay({
    population: {
      count: 2,
      statuses: ["PAYOUT_SCHEDULED", "PAID"],
      breakdown: { PAYOUT_SCHEDULED: 1, PAID: 1 },
    },
    confirmedSales: fin(9190000, SCOPE),
    visitors: fin(8640, "2건 누적 · 고유 방문"),
    avgAov: fin(18760, "확정 거래액 ÷ 확정 주문 490건"),
    avgConversionRate: fin(5.7, "방문 8,640명 대비 구매확정 490명"),
    avgRoas: fin(550, "확정 거래액 ÷ 총 집행비 1,669,000원"),
    genderRatio: { female: 80, male: 20, basis: SCOPE },
    avgConfirmRate: fin(91.4, "주문 536건 중 490건 확정"),
    avgRepurchaseRate: fin(29.0, "구매확정 490명 중 재구매 142명"),
    statusCounts: {
      AGGREGATING: 3,
      REVIEWING: 0,
      ADJUSTING: 1,
      PAYOUT_SCHEDULED: 1,
      PAID: 1,
    },
  })
}

// ── 상세(D1 · D2 · D3 · D4 · D1-C · D1-D) ──

const LIMITS = [
  "쇼룸 방문은 쇼룸 단위로 셉니다 — 같은 기간에 이 인플루언서의 다른 공구가 열려 있었다면 그 방문도 함께 셉니다.",
  "유입 경로는 딥링크 파라미터와 앱 내부 리퍼러로만 판정합니다 — 어느 SNS에서 왔는지는 알 수 없습니다.",
  "공유 수는 아직 집계하지 않습니다.",
]

const BREAKDOWN_D1: PerformanceSettlementBreakdown = {
  grossOrderAmount: 5920000,
  cancel: { amount: 160000, count: 8 },
  return: { amount: 260000, count: 13 },
  deliveryException: { amount: 20000, count: 1 },
  confirmedSalesAmount: 5480000,
  pgFee: { rate: 0.03, amount: 164400 },
  platformFee: { rate: 0, amount: 0, normalRate: 0 },
  originalRewardAmount: 548000,
  rewardAmount: 548000,
  rewardVat: { rate: 0.1, amount: 54800 },
  reshipFee: { amount: 27000, count: 9 },
  consumerDeliveryFee: 30000,
  returnDeductionFee: { amount: 6000, count: 2 },
  freightAdjustment: { amount: 0, count: 0 },
  brandPayoutBeforeClawback: 4775800,
  clawbacks: [{ amount: 24150 }],
  brandClawbackAmount: 24150,
  brandPayoutAmount: 4751650,
}

const COST_FILLED: PerformanceCost = {
  editable: true,
  lockedReason: null,
  items: [
    {
      contractItemId: 81,
      productName: "데일리 선크림 50ml",
      confirmedQuantity: fin(220),
      unitCost: 7200,
      subtotal: 1584000,
    },
    {
      contractItemId: 82,
      productName: "데일리 선크림 리필",
      confirmedQuantity: fin(54),
      unitCost: 5100,
      subtotal: 275400,
    },
  ],
  packagingCost: 219200,
  shippingCost: 918000,
  returnDisposalCost: 92000,
  etcCost: 0,
  totalCost: fin(3088600, "상품 원가 + 부자재 + 배송비 + 반품 폐기 + 기타"),
  profit: fin(1287200, "정산액 − 총 원가 − 고정 지급비"),
  profitRate: fin(23.5, "확정 거래액 대비"),
  updatedAt: "2026-10-12T05:20:00",
}

const COST_BASIS_EMPTY = "개당 원가를 입력하면 수익이 계산됩니다"

const COST_EMPTY: PerformanceCost = {
  ...COST_FILLED,
  items: COST_FILLED.items.map(item => ({
    ...item,
    unitCost: null,
    subtotal: null,
  })),
  packagingCost: null,
  shippingCost: null,
  returnDisposalCost: null,
  etcCost: null,
  totalCost: fin(null, COST_BASIS_EMPTY),
  profit: fin(null, COST_BASIS_EMPTY),
  profitRate: fin(null, COST_BASIS_EMPTY),
  updatedAt: null,
}

const SETTLEMENT_D1: PerformanceSettlementLink = {
  settlementId: 21,
  ...statusOf("PAYOUT_SCHEDULED"),
  breakdown: BREAKDOWN_D1,
  payout: fin(4775800),
  reviewDueAt: "2026-10-13T23:59:59",
  payoutDueDate: "2026-10-20",
  paidAt: null,
  adjustment: null,
}

/** D1 — 데일리 선크림 공구 · 지급 예정 · 원가 입력 완료(D1-D와 같은 값) */
const DETAIL_D1: PerformanceDetail = {
  groupBuyId: 61,
  groupBuyTitle: "데일리 선크림 공구",
  influencer: { creatorId: 12, showroomName: "데일리뷰티랩" },
  connectionId: 40,
  periodStart: "2026-08-01T10:00:00",
  periodEnd: "2026-08-07T23:59:00",
  ...statusOf("PAYOUT_SCHEDULED"),
  aggregating: null,
  contract: {
    contractId: 70,
    fixedFeeAmount: 400000,
    fixedFeeTriggerLabel: "공구 게시물 등록 후",
    fixedFeeText:
      "고정 지급비 400,000원 · 지급 시점: 공구 게시물 등록 후 · 브랜드 직접 지급",
    rewardRateLabel: "10%",
    reward: fin(548000),
    totalSpend: fin(948000, "고정 지급비 + 리워드"),
    periodDays: 7,
  },
  kpi: {
    confirmedSales: fin(5480000, "구매확정 291건 기준"),
    payout: fin(
      4775800,
      "PG·리워드·리워드 부가세 차감 후 실지급 · 정산 관리 기준"
    ),
    conversionRate: fin(5.8, "쇼룸 방문 5,010명 대비 구매확정"),
    confirmRate: fin(93.0, "주문 313건 중 291건 확정"),
    confirmedQuantity: fin(274, "주문 수량 326개"),
    orderedQuantity: 326,
    aov: fin(18830, "확정 거래액 ÷ 확정 주문 291건"),
    roas: fin(578, "확정 거래액 ÷ 총 집행비 948,000원"),
    repurchaseRate: fin(30.2, "구매확정 291명 중 재구매 88명"),
  },
  traffic: {
    visitorCount: 5010,
    visitCount: 6120,
    sources: [
      { source: "INTERNAL", label: "쇼룸 내부 탐색", count: 1880, ratio: 37.5 },
      {
        source: "PROFILE_LINK",
        label: "프로필 쇼룸 링크",
        count: 1640,
        ratio: 32.7,
      },
      {
        source: "POST_LINK",
        label: "공구 게시물 링크",
        count: 770,
        ratio: 15.4,
      },
      {
        source: "PRODUCT_LINK",
        label: "상품 상세 직접 링크",
        count: 720,
        ratio: 14.4,
      },
    ],
    post: {
      postId: 301,
      impressionCount: 4290,
      uniqueViewerCount: 3140,
      productViewCount: fin(1062, "조회 대비 24.8%"),
      orderCount: fin(152, "상세 대비 14.3%"),
      likeCount: 312,
      shareCount: {
        value: null,
        state: "NOT_AVAILABLE",
        basis: "집계 준비 중",
      },
    },
    funnel: {
      visitors: 5010,
      orders: 313,
      notOrdered: 4697,
      orderRate: 6.2,
      shipped: 305,
      delivered: 303,
      confirmed: fin(291),
      shippedRate: 97.4,
      deliveredRate: 96.8,
      confirmedRate: 93.0,
      cancelled: 8,
      returned: 13,
      deliveryException: 1,
      conversionRate: fin(5.8, "방문 대비 최종 구매전환율"),
    },
    limits: LIMITS,
  },
  sales: {
    products: [
      {
        contractItemId: 81,
        productId: 501,
        productName: "데일리 선크림 50ml",
        rewardRate: 10,
        detailViews: 2780,
        viewers: 2050,
        orderCount: 238,
        conversionRate: fin(11.6),
        confirmedQuantity: fin(220),
        confirmedSales: fin(4180000),
        returnRate: fin(4.1),
      },
      {
        contractItemId: 82,
        productId: 502,
        productName: "데일리 선크림 리필",
        rewardRate: 10,
        detailViews: 1080,
        viewers: 860,
        orderCount: 75,
        conversionRate: fin(8.7),
        confirmedQuantity: fin(54),
        confirmedSales: fin(1300000),
        returnRate: fin(7.4),
      },
    ],
    total: {
      contractItemId: null,
      productId: null,
      productName: "합계",
      rewardRate: null,
      detailViews: 3860,
      viewers: 2640,
      orderCount: 313,
      conversionRate: fin(11.9),
      confirmedQuantity: fin(274),
      confirmedSales: fin(5480000),
      returnRate: fin(4.7, "공구 전체 반품률 4.2% · 반품 13건 ÷ 주문 313건"),
    },
    highlights: {
      mostViewed: {
        productName: "데일리 선크림 50ml",
        basis: "상세 조회 2,780회 · 전체의 72%",
      },
      bestConversion: {
        productName: "데일리 선크림 50ml",
        basis: "조회자 2,050명 중 238건 · 11.6%",
      },
      highestReturn: {
        productName: "데일리 선크림 리필",
        basis: "확정 54개 중 4개 · 7.4%",
      },
    },
  },
  delivery: {
    shipOnTimeRate: fin(98.4, "발송 305건 중"),
    avgShipDays: fin(1.3, "결제완료 → 송장 등록"),
    claimRate: fin(0.3, "반송·분실 1건"),
    avgInquiryHours: fin(3.0, "상품 문의 답변까지 · 42건"),
  },
  breakdown: {
    totalCount: 22,
    deductionTotal: fin(30000),
    cancel: {
      count: 8,
      amount: 160000,
      lines: [
        {
          key: "AFTER_PAYMENT",
          label: "결제 직후",
          quantity: 5,
          amount: 100000,
          count: 5,
        },
        {
          key: "PREPARING",
          label: "상품준비중",
          quantity: 2,
          amount: 40000,
          count: 2,
        },
        {
          key: "SELLER_DIRECT",
          label: "직권 취소",
          quantity: 1,
          amount: 20000,
          count: 1,
        },
      ],
    },
    returned: {
      count: 13,
      amount: 260000,
      lines: [
        {
          key: "CHANGE_OF_MIND",
          label: "단순변심",
          quantity: 9,
          amount: 180000,
          count: 9,
        },
        {
          key: "DAMAGED_OR_DEFECTIVE",
          label: "불량",
          quantity: 2,
          amount: 40000,
          count: 2,
        },
        {
          key: "WRONG_OR_LATE_DELIVERY",
          label: "오배송",
          quantity: 1,
          amount: 20000,
          count: 1,
        },
        { key: "OTHER", label: "기타", quantity: 1, amount: 20000, count: 1 },
      ],
    },
    deliveryException: {
      count: 1,
      amount: 20000,
      lines: [
        {
          key: "RETURNED_TO_SENDER",
          label: "반송",
          quantity: 1,
          amount: 20000,
          count: 1,
        },
        { key: "LOST", label: "분실", quantity: 0, amount: 0, count: 0 },
      ],
    },
    pendingReturnCount: null,
  },
  consumers: {
    estimated: false,
    confirmedOrderCount: 291,
    confirmedBuyerCount: 291,
    newBuyerCount: fin(203, "구매확정 소비자 중 69.9%"),
    repurchaseBuyerCount: fin(88, "이 브랜드 공구를 이전에 구매한 소비자"),
    followerShare: fin(44, "구매확정 소비자 중 이 쇼룸을 팔로우한 비율"),
    acquisitionCost: fin(4670, "총 집행비 948,000원 ÷ 신규 소비자 203명"),
    gender: {
      female: 239,
      male: 52,
      unknown: 0,
      femaleRatio: 82.1,
      maleRatio: 17.9,
    },
    ageBands: [
      {
        band: "TEENS",
        label: "10대",
        female: 16,
        male: 1,
        total: 17,
        ratio: 5.8,
        merged: false,
      },
      {
        band: "TWENTIES",
        label: "20대",
        female: 104,
        male: 15,
        total: 119,
        ratio: 40.9,
        merged: false,
      },
      {
        band: "THIRTIES",
        label: "30대",
        female: 79,
        male: 17,
        total: 96,
        ratio: 33.0,
        merged: false,
      },
      {
        band: "FORTIES",
        label: "40대",
        female: 31,
        male: 13,
        total: 44,
        ratio: 15.1,
        merged: false,
      },
      {
        band: "FIFTIES_PLUS",
        label: "50대+",
        female: 9,
        male: 6,
        total: 15,
        ratio: 5.2,
        merged: false,
      },
    ],
  },
  cost: COST_FILLED,
  settlement: SETTLEMENT_D1,
}

/** D2 — 공구는 끝났지만 미처리 반품이 남아 있다 */
function detailD2(): PerformanceDetail {
  const d = structuredClone(DETAIL_D1)
  return {
    ...d,
    ...statusOf("AGGREGATING"),
    aggregating: {
      unclosedCount: 4,
      openReturnCount: 3,
      unclosedStages: [
        { stage: "RETURNING", label: "반송중", count: 3 },
        { stage: "SHIPPING", label: "배송중", count: 1 },
      ],
    },
    contract: {
      ...d.contract,
      reward: proj(612000, "상품별 리워드율 × 확정 수량"),
      totalSpend: pending("정산 후 확정"),
    },
    kpi: {
      confirmedSales: proj(6120000, "구매확정 예정 331건 기준"),
      payout: pending("반품 처리가 끝나면 산출됩니다"),
      conversionRate: proj(5.3, "쇼룸 방문 6,240명 대비 구매확정 예정"),
      confirmRate: proj(92.5, "주문 358건 중 331건 확정 예정"),
      confirmedQuantity: proj(306, "주문 수량 372개"),
      orderedQuantity: 372,
      aov: proj(18490, "확정 거래액 ÷ 확정 주문 예정 331건"),
      roas: pending("확정 거래액이 확정되면 산출됩니다"),
      repurchaseRate: proj(29.6, "구매확정 예정 331명 중 재구매 98명"),
    },
    traffic: {
      ...d.traffic,
      visitorCount: 6240,
      visitCount: 7410,
      sources: [
        {
          source: "INTERNAL",
          label: "쇼룸 내부 탐색",
          count: 2310,
          ratio: 37.0,
        },
        {
          source: "PROFILE_LINK",
          label: "프로필 쇼룸 링크",
          count: 1930,
          ratio: 30.9,
        },
        {
          source: "POST_LINK",
          label: "공구 게시물 링크",
          count: 1090,
          ratio: 17.5,
        },
        {
          source: "PRODUCT_LINK",
          label: "상품 상세 직접 링크",
          count: 910,
          ratio: 14.6,
        },
      ],
      post: {
        ...d.traffic.post!,
        impressionCount: 5180,
        uniqueViewerCount: 3760,
        productViewCount: fin(1284, "조회 대비 24.8%"),
        orderCount: fin(174, "상세 대비 13.6%"),
        likeCount: 368,
      },
      funnel: {
        visitors: 6240,
        orders: 358,
        notOrdered: 5882,
        orderRate: 5.7,
        shipped: 351,
        delivered: 347,
        confirmed: proj(331),
        shippedRate: 98.0,
        deliveredRate: 96.9,
        confirmedRate: 92.5,
        cancelled: 7,
        returned: 19,
        deliveryException: 1,
        conversionRate: proj(5.3, "방문 대비 최종 구매전환율"),
      },
    },
    sales: {
      products: [
        {
          ...d.sales.products[0],
          detailViews: 3240,
          viewers: 2410,
          orderCount: 272,
          conversionRate: fin(11.3),
          confirmedQuantity: proj(248),
          confirmedSales: proj(4910000),
          returnRate: proj(5.6),
        },
        {
          ...d.sales.products[1],
          detailViews: 1260,
          viewers: 980,
          orderCount: 86,
          conversionRate: fin(8.8),
          confirmedQuantity: proj(58),
          confirmedSales: proj(1210000),
          returnRate: proj(8.6),
        },
      ],
      total: {
        ...d.sales.total,
        detailViews: 4500,
        viewers: 3080,
        orderCount: 358,
        conversionRate: fin(11.6),
        confirmedQuantity: proj(306),
        confirmedSales: proj(6120000),
        returnRate: proj(6.2, "공구 전체 반품률 5.3% · 반품 19건 ÷ 주문 358건"),
      },
      highlights: {
        mostViewed: {
          productName: "데일리 선크림 50ml",
          basis: "상세 조회 3,240회 · 전체의 72%",
        },
        bestConversion: {
          productName: "데일리 선크림 50ml",
          basis: "조회자 2,410명 중 272건 · 11.3%",
        },
        highestReturn: {
          productName: "데일리 선크림 리필",
          basis: "확정 58개 중 5개 · 8.6%",
        },
      },
    },
    delivery: { ...d.delivery, shipOnTimeRate: fin(98.4, "발송 351건 중") },
    breakdown: {
      totalCount: 27,
      deductionTotal: proj(40000),
      cancel: {
        count: 7,
        amount: 140000,
        lines: [
          {
            key: "AFTER_PAYMENT",
            label: "결제 직후",
            quantity: 4,
            amount: 80000,
            count: 4,
          },
          {
            key: "PREPARING",
            label: "상품준비중",
            quantity: 2,
            amount: 40000,
            count: 2,
          },
          {
            key: "SELLER_DIRECT",
            label: "직권 취소",
            quantity: 1,
            amount: 20000,
            count: 1,
          },
        ],
      },
      returned: {
        count: 19,
        amount: 380000,
        lines: [
          {
            key: "CHANGE_OF_MIND",
            label: "단순변심",
            quantity: 14,
            amount: 280000,
            count: 14,
          },
          {
            key: "DAMAGED_OR_DEFECTIVE",
            label: "불량",
            quantity: 3,
            amount: 60000,
            count: 3,
          },
          {
            key: "WRONG_OR_LATE_DELIVERY",
            label: "오배송",
            quantity: 1,
            amount: 20000,
            count: 1,
          },
          { key: "OTHER", label: "기타", quantity: 1, amount: 20000, count: 1 },
        ],
      },
      deliveryException: d.breakdown.deliveryException,
      pendingReturnCount: 3,
    },
    consumers: {
      ...d.consumers,
      estimated: true,
      confirmedOrderCount: 331,
      confirmedBuyerCount: 331,
      newBuyerCount: proj(231, "구매확정 예정 소비자 중 69.8%"),
      repurchaseBuyerCount: proj(98, "이 브랜드 공구를 이전에 구매한 소비자"),
      acquisitionCost: pending("총 집행비가 확정되면 산출됩니다"),
      gender: {
        female: 271,
        male: 60,
        unknown: 0,
        femaleRatio: 81.9,
        maleRatio: 18.1,
      },
      ageBands: [
        {
          band: "TEENS",
          label: "10대",
          female: 18,
          male: 2,
          total: 20,
          ratio: 6.0,
          merged: false,
        },
        {
          band: "TWENTIES",
          label: "20대",
          female: 118,
          male: 18,
          total: 136,
          ratio: 41.1,
          merged: false,
        },
        {
          band: "THIRTIES",
          label: "30대",
          female: 89,
          male: 20,
          total: 109,
          ratio: 32.9,
          merged: false,
        },
        {
          band: "FORTIES",
          label: "40대",
          female: 36,
          male: 14,
          total: 50,
          ratio: 15.1,
          merged: false,
        },
        {
          band: "FIFTIES_PLUS",
          label: "50대+",
          female: 10,
          male: 6,
          total: 16,
          ratio: 4.8,
          merged: false,
        },
      ],
    },
    cost: {
      ...COST_FILLED,
      editable: false,
      lockedReason: "AGGREGATING",
      items: [
        {
          ...COST_FILLED.items[0],
          confirmedQuantity: proj(248),
          subtotal: null,
        },
        {
          ...COST_FILLED.items[1],
          confirmedQuantity: proj(58),
          subtotal: null,
        },
      ],
      totalCost: pending("확정 수량이 확정되면 산출됩니다"),
      profit: pending("정산액이 확정되면 산출됩니다"),
      profitRate: pending("정산액이 확정되면 산출됩니다"),
    },
    settlement: null,
  }
}

/** D3 — 정산 조정 협의 중(리워드에 걸린 값만 「협의 중」) */
function detailD3(): PerformanceDetail {
  const d = structuredClone(DETAIL_D1)
  return {
    ...d,
    ...statusOf("ADJUSTING"),
    contract: {
      ...d.contract,
      reward: nego(548000, "조정 협의 중"),
      totalSpend: nego(948000, "합의 후 변동"),
    },
    kpi: {
      ...d.kpi,
      payout: nego(4775800, "리워드 합의 후 확정"),
      roas: nego(578, "총 집행비가 리워드 합의로 바뀜"),
    },
    consumers: {
      ...d.consumers,
      acquisitionCost: nego(4670, "합의 후 확정"),
    },
    cost: {
      ...d.cost,
      profit: nego(1287200, "정산액 확정 후 산출"),
      profitRate: nego(23.5, "정산액 확정 후 산출"),
    },
    settlement: {
      ...SETTLEMENT_D1,
      ...statusOf("ADJUSTING"),
      payout: nego(4775800, "리워드 합의 후 확정"),
      payoutDueDate: null,
      adjustment: {
        adjustmentId: 12,
        threadId: 140,
        status: "OPEN",
        statusLabel: "협의 중",
        requesterType: "SELLER",
        openedAt: "2026-07-30T01:00:00",
        deadlineAt: "2026-08-13T23:59:59",
        remainingBusinessDays: 4,
        originalRewardAmount: 548000,
        maxRewardAmount: 548000,
        agreedRewardAmount: null,
        finalRewardAmount: null,
        myLatestAmount: 438400,
        counterpartLatestAmount: 493200,
        counterpartLatestAt: "2026-08-03T02:00:00",
        turn: "MY_TURN",
        turnLabel: "내 응답 대기",
        turnTone: "WARNING",
        proposals: [
          {
            seq: 1,
            proposerType: "SELLER",
            mine: true,
            rewardAmount: 438400,
            reason: null,
            status: "COUNTERED",
            proposedAt: "2026-07-30T01:00:00",
            respondedAt: "2026-08-03T02:00:00",
          },
          {
            seq: 2,
            proposerType: "CREATOR",
            mine: false,
            rewardAmount: 493200,
            reason: null,
            status: "PENDING",
            proposedAt: "2026-08-03T02:00:00",
            respondedAt: null,
          },
        ],
      },
    },
  }
}

/** D4 — D3이 합의(493,200원)로 끝나 지급까지 완료 · 조정 여부는 「합의 반영 · 원래 N」으로만 */
function detailD4(): PerformanceDetail {
  const d = detailD3()
  const base = structuredClone(DETAIL_D1)
  return {
    ...d,
    ...statusOf("PAID"),
    contract: {
      ...d.contract,
      reward: fin(493200, "합의 반영", 548000),
      totalSpend: fin(893200, "고정 지급비 + 리워드", 948000),
    },
    kpi: {
      ...base.kpi,
      payout: fin(4836080, "합의 반영", 4775800),
      roas: fin(614, "총 집행비 893,200원 · 합의 반영", 578),
    },
    consumers: {
      ...base.consumers,
      acquisitionCost: fin(
        4400,
        "총 집행비 893,200원 ÷ 신규 소비자 203명",
        4670
      ),
    },
    cost: {
      ...base.cost,
      profit: fin(1347480, "정산액 − 총 원가 − 고정 지급비", 1287200),
      profitRate: fin(24.6, "확정 거래액 대비", 23.5),
    },
    settlement: {
      ...d.settlement!,
      ...statusOf("PAID"),
      breakdown: {
        ...BREAKDOWN_D1,
        rewardAmount: 493200,
        rewardVat: { rate: 0.1, amount: 49320 },
        brandPayoutBeforeClawback: 4836080,
        clawbacks: [],
        brandClawbackAmount: 0,
        brandPayoutAmount: 4836080,
      },
      payout: fin(4836080, "합의 반영", 4775800),
      payoutDueDate: "2026-10-20",
      paidAt: "2026-10-20T01:00:00",
      adjustment: {
        ...d.settlement!.adjustment!,
        status: "AGREED",
        statusLabel: "합의",
        remainingBusinessDays: null,
        agreedRewardAmount: 493200,
        finalRewardAmount: 493200,
        turn: "CLOSED",
        turnLabel: "종결",
        turnTone: "NEUTRAL",
        proposals: d.settlement!.adjustment!.proposals!.map(proposal =>
          proposal.seq === 2
            ? {
                ...proposal,
                status: "ACCEPTED" as const,
                respondedAt: "2026-10-08T05:00:00",
              }
            : proposal
        ),
      },
    },
  }
}

/** 지급 완료(합의 없음) — 목록의 클렌징 밤처럼 */
function detailPaid(): PerformanceDetail {
  const d = structuredClone(DETAIL_D1)
  return {
    ...d,
    ...statusOf("PAID"),
    settlement: {
      ...SETTLEMENT_D1,
      ...statusOf("PAID"),
      paidAt: "2026-10-20T01:00:00",
    },
  }
}

function notFound(): never {
  throw new AxiosError("Not Found", "ERR_BAD_REQUEST", undefined, undefined, {
    status: 404,
    data: { code: "GROUP_BUY_NOT_FOUND", message: "존재하지 않는 공구입니다." },
  } as AxiosResponse)
}

/** 저장한 원가 — 새로고침 전까지 유지해 D1-C → D1-D 전환을 흉내 낸다 */
const savedCost = new Map<string, PerformanceCost>()

const keyOf = (groupBuyId: number) => `${mockScenario() ?? ""}:${groupBuyId}`

function buildDetail(groupBuyId: number): PerformanceDetail {
  const scenario = mockScenario()
  const row = LIST_ROWS.find(item => item.groupBuyId === groupBuyId)
  let detail: PerformanceDetail
  switch (scenario) {
    case "aggregating":
      detail = detailD2()
      break
    case "adjusting":
      detail = detailD3()
      break
    case "paid-agreed":
      detail = detailD4()
      break
    case "cost-empty":
      detail = {
        ...structuredClone(DETAIL_D1),
        cost: structuredClone(COST_EMPTY),
      }
      break
    case "final":
    case "cost-filled":
      detail = structuredClone(DETAIL_D1)
      break
    default: {
      if (!row) notFound()
      detail =
        row.status === "AGGREGATING"
          ? detailD2()
          : row.status === "ADJUSTING"
            ? detailD3()
            : row.status === "PAID"
              ? detailPaid()
              : structuredClone(DETAIL_D1)
    }
  }
  // 목록 행에서 들어오면 제목 · 인플루언서 · 기간만 그 행으로 바꾼다(수치는 시안 세트를 재사용)
  if (row) {
    detail = {
      ...detail,
      groupBuyId,
      groupBuyTitle: row.groupBuyTitle,
      influencer: row.influencer,
      periodStart: row.periodStart,
      periodEnd: row.periodEnd,
    }
  }
  const cost = savedCost.get(keyOf(groupBuyId))
  return cost ? { ...detail, cost: applyProfit(detail, cost) } : detail
}

export function getDetailMock(groupBuyId: number): Promise<PerformanceDetail> {
  guardNotReady()
  if (mockScenario() === "not-found") notFound()
  return mockDelay(buildDetail(groupBuyId))
}

/** 서버 계산 규칙 그대로 — 총 원가 = Σ(개당 원가 × 확정 수량) + 4종 · 수익 = 정산액 − 총 원가 − 고정 지급비 */
function applyProfit(
  detail: PerformanceDetail,
  cost: PerformanceCost
): PerformanceCost {
  if (detail.status === "AGGREGATING") return detail.cost
  const allEntered = cost.items.every(item => item.unitCost != null)
  if (!allEntered) {
    return {
      ...cost,
      totalCost: fin(null, COST_BASIS_EMPTY),
      profit: fin(null, COST_BASIS_EMPTY),
      profitRate: fin(null, COST_BASIS_EMPTY),
    }
  }
  const total =
    cost.items.reduce((sum, item) => sum + (item.subtotal ?? 0), 0) +
    (cost.packagingCost ?? 0) +
    (cost.shippingCost ?? 0) +
    (cost.returnDisposalCost ?? 0) +
    (cost.etcCost ?? 0)
  const fixed = detail.contract.fixedFeeAmount ?? 0
  const sales = detail.kpi.confirmedSales.value ?? 0
  const rate = (profit: number) =>
    sales ? Math.round((profit / sales) * 1000) / 10 : null
  const payout = detail.kpi.payout
  const basis = "정산액 − 총 원가 − 고정 지급비"
  if (payout.state === "NEGOTIATING") {
    const original = (payout.original ?? 0) - total - fixed
    return {
      ...cost,
      totalCost: fin(total, COST_FILLED.totalCost.basis ?? undefined),
      profit: nego(original, "정산액 확정 후 산출"),
      profitRate: nego(rate(original) ?? 0, "정산액 확정 후 산출"),
    }
  }
  const profit = (payout.value ?? 0) - total - fixed
  const original =
    payout.original != null ? payout.original - total - fixed : null
  return {
    ...cost,
    totalCost: fin(total, COST_FILLED.totalCost.basis ?? undefined),
    profit: fin(profit, basis, original),
    profitRate: fin(
      rate(profit),
      "확정 거래액 대비",
      original != null ? rate(original) : null
    ),
  }
}

/** PUT cost 흉내 — 전체 교체 후 다시 계산한 상세를 돌려준다 */
export function saveCostMock(
  groupBuyId: number,
  body: PerformanceCostRequest
): Promise<PerformanceDetail> {
  guardNotReady()
  const detail = buildDetail(groupBuyId)
  const items = detail.cost.items.map(item => {
    const unitCost =
      body.items.find(entry => entry.contractItemId === item.contractItemId)
        ?.unitCost ?? null
    const quantity = item.confirmedQuantity.value
    return {
      ...item,
      unitCost,
      subtotal:
        unitCost != null && quantity != null ? unitCost * quantity : null,
    }
  })
  const cost: PerformanceCost = {
    ...detail.cost,
    items,
    packagingCost: body.packagingCost,
    shippingCost: body.shippingCost,
    returnDisposalCost: body.returnDisposalCost,
    etcCost: body.etcCost,
    updatedAt: new Date().toISOString().slice(0, 19),
  }
  savedCost.set(keyOf(groupBuyId), cost)
  return mockDelay({ ...detail, cost: applyProfit(detail, cost) })
}
