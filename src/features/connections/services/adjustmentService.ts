import { apiInstance } from "@/common/lib/apiInstance"
import { callOrMock, DEV_MOCK_ENABLED } from "@/common/utils/devMock"
import type {
  AdjustmentStatus,
  AdjustmentTone,
  AdjustmentTurn,
  SettlementParty,
} from "@/features/connections/services/threadService"

/** 제안 상태 — 백엔드 `ProposalStatus` */
export type ProposalStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "COUNTERED"
  | "CLOSED"

export interface AdjustmentProposal {
  proposalId: number
  seq: number
  proposerType: SettlementParty
  proposerName: string
  rewardAmount: number
  /** 원래 리워드 대비 — 양수 증액 · 음수 감액 */
  deltaAmount: number
  reason: string | null
  status: ProposalStatus
  proposedAt: string
  respondedAt: string | null
  cardMessageId: number | null
}

/** 버튼 권한 — 서버가 판정한다(화면은 식을 들지 않는다) */
export interface AdjustmentPermissions {
  canAccept: boolean
  canReject: boolean
  canCounter: boolean
  /** 메시지 전송 — 종결이면 false */
  canSend: boolean
  /**
   * [요청 철회](기-14) — 처음 요청한 쪽 ∧ 최신 제안이 내 것 ∧ 응답 대기. 1021 백엔드에서 생긴 값이라
   * 아직 배포되지 않은 서버는 내려 주지 않는다 → 없으면 버튼을 두지 않는다.
   */
  canWithdraw?: boolean
}

/** `GET /seller/threads/{threadId}/adjustment` — 고정 카드 + 제안 목록 + 내 권한(뷰어 기준) */
export interface AdjustmentView {
  adjustmentId: number
  threadId: number
  status: AdjustmentStatus
  statusLabel: string
  turn: AdjustmentTurn
  turnLabel: string
  turnTone: AdjustmentTone
  settlement: { settlementId: number; settlementNumber: string }
  groupBuy: { groupBuyId: number; groupBuyNumber: string; title: string }
  counterpart: { type: SettlementParty; name: string }
  /** 처음 요청한 쪽 */
  requesterType: SettlementParty
  originalRewardAmount: number
  /** 조정 상한 — 「조정 후 브랜드 수취액 ≥ 0」 */
  maxRewardAmount: number
  latestProposal: AdjustmentProposal
  agreedRewardAmount: number | null
  finalRewardAmount: number | null
  openedAt: string
  deadlineAt: string
  /** D-N — 종결 뒤 null */
  remainingBusinessDays: number | null
  closedAt: string | null
  permissions: AdjustmentPermissions
  /** seq 오름차순 전량 */
  proposals: Array<AdjustmentProposal>
}

/** 다른 금액 제안 — 사유는 선택 */
export interface AdjustmentCounterBody {
  rewardAmount: number
  reason?: string
}

/**
 * 정산 조정 협의(44 이슈 스레드 설계서 3-1 · 1021 기-14 철회) — 스레드 화면 쪽.
 * 요청 · 미리보기는 정산 관리(`settlementService`)가 쓴다.
 * 응답 · 철회 모두 갱신된 고정 카드 · 제안 목록 전체를 돌려준다.
 */
export const adjustmentService = {
  getByThread: async (threadId: number) => {
    const { data } = await apiInstance.get<AdjustmentView>(
      `/seller/threads/${threadId}/adjustment`
    )
    if (DEV_MOCK_ENABLED) {
      // 개발 서버: 철회 권한을 목업으로 채우고, 목업으로 철회한 건은 폴링이 다시 읽어도 철회 상태로 남긴다
      const { applyMockWithdrawal } = await import("./adjustment.mock")
      return applyMockWithdrawal(data)
    }
    return data
  },

  /** [요청 철회] — 409 `SETTLEMENT_ADJUSTMENT_WITHDRAW_NOT_ALLOWED`(그사이 상대가 응답함)는 인터셉터가 알린다 */
  withdraw: (view: AdjustmentView) =>
    callOrMock(
      "정산 조정 요청 철회",
      async () => {
        const { data } = await apiInstance.post<AdjustmentView>(
          `/seller/settlement-adjustments/${view.adjustmentId}/withdraw`
        )
        return data
      },
      async () => {
        const { withdrawMock } = await import("./adjustment.mock")
        return withdrawMock(view)
      }
    ),

  counter: async (adjustmentId: number, body: AdjustmentCounterBody) => {
    const { data } = await apiInstance.post<AdjustmentView>(
      `/seller/settlement-adjustments/${adjustmentId}/proposals`,
      body
    )
    return data
  },

  accept: async (adjustmentId: number, proposalId: number) => {
    const { data } = await apiInstance.post<AdjustmentView>(
      `/seller/settlement-adjustments/${adjustmentId}/proposals/${proposalId}/accept`
    )
    return data
  },

  reject: async (adjustmentId: number, proposalId: number) => {
    const { data } = await apiInstance.post<AdjustmentView>(
      `/seller/settlement-adjustments/${adjustmentId}/proposals/${proposalId}/reject`
    )
    return data
  },
}
