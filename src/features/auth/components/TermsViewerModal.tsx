import { isAxiosError } from "axios"
import { useTermsDetail } from "@/common/hooks/useTerms"
import {
  formatTermsDate,
  type TermsDocument,
} from "@/common/services/termsService"

type TermsViewerModalProps = {
  /** 체크 항목 이름(예: 개인정보처리방침) */
  label: string
  /** 종류에 맞는 시행 중 문서 — 없으면 undefined */
  document: TermsDocument | undefined
  /** 목록 조회 상태 */
  isListLoading: boolean
  isListError: boolean
  onRetryList: () => void
  onClose: () => void
}

/**
 * 가입 약관 원문 보기 — 서버 시행 중 문서(`/v1/common/terms/{id}`)를 보여 준다.
 * 시행 중 문서가 없으면 오류가 아니라 안내로 둔다(어드민 등록은 시행일 00:00부터 노출된다).
 */
export function TermsViewerModal(props: TermsViewerModalProps) {
  const { label, document, isListLoading, isListError, onRetryList, onClose } =
    props
  const detail = useTermsDetail(document?.documentId ?? null)

  const renderBody = () => {
    if (isListLoading || (document && detail.isLoading)) {
      return <p className="py-8 text-center text-sz-n-500">불러오는 중…</p>
    }
    if (isListError) {
      return (
        <StatusMessage
          message="약관을 불러오지 못했어요."
          actionLabel="다시 시도"
          onAction={onRetryList}
        />
      )
    }
    // 목록엔 있었는데 원문이 404면 그 사이 시행이 끝난 것이다 — 없음 안내와 같게 둔다
    if (
      !document ||
      (isAxiosError(detail.error) && detail.error.response?.status === 404)
    ) {
      return <StatusMessage message="아직 시행 중인 문서가 없어요." />
    }
    if (detail.isError || !detail.data) {
      return (
        <StatusMessage
          message="약관을 불러오지 못했어요."
          actionLabel="다시 시도"
          onAction={() => void detail.refetch()}
        />
      )
    }
    return (
      <>
        <p className="mb-3 text-[11px] text-sz-n-500">
          {detail.data.version} · 시행일{" "}
          {formatTermsDate(detail.data.effectiveDate)}
        </p>
        <div className="whitespace-pre-line">{detail.data.content}</div>
      </>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-[480px] flex-col overflow-hidden rounded-[8px] bg-white shadow-lg"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-sz-n-200 px-5 py-3.5">
          <h3 className="text-[14px] font-semibold text-sz-n-900">
            {detail.data?.name ?? label}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex h-7 w-7 items-center justify-center rounded text-sz-n-500 hover:bg-sz-n-100 hover:text-sz-n-900"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 text-[13px] leading-relaxed text-sz-n-700">
          {renderBody()}
        </div>
        <div className="border-t border-sz-n-200 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="h-[38px] w-full rounded-[6px] bg-sz-auth-action px-5 text-[13px] font-medium text-white hover:bg-sz-auth-action-hover"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  )
}

function StatusMessage(props: {
  message: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center text-sz-n-500">
      <p>{props.message}</p>
      {props.actionLabel && (
        <button
          type="button"
          onClick={props.onAction}
          className="h-7 rounded-[6px] border border-sz-n-300 bg-white px-3 text-[12px] font-medium text-sz-n-700 hover:bg-sz-n-50"
        >
          {props.actionLabel}
        </button>
      )}
    </div>
  )
}
