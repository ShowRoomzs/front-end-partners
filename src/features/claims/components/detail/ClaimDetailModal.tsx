import StatusBadge from "@/common/components/StatusBadge/StatusBadge"
import Notice from "@/common/components/Notice/Notice"
import Btn from "@/features/contracts/components/shared/Btn"
import {
  ERR_CLASS,
  FLINK_CLASS,
  INPUT_CLASS,
  SELECT_CLASS,
  TEXTAREA_CLASS,
} from "@/features/contracts/components/shared/styles"
import { FORM_SELECT_CHEVRON_STYLE } from "@/features/contracts/constants/params"
import {
  CARRIER_OPTIONS,
  INSPECT_DUE_LABEL,
  OPERATOR_THREAD_PATH,
  REJECT_CONSUMER_MESSAGE_MAX,
  REJECT_LEGAL_BASIS_OPTIONS,
  REJECT_REASON_OPTIONS,
  SELLER_BORNE_INTAKE_LABEL,
  SELLER_BORNE_REASONS,
} from "@/features/claims/constants/params"
import {
  FRow,
  Hint,
  HistoryRows,
  MBox,
  WideModal,
} from "@/features/claims/components/detail/DetailParts"
import { EvidenceField } from "@/features/claims/components/detail/EvidenceField"
import {
  AmountRow,
  CollectFreightNotice,
  MWARN_CLASS,
} from "@/features/claims/components/detail/FreightParts"
import OverturnForm from "@/features/claims/components/detail/OverturnForm"
import PassConfirmModal from "@/features/claims/components/modals/PassConfirmModal"
import {
  useClaimMutations,
  useGetClaimDetail,
  useGetClaimFreightPreview,
} from "@/features/claims/hooks/useClaimQueries"
import { useEvidenceUpload } from "@/features/claims/hooks/useEvidenceUpload"
import type {
  ClaimDetailResponse,
  ClaimRejectLegalBasis,
  ClaimRejectReason,
  DeliveryCarrier,
} from "@/features/claims/types"
import {
  digitsOnly,
  formatFullDateTime,
  formatWon,
} from "@/features/claims/utils/format"
import {
  canOverturnOf,
  isSellerBorne,
} from "@/features/claims/utils/inspection"
import { cn } from "@/lib/utils"
import { isAxiosError } from "axios"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import toast from "react-hot-toast"
import { useNavigate } from "react-router-dom"

const HISTORY_TONE: Record<string, string> = {
  ARRIVED: "success",
  RECEIVED: "success",
  INSPECTION_PASSED: "success",
  RESHIP_DELIVERED: "success",
  REFUND_EXECUTED: "success",
  INSPECTION_REJECTED: "warning",
  COLLECTION_INVOICE_REGISTERED: "info",
  COLLECTION_INVOICE_UPDATED: "info",
  RESHIP_INVOICE_REGISTERED: "info",
  RESHIP_INVOICE_UPDATED: "info",
  RESHIP_FEE_PAID: "info",
  RESHIP_FEE_SETTLED: "info",
  STORAGE_NOTICE_SENT: "warning",
  DISPOSED: "danger",
  AUTO_RECEIVED: "success",
  REASON_OVERTURNED: "warning",
  FAULT_ACCEPTED_ON_PASS: "info",
  OVERTURN_FEE_PAID: "info",
}

function FieldLabel(props: {
  children: ReactNode
  required?: boolean
  extra?: ReactNode
  first?: boolean
}) {
  return (
    <label
      className={cn(
        "mb-1 block text-[12px] font-medium text-sz-n-600",
        props.first ? "mt-0" : "mt-4"
      )}
    >
      {props.children}
      {props.required && <span className="ml-0.5 text-sz-danger-text">*</span>}
      {props.extra}
    </label>
  )
}

function errorMessage(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    return (error.response?.data?.message as string | undefined) ?? fallback
  }
  return fallback
}

/**
 * 반품·교환 상세 모달(B1·B1r·B2·D1·D2·D3).
 *
 * 브랜드는 검수 판정까지만 하고 돈은 만지지 않는다 — 금액 입력·환불 실행 요소가 없다.
 * 통과는 되돌릴 수 없어 확인 모달(M1)을 거치고, 반려는 우 레일에서 폼이 펼쳐진다(모달 위 모달 금지).
 */
export default function ClaimDetailModal(props: {
  claimId: number
  onClose: () => void
  onPrev?: () => void
  onNext?: () => void
}) {
  const { claimId, onClose, onPrev, onNext } = props
  const { data: detail, isLoading, isError } = useGetClaimDetail(claimId)

  const summary = detail?.summary
  const badge = summary ? headerBadge(detail) : null

  return (
    <WideModal
      onClose={onClose}
      onPrev={onPrev}
      onNext={onNext}
      title={
        <>
          <span className="tabular-nums">{summary?.claimNumber ?? "—"}</span>
          {badge}
        </>
      }
    >
      {isLoading && (
        <div className="flex justify-center py-24">
          <Loader2 className="size-5 animate-spin text-sz-n-400" />
        </div>
      )}
      {isError && (
        <div className="py-24 text-center text-[12px] text-sz-n-500">
          신청을 찾을 수 없습니다. 목록을 새로고침해 주세요.
        </div>
      )}
      {detail && <DetailBody key={detail.summary.claimId} detail={detail} />}
    </WideModal>
  )
}

function headerBadge(detail: ClaimDetailResponse) {
  const { summary } = detail
  if (summary.outcome) {
    const success =
      summary.outcome.code === "REFUNDED" ||
      summary.outcome.code === "EXCHANGED"
    return (
      <StatusBadge variant={success ? "success" : "neutral"}>
        {summary.outcome.label}
      </StatusBadge>
    )
  }
  return <StatusBadge variant="neutral">{summary.statusLabel}</StatusBadge>
}

/**
 * 「사유」 행 보조줄 — 운영자 개설(B1 「운영자 개설 · 구매확정 후 하자 · 증빙 2장」) · 교환 재발송 배송비 청구(B2).
 * 기-18: 교환은 「교환비」가 아니라 재발송 배송비이고, 불량 · 오배송은 착불 회수(운임 브랜드 부담)다.
 */
function reasonSub(
  detail: ClaimDetailResponse,
  reshipFeeCharged: boolean | null
) {
  const { summary } = detail
  const parts: Array<string> = []
  if (summary.openedByOperator) {
    parts.push("운영자 개설")
    if (summary.openReason) parts.push(summary.openReason)
  }
  if (summary.type === "EXCHANGE" && reshipFeeCharged !== null) {
    const intake = SELLER_BORNE_INTAKE_LABEL[summary.reasonCode]
    parts.push(
      reshipFeeCharged
        ? "고객 귀책 교환 · 재발송 배송비 신청 시 결제"
        : intake
          ? `재발송 배송비 미청구 · ${intake} 접수라 착불 회수(운임 브랜드 부담)`
          : "재발송 배송비 미청구"
    )
  } else if (summary.consumerAttachmentCount > 0) {
    parts.push(`증빙 ${summary.consumerAttachmentCount}장`)
  }
  return parts.length > 0 ? parts.join(" · ") : undefined
}

function DetailBody(props: { detail: ClaimDetailResponse }) {
  const { detail } = props
  const { summary, actions } = detail
  const navigate = useNavigate()
  const mutations = useClaimMutations()
  const [passOpen, setPassOpen] = useState(false)
  /** 우 레일에 펼친 판정 폼 — 하나만 펼친다(B1r 반려 · B2b 사유 번복) */
  const [openForm, setOpenForm] = useState<"REJECT" | "OVERTURN" | null>(null)

  const isExchange = summary.type === "EXCHANGE"
  const isInspecting = actions.canPass || actions.canReject
  const detailRequired = SELLER_BORNE_REASONS.includes(summary.reasonCode)
  const sellerBorne = isSellerBorne(detail)
  const canOverturn = canOverturnOf(detail)
  const reshipFeeCharged = detail.reshipFeeCharged ?? detail.exchangeFeeCharged
  const timer = detail.purchaseConfirm

  const handleReceive = async () => {
    try {
      const result = await mutations.receive.mutateAsync([summary.claimId])
      if (result.skipped.length > 0) {
        toast.error(result.skipped[0].message)
        return
      }
      toast.success(
        `입고 확인했습니다. ${INSPECT_DUE_LABEL} 안에 검수를 완료해 주세요.`
      )
    } catch {
      // 토스트는 apiInstance가 띄운다
    }
  }

  const handlePass = async (faultToSeller: boolean) => {
    try {
      await mutations.pass.mutateAsync({ current: detail, faultToSeller })
      setPassOpen(false)
      toast.success(
        isExchange
          ? "검수를 통과했습니다. 교환 옵션의 재발송 송장을 등록해 주세요."
          : "검수를 통과했습니다. 환불은 PG가 자동으로 처리합니다."
      )
    } catch {
      setPassOpen(false)
    }
  }

  return (
    <div className="grid grid-cols-[1fr_300px] items-start gap-4 px-5 pb-5 pt-4">
      <div className="flex min-w-0 flex-col gap-3">
        <MBox title="신청 정보">
          <FRow label="접수번호">
            <span className="tabular-nums">{summary.claimNumber}</span>
          </FRow>
          <FRow label="유형">{summary.typeLabel}</FRow>
          <FRow label="소비자">
            {summary.consumerName}
            {detail.consumerPhone && (
              <span className="text-sz-n-500"> · {detail.consumerPhone}</span>
            )}
          </FRow>
          <FRow label="주문번호">
            <span className="tabular-nums">{detail.orderNumber}</span>
          </FRow>
          <FRow label="상품 · 옵션">
            {summary.productName}
            {summary.optionName && (
              <span className="text-sz-n-500"> / {summary.optionName}</span>
            )}
          </FRow>
          {isExchange && (
            <FRow
              label="교환 옵션"
              sub="같은 상품의 다른 옵션 맞교환 · 차액 없음"
            >
              {summary.productName} {summary.optionName ?? ""} →{" "}
              <b className="font-semibold">
                {summary.exchangeOptionName ?? "—"}
              </b>
            </FRow>
          )}
          <FRow label="수량">
            <span className="tabular-nums">{summary.quantity}개</span>
          </FRow>
          <FRow label="사유" sub={reasonSub(detail, reshipFeeCharged)}>
            {summary.reasonLabel}
          </FRow>
          {(detail.reasonDetail || detailRequired) && (
            <FRow
              label="상세 내용"
              sub={
                detailRequired
                  ? "소비자 작성 · 이 사유는 상세 내용 입력이 필수입니다"
                  : "소비자 작성"
              }
            >
              <span className="leading-[1.6]">
                {detail.reasonDetail ?? "—"}
              </span>
            </FRow>
          )}
          <FRow label="신청일시">
            <span className="tabular-nums">
              {formatFullDateTime(summary.requestedAt)}
            </span>
          </FRow>
          <FRow
            label="회수 송장"
            sub={summary.collection?.trackingNumber ? "소비자 입력" : undefined}
          >
            {summary.collection?.trackingNumber ? (
              <span className="tabular-nums">
                {summary.collection.carrierLabel}{" "}
                {summary.collection.trackingNumber}
              </span>
            ) : (
              <span className="text-sz-n-500">
                소비자가 아직 회수 송장을 입력하지 않았습니다
              </span>
            )}
          </FRow>
          <FRow
            label="입고 확인"
            sub={
              summary.inspectDueAt && isInspecting ? (
                <>
                  검수 기한{" "}
                  <b className="font-semibold">
                    {formatFullDateTime(summary.inspectDueAt)}
                  </b>
                  까지 · {INSPECT_DUE_LABEL}
                </>
              ) : detail.inspection?.autoReceived ? (
                "자동 입고"
              ) : undefined
            }
          >
            <span className="tabular-nums">
              {summary.receivedAt
                ? formatFullDateTime(summary.receivedAt)
                : "—"}
            </span>
          </FRow>
          {detail.refund && (
            <FRow
              label="환불 예정액"
              sub={
                <>
                  이 항목 상품 금액 {formatWon(detail.refund.itemAmount)}
                  {detail.refund.requestDeduction > 0 &&
                    ` · 최초 배송비 차감 −${formatWon(detail.refund.requestDeduction)}`}{" "}
                  · {detail.refund.basisLabel}
                  {sellerBorne && " · 착불 회수(운임 브랜드 부담)"} — 검수 통과
                  시 <b className="font-semibold">PG가 이 금액을 자동 환불</b>
                  합니다.
                </>
              }
            >
              <span className="text-[16px] font-semibold tabular-nums">
                {formatWon(detail.refund.requestExpectedAmount)}
              </span>
            </FRow>
          )}
        </MBox>

        {detail.consumerAttachments.length > 0 && (
          <MBox
            title="소비자 첨부"
            note={`${detail.consumerAttachments.length}장 · 신청 시 제출`}
          >
            <Thumbs urls={detail.consumerAttachments} />
          </MBox>
        )}

        {detail.sellerEvidences.length > 0 && (
          <MBox
            title={
              detail.inspection?.result === "REASON_OVERTURNED"
                ? "사유 번복 증빙"
                : "브랜드 반려 증빙"
            }
            note={`${detail.sellerEvidences.length}장 · 소비자에게 그대로 전달됨`}
          >
            {detail.rejectDetail && (
              <div className="mb-3 text-[12px] leading-[1.6] text-sz-n-700">
                {detail.rejectDetail}
              </div>
            )}
            <Thumbs urls={detail.sellerEvidences} />
          </MBox>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        {actions.canConfirmReceipt && (
          <MBox title="입고 확인" tight>
            <Btn
              variant="primary"
              className="w-full"
              isLoading={mutations.receive.isPending}
              onClick={handleReceive}
            >
              입고 확인
            </Btn>
            <Hint>
              상품이 도착했다면 입고 확인을 눌러 주세요. 이 순간{" "}
              <b>검수 기한(입고 확인 + 2영업일)</b>이 발급됩니다. 되돌릴 수
              없습니다.
            </Hint>
          </MBox>
        )}

        {isInspecting && (
          <MBox title="검수 판정" tight>
            <FRow
              label="구매확정 타이머"
              sub="반품·교환 요청 시점부터 정지 · 철회되면 남은 일수부터 재개"
            >
              <span className="text-sz-warning-text">
                {timer?.paused && timer.remainingDays !== null
                  ? `정지 · 남은 ${timer.remainingDays}일`
                  : "정지"}
              </span>
            </FRow>
            <div className="mt-4 flex flex-col gap-1.5">
              {actions.canPass && (
                <Btn
                  variant="primary"
                  className="w-full"
                  onClick={() => setPassOpen(true)}
                >
                  {isExchange ? "검수 통과 · 재발송 처리" : "검수 통과"}
                </Btn>
              )}
              {canOverturn && openForm === null && (
                <Btn
                  variant="secondary"
                  className="w-full"
                  onClick={() => setOpenForm("OVERTURN")}
                >
                  사유 번복
                </Btn>
              )}
              {actions.canReject && openForm === null && (
                <Btn
                  variant="secondary"
                  className="w-full"
                  onClick={() => setOpenForm("REJECT")}
                >
                  검수 반려
                </Btn>
              )}
            </div>
            {openForm === null && isExchange && (
              <>
                <Hint>
                  <b>검수 통과 · 재발송</b> — 교환 옵션 상품을 출고하고{" "}
                  <b>새 송장을 등록</b>하면 완료됩니다.
                </Hint>
                {canOverturn && (
                  <Hint className="mt-2">
                    <b>사유 번복</b> — 불량 신청이었지만 검수 결과{" "}
                    <b>단순 변심</b>인 경우입니다. 교환은 진행하고{" "}
                    <b>재발송 배송비는 소비자가 결제</b>합니다. 결제 확인 후
                    재발송으로 넘어갑니다.
                  </Hint>
                )}
                <Hint className="mt-2">
                  <b>검수 반려</b> — 반려가 확정되면 <b>교환이 취소</b>되고,
                  소비자가 배송비를 결제한 뒤 <b>회수한 원래 상품을 그대로</b>{" "}
                  다시 보내게 됩니다.
                </Hint>
              </>
            )}
            {openForm === null && !isExchange && (
              <Hint>
                <b>검수 통과로 처리하면 PG가 자동으로 환불</b>합니다. 환불
                금액은 정산에 반영됩니다.{" "}
                <b>브랜드는 금액을 입력하거나 환불을 실행하지 않습니다.</b>
              </Hint>
            )}
            {openForm === null && (
              <Hint className="mt-2">
                {isExchange
                  ? "판단이 어려우면 "
                  : "부당한 신청이라고 판단되면 "}
                <span
                  role="link"
                  tabIndex={0}
                  className={FLINK_CLASS}
                  onClick={() => navigate(OPERATOR_THREAD_PATH)}
                >
                  운영자 문의
                </span>
                {!isExchange && " — 회수를 중단할 수는 없습니다."}
              </Hint>
            )}
            {openForm === "REJECT" && actions.canReject && (
              <RejectForm detail={detail} onCancel={() => setOpenForm(null)} />
            )}
            {openForm === "OVERTURN" && canOverturn && (
              <OverturnForm
                detail={detail}
                onCancel={() => setOpenForm(null)}
              />
            )}
          </MBox>
        )}

        {(actions.canRegisterReshipment || actions.canUpdateReshipment) && (
          <ReshipBox detail={detail} />
        )}

        {summary.status === "REJECT_HOLD" && <StorageBox detail={detail} />}

        {summary.stage === "DONE" && <ResultBox detail={detail} />}

        <MBox title="처리 이력" tight>
          <HistoryRows
            items={detail.history.map((item, index) => ({
              key: `${item.eventType}-${index}`,
              text: (
                <>
                  {item.eventLabel}
                  {item.detail && ` · ${item.detail}`}
                </>
              ),
              meta: `${formatFullDateTime(item.occurredAt)} · ${item.actorLabel}`,
              tone: HISTORY_TONE[item.eventType],
            }))}
          />
        </MBox>
      </div>

      <PassConfirmModal
        isOpen={passOpen}
        detail={detail}
        isPending={mutations.pass.isPending}
        onClose={() => setPassOpen(false)}
        onConfirm={handlePass}
      />
    </div>
  )
}

function Thumbs(props: { urls: Array<string> }) {
  return (
    <div className="flex flex-wrap gap-2">
      {props.urls.map((url, index) => (
        <a
          key={url}
          href={url}
          target="_blank"
          rel="noreferrer"
          className="block size-[104px] overflow-hidden rounded-[6px] border border-sz-n-200 bg-sz-n-100"
          aria-label={`사진 ${index + 1} 크게 보기`}
        >
          <img
            src={url}
            alt={`사진 ${index + 1}`}
            className="size-full object-cover"
          />
        </a>
      ))}
    </div>
  )
}

/**
 * 시안 B1r — 검수 반려 6항목(서버 SellerClaimRejectRequest · 소비자 C10-5와 1:1).
 * 사유·상세·법적 근거·소비자 메시지·증빙은 필수, 반려 범위·귀책 변경은 선택이다(제출 = 즉시 확정).
 * 미입력은 에러 문구 없이 버튼만 비활성이다(전역 규칙).
 * 기-93: 착불(브랜드 귀책)로 신청한 건을 소비자 귀책으로 반려하면 브랜드가 낸 착불 운임을 소비자에게 청구한다.
 */
function RejectForm(props: {
  detail: ClaimDetailResponse
  onCancel: () => void
}) {
  const { detail, onCancel } = props
  const claimId = detail.summary.claimId
  const claimedQuantity = detail.summary.quantity
  const isExchange = detail.summary.type === "EXCHANGE"
  const mutations = useClaimMutations()
  const upload = useEvidenceUpload()
  const [reasonCode, setReasonCode] = useState<ClaimRejectReason | "">("")
  const [detailText, setDetailText] = useState("")
  const [legalBasis, setLegalBasis] = useState<ClaimRejectLegalBasis | "">("")
  const [partial, setPartial] = useState(false)
  const [rejectedQuantity, setRejectedQuantity] = useState("")
  const [faultChangedToSeller, setFaultChangedToSeller] = useState(false)
  const [consumerMessage, setConsumerMessage] = useState("")
  const chargesCollectFreight = isSellerBorne(detail) && !faultChangedToSeller
  const { data: preview } = useGetClaimFreightPreview(
    detail,
    isSellerBorne(detail)
  )

  const partialQuantity = Number(rejectedQuantity)
  // 일부 반려는 1 이상 · 신청 수량 미만 — 신청 수량과 같으면 전체 반려와 같다
  const quantityValid =
    !partial ||
    (Number.isInteger(partialQuantity) &&
      partialQuantity >= 1 &&
      partialQuantity < claimedQuantity)
  const canSubmit =
    !!reasonCode &&
    detailText.trim() !== "" &&
    !!legalBasis &&
    consumerMessage.trim() !== "" &&
    quantityValid &&
    upload.uploadedUrls.length > 0 &&
    !upload.uploading &&
    !mutations.reject.isPending

  const handleSubmit = async () => {
    if (!reasonCode || !legalBasis) return
    try {
      await mutations.reject.mutateAsync({
        claimId,
        body: {
          reasonCode,
          detail: detailText.trim(),
          legalBasis,
          rejectedQuantity: partial ? partialQuantity : undefined,
          faultChangedToSeller,
          consumerMessage: consumerMessage.trim(),
          evidenceImageUrls: upload.uploadedUrls,
        },
      })
      toast.success(
        "검수 반려를 제출했습니다. 소비자에게 사유와 증빙이 전달됩니다."
      )
      onCancel()
    } catch {
      // 토스트는 apiInstance가 띄운다
    }
  }

  return (
    <div className="mt-3 border-t border-sz-n-100 pt-3">
      <div className="mb-3 flex items-center justify-between text-[12px] font-semibold text-sz-n-900">
        검수 반려
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer text-[11px] font-normal text-sz-n-500 hover:text-sz-n-700"
        >
          접기
        </button>
      </div>

      <FieldLabel required first>
        반려 사유
      </FieldLabel>
      <select
        value={reasonCode}
        onChange={event =>
          setReasonCode(event.target.value as ClaimRejectReason | "")
        }
        style={FORM_SELECT_CHEVRON_STYLE}
        className={cn(SELECT_CLASS, "h-[34px] w-full")}
      >
        <option value="">선택하세요</option>
        {REJECT_REASON_OPTIONS.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <FieldLabel required>상세 설명</FieldLabel>
      <textarea
        value={detailText}
        onChange={event => setDetailText(event.target.value)}
        className={cn(TEXTAREA_CLASS, "min-h-16")}
        placeholder="브랜드·운영자 기록용 상세 설명입니다"
      />

      <FieldLabel required>반려 범위</FieldLabel>
      <div className="flex flex-wrap items-center gap-3.5 text-[12px] text-sz-n-700">
        <label className="flex cursor-pointer items-center gap-[5px]">
          <input
            type="radio"
            name="reject-scope"
            checked={!partial}
            onChange={() => setPartial(false)}
          />
          전체 반려
        </label>
        <label
          className={cn(
            "flex items-center gap-[5px]",
            claimedQuantity > 1 ? "cursor-pointer" : "text-sz-n-400"
          )}
        >
          <input
            type="radio"
            name="reject-scope"
            checked={partial}
            disabled={claimedQuantity <= 1}
            onChange={() => setPartial(true)}
          />
          일부 반려 <span className="text-sz-n-500">· 수량 지정</span>
        </label>
        {partial && (
          <span className="flex items-center gap-1.5">
            <input
              type="text"
              inputMode="numeric"
              aria-label="반려 수량"
              value={rejectedQuantity}
              onChange={event =>
                setRejectedQuantity(event.target.value.replace(/[^0-9]/g, ""))
              }
              className={cn(INPUT_CLASS, "h-[30px] w-16 text-right")}
            />
            <span className="text-sz-n-500">/ {claimedQuantity}개</span>
          </span>
        )}
      </div>
      {partial && rejectedQuantity !== "" && !quantityValid && (
        <p className={ERR_CLASS}>
          반려 수량은 1개 이상, 신청 수량({claimedQuantity}개)보다 적어야
          합니다.
        </p>
      )}
      {partial && (
        <Hint>
          나머지 수량은 검수 통과로 처리되고, 반품이면 바로 환불됩니다.
        </Hint>
      )}

      <FieldLabel required>법적 근거</FieldLabel>
      <select
        value={legalBasis}
        onChange={event =>
          setLegalBasis(event.target.value as ClaimRejectLegalBasis | "")
        }
        style={FORM_SELECT_CHEVRON_STYLE}
        className={cn(SELECT_CLASS, "h-[34px] w-full")}
      >
        <option value="">선택하세요</option>
        {REJECT_LEGAL_BASIS_OPTIONS.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <FieldLabel>귀책 변경</FieldLabel>
      <select
        value={faultChangedToSeller ? "SELLER" : "KEEP"}
        onChange={event =>
          setFaultChangedToSeller(event.target.value === "SELLER")
        }
        style={FORM_SELECT_CHEVRON_STYLE}
        className={cn(SELECT_CLASS, "h-[34px] w-full")}
      >
        <option value="KEEP">신청 때 귀책 유지 · 소비자 귀책</option>
        <option value="SELLER">브랜드 귀책으로 인정</option>
      </select>
      {faultChangedToSeller && (
        <Hint>
          차감한 최초 배송비가 환불에 돌아가고, 반려 재발송비는 브랜드가
          부담합니다.
        </Hint>
      )}

      <FieldLabel required>소비자에게 보낼 메시지</FieldLabel>
      <textarea
        value={consumerMessage}
        maxLength={REJECT_CONSUMER_MESSAGE_MAX}
        onChange={event => setConsumerMessage(event.target.value)}
        className={cn(TEXTAREA_CLASS, "min-h-16")}
        placeholder="소비자 화면(C10-5)에 그대로 표시됩니다"
      />

      <FieldLabel required>증빙 사진</FieldLabel>
      <EvidenceField title="개봉·사용 흔적이 보이는 사진" upload={upload} />

      {chargesCollectFreight && (
        <>
          <CollectFreightNotice />
          {preview && (
            <div className="mt-1">
              <AmountRow
                label="착불 운임(회수)"
                sub="브랜드가 낸 금액(상품 기본 배송비 정액) · 소비자 청구"
              >
                {formatWon(preview.freight)}
              </AmountRow>
              {!isExchange && (
                <AmountRow
                  label="환불액에서 차감"
                  sub="일부 반려 시 환불분에서 · 전체 반려면 재발송 시 청구"
                >
                  <b className="font-semibold">−{formatWon(preview.freight)}</b>
                </AmountRow>
              )}
            </div>
          )}
        </>
      )}

      <div className={cn(MWARN_CLASS, "mt-3")}>
        <b>제출과 동시에 반려가 확정되며</b> 소비자에게{" "}
        <b>사유와 증빙이 그대로 전달</b>됩니다. 이후 소비자가{" "}
        <b>재발송 배송비를 결제하면 상품을 다시 보내야</b> 합니다.
      </div>
      <Btn
        variant="dangerSolid"
        className="mt-3 w-full"
        disabled={!canSubmit}
        isLoading={mutations.reject.isPending}
        onClick={handleSubmit}
      >
        반려 제출
      </Btn>
    </div>
  )
}

/** 재발송 송장 등록·수정 — 우 레일 인라인 */
function ReshipBox(props: { detail: ClaimDetailResponse }) {
  const { detail } = props
  const { summary, actions } = detail
  const mutations = useClaimMutations()
  const isUpdate = actions.canUpdateReshipment && !actions.canRegisterReshipment
  const [carrier, setCarrier] = useState<DeliveryCarrier | "">(
    summary.reshipCarrier ?? ""
  )
  const [tracking, setTracking] = useState(summary.reshipTrackingNumber ?? "")
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(!isUpdate)

  useEffect(() => {
    setCarrier(summary.reshipCarrier ?? "")
    setTracking(summary.reshipTrackingNumber ?? "")
  }, [summary.reshipCarrier, summary.reshipTrackingNumber])

  const filled = !!carrier && tracking !== ""
  const pending =
    mutations.registerReshipments.isPending ||
    mutations.updateReshipment.isPending

  const handleSubmit = async () => {
    if (!carrier) return
    setError(null)
    try {
      if (isUpdate) {
        await mutations.updateReshipment.mutateAsync({
          claimId: summary.claimId,
          carrier,
          trackingNumber: tracking,
        })
        toast.success("재발송 송장을 수정했습니다.")
        setEditing(false)
        return
      }
      const result = await mutations.registerReshipments.mutateAsync([
        { claimId: summary.claimId, carrier, trackingNumber: tracking },
      ])
      if (result.skipped.length > 0) {
        setError(result.skipped[0].message)
        return
      }
      toast.success("재발송 송장을 등록했습니다.")
    } catch (caught) {
      setError(errorMessage(caught, "송장을 등록하지 못했습니다."))
    }
  }

  const isRejectReturn = summary.reshipReason === "REJECT_RETURN"

  return (
    <MBox title={isUpdate ? "재발송 중" : "재발송"} tight>
      <FRow label="보낼 상품">{summary.shipLabel ?? summary.productLabel}</FRow>
      <FRow label="재발송 사유">{summary.reshipReasonLabel ?? "—"}</FRow>
      {isRejectReturn && (
        <Notice tone="neutral" className="my-2">
          반려 반송은 교환 옵션이 아니라 <b>회수한 원래 상품</b>을 그대로 보내야
          합니다.
        </Notice>
      )}
      {editing ? (
        <div className="mt-3 rounded-[6px] border border-sz-accent-100 bg-sz-accent-50 p-3">
          <div className="mb-2 text-[12px] font-semibold text-sz-accent-600">
            {isUpdate ? "송장 수정" : "재발송 송장 등록"}
          </div>
          <label className="mb-[3px] block text-[11px] text-sz-n-600">
            택배사
          </label>
          <select
            value={carrier}
            onChange={event =>
              setCarrier(event.target.value as DeliveryCarrier | "")
            }
            style={FORM_SELECT_CHEVRON_STYLE}
            className="h-[30px] w-full cursor-pointer appearance-none rounded-[6px] border border-sz-n-300 bg-white pl-[9px] pr-[26px] text-[12px] outline-none focus:border-sz-accent-500"
          >
            <option value="">선택하세요</option>
            {CARRIER_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <label className="mb-[3px] mt-2 block text-[11px] text-sz-n-600">
            송장번호
          </label>
          <input
            value={tracking}
            inputMode="numeric"
            placeholder="숫자만 입력"
            onChange={event => setTracking(digitsOnly(event.target.value))}
            className={cn(
              "h-[30px] w-full rounded-[6px] border border-sz-n-300 bg-white px-[9px] text-[12px] tabular-nums outline-none focus:border-sz-accent-500",
              error && "border-sz-danger-text"
            )}
          />
          {error ? (
            <div className="mt-1 text-[10px] leading-[1.5] text-sz-danger-text">
              {error}
            </div>
          ) : (
            <div className="mt-1 text-[10px] leading-[1.5] text-sz-n-500">
              공백·하이픈은 자동으로 제거됩니다.
            </div>
          )}
          <div className="mt-3 flex gap-1.5">
            {isUpdate && (
              <Btn
                variant="ghost"
                className="h-7 flex-1 text-[11px]"
                onClick={() => setEditing(false)}
              >
                취소
              </Btn>
            )}
            <Btn
              variant="primary"
              className="h-7 flex-1 text-[11px]"
              disabled={!filled}
              isLoading={pending}
              onClick={handleSubmit}
            >
              {isUpdate ? "수정" : "등록"}
            </Btn>
          </div>
        </div>
      ) : (
        <>
          <FRow label="재발송 송장">
            <span className="tabular-nums">
              {summary.reshipCarrierLabel} {summary.reshipTrackingNumber}
            </span>
          </FRow>
          <Btn
            variant="secondary"
            className="mt-3 w-full"
            onClick={() => setEditing(true)}
          >
            송장 수정
          </Btn>
        </>
      )}
      <Hint>
        {isUpdate
          ? "재발송 송장은 도착 전까지 수정할 수 있습니다. 수정 내역은 이력에 남습니다."
          : "재발송 송장을 등록하면 완료 처리됩니다."}
      </Hint>
    </MBox>
  )
}

/** 반려 보류 — 고지 회차 · 보관 기한. 고지는 시스템 발송이라 브랜드 조치가 없다 */
function StorageBox(props: { detail: ClaimDetailResponse }) {
  const { detail } = props
  const storage = detail.summary.storage
  if (detail.inspection?.result === "REASON_OVERTURNED") {
    return <OverturnPaymentBox detail={detail} />
  }
  return (
    <MBox title="반려 보류" tight>
      <FRow label="반려 사유">{detail.summary.rejectReasonLabel ?? "—"}</FRow>
      <FRow label="반려일시">
        <span className="tabular-nums">
          {formatFullDateTime(detail.summary.rejectedAt)}
        </span>
      </FRow>
      <FRow label="미결제 고지">
        {detail.notices.length === 0
          ? "아직 고지 전"
          : detail.notices.map(notice => (
              <div key={notice.seq} className="tabular-nums">
                {notice.seq}회 · {formatFullDateTime(notice.notifiedAt)}
                {notice.channel && (
                  <span className="text-sz-n-500"> · {notice.channel}</span>
                )}
              </div>
            ))}
      </FRow>
      <FRow label="보관 기한">
        <span className="tabular-nums">
          {storage?.storageDueAt
            ? `${formatFullDateTime(storage.storageDueAt)}까지`
            : "고지 2회 후 확정"}
        </span>
      </FRow>
      <Hint>
        소비자가 <b>재발송 배송비를 결제하면 재발송 탭으로 이동</b>합니다.
        결제가 없으면 플랫폼이 <b>2회 이상 고지</b>하고{" "}
        <b>최종 고지일로부터 3개월간</b> 상품을 보관합니다. 보관 기한까지 반환
        요청을 기다립니다.
      </Hint>
    </MBox>
  )
}

/**
 * 교환 사유 번복 뒤 결제 대기(B2b → A6 재사용) — 서버는 반려 보류 상태에 사유 번복 청구를 건다.
 * 브랜드 조치는 없다. 결제가 확인되면 재발송 탭으로 넘어간다.
 */
function OverturnPaymentBox(props: { detail: ClaimDetailResponse }) {
  const { detail } = props
  const inspection = detail.inspection
  const fee = inspection?.overturnFee ?? detail.summary.reshipFee?.amount
  const dueAt = detail.summary.reshipFee?.dueAt ?? null
  return (
    <MBox title="사유 번복 · 결제 대기" tight>
      <FRow label="판정" sub={inspection?.explanation ?? undefined}>
        {inspection?.resultLabel ?? "사유 번복"}
      </FRow>
      {fee !== undefined && fee !== null && (
        <FRow label="소비자 결제 합계" sub="재발송 배송비 + 착불 운임">
          <span className="font-semibold tabular-nums">{formatWon(fee)}</span>
        </FRow>
      )}
      {dueAt && (
        <FRow label="결제 기한">
          <span className="tabular-nums">{formatFullDateTime(dueAt)}</span>
        </FRow>
      )}
      <Hint>
        소비자에게 <b>재발송 배송비 + 착불 운임 결제</b>가 요청됐습니다. 결제가
        확인되면 <b>재발송</b> 탭으로 넘어갑니다.
      </Hint>
    </MBox>
  )
}

/** 운임 정산 행(기-93) — 브랜드 정산 「± 운임 정산」과 같은 행. 1021 서버부터 내려온다 */
function FreightRows(props: { detail: ClaimDetailResponse }) {
  const rows = props.detail.inspection?.freight ?? []
  if (rows.length === 0) return null
  return (
    <FRow label="운임 정산" sub="브랜드 정산 「± 운임 정산」에 반영">
      {rows.map((row, index) => (
        <div key={`${row.trigger}-${index}`} className="tabular-nums">
          {row.triggerLabel} · {row.signedAmount > 0 ? "+" : "−"}
          {formatWon(Math.abs(row.signedAmount))}
        </div>
      ))}
    </FRow>
  )
}

/** 완료 탭 — 환불 완료 · 교환 완료 · 반려 종결(D1~D3) · 환불 대기 · 재발송 중 */
function ResultBox(props: { detail: ClaimDetailResponse }) {
  const { detail } = props
  const { summary, result } = detail
  const code = summary.outcome?.code

  return (
    <MBox title="처리 결과" tight>
      <FRow label="결과">{headerBadge(detail)}</FRow>
      {detail.inspection?.result === "REASON_OVERTURNED" && (
        <FRow label="판정" sub={detail.inspection.explanation ?? undefined}>
          {detail.inspection.resultLabel ?? "사유 번복"}
        </FRow>
      )}
      <FreightRows detail={detail} />

      {(code === "REFUNDED" || code === "REFUND_PENDING") && (
        <>
          <FRow label="환불 금액" sub={detail.refund?.basisLabel}>
            <span className="font-semibold tabular-nums">
              {summary.amount !== null
                ? formatWon(summary.amount)
                : detail.refund
                  ? formatWon(detail.refund.requestExpectedAmount)
                  : "—"}
            </span>
          </FRow>
          <FRow label="집행">
            {code === "REFUNDED" ? (
              <span className="tabular-nums">
                {formatFullDateTime(summary.completedAt)} · PG 자동 환불
              </span>
            ) : (
              "환불 대기"
            )}
          </FRow>
          <Hint>
            {code === "REFUNDED" ? (
              <>
                환불은 <b>PG가 자동으로 처리</b>했습니다. 정산에서 이 항목은
                제외됩니다.
              </>
            ) : (
              <>
                같은 박스의 판정이 모두 끝나면 <b>PG가 자동으로 환불</b>합니다.
                브랜드가 할 일은 없습니다.
              </>
            )}
          </Hint>
        </>
      )}

      {(code === "EXCHANGED" || code === "RESHIPPING") && (
        <>
          <FRow label="보낸 옵션">
            {summary.shipLabel ?? summary.productLabel}
          </FRow>
          <FRow label="재발송 송장">
            <span className="tabular-nums">
              {summary.reshipCarrierLabel ?? "—"}{" "}
              {summary.reshipTrackingNumber ?? ""}
            </span>
          </FRow>
          <FRow
            label="도착"
            sub={
              result?.confirmDueAt
                ? `구매확정 7일 재시작 · ${formatFullDateTime(result.confirmDueAt)} 예정`
                : undefined
            }
          >
            <span className="tabular-nums">
              {result?.reshipDeliveredAt
                ? formatFullDateTime(result.reshipDeliveredAt)
                : "배송 중"}
            </span>
          </FRow>
          <Hint>
            {SELLER_BORNE_REASONS.includes(summary.reasonCode) ? (
              <>
                {summary.reasonLabel} 사유라 교환 배송비는 <b>브랜드 부담</b>
                이고 정산 금액은 바뀌지 않습니다.
              </>
            ) : (
              <>
                고객 귀책 교환이라 재발송비는 소비자가 신청 때 결제했습니다.
                재발송비는 <b>브랜드 수취액에 더해집니다.</b>
              </>
            )}
          </Hint>
        </>
      )}

      {code === "REJECTED" && (
        <>
          <FRow
            label="반려 사유"
            sub={`브랜드 증빙 ${summary.sellerEvidenceCount}장 · ${formatFullDateTime(summary.rejectedAt)} 제출`}
          >
            {summary.rejectReasonLabel ?? "—"}
          </FRow>
          {result?.rejectionEnd === "DISPOSED" ? (
            <FRow label="종결">
              <span className="tabular-nums">
                보관 기간 만료 · {formatFullDateTime(result.disposedAt)}
              </span>
            </FRow>
          ) : (
            <>
              <FRow label="반송 송장" sub="소비자 재발송 배송비 결제 후 발송">
                <span className="tabular-nums">
                  {summary.reshipCarrierLabel ?? "—"}{" "}
                  {summary.reshipTrackingNumber ?? ""}
                </span>
              </FRow>
              <FRow label="반송 완료">
                <span className="tabular-nums">
                  {formatFullDateTime(
                    result?.reshipDeliveredAt ?? summary.completedAt
                  )}
                </span>
              </FRow>
            </>
          )}
          <Hint>
            반려로 종결되어 <b>환불은 없습니다</b>. 소비자 이의는 1:1 문의 →
            운영자 중재로 처리됩니다.
          </Hint>
        </>
      )}

      {code === "CANCELLED" && (
        <Hint>
          검수 전에 요청이 사라져 종결됐습니다(소비자 철회 · 회수 송장 미등록 ·
          운영자 직권). 환불도 반송도 없습니다.
        </Hint>
      )}
    </MBox>
  )
}
