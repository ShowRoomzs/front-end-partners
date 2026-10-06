import StatusBadge from "@/common/components/StatusBadge/StatusBadge"
import Notice from "@/common/components/Notice/Notice"
import { fileService } from "@/common/services/fileService"
import Btn from "@/features/contracts/components/shared/Btn"
import {
  ERR_CLASS,
  FLINK_CLASS,
  SELECT_CLASS,
  TEXTAREA_CLASS,
  WTAG_CLASS,
} from "@/features/contracts/components/shared/styles"
import { FORM_SELECT_CHEVRON_STYLE } from "@/features/contracts/constants/params"
import {
  CARRIER_OPTIONS,
  EVIDENCE_FILE_TYPES,
  EVIDENCE_MAX_BYTES,
  EVIDENCE_MAX_COUNT,
  OPERATOR_THREAD_PATH,
  REJECT_LEGAL_BASIS_OPTIONS,
  REJECT_REASON_OPTIONS,
  SELLER_BORNE_REASONS,
} from "@/features/claims/constants/params"
import {
  FRow,
  Hint,
  HistoryRows,
  MBox,
  WideModal,
} from "@/features/claims/components/detail/DetailParts"
import PassConfirmModal from "@/features/claims/components/modals/PassConfirmModal"
import {
  useClaimMutations,
  useGetClaimDetail,
} from "@/features/claims/hooks/useClaimQueries"
import type {
  ClaimDetailResponse,
  ClaimRejectReason,
  DeliveryCarrier,
} from "@/features/claims/types"
import {
  digitsOnly,
  formatFullDateTime,
  formatWon,
} from "@/features/claims/utils/format"
import { cn } from "@/lib/utils"
import { isAxiosError } from "axios"
import { Loader2, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
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
}

/** 서버 반려 요청에 아직 없는 입력 — 화면에는 두되 제출되지 않는다는 것을 밝힌다 */
function PendingTag() {
  return <span className={WTAG_CLASS}>서버 연동 전 · 제출되지 않음</span>
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

function DetailBody(props: { detail: ClaimDetailResponse }) {
  const { detail } = props
  const { summary, actions } = detail
  const navigate = useNavigate()
  const mutations = useClaimMutations()
  const [passOpen, setPassOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)

  const isExchange = summary.type === "EXCHANGE"
  const isInspecting = actions.canPass || actions.canReject
  const detailRequired = SELLER_BORNE_REASONS.includes(summary.reasonCode)

  const handleReceive = async () => {
    try {
      const result = await mutations.receive.mutateAsync([summary.claimId])
      if (result.skipped.length > 0) {
        toast.error(result.skipped[0].message)
        return
      }
      toast.success("입고 확인했습니다. 2영업일 안에 검수를 완료해 주세요.")
    } catch {
      // 토스트는 apiInstance가 띄운다
    }
  }

  const handlePass = async () => {
    try {
      await mutations.pass.mutateAsync(summary.claimId)
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
          <FRow
            label="사유"
            sub={
              isExchange && detail.exchangeFeeCharged !== null
                ? detail.exchangeFeeCharged
                  ? "고객 귀책 교환 · 재발송비 신청 시 결제"
                  : "교환비 미청구"
                : summary.consumerAttachmentCount > 0
                  ? `증빙 ${summary.consumerAttachmentCount}장`
                  : undefined
            }
          >
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
                  까지 · 2영업일
                </>
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
                    ` · 배송비 차감 −${formatWon(detail.refund.requestDeduction)}`}{" "}
                  · {detail.refund.basisLabel} — 검수 통과 시{" "}
                  <b className="font-semibold">PG가 자동으로 환불</b>합니다.
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
            title="브랜드 반려 증빙"
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
              <span className="text-sz-warning-text">정지</span>
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
              {actions.canReject && !rejectOpen && (
                <Btn
                  variant="secondary"
                  className="w-full"
                  onClick={() => setRejectOpen(true)}
                >
                  검수 반려
                </Btn>
              )}
            </div>
            {isExchange ? (
              <>
                <Hint>
                  <b>검수 통과 · 재발송</b> — 교환 옵션 상품을 출고하고{" "}
                  <b>새 송장을 등록</b>하면 완료됩니다.
                </Hint>
                <Hint className="mt-2">
                  <b>검수 반려</b> — 반려가 확정되면 <b>교환이 취소</b>되고,
                  소비자가 배송비를 결제한 뒤 <b>회수한 원래 상품을 그대로</b>{" "}
                  다시 보내게 됩니다.
                </Hint>
              </>
            ) : (
              <Hint>
                <b>검수 통과로 처리하면 PG가 자동으로 환불</b>합니다. 환불
                금액은 정산에 반영됩니다.{" "}
                <b>브랜드는 금액을 입력하거나 환불을 실행하지 않습니다.</b>
              </Hint>
            )}
            <Hint className="mt-2">
              부당한 신청이라고 판단되면{" "}
              <span
                role="link"
                tabIndex={0}
                className={FLINK_CLASS}
                onClick={() => navigate(OPERATOR_THREAD_PATH)}
              >
                운영자 문의
              </span>{" "}
              — 회수를 중단할 수는 없습니다.
            </Hint>
            {rejectOpen && actions.canReject && (
              <RejectForm
                claimId={summary.claimId}
                onCancel={() => setRejectOpen(false)}
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

interface Evidence {
  key: string
  name: string
  url: string | null
}

/**
 * 시안 B1r — 검수 반려 폼. 사유·설명·증빙이 모두 필수다(제출 = 즉시 확정, 소비자에게 그대로 전달).
 * 미입력은 에러 문구 없이 버튼만 비활성이다(전역 규칙).
 *
 * 반려 범위·법적 근거·귀책 변경·소비자 메시지는 시안(소비자 C10-5와 1:1)에 있지만 서버 반려 요청에
 * 필드가 없다 — 화면에 두되 비활성으로 「제출되지 않음」을 밝힌다(백엔드 요청 대상).
 */
function RejectForm(props: { claimId: number; onCancel: () => void }) {
  const { claimId, onCancel } = props
  const mutations = useClaimMutations()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [reasonCode, setReasonCode] = useState<ClaimRejectReason | "">("")
  const [detailText, setDetailText] = useState("")
  const [evidences, setEvidences] = useState<Array<Evidence>>([])
  const [uploadError, setUploadError] = useState<string | null>(null)

  const uploading = evidences.some(item => item.url === null)
  const uploaded = evidences.filter(
    (item): item is Evidence & { url: string } => item.url !== null
  )
  const canSubmit =
    !!reasonCode &&
    detailText.trim() !== "" &&
    uploaded.length > 0 &&
    !uploading &&
    !mutations.reject.isPending

  const handleFiles = async (files: FileList | null) => {
    if (!files) return
    setUploadError(null)
    const room = EVIDENCE_MAX_COUNT - evidences.length
    const picked = Array.from(files).slice(0, room)
    if (files.length > room) {
      setUploadError(
        `증빙 사진은 최대 ${EVIDENCE_MAX_COUNT}장까지 올릴 수 있습니다.`
      )
    }
    for (const file of picked) {
      if (!EVIDENCE_FILE_TYPES.includes(file.type)) {
        setUploadError("PNG · JPG 파일만 올릴 수 있습니다.")
        continue
      }
      if (file.size > EVIDENCE_MAX_BYTES) {
        setUploadError("10MB 이하 파일만 올릴 수 있습니다.")
        continue
      }
      const key = `${file.name}-${file.size}-${Date.now()}`
      setEvidences(prev => [...prev, { key, name: file.name, url: null }])
      try {
        // 클레임 증빙 전용 이미지 타입이 아직 없다 — 소비자에게 보여야 하는 공개 이미지라 MARKET을 쓴다
        const data = (await fileService.upload(file, "MARKET")) as {
          imageUrl: string
        }
        setEvidences(prev =>
          prev.map(item =>
            item.key === key ? { ...item, url: data.imageUrl } : item
          )
        )
      } catch {
        setEvidences(prev => prev.filter(item => item.key !== key))
      }
    }
  }

  const handleSubmit = async () => {
    if (!reasonCode) return
    try {
      await mutations.reject.mutateAsync({
        claimId,
        body: {
          reasonCode,
          detail: detailText.trim(),
          evidenceImageUrls: uploaded.map(item => item.url),
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
        placeholder="소비자에게 그대로 전달되는 내용입니다"
      />

      <FieldLabel extra={<PendingTag />}>반려 범위</FieldLabel>
      <div className="flex gap-3.5 text-[12px] text-sz-n-400">
        <label className="flex items-center gap-[5px]">
          <input type="radio" disabled defaultChecked name="reject-scope" />
          전체 반려
        </label>
        <label className="flex items-center gap-[5px]">
          <input type="radio" disabled name="reject-scope" />
          일부 반려 <span>· 수량 지정</span>
        </label>
      </div>

      <FieldLabel extra={<PendingTag />}>법적 근거</FieldLabel>
      <select
        disabled
        style={FORM_SELECT_CHEVRON_STYLE}
        className={cn(SELECT_CLASS, "h-[34px] w-full")}
      >
        <option>선택하세요</option>
        {REJECT_LEGAL_BASIS_OPTIONS.map(option => (
          <option key={option}>{option}</option>
        ))}
      </select>

      <FieldLabel extra={<PendingTag />}>귀책 변경</FieldLabel>
      <select
        disabled
        style={FORM_SELECT_CHEVRON_STYLE}
        className={cn(SELECT_CLASS, "h-[34px] w-full")}
      >
        <option>변경 없음 · 소비자 귀책</option>
        <option>브랜드 귀책으로 인정</option>
      </select>

      <FieldLabel extra={<PendingTag />}>소비자에게 보낼 메시지</FieldLabel>
      <textarea
        disabled
        className={cn(TEXTAREA_CLASS, "min-h-16 disabled:bg-sz-n-100")}
        placeholder="소비자 화면(C10-5)에 그대로 표시됩니다"
      />

      <FieldLabel required>증빙 사진</FieldLabel>
      <div className="rounded-[8px] border-[1.5px] border-dashed border-sz-n-300 bg-sz-n-50 p-4 text-center">
        <div className="text-[12px] font-semibold text-sz-n-900">
          개봉·사용 흔적이 보이는 사진
        </div>
        <div className="mt-[3px] text-[11px] text-sz-n-500">
          PNG · JPG · 10MB 이하 · 최대 {EVIDENCE_MAX_COUNT}장
        </div>
        <Btn
          variant="secondary"
          className="mt-2"
          disabled={evidences.length >= EVIDENCE_MAX_COUNT}
          onClick={() => fileInputRef.current?.click()}
        >
          파일 선택
        </Btn>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={EVIDENCE_FILE_TYPES.join(",")}
          className="hidden"
          onChange={event => {
            void handleFiles(event.target.files)
            event.target.value = ""
          }}
        />
      </div>
      {uploadError && <p className={ERR_CLASS}>{uploadError}</p>}
      {evidences.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {evidences.map(item => (
            <div
              key={item.key}
              className="relative size-14 overflow-hidden rounded-[6px] border border-sz-n-200 bg-sz-n-100"
            >
              {item.url ? (
                <img
                  src={item.url}
                  alt={item.name}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center">
                  <Loader2 className="size-4 animate-spin text-sz-n-400" />
                </div>
              )}
              {item.url && (
                <button
                  type="button"
                  aria-label={`${item.name} 삭제`}
                  onClick={() =>
                    setEvidences(prev =>
                      prev.filter(evidence => evidence.key !== item.key)
                    )
                  }
                  className="absolute right-0.5 top-0.5 flex size-4 cursor-pointer items-center justify-center rounded-full bg-black/55 text-white"
                >
                  <X className="size-2.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 rounded-[6px] border border-sz-n-200 bg-sz-n-50 px-[13px] py-[11px] text-[11px] leading-[1.7] text-sz-n-700">
        <b className="font-semibold text-sz-n-900">
          제출과 동시에 반려가 확정되며
        </b>{" "}
        소비자에게{" "}
        <b className="font-semibold text-sz-n-900">사유와 증빙이 그대로 전달</b>
        됩니다. 이후 소비자가{" "}
        <b className="font-semibold text-sz-n-900">
          재배송비를 결제하면 상품을 다시 보내야
        </b>{" "}
        합니다.
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
        소비자가 <b>재배송비를 결제하면 재발송 탭으로 이동</b>합니다. 결제가
        없으면 플랫폼이 <b>2회 이상 고지</b>하고{" "}
        <b>최종 고지일로부터 3개월간</b> 상품을 보관합니다. 보관 기한까지 반환
        요청을 기다립니다.
      </Hint>
    </MBox>
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
              <FRow label="반송 송장" sub="소비자 재배송비 결제 후 발송">
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
