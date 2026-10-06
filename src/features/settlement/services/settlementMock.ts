import type {
  SettlementBreakdown,
  SettlementDetail,
  SettlementFixedFee,
  SettlementListItem,
  SettlementShippingFee,
  SettlementStatementLine,
} from "@/features/settlement/types"

/*
  개발 서버 전용 목업 — 시안(ui-partner-13) 「더미 수치 정합」을 그대로 따른다.
  KPI · 상태 칩 · 총 건수가 모두 아래 6건에서 나오고, 분해 표는 계산 순서대로 맞아떨어진다.

  시안과 다른 점 하나: 시안 D1(데일리 선크림)은 상세에서 「지급 완료」를 보여주지만 목록에서는
  「정산 확정 · 08.31 예정」이다. 목업은 목록과 상세가 같은 사실을 가리켜야 하므로 데일리 선크림을
  정산 확정으로 두고, 비사업자 원천징수 지급 완료(D1)는 수분 앰플로 보여준다.
*/

const PG_RATE = 3
const WITHHOLDING_RATE = 3.3

function breakdown(spec: {
  total: number
  cancel: [number, number]
  ret: [number, number, number?]
  delivery: [number, number]
  rewardRate: number
  reshipFee?: number
}): SettlementBreakdown {
  const confirmedSales =
    spec.total - spec.cancel[1] - spec.ret[1] - spec.delivery[1]
  const pgFee = Math.round((confirmedSales * PG_RATE) / 100)
  const reward = Math.round((confirmedSales * spec.rewardRate) / 100)
  const reshipFee = spec.reshipFee ?? 0
  return {
    totalOrderAmount: spec.total,
    cancel: { count: spec.cancel[0], amount: spec.cancel[1] },
    return: {
      count: spec.ret[0],
      amount: spec.ret[1],
      processingCount: spec.ret[2] ?? 0,
    },
    deliveryException: { count: spec.delivery[0], amount: spec.delivery[1] },
    confirmedSales,
    platformFee: 0,
    platformFeeRate: 0,
    pgFee,
    pgFeeRate: PG_RATE,
    reward,
    reshipFee,
    payout: confirmedSales - pgFee - reward + reshipFee,
  }
}

function withholding(reward: number, isBusiness: boolean) {
  const amount = isBusiness ? 0 : Math.floor((reward * WITHHOLDING_RATE) / 100)
  return {
    creatorIsBusiness: isBusiness,
    withholdingRate: isBusiness ? 0 : WITHHOLDING_RATE,
    withholdingAmount: amount,
    creatorNetAmount: reward - amount,
    taxInvoiceReceived: false,
  }
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

const fixedFee = (
  amount: number,
  brandPaidAt: string,
  creatorPaidAt: string
): Array<SettlementFixedFee> => [{ amount, brandPaidAt, creatorPaidAt }]

type Line = [
  string,
  string,
  string,
  number,
  number,
  SettlementStatementLine["status"],
]
const lines = (rows: Array<Line>): Array<SettlementStatementLine> =>
  rows.map(
    ([orderNumber, consumerName, productOption, quantity, paid, st]) => ({
      orderNumber,
      consumerName,
      productOption,
      quantity,
      paidAmount: paid,
      status: st,
      reflectedAmount:
        st === "CONFIRMED" ? paid : st === "RETURN_PROCESSING" ? null : 0,
    })
  )

const ACCOUNT = {
  bankName: "국민은행",
  maskedAccountNumber: "123-****-**89",
  accountHolder: "○○○",
}

export const MOCK_SETTLEMENT_DETAILS: Array<SettlementDetail> = [
  {
    settlementId: 106,
    groupBuyId: null,
    groupBuyTitle: "하이드라 앰플 공구",
    creatorShowroomName: "뷰티로그",
    periodStart: "2026-08-20",
    periodEnd: "2026-08-26",
    status: "PENDING",
    confirmedAt: null,
    lastPurchaseConfirmedAt: null,
    settlementLagDays: 3,
    pendingClaimCount: 3,
    breakdown: breakdown({
      total: 6_840_000,
      cancel: [7, 140_000],
      ret: [19, 380_000, 3],
      delivery: [1, 20_000],
      rewardRate: 10,
    }),
    hold: null,
    payoutInfo: null,
    withholding: null,
    shippingFees: shipping([11, 55_000], [5, 25_000], 3),
    fixedFees: fixedFee(350_000, "2026-08-12", "2026-08-19"),
    statementPreview: lines([
      [
        "ORD-24203",
        "구**",
        "하이드라 앰플 30ml / 단품",
        1,
        21_000,
        "CONFIRMED",
      ],
      [
        "ORD-24199",
        "백**",
        "하이드라 앰플 30ml / 2개 세트",
        2,
        40_000,
        "CONFIRMED",
      ],
      [
        "ORD-24195",
        "임**",
        "하이드라 앰플 30ml / 단품",
        1,
        21_000,
        "RETURN_PROCESSING",
      ],
      ["ORD-24191", "양**", "하이드라 앰플 30ml / 단품", 1, 21_000, "CANCELED"],
      [
        "ORD-24188",
        "남**",
        "하이드라 앰플 30ml / 단품",
        2,
        42_000,
        "CONFIRMED",
      ],
    ]),
  },
  {
    settlementId: 105,
    groupBuyId: null,
    groupBuyTitle: "글로우 크림 공구",
    creatorShowroomName: "글로우살롱",
    periodStart: "2026-08-10",
    periodEnd: "2026-08-16",
    status: "PENDING",
    confirmedAt: null,
    lastPurchaseConfirmedAt: null,
    settlementLagDays: 3,
    pendingClaimCount: 2,
    breakdown: breakdown({
      total: 3_960_000,
      cancel: [4, 80_000],
      ret: [8, 180_000, 2],
      delivery: [0, 0],
      rewardRate: 10,
    }),
    hold: null,
    payoutInfo: null,
    withholding: null,
    shippingFees: shipping([5, 25_000], [1, 5_000], 2),
    fixedFees: fixedFee(300_000, "2026-08-02", "2026-08-09"),
    statementPreview: lines([
      ["ORD-24102", "오**", "글로우 크림 50ml / 단품", 1, 24_000, "CONFIRMED"],
      ["ORD-24099", "유**", "글로우 크림 50ml / 단품", 2, 48_000, "CONFIRMED"],
      [
        "ORD-24097",
        "신**",
        "글로우 크림 50ml / 단품",
        1,
        24_000,
        "RETURN_PROCESSING",
      ],
      ["ORD-24094", "권**", "글로우 크림 리필 / 단품", 1, 18_000, "RETURNED"],
      [
        "ORD-24090",
        "황**",
        "글로우 크림 50ml / 2개 세트",
        2,
        45_600,
        "CONFIRMED",
      ],
    ]),
  },
  {
    settlementId: 104,
    groupBuyId: null,
    groupBuyTitle: "데일리 선크림 공구",
    creatorShowroomName: "데일리뷰티랩",
    periodStart: "2026-08-01",
    periodEnd: "2026-08-07",
    status: "CONFIRMED",
    confirmedAt: "2026-08-28",
    lastPurchaseConfirmedAt: "2026-08-25",
    settlementLagDays: 3,
    pendingClaimCount: 0,
    breakdown: breakdown({
      total: 6_020_000,
      cancel: [8, 160_000],
      ret: [13, 350_000],
      delivery: [1, 30_000],
      rewardRate: 10,
    }),
    hold: null,
    payoutInfo: {
      ...ACCOUNT,
      scheduledDate: "2026-08-31",
      paidDate: null,
      pgReference: null,
    },
    withholding: withholding(548_000, false),
    shippingFees: shipping([9, 45_000], [4, 20_000]),
    fixedFees: fixedFee(400_000, "2026-07-10", "2026-07-18"),
    statementPreview: lines([
      [
        "ORD-24118",
        "김**",
        "데일리 선크림 50ml / 단품",
        1,
        19_800,
        "CONFIRMED",
      ],
      [
        "ORD-24117",
        "이**",
        "데일리 선크림 리필 / 단품",
        2,
        25_600,
        "CONFIRMED",
      ],
      ["ORD-24115", "박**", "데일리 선크림 50ml / 단품", 1, 19_800, "CANCELED"],
      ["ORD-24114", "최**", "데일리 선크림 50ml / 단품", 1, 19_800, "RETURNED"],
      [
        "ORD-24112",
        "정**",
        "데일리 선크림 50ml / 단품",
        3,
        59_400,
        "CONFIRMED",
      ],
    ]),
  },
  {
    settlementId: 103,
    groupBuyId: null,
    groupBuyTitle: "수분 토너 공구",
    creatorShowroomName: "뷰티로그",
    periodStart: "2026-07-20",
    periodEnd: "2026-07-26",
    status: "ON_HOLD",
    confirmedAt: "2026-07-30",
    lastPurchaseConfirmedAt: "2026-07-27",
    settlementLagDays: 3,
    pendingClaimCount: 0,
    breakdown: breakdown({
      total: 3_280_000,
      cancel: [5, 100_000],
      ret: [9, 220_000],
      delivery: [1, 20_000],
      rewardRate: 10,
    }),
    hold: {
      heldAt: "2026-07-30",
      reason: "소비자 분쟁 진행 중",
      reasonDetail:
        "주문 3건에 대한 이슈 스레드가 열려 있어 지급을 멈췄습니다.",
      releaseCondition: "이슈 스레드 종결 후 운영자가 지급을 재개합니다",
      releaseDetail: "분쟁 결과에 따라 정산 금액이 조정될 수 있습니다.",
      heldAmount: 2_557_800,
    },
    payoutInfo: {
      ...ACCOUNT,
      scheduledDate: null,
      paidDate: null,
      pgReference: null,
    },
    withholding: withholding(294_000, false),
    shippingFees: shipping([6, 30_000], [3, 15_000]),
    fixedFees: fixedFee(250_000, "2026-07-08", "2026-07-14"),
    statementPreview: lines([
      ["ORD-23968", "차**", "수분 토너 200ml / 단품", 1, 18_000, "CONFIRMED"],
      [
        "ORD-23965",
        "노**",
        "수분 토너 200ml / 2개 세트",
        2,
        34_200,
        "CONFIRMED",
      ],
      ["ORD-23962", "지**", "수분 토너 200ml / 단품", 1, 18_000, "CANCELED"],
      ["ORD-23961", "추**", "수분 토너 리필 / 단품", 1, 12_600, "RETURNED"],
      ["ORD-23958", "표**", "수분 토너 200ml / 단품", 2, 36_000, "CONFIRMED"],
    ]),
  },
  {
    settlementId: 102,
    groupBuyId: null,
    groupBuyTitle: "글로우 세럼 공구",
    creatorShowroomName: "글로우살롱",
    periodStart: "2026-07-05",
    periodEnd: "2026-07-11",
    status: "PAID",
    confirmedAt: "2026-07-21",
    lastPurchaseConfirmedAt: "2026-07-18",
    settlementLagDays: 3,
    pendingClaimCount: 0,
    breakdown: breakdown({
      total: 4_530_000,
      cancel: [6, 120_000],
      ret: [10, 270_000],
      delivery: [1, 20_000],
      rewardRate: 10,
    }),
    hold: null,
    payoutInfo: {
      ...ACCOUNT,
      scheduledDate: "2026-07-24",
      paidDate: "2026-07-24",
      pgReference: "PG-20260724-003190",
    },
    withholding: withholding(412_000, true),
    shippingFees: shipping([7, 35_000], [3, 15_000]),
    fixedFees: fixedFee(300_000, "2026-06-28", "2026-07-02"),
    statementPreview: lines([
      ["ORD-23841", "한**", "글로우 세럼 30ml / 단품", 1, 22_600, "CONFIRMED"],
      [
        "ORD-23838",
        "서**",
        "글로우 세럼 30ml / 2개 세트",
        2,
        43_200,
        "CONFIRMED",
      ],
      ["ORD-23835", "조**", "글로우 세럼 30ml / 단품", 1, 22_600, "RETURNED"],
      ["ORD-23830", "윤**", "글로우 세럼 30ml / 단품", 2, 45_200, "CONFIRMED"],
      ["ORD-23827", "강**", "글로우 세럼 30ml / 단품", 1, 22_600, "CANCELED"],
    ]),
  },
  {
    settlementId: 101,
    groupBuyId: null,
    groupBuyTitle: "수분 앰플 공구",
    creatorShowroomName: "데일리뷰티랩",
    periodStart: "2026-06-10",
    periodEnd: "2026-06-16",
    status: "PAID",
    confirmedAt: "2026-06-26",
    lastPurchaseConfirmedAt: "2026-06-23",
    settlementLagDays: 3,
    pendingClaimCount: 0,
    breakdown: breakdown({
      total: 3_900_000,
      cancel: [5, 100_000],
      ret: [7, 160_000],
      delivery: [1, 20_000],
      rewardRate: 15,
    }),
    hold: null,
    payoutInfo: {
      ...ACCOUNT,
      scheduledDate: "2026-06-29",
      paidDate: "2026-06-29",
      pgReference: "PG-20260629-002147",
    },
    withholding: withholding(543_000, false),
    shippingFees: shipping([4, 20_000], [2, 10_000]),
    // 고정 지급비가 없는 계약 — 이력 카드의 빈 상태를 확인하는 용도
    fixedFees: [],
    statementPreview: lines([
      ["ORD-23402", "문**", "수분 앰플 30ml / 단품", 1, 26_000, "CONFIRMED"],
      [
        "ORD-23398",
        "송**",
        "수분 앰플 30ml / 2개 세트",
        2,
        49_400,
        "CONFIRMED",
      ],
      ["ORD-23395", "류**", "수분 앰플 30ml / 단품", 1, 26_000, "RETURNED"],
      ["ORD-23391", "전**", "수분 앰플 30ml / 단품", 1, 26_000, "CANCELED"],
      ["ORD-23388", "홍**", "수분 앰플 30ml / 단품", 3, 78_000, "CONFIRMED"],
    ]),
  },
]

export function toListItem(detail: SettlementDetail): SettlementListItem {
  const pending = detail.status === "PENDING"
  const b = detail.breakdown
  return {
    settlementId: detail.settlementId,
    groupBuyTitle: detail.groupBuyTitle,
    creatorShowroomName: detail.creatorShowroomName,
    periodStart: detail.periodStart,
    periodEnd: detail.periodEnd,
    status: detail.status,
    confirmedSales: pending ? null : b.confirmedSales,
    feeAmount: pending ? null : b.platformFee + b.pgFee,
    rewardAmount: pending ? null : b.reward,
    payoutAmount: pending ? null : b.payout,
    payoutDate:
      detail.status === "PAID"
        ? (detail.payoutInfo?.paidDate ?? null)
        : detail.status === "CONFIRMED"
          ? (detail.payoutInfo?.scheduledDate ?? null)
          : null,
  }
}
