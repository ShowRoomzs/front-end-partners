import { ModalShell } from "@/common/components/ModalShell/ModalShell"
import Notice from "@/common/components/Notice/Notice"
import Btn from "@/features/contracts/components/shared/Btn"
import {
  SELECT_CLASS,
  TK_CLASS,
  TROW_CLASS,
  TV_CLASS,
} from "@/features/contracts/components/shared/styles"
import { FORM_SELECT_CHEVRON_STYLE } from "@/features/contracts/constants/params"
import { MWARN_CLASS } from "@/features/claims/components/detail/FreightParts"
import { useGetClaimFreightPreview } from "@/features/claims/hooks/useClaimQueries"
import type { ClaimDetailResponse } from "@/features/claims/types"
import { formatWon } from "@/features/claims/utils/format"
import { canChangeFaultOnPass } from "@/features/claims/utils/inspection"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import type { ReactNode } from "react"

const MSUM_CLASS =
  "rounded-[6px] border border-sz-n-200 bg-sz-n-50 px-3 py-[2px]"

function SumRow(props: { label: string; children: ReactNode }) {
  return (
    <div className={TROW_CLASS}>
      <div className={TK_CLASS} style={{ width: 96 }}>
        {props.label}
      </div>
      <div className={`${TV_CLASS} tabular-nums`}>{props.children}</div>
    </div>
  )
}

/**
 * 시안 M1 — 검수 통과 확인. 통과는 되돌릴 수 없고, 반품이면 승인 즉시 PG가 자동 환불한다.
 * 기-17: 귀책은 신청 때 귀책이 기본값이고 여기서 브랜드 귀책으로 바꿀 수 있다(선불 반품만 · utils/inspection).
 * 기-93: 브랜드 귀책이면 선불 운임 · 차감한 최초 배송비가 환불에 더해진다 — 금액 줄은 서버 미리보기가 생길 때까지
 * 개발 서버 목업에서만 그린다(배포본은 안내 문구만).
 */
export default function PassConfirmModal(props: {
  isOpen: boolean
  detail: ClaimDetailResponse
  isPending: boolean
  onClose: () => void
  onConfirm: (faultToSeller: boolean) => void
}) {
  const { isOpen, isPending, onClose, onConfirm } = props
  // 통과 응답이 상세 캐시를 바꾼 뒤 모달이 닫히기까지 잠깐 새 값(통과 후 금액)으로 다시 그려지지 않게 연 순간 값을 쓴다
  const [detail, setDetail] = useState(props.detail)
  const { summary, refund } = detail
  const isExchange = summary.type === "EXCHANGE"
  const faultChangeable = canChangeFaultOnPass(detail)
  const [faultToSeller, setFaultToSeller] = useState(false)
  const { data: preview } = useGetClaimFreightPreview(
    detail,
    isOpen && faultChangeable
  )

  useEffect(() => {
    if (!isOpen) return
    setFaultToSeller(false)
    setDetail(props.detail)
    // 열 때만 고정한다 — 열린 동안 바뀐 상세는 반영하지 않는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const deduction = refund?.requestDeduction ?? 0
  const brandTotal =
    refund && preview
      ? refund.requestExpectedAmount + deduction + preview.freight
      : null
  const overPaid =
    brandTotal !== null && preview
      ? Math.max(0, brandTotal - preview.originalPaidAmount)
      : 0

  return (
    <ModalShell
      isOpen={isOpen}
      title="검수를 통과할까요?"
      width={480}
      onClose={onClose}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            닫기
          </Btn>
          <Btn
            variant="primary"
            isLoading={isPending}
            onClick={() => onConfirm(faultChangeable && faultToSeller)}
          >
            {isExchange ? "검수 통과 · 재발송 처리" : "검수 통과"}
          </Btn>
        </>
      }
    >
      <div className={cn(MSUM_CLASS, "mb-4")}>
        <SumRow label="접수번호">{summary.claimNumber}</SumRow>
        <SumRow label="대상">
          {summary.productName}
          {summary.optionName && ` ${summary.optionName}`} · {summary.quantity}
          개
        </SumRow>
        {isExchange ? (
          <SumRow label="교환 옵션">{summary.exchangeOptionName ?? "—"}</SumRow>
        ) : (
          refund && (
            <SumRow label="환불 예정">
              {formatWon(refund.requestExpectedAmount)}{" "}
              <span className="text-sz-n-500">· {refund.basisLabel}</span>
            </SumRow>
          )
        )}
      </div>

      {faultChangeable && (
        <>
          <label className="mb-1 block text-[12px] font-medium text-sz-n-600">
            귀책
          </label>
          <select
            value={faultToSeller ? "SELLER" : "KEEP"}
            onChange={event =>
              setFaultToSeller(event.target.value === "SELLER")
            }
            style={FORM_SELECT_CHEVRON_STYLE}
            className={cn(SELECT_CLASS, "h-[34px] w-full")}
          >
            <option value="KEEP">
              신청 때 귀책 유지 · 소비자 귀책({summary.reasonLabel})
            </option>
            <option value="SELLER">
              브랜드 귀책으로 인정 · 선불 운임·최초 배송비 환불 가산
            </option>
          </select>
          <Notice tone="neutral" className="mt-2">
            <div>
              귀책을 「브랜드」로 바꾸면{" "}
              <b>
                소비자가 낸 선불 운임과 차감한 최초 배송비가 환불에
                더해집니다(브랜드 부담)
              </b>
              .{" "}
              {overPaid > 0 && preview ? (
                <>
                  원래 결제액({formatWon(preview.originalPaidAmount)})을 넘는
                  환급분 {formatWon(overPaid)}은{" "}
                </>
              ) : (
                "원래 결제액을 넘는 환급분은 "
              )}
              <b>운영자가 송금하고 브랜드 정산에서 차감</b>됩니다.
            </div>
          </Notice>
          {refund && preview && brandTotal !== null && (
            <div className={cn(MSUM_CLASS, "mt-2")}>
              <SumRow label="지금 환불 예정">
                {formatWon(refund.requestExpectedAmount)}{" "}
                <span className="text-sz-n-500">· 소비자 귀책</span>
              </SumRow>
              {deduction > 0 && (
                <SumRow label="+ 최초 배송비">{formatWon(deduction)}</SumRow>
              )}
              <SumRow label="+ 선불 운임(회수)">
                {formatWon(preview.freight)}{" "}
                <span className="text-sz-n-500">
                  · 소비자가 낸 금액(상품 기본 배송비 정액)
                </span>
              </SumRow>
              <SumRow label="브랜드 귀책 시">
                <b className="font-semibold text-sz-n-900">
                  {formatWon(brandTotal)}
                </b>{" "}
                <span className="text-sz-n-500">
                  · {formatWon(deduction + preview.freight)}은 브랜드 부담
                </span>
              </SumRow>
            </div>
          )}
        </>
      )}

      <div className={cn(MWARN_CLASS, faultChangeable && "mt-4")}>
        <b>승인하면 되돌릴 수 없습니다.</b>{" "}
        {isExchange ? (
          <>
            교환 옵션 상품을 출고하고 <b>재발송 송장을 등록</b>해야 완료됩니다.
          </>
        ) : (
          <>
            승인 즉시 <b>PG가 자동으로 환불</b>하며 소비자에게 결과가
            전달됩니다.
          </>
        )}{" "}
        반려가 필요하면 닫고 [검수 반려]를 선택하세요.
      </div>
    </ModalShell>
  )
}
