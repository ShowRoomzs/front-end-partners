import { Button } from "@/components/ui/button"
import { ModalShell } from "@/features/storeManagement/components/ChangeRequestModal/ModalShell"
import type { ChangeRequestCreateResponse } from "@/features/storeManagement/services/changeRequestService"

interface SubmittedModalProps {
  response: ChangeRequestCreateResponse | null
  onClose: () => void
}

/** M3 — M1·M2 제출 후 공통으로 뜨는 접수 완료 모달. 확인을 누르면 해당 탭이 검토중 배너로 전환된다 */
export function SubmittedModal(props: SubmittedModalProps) {
  const { response, onClose } = props

  return (
    <ModalShell
      isOpen={!!response}
      title="변경 요청 접수 완료"
      width={420}
      onClose={onClose}
      footer={
        <Button type="button" size="sm" onClick={onClose}>
          확인
        </Button>
      }
    >
      <p className="mb-2.5 text-[13px] text-sz-n-900">
        변경 요청이 접수되었습니다.
      </p>
      <p className="text-[12px] leading-[1.7] text-sz-n-600">
        이후 검토 후 결과를{" "}
        <b className="text-sz-n-900">{response?.notifyEmail}</b>으로 안내드려요.
        검토가 끝날 때까지 같은 항목을 추가 변경 요청할 수 없어요.
      </p>
    </ModalShell>
  )
}
