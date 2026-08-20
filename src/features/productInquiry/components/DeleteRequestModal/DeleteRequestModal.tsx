import Notice from "@/features/productInquiry/components/Notice/Notice"
import {
  DELETE_DETAIL_MAX_LENGTH,
  DELETE_REASON_ETC,
  INQUIRY_DELETE_REASONS,
  MODAL_SELECT_CHEVRON_STYLE,
} from "@/features/productInquiry/constants/params"
import type { InquiryDeleteReason } from "@/features/productInquiry/types"
import { useEffect, useState } from "react"

interface DeleteRequestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isSubmitting?: boolean
  onSubmit: (reason: InquiryDeleteReason, detail: string) => void
}

/**
 * C1 — 문의 삭제 요청 모달.
 *
 * 브랜드는 **요청까지만** 할 수 있고 집행은 운영자가 한다. 요청해도 문의는 즉시
 * 내려가지 않고 검토 중에도 계속 게시되며, **요청을 취소하는 경로는 없다**(§23-5).
 * 그래서 확인 문구에서 그 셋을 모두 미리 말한다 — 누르고 나서 알게 되면 늦다.
 *
 * 주 액션이 위험색인 이유는 되돌릴 수 없어서다. 반려된 뒤 재요청할 때도 같은 모달을
 * 쓴다 — 새 사유를 처음부터 고르는 흐름이 같으므로 별도 화면을 만들 이유가 없다.
 */
export default function DeleteRequestModal(props: DeleteRequestModalProps) {
  const { open, onOpenChange, isSubmitting = false, onSubmit } = props

  const [reason, setReason] = useState("")
  const [detail, setDetail] = useState("")

  // 열릴 때마다 비운다 — 닫았다 다시 열었을 때 앞의 입력이 남아 있으면 안 된다
  useEffect(() => {
    if (open) {
      setReason("")
      setDetail("")
    }
  }, [open])

  if (!open) {
    return null
  }

  /*
    상세 설명은 기본이 선택값이고 `기타(직접 입력)`일 때만 필수로 전환된다.
    정형 사유가 "기타"면 그 자체로는 아무 정보가 없어 운영자가 판단할 근거가 없다.
  */
  const isDetailRequired = reason === DELETE_REASON_ETC
  const canSubmit =
    reason !== "" && (!isDetailRequired || detail.trim().length > 0)

  const handleSubmit = () => {
    if (!canSubmit || isSubmitting) {
      return
    }
    onSubmit(reason as InquiryDeleteReason, detail.trim())
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-sz-n-900/40 p-6"
      onClick={event => {
        if (event.target === event.currentTarget) {
          onOpenChange(false)
        }
      }}
    >
      <div className="w-[520px] max-w-full overflow-hidden rounded-[8px] bg-white shadow-[0_8px_24px_rgba(26,27,31,0.12),0_2px_6px_rgba(26,27,31,0.08)]">
        <div className="flex items-center justify-between border-b border-sz-n-200 px-5 py-3.5">
          <h2 className="text-[13px] font-semibold text-sz-n-900">
            문의 삭제 요청
          </h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="닫기"
            className="text-[13px] text-sz-n-400 hover:text-sz-n-700"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-5">
          <label
            htmlFor="delete-reason"
            className="mb-1 block text-[12px] font-medium text-sz-n-600"
          >
            요청 사유
            <span className="ml-0.5 text-sz-danger-text">*</span>
          </label>
          <select
            id="delete-reason"
            value={reason}
            onChange={event => setReason(event.target.value)}
            style={MODAL_SELECT_CHEVRON_STYLE}
            className="h-8 w-full appearance-none rounded-[6px] border border-sz-n-300 bg-white py-1.5 pl-2.5 pr-8 text-[13px] text-sz-n-900 outline-none focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
          >
            <option value="">선택하세요</option>
            {INQUIRY_DELETE_REASONS.map(option => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>

          <label
            htmlFor="delete-detail"
            className="mb-1 mt-4 block text-[12px] font-medium text-sz-n-600"
          >
            상세 설명
            {isDetailRequired ? (
              <span className="ml-0.5 text-sz-danger-text">*</span>
            ) : (
              <span className="ml-1 font-normal text-sz-n-400">선택</span>
            )}
          </label>
          <textarea
            id="delete-detail"
            value={detail}
            onChange={event => setDetail(event.target.value)}
            maxLength={DELETE_DETAIL_MAX_LENGTH}
            placeholder="운영자가 판단하는 데 도움이 될 내용을 적어주세요"
            className="min-h-[88px] w-full resize-y rounded-[6px] border border-sz-n-300 bg-white px-2.5 py-[7px] text-[13px] leading-[1.6] text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
          />
          <p className="mt-1.5 text-[11px] text-sz-n-500">
            사유로 “기타(직접 입력)”를 선택하면 상세 설명이 필수가 됩니다.
          </p>

          <Notice tone="info" className="mt-4">
            요청해도 문의는{" "}
            <b className="font-semibold">즉시 삭제되지 않습니다.</b> 운영자가
            검토해 삭제 또는 반려를 결정하며, 검토 중에도 문의는 계속
            게시됩니다.{" "}
            <b className="font-semibold">요청 후에는 취소할 수 없습니다.</b>
          </Notice>
        </div>

        <div className="flex justify-end gap-2 border-t border-sz-n-200 px-5 py-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-8 items-center rounded-[6px] px-3.5 text-[12px] font-medium text-sz-n-600 hover:bg-sz-n-100"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            // 미선택은 에러 문구 없이 버튼 비활성만으로 표현한다
            disabled={!canSubmit || isSubmitting}
            className="inline-flex h-8 items-center rounded-[6px] bg-sz-danger-text px-3.5 text-[12px] font-medium text-white hover:enabled:bg-[#8f2828] disabled:cursor-not-allowed disabled:bg-sz-n-200 disabled:text-sz-n-400"
          >
            {isSubmitting ? "처리 중" : "요청 보내기"}
          </button>
        </div>
      </div>
    </div>
  )
}
