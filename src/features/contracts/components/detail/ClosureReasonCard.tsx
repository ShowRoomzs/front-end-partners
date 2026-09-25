import DetailCard, { FieldRow } from "@/common/components/DetailCard/DetailCard"
import { formatDateTimeShort } from "@/common/utils/formatDate"
import type { ContractDetailResponse } from "@/features/contracts/types"
import type { ContractViewState } from "@/features/contracts/utils/contractView"

interface ClosureReasonCardProps {
  detail: ContractDetailResponse
  view: ContractViewState
}

/**
 * 종결 사유 카드 — 거절(B6)은 상대가 입력한 사유·메모, 취소(B8)는 어드민이 기록한 사유·설명.
 * 만료는 사유가 없어 카드를 그리지 않는다(그 공백은 서명 카드의 열람 기록으로 메운다).
 */
export default function ClosureReasonCard(props: ClosureReasonCardProps) {
  const { detail, view } = props
  const { closure, counterparty } = detail

  if (view !== "declined" && view !== "canceled") {
    return null
  }

  const actor =
    view === "declined" ? (counterparty.showroomName ?? "인플루언서") : "어드민"

  return (
    <DetailCard
      title={view === "declined" ? "거절 사유" : "취소 사유"}
      note={`${actor} · ${formatDateTimeShort(closure.closedAt)}`}
    >
      <FieldRow label="사유 구분">
        {closure.reasonLabel ?? closure.reasonCode ?? "—"}
      </FieldRow>
      <FieldRow label={view === "declined" ? "상대 메모" : "메모"}>
        {closure.memo ? (
          <span className="whitespace-pre-line">{closure.memo}</span>
        ) : (
          <span className="text-sz-n-500">없음</span>
        )}
      </FieldRow>
    </DetailCard>
  )
}
