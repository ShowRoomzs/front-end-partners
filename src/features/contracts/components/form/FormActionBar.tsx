import Btn from "@/features/contracts/components/shared/Btn"
import { SUSPENSION_COPY } from "@/features/suspension"

interface FormActionBarProps {
  canDelete: boolean
  canRequestReview: boolean
  isSaving: boolean
  isRequesting: boolean
  onDelete: () => void
  onSave: () => void
  onRequestReview: () => void
  /** 계정 이용 정지(시안 15 S4a) — [임시저장] · [검토 요청]은 비활성 + 툴팁, [삭제]만 남긴다(정리하는 일) */
  suspended?: boolean
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
    suspended = false,
  } = props
  const blockedTitle = suspended ? SUSPENSION_COPY.blockedTooltip : undefined

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
        disabled={suspended}
        title={blockedTitle}
        onClick={onSave}
      >
        임시저장
      </Btn>
      <Btn
        variant="primary"
        large
        disabled={!canRequestReview || suspended}
        title={blockedTitle}
        isLoading={isRequesting}
        onClick={onRequestReview}
      >
        검토 요청
      </Btn>
    </div>
  )
}
