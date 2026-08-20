import Notice from "@/features/productInquiry/components/Notice/Notice"
import { ANSWER_MAX_LENGTH } from "@/features/productInquiry/constants/params"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface AnswerFormProps {
  /** 수정 모드면 기존 답변으로 채워 시작한다 */
  initialValue?: string
  submitLabel: string
  isSubmitting?: boolean
  /**
   * 공개 전환 예고 문구에 넣을 마스킹 닉네임 — **공개글 등록 모드에서만** 넘긴다.
   * 비밀글은 답변해도 공개로 전환되지 않으므로 이 배너 자체가 성립하지 않는다(B5).
   */
  writerName?: string
  /** 수정 모드에서는 편집을 닫고, 등록 모드에서는 입력을 비운다 */
  onCancel?: () => void
  onSubmit: (answerContent: string) => void
}

/**
 * 답변 입력 — 등록·수정 공용(B1~B3).
 *
 * **에러 문구가 없다.** 상한은 `maxlength`로 입력 자체를 막아 초과 상태가 생기지 않고,
 * 미입력은 버튼 비활성으로만 알린다. 상한에 닿으면 **카운터 색만 진해지고 등록은 계속
 * 활성**이다(B3) — 막힌 건 입력이지 제출이 아니다. 붉은 문구를 띄우려 들지 말 것.
 */
export default function AnswerForm(props: AnswerFormProps) {
  const {
    initialValue = "",
    submitLabel,
    isSubmitting = false,
    writerName,
    onCancel,
    onSubmit,
  } = props

  const [value, setValue] = useState(initialValue)

  const trimmed = value.trim()
  const canSubmit = trimmed.length > 0 && trimmed !== initialValue.trim()
  const isAtMax = value.length >= ANSWER_MAX_LENGTH

  return (
    <div className="flex flex-col">
      <textarea
        value={value}
        onChange={event => setValue(event.target.value)}
        maxLength={ANSWER_MAX_LENGTH}
        placeholder="답변을 입력하세요"
        className="min-h-[104px] w-full resize-y rounded-[6px] border border-sz-n-300 bg-white px-3 py-[9px] text-[13px] leading-[1.65] text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
      />

      <span
        className={cn(
          "mt-1.5 self-end text-[11px] tracking-[.2px] tabular-nums",
          isAtMax ? "font-semibold text-sz-n-700" : "text-sz-n-400"
        )}
      >
        {value.length.toLocaleString("ko-KR")} /{" "}
        {ANSWER_MAX_LENGTH.toLocaleString("ko-KR")}
      </span>

      {/*
        누르기 전에 결과를 미리 말한다 — 답변은 비공개 전환이 없고 상품 상세에 질문과
        함께 그대로 붙는다. 등록하고 나서 알게 되면 늦다.
      */}
      {writerName && (
        <Notice tone="info" className="mt-3">
          <b className="font-semibold">등록 시 공개 콘텐츠로 전환됩니다.</b>{" "}
          상품 상세 문의 탭에 질문·답변이 함께 노출되며, 작성자는 닉네임 마스킹(
          {writerName})이 유지됩니다.
        </Notice>
      )}

      <div className="mt-3 flex justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={() => {
              setValue(initialValue)
              onCancel()
            }}
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
          className="inline-flex h-8 items-center rounded-[6px] bg-sz-accent-500 px-3.5 text-[12px] font-medium text-white hover:enabled:bg-sz-accent-600 disabled:cursor-not-allowed disabled:bg-sz-n-200 disabled:text-sz-n-400"
        >
          {isSubmitting ? "처리 중" : submitLabel}
        </button>
      </div>
    </div>
  )
}
