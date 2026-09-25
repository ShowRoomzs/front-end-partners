import { ModalShell } from "@/common/components/ModalShell/ModalShell"
import { formatDateTimeShort } from "@/common/utils/formatDate"
import Btn from "@/features/contracts/components/shared/Btn"
import { TermRow, Terms } from "@/features/contracts/components/shared/Terms"
import type { ContractDetailResponse } from "@/features/contracts/types"

interface CancelReviewModalProps {
  detail: ContractDetailResponse
  isPending: boolean
  onClose: () => void
  onConfirm: () => void
}

/**
 * 시안 C7 — 검토 요청 취소. **계약 취소와 다른 액션**이다: 종결시키지 않고 작성중으로 되돌린다.
 * 그래서 파괴적 버튼이 아니라 주 액션 톤이고 사유 입력도 없다. 다만 어드민이 이미 검토를
 * 시작했을 수 있다는 점은 알린다.
 */
export default function CancelReviewModal(props: CancelReviewModalProps) {
  const { detail, isPending, onClose, onConfirm } = props

  return (
    <ModalShell
      isOpen
      title="검토 요청을 취소할까요?"
      width={480}
      onClose={onClose}
      bodyClassName="p-5 text-[12px] leading-[1.7] text-sz-n-700"
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            닫기
          </Btn>
          <Btn variant="primary" isLoading={isPending} onClick={onConfirm}>
            요청 취소
          </Btn>
        </>
      }
    >
      <Terms className="mb-4 px-3">
        <TermRow label="계약" labelWidth={96} className="py-2">
          {detail.title ?? "(공구명 미입력)"}{" "}
          <span className="text-sz-n-500">
            · {detail.counterparty.showroomName ?? "—"}
          </span>
        </TermRow>
        <TermRow
          label="검토 요청일"
          labelWidth={96}
          className="py-2 tabular-nums"
        >
          {formatDateTimeShort(detail.review.requestedAt)}
        </TermRow>
        <TermRow label="취소 후 상태" labelWidth={96} className="py-2">
          <b className="font-semibold text-sz-n-900">작성중</b>{" "}
          <span className="text-sz-n-500">· 계약은 종결되지 않습니다</span>
        </TermRow>
      </Terms>
      <div className="flex gap-2 rounded-[6px] border border-sz-n-200 bg-sz-n-50 px-[13px] py-[11px] text-[11px] leading-[1.7] text-sz-n-700">
        <div>
          취소하면{" "}
          <b className="font-semibold text-sz-n-900">작성중으로 돌아가</b>{" "}
          내용을 다시 고칠 수 있습니다 —{" "}
          <b className="font-semibold text-sz-n-900">
            계약이 종결되는 것이 아니고
          </b>{" "}
          플랫폼을 거친 결제가 없어 환불 처리도 없습니다. 다만{" "}
          <b className="font-semibold text-sz-n-900">
            어드민이 이미 검토를 시작했을 수 있어
          </b>{" "}
          취소 사실이 어드민에게 통지됩니다. 수정 후{" "}
          <b className="font-semibold text-sz-n-900">다시 검토를 요청</b>하면
          처음부터 확인합니다.
        </div>
      </div>
    </ModalShell>
  )
}
