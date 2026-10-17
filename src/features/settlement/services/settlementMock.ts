import type {
  SettlementAdjustmentRequest,
  SettlementBreakdown,
  SettlementDeduction,
  SettlementDetail,
  SettlementDistribution,
  SettlementListItem,
  SettlementPayoutInfo,
  SettlementShippingFee,
  SettlementStatementLine,
  StatementLineStatus,
} from "@/features/settlement/types"
import {
  adjustmentUpperBound,
  percentOf,
} from "@/features/settlement/utils/amount"
import dayjs, { type Dayjs } from "dayjs"

/*
  개발 서버 전용 목업 — 시안(ui-partner-13 rev.4) HEAD 「더미 수치 정합」을 그대로 따른다.
  KPI · 상태 칩 · 총 건수가 모두 아래 5건에서 나오고, 분해 표는 계산 순서대로 맞아떨어진다
  (누적 지급 3,543,200 + 2,914,100 = 6,457,300 · 지급 예정 4,712,800 − 차감 30,000 = 4,682,800).

  시안과 다른 점: 정산 확인 중(하이드라 앰플)의 날짜는 시안 고정값(09.19 생성 · 09.24 마감) 대신
  **오늘 기준**으로 만든다 — 마감이 지난 날짜면 [정산 조정 요청]이 비활성이라 C1을 열어 볼 수 없다.
  `?mock=settlement-review-closed`는 확인 기간이 막 지난 상태(버튼 비활성)를 보여준다.

  C1 제출은 이 파일의 메모리 안에서만 반영된다 — 새로 고침하면 처음 상태로 돌아간다.
*/

const PG_RATE = 3
const PLATFORM_FEE_RATE = 0
const REWARD_VAT_RATE = 10
const WITHHOLDING_RATE = 3.3
const PAYOUT_BUSINESS_DAYS = 3
const REVIEW_BUSINESS_DAYS = 3
const ADJUSTMENT_BUSINESS_DAYS = 10
const BRAND_NAME = "○○ 브랜드"

/** 목업 영업일 계산용 공휴일 — 실제 계산은 서버 몫이다 */
const HOLIDAYS = new Set(["2026-10-09", "2026-12-25", "2027-01-01"])

function addBusinessDays(from: Dayjs, days: number) {
  let cursor = from
  let left = days
  while (left > 0) {
    cursor = cursor.add(1, "day")
    const weekend = cursor.day() === 0 || cursor.day() === 6
    if (!weekend && !HOLIDAYS.has(cursor.format("YYYY-MM-DD"))) left -= 1
  }
  return cursor
}

const endOfDay = (date: Dayjs) => date.format("YYYY-MM-DDT23:59:59")

function breakdown(spec: {
  total: number
  cancel: [number, number]
  ret: [number, number]
  delivery: [number, number]
  rewardRate: number
  reshipFee?: number
  deductions?: Array<SettlementDeduction>
}): SettlementBreakdown {
  const confirmedSales =
    spec.total - spec.cancel[1] - spec.ret[1] - spec.delivery[1]
  const pgFee = percentOf(confirmedSales, PG_RATE)
  const platformFee = percentOf(confirmedSales, PLATFORM_FEE_RATE)
  const reward = percentOf(confirmedSales, spec.rewardRate)
  const rewardVat = percentOf(reward, REWARD_VAT_RATE)
  const reshipFee = spec.reshipFee ?? 0
  const brandReceivable =
    confirmedSales - pgFee - platformFee - reward - rewardVat + reshipFee
  const deductions = spec.deductions ?? []
  return {
    totalOrderAmount: spec.total,
    cancel: { count: spec.cancel[0], amount: spec.cancel[1] },
    return: { count: spec.ret[0], amount: spec.ret[1] },
    deliveryException: { count: spec.delivery[0], amount: spec.delivery[1] },
    confirmedSales,
    platformFee,
    platformFeeRate: PLATFORM_FEE_RATE,
    pgFee,
    pgFeeRate: PG_RATE,
    reward,
    rewardRate: spec.rewardRate,
    rewardVat,
    rewardVatRate: REWARD_VAT_RATE,
    reshipFee,
    brandReceivable,
    deductions,
    payoutAmount:
      brandReceivable - deductions.reduce((sum, d) => sum + d.amount, 0),
  }
}

function distribution(
  b: SettlementBreakdown,
  isBusiness: boolean
): SettlementDistribution {
  const withholdingAmount = isBusiness
    ? 0
    : percentOf(b.reward, WITHHOLDING_RATE)
  return {
    creatorIsBusiness: isBusiness,
    withholdingAmount,
    creatorNetAmount: isBusiness
      ? b.reward + b.rewardVat
      : b.reward - withholdingAmount,
    platformAmount: isBusiness ? b.platformFee : b.rewardVat + b.platformFee,
  }
}

const ACCOUNT = {
  bankName: "OO은행",
  maskedAccountNumber: "123-****-**89",
  accountHolder: "○○○",
}

function payoutInfo(
  rest: Pick<SettlementPayoutInfo, "scheduledDate" | "paidDate" | "pgReference">
): SettlementPayoutInfo {
  return { ...ACCOUNT, ...rest }
}

const shipping = (
  consumer: [number, number],
  brand: [number, number],
  undecided?: number
): Array<SettlementShippingFee> => [
  {
    payer: "CONSUMER",
    reasonLabel: "단순변심",
    count: consumer[0],
    amount: consumer[1],
  },
  {
    payer: "BRAND",
    reasonLabel: "불량 · 오배송",
    count: brand[0],
    amount: brand[1],
  },
  ...(undecided
    ? [
        {
          payer: "UNDECIDED" as const,
          reasonLabel: "미정",
          count: undecided,
          amount: null,
        },
      ]
    : []),
]

function line(
  orderNumber: string,
  consumerName: string,
  productOption: string,
  quantity: number,
  paidAmount: number,
  status: StatementLineStatus = "CONFIRMED"
): SettlementStatementLine {
  return {
    orderNumber,
    consumerName,
    productOption,
    quantity,
    paidAmount,
    status,
    reflectedAmount:
      status === "CONFIRMED"
        ? paidAmount
        : status === "RETURN_PROCESSING"
          ? null
          : 0,
  }
}

const NON_BUSINESS = { isBusiness: false, withholdingRate: WITHHOLDING_RATE }
const BUSINESS = { isBusiness: true, withholdingRate: WITHHOLDING_RATE }

/** D2 하이드라 앰플 — 정산 확인 중(날짜는 오늘 기준, 위 주석 참고) */
function reviewing(closed: boolean): SettlementDetail {
  const today = dayjs().startOf("day")
  const createdAt = closed
    ? today.subtract(REVIEW_BUSINESS_DAYS + 2, "day")
    : today
  const deadline = closed
    ? today.subtract(1, "day")
    : addBusinessDays(createdAt, REVIEW_BUSINESS_DAYS)
  const b = breakdown({
    total: 6_840_000,
    cancel: [7, 140_000],
    ret: [19, 380_000],
    delivery: [1, 20_000],
    rewardRate: 10,
  })
  return {
    settlementId: 1,
    settlementNumber: `STL-${createdAt.format("YYMM")}-014`,
    groupBuyId: null,
    groupBuyTitle: "하이드라 앰플 공구",
    creatorShowroomName: "뷰티로그",
    periodStart: "2026-08-20",
    periodEnd: "2026-08-26",
    status: "REVIEWING",
    createdAt: createdAt.format("YYYY-MM-DDTHH:mm:ss"),
    reviewDeadlineAt: endOfDay(deadline),
    autoConfirmedAt: deadline.add(1, "day").format("YYYY-MM-DD"),
    payoutBusinessDays: PAYOUT_BUSINESS_DAYS,
    excludedHolidays: [],
    breakdown: b,
    adjustment: null,
    distribution: null,
    payoutInfo: null,
    taxInvoice: {
      supplyAmount: b.reward + b.platformFee,
      vatAmount: b.rewardVat,
      status: "WAITING",
      issuedAt: null,
      approvalNumber: null,
      dueDate: null,
    },
    creatorTax: NON_BUSINESS,
    shippingFees: shipping([11, 55_000], [5, 25_000], 3),
    statementPreview: [
      line("ORD-24203", "구**", "하이드라 앰플 30ml / 단품", 1, 21_000),
      line("ORD-24199", "백**", "하이드라 앰플 30ml / 2개 세트", 2, 40_000),
      line(
        "ORD-24195",
        "임**",
        "하이드라 앰플 30ml / 단품",
        1,
        21_000,
        "RETURN_PROCESSING"
      ),
      line(
        "ORD-24191",
        "양**",
        "하이드라 앰플 30ml / 단품",
        1,
        21_000,
        "CANCELED"
      ),
      line("ORD-24188", "남**", "하이드라 앰플 30ml / 단품", 2, 42_000),
    ],
  }
}

function scheduled(): SettlementDetail {
  const b = breakdown({
    total: 6_020_000,
    cancel: [8, 160_000],
    ret: [13, 350_000],
    delivery: [1, 30_000],
    rewardRate: 10,
    deductions: [
      {
        orderNumber: "ORD-23642",
        sourceGroupBuyTitle: "수분 앰플 공구",
        reason: "구매확정 후 하자 반품",
        amount: 30_000,
        revisedInvoiceStatus: "WAITING",
      },
    ],
  })
  return {
    settlementId: 2,
    settlementNumber: "STL-2609-011",
    groupBuyId: null,
    groupBuyTitle: "데일리 선크림 공구",
    creatorShowroomName: "데일리뷰티랩",
    periodStart: "2026-08-01",
    periodEnd: "2026-08-07",
    status: "SCHEDULED",
    createdAt: "2026-09-30T14:20:00",
    reviewDeadlineAt: "2026-10-05T23:59:59",
    autoConfirmedAt: "2026-10-06",
    payoutBusinessDays: PAYOUT_BUSINESS_DAYS,
    excludedHolidays: [{ date: "2026-10-09", name: "한글날" }],
    breakdown: b,
    adjustment: null,
    distribution: distribution(b, false),
    payoutInfo: payoutInfo({
      scheduledDate: "2026-10-12",
      paidDate: null,
      pgReference: null,
    }),
    taxInvoice: {
      supplyAmount: b.reward + b.platformFee,
      vatAmount: b.rewardVat,
      status: "WAITING",
      issuedAt: null,
      approvalNumber: null,
      dueDate: "2026-11-10",
    },
    creatorTax: NON_BUSINESS,
    shippingFees: shipping([9, 45_000], [4, 20_000]),
    statementPreview: [
      line("ORD-24118", "김**", "데일리 선크림 50ml / 단품", 1, 19_800),
      line("ORD-24117", "이**", "데일리 선크림 리필 / 단품", 2, 25_600),
      line(
        "ORD-24115",
        "박**",
        "데일리 선크림 50ml / 단품",
        1,
        19_800,
        "CANCELED"
      ),
      line(
        "ORD-24114",
        "최**",
        "데일리 선크림 50ml / 단품",
        1,
        19_800,
        "RETURNED"
      ),
      line("ORD-24112", "정**", "데일리 선크림 50ml / 단품", 3, 59_400),
    ],
  }
}

function adjusting(): SettlementDetail {
  const b = breakdown({
    total: 3_280_000,
    cancel: [5, 100_000],
    ret: [9, 220_000],
    delivery: [1, 20_000],
    rewardRate: 10,
  })
  return {
    settlementId: 3,
    settlementNumber: "STL-2607-021",
    groupBuyId: null,
    groupBuyTitle: "수분 토너 공구",
    creatorShowroomName: "뷰티로그",
    periodStart: "2026-07-20",
    periodEnd: "2026-07-26",
    status: "ADJUSTING",
    createdAt: "2026-07-27T11:05:00",
    reviewDeadlineAt: "2026-07-30T23:59:59",
    autoConfirmedAt: null,
    payoutBusinessDays: PAYOUT_BUSINESS_DAYS,
    excludedHolidays: [],
    breakdown: b,
    adjustment: {
      requestedAt: "2026-07-30T16:40:00",
      deadlineAt: "2026-08-13T23:59:59",
      remainingBusinessDays: 4,
      originalReward: b.reward,
      proposals: [
        {
          seq: 1,
          by: "BRAND",
          byName: BRAND_NAME,
          at: "2026-07-30T16:40:00",
          rewardAmount: 235_200,
          reason: "콘텐츠 일부 미게시",
        },
        {
          seq: 2,
          by: "INFLUENCER",
          byName: "뷰티로그",
          at: "2026-08-02T10:12:00",
          rewardAmount: 264_600,
          reason: null,
        },
      ],
      turn: "MINE",
      threadId: null,
    },
    distribution: distribution(b, false),
    payoutInfo: payoutInfo({
      scheduledDate: null,
      paidDate: null,
      pgReference: null,
    }),
    taxInvoice: {
      supplyAmount: b.reward + b.platformFee,
      vatAmount: b.rewardVat,
      status: "WAITING",
      issuedAt: null,
      approvalNumber: null,
      dueDate: null,
    },
    creatorTax: NON_BUSINESS,
    shippingFees: shipping([6, 30_000], [3, 15_000]),
    statementPreview: [
      line("ORD-23968", "차**", "수분 토너 200ml / 단품", 1, 18_000),
      line("ORD-23965", "노**", "수분 토너 200ml / 2개 세트", 2, 34_200),
      line(
        "ORD-23962",
        "지**",
        "수분 토너 200ml / 단품",
        1,
        18_000,
        "CANCELED"
      ),
      line("ORD-23961", "추**", "수분 토너 리필 / 단품", 1, 12_600, "RETURNED"),
      line("ORD-23958", "표**", "수분 토너 200ml / 단품", 2, 36_000),
    ],
  }
}

/** D3 — 사업자 인플루언서: 원천징수 없이 리워드 + 부가세 전액 지급, 플랫폼 몫 0 */
function paidBusiness(): SettlementDetail {
  const b = breakdown({
    total: 4_530_000,
    cancel: [6, 120_000],
    ret: [10, 270_000],
    delivery: [1, 20_000],
    rewardRate: 10,
  })
  return {
    settlementId: 4,
    settlementNumber: "STL-2607-008",
    groupBuyId: null,
    groupBuyTitle: "글로우 세럼 공구",
    creatorShowroomName: "글로우살롱",
    periodStart: "2026-07-05",
    periodEnd: "2026-07-11",
    status: "PAID",
    createdAt: "2026-07-15T09:30:00",
    reviewDeadlineAt: "2026-07-20T23:59:59",
    autoConfirmedAt: "2026-07-21",
    payoutBusinessDays: PAYOUT_BUSINESS_DAYS,
    excludedHolidays: [],
    breakdown: b,
    adjustment: null,
    distribution: distribution(b, true),
    payoutInfo: payoutInfo({
      scheduledDate: "2026-07-24",
      paidDate: "2026-07-24",
      pgReference: "PG-20260724-003190",
    }),
    taxInvoice: {
      supplyAmount: b.reward + b.platformFee,
      vatAmount: b.rewardVat,
      status: "ISSUED",
      issuedAt: "2026-08-07",
      approvalNumber: "20260807-41000012-71102938",
      dueDate: "2026-08-10",
    },
    creatorTax: BUSINESS,
    shippingFees: shipping([7, 35_000], [3, 15_000]),
    statementPreview: [
      line("ORD-23841", "한**", "글로우 세럼 30ml / 단품", 1, 22_600),
      line("ORD-23838", "서**", "글로우 세럼 30ml / 2개 세트", 2, 43_200),
      line(
        "ORD-23835",
        "조**",
        "글로우 세럼 30ml / 단품",
        1,
        22_600,
        "RETURNED"
      ),
      line("ORD-23830", "윤**", "글로우 세럼 30ml / 단품", 2, 45_200),
      line(
        "ORD-23827",
        "강**",
        "글로우 세럼 30ml / 단품",
        1,
        22_600,
        "CANCELED"
      ),
    ],
  }
}

/** D1 — 비사업자 인플루언서: 리워드에서 3.3% 원천징수 후 지급 */
function paidNonBusiness(): SettlementDetail {
  const b = breakdown({
    total: 3_980_000,
    cancel: [8, 120_000],
    ret: [13, 220_000],
    delivery: [1, 20_000],
    rewardRate: 15,
  })
  return {
    settlementId: 5,
    settlementNumber: "STL-2606-017",
    groupBuyId: null,
    groupBuyTitle: "수분 앰플 공구",
    creatorShowroomName: "데일리뷰티랩",
    periodStart: "2026-06-10",
    periodEnd: "2026-06-16",
    status: "PAID",
    createdAt: "2026-06-18T15:10:00",
    reviewDeadlineAt: "2026-06-23T23:59:59",
    autoConfirmedAt: "2026-06-24",
    payoutBusinessDays: PAYOUT_BUSINESS_DAYS,
    excludedHolidays: [],
    breakdown: b,
    adjustment: null,
    distribution: distribution(b, false),
    payoutInfo: payoutInfo({
      scheduledDate: "2026-06-29",
      paidDate: "2026-06-29",
      pgReference: "PG-20260629-004821",
    }),
    taxInvoice: {
      supplyAmount: b.reward + b.platformFee,
      vatAmount: b.rewardVat,
      status: "ISSUED",
      issuedAt: "2026-07-08",
      approvalNumber: "20260708-41000012-55310927",
      dueDate: "2026-07-10",
    },
    creatorTax: NON_BUSINESS,
    shippingFees: shipping([9, 45_000], [4, 20_000]),
    statementPreview: [
      line("ORD-24118", "김**", "수분 앰플 50ml / 단품", 1, 19_800),
      line("ORD-24117", "이**", "수분 앰플 리필 / 단품", 2, 25_600),
      line("ORD-24115", "박**", "수분 앰플 50ml / 단품", 1, 19_800, "CANCELED"),
      line("ORD-24114", "최**", "수분 앰플 50ml / 단품", 1, 19_800, "RETURNED"),
      line("ORD-24112", "정**", "수분 앰플 50ml / 단품", 3, 59_400),
    ],
  }
}

/** 메모리 저장소 — C1 제출 결과(조정 협의 전환)를 새로 고침 전까지 유지한다 */
let store: Array<SettlementDetail> | null = null
let storeClosed = false

export function mockSettlements(scenario: string | null) {
  if (scenario === "settlement-empty") return []
  const closed = scenario === "settlement-review-closed"
  if (!store || storeClosed !== closed) {
    storeClosed = closed
    store = [
      reviewing(closed),
      scheduled(),
      adjusting(),
      paidBusiness(),
      paidNonBusiness(),
    ]
  }
  return store
}

/**
 * C1 정산 조정 요청 — 정산 전액 보류(조정 협의) + 이슈 스레드 자동 개설 · 차액 선지급 없음(§42-1).
 * 서버가 해야 할 검증(확인 기간 · 범위 · 사유)을 그대로 흉내 낸다.
 */
export function mockRequestAdjustment(
  scenario: string | null,
  settlementId: number,
  body: SettlementAdjustmentRequest
): SettlementDetail {
  const detail = mockSettlements(scenario).find(
    item => item.settlementId === settlementId
  )
  if (!detail) throw new Error("NOT_FOUND")
  const now = dayjs()
  if (
    detail.status !== "REVIEWING" ||
    now.isAfter(dayjs(detail.reviewDeadlineAt))
  ) {
    throw new Error("REVIEW_CLOSED")
  }
  const upper = adjustmentUpperBound(detail.breakdown)
  if (
    !Number.isInteger(body.rewardAmount) ||
    body.rewardAmount < 0 ||
    body.rewardAmount > upper ||
    !body.reason.trim()
  ) {
    throw new Error("INVALID_REQUEST")
  }

  const requestedAt = now.format("YYYY-MM-DDTHH:mm:ss")
  detail.status = "ADJUSTING"
  detail.autoConfirmedAt = null
  detail.adjustment = {
    requestedAt,
    deadlineAt: endOfDay(
      addBusinessDays(now.startOf("day"), ADJUSTMENT_BUSINESS_DAYS)
    ),
    remainingBusinessDays: ADJUSTMENT_BUSINESS_DAYS,
    originalReward: detail.breakdown.reward,
    proposals: [
      {
        seq: 1,
        by: "BRAND",
        byName: BRAND_NAME,
        at: requestedAt,
        rewardAmount: body.rewardAmount,
        reason: body.reason.trim(),
      },
    ],
    turn: "THEIRS",
    threadId: null,
  }
  detail.distribution = distribution(
    detail.breakdown,
    detail.creatorTax.isBusiness
  )
  detail.payoutInfo = payoutInfo({
    scheduledDate: null,
    paidDate: null,
    pgReference: null,
  })
  return detail
}

export function toListItem(detail: SettlementDetail): SettlementListItem {
  const b = detail.breakdown
  return {
    settlementId: detail.settlementId,
    groupBuyTitle: detail.groupBuyTitle,
    creatorShowroomName: detail.creatorShowroomName,
    periodStart: detail.periodStart,
    periodEnd: detail.periodEnd,
    status: detail.status,
    confirmedSales: b.confirmedSales,
    feeAmount: b.pgFee + b.platformFee,
    rewardAmount: b.reward,
    rewardVatAmount: b.rewardVat,
    brandReceivable: b.brandReceivable,
    reviewDeadlineAt:
      detail.status === "REVIEWING" ? detail.reviewDeadlineAt : null,
    payoutDate:
      detail.status === "PAID"
        ? (detail.payoutInfo?.paidDate ?? null)
        : detail.status === "SCHEDULED"
          ? (detail.payoutInfo?.scheduledDate ?? null)
          : null,
  }
}
