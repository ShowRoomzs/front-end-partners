import DetailCard, { FieldRow } from "@/common/components/DetailCard/DetailCard"
import { formatDateTimeShort } from "@/common/utils/formatDate"
import {
  FSUB_CLASS,
  HINT_CLASS,
} from "@/features/contracts/components/shared/styles"
import type { ContractDraftApproval } from "@/features/contracts/types"

interface DraftApprovalsCardProps {
  approvals: Array<ContractDraftApproval>
}

/**
 * 시안 B5 · B5a · B5b 「초안 승인 기록」(기-30) — 운영자 검토 승인과 다른 것으로, 인플루언서 콘텐츠 초안을
 * 브랜드가 승인한 일시와 대상을 남긴 기록이다. 기록 전용이라 효력을 말하지 않는다.
 */
export default function DraftApprovalsCard(props: DraftApprovalsCardProps) {
  const { approvals } = props

  return (
    <DetailCard title="초안 승인 기록" note="브랜드 사전 검수 · 기록 전용">
      <div>
        {approvals.length === 0 ? (
          <FieldRow label="승인 기록">
            <span className="text-sz-n-500">아직 승인한 초안이 없습니다</span>
          </FieldRow>
        ) : (
          approvals.map(approval => (
            <FieldRow key={approval.approvalId} label={approval.title}>
              <span className="tabular-nums">
                {formatDateTimeShort(approval.approvedAt)} 승인
              </span>
              <div className={FSUB_CLASS}>
                {approval.approvedByName} · {approval.sourceLabel}
              </div>
            </FieldRow>
          ))
        )}
      </div>
      <div className={`${HINT_CLASS} mt-2`}>
        사전 검수가 「있음」인 계약에서 브랜드가{" "}
        <b className="font-semibold">콘텐츠 초안을 승인한 일시와 대상</b>을
        남깁니다.
      </div>
    </DetailCard>
  )
}
