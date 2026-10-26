import { ApiNotReadyError, mockDelay } from "@/common/utils/devMock"
import type {
  GuideStepKey,
  HomeCalendar,
  HomeCalendarDeadline,
  HomeCalendarGroupBuy,
  HomeGuide,
  HomeLive,
  HomeLiveHour,
  HomePendingTasks,
  SellerHome,
} from "@/features/home/types"
import { getAccountStatusMock } from "@/features/suspension/services/accountStatus.mock"
import { isSuspendedScenario } from "@/features/suspension/services/accountStatusService"
import type { SanctionHoldView } from "@/features/suspension/types"
import dayjs, { type Dayjs } from "dayjs"
import utc from "dayjs/plugin/utc"

dayjs.extend(utc)

/*
  개발 서버 전용 목업 — `homeService`가 DEV 가드 뒤에서 동적 import한다(배포 번들에 들어가지 않는다).
  숫자 · 이름은 시안 ui-partner-16 rev.3 그대로(진행 중 「수분 크림 공구」 · 오픈 예정 「수분 크림 리필 공구」는 다른 공구 ·
  다음 지급 예정 4,751,650원 · 10.20). 날짜는 오늘 기준 상대값이라 달력의 오늘 테두리 · 남은 시간이 실제처럼 보인다.
  시각 규칙은 서버와 같다 — 공구 시작/종료는 KST 벽시계, `asOf`는 UTC 벽시계.
*/

const WALL = "YYYY-MM-DDTHH:mm:ss"
const today = () => dayjs().startOf("day")
const wall = (value: Dayjs) => value.format(WALL)
const day = (value: Dayjs) => value.format("YYYY-MM-DD")

const MY_HOLD = (stage: string): SanctionHoldView => ({
  kind: "MINE",
  label: `${stage} · 계정 이용 정지`,
  tone: "WARNING",
  party: null,
})

/** 2026년 공휴일(대체공휴일 포함) — 서버 `business_holiday`와 같은 꼴 */
const HOLIDAYS_2026: Array<[string, string]> = [
  ["2026-01-01", "신정"],
  ["2026-02-16", "설날"],
  ["2026-02-17", "설날"],
  ["2026-02-18", "설날"],
  ["2026-03-01", "삼일절"],
  ["2026-03-02", "대체공휴일"],
  ["2026-05-05", "어린이날"],
  ["2026-05-24", "부처님오신날"],
  ["2026-05-25", "대체공휴일"],
  ["2026-06-03", "지방선거"],
  ["2026-06-06", "현충일"],
  ["2026-08-15", "광복절"],
  ["2026-08-17", "대체공휴일"],
  ["2026-09-24", "추석"],
  ["2026-09-25", "추석"],
  ["2026-09-26", "추석"],
  ["2026-10-03", "개천절"],
  ["2026-10-05", "대체공휴일"],
  ["2026-10-09", "한글날"],
  ["2026-12-25", "성탄절"],
]

// ─────────────────────────────────────────── 공구 일정(오늘 기준)

function schedule() {
  const t = today()
  return {
    running: {
      start: t.subtract(4, "day").hour(10),
      end: t.add(2, "day").hour(23).minute(59).second(59),
    },
    refill: {
      start: t.add(4, "day").hour(10),
      end: t.add(10, "day").hour(23).minute(59).second(59),
    },
    toner: {
      start: t.add(11, "day").hour(10),
      end: t.add(17, "day").hour(23).minute(59).second(59),
    },
    cleansing: {
      start: t.subtract(15, "day").hour(10),
      end: t.subtract(9, "day").hour(23).minute(59).second(59),
    },
    shipDue: t.add(5, "day"),
  }
}

// ─────────────────────────────────────────── 실시간

/** 시안 H1 시간대별 막대(00~10시) 뒤로 이어지는 하루 흐름 */
const HOURLY_ORDERS = [
  1, 1, 0, 0, 0, 1, 2, 3, 5, 5, 6, 4, 5, 6, 4, 3, 5, 6, 7, 8, 6, 4, 2, 1,
]
const UNIT_PRICE = 20_750

function liveBlock(empty: boolean): HomeLive {
  const now = dayjs()
  const asOf = now.utc().format(WALL)
  if (empty) return { asOf, items: [] }

  const { running } = schedule()
  const total = running.end.diff(running.start)
  const progressRatio = Math.min(
    1,
    Math.max(0, now.diff(running.start) / total)
  )
  const hourly: Array<HomeLiveHour> = HOURLY_ORDERS.map((orders, hour) => {
    const counted = hour <= now.hour() ? orders : 0
    return {
      hour,
      orders: counted,
      amount: counted * UNIT_PRICE,
      collecting: hour === now.hour(),
    }
  })

  return {
    asOf,
    items: [
      {
        groupBuyId: 201,
        name: "수분 크림 공구",
        creatorId: 11,
        creatorName: "데일리뷰티랩",
        startAt: wall(running.start),
        endAt: wall(running.end),
        progressRatio,
        visitorsToday: 1184,
        visitorsCumulative: 5010,
        ordersToday: 24,
        ordersYesterdaySameTime: 19,
        paidToday: 498_000,
        paidCumulative: 6_240_000,
        ordersCumulative: 312,
        soldQuantity: 336,
        stock: { remaining: 12, minQuantity: 300, productId: 501 },
        hourly,
      },
    ],
  }
}

// ─────────────────────────────────────────── 홈

const ZERO_TASKS: HomePendingTasks = {
  sales: {
    prepareStart: 0,
    invoiceRegister: 0,
    shipOverdue: 0,
    cancelRequests: 0,
    deliveryIssue: 0,
  },
  claims: { collectWait: 0, inspection: 0, inspectOverdue: 0, reship: 0 },
  inquiry: { unansweredProductInquiries: 0 },
  contract: { mySignatureNeeded: 0, reviewRejected: 0 },
  settlement: { adjustmentMyTurn: 0 },
  total: 0,
}

const BUSY_TASKS: HomePendingTasks = {
  sales: {
    prepareStart: 5,
    invoiceRegister: 8,
    shipOverdue: 1,
    cancelRequests: 2,
    deliveryIssue: 2,
  },
  claims: { collectWait: 3, inspection: 2, inspectOverdue: 1, reship: 1 },
  inquiry: { unansweredProductInquiries: 3 },
  contract: { mySignatureNeeded: 1, reviewRejected: 1 },
  settlement: { adjustmentMyTurn: 1 },
  // 기한 경과 · 지연은 이미 각 칸에 든 건이라 더하지 않는다
  total: 5 + 8 + 2 + 2 + 3 + 2 + 1 + 3 + 1 + 1 + 1,
}

let guideHidden = false

function guideBlock(
  completed: number,
  currentStep: GuideStepKey | null,
  connected: number
): HomeGuide {
  const order: Array<GuideStepKey> = [
    "BRAND_INFO",
    "PRODUCT",
    "CONNECTION",
    "CONTRACT",
    "OPEN",
    "ORDERS",
  ]
  return {
    visible: currentStep !== null && !guideHidden,
    hidden: guideHidden,
    completed,
    currentStep,
    steps: order.map((key, index) => ({ key, done: index < completed })),
    connectedCreatorCount: connected,
    connectedCreatorName: connected > 0 ? "뷰티로그" : null,
    shippingLeadDays: 3,
  }
}

async function buildHome(scenario: string | null): Promise<SellerHome> {
  const account = await getAccountStatusMock(scenario)
  const suspended = isSuspendedScenario(scenario)
  const { running, refill, toner } = schedule()

  if (scenario === "home-new" || scenario === "home-guide-contract") {
    const contractTurn = scenario === "home-guide-contract"
    return {
      account,
      guide: contractTurn
        ? guideBlock(3, "CONTRACT", 1)
        : guideBlock(1, "PRODUCT", 0),
      pendingTasks: ZERO_TASKS,
      live: liveBlock(true),
      contractsInProgress: { count: 0, items: [] },
      upcomingGroupBuys: { count: 0, items: [] },
      settlement: {
        nextPayoutAmount: null,
        nextPayoutDate: null,
        reviewingCount: 0,
        adjustmentMyTurn: 0,
      },
    }
  }

  const empty = scenario === "home-empty"
  const contracts = empty
    ? [
        {
          contractId: 103,
          groupBuyName: "헤어 오일 공구",
          creatorId: 13,
          creatorName: "글로우살롱",
          status: "REVIEW_PENDING",
          statusLabel: "검토 대기",
          groupBuyStartAt: wall(toner.start.add(14, "day")),
          hold: null,
        },
      ]
    : [
        {
          contractId: 101,
          groupBuyName: "비타 세럼 공구",
          creatorId: 12,
          creatorName: "뷰티로그",
          status: "SIGNING",
          statusLabel: "서명 진행중",
          groupBuyStartAt: wall(toner.start.add(7, "day")),
          hold: suspended ? MY_HOLD("체결 보류") : null,
        },
        {
          contractId: 102,
          groupBuyName: "아이크림 신제품 공구",
          creatorId: 11,
          creatorName: "데일리뷰티랩",
          status: "REVIEW_REJECTED",
          statusLabel: "검토 반려",
          groupBuyStartAt: wall(toner.start.add(10, "day")),
          hold: null,
        },
        {
          contractId: 103,
          groupBuyName: "헤어 오일 공구",
          creatorId: 13,
          creatorName: "글로우살롱",
          status: "REVIEW_PENDING",
          statusLabel: "검토 대기",
          groupBuyStartAt: wall(toner.start.add(14, "day")),
          hold: suspended ? MY_HOLD("검토 보류") : null,
        },
      ]

  return {
    account,
    guide: guideBlock(6, null, 3),
    pendingTasks: empty ? ZERO_TASKS : BUSY_TASKS,
    live: liveBlock(false),
    contractsInProgress: { count: contracts.length, items: contracts },
    upcomingGroupBuys: {
      count: 2,
      items: [
        {
          groupBuyId: 202,
          name: "수분 크림 리필 공구",
          creatorId: 12,
          creatorName: "뷰티로그",
          startAt: wall(refill.start),
          status: "READY",
          statusLabel: "준비완료",
          postStatus: "SCHEDULED",
          postStatusLabel: "예약",
          blockedReason: null,
          hold: suspended ? MY_HOLD("승인 보류") : null,
        },
        {
          groupBuyId: 203,
          name: "수분 토너 대용량 공구",
          creatorId: 13,
          creatorName: "글로우살롱",
          startAt: wall(toner.start),
          status: "PREPARING",
          statusLabel: "준비중",
          postStatus: "REJECTED",
          postStatusLabel: "반려",
          blockedReason: "게시물 반려 — 인플루언서 수정 대기",
          hold: suspended ? MY_HOLD("승인 보류") : null,
        },
      ],
    },
    settlement: {
      nextPayoutAmount: 4_751_650,
      nextPayoutDate: day(running.end.add(2, "day")),
      reviewingCount: 1,
      adjustmentMyTurn: empty ? 0 : 1,
    },
  }
}

export async function getHomeMock(scenario: string | null) {
  if (scenario === "home-not-ready") throw new ApiNotReadyError("홈")
  return mockDelay(await buildHome(scenario))
}

export function getLiveMock(scenario: string | null) {
  const empty = scenario === "home-new" || scenario === "home-guide-contract"
  return mockDelay(liveBlock(empty))
}

export function getCalendarMock(
  month: string,
  scenario: string | null
): Promise<HomeCalendar> {
  const first = dayjs(`${month}-01`)
  const from = first.subtract(7, "day")
  const to = first.endOf("month").startOf("day").add(7, "day")
  const holidays = HOLIDAYS_2026.filter(([date]) => {
    const d = dayjs(date)
    return !d.isBefore(from) && !d.isAfter(to)
  }).map(([date, name]) => ({ date, name }))

  const fresh = scenario === "home-new" || scenario === "home-guide-contract"
  if (fresh) {
    return mockDelay({
      month,
      from: day(from),
      to: day(to),
      holidays,
      groupBuys: [],
      deadlines: [],
    })
  }

  const suspended = isSuspendedScenario(scenario)
  const s = schedule()
  const groupBuys: Array<HomeCalendarGroupBuy> = [
    {
      groupBuyId: 200,
      name: "클렌징 폼 공구",
      startAt: wall(s.cleansing.start),
      endAt: wall(s.cleansing.end),
      status: "ENDED",
      hold: null,
    },
    {
      groupBuyId: 201,
      name: "수분 크림 공구",
      startAt: wall(s.running.start),
      endAt: wall(s.running.end),
      status: "IN_PROGRESS",
      hold: null,
    },
    {
      groupBuyId: 202,
      name: "수분 크림 리필 공구",
      startAt: wall(s.refill.start),
      endAt: wall(s.refill.end),
      status: "UPCOMING",
      hold: suspended ? MY_HOLD("승인 보류") : null,
    },
    {
      groupBuyId: 203,
      name: "수분 토너 대용량 공구",
      startAt: wall(s.toner.start),
      endAt: wall(s.toner.end),
      status: "UPCOMING",
      hold: suspended ? MY_HOLD("승인 보류") : null,
    },
  ].filter(
    gb => !dayjs(gb.endAt).isBefore(from) && !dayjs(gb.startAt).isAfter(to)
  )

  const deadlines: Array<HomeCalendarDeadline> = [
    {
      date: day(s.shipDue),
      kind: "SHIP_DUE",
      label: "발송 기한 · 수분 크림",
      targetType: "GROUP_BUY",
      targetId: 201,
    },
  ]
  // 서버는 정지 보류 중인 계약의 서명 기한을 빼고 내린다(기한이 멈춘다)
  if (!suspended) {
    deadlines.push({
      date: day(today()),
      kind: "SIGN_DUE",
      label: "서명 기한 · 비타 세럼",
      targetType: "CONTRACT",
      targetId: 101,
    })
  }

  return mockDelay({
    month,
    from: day(from),
    to: day(to),
    holidays,
    groupBuys,
    deadlines: deadlines.filter(
      d => !dayjs(d.date).isBefore(from) && !dayjs(d.date).isAfter(to)
    ),
  })
}

export function updateGuideMock(hidden: boolean): Promise<HomeGuide> {
  guideHidden = hidden
  return mockDelay({ ...guideBlock(1, "PRODUCT", 0), visible: !hidden })
}
