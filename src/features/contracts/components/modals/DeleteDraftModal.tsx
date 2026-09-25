import { ModalShell } from "@/common/components/ModalShell/ModalShell"
import Btn from "@/features/contracts/components/shared/Btn"

interface DeleteDraftModalProps {
  isPending: boolean
  onClose: () => void
  onConfirm: () => void
}

/**
 * 시안 C8 — 작성 내용 삭제 확인. 삭제 확인만 한다 — 반려 사유나 계약 정보를 끌어오지 않는다.
 * 지금 수정 중인 계약은 그 자체로 독립된 계약이고 확인할 것은 「지울 것인가」 하나다.
 */
export default function DeleteDraftModal(props: DeleteDraftModalProps) {
  const { isPending, onClose, onConfirm } = props

  return (
    <ModalShell
      isOpen
      title="작성 중인 계약을 삭제할까요?"
      width={480}
      onClose={onClose}
      bodyClassName="p-5 text-[12px] leading-[1.7] text-sz-n-700"
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            닫기
          </Btn>
          <Btn variant="dangerSolid" isLoading={isPending} onClick={onConfirm}>
            삭제
          </Btn>
        </>
      }
    >
      삭제하면 <b className="font-semibold text-sz-n-900">되돌릴 수 없습니다</b>
      .
    </ModalShell>
  )
}
