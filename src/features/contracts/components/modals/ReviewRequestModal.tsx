import { ModalShell } from "@/common/components/ModalShell/ModalShell"
import Notice from "@/common/components/Notice/Notice"
import Btn from "@/features/contracts/components/shared/Btn"
import ConsentCheck from "@/features/contracts/components/shared/ConsentCheck"
import { TermRow, Terms } from "@/features/contracts/components/shared/Terms"
import { FIXED_FEE_TRIGGER_LABEL } from "@/features/contracts/constants/labels"
import type {
  ContractCounterpartyOption,
  ContractWarning,
} from "@/features/contracts/types"
import type { ContractFormValues } from "@/features/contracts/utils/contractForm"
import { inclusiveDays } from "@/features/contracts/utils/datetime"
import { formatKRW, formatPercent } from "@/features/contracts/utils/format"
import dayjs from "dayjs"
import { useState } from "react"

interface ReviewRequestModalProps {
  values: ContractFormValues
  counterparties: Array<ContractCounterpartyOption>
  warnings: Array<ContractWarning>
  isPending: boolean
  onCancel: () => void
  onConfirm: () => void
}

/**
 * 시안 C3 — 검토 요청 확인. 이 버튼은 서명도 결제도 하지 않지만 누르면 편집이 잠기고
 * 어드민 검토로 넘어가므로 반드시 경유한다. 경고는 막지 않고 **열거 + 체크**를 받는다.
 */
export default function ReviewRequestModal(props: ReviewRequestModalProps) {
  const { values, counterparties, warnings, isPending, onCancel, onConfirm } =
    props
  const [acknowledged, setAcknowledged] = useState(false)
  const needsAck = warnings.length > 0

  const counterpartName =
    counterparties.find(item => item.creatorId === values.creatorId)
      ?.showroomName ?? "—"
  const start = values.groupBuyStartAt ? dayjs(values.groupBuyStartAt) : null
  const end = values.groupBuyEndAt ? dayjs(values.groupBuyEndAt) : null
  const items = values.items.filter(item => item.productId !== null)
  const rates = items.map(item => formatPercent(item.rewardRate)).join(" / ")

  return (
    <ModalShell
      isOpen
      title="검토를 요청할까요?"
      width={520}
      onClose={onCancel}
      bodyClassName="max-h-[70vh] overflow-y-auto p-5 text-[12px] leading-[1.7] text-sz-n-700"
      footer={
        <>
          <Btn variant="ghost" onClick={onCancel}>
            취소
          </Btn>
          <Btn
            variant="primary"
            disabled={needsAck && !acknowledged}
            isLoading={isPending}
            onClick={onConfirm}
          >
            검토 요청
          </Btn>
        </>
      }
    >
      <Terms className="mb-4 px-3">
        <TermRow label="계약 상대" labelWidth={96} className="py-2">
          {counterpartName}
        </TermRow>
        <TermRow label="공구명" labelWidth={96} className="py-2">
          {values.title || "—"}
        </TermRow>
        <TermRow
          label="공구 기간"
          labelWidth={96}
          className="py-2 tabular-nums"
        >
          {start && end
            ? `${start.format("YYYY.MM.DD")} ~ ${end.format("YYYY.MM.DD")} (${inclusiveDays(start, end)}일)`
            : "—"}
        </TermRow>
        <TermRow
          label="상품 항목"
          labelWidth={96}
          className="py-2 tabular-nums"
        >
          {items.length}건{rates ? ` · 리워드율 ${rates}` : ""}
        </TermRow>
        <TermRow
          label="고정 지급비"
          labelWidth={96}
          className="py-2 tabular-nums"
        >
          <b className="font-semibold text-sz-n-900">
            {formatKRW(values.fixedFeeAmount ?? 0)}
          </b>
          {values.fixedFeeTrigger && (
            <span className="text-sz-n-500">
              {" "}
              · {FIXED_FEE_TRIGGER_LABEL[values.fixedFeeTrigger]} · 브랜드 직접
              지급
            </span>
          )}
        </TermRow>
      </Terms>

      {needsAck && (
        <Notice tone="consent" className="flex flex-col gap-2">
          <div>
            <b className="font-semibold text-sz-n-900">
              확인이 필요한 항목이 {warnings.length}건 있습니다
            </b>
          </div>
          <div className="leading-[1.8]">
            {warnings.map(warning => (
              <div key={warning.code}>· {warning.message}</div>
            ))}
          </div>
          <ConsentCheck checked={acknowledged} onChange={setAcknowledged}>
            위 항목을 확인했으며 이 조건으로 검토를 요청합니다
          </ConsentCheck>
        </Notice>
      )}

      <Notice tone="info" className={needsAck ? "mt-3" : undefined}>
        요청하면 <b className="font-semibold">① 어드민이 계약 내용을 확인</b>
        하고, 통과하면{" "}
        <b className="font-semibold">
          ② 전자서명 요청이 브랜드·인플루언서 양측에 메일·문자로 각각 발송
        </b>
        됩니다.{" "}
        <b className="font-semibold">
          서명은 이 화면이 아니라 전자서명 링크에서
        </b>{" "}
        하며, 양측 서명이 끝나면 어드민이{" "}
        <b className="font-semibold">체결 완료 처리</b>합니다.
      </Notice>
    </ModalShell>
  )
}
