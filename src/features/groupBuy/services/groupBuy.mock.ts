import { mockDelay } from "@/common/utils/devMock"
import type {
  ContractTerminationRequest,
  GroupBuyDetailResponse,
  GroupBuyHistoryEntry,
  TerminationRequestBody,
} from "@/features/groupBuy/types"

/*
  공구 상세 개발 서버 목업 — `groupBuyService`가 DEV에서만 동적으로 불러온다(배포 번들에 없다).
  모양은 백엔드 main(1021) `GroupBuyDetailResponse` 그대로다: 해지(TERMINATED) · 노출 중지(EXPOSURE_SUSPENDED) ·
  `permissions.canRequestTermination`. 값은 시안 09(글로우 크림 앵콜 공구)에서 옮겼다.
  시나리오 목록은 `groupBuyService.ts` 머리 주석.
*/

/** 이 탭에서 목업으로 보낸 해지 요청 — 새로고침하면 비워진다 */
const requested = new Map<number, ContractTerminationRequest>()

const REASON_LABEL: Record<string, string> = {
  QUALITY_ISSUE: "상품 품질 이슈",
  PRICE_TERMS_ERROR: "가격·조건 오기",
  NEGOTIATION_BROKEN: "인플루언서와 협의 결렬",
  ETC: "기타(직접 입력)",
}

const CONTRACT_ID = 28

function history(
  ...entries: Array<[GroupBuyHistoryEntry["eventType"], string, string?]>
): Array<GroupBuyHistoryEntry> {
  return entries.map(([eventType, occurredAt, actor]) => ({
    eventType,
    actorType:
      actor === "SELLER"
        ? "SELLER"
        : actor === "CREATOR"
          ? "CREATOR"
          : actor === "SYSTEM"
            ? "SYSTEM"
            : "ADMIN",
    actorDisplayName:
      actor === "SELLER"
        ? "○○ 브랜드"
        : actor === "CREATOR"
          ? "글로우_지민"
          : null,
    detail: null,
    occurredAt,
  }))
}

function base(groupBuyId: number): GroupBuyDetailResponse {
  return {
    groupBuy: {
      groupBuyId,
      groupBuyNumber: "GB-20260806-018",
      title: "글로우 크림 앵콜 공구",
      status: "READY",
      statusLabel: "준비완료",
      statusTone: "INFO",
      createdAt: "2026-08-06T05:40:00",
      readyAt: "2026-08-11T06:30:00",
      openedAt: null,
      endedAt: null,
      closeType: null,
      closeTypeLabel: null,
    },
    timeline: {
      startAt: "2026-08-14T01:00:00",
      endAt: "2026-08-21T14:55:00",
      originalEndAt: "2026-08-21T14:55:00",
      totalDays: 8,
      elapsedDays: 0,
      daysUntilStart: 3,
      daysUntilEnd: null,
      startOverdue: false,
    },
    counterparty: { creatorId: 7, name: "글로우_지민", pairThreadId: 501 },
    contract: {
      contractId: CONTRACT_ID,
      contractNumber: "CTR-20260805-028",
      concludedAt: "2026-08-06T05:40:00",
    },
    items: [
      {
        productId: 101,
        productName: "글로우 크림 50ml",
        regularPrice: 34000,
        groupBuyPrice: 27200,
        rewardRate: 12,
        expectedUnitReward: 3264,
        minQuantity: 300,
        options: [
          {
            variantId: 1,
            variantName: "단품",
            salePrice: 27200,
            minQuantity: 200,
          },
          {
            variantId: 2,
            variantName: "2개 세트",
            salePrice: 50000,
            minQuantity: 100,
          },
        ],
      },
      {
        productId: 102,
        productName: "글로우 세럼 30ml",
        regularPrice: 32000,
        groupBuyPrice: 25600,
        rewardRate: 15,
        expectedUnitReward: 3840,
        minQuantity: 200,
        options: [
          {
            variantId: null,
            variantName: null,
            salePrice: 25600,
            minQuantity: 200,
          },
        ],
      },
    ],
    fixedFee: {
      amount: 300000,
      trigger: "POST_REGISTERED",
      triggerLabel: "공구 게시물 등록 후",
      displayText: null,
    },
    contentDuty: { feed: 1, reels: 1, story: 3, dueDate: "2026-08-21" },
    readiness: {
      gates: [
        {
          key: "STOCK_CONFIRMED",
          actorType: "SELLER",
          done: true,
          doneAt: "2026-08-07T01:20:00",
          state: "DONE",
        },
        {
          key: "POST_SUBMITTED",
          actorType: "CREATOR",
          done: true,
          doneAt: "2026-08-08T12:14:00",
          state: "DONE",
        },
        {
          key: "OPEN_APPROVED",
          actorType: "ADMIN",
          done: true,
          doneAt: "2026-08-11T06:30:00",
          state: "DONE",
        },
      ],
    },
    post: {
      status: "SCHEDULED",
      statusLabel: "예약",
      statusTone: "INFO",
      title: "[앵콜] 글로우 크림 다시 왔어요",
      content:
        "제가 3개월 쓰고 재구매한 크림이에요. 이번엔 세럼까지 같이 준비했습니다. 8일간만 진행돼요.",
      submittedAt: "2026-08-08T12:14:00",
      openedAt: null,
      closedAt: null,
      closeReason: null,
      rejectReason: null,
      rejectedAt: null,
      hiddenReason: null,
      hiddenAt: null,
      hiddenDays: null,
    },
    sales: null,
    orderClosure: null,
    extension: {
      status: null,
      days: null,
      reason: null,
      beforeEndAt: null,
      afterEndAt: null,
      requestedAt: null,
      respondedAt: null,
      responseActorType: null,
      rejectReasonCode: null,
      rejectMemo: null,
      maxDays: 22,
      requestCutoffAt: "2026-08-21T02:55:00",
    },
    activeRequest: null,
    lastDecision: null,
    adminSuspension: null,
    closure: null,
    afterEnd: null,
    permissions: {
      canConfirmStock: false,
      canRequestExtension: false,
      canRequestEarlyClose: false,
      canRequestSuspension: false,
      canSubmitAppeal: false,
      canOpenPairThread: true,
      canRequestTermination: true,
    },
    history: history(
      ["OPEN_APPROVED", "2026-08-11T06:30:00"],
      ["POST_SUBMITTED", "2026-08-08T12:14:00", "CREATOR"],
      ["STOCK_CONFIRMED", "2026-08-07T01:20:00", "SELLER"],
      ["CREATED", "2026-08-06T05:40:00", "SELLER"]
    ),
    navigation: null,
  }
}

const SELLING_SALES: GroupBuyDetailResponse["sales"] = {
  basis: "LIVE",
  orderCount: 142,
  amount: 5788800,
  rewardAmount: 741120,
  itemQuantities: [
    { productId: 101, quantity: 130 },
    { productId: 102, quantity: 88 },
  ],
}

function selling(detail: GroupBuyDetailResponse): GroupBuyDetailResponse {
  return {
    ...detail,
    groupBuy: {
      ...detail.groupBuy,
      status: "IN_PROGRESS",
      statusLabel: "진행중",
      statusTone: "SUCCESS",
      openedAt: "2026-08-14T01:00:00",
    },
    timeline: {
      ...detail.timeline,
      elapsedDays: 3,
      daysUntilStart: null,
      daysUntilEnd: 5,
    },
    readiness: null,
    post: {
      ...detail.post,
      status: "EXPOSED",
      statusLabel: "노출중",
      statusTone: "SUCCESS",
      openedAt: "2026-08-14T01:00:00",
    },
    sales: SELLING_SALES,
    orderClosure: {
      totalCount: 142,
      closedCount: 130,
      unclosedCount: 12,
      purchaseConfirmedCount: null,
      refundedCount: null,
    },
    permissions: {
      ...detail.permissions,
      canRequestExtension: true,
      canRequestEarlyClose: true,
      canRequestSuspension: true,
      canRequestTermination: false,
    },
    history: [
      ...history(["OPENED", "2026-08-14T01:00:00", "SYSTEM"]),
      ...detail.history,
    ],
  }
}

function ended(
  detail: GroupBuyDetailResponse,
  early: boolean
): GroupBuyDetailResponse {
  const sold = selling(detail)
  const endedAt = early ? "2026-08-21T14:55:00" : "2026-08-21T14:55:00"
  return {
    ...sold,
    groupBuy: {
      ...sold.groupBuy,
      status: "ENDED",
      statusLabel: "종료",
      statusTone: "INFO",
      endedAt,
      closeType: early ? "EARLY_CLOSED" : "COMPLETED",
      closeTypeLabel: early ? "조기 마감" : "기간 종료",
    },
    timeline: {
      ...sold.timeline,
      endAt: early ? "2026-08-31T14:55:00" : sold.timeline.endAt,
      elapsedDays: 8,
      daysUntilEnd: null,
    },
    post: {
      ...sold.post,
      status: "CLOSED",
      statusLabel: "종료",
      statusTone: "NEUTRAL",
      closedAt: endedAt,
      closeReason: early ? "EARLY_CLOSED" : "COMPLETED",
    },
    sales: null,
    orderClosure: {
      totalCount: 312,
      closedCount: 294,
      unclosedCount: 18,
      purchaseConfirmedCount: null,
      refundedCount: null,
    },
    closure: {
      closeType: early ? "EARLY_CLOSED" : "COMPLETED",
      endedAt,
      source: null,
      requester: null,
      decisionReason: null,
    },
    afterEnd: {
      openIssue: null,
      settlementWatchAt: "2026-09-20T14:55:00",
      settledAt: null,
      settlementId: null,
    },
    permissions: {
      ...sold.permissions,
      canRequestExtension: false,
      canRequestEarlyClose: false,
      canRequestSuspension: false,
    },
    history: [
      ...history([early ? "EARLY_CLOSED" : "ENDED", endedAt, "SYSTEM"]),
      ...sold.history,
    ],
  }
}

/** 해지 요청을 목업으로 보낸 뒤에는 서버 판정대로 버튼을 닫는다 */
function withRequested(detail: GroupBuyDetailResponse): GroupBuyDetailResponse {
  if (!requested.has(detail.contract.contractId)) {
    return detail
  }
  return {
    ...detail,
    permissions: { ...detail.permissions, canRequestTermination: false },
  }
}

export function mockDetail(
  scenario: string,
  groupBuyId: number
): Promise<GroupBuyDetailResponse> {
  const detail = base(groupBuyId)
  switch (scenario) {
    case "gb-preparing":
      return mockDelay(
        withRequested({
          ...detail,
          groupBuy: {
            ...detail.groupBuy,
            status: "PREPARING",
            statusLabel: "준비중",
            statusTone: "NEUTRAL",
            readyAt: null,
          },
          timeline: { ...detail.timeline, daysUntilStart: 8 },
          readiness: {
            gates: [
              {
                key: "STOCK_CONFIRMED",
                actorType: "SELLER",
                done: false,
                doneAt: null,
                state: "ACTION_REQUIRED",
              },
              {
                key: "POST_SUBMITTED",
                actorType: "CREATOR",
                done: false,
                doneAt: null,
                state: "WAITING",
              },
              {
                key: "OPEN_APPROVED",
                actorType: "ADMIN",
                done: false,
                doneAt: null,
                state: "WAITING",
              },
            ],
          },
          post: {
            ...detail.post,
            status: "NOT_WRITTEN",
            statusLabel: "미작성",
            statusTone: "NEUTRAL",
            title: null,
            content: null,
            submittedAt: null,
          },
          permissions: { ...detail.permissions, canConfirmStock: true },
          history: history(["CREATED", "2026-08-06T05:40:00", "SELLER"]),
        })
      )
    case "gb-termination":
      requested.set(CONTRACT_ID, {
        requestId: 9,
        status: "PENDING",
        statusLabel: "처리 대기",
        reasonCode: "NEGOTIATION_BROKEN",
        reasonLabel: REASON_LABEL.NEGOTIATION_BROKEN,
        memo: null,
        requestedAt: "2026-08-12T01:10:00",
        closedAt: null,
      })
      return mockDelay(withRequested(detail))
    case "gb-terminated":
      return mockDelay({
        ...detail,
        groupBuy: {
          ...detail.groupBuy,
          status: "TERMINATED",
          statusLabel: "해지",
          statusTone: "NEUTRAL",
          endedAt: "2026-08-12T05:00:00",
          closeType: "CONTRACT_TERMINATED",
          closeTypeLabel: "계약 해지",
        },
        timeline: { ...detail.timeline, daysUntilStart: null },
        readiness: null,
        post: {
          ...detail.post,
          status: "CLOSED",
          statusLabel: "종료",
          statusTone: "NEUTRAL",
          closedAt: "2026-08-12T05:00:00",
          closeReason: "CONTRACT_TERMINATED",
        },
        orderClosure: {
          totalCount: 0,
          closedCount: 0,
          unclosedCount: 0,
          purchaseConfirmedCount: null,
          refundedCount: null,
        },
        closure: {
          closeType: "CONTRACT_TERMINATED",
          endedAt: "2026-08-12T05:00:00",
          source: null,
          requester: null,
          decisionReason: null,
        },
        afterEnd: {
          openIssue: null,
          settlementWatchAt: null,
          settledAt: null,
          settlementId: null,
        },
        permissions: { ...detail.permissions, canRequestTermination: false },
        history: [
          ...history(["TERMINATED_BY_CONTRACT", "2026-08-12T05:00:00"]),
          ...detail.history,
        ],
      })
    case "gb-selling":
      return mockDelay(selling(detail))
    case "gb-exposure":
    case "gb-exposure-legacy": {
      const sold = selling(detail)
      const legacy = scenario === "gb-exposure-legacy"
      return mockDelay({
        ...sold,
        post: {
          ...sold.post,
          status: legacy ? "HIDDEN" : "EXPOSURE_SUSPENDED",
          statusLabel: legacy ? "숨김" : "노출 중지",
          statusTone: legacy ? "WARNING" : "DANGER",
          hiddenReason: { code: "AD_EFFECT_ASSERTION", detail: null },
          hiddenAt: "2026-08-19T01:20:00",
          hiddenDays: 2,
        },
        permissions: {
          ...sold.permissions,
          canRequestExtension: false,
          canRequestEarlyClose: false,
          canRequestSuspension: false,
        },
        history: [
          ...history(["POST_HIDDEN", "2026-08-19T01:20:00"]),
          ...sold.history,
        ],
      })
    }
    case "gb-notice": {
      const sold = selling(detail)
      return mockDelay({
        ...sold,
        groupBuy: {
          ...sold.groupBuy,
          status: "SUSPENSION_SCHEDULED",
          statusLabel: "중단 예정",
          statusTone: "WARNING",
        },
        adminSuspension: {
          adminSuspensionId: 3,
          kind: "NOTICE",
          status: "NOTICED",
          reasonClause: "ART17_1_LAW",
          emergencyReason: null,
          noticeBody:
            "상품 상세에 「아토피 개선」 표현이 확인되어 의약품 오인 광고에 해당할 소지가 있습니다.",
          noticedAt: "2026-08-16T01:00:00",
          executeScheduledAt: "2026-08-20T01:00:00",
          appealDeadlineAt: "2026-08-19T14:59:00",
          withdrawnAt: null,
          withdrawReason: null,
          executedAt: null,
          appeal: null,
        },
        permissions: {
          ...sold.permissions,
          canRequestExtension: false,
          canRequestEarlyClose: false,
          canRequestSuspension: false,
          canSubmitAppeal: true,
        },
        history: [
          ...history(["SUSPENSION_NOTICED", "2026-08-16T01:00:00"]),
          ...sold.history,
        ],
      })
    }
    case "gb-ended":
      return mockDelay(ended(detail, false))
    case "gb-early":
      return mockDelay(ended(detail, true))
    case "gb-admin-suspended": {
      const sold = selling(detail)
      return mockDelay({
        ...sold,
        groupBuy: {
          ...sold.groupBuy,
          status: "SUSPENDED",
          statusLabel: "중단",
          statusTone: "DANGER",
          endedAt: "2026-08-18T05:05:00",
          closeType: "SUSPENDED",
          closeTypeLabel: "중단",
        },
        timeline: { ...sold.timeline, elapsedDays: 5, daysUntilEnd: null },
        post: {
          ...sold.post,
          status: "CLOSED",
          statusLabel: "종료",
          statusTone: "NEUTRAL",
          closedAt: "2026-08-18T05:05:00",
          closeReason: "SUSPENDED",
        },
        sales: { ...SELLING_SALES!, basis: "AT_SUSPENSION" },
        adminSuspension: {
          adminSuspensionId: 4,
          kind: "EMERGENCY",
          status: "EXECUTED",
          reasonClause: null,
          emergencyReason: "CONSUMER_HARM",
          noticeBody:
            "게시물·상품 상세에 「아토피 개선」 표현이 확인되어 소비자 피해 예방을 위해 판매를 중단했습니다.",
          noticedAt: "2026-08-18T05:05:00",
          executeScheduledAt: null,
          appealDeadlineAt: null,
          withdrawnAt: null,
          withdrawReason: null,
          executedAt: "2026-08-18T05:05:00",
          appeal: null,
        },
        closure: {
          closeType: "SUSPENDED",
          endedAt: "2026-08-18T05:05:00",
          source: "ADMIN_EMERGENCY",
          requester: null,
          decisionReason: null,
        },
        afterEnd: {
          openIssue: null,
          settlementWatchAt: null,
          settledAt: null,
          settlementId: null,
        },
        permissions: {
          ...sold.permissions,
          canRequestExtension: false,
          canRequestEarlyClose: false,
          canRequestSuspension: false,
        },
        history: [
          ...history(["SUSPENDED_EMERGENCY", "2026-08-18T05:05:00"]),
          ...sold.history,
        ],
      })
    }
    case "gb-ready":
    default:
      return mockDelay(withRequested(detail))
  }
}

export function requestTerminationMock(
  contractId: number,
  body: TerminationRequestBody
): Promise<void> {
  requested.set(contractId, {
    requestId: Date.now(),
    status: "PENDING",
    statusLabel: "처리 대기",
    reasonCode: body.reasonCode,
    reasonLabel: REASON_LABEL[body.reasonCode] ?? body.reasonCode,
    memo: body.memo ?? null,
    // 이벤트 시각은 서버처럼 UTC 벽시계로 둔다(`parseServerDateTime`이 KST로 읽는다)
    requestedAt: new Date().toISOString().slice(0, 19),
    closedAt: null,
  })
  return mockDelay(undefined)
}

export function contractTerminationMock(
  contractId: number
): Promise<ContractTerminationRequest | null> {
  return mockDelay(requested.get(contractId) ?? null)
}
