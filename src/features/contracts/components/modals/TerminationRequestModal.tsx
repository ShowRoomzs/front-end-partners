import { ModalShell } from "@/common/components/ModalShell/ModalShell"
import { formatDateTimeShort } from "@/common/utils/formatDate"
import Btn from "@/features/contracts/components/shared/Btn"
import { TEXTAREA_CLASS } from "@/features/contracts/components/shared/styles"
import { TermRow, Terms } from "@/features/contracts/components/shared/Terms"
import {
  TERMINATION_HANDLER_PHRASE,
  TERMINATION_MEMO_MAX_LENGTH,
} from "@/features/contracts/constants/provisional"
import type { ContractDetailResponse } from "@/features/contracts/types"
import { useState } from "react"

interface TerminationRequestModalProps {
  detail: ContractDetailResponse
  isPending: boolean
  onClose: () => void
  onConfirm: (memo: string) => void
}

/**
 * 시안 C9 【잠정 · 기-05】 — 성립 뒤 · 공구 오픈 전 해지 요청. 브랜드가 바로 끝내지 못하고
 * 운영자 처리를 거친다. 사유는 상대에게 그대로 전달되며 미입력이면 버튼만 비활성(문구 없음).
 */
export default function TerminationRequestModal(
  props: TerminationRequestModalProps
) {
  const { detail, isPending, onClose, onConfirm } = props
  const [memo, setMemo] = useState("")
  const trimmed = memo.trim()

  return (
    <ModalShell
      isOpen
      title="계약 해지를 요청할까요?"
      width={480}
      onClose={onClose}
      bodyClassName="p-5 text-[12px] leading-[1.7] text-sz-n-700"
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            닫기
          </Btn>
          <Btn
            variant="primary"
            disabled={!trimmed}
            isLoading={isPending}
            onClick={() => onConfirm(trimmed)}
          >
            해지 요청
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
        {/* 성립 일시는 main 필드 — 개발 서버 응답엔 없어 줄째 뺀다 */}
        {detail.establishedAt && (
          <TermRow
            label="계약 성립"
            labelWidth={96}
            className="py-2 tabular-nums"
          >
            {formatDateTimeShort(detail.establishedAt)}
          </TermRow>
        )}
        <TermRow
          label="공구 오픈"
          labelWidth={96}
          className="py-2 tabular-nums"
        >
          {detail.period.startAt
            ? `${formatDateTimeShort(detail.period.startAt)} 예정`
            : "—"}
        </TermRow>
      </Terms>

      <label
        htmlFor="contract-termination-memo"
        className="mb-1 block text-[12px] font-medium text-sz-n-600"
      >
        해지 사유<span className="ml-0.5 text-sz-danger-text">*</span>
      </label>
      <textarea
        id="contract-termination-memo"
        className={TEXTAREA_CLASS}
        maxLength={TERMINATION_MEMO_MAX_LENGTH}
        placeholder="해지가 필요한 사정을 적어 주세요. 인플루언서에게 그대로 전달됩니다"
        value={memo}
        onChange={event => setMemo(event.target.value)}
      />

      <div className="mt-4 flex gap-2 rounded-[6px] border border-sz-n-200 bg-sz-n-50 px-[13px] py-[11px] text-[11px] leading-[1.7] text-sz-n-700">
        <div>
          해지는{" "}
          <b className="font-semibold text-sz-n-900">
            {TERMINATION_HANDLER_PHRASE}
          </b>
          합니다. 처리되기 전까지 계약은{" "}
          <b className="font-semibold text-sz-n-900">체결완료</b>로 유지되고,
          공구가 오픈되면 해지가 아니라 공구 관리의{" "}
          <b className="font-semibold text-sz-n-900">중단 요청</b>으로 바뀝니다.
        </div>
      </div>
    </ModalShell>
  )
}
