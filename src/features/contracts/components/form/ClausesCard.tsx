import DetailCard from "@/common/components/DetailCard/DetailCard"
import {
  FLINK_CLASS,
  HINT_CLASS,
  WTAG_CLASS,
} from "@/features/contracts/components/shared/styles"
import { TermRow, Terms } from "@/features/contracts/components/shared/Terms"
import type { ContractClausesResponse } from "@/features/contracts/types"

interface ClausesCardProps {
  clauses: ContractClausesResponse | undefined
  onOpenFullText: () => void
}

/**
 * 시안 B1 「표준 조항」 — 브랜드 편집 불가 · 계약서 자동 삽입(§25-8).
 * 요약과 전문은 서버가 같은 행에서 내리므로 두 목록이 어긋날 일이 없다.
 * 문안 미확정 조항(전문 null)은 요약 옆에 점선 태그로 표시한다.
 */
export default function ClausesCard(props: ClausesCardProps) {
  const { clauses, onOpenFullText } = props

  return (
    <DetailCard title="표준 조항" note="브랜드 편집 불가 · 계약서 자동 삽입">
      <Terms>
        {clauses?.clauses.map(clause => (
          <TermRow key={clause.code} label={clause.summaryTitle}>
            {clause.summaryDescription}
            {clause.fullBody === null && (
              <span className={WTAG_CLASS}>문안 확정 전</span>
            )}
          </TermRow>
        ))}
        {!clauses && (
          <TermRow label="표준 조항">
            <span className="text-sz-n-500">불러오는 중…</span>
          </TermRow>
        )}
      </Terms>
      <div className={`${HINT_CLASS} mt-2.5`}>
        브랜드가 입력하는 항목이 아니며 계약서 생성 시 자동 삽입됩니다.{" "}
        <button type="button" className={FLINK_CLASS} onClick={onOpenFullText}>
          전문 보기
        </button>
      </div>
    </DetailCard>
  )
}
