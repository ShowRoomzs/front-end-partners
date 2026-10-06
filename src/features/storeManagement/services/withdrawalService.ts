import {
  ApiNotReadyError,
  DEV_MOCK_ENABLED,
  mockDelay,
  mockScenario,
} from "@/common/utils/devMock"

/**
 * 브랜드 탈퇴 **신청**(ui-partner-06 4-F~4-I) — 실행은 운영자가 한다.
 *
 * ⚠️ 백엔드에 신청·취소·조건 조회 API가 없다. 있는 건 `DELETE /v1/seller/auth/withdraw`(즉시
 * 하드 삭제)뿐인데, 시안은 「브랜드가 직접 실행하지 못한다 — 신청 후 운영자가 처리」라서 그 API는
 * **쓰지 않는다**(배송·정산 의무가 주인 없이 남는다). 개발 서버에서만 아래 목업으로 동작한다.
 *
 * 시나리오(개발 서버, `?tab=account&mock=…`): 기본 = 4-F 신청 가능 · `withdraw-blocked` = 4-G
 * 잔여 건 있음 · `withdraw-pending` = 4-I 검토 중.
 */

export const WITHDRAWAL_CONDITION_KEYS = [
  "GROUP_BUY",
  "CONTRACT",
  "ORDER",
  "SETTLEMENT",
] as const

export type WithdrawalConditionKey = (typeof WITHDRAWAL_CONDITION_KEYS)[number]

export interface WithdrawalCondition {
  key: WithdrawalConditionKey
  met: boolean
  /** 남은 건수(공구·계약·주문) — 미정산 잔액은 `remainingAmount` */
  remainingCount: number
  remainingAmount: number
}

export const WITHDRAWAL_REASONS = [
  { value: "BUSINESS_CLOSED", label: "사업 종료" },
  { value: "LOW_PERFORMANCE", label: "공구 성과가 기대에 못 미침" },
  { value: "OPERATION_BURDEN", label: "운영 부담(배송·CS)" },
  { value: "OTHER_CHANNEL", label: "다른 채널에 집중" },
  { value: "OTHER", label: "기타" },
] as const

export type WithdrawalReason = (typeof WITHDRAWAL_REASONS)[number]["value"]

export interface WithdrawalRequest {
  requestedAt: string
  reason: WithdrawalReason | null
  memo: string
  requesterEmail: string
}

export interface WithdrawalStatus {
  conditions: Array<WithdrawalCondition>
  /** 운영자 검토 중인 신청 — 없으면 null */
  pendingRequest: WithdrawalRequest | null
}

export interface WithdrawalRequestBody {
  reason: WithdrawalReason | null
  memo: string
}

const allMet = (): Array<WithdrawalCondition> =>
  WITHDRAWAL_CONDITION_KEYS.map(key => ({
    key,
    met: true,
    remainingCount: 0,
    remainingAmount: 0,
  }))

/** 시안 4-G 예시 값 */
const blocked = (): Array<WithdrawalCondition> => [
  { key: "GROUP_BUY", met: false, remainingCount: 2, remainingAmount: 0 },
  { key: "CONTRACT", met: false, remainingCount: 1, remainingAmount: 0 },
  { key: "ORDER", met: false, remainingCount: 18, remainingAmount: 0 },
  {
    key: "SETTLEMENT",
    met: false,
    remainingCount: 0,
    remainingAmount: 8_022_000,
  },
]

let mockPending: WithdrawalRequest | null | undefined

function initialPending(email: string): WithdrawalRequest | null {
  if (mockScenario() !== "withdraw-pending") return null
  return {
    // 시간대 없는 값은 UTC로 읽힌다(parseServerDateTime) — 화면에는 시안대로 14:20(KST)
    requestedAt: "2026-09-01T05:20:00",
    reason: "BUSINESS_CLOSED",
    memo: "",
    requesterEmail: email,
  }
}

export const withdrawalService = {
  getStatus: async (email: string): Promise<WithdrawalStatus> => {
    if (!DEV_MOCK_ENABLED) throw new ApiNotReadyError("브랜드 탈퇴")
    if (mockPending === undefined) mockPending = initialPending(email)
    return mockDelay({
      conditions: mockScenario() === "withdraw-blocked" ? blocked() : allMet(),
      pendingRequest: mockPending,
    })
  },

  request: async (
    body: WithdrawalRequestBody,
    email: string
  ): Promise<void> => {
    if (!DEV_MOCK_ENABLED) throw new ApiNotReadyError("브랜드 탈퇴")
    mockPending = {
      requestedAt: new Date().toISOString(),
      reason: body.reason,
      memo: body.memo,
      requesterEmail: email,
    }
    await mockDelay(null)
  },

  cancel: async (): Promise<void> => {
    if (!DEV_MOCK_ENABLED) throw new ApiNotReadyError("브랜드 탈퇴")
    mockPending = null
    await mockDelay(null)
  },
}
