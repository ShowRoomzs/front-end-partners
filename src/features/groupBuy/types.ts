/*
  공구 관리(파트너센터) — 서버 `/v1/seller/group-buys` 응답을 그대로 옮긴 타입.
  근거: back-end `api/seller/groupbuy/dto/*` · `domain/groupbuy/type/*`.

  상태·게시물 배지 문구와 색, 버튼 노출은 서버가 판정해 내려준다(permissions) —
  FE는 조건을 복제하지 않고 값으로 화면을 고른다.
*/

export type GroupBuyTone = "NEUTRAL" | "INFO" | "WARNING" | "SUCCESS" | "DANGER"

/** 공구 상태 7종 */
export type GroupBuyStatus =
  | "PREPARING"
  | "READY"
  | "IN_PROGRESS"
  | "SUSPENSION_SCHEDULED"
  | "ENDED"
  | "SETTLED"
  | "SUSPENDED"

/** 게시물 상태 8종 — 공구 상태와 별 축 */
export type GroupBuyPostStatus =
  | "NOT_WRITTEN"
  | "WRITING"
  | "PENDING_APPROVAL"
  | "REJECTED"
  | "SCHEDULED"
  | "EXPOSED"
  | "HIDDEN"
  | "CLOSED"

export type GroupBuyTab =
  | "ALL"
  | "PREPARING"
  | "READY"
  | "IN_PROGRESS"
  | "ENDED"
  | "SUSPENDED"

export type GroupBuySortType = "START_AT_ASC" | "CREATED_DESC"

export type GroupBuyActorType = "SELLER" | "CREATOR" | "ADMIN" | "SYSTEM"

export type GroupBuyCloseType = "COMPLETED" | "EARLY_CLOSED" | "SUSPENDED"

export type GroupBuyRemarkCode =
  | "ADMIN_SUSPENSION_NOTICED"
  | "SUSPENSION_REQUEST_REVIEWING"
  | "EARLY_CLOSE_REQUEST_REVIEWING"
  | "EXTENSION_PENDING"
  | "SUSPENDED_BY_ADMIN"

export type ChangeRequestType = "SUSPEND" | "EARLY_CLOSE"

export type SuspensionReasonCode =
  | "QUALITY_ISSUE"
  | "PRICE_TERMS_ERROR"
  | "NEGOTIATION_BROKEN"
  | "ETC"

export type EarlyCloseReasonCode = "STOCK_OUT" | "TARGET_REACHED" | "ETC"

export type GroupBuyIssueType =
  | "CONTENT_FULFILLMENT"
  | "TERMS_INTERPRETATION"
  | "SETTLEMENT_AMOUNT"
  | "ETC"

export type FulfillmentResult = "FULFILLED" | "UNFULFILLED"

export type SuspensionReasonClause =
  | "ART17_1_LAW"
  | "ART17_2_IP_DEFECT"
  | "ART17_3_BREACH"
  | "ART17_4_DISPUTE"

export type EmergencySuspensionReason =
  | "CONSUMER_HARM"
  | "AUTHORITY_ORDER"
  | "DAMAGE_SURGE"

export type GroupBuyEventType =
  | "CREATED"
  | "STOCK_CONFIRMED"
  | "POST_SUBMITTED"
  | "OPEN_APPROVED"
  | "OPEN_REJECTED"
  | "READY"
  | "OPENED"
  | "POST_HIDDEN"
  | "POST_UNHIDDEN"
  | "EXTENSION_REQUESTED"
  | "EXTENSION_ACCEPTED"
  | "EXTENSION_REJECTED"
  | "EXTENSION_EXPIRED"
  | "EARLY_CLOSE_REQUESTED"
  | "EARLY_CLOSE_REJECTED"
  | "EARLY_CLOSED"
  | "SUSPENSION_REQUESTED"
  | "SUSPENSION_REJECTED"
  | "SUSPENDED"
  | "SUSPENSION_NOTICED"
  | "APPEAL_SUBMITTED"
  | "SUSPENSION_WITHDRAWN"
  | "SUSPENDED_BY_ADMIN"
  | "SUSPENDED_EMERGENCY"
  | "ENDED"
  | "ISSUE_OPENED"
  | "FULFILLMENT_CONFIRMED"
  | "FULFILLMENT_DISPUTED"
  | "FULFILLMENT_AUTO_CONFIRMED"
  | "FULFILLMENT_AGREED"
  | "FULFILLMENT_RESOLVED"
  | "SALES_FINALIZED"
  | "SETTLED"

// ── 목록 ──────────────────────────────────────────────

export interface GroupBuyListParams {
  tab: GroupBuyTab
  keyword: string
  sort: GroupBuySortType
  page: number
  size: number
}

export interface GroupBuyListItem {
  groupBuyId: number
  groupBuyNumber: string
  title: string
  creatorName: string
  itemCount: number
  startAt: string
  endAt: string
  postStatus: GroupBuyPostStatus
  postStatusLabel: string
  postStatusTone: GroupBuyTone
  status: GroupBuyStatus
  statusLabel: string
  statusTone: GroupBuyTone
  remark: {
    code: GroupBuyRemarkCode
    appealDeadlineAt: string | null
  } | null
}

export interface GroupBuySummaryResponse {
  tabCounts: Record<GroupBuyTab, number>
  actionRequiredCount: number
}

// ── 상세 ──────────────────────────────────────────────

export type GateKey = "STOCK_CONFIRMED" | "POST_SUBMITTED" | "OPEN_APPROVED"
export type GateState = "DONE" | "ACTION_REQUIRED" | "WAITING" | "REJECTED"

export interface GroupBuyGate {
  key: GateKey
  actorType: GroupBuyActorType
  done: boolean
  doneAt: string | null
  state: GateState
}

export interface GroupBuyReason {
  code: string
  detail: string | null
}

export interface FulfillmentCheck {
  result: FulfillmentResult
  reason: string | null
  checkedAt: string
  auto: boolean
}

export interface GroupBuyHistoryEntry {
  eventType: GroupBuyEventType
  actorType: GroupBuyActorType
  actorDisplayName: string | null
  detail: string | null
  occurredAt: string
}

export interface GroupBuyDetailResponse {
  groupBuy: {
    groupBuyId: number
    groupBuyNumber: string
    title: string
    status: GroupBuyStatus
    statusLabel: string
    statusTone: GroupBuyTone
    createdAt: string
    readyAt: string | null
    openedAt: string | null
    endedAt: string | null
    closeType: GroupBuyCloseType | null
    closeTypeLabel: string | null
  }
  timeline: {
    startAt: string
    endAt: string
    originalEndAt: string
    totalDays: number
    elapsedDays: number
    daysUntilStart: number | null
    daysUntilEnd: number | null
    startOverdue: boolean
  }
  counterparty: {
    creatorId: number
    name: string
    pairThreadId: number | null
  }
  contract: {
    contractId: number
    contractNumber: string
    concludedAt: string
  }
  items: Array<{
    productId: number | null
    productName: string
    regularPrice: number | null
    groupBuyPrice: number | null
    rewardRate: number | null
    expectedUnitReward: number | null
    /** 옵션별 최소 물량의 합계 */
    minQuantity: number | null
    /** 옵션별 판매가(공구가 + 옵션가) · 최소 물량 — 옵션 없는 상품은 이름 없는 1행 */
    options: Array<GroupBuyItemOption>
  }>
  fixedFee: {
    amount: number | null
    trigger: string | null
    triggerLabel: string | null
    displayText: string | null
  }
  contentDuty: {
    feed: number | null
    reels: number | null
    story: number | null
    dueDate: string | null
  }
  readiness: { gates: Array<GroupBuyGate> } | null
  post: {
    status: GroupBuyPostStatus
    statusLabel: string
    statusTone: GroupBuyTone
    title: string | null
    content: string | null
    submittedAt: string | null
    openedAt: string | null
    closedAt: string | null
    closeReason: GroupBuyCloseType | null
    rejectReason: GroupBuyReason | null
    /** 마지막 오픈 반려 시각 — rejectReason이 있을 때만 */
    rejectedAt: string | null
    hiddenReason: GroupBuyReason | null
    hiddenAt: string | null
    hiddenDays: number | null
  }
  sales: {
    basis: "LIVE" | "SETTLED" | "AT_SUSPENSION"
    orderCount: number
    amount: number
    rewardAmount: number
    itemQuantities: Array<{ productId: number; quantity: number }>
  } | null
  orderClosure: {
    totalCount: number
    closedCount: number
    unclosedCount: number
    /** 종결 중 구매확정(거절 확정 포함) — 판매 모듈이 모르면 null */
    purchaseConfirmedCount: number | null
    /** 종결 중 환불(결제 후 취소) — 판매 모듈이 모르면 null */
    refundedCount: number | null
  } | null
  extension: {
    status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED" | null
    days: number | null
    reason: string | null
    beforeEndAt: string | null
    afterEndAt: string | null
    requestedAt: string | null
    respondedAt: string | null
    responseActorType: GroupBuyActorType | null
    rejectReasonCode: string | null
    rejectMemo: string | null
    maxDays: number
    requestCutoffAt: string
  }
  activeRequest: {
    changeRequestId: number
    type: ChangeRequestType
    requesterType: GroupBuyActorType
    requesterName: string
    reasonCode: string
    reasonLabel: string | null
    memo: string | null
    statusAtRequest: GroupBuyStatus
    requestedAt: string
  } | null
  lastDecision: {
    changeRequestId: number
    type: ChangeRequestType
    requesterType: GroupBuyActorType
    result: "APPROVED" | "REJECTED"
    decisionReason: string | null
    decidedAt: string | null
  } | null
  adminSuspension: {
    adminSuspensionId: number
    kind: "NOTICE" | "EMERGENCY"
    status: "NOTICED" | "WITHDRAWN" | "EXECUTED" | "LAPSED" | "SUPERSEDED"
    reasonClause: SuspensionReasonClause | null
    emergencyReason: EmergencySuspensionReason | null
    noticeBody: string
    noticedAt: string
    executeScheduledAt: string | null
    appealDeadlineAt: string | null
    withdrawnAt: string | null
    withdrawReason: string | null
    executedAt: string | null
    appeal: {
      content: string
      submittedAt: string
      attachments: Array<{
        attachmentId: number
        originalName: string
        contentType: string
        sizeBytes: number
      }>
    } | null
  } | null
  closure: {
    closeType: GroupBuyCloseType
    endedAt: string
    source: "REQUEST" | "ADMIN_NOTICE" | "ADMIN_EMERGENCY" | null
    requester: {
      type: GroupBuyActorType
      name: string
      reasonCode: string
      reasonLabel: string | null
      memo: string | null
      requestedAt: string
    } | null
    decisionReason: string | null
  } | null
  afterEnd: {
    fulfillment: {
      mine: FulfillmentCheck | null
      theirs: FulfillmentCheck | null
      dueAt: string | null
      /** 기한까지 답하지 않으면 이행으로 처리되는가 — false면 「놔두면 이행」 문구를 쓰지 않는다 */
      autoConfirmOnTimeout: boolean
      onHold: boolean
      threadId: number | null
      resolvedAt: string | null
    } | null
    openIssue: {
      issueId: number
      type: GroupBuyIssueType
      openedAt: string
      threadId: number | null
    } | null
    settlementWatchAt: string | null
    settledAt: string | null
  } | null
  permissions: {
    canConfirmStock: boolean
    canRequestExtension: boolean
    canRequestEarlyClose: boolean
    canRequestSuspension: boolean
    canSubmitAppeal: boolean
    canOpenIssue: boolean
    canCheckFulfillment: boolean
    canOpenPairThread: boolean
  }
  history: Array<GroupBuyHistoryEntry>
  /** 목록 이웃 — 상세 조회에 목록 조건(tab·keyword·sort)을 보낼 때만. 실행 API 응답은 둘 다 null */
  navigation: {
    prevGroupBuyId: number | null
    nextGroupBuyId: number | null
  } | null
}

export interface GroupBuyItemOption {
  variantId: number | null
  variantName: string | null
  /** 옵션 판매가 = 공구가 + 옵션가 */
  salePrice: number | null
  minQuantity: number | null
}

/** 상세 조회에 함께 보내는 목록 조건 — 서버가 이 범위로 이전/다음 공구를 계산한다 */
export interface DetailNavParams {
  tab?: string
  keyword?: string
  sort?: string
}

// ── 실행 요청 ─────────────────────────────────────────

export interface ExtensionRequestBody {
  extensionDays: number
  reason?: string
}

export interface EarlyCloseRequestBody {
  reasonCode: EarlyCloseReasonCode
  memo?: string
}

export interface SuspensionRequestBody {
  reasonCode: SuspensionReasonCode
  memo?: string
}

export interface AppealAttachmentPresignBody {
  fileName: string
  contentType: string
  sizeBytes: number
}

export interface AppealAttachmentPresignResponse {
  attachmentId: number
  uploadUrl: string
  contentType: string
  expiresAt: string
}

export interface AppealSubmitBody {
  content: string
  attachmentIds: Array<number>
}

export interface IssueOpenBody {
  issueType: GroupBuyIssueType
  content: string
}

export interface IssueOpenResponse {
  issueId: number
  threadId: number
}

export interface FulfillmentCheckBody {
  result: FulfillmentResult
  reason?: string
}
