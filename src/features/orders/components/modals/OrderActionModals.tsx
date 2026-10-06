import Notice from "@/common/components/Notice/Notice"
import Btn from "@/features/contracts/components/shared/Btn"
import {
  B,
  GbModal,
  MHint,
  MLabel,
  MSelect,
  MSum,
  MSumRow,
  MTextarea,
  MWarn,
} from "@/features/groupBuy/components/shared/GbParts"
import {
  CANCEL_MESSAGE_MAX,
  CANCEL_REASON_OPTIONS,
  REJECT_REASON_ETC,
  REJECT_REASON_MAX,
  REJECT_REASON_OPTIONS,
} from "@/features/orders/constants/params"
import type {
  OrderDetailResponse,
  SellerCancelReason,
} from "@/features/orders/types"
import {
  formatNumber,
  formatWon,
  optionText,
} from "@/features/orders/utils/view"
import { useState, type ReactNode } from "react"

/** 고지 목록 — 시안 `.notice.consent` 안의 「· 」 줄들 */
function ConsentNotice(props: { title: ReactNode; children: ReactNode }) {
  return (
    <Notice tone="consent" className="flex flex-col gap-2">
      <div>
        <B className="text-sz-n-900">{props.title}</B>
      </div>
      <div className="leading-[1.8] [&_b]:font-semibold [&_b]:text-sz-n-900">
        {props.children}
      </div>
    </Notice>
  )
}

/**
 * E8 준비 시작 확인 — 고지의 핵심은 「소비자 취소권이 닫힌다」 하나다.
 * 상세가 모달이지만 경고 한 줄이라 작은 다이얼로그로 겹쳐도 된다. 다건도 같은 모달(건수만 바뀐다).
 */
export function PrepareStartModal(props: {
  count: number
  isLoading: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  const { count, isLoading, onClose, onConfirm } = props
  return (
    <GbModal
      title="준비를 시작할까요?"
      onClose={onClose}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            닫기
          </Btn>
          <Btn variant="primary" isLoading={isLoading} onClick={onConfirm}>
            준비 시작
          </Btn>
        </>
      }
    >
      <MSum>
        <MSumRow label="대상">
          <B className="text-sz-n-900">{count}건</B> · 하위주문
        </MSumRow>
      </MSum>
      <ConsentNotice title="준비를 시작하면 소비자가 단순 취소할 수 없습니다">
        · 이후 소비자는 <b>취소 요청</b>을 보낼 수 있고{" "}
        <b>브랜드가 승인·거부</b>
        합니다
        <br />· <b>되돌릴 수 없습니다</b> — 상태는 앞으로만 진행합니다
        <br />· 취소가 필요해지면 <b>직권 취소</b>로 처리하세요(취소율 반영)
      </ConsentNotice>
    </GbModal>
  )
}

/** E5 직권 취소 대상 요약 — 한 건이면 주문을 짚고, 여러 건이면 건수만 */
export interface DirectCancelTarget {
  ids: Array<number>
  single?: {
    orderNumber: string
    recipientName: string
    productSummary: string
    totalQuantity: number
    refundAmount: number
  }
}

/**
 * E5 주문 직권 취소 — 품절·하자로 브랜드가 스스로 취소한다. 버튼은 중립이지만 결과는 무겁다:
 * 사유가 소비자에게 그대로 전달되고 취소율에 반영된다. 환불은 운영자가 실행한다.
 * 서버는 설명을 필수로 받는다(약관 제18조② · 사유와 함께 소비자에게 전달).
 */
export function DirectCancelModal(props: {
  target: DirectCancelTarget
  isLoading: boolean
  onClose: () => void
  onConfirm: (reasonCode: SellerCancelReason, consumerMessage: string) => void
}) {
  const { target, isLoading, onClose, onConfirm } = props
  const [reasonCode, setReasonCode] = useState<SellerCancelReason | "">("")
  const [message, setMessage] = useState("")
  const canSubmit = Boolean(reasonCode) && message.trim().length > 0

  return (
    <GbModal
      title="주문을 취소할까요?"
      onClose={onClose}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            닫기
          </Btn>
          <Btn
            variant="danger"
            disabled={!canSubmit}
            isLoading={isLoading}
            onClick={() => reasonCode && onConfirm(reasonCode, message.trim())}
          >
            주문 취소
          </Btn>
        </>
      }
    >
      <MSum>
        {target.single ? (
          <>
            <MSumRow label="주문번호">{target.single.orderNumber}</MSumRow>
            <MSumRow label="수취인">
              {target.single.recipientName} · {target.single.productSummary}{" "}
              {target.single.totalQuantity}개
            </MSumRow>
            <MSumRow label="환불 예정">
              <B className="text-sz-n-900">
                {formatWon(target.single.refundAmount)}
              </B>{" "}
              · 전액
            </MSumRow>
          </>
        ) : (
          <MSumRow label="대상">
            <B className="text-sz-n-900">{target.ids.length}건</B> · 하위주문 전
            항목 · 전액 환불
          </MSumRow>
        )}
      </MSum>

      <MLabel required first>
        취소 사유
      </MLabel>
      <MSelect
        value={reasonCode}
        onChange={event =>
          setReasonCode(event.target.value as SellerCancelReason | "")
        }
      >
        <option value="">선택하세요</option>
        {CANCEL_REASON_OPTIONS.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </MSelect>

      <MLabel required>소비자에게 전달할 설명</MLabel>
      <MTextarea
        value={message}
        maxLength={CANCEL_MESSAGE_MAX}
        placeholder="상황을 구체적으로 적으면 문의가 줄어듭니다"
        onChange={event => setMessage(event.target.value)}
      />
      <MHint className="text-right">
        {message.length}/{CANCEL_MESSAGE_MAX}
      </MHint>

      <div className="mt-4">
        <ConsentNotice title="취소하면 되돌릴 수 없습니다">
          · <b>취소 사유는 소비자에게 그대로 전달됩니다</b>
          <br />· <b>환불은 운영자가 실행</b>합니다 — 브랜드가 직접 환불하지
          않습니다
          <br />· <b>취소율에 반영되며 반복 시 제재 대상이 될 수 있습니다</b>
        </ConsentNotice>
      </div>
    </GbModal>
  )
}

/**
 * E6 취소 요청 승인 — 소비자 요청을 받아들인다. 정상 업무라 주 액션이지만 되돌릴 수 없어 확인을 받는다.
 * 직권 취소(E5)와 달리 취소율에 반영되지 않는다 — 소비자가 요청한 건이다.
 */
export function ApproveCancelModal(props: {
  detail: OrderDetailResponse
  isLoading: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  const { detail, isLoading, onClose, onConfirm } = props
  const request = detail.cancelRequest
  if (!request) {
    return null
  }
  const liveItemCount = detail.items.filter(item => !item.cancelled).length
  const isWhole = request.remainingItemCount === 0
  const returnTabLabel = detail.status === "NEW" ? "신규" : "상품준비중"

  return (
    <GbModal
      title="취소 요청을 승인할까요?"
      onClose={onClose}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            닫기
          </Btn>
          <Btn variant="primary" isLoading={isLoading} onClick={onConfirm}>
            취소 승인
          </Btn>
        </>
      }
    >
      <MSum>
        <MSumRow label="주문번호">{detail.orderNumber}</MSumRow>
        <MSumRow label="요청 사유">
          {request.reasonLabel}
          {request.reasonDetail && ` · ${request.reasonDetail}`}
        </MSumRow>
        <MSumRow label="요청 항목">
          {request.items
            .map(
              item =>
                `${item.productName}(${optionText(item.optionName)}) ${item.quantity}개`
            )
            .join(", ")}
          <div className="mt-0.5 text-[11px] text-sz-n-500">
            {isWhole
              ? `${liveItemCount}건 전 항목 요청`
              : `${liveItemCount}건 중 ${request.items.length}건 · 남은 ${request.remainingItemCount}건은 발송`}
          </div>
        </MSumRow>
        <MSumRow label="환불 예정">
          <B className="text-sz-n-900">
            {formatWon(request.totalRefundAmount)}
          </B>{" "}
          <span className="text-sz-n-500">
            / 총 {formatWon(detail.amounts.totalAmount)}
          </span>
        </MSumRow>
      </MSum>

      <ConsentNotice title="승인하면 되돌릴 수 없습니다">
        {isWhole ? (
          <>
            · <b>전 항목이 취소</b>되어 주문이 <b>취소로 종결</b>되고{" "}
            <b>취소 탭</b>으로 이동합니다 — 보낼 것이 없습니다
          </>
        ) : (
          <>
            · <b>요청 항목 {request.items.length}개만 취소</b>되고{" "}
            <b>남은 {request.remainingItemCount}개 항목은 그대로 발송</b>해야
            합니다
            <br />· 주문은 <b>{returnTabLabel} 탭으로 돌아갑니다</b> — 배송
            처리를 이어서 해주세요
          </>
        )}
        <br />· <b>환불은 운영자가 실행</b>합니다(요청 항목분{" "}
        {formatNumber(request.totalRefundAmount)}원)
        <br />· 소비자 요청 건이라 <b>취소율에는 반영되지 않습니다</b>
        <br />· 이미 출고했다면 승인 대신 <b>거부하고 반품으로 안내</b>하세요
      </ConsentNotice>
    </GbModal>
  )
}

/**
 * E7 취소 요청 거부 — 사유 필수(소비자에게 그대로 전달). 거부하면 전 항목이 살아난 채 배송이 이어지고
 * 소비자는 수령 후 반품으로만 되돌릴 수 있다. 「기타」일 때만 상세 사유 입력칸이 열린다.
 */
export function RejectCancelModal(props: {
  detail: OrderDetailResponse
  isLoading: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
}) {
  const { detail, isLoading, onClose, onConfirm } = props
  const [choice, setChoice] = useState("")
  const [detailText, setDetailText] = useState("")
  const request = detail.cancelRequest
  if (!request) {
    return null
  }
  const isEtc = choice === REJECT_REASON_ETC
  const reason = isEtc ? detailText.trim() : choice
  const canSubmit = Boolean(reason)
  const returnTabLabel = detail.status === "NEW" ? "신규" : "상품준비중"

  return (
    <GbModal
      title="취소 요청을 거부할까요?"
      onClose={onClose}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            닫기
          </Btn>
          <Btn
            variant="secondary"
            disabled={!canSubmit}
            isLoading={isLoading}
            onClick={() => onConfirm(reason)}
          >
            취소 거부
          </Btn>
        </>
      }
    >
      <MSum>
        <MSumRow label="주문번호">{detail.orderNumber}</MSumRow>
        <MSumRow label="요청 사유">
          {request.reasonLabel}
          {request.reasonDetail && ` · ${request.reasonDetail}`}
        </MSumRow>
      </MSum>

      <MLabel required first>
        거부 사유
      </MLabel>
      <MSelect value={choice} onChange={event => setChoice(event.target.value)}>
        <option value="">선택하세요</option>
        {REJECT_REASON_OPTIONS.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
        <option value={REJECT_REASON_ETC}>{REJECT_REASON_ETC}</option>
      </MSelect>

      {isEtc && (
        <>
          <MLabel required>상세 사유</MLabel>
          <MTextarea
            value={detailText}
            maxLength={REJECT_REASON_MAX}
            placeholder="어떤 상황인지 구체적으로 적어주세요."
            onChange={event => setDetailText(event.target.value)}
          />
        </>
      )}
      <MHint>
        사유는 <B>소비자에게 그대로 전달</B>됩니다. 「기타」를 고르면 상세 사유
        입력이 필수입니다.
      </MHint>

      <MWarn>
        <B className="text-sz-n-900">
          거부하면 전 항목이 살아난 채 배송이 그대로 진행됩니다.
        </B>{" "}
        주문은 <B className="text-sz-n-900">{returnTabLabel} 탭으로 돌아가</B>{" "}
        배송 처리를 이어가야 합니다. 소비자는 수령 후{" "}
        <B className="text-sz-n-900">반품 요청</B>으로만 되돌릴 수 있고, 그때는{" "}
        <B className="text-sz-n-900">반품비가 발생</B>합니다.
      </MWarn>
    </GbModal>
  )
}
