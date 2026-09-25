import Btn from "@/features/contracts/components/shared/Btn"

interface FormActionBarProps {
  canDelete: boolean
  canRequestReview: boolean
  isSaving: boolean
  isRequesting: boolean
  onDelete: () => void
  onSave: () => void
  onRequestReview: () => void
}

/**
 * 시안 `.formbar` — 좌측 [삭제](위험색 글자) · 우측 [임시저장] [검토 요청].
 * 필수 미입력은 에러 문구 없이 [검토 요청]만 비활성이다(절대 규칙).
 */
export default function FormActionBar(props: FormActionBarProps) {
  const {
    canDelete,
    canRequestReview,
    isSaving,
    isRequesting,
    onDelete,
    onSave,
    onRequestReview,
  } = props

  return (
    <div className="flex items-center gap-2 pt-4">
      {canDelete && (
        <Btn variant="delete" large className="mr-auto" onClick={onDelete}>
          삭제
        </Btn>
      )}
      <Btn
        variant="secondary"
        large
        className={canDelete ? undefined : "ml-auto"}
        isLoading={isSaving}
        onClick={onSave}
      >
        임시저장
      </Btn>
      <Btn
        variant="primary"
        large
        disabled={!canRequestReview}
        isLoading={isRequesting}
        onClick={onRequestReview}
      >
        검토 요청
      </Btn>
    </div>
  )
}
