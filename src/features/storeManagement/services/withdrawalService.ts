import { apiInstance } from "@/common/lib/apiInstance"
import type { AccountInfoResponse } from "@/features/storeManagement/services/basicInfoService"

/**
 * 브랜드 탈퇴 **신청**(ui-partner-06 4-F ~ 4-I) — 실행은 운영자가 한다(§51-5 · 백엔드 51 설계서).
 *
 * 조회는 따로 없다 — `GET /v1/seller/basic-info/account` 응답의 `withdrawal` 블록이다.
 *
 * ⚠️ `DELETE /v1/seller/auth/withdraw`(즉시 삭제)는 쓰지 않는다 — 셀러는 409 `BRAND_WITHDRAWAL_REQUIRES_REQUEST`다.
 */

export type WithdrawalState = "AVAILABLE" | "BLOCKED" | "PENDING"

/** 조건 행의 이동 대상과 지급 보류 행의 해소 경로 — FE가 라우트로 바꾼다 */
export type WithdrawalTarget =
  | "GROUP_BUYS"
  | "CONTRACTS"
  | "ORDERS"
  | "SETTLEMENTS"
  | "SETTLEMENT_ACCOUNT"
  | "BUSINESS_INFO"

/** 시안의 세 갈래 — 기다리면 풀림 · 내 응답 필요 · 운영팀 문의 */
export type WithdrawalGroup = "WAIT" | "MY_ACTION" | "OPERATOR"

/** 계약 내역 행만 — 검토 요청 취소 · 삭제 · 운영팀 문의 */
export type WithdrawalAction = "CANCEL_REVIEW" | "DELETE" | "CONTACT_OPERATOR"

export interface WithdrawalAdjustmentItem {
  settlementId: number
  settlementNumber: string | null
  /** 정산별 이슈 스레드 */
  threadId: number | null
  /** 합의 기한 — UTC 순간("Z") */
  deadlineAt: string | null
  turn: "MY_TURN" | "THEIR_TURN" | "OPEN_FLOOR" | "CLOSED" | null
}

export interface WithdrawalBreakdown {
  /** 공구 · 계약은 상태 코드 · 주문은 UNCLOSED · 정산은 REVIEWING · ADJUSTING · PAYOUT_SCHEDULED · BLOCKED · FAILED · CLAWBACK_PENDING */
  key: string
  label: string
  count: number
  group: WithdrawalGroup
  groupLabel: string
  action?: WithdrawalAction | null
  /** 기다리면 풀리는 정산 행의 예상일(LocalDate) */
  expectedDate?: string | null
  /** 지급 보류 행만 — `PayoutBlockReason` · 4-G2는 BRAND_SUSPENDED */
  reasonCode?: string | null
  reasonLabel?: string | null
  dueNote?: string | null
  /** 지급 보류 행의 해소 경로 — 운영팀만 풀 수 있으면 null */
  target?: WithdrawalTarget | null
  /** 조정 협의 행만 */
  items?: Array<WithdrawalAdjustmentItem>
}

export interface WithdrawalCondition {
  /** ACTIVE_GROUP_BUYS · CONTRACTS_BEFORE_CONCLUSION · UNCLOSED_ORDERS · UNSETTLED */
  code: string
  label: string
  count: number
  satisfied: boolean
  target: WithdrawalTarget
  /** 0건 행은 오지 않는다 · 합계 = count */
  breakdown: Array<WithdrawalBreakdown>
}

export interface PendingWithdrawal {
  requestId: number
  /** 신청 시각 — UTC 순간("Z") */
  requestedAt: string
  reason: string | null
  /** 미선택이면 「선택하지 않음」 */
  reasonLabel: string
  message: string | null
  requesterName: string
  requesterEmail: string
}

export interface WithdrawalRejection {
  requestId: number
  /** 반려 시각 — UTC 순간("Z") */
  rejectedAt: string
  reasonCode: string
  reasonLabel: string
  note: string | null
}

export interface WithdrawalReasonOption {
  code: string
  label: string
}

/** `SellerBasicInfoDto.Withdrawal` */
export interface Withdrawal {
  state: WithdrawalState
  /** 정지 중 신청 불가(서버 설정이 끈 경우)일 때만 — 그 밖에는 null */
  suspensionBlockedReason: string | null
  satisfiedCount: number
  totalCount: number
  conditions: Array<WithdrawalCondition>
  /** 작성 중인 계약 — 승인 때 함께 삭제된다 · 0이면 줄을 숨긴다 */
  draftContractCount: number
  /** 운영팀 1:1 채널 스레드 — 없으면 null */
  operatorThreadId: number | null
  pendingRequest: PendingWithdrawal | null
  lastRejection: WithdrawalRejection | null
  /** M5 사유 드롭다운의 단일 소스 */
  reasonOptions: Array<WithdrawalReasonOption>
}

/** 사유 · 남기실 말씀 모두 선택 — 고르지 않은 값은 보내지 않는다 */
export interface WithdrawalRequestBody {
  reason?: string
  message?: string
}

export interface WithdrawalRequestResponse {
  requestId: number
  requestedAt: string
}

export const withdrawalService = {
  /** 계정 조회 응답에서 탈퇴 블록을 꺼낸다 — 마켓이 없는 계정은 null(카드를 두지 않는다) */
  getStatus: async (account: AccountInfoResponse): Promise<Withdrawal | null> =>
    account.withdrawal ?? null,

  request: async (body: WithdrawalRequestBody) => {
    const { data } = await apiInstance.post<WithdrawalRequestResponse>(
      "/seller/basic-info/withdrawal-requests",
      body
    )
    return data
  },

  cancel: async (requestId: number) => {
    await apiInstance.post(
      `/seller/basic-info/withdrawal-requests/${requestId}/cancel`
    )
  },
}
