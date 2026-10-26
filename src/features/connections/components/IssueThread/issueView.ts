import type { StatusBadgeVariant } from "@/common/components/StatusBadge/StatusBadge"
import {
  PARTY_LABEL,
  VIEWER_PARTY,
} from "@/features/connections/constants/params"
import type { AdjustmentView } from "@/features/connections/services/adjustmentService"
import type {
  AdjustmentStatus,
  AdjustmentTone,
  SettlementParty,
  ThreadAdjustmentBadge,
} from "@/features/connections/services/threadService"
import { formatDateTime } from "@/features/connections/utils/format"

/** 서버 톤 → 배지 색. 상태색 규칙: 내 응답 필요=경고 · 상대 응답 대기=정보 · 합의 완료=성공 · 기한 만료=중립 */
export const TONE_VARIANT: Record<AdjustmentTone, StatusBadgeVariant> = {
  INFO: "info",
  SUCCESS: "success",
  WARNING: "warning",
  DANGER: "danger",
  NEUTRAL: "neutral",
}

export const isClosedStatus = (status: AdjustmentStatus) => status !== "OPEN"

export const otherParty = (party: SettlementParty): SettlementParty =>
  party === "SELLER" ? "CREATOR" : "SELLER"

/** 상대 호칭 — 파트너센터에서는 「인플루언서」 */
export const COUNTERPART_LABEL = PARTY_LABEL[otherParty(VIEWER_PARTY)]

/**
 * 고정 카드 우측 배지 — 시안은 서버 차례 문구보다 짧게 쓴다(「상대 응답 대기」 → 「응답 대기」).
 * 종결은 결과로 적는다(합의 완료 · 기한 만료).
 */
export function pinBadge(view: AdjustmentView): {
  label: string
  variant: StatusBadgeVariant
} {
  if (view.status === "AGREED")
    return { label: "합의 완료", variant: "success" }
  if (view.status === "EXPIRED")
    return { label: "기한 만료", variant: "neutral" }
  if (view.status === "WITHDRAWN")
    return { label: "요청 철회", variant: "neutral" }
  return {
    label: view.turn === "THEIR_TURN" ? "응답 대기" : view.turnLabel,
    variant: TONE_VARIANT[view.turnTone],
  }
}

/** 스레드 머리 둘째 줄 — 「이슈 진행 중 · 내 응답 필요」 · 「이슈 종결 · 2026.09.03 10:05」 */
export function headStatus(
  status: AdjustmentStatus,
  turnLabel: string,
  closedAt: string | null
) {
  if (isClosedStatus(status)) {
    return closedAt ? `이슈 종결 · ${formatDateTime(closedAt)}` : "이슈 종결"
  }
  return `이슈 진행 중 · ${turnLabel}`
}

/**
 * 목록 줄 미리보기 — 「[이슈] 정산 조정 요청 · 내 응답 필요」. 종결은 결과로 적는다
 * (「[이슈] 합의 완료 · 금액 변경」 · 「[이슈] 합의 기한 경과 · 원래 금액」).
 */
export function issueListPreview(badge: ThreadAdjustmentBadge | null) {
  if (!badge) return "[이슈] 정산 조정 요청"
  if (badge.status === "AGREED") return "[이슈] 합의 완료 · 금액 변경"
  if (badge.status === "EXPIRED") return "[이슈] 합의 기한 경과 · 원래 금액"
  if (badge.status === "WITHDRAWN") return "[이슈] 요청 철회 · 원래 금액"
  return `[이슈] 정산 조정 요청 · ${badge.turnLabel}`
}

/** 몇 번째 제안인가 — 첫 제안은 「요청」, 그 뒤는 「제안」 */
export const proposalNoun = (seq: number | undefined) =>
  seq === undefined || seq === 1 ? "요청" : "제안"
