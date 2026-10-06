import { ModalShell } from "@/common/components/ModalShell/ModalShell"
import Btn from "@/features/contracts/components/shared/Btn"
import {
  TK_CLASS,
  TROW_CLASS,
  TV_CLASS,
} from "@/features/contracts/components/shared/styles"
import type { ClaimDetailResponse } from "@/features/claims/types"
import { formatWon } from "@/features/claims/utils/format"

/**
 * 시안 M1 — 검수 통과 확인. 통과는 되돌릴 수 없고, 반품이면 승인 즉시 PG가 자동 환불한다.
 * 브랜드는 판정만 한다 — 입력이 없다.
 */
export default function PassConfirmModal(props: {
  isOpen: boolean
  detail: ClaimDetailResponse
  isPending: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  const { isOpen, detail, isPending, onClose, onConfirm } = props
  const { summary, refund } = detail
  const isExchange = summary.type === "EXCHANGE"

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
          <Btn variant="primary" isLoading={isPending} onClick={onConfirm}>
            {isExchange ? "검수 통과 · 재발송 처리" : "검수 통과"}
          </Btn>
        </>
      }
    >
      <div className="mb-4 rounded-[6px] border border-sz-n-200 bg-sz-n-50 px-3 py-[2px]">
        <div className={TROW_CLASS}>
          <div className={TK_CLASS} style={{ width: 96 }}>
            접수번호
          </div>
          <div className={`${TV_CLASS} tabular-nums`}>
            {summary.claimNumber}
          </div>
        </div>
        <div className={TROW_CLASS}>
          <div className={TK_CLASS} style={{ width: 96 }}>
            대상
          </div>
          <div className={TV_CLASS}>
            {summary.productName}
            {summary.optionName && ` ${summary.optionName}`} ·{" "}
            {summary.quantity}개
          </div>
        </div>
        {isExchange ? (
          <div className={TROW_CLASS}>
            <div className={TK_CLASS} style={{ width: 96 }}>
              교환 옵션
            </div>
            <div className={TV_CLASS}>{summary.exchangeOptionName ?? "—"}</div>
          </div>
        ) : (
          refund && (
            <div className={TROW_CLASS}>
              <div className={TK_CLASS} style={{ width: 96 }}>
                환불 예정
              </div>
              <div className={`${TV_CLASS} tabular-nums`}>
                {formatWon(refund.requestExpectedAmount)}{" "}
                <span className="text-sz-n-500">· {refund.basisLabel}</span>
              </div>
            </div>
          )
        )}
      </div>
      <div className="rounded-[6px] border border-sz-n-200 bg-sz-n-50 px-[13px] py-[11px] text-[11px] leading-[1.7] text-sz-n-700">
        <b className="font-semibold text-sz-n-900">
          승인하면 되돌릴 수 없습니다.
        </b>{" "}
        {isExchange ? (
          <>
            교환 옵션 상품을 출고하고{" "}
            <b className="font-semibold text-sz-n-900">재발송 송장을 등록</b>
            해야 완료됩니다.
          </>
        ) : (
          <>
            승인 즉시{" "}
            <b className="font-semibold text-sz-n-900">PG가 자동으로 환불</b>
            하며 소비자에게 결과가 전달됩니다.
          </>
        )}{" "}
        반려가 필요하면 닫고 [검수 반려]를 선택하세요.
      </div>
    </ModalShell>
  )
}
