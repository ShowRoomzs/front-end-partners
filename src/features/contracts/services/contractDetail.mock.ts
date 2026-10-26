import { mockDelay } from "@/common/utils/devMock"
import type {
  ContractDetailResponse,
  ContractHistoryEntry,
  ContractTerminationRequestBody,
} from "@/features/contracts/types"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"

dayjs.extend(utc)

/*
  개발 서버 전용 — 계약 상세 목업(시안 08 rev.9 B4 · B4b · B5 · B5a · B5b · B9 값).
  서비스(`contractService`)가 `?mock=contract-*`일 때와 해지 요청 · 철회 실호출이 실패했을 때만
  동적 import한다. 배포 번들에는 들어가지 않는다.
*/

/** 시안 시각(KST)을 서버 표기(UTC 벽시계 LocalDateTime)로 바꾼다 — 화면이 UTC → 로컬로 읽는다 */
function at(kst: string) {
  return dayjs(kst).utc().format("YYYY-MM-DDTHH:mm:ss")
}

const BRAND = "○○ 브랜드"
const CREATOR = "글로우_지민"

function history(
  entries: Array<[ContractHistoryEntry["eventType"], string, string?]>
): Array<ContractHistoryEntry> {
  return entries.map(([eventType, time, detail]) => {
    const actorType: ContractHistoryEntry["actorType"] =
      eventType === "CREATOR_SIGNED"
        ? "CREATOR"
        : eventType === "TERMINATED" || eventType === "REVIEW_APPROVED"
          ? "ADMIN"
          : eventType === "ESTABLISHED" ||
              eventType === "SIGNATURE_SENT" ||
              eventType === "CONCLUDED"
            ? "SYSTEM"
            : "SELLER"
    return {
      eventType,
      actorType,
      actorDisplayName:
        actorType === "SELLER"
          ? BRAND
          : actorType === "CREATOR"
            ? CREATOR
            : null,
      detail: detail ?? null,
      occurredAt: at(time),
    }
  })
}

/** B5 체결완료 — 공구 아직 없음 · 고정 지급비 지급 예정 · 해지 요청 가능 */
function concluded(contractId: number): ContractDetailResponse {
  return {
    contractId,
    contractNumber: "CTR-20260805-028",
    title: "글로우 크림 앵콜 공구",
    status: "CONCLUDED",
    statusLabel: "체결완료",
    statusTone: "SUCCESS",
    version: 7,
    sourceContractId: null,
    updatedAt: at("2026-08-05 17:00"),
    concludedAt: at("2026-08-06 14:20"),
    establishedAt: at("2026-08-06 11:02"),
    counterparty: {
      creatorId: 41,
      showroomName: CREATOR,
      connectionId: 12,
      fixed: false,
    },
    period: {
      startAt: at("2026-08-14 10:00"),
      endAt: at("2026-08-21 23:55"),
      days: 8,
    },
    items: [
      {
        contractItemId: 1,
        productId: 101,
        productName: "수분진정 크림 50ml",
        regularPrice: 24000,
        groupBuyPrice: 21000,
        rewardRate: 13,
        unitReward: 2730,
        minQuantity: 150,
        options: [
          {
            contractItemOptionId: 1,
            variantId: 1001,
            variantName: "단품",
            regularPrice: 24000,
            optionExtraPrice: 0,
            salePrice: 21000,
            minQuantity: 150,
          },
        ],
      },
    ],
    fixedFee: {
      amount: 300000,
      trigger: "POST_REGISTERED",
      triggerLabel: "공구 게시물 등록 후",
      triggerDescription: "운영자 오픈 승인 후 게시물이 쇼룸에 노출된 때",
      paymentBusinessDays: null,
      noticeAgreedAt: at("2026-08-05 16:50"),
      paidAt: null,
      obligationAlive: true,
    },
    content: {
      feedCount: 1,
      reelsCount: 2,
      storyCount: 2,
      dueDate: "2026-08-21",
      secondaryUseAllowed: true,
      secondaryUsePeriodType: "FIXED",
      secondaryUseMonths: 6,
      brandPreReview: true,
      note: null,
    },
    review: {
      requestedAt: at("2026-08-05 16:55"),
      approvedAt: at("2026-08-05 17:05"),
      rejectedAt: null,
      rejectReason: null,
    },
    signature: {
      requestedAt: at("2026-08-05 17:10"),
      deadlineAt: at("2026-08-11 23:55"),
      brandSignedAt: at("2026-08-05 17:10"),
      creatorSignedAt: at("2026-08-06 11:02"),
      asOf: at("2026-08-06 12:00"),
      counterpartyViewed: true,
    },
    settlement: {
      platformFeeRate: 2,
      pgFeeRate: null,
      withholdingType: "WITHHOLDING_3_3",
      withholdingLabel: "원천징수 3.3%",
    },
    closure: {
      closedAt: null,
      actorType: null,
      reasonCode: null,
      reasonLabel: null,
      memo: null,
    },
    groupBuy: { groupBuyId: null, groupBuyNumber: null },
    documents: [
      {
        type: "SIGNED_PDF",
        typeLabel: "서명 완료 계약서",
        downloadUrl: "about:blank",
      },
      {
        type: "AUDIT_TRAIL",
        typeLabel: "감사추적인증서",
        downloadUrl: "about:blank",
      },
    ],
    permissions: {
      canEdit: false,
      canDelete: false,
      canRequestReview: false,
      canCancelRequest: false,
      canRequestResend: false,
      canRecordPayment: true,
      canDuplicate: true,
      canRequestTermination: true,
      canWithdrawTermination: false,
      canRecordDraftApproval: true,
    },
    history: history([
      ["CREATED", "2026-08-05 15:30"],
      ["REVIEW_REQUESTED", "2026-08-05 16:55"],
      ["REVIEW_APPROVED", "2026-08-05 17:05"],
      ["SIGNATURE_SENT", "2026-08-05 17:10"],
      ["BRAND_SIGNED", "2026-08-05 17:10"],
      ["CREATOR_SIGNED", "2026-08-06 11:02"],
      ["ESTABLISHED", "2026-08-06 11:02"],
      ["CONCLUDED", "2026-08-06 14:20"],
    ]),
    terminationRequest: null,
    draftApprovals: [],
  }
}

const DRAFT_APPROVALS: ContractDetailResponse["draftApprovals"] = [
  {
    approvalId: 1,
    title: "릴스 1차 초안",
    approvedAt: at("2026-08-12 15:40"),
    approvedByName: BRAND,
    sourceLabel: "연결·소통 스레드에서 확인한 초안",
    threadMessageId: null,
    note: null,
  },
  {
    approvalId: 2,
    title: "피드 초안",
    approvedAt: at("2026-08-13 10:05"),
    approvedByName: BRAND,
    sourceLabel: "연결·소통 스레드에서 확인한 초안",
    threadMessageId: null,
    note: null,
  },
]

function withGroupBuy(detail: ContractDetailResponse): ContractDetailResponse {
  return {
    ...detail,
    groupBuy: { groupBuyId: 18, groupBuyNumber: "GB-20260806-018" },
    draftApprovals: DRAFT_APPROVALS,
    history: [
      ...detail.history,
      ...history([
        ["GROUP_BUY_CREATED", "2026-08-06 14:40"],
        ["DRAFT_APPROVAL_RECORDED", "2026-08-12 15:41", "릴스 1차 초안"],
        ["DRAFT_APPROVAL_RECORDED", "2026-08-13 10:06", "피드 초안"],
      ]),
    ],
  }
}

function signing(contractId: number): ContractDetailResponse {
  const base = concluded(contractId)
  return {
    ...base,
    contractNumber: "CTR-20260813-034",
    title: "여름 수분 세럼 공구",
    status: "SIGNING",
    statusLabel: "서명 진행중",
    statusTone: "INFO",
    concludedAt: null,
    establishedAt: null,
    counterparty: { ...base.counterparty, showroomName: "뷰티_소연" },
    period: {
      startAt: at("2026-08-24 10:00"),
      endAt: at("2026-08-31 23:55"),
      days: 8,
    },
    fixedFee: { ...base.fixedFee, amount: 1200000 },
    review: {
      ...base.review,
      requestedAt: at("2026-08-13 14:50"),
      approvedAt: at("2026-08-13 15:20"),
    },
    signature: {
      requestedAt: at("2026-08-13 16:40"),
      // 기-07 — 공구 시작(08.24) 3일 전 23:55
      deadlineAt: at("2026-08-21 23:55"),
      brandSignedAt: null,
      creatorSignedAt: null,
      asOf: at("2026-08-13 16:40"),
      counterpartyViewed: false,
    },
    documents: [
      {
        type: "GENERATED_DRAFT",
        typeLabel: "계약서 생성본",
        downloadUrl: "about:blank",
      },
    ],
    permissions: {
      ...base.permissions,
      canRecordPayment: false,
      canDuplicate: false,
      canRequestResend: true,
      canRequestTermination: false,
      canRecordDraftApproval: false,
    },
    history: history([
      ["CREATED", "2026-08-13 14:20"],
      ["REVIEW_APPROVED", "2026-08-13 15:20"],
      ["SIGNATURE_SENT", "2026-08-13 16:40"],
    ]),
    draftApprovals: [],
  }
}

function conclusionPending(contractId: number): ContractDetailResponse {
  const base = signing(contractId)
  return {
    ...base,
    status: "CONCLUSION_PENDING",
    // 배포 전 개발 서버가 주는 옛 라벨 — 화면은 「공구 생성 대기」로 덮어써야 한다
    statusLabel: "체결 처리 대기",
    establishedAt: at("2026-08-14 11:40"),
    signature: {
      ...base.signature,
      brandSignedAt: at("2026-08-14 09:12"),
      creatorSignedAt: at("2026-08-14 11:40"),
      asOf: at("2026-08-14 12:00"),
      counterpartyViewed: true,
    },
    permissions: {
      ...base.permissions,
      canRequestResend: false,
      canRequestTermination: true,
    },
    history: [
      ...base.history,
      ...history([
        ["BRAND_SIGNED", "2026-08-14 09:12"],
        ["CREATOR_SIGNED", "2026-08-14 11:40"],
        ["ESTABLISHED", "2026-08-14 11:40"],
      ]),
    ],
  }
}

function pendingRequest(detail: ContractDetailResponse, memo: string | null) {
  const requestedAt = dayjs().utc().format("YYYY-MM-DDTHH:mm:ss")
  return {
    ...detail,
    terminationRequest: {
      requestId: 501,
      status: "PENDING" as const,
      statusLabel: "처리 대기",
      reasonCode: "ETC" as const,
      reasonLabel: "기타",
      memo,
      requestedAt,
      closedAt: null,
    },
    permissions: {
      ...detail.permissions,
      canRequestTermination: false,
      canWithdrawTermination: true,
    },
    history: [
      ...detail.history,
      {
        eventType: "TERMINATION_REQUESTED" as const,
        actorType: "SELLER" as const,
        actorDisplayName: BRAND,
        detail: "기타",
        occurredAt: requestedAt,
      },
    ],
  }
}

function terminated(contractId: number): ContractDetailResponse {
  const base = concluded(contractId)
  return {
    ...base,
    contractNumber: "CTR-20260710-011",
    title: "클렌징 오일 여름 공구",
    status: "TERMINATED",
    statusLabel: "해지",
    statusTone: "NEUTRAL",
    concludedAt: at("2026-07-12 19:00"),
    establishedAt: at("2026-07-12 18:30"),
    counterparty: { ...base.counterparty, showroomName: "뷰티_소연" },
    period: {
      startAt: at("2026-07-20 10:00"),
      endAt: at("2026-07-27 23:55"),
      days: 8,
    },
    items: [
      {
        ...base.items[0],
        productName: "저자극 클렌징 오일 150ml",
        regularPrice: 18000,
        groupBuyPrice: 16200,
        rewardRate: 10,
        unitReward: 1620,
        minQuantity: 200,
        options: [{ ...base.items[0].options[0], minQuantity: 200 }],
      },
    ],
    fixedFee: { ...base.fixedFee, amount: 250000, obligationAlive: false },
    review: {
      ...base.review,
      requestedAt: at("2026-07-10 16:20"),
      approvedAt: at("2026-07-11 10:02"),
    },
    signature: {
      ...base.signature,
      requestedAt: at("2026-07-11 10:05"),
      brandSignedAt: at("2026-07-11 13:00"),
      creatorSignedAt: at("2026-07-12 18:30"),
    },
    closure: {
      closedAt: at("2026-07-18 11:00"),
      actorType: "ADMIN",
      reasonCode: "PARTY_REQUEST_CANNOT_PROCEED",
      reasonLabel: "당사자 요청 — 공구 진행 불가",
      memo: "브랜드 요청과 인플루언서 동의를 운영팀 채널에서 확인했습니다.",
    },
    groupBuy: { groupBuyId: 11, groupBuyNumber: "GB-20260712-011" },
    permissions: {
      ...base.permissions,
      canRecordPayment: false,
      canRequestTermination: false,
    },
    terminationRequest: {
      requestId: 500,
      status: "HANDLED",
      statusLabel: "해지 처리됨",
      reasonCode: "ETC",
      reasonLabel: "기타",
      memo: "원료 입고가 늦어져 오픈일까지 최소 물량을 맞출 수 없습니다. 인플루언서와 스레드에서 협의했고 해지에 동의받았습니다.",
      requestedAt: at("2026-07-16 14:10"),
      closedAt: at("2026-07-18 11:00"),
    },
    history: history([
      ["CREATED", "2026-07-10 15:02"],
      ["REVIEW_APPROVED", "2026-07-11 10:02"],
      ["SIGNATURE_SENT", "2026-07-11 10:05"],
      ["ESTABLISHED", "2026-07-12 18:30"],
      ["TERMINATION_REQUESTED", "2026-07-16 14:10", "기타"],
      ["TERMINATED", "2026-07-18 11:00", "당사자 요청 — 공구 진행 불가"],
    ]),
  }
}

const SCENARIOS: Record<
  string,
  (contractId: number) => ContractDetailResponse
> = {
  "contract-signing": signing,
  "contract-conclusion-pending": conclusionPending,
  "contract-concluded": concluded,
  "contract-termination-pending": id =>
    pendingRequest(
      concluded(id),
      "공급 일정 차질로 오픈 일정을 맞출 수 없습니다."
    ),
  "contract-paid": id => {
    const detail = withGroupBuy(concluded(id))
    return {
      ...detail,
      fixedFee: { ...detail.fixedFee, paidAt: at("2026-08-11 15:31") },
      permissions: {
        ...detail.permissions,
        canRecordPayment: false,
        canRequestTermination: false,
      },
      history: [
        ...detail.history,
        ...history([["FIXED_FEE_PAID", "2026-08-11 15:31"]]),
      ],
    }
  },
  "contract-fee-due": id => withGroupBuy(concluded(id)),
  "contract-terminated": terminated,
}

/** 쓰기 목업이 바꾼 상세 — 재조회(포커스 · 무효화)해도 시나리오 원본으로 되돌아가지 않게 붙잡아 둔다 */
const overrides = new Map<number, ContractDetailResponse>()

export function mockContractDetail(contractId: number, scenario: string) {
  const saved = overrides.get(contractId)
  if (saved) {
    return mockDelay(saved)
  }
  const build = SCENARIOS[scenario] ?? concluded
  return mockDelay(build(contractId))
}

export function mockRequestTermination(
  contractId: number,
  body: ContractTerminationRequestBody,
  current?: ContractDetailResponse
) {
  const next = pendingRequest(
    current ?? overrides.get(contractId) ?? concluded(contractId),
    body.memo
  )
  overrides.set(contractId, next)
  return mockDelay(next)
}

export function mockWithdrawTermination(
  contractId: number,
  current?: ContractDetailResponse
) {
  const base = current ?? overrides.get(contractId) ?? concluded(contractId)
  const now = dayjs().utc().format("YYYY-MM-DDTHH:mm:ss")
  const next: ContractDetailResponse = {
    ...base,
    terminationRequest: base.terminationRequest
      ? {
          ...base.terminationRequest,
          status: "WITHDRAWN",
          statusLabel: "요청 철회",
          closedAt: now,
        }
      : null,
    permissions: {
      ...base.permissions,
      canRequestTermination: true,
      canWithdrawTermination: false,
    },
    history: [
      ...base.history,
      {
        eventType: "TERMINATION_REQUEST_WITHDRAWN",
        actorType: "SELLER",
        actorDisplayName: BRAND,
        detail: null,
        occurredAt: now,
      },
    ],
  }
  overrides.set(contractId, next)
  return mockDelay(next)
}
