import { ModalShell } from "@/common/components/ModalShell/ModalShell"
import Notice from "@/common/components/Notice/Notice"
import Btn from "@/features/contracts/components/shared/Btn"
import type { ContractClausesResponse } from "@/features/contracts/types"

interface ClausesModalProps {
  clauses: ContractClausesResponse | undefined
  onClose: () => void
}

/**
 * 시안 C5 — 표준 조항 전문. 본문이 길어 모달 안에서만 스크롤된다.
 * 입력 컨트롤이 하나도 없다(브랜드 편집 불가). 문안 미확정 조항(전문 null)은 그리지 않는다.
 */
export default function ClausesModal(props: ClausesModalProps) {
  const { clauses, onClose } = props
  const fullClauses = clauses?.clauses.filter(
    clause => clause.fullTitle !== null && clause.fullBody !== null
  )

  return (
    <ModalShell
      isOpen
      title="표준 조항 전문"
      width={640}
      onClose={onClose}
      bodyClassName="max-h-[560px] overflow-y-auto p-5"
      footer={
        <Btn variant="secondary" onClick={onClose}>
          닫기
        </Btn>
      }
    >
      <Notice tone="neutral" className="mb-4">
        브랜드가 편집할 수 없는 <b className="font-semibold">표준 조항</b>이며
        계약서 생성 시 자동 삽입됩니다. 문안은 법률 검토 후 확정됩니다.
        {clauses && (
          <>
            {" "}
            (v{clauses.versionNumber} · {clauses.effectiveDate} 시행)
          </>
        )}
      </Notice>
      {fullClauses?.map(clause => (
        <div key={clause.code} className="mb-[18px] last:mb-0">
          <div className="mb-[5px] text-[13px] font-semibold text-sz-n-900">
            {clause.fullTitle}
          </div>
          <div className="whitespace-pre-line text-[12px] leading-[1.75] text-sz-n-600">
            {clause.fullBody}
          </div>
        </div>
      ))}
      {fullClauses && fullClauses.length === 0 && (
        <p className="text-[12px] text-sz-n-500">
          전문이 확정된 조항이 아직 없습니다.
        </p>
      )}
    </ModalShell>
  )
}
