import DetailCard, { FieldRow } from "@/common/components/DetailCard/DetailCard"
import { formatDateTimeShort } from "@/common/utils/formatDate"
import type { ContractDetailResponse } from "@/features/contracts/types"
import type { ContractViewState } from "@/features/contracts/utils/contractView"

interface ClosureReasonCardProps {
  detail: ContractDetailResponse
  view: ContractViewState
  brandName: string
}

/**
 * 종결 사유 카드 — 거절(B6)은 상대가 입력한 사유·메모, 취소(B8)는 어드민이 기록한 사유·설명,
 * 해지(B9)는 브랜드가 보낸 해지 요청의 사유·메모(요청 없이 운영자가 직권 해지했으면 운영자 기록).
 * 만료는 사유가 없어 카드를 그리지 않는다(그 공백은 서명 카드의 열람 기록으로 메운다).
 */
export default function ClosureReasonCard(props: ClosureReasonCardProps) {
  const { detail, view, brandName } = props
  const { closure, counterparty } = detail

  if (view === "terminated") {
    const request = detail.terminationRequest
    return (
      <DetailCard
        title="해지 사유"
        note={
          request
            ? `${brandName} 요청 · ${formatDateTimeShort(request.requestedAt)}`
            : `어드민 · ${formatDateTimeShort(closure.closedAt)}`
        }
      >
        <FieldRow label="사유 구분">
          {(request ? request.reasonLabel : closure.reasonLabel) ?? "—"}
        </FieldRow>
        <FieldRow label="메모">
          <MemoText memo={request ? request.memo : closure.memo} />
        </FieldRow>
      </DetailCard>
    )
  }

  if (view !== "declined" && view !== "canceled") {
    return null
  }

  // 시안 B8 rev.9 「어드민 기록 · 일시」 — 취소 사유는 어드민이 기록한 값이다(기-06)
  const actor =
    view === "declined"
      ? (counterparty.showroomName ?? "인플루언서")
      : "어드민 기록"

  return (
    <DetailCard
      title={view === "declined" ? "거절 사유" : "취소 사유"}
      note={`${actor} · ${formatDateTimeShort(closure.closedAt)}`}
    >
      <FieldRow label="사유 구분">
        {closure.reasonLabel ?? closure.reasonCode ?? "—"}
      </FieldRow>
      <FieldRow label={view === "declined" ? "상대 메모" : "메모"}>
        <MemoText memo={closure.memo} />
      </FieldRow>
    </DetailCard>
  )
}

function MemoText(props: { memo: string | null }) {
  return props.memo ? (
    <span className="whitespace-pre-line">{props.memo}</span>
  ) : (
    <span className="text-sz-n-500">없음</span>
  )
}
