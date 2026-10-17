import {
  ModalLabel,
  ModalShell,
} from "@/common/components/ModalShell/ModalShell"
import useDebounce from "@/common/hooks/useDebounce"
import Btn from "@/features/contracts/components/shared/Btn"
import {
  HINT_CLASS,
  INPUT_CLASS,
  TEXTAREA_CLASS,
} from "@/features/contracts/components/shared/styles"
import {
  MNote,
  MTAB_AMOUNT,
  MTAB_CELL,
  MTAB_ROW,
  MTAB_TBODY,
} from "@/features/settlement/components/detail/DetailParts"
import {
  invalidateSettlement,
  useGetAdjustmentPreview,
  useRequestSettlementAdjustment,
} from "@/features/settlement/hooks/useSettlementQueries"
import type {
  SettlementAdjustmentRequestResponse,
  SettlementDetail,
} from "@/features/settlement/types"
import {
  formatMonthDayTime,
  formatWon,
} from "@/features/settlement/utils/format"
import {
  getFieldErrorCode,
  getFieldErrorMessage,
} from "@/features/storeManagement/utils/apiFieldError"
import { cn } from "@/lib/utils"
import { useQueryClient } from "@tanstack/react-query"
import { useState, type ReactNode } from "react"
import toast from "react-hot-toast"

/** 원 단위 입력 — 12자리(9천억)면 정산 금액으로 충분하다 */
const MAX_DIGITS = 12
/** 서버 검사: 사유 1,000자 이하 */
const REASON_MAX = 1000
/** 입력이 멈춘 뒤 미리보기를 부르기까지 */
const PREVIEW_DEBOUNCE_MS = 300

/** 정산의 사실이 바뀌어 이 모달로는 요청할 수 없는 실패 — 닫고 화면을 서버 값으로 다시 읽는다 */
const STALE_CODES = [
  "SETTLEMENT_ADJUSTMENT_WINDOW_CLOSED",
  "SETTLEMENT_ADJUSTMENT_ALREADY_EXISTS",
  "SETTLEMENT_NOT_FOUND",
]

/**
 * 시안 C1 — 정산 조정 요청(D2의 [정산 조정 요청]).
 *
 * 바꿀 것은 **인플루언서 리워드 금액 하나**다. 상한과 인플루언서 실지급 · 브랜드 수취액은 서버
 * 미리보기(`GET …/adjustment/preview`)가 계산한다 — 화면은 산식을 들지 않고 입력을 디바운스로 보낸다.
 * 범위(0 ~ 상한 · 원래 금액과 다름)를 벗어나거나 사유가 비면 **에러 문구 없이 버튼 비활성**.
 * 보내면 정산 전액 보류 + 이슈 스레드 자동 개설(차액 선지급 없음). 근거 첨부는 2026.10.07에 삭제됐다.
 */
export default function AdjustmentRequestModal(props: {
  detail: SettlementDetail
  onClose: () => void
  onRequested: (response: SettlementAdjustmentRequestResponse) => void
}) {
  const { detail, onClose, onRequested } = props
  const id = detail.settlementId
  const queryClient = useQueryClient()
  const [digits, setDigits] = useState("")
  const [reason, setReason] = useState("")
  const [amountError, setAmountError] = useState<string | null>(null)
  const [reasonError, setReasonError] = useState<string | null>(null)

  const amount = digits === "" ? null : Number(digits)
  const debouncedAmount = useDebounce(amount, PREVIEW_DEBOUNCE_MS)

  // 모달 열기 — 상한 · 원래 금액 계산 · 요청 가능 여부
  const { data: base } = useGetAdjustmentPreview(id, null)
  // 입력 미리보기 — 범위 밖이면 서버가 preview = null · inRange = false(에러 아님)
  const {
    data: inputPreview,
    isFetching: isPreviewFetching,
    isPlaceholderData,
  } = useGetAdjustmentPreview(id, debouncedAmount, debouncedAmount !== null)

  const mutation = useRequestSettlementAdjustment(id)

  const max = base?.maxRewardAmount ?? null
  const original = base?.original ?? null
  const originalReward =
    base?.originalRewardAmount ?? detail.breakdown.rewardAmount
  // 지금 입력에 맞는 미리보기만 쓴다 — 디바운스 대기 · 이전 결과(placeholder)는 계산값이 아니다
  const settled =
    amount !== null &&
    amount === debouncedAmount &&
    !isPlaceholderData &&
    inputPreview?.input?.rewardAmount === amount
  const preview = settled ? (inputPreview?.preview ?? null) : null
  const stalePreview =
    !settled && amount !== null ? (inputPreview?.preview ?? null) : null
  const shown = preview ?? stalePreview
  const isBusiness = detail.influencerTax.businessType === "BUSINESS"

  const canSubmit =
    base?.canRequest === true &&
    settled &&
    inputPreview?.inRange === true &&
    amount !== originalReward &&
    reason.trim() !== "" &&
    !mutation.isPending

  const handleSubmit = () => {
    if (!canSubmit || amount === null) return
    setAmountError(null)
    setReasonError(null)
    mutation.mutate(
      { rewardAmount: amount, reason: reason.trim() },
      {
        onSuccess: onRequested,
        onError: error => {
          const code = getFieldErrorCode(error)
          const message = getFieldErrorMessage(
            error,
            "정산 조정을 요청하지 못했습니다. 다시 시도해 주세요."
          )
          if (code === "SETTLEMENT_ADJUSTMENT_AMOUNT_OUT_OF_RANGE") {
            setAmountError(message)
            return
          }
          if (code === "SETTLEMENT_ADJUSTMENT_REASON_REQUIRED") {
            setReasonError(message)
            return
          }
          if (code && STALE_CODES.includes(code)) {
            toast.error(message)
            invalidateSettlement(queryClient, id)
            onClose()
            return
          }
          // 503 GROUP_BUY_THREAD_UNAVAILABLE(인플루언서 연결 끊김) · 입력 검증 · 네트워크 — 모달은 열어 둔다
          toast.error(message)
        },
      }
    )
  }

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
            isLoading={mutation.isPending}
            onClick={handleSubmit}
          >
            정산 조정 요청
          </Btn>
        </>
      }
    >
      <div className="mb-3">
        {detail.groupBuy.title} · {detail.influencer.showroomName}
        <br />
        원래 리워드 <B>{formatWon(originalReward)}</B> · 확인 기간{" "}
        <B>
          {formatMonthDayTime(base?.reviewEndsAt ?? detail.dates.reviewDueAt)}
        </B>
        까지
      </div>

      <ModalLabel required>조정할 리워드 금액</ModalLabel>
      <input
        aria-label="조정할 리워드 금액"
        inputMode="numeric"
        autoFocus
        className={cn(
          INPUT_CLASS,
          "w-full text-right tabular-nums",
          amountError && "border-sz-danger-text"
        )}
        value={amount === null ? "" : amount.toLocaleString("ko-KR")}
        onChange={event => {
          setAmountError(null)
          setDigits(
            event.target.value
              .replace(/\D/g, "")
              .replace(/^0+(?=\d)/, "")
              .slice(0, MAX_DIGITS)
          )
        }}
      />
      <div className={HINT_CLASS}>
        {max === null
          ? "조정할 수 있는 범위를 불러오는 중입니다"
          : `0원 ~ ${formatWon(max)}(리워드 + 부가세가 브랜드 수취액을 넘지 않는 범위) 안에서 원래 금액과 다르게 입력할 수 있습니다`}
      </div>
      {amountError && (
        <div className="mt-1 text-[11px] text-sz-danger-text">
          {amountError}
        </div>
      )}

      <table className="mt-2.5 w-full border-collapse text-[12px]">
        <tbody
          className={cn(
            MTAB_TBODY,
            // 직전 입력의 계산값을 잠깐 보여 주는 동안은 흐리게 — 새 계산이 오면 바뀐다
            (stalePreview !== null || (!preview && isPreviewFetching)) &&
              "opacity-60"
          )}
        >
          <PreviewRow
            label="인플루언서 실지급"
            note={
              isBusiness
                ? "사업자 · 원천징수 없음 · 부가세 포함"
                : shown
                  ? `원천징수 ${formatWon(shown.withholdingAmount)} 차감 후`
                  : "원천징수 차감 후"
            }
            value={shown ? formatWon(shown.creatorNetAmount) : "—"}
          />
          <PreviewRow
            label="브랜드 수취액"
            note={
              original
                ? `원래 ${formatWon(original.brandPayoutAmount)}`
                : "원래 금액 불러오는 중"
            }
            value={shown ? formatWon(shown.brandPayoutAmount) : "—"}
          />
        </tbody>
      </table>

      <div className="mt-3">
        <ModalLabel required>사유</ModalLabel>
        <textarea
          aria-label="사유"
          className={cn(TEXTAREA_CLASS, reasonError && "border-sz-danger-text")}
          placeholder="조정이 필요한 이유를 적어주세요."
          maxLength={REASON_MAX}
          value={reason}
          onChange={event => {
            setReasonError(null)
            setReason(event.target.value)
          }}
        />
        {reasonError && (
          <div className="mt-1 text-[11px] text-sz-danger-text">
            {reasonError}
          </div>
        )}
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

/** 시안의 맨 `<b>` — 색은 본문(n-700)을 그대로 잇고 굵기만 브라우저 기본(700) */
function B({ children }: { children: ReactNode }) {
  return <b>{children}</b>
}

/** 시안 `.mtab tr.sub` */
function PreviewRow(props: { label: string; note: string; value: string }) {
  return (
    <tr className={cn(MTAB_ROW, "text-sz-n-600")}>
      <td className={MTAB_CELL}>
        {props.label}
        <MNote>{props.note}</MNote>
      </td>
      <td className={cn(MTAB_AMOUNT, "text-sz-n-700")}>{props.value}</td>
    </tr>
  )
}
