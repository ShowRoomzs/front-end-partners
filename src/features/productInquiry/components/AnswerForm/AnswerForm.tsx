import { ANSWER_MAX_LENGTH } from "@/features/productInquiry/constants/params"
import { useState } from "react"

interface AnswerFormProps {
  /** 수정 모드면 기존 답변으로 채워 시작한다 */
  initialValue?: string
  submitLabel: string
  isSubmitting?: boolean
  /** 수정 모드에서만 넘긴다 — 등록 모드에는 취소할 이전 상태가 없다 */
  onCancel?: () => void
  onSubmit: (answerContent: string) => void
}

/**
 * 답변 입력 — 등록·수정 공용.
 *
 * **에러 문구가 없다.** 상한은 `maxlength`로 입력 자체를 막아 초과 상태가 생기지 않고,
 * 미입력은 버튼 비활성으로만 알린다(§23-4). 붉은 문구를 띄우려 들지 말 것 —
 * 이 화면 전체에 에러 문구가 하나도 없는 것이 사양이다.
 *
 * 답변은 소비자 화면에 그대로 나가는 원문이라 글자 수를 항상 보여 준다.
 */
export default function AnswerForm(props: AnswerFormProps) {
  const {
    initialValue = "",
    submitLabel,
    isSubmitting = false,
    onCancel,
    onSubmit,
  } = props

  const [value, setValue] = useState(initialValue)

  const trimmed = value.trim()
  const canSubmit = trimmed.length > 0 && trimmed !== initialValue.trim()

  return (
    <div className="pt-2">
      <textarea
        value={value}
        onChange={event => setValue(event.target.value)}
        maxLength={ANSWER_MAX_LENGTH}
        placeholder="소비자에게 그대로 노출되는 답변입니다. 상품 정보를 기준으로 정확하게 작성해 주세요."
        className="min-h-[140px] w-full resize-y rounded-[6px] border border-sz-n-300 bg-white px-3 py-2.5 text-[13px] leading-[1.75] text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
      />

      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-[11px] tabular-nums text-sz-n-500">
          {value.length} / {ANSWER_MAX_LENGTH}자
        </span>

        <div className="flex gap-1.5">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex h-8 items-center rounded-[6px] border border-sz-n-300 bg-white px-3.5 text-[12px] font-medium text-sz-n-900 hover:bg-sz-n-100"
            >
              취소
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (!canSubmit || isSubmitting) {
                return
              }
              onSubmit(trimmed)
            }}
            disabled={!canSubmit || isSubmitting}
            className="inline-flex h-8 items-center rounded-[6px] bg-sz-accent-500 px-3.5 text-[12px] font-medium text-white hover:enabled:bg-sz-accent-600 disabled:cursor-not-allowed disabled:bg-sz-n-100 disabled:text-sz-n-400"
          >
            {isSubmitting ? "처리 중" : submitLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
