import { apiInstance } from "@/common/lib/apiInstance"
import {
  ApiNotReadyError,
  callOrMock,
  DEV_MOCK_ENABLED,
  mockScenario,
} from "@/common/utils/devMock"
import type { AccountInfoResponse } from "@/features/storeManagement/services/basicInfoService"

/**
 * 브랜드 탈퇴 **신청**(ui-partner-06 4-F ~ 4-I) — 실행은 운영자가 한다(§51-5 · 백엔드 51 설계서).
 *
 * 조회는 따로 없다 — `GET /v1/seller/basic-info/account` 응답의 `withdrawal` 블록이다. 백엔드 main(10-24)에
 * 생긴 필드라 개발 서버가 새 버전으로 배포되기 전에는 응답에 없다(undefined). 그때 배포본은 「준비 중」,
 * 개발 서버는 목업(`withdrawal.mock.ts`)으로 그린다. 신청 · 취소는 `callOrMock`.
 *
 * 개발 서버 목업 시나리오(`?tab=account&mock=…`) — 서버 값이 있어도 목업이 우선한다:
 * - (없음)                       4-F 신청 가능
 * - `withdraw-blocked`           4-G 잔여 건(시안 예시 — 공구 · 계약 삭제/운영팀 문의 · 주문 · 정산 지급 예정/조정 협의)
 * - `withdraw-blocked-more`      4-G 내역 전 갈래(정산 확인 중 · 조정 협의 2건 · 지급 보류 · 분배 실패 · 차감 대기 · 계약 4상태)
 * - `withdraw-suspended`         4-G2 계정 이용 정지로 브랜드 몫 지급 정지(정산 정보 수정하기)
 * - `withdraw-suspended-blocked` 정지 중 신청 불가(서버 설정이 끈 경우 · `suspensionBlockedReason`)
 * - `withdraw-pending`           4-I 운영자 검토 중(로그인 정보 잠금)
 * - `withdraw-rejected`          4-F + 가장 최근 신청 반려 이력
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
  /** 합의 기한 — 서버가 정한 기한(KST 벽시계) */
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
  /** 신청 시각 — 서버 now() 이벤트(UTC 벽시계) */
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
  /** 반려 시각 — 서버 now() 이벤트(UTC 벽시계) */
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

const FEATURE = "브랜드 탈퇴"

/** 지금 화면이 목업으로 그려졌는가 — 목업 화면에서 누른 신청 · 취소를 실서버로 보내지 않기 위해서다 */
let source: "real" | "mock" = "real"

const isWithdrawalScenario = () =>
  mockScenario()?.startsWith("withdraw") ?? false

const loadMock = () => import("./withdrawal.mock")

export const withdrawalService = {
  /** 계정 조회 응답에서 탈퇴 블록을 꺼낸다 — 마켓이 없는 계정은 null(카드를 두지 않는다) */
  getStatus: async (
    account: AccountInfoResponse
  ): Promise<Withdrawal | null> => {
    if (account.withdrawal !== undefined && !isWithdrawalScenario()) {
      source = "real"
      return account.withdrawal
    }
    if (!DEV_MOCK_ENABLED) throw new ApiNotReadyError(FEATURE)
    source = "mock"
    const m = await loadMock()
    return m.getWithdrawalMock(account.loginEmail)
  },

  request: (body: WithdrawalRequestBody) =>
    callOrMock<WithdrawalRequestResponse>(
      `${FEATURE} 신청`,
      async () => {
        if (source === "mock") throw new Error("mock")
        const { data } = await apiInstance.post<WithdrawalRequestResponse>(
          "/seller/basic-info/withdrawal-requests",
          body
        )
        return data
      },
      async () => (await loadMock()).requestWithdrawalMock(body)
    ),

  cancel: (requestId: number) =>
    callOrMock<void>(
      `${FEATURE} 신청 취소`,
      async () => {
        if (source === "mock") throw new Error("mock")
        await apiInstance.post(
          `/seller/basic-info/withdrawal-requests/${requestId}/cancel`
        )
      },
      async () => (await loadMock()).cancelWithdrawalMock()
    ),
}
