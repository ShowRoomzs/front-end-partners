/*
  파트너센터 홈 — 백엔드 main `api/seller/home/dto/SellerHomeDto.java`(1017 설계서 4절)와
  알림함 `api/common/notification/dto/NotificationItem.java` · `NotificationSummary.java`를 그대로 옮겼다.

  시각 두 종류:
  - `Live.asOf` · 알림 `createdAt` — `now()` → UTC 벽시계 → `parseServerDateTime`
  - 공구 `startAt` · `endAt` · 계약 `groupBuyStartAt` · 달력 날짜 · 지급 예정일 — 입력값 · 기한 → 벽시계 그대로(`dayjs`)
*/
import type { ContractStatus } from "@/features/contracts/types"
import type { GroupBuyStatus } from "@/features/groupBuy/types"
import type {
  MemberAccountStatusResponse,
  SanctionHoldView,
} from "@/features/suspension/types"

// ─────────────────────────────────────────── GET /v1/seller/home

export type GuideStepKey =
  | "BRAND_INFO"
  | "PRODUCT"
  | "CONNECTION"
  | "CONTRACT"
  | "OPEN"
  | "ORDERS"

export interface HomeGuideStep {
  key: GuideStepKey | (string & {})
  done: boolean
}

/** 첫 공구 가이드(H3 · H3a) — 단계 판정은 서버, 단계 문구는 FE */
export interface HomeGuide {
  /** 숨기지 않음 ∧ 오픈된 공구가 아직 없음 */
  visible: boolean
  hidden: boolean
  /** 완료 단계 수(0 ~ 6) */
  completed: number
  /** 첫 미완 단계 — 모두 끝났으면 null */
  currentStep: GuideStepKey | (string & {}) | null
  steps: Array<HomeGuideStep>
  connectedCreatorCount: number
  connectedCreatorName: string | null
  shippingLeadDays: number | null
}

export interface HomeSalesTasks {
  prepareStart: number
  invoiceRegister: number
  /** 발송 기한 경과(경고) — 이미 다른 칸에 든 건이라 합계에 더하지 않는다 */
  shipOverdue: number
  cancelRequests: number
  deliveryIssue: number
}

export interface HomeClaimTasks {
  collectWait: number
  inspection: number
  /** 검수 기한 경과(경고) */
  inspectOverdue: number
  reship: number
}

export interface HomePendingTasks {
  sales: HomeSalesTasks
  claims: HomeClaimTasks
  inquiry: { unansweredProductInquiries: number }
  contract: { mySignatureNeeded: number; reviewRejected: number }
  settlement: { adjustmentMyTurn: number }
  /** 0이면 H2 「처리할 일 없음」 */
  total: number
}

export interface HomeContractRow {
  contractId: number
  groupBuyName: string
  creatorId: number
  creatorName: string
  status: ContractStatus | "TERMINATED" | (string & {})
  statusLabel: string
  groupBuyStartAt: string | null
  /** 체결 보류 · 검토 보류 — 정지가 아니면 null */
  hold: SanctionHoldView | null
}

/** 서버 main은 HIDDEN → EXPOSURE_SUSPENDED로 바뀌었다 — 개발 서버 옛 값도 받는다 */
export type HomePostStatus =
  | "NOT_WRITTEN"
  | "WRITING"
  | "PENDING_APPROVAL"
  | "REJECTED"
  | "SCHEDULED"
  | "EXPOSED"
  | "EXPOSURE_SUSPENDED"
  | "HIDDEN"
  | "CLOSED"

export interface HomeUpcomingRow {
  groupBuyId: number
  name: string
  creatorId: number
  creatorName: string
  startAt: string
  status: GroupBuyStatus | (string & {})
  statusLabel: string
  postStatus: HomePostStatus | (string & {})
  postStatusLabel: string
  /** 막힌 이유 — 없으면 null */
  blockedReason: string | null
  /** 승인 보류 — 정지가 아니면 null */
  hold: SanctionHoldView | null
}

export interface HomeSettlement {
  /** 지급 예정이 없으면 null */
  nextPayoutAmount: number | null
  nextPayoutDate: string | null
  reviewingCount: number
  adjustmentMyTurn: number
}

export interface SellerHome {
  account: MemberAccountStatusResponse
  guide: HomeGuide
  pendingTasks: HomePendingTasks
  /** 진행 중 공구 실시간 첫 그리기 — 이후 1분 갱신은 `/home/live` */
  live: HomeLive
  contractsInProgress: { count: number; items: Array<HomeContractRow> }
  upcomingGroupBuys: { count: number; items: Array<HomeUpcomingRow> }
  settlement: HomeSettlement
}

// ─────────────────────────────────────────── GET /v1/seller/home/live

export interface HomeLiveHour {
  hour: number
  orders: number
  amount: number
  /** 지금 시각의 칸 — 「집계 중」 */
  collecting: boolean
}

export interface HomeLiveItem {
  groupBuyId: number
  name: string
  creatorId: number
  creatorName: string
  startAt: string
  endAt: string
  /** 기간 진행률 0 ~ 1 */
  progressRatio: number
  visitorsToday: number
  visitorsCumulative: number
  ordersToday: number
  ordersYesterdaySameTime: number
  paidToday: number
  paidCumulative: number
  ordersCumulative: number
  soldQuantity: number
  stock: {
    remaining: number
    /** 계약 최소 준비 물량 합 — 비어 있으면 null */
    minQuantity: number | null
    /** [상품 재고 수정] 대상 */
    productId: number | null
  }
  /** 오늘 시간대별 24칸 */
  hourly: Array<HomeLiveHour>
}

export interface HomeLive {
  asOf: string
  items: Array<HomeLiveItem>
}

// ─────────────────────────────────────────── GET /v1/seller/home/calendar

export interface HomeHoliday {
  date: string
  name: string
}

export type CalendarGroupBuyStatus = "IN_PROGRESS" | "UPCOMING" | "ENDED"

export interface HomeCalendarGroupBuy {
  groupBuyId: number
  name: string
  startAt: string
  /** 조기 마감 · 중단이면 실제 종료 시각 */
  endAt: string
  status: CalendarGroupBuyStatus | (string & {})
  hold: SanctionHoldView | null
}

export interface HomeCalendarDeadline {
  date: string
  kind: "SHIP_DUE" | "SIGN_DUE" | (string & {})
  /** 예: 「발송 기한 · 밤 리페어 크림 공구」 */
  label: string
  targetType: "GROUP_BUY" | "CONTRACT" | (string & {})
  targetId: number
}

export interface HomeCalendar {
  /** yyyy-MM */
  month: string
  /** 요청 월 1일 − 7일 */
  from: string
  /** 요청 월 말일 + 7일(포함) */
  to: string
  holidays: Array<HomeHoliday>
  groupBuys: Array<HomeCalendarGroupBuy>
  deadlines: Array<HomeCalendarDeadline>
}

// ─────────────────────────────────────────── GET /v1/seller/badges

/** GNB 배지 — 홈 처리 대기와 같은 계산(0이면 숨김) */
export interface SellerBadges {
  connections: number
  contracts: number
  groupBuys: number
  sales: number
  settlements: number
  inquiries: number
}

// ─────────────────────────────────────────── /v1/seller/notifications

export type NotificationTargetType =
  | "ORDER_GROUP"
  | "CLAIM"
  | "INQUIRY"
  | "POST"
  | "SHOWROOM"
  | "GROUP_BUY"
  | "CONTRACT"
  | "SETTLEMENT"
  | "ADJUSTMENT"
  | "THREAD"
  | "PRODUCT"
  | "BASIC_INFO_TAB"
  | "CONNECTION_REQUESTS"
  | "TERMS"
  | "SETTINGS"
  | "ACCOUNT_STATUS"

export interface NotificationItem {
  notificationId: number
  type: string
  /** 파트너는 메뉴명(「계약」 · 「공구」 …) */
  category: string
  actorType: "OPERATOR" | "BRAND" | "CREATOR" | "SYSTEM" | "PLATFORM" | string
  /** 줄 머리 — 「운영팀」 · 상대 이름 · 「시스템」 */
  actorLabel: string
  title: string
  body: string | null
  emphasis: string | null
  target: {
    type: NotificationTargetType | (string & {}) | null
    id: number | null
    /** 문의 종류 · 기본정보 탭 · 스레드 메시지 id */
    sub: string | null
  } | null
  imageKind: string | null
  imageUrl: string | null
  liveGroupBuy: boolean
  advertising: boolean
  todoDueAt: string | null
  read: boolean
  createdAt: string
}

export interface NotificationPage {
  content: Array<NotificationItem>
  pageInfo: {
    currentPage?: number
    totalPages?: number
    totalResults?: number
    limit?: number
    hasNext?: boolean
  }
}

export interface NotificationSummary {
  unreadCount: number
}
