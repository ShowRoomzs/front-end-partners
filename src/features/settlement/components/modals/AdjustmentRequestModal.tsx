import {
  ModalLabel,
  ModalShell,
} from "@/common/components/ModalShell/ModalShell"
import Btn from "@/features/contracts/components/shared/Btn"
import {
  HINT_CLASS,
  INPUT_CLASS,
  TEXTAREA_CLASS,
} from "@/features/contracts/components/shared/styles"
import { MNote } from "@/features/settlement/components/detail/DetailParts"
import type {
  SettlementAdjustmentRequest,
  SettlementDetail,
} from "@/features/settlement/types"
import {
  adjustmentUpperBound,
  previewAdjustment,
} from "@/features/settlement/utils/amount"
import {
  formatMonthDayTime,
  formatPercent,
  formatWon,
} from "@/features/settlement/utils/format"
import { cn } from "@/lib/utils"
import { useState, type ReactNode } from "react"

/** 원 단위 입력 — 12자리(9천억)면 정산 금액으로 충분하다 */
const MAX_DIGITS = 12

/**
 * 시안 C1 — 정산 조정 요청(D2의 [정산 조정 요청]).
 *
 * 바꿀 것은 **인플루언서 리워드 금액 하나**이고, 입력하면 인플루언서 실지급 · 브랜드 수취액이 바로
 * 계산된다. 범위(0 이상 · 리워드 + 부가세가 브랜드 몫 이내)를 벗어나거나 사유가 비면 **에러 문구 없이
 * 버튼 비활성**. 보내면 정산 전액 보류 + 이슈 스레드 자동 개설(차액 선지급 없음). 근거 첨부는
 * 2026.10.07에 삭제됐다 — 근거는 요청 후 이슈 스레드 말풍선에 올린다.
 */
export default function AdjustmentRequestModal(props: {
  detail: SettlementDetail
  isPending: boolean
  onClose: () => void
  onSubmit: (body: SettlementAdjustmentRequest) => void
}) {
  const { detail, isPending, onClose, onSubmit } = props
  const b = detail.breakdown
  const [digits, setDigits] = useState("")
  const [reason, setReason] = useState("")

  const upper = adjustmentUpperBound(b)
  const amount = digits === "" ? null : Number(digits)
  const inRange = amount !== null && amount <= upper
  const preview = inRange
    ? previewAdjustment(b, detail.creatorTax, amount)
    : null
  const canSubmit = inRange && reason.trim() !== "" && !isPending

  return (
    <ModalShell
      isOpen
      title="정산 조정을 요청할까요?"
      width={480}
      onClose={onClose}
      bodyClassName="max-h-[70vh] overflow-y-auto p-5 text-[12px] leading-[1.7] text-sz-n-700"
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>
            닫기
          </Btn>
          <Btn
            variant="primary"
            disabled={!canSubmit}
            isLoading={isPending}
            onClick={() => {
              if (!canSubmit || amount === null) return
              onSubmit({ rewardAmount: amount, reason: reason.trim() })
            }}
          >
            정산 조정 요청
          </Btn>
        </>
      }
    >
      <div className="mb-3">
        {detail.groupBuyTitle} · {detail.creatorShowroomName}
        <br />
        원래 리워드 <B>{formatWon(b.reward)}</B> · 확인 기간{" "}
        <B>{formatMonthDayTime(detail.reviewDeadlineAt)}</B>까지
      </div>

      <ModalLabel required>조정할 리워드 금액</ModalLabel>
      <input
        aria-label="조정할 리워드 금액"
        inputMode="numeric"
        autoFocus
        className={cn(INPUT_CLASS, "w-full text-right tabular-nums")}
        value={amount === null ? "" : amount.toLocaleString("ko-KR")}
        onChange={event =>
          setDigits(
            event.target.value
              .replace(/\D/g, "")
              .replace(/^0+(?=\d)/, "")
              .slice(0, MAX_DIGITS)
          )
        }
      />
      <div className={HINT_CLASS}>
        0원 ~ {formatWon(upper)}(리워드 + 부가세가 브랜드 수취액을 넘지 않는
        범위) 안에서 입력할 수 있습니다
      </div>

      <table className="mt-2.5 w-full border-collapse text-[12px]">
        <tbody>
          <PreviewRow
            label="인플루언서 실지급"
            note={
              detail.creatorTax.isBusiness
                ? "사업자 · 원천징수 없음 · 부가세 포함"
                : `원천징수 ${formatPercent(detail.creatorTax.withholdingRate)} 차감 후`
            }
            value={preview ? formatWon(preview.creatorNet) : "—"}
          />
          <PreviewRow
            label="브랜드 수취액"
            note={`원래 ${formatWon(b.brandReceivable)}`}
            value={preview ? formatWon(preview.brandReceivable) : "—"}
          />
        </tbody>
      </table>

      <div className="mt-3">
        <ModalLabel required>사유</ModalLabel>
        <textarea
          aria-label="사유"
          className={TEXTAREA_CLASS}
          placeholder="조정이 필요한 이유를 적어주세요."
          value={reason}
          onChange={event => setReason(event.target.value)}
        />
      </div>

      <p className="mt-3">
        요청하면 <B>이 공구 정산이 전액 보류</B>되고 이슈 스레드가 열립니다.
        상대가 동의하면 바로 반영되며, <B>10영업일</B> 안에 합의가 없으면 원래
        금액으로 확정됩니다. 근거 자료는 요청 후 <B>이슈 스레드</B>에 올려
        주세요.
      </p>
    </ModalShell>
  )
}

function B({ children }: { children: ReactNode }) {
  return <b className="font-semibold text-sz-n-900">{children}</b>
}

/** 시안 `.mtab tr.sub` */
function PreviewRow(props: { label: string; note: string; value: string }) {
  return (
    <tr className="text-sz-n-600">
      <td className="px-3 py-2.5">
        {props.label}
        <MNote>{props.note}</MNote>
      </td>
      <td className="px-3 py-2.5 text-right text-sz-n-700 tabular-nums">
        {props.value}
      </td>
    </tr>
  )
}
