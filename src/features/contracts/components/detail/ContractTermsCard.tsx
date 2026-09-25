import DetailCard, { FieldRow } from "@/common/components/DetailCard/DetailCard"
import Notice from "@/common/components/Notice/Notice"
import {
  FLINK_CLASS,
  FSUB_CLASS,
} from "@/features/contracts/components/shared/styles"
import type { ContractDetailResponse } from "@/features/contracts/types"
import {
  CLOSED_VIEWS,
  CONCLUDED_VIEWS,
  type ContractViewState,
} from "@/features/contracts/utils/contractView"
import { formatKRW, periodText } from "@/features/contracts/utils/format"

interface ContractTermsCardProps {
  detail: ContractDetailResponse
  view: ContractViewState
  onOpenThread: () => void
}

const NOTE_BY_VIEW: Partial<Record<ContractViewState, string>> = {
  reviewPending: "검토 중 수정 불가 — 어드민이 본 내용이 바뀌면 안 됩니다",
  reviewRejected: "반려로 편집이 다시 열렸습니다",
  signingNone: "검토 요청 후 수정 불가 — 외부 전자서명 진행 중",
  signingMine: "검토 요청 후 수정 불가 — 외부 전자서명 진행 중",
  signingTheirs: "검토 요청 후 수정 불가 — 외부 전자서명 진행 중",
  conclusionPending: "서명이 완료돼 수정할 수 없습니다",
  concludedNoFee: "체결 후 수정 불가",
  concludedPaid: "체결 후 수정 불가",
  concludedFeeDue: "체결 후 수정 불가",
  declined: "거절된 계약 · 읽기 전용",
  expired: "만료된 계약 · 읽기 전용",
  canceled: "취소된 계약 · 읽기 전용",
}

/** 「계약 조건」 — 상대 · 공구명 · 기간 · 고정 지급비(지급 시점 · 지급 주체). 읽기 전용 */
export default function ContractTermsCard(props: ContractTermsCardProps) {
  const { detail, view, onOpenThread } = props
  const { counterparty, period, fixedFee } = detail
  const isClosed = CLOSED_VIEWS.includes(view)
  const period_ = periodText(period.startAt, period.endAt)

  return (
    <DetailCard title="계약 조건" note={NOTE_BY_VIEW[view]}>
      {view === "concludedFeeDue" && (
        <Notice tone="info" className="mb-4">
          <b className="font-semibold">
            고정 지급비 {formatKRW(fixedFee.amount)}을 브랜드가 인플루언서에게
            직접 지급해야 합니다.
          </b>{" "}
          계약서에 적은 지급 시점은{" "}
          <b className="font-semibold">{fixedFee.triggerLabel}</b>입니다 —
          플랫폼은 대금을 중개하지 않으므로{" "}
          <b className="font-semibold">지급 후 [지급 완료 기록]</b>으로 표시해
          주세요. 기록이 미지급 분쟁의 근거가 됩니다.
        </Notice>
      )}
      <FieldRow label="계약 상대">
        {counterparty.showroomName ?? "—"}{" "}
        {counterparty.connectionId !== null && (
          <button type="button" className={FLINK_CLASS} onClick={onOpenThread}>
            스레드 열기
          </button>
        )}
      </FieldRow>
      <FieldRow label="공구명">
        {detail.title ?? "—"}
        {!isClosed && !CONCLUDED_VIEWS.includes(view) && (
          <div className={FSUB_CLASS}>
            내부 관리용 식별명 · 소비자 노출 제목과 별개
          </div>
        )}
      </FieldRow>
      <FieldRow label="공구 기간">
        <span className="tabular-nums">
          {period_ ?? "미설정"}
          {period.days !== null && (
            <span className="text-sz-n-500"> ({period.days}일)</span>
          )}
        </span>
      </FieldRow>
      <FieldRow label="고정 지급비">
        <span className="tabular-nums">{formatKRW(fixedFee.amount ?? 0)}</span>
        <div className={FSUB_CLASS}>
          {isClosed ? (
            "계약 종결 · 지급 의무 소멸"
          ) : fixedFee.amount ? (
            <>
              지급 시점{" "}
              <b className="font-semibold text-sz-n-700">
                {fixedFee.triggerLabel ?? "—"}
              </b>{" "}
              · 브랜드 직접 지급
            </>
          ) : (
            "지급하지 않음"
          )}
        </div>
      </FieldRow>
    </DetailCard>
  )
}
