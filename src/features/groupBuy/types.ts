/*
  공구 관리(파트너센터) — 서버 `/v1/seller/group-buys` 응답을 그대로 옮긴 타입.
  근거: back-end `api/seller/groupbuy/dto/*` · `domain/groupbuy/type/*`.

  상태·게시물 배지 문구와 색, 버튼 노출은 서버가 판정해 내려준다(permissions) —
  FE는 조건을 복제하지 않고 값으로 화면을 고른다.
*/

import type { SanctionHoldView } from "@/features/suspension"

export type GroupBuyTone = "NEUTRAL" | "INFO" | "WARNING" | "SUCCESS" | "DANGER"

/** 공구 상태 8종 — TERMINATED(해지)는 1021 기-05로 생겼다(오픈 전 계약 해지로 종결 · 주문 없음) */
export type GroupBuyStatus =
  | "PREPARING"
  | "READY"
  | "IN_PROGRESS"
  | "SUSPENSION_SCHEDULED"
  | "ENDED"
  | "SETTLED"
  | "SUSPENDED"
  | "TERMINATED"

/**
 * 게시물 상태 8종 — 공구 상태와 별 축.
 * 운영자 노출 중지는 1021 기-08로 `HIDDEN("숨김")` → `EXPOSURE_SUSPENDED("노출 중지")`가 됐다.
 * 아직 배포되지 않은 서버는 옛 값을 내리므로 둘 다 받는다(`isExposureSuspended`).
 */
export type GroupBuyPostStatus =
  | "NOT_WRITTEN"
  | "WRITING"
  | "PENDING_APPROVAL"
  | "REJECTED"
  | "SCHEDULED"
  | "EXPOSED"
  | "EXPOSURE_SUSPENDED"
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

export type GroupBuyCloseType =
  | "COMPLETED"
  | "EARLY_CLOSED"
  | "SUSPENDED"
  | "CONTRACT_TERMINATED"

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
  | "TERMINATED_BY_CONTRACT"
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
  /**
   * 정지 보류 보조 배지(1017 설계서 8-5) — 오픈 전 공구만 · 내 정지 경고 / 상대 사정 중립.
   * main 필드라 배포 전 개발 서버는 내리지 않는다(undefined → 배지 없음).
   */
  sanctionHold?: SanctionHoldView | null
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
  /*
    rev.5(10-06) 이행 확인 · 이슈 직접 개설 폐기 — 서버는 `afterEnd.fulfillment`(항상 null) ·
    `permissions.canOpenIssue` · `canCheckFulfillment`(항상 false)를 deprecated로 아직 내리지만 쓰지 않는다.
    `openIssue`는 폐기 전에 열린 행이 있으면 그대로 내려와 조회만 한다.
  */
  afterEnd: {
    openIssue: {
      issueId: number
      type: GroupBuyIssueType
      /** 개설 측 — SELLER · CREATOR · ADMIN */
      openerType: GroupBuyActorType
      openedAt: string
      threadId: number | null
      /** 답변 대기 — 스레드의 마지막 글을 개설 측이 썼으면 true. 스레드나 글이 없으면 null */
      awaitingReply: boolean | null
    } | null
    /** 종료 + 지연 감시 일수(서버 설정 · 기본 30일) — ENDED에서만 */
    settlementWatchAt: string | null
    settledAt: string | null
    /** 정산 상세(13)로 가는 id — 정산이 생기기 전이면 null */
    settlementId?: number | null
  } | null
  permissions: {
    canConfirmStock: boolean
    canRequestExtension: boolean
    canRequestEarlyClose: boolean
    canRequestSuspension: boolean
    canSubmitAppeal: boolean
    canOpenPairThread: boolean
    /**
     * [해지 요청](B3 · C4 · 1021 기-05) — 준비중 · 준비완료 ∧ 계약 해지 요청 없음. 실행은 계약 API.
     * 아직 배포되지 않은 서버는 내리지 않는다(undefined → 버튼 없음).
     */
    canRequestTermination?: boolean
  }
  history: Array<GroupBuyHistoryEntry>
  /** 목록 이웃 — 상세 조회에 목록 조건(tab·keyword·sort)을 보낼 때만. 실행 API 응답은 둘 다 null */
  navigation: {
    prevGroupBuyId: number | null
    nextGroupBuyId: number | null
  } | null
  /** 정지 보류 보조 배지 — 목록과 같다(main 필드 · 없으면 배지 없음) */
  sanctionHold?: SanctionHoldView | null
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

/**
 * 해지 요청 — back-end `ContractTerminationRequestRequest`(사유는 공구 중단 요청과 같은 4종 · ETC면 memo 필수).
 * `POST /v1/seller/contracts/{contractId}/termination-request` · 응답은 계약 상세라 공구 상세는 다시 읽는다.
 */
export interface TerminationRequestBody {
  reasonCode: SuspensionReasonCode
  memo?: string
}

/** 계약 상세 `terminationRequest` — 공구 상세에는 해지 요청 블록이 없어 계약 상세에서 읽는다 */
export interface ContractTerminationRequest {
  requestId: number
  /** PENDING(처리 대기) · HANDLED(해지 처리됨) · WITHDRAWN(요청 철회) · LAPSED(공구 오픈으로 닫힘) */
  status: "PENDING" | "HANDLED" | "WITHDRAWN" | "LAPSED"
  statusLabel: string
  reasonCode: string
  reasonLabel: string
  memo: string | null
  requestedAt: string
  closedAt: string | null
}
