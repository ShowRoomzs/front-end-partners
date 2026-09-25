import { ModalShell } from "@/common/components/ModalShell/ModalShell"
import Btn from "@/features/contracts/components/shared/Btn"

interface UnsavedLeaveModalProps {
  changedSections: Array<string>
  isSaving: boolean
  onLeave: () => void
  onSaveAndLeave: () => void
  onStay: () => void
}

/**
 * 시안 C6 — 작성 이탈 경고. 버튼 3개이므로 가장 안전한 [계속 작성]을 오른쪽 끝(주 액션 자리)에
 * 두고, 파괴적인 [저장 없이 나가기]는 위험색 아닌 중립 고스트로 둔다.
 */
export default function UnsavedLeaveModal(props: UnsavedLeaveModalProps) {
  const { changedSections, isSaving, onLeave, onSaveAndLeave, onStay } = props

  return (
    <ModalShell
      isOpen
      title="저장하지 않은 내용이 있습니다"
      width={480}
      onClose={onStay}
      bodyClassName="p-5 text-[12px] leading-[1.7] text-sz-n-700"
      footer={
        <>
          <Btn variant="ghost" onClick={onLeave} disabled={isSaving}>
            저장 없이 나가기
          </Btn>
          <Btn
            variant="secondary"
            isLoading={isSaving}
            onClick={onSaveAndLeave}
          >
            임시저장 후 나가기
          </Btn>
          <Btn variant="primary" onClick={onStay} disabled={isSaving}>
            계속 작성
          </Btn>
        </>
      }
    >
      <div>
        마지막 임시저장 이후{" "}
        <b className="font-semibold text-sz-n-900">
          {changedSections.length > 0
            ? changedSections.join(" · ")
            : "입력 내용"}
        </b>
        이(가) 변경되었습니다. 저장하지 않고 나가면 이 변경은 사라집니다.
      </div>
      <div className="mt-2.5 text-[11px] text-sz-n-500">
        임시저장한 계약은 목록의{" "}
        <b className="font-semibold text-sz-n-700">작성중</b> 탭에서 이어 작성할
        수 있습니다.
      </div>
    </ModalShell>
  )
}
