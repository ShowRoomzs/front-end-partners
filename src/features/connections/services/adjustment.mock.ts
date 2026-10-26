import { mockDelay } from "@/common/utils/devMock"
import type { AdjustmentView } from "@/features/connections/services/adjustmentService"

/*
  정산 조정 [요청 철회](기-14) 개발 서버 목업 — `adjustmentService`가 DEV에서만 동적으로 불러온다.
  모양은 백엔드 main(1021) 그대로다: status WITHDRAWN · 원래 금액 확정 · 종결 · 응답 버튼 없음 · 입력 잠금.
*/

/** 이 탭에서 목업으로 철회한 협의 — 새로고침하면 비워진다 */
const withdrawn = new Map<number, string>()

function toWithdrawn(view: AdjustmentView, closedAt: string): AdjustmentView {
  return {
    ...view,
    status: "WITHDRAWN",
    statusLabel: "철회 · 원래 금액",
    turn: "CLOSED",
    turnLabel: "종결",
    turnTone: "NEUTRAL",
    finalRewardAmount: view.originalRewardAmount,
    remainingBusinessDays: null,
    closedAt,
    permissions: {
      canAccept: false,
      canReject: false,
      canCounter: false,
      canSend: false,
      canWithdraw: false,
    },
    latestProposal: { ...view.latestProposal, status: "CLOSED" },
    proposals: view.proposals.map(proposal =>
      proposal.proposalId === view.latestProposal.proposalId
        ? { ...proposal, status: "CLOSED" }
        : proposal
    ),
  }
}

/** 서버 판정식(1021 기-14) — 처음 요청한 쪽 ∧ 최신 제안이 내 것 ∧ 응답 대기 */
function withMockPermission(view: AdjustmentView): AdjustmentView {
  if (view.permissions.canWithdraw !== undefined) return view
  const canWithdraw =
    view.status === "OPEN" &&
    view.requesterType === "SELLER" &&
    view.latestProposal.proposerType === "SELLER" &&
    view.latestProposal.status === "PENDING"
  return { ...view, permissions: { ...view.permissions, canWithdraw } }
}

export function applyMockWithdrawal(view: AdjustmentView): AdjustmentView {
  const closedAt = withdrawn.get(view.adjustmentId)
  return closedAt ? toWithdrawn(view, closedAt) : withMockPermission(view)
}

export function withdrawMock(view: AdjustmentView): Promise<AdjustmentView> {
  // 이벤트 시각은 서버처럼 UTC 벽시계로 둔다(parseServerDateTime이 로컬로 바꾼다)
  const closedAt = new Date().toISOString().slice(0, 19)
  withdrawn.set(view.adjustmentId, closedAt)
  return mockDelay(toWithdrawn(view, closedAt))
}
