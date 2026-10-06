import Notice from "@/common/components/Notice/Notice"
import { parseServerDateTime } from "@/common/utils/formatDate"
import dayjs from "dayjs"
import StatusBadge from "@/common/components/StatusBadge/StatusBadge"
import Btn from "@/features/contracts/components/shared/Btn"
import { FLINK_CLASS } from "@/features/contracts/components/shared/styles"
import { B, FRow, FSub } from "@/features/groupBuy/components/shared/GbParts"
import {
  ApproveCancelModal,
  DirectCancelModal,
  PrepareStartModal,
  RejectCancelModal,
} from "@/features/orders/components/modals/OrderActionModals"
import {
  DCount,
  MBox,
  MRow,
  OrderBadge,
  SelectSm,
  ShipRow,
  StHint,
  TrackBox,
} from "@/features/orders/components/shared/OrderParts"
import { CARRIERS, trackingUrlOf } from "@/features/orders/constants/params"
import {
  useApproveCancelRequest,
  useDirectCancel,
  usePrepareStart,
  useRegisterShipments,
  useRejectCancelRequest,
  useUpdateShipment,
} from "@/features/orders/hooks/useOrderMutations"
import { useGetOrderDetail } from "@/features/orders/hooks/useOrderQueries"
import { errorMessageOf } from "@/features/orders/services/orderService"
import type {
  DeliveryCarrier,
  OrderDetailResponse,
  OrderHistoryItem,
} from "@/features/orders/types"
import {
  formatDateTime,
  formatElapsedHours,
  formatNumber,
  formatWon,
  hoursSince,
  itemBadge,
  optionText,
  sanitizeTrackingNumber,
  formatTrackingNumber,
} from "@/features/orders/utils/view"
import { cn } from "@/lib/utils"
import { Loader2, X } from "lucide-react"
import { useCallback, useEffect, useState, type ReactNode } from "react"
import toast from "react-hot-toast"
import { Link, useNavigate } from "react-router-dom"

type SubModal = "prepare" | "cancel" | "approve" | "reject" | null

/**
 * 주문 상세 모달(C1~C13) — 전체 페이지가 아니라 모달이다(rev.2). 목록의 스크롤 위치·필터·체크박스 선택을
 * 잃지 않고, 헤더 [‹ 이전][다음 ›]로 연속 처리한다. 폭 1040px · 좌 본문 + 우 레일.
 *
 * 모달 안에서 또 모달을 띄우지 않는다 — 송장 등록·수정은 필드가 2개라 우 레일 인라인으로 펼친다.
 * 준비 시작·직권 취소·취소 요청 승인/거부는 확인 한 번이라 작은 다이얼로그로 겹친다.
 * 어떤 버튼을 보일지는 서버의 `actions`가 정한다.
 */
export default function OrderDetailModal(props: {
  deliveryGroupId: number
  /** 열 때의 목록 순서 — 처리 뒤 행이 목록에서 빠져도 이전/다음이 흔들리지 않게 고정한다 */
  navigationIds: Array<number>
  onNavigate: (deliveryGroupId: number) => void
  onClose: () => void
}) {
  const { deliveryGroupId, navigationIds, onNavigate, onClose } = props
  const {
    data: detail,
    isLoading,
    isError,
  } = useGetOrderDetail(deliveryGroupId)
  const [subModal, setSubModal] = useState<SubModal>(null)

  const prepareStart = usePrepareStart()
  const directCancel = useDirectCancel()
  const approve = useApproveCancelRequest()
  const reject = useRejectCancelRequest()

  const index = navigationIds.indexOf(deliveryGroupId)
  const prevId = index > 0 ? navigationIds[index - 1] : null
  const nextId =
    index >= 0 && index < navigationIds.length - 1
      ? navigationIds[index + 1]
      : null

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // 겹친 확인창이 떠 있으면 그 창만 닫는다(그쪽이 Esc를 처리한다)
      if (event.key === "Escape" && subModal === null) {
        event.preventDefault()
        onClose()
      }
    },
    [onClose, subModal]
  )

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  const showBatchResult = (
    action: string,
    result: { succeeded: number; skipped: Array<{ message: string }> }
  ) => {
    if (result.succeeded > 0) {
      toast.success(action)
    } else if (result.skipped[0]) {
      toast.error(result.skipped[0].message)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(26,27,31,0.4)]">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="주문 상세"
        className="flex max-h-[92vh] w-[1040px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-[8px] bg-white shadow-[0_8px_24px_rgba(26,27,31,0.12),0_2px_6px_rgba(26,27,31,0.08)]"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-sz-n-200 px-5 py-3.5">
          <span className="flex items-center gap-2.5 text-[13px] font-semibold text-sz-n-900">
            {detail?.orderNumber ?? "주문 상세"}
            {detail && <HeaderBadges detail={detail} />}
          </span>
          <span className="ml-auto flex items-center gap-1.5">
            <NavButton
              disabled={prevId === null}
              onClick={() => prevId !== null && onNavigate(prevId)}
            >
              ‹ 이전
            </NavButton>
            <NavButton
              disabled={nextId === null}
              onClick={() => nextId !== null && onNavigate(nextId)}
            >
              다음 ›
            </NavButton>
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="ml-1.5 cursor-pointer text-sz-n-400 hover:text-sz-n-600"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </span>
        </div>

        <div className="min-h-0 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-24 text-sz-n-400">
              <Loader2 className="size-5 animate-spin" aria-hidden />
            </div>
          ) : isError || !detail ? (
            <div className="py-24 text-center text-[12px] text-sz-n-500">
              주문을 불러오지 못했습니다. 목록을 새로고침한 뒤 다시 열어 주세요.
            </div>
          ) : (
            <div className="grid grid-cols-[minmax(0,1fr)_300px] items-start gap-4 px-5 pb-5 pt-4">
              <div className="flex min-w-0 flex-col gap-3">
                {detail.cancelRequest && <CancelRequestBox detail={detail} />}
                <OrderInfoBox detail={detail} onClose={onClose} />
                <RecipientBox detail={detail} />
                <ItemsBox detail={detail} />
              </div>
              <div className="flex min-w-0 flex-col gap-3">
                <StatusBox
                  key={detail.deliveryGroupId}
                  detail={detail}
                  onOpen={setSubModal}
                />
                <ShippingBox detail={detail} />
                <HistoryBox history={detail.history} />
              </div>
            </div>
          )}
        </div>
      </div>

      {detail && subModal === "prepare" && (
        <PrepareStartModal
          count={1}
          isLoading={prepareStart.isPending}
          onClose={() => setSubModal(null)}
          onConfirm={() =>
            prepareStart.mutate([detail.deliveryGroupId], {
              onSuccess: result => {
                showBatchResult(
                  "준비를 시작했습니다. 상품준비중에서 송장을 등록하세요.",
                  result
                )
                setSubModal(null)
              },
            })
          }
        />
      )}
      {detail && subModal === "cancel" && (
        <DirectCancelModal
          target={{
            ids: [detail.deliveryGroupId],
            single: {
              orderNumber: detail.orderNumber,
              recipientName: detail.recipient.name,
              productSummary: summarizeItems(detail),
              totalQuantity: detail.items
                .filter(item => !item.cancelled)
                .reduce((sum, item) => sum + item.quantity, 0),
              refundAmount:
                detail.amounts.totalAmount - detail.amounts.cancelledAmount,
            },
          }}
          isLoading={directCancel.isPending}
          onClose={() => setSubModal(null)}
          onConfirm={(reasonCode, consumerMessage) =>
            directCancel.mutate(
              {
                deliveryGroupIds: [detail.deliveryGroupId],
                reasonCode,
                consumerMessage,
              },
              {
                onSuccess: result => {
                  showBatchResult(
                    "주문을 취소했습니다. 환불은 운영자가 실행합니다.",
                    result
                  )
                  setSubModal(null)
                },
              }
            )
          }
        />
      )}
      {detail && subModal === "approve" && detail.cancelRequest && (
        <ApproveCancelModal
          detail={detail}
          isLoading={approve.isPending}
          onClose={() => setSubModal(null)}
          onConfirm={() =>
            approve.mutate(detail.cancelRequest!.cancelRequestId, {
              onSuccess: () => {
                toast.success(
                  "취소 요청을 승인했습니다. 환불은 운영자가 실행합니다."
                )
                setSubModal(null)
              },
            })
          }
        />
      )}
      {detail && subModal === "reject" && detail.cancelRequest && (
        <RejectCancelModal
          detail={detail}
          isLoading={reject.isPending}
          onClose={() => setSubModal(null)}
          onConfirm={reason =>
            reject.mutate(
              {
                cancelRequestId: detail.cancelRequest!.cancelRequestId,
                reason,
              },
              {
                onSuccess: () => {
                  toast.success(
                    "취소 요청을 거부했습니다. 사유가 소비자에게 전달됩니다."
                  )
                  setSubModal(null)
                },
              }
            )
          }
        />
      )}
    </div>
  )
}

function NavButton(props: {
  disabled: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      disabled={props.disabled}
      onClick={props.onClick}
      className="inline-flex h-8 cursor-pointer items-center whitespace-nowrap rounded-[6px] border border-sz-n-300 bg-white px-3 text-[12px] font-medium text-sz-n-700 hover:border-sz-n-400 hover:bg-sz-n-100 hover:text-sz-n-900 disabled:cursor-not-allowed disabled:border-sz-n-200 disabled:bg-sz-n-100 disabled:text-sz-n-400"
    >
      {props.children}
    </button>
  )
}

function summarizeItems(detail: OrderDetailResponse) {
  const live = detail.items.filter(item => !item.cancelled)
  if (live.length === 0) {
    return "—"
  }
  return live.length === 1
    ? live[0].productName
    : `${live[0].productName} 외 ${live.length - 1}건`
}

/** 헤더 배지 — 이행 상태 + 오버레이(취소 요청 · 배송 이상). 오버레이는 상태가 아니라 덧붙는다 */
function HeaderBadges(props: { detail: OrderDetailResponse }) {
  const { detail } = props
  return (
    <>
      <OrderBadge tone={detail.statusTone}>{detail.statusLabel}</OrderBadge>
      {detail.overlays.cancelRequested && (
        <StatusBadge variant="warning">취소 요청</StatusBadge>
      )}
      {detail.overlays.trackingAlert && (
        <StatusBadge
          variant={
            detail.overlays.trackingAlert === "STALLED" ? "danger" : "warning"
          }
        >
          {detail.overlays.trackingAlertLabel}
        </StatusBadge>
      )}
    </>
  )
}

/** 우 레일 「현재 상태」 — 손댈 일이 걸린 오버레이가 있으면 그것을 짚는다(C6 · C11) */
function CurrentBadge(props: { detail: OrderDetailResponse }) {
  const { detail } = props
  if (detail.overlays.cancelRequested) {
    return <StatusBadge variant="warning">취소 요청</StatusBadge>
  }
  if (detail.overlays.trackingAlert === "PICKUP_UNCONFIRMED") {
    return (
      <StatusBadge variant="warning">
        {detail.overlays.trackingAlertLabel}
      </StatusBadge>
    )
  }
  return <OrderBadge tone={detail.statusTone}>{detail.statusLabel}</OrderBadge>
}

// ── 좌 본문 ──────────────────────────────────────────

/** C11 — 판단 근거를 한 화면에. 요청 사유 · 언제 들어왔는지 · 준비 상황 */
function CancelRequestBox(props: { detail: OrderDetailResponse }) {
  const { detail } = props
  const request = detail.cancelRequest!
  return (
    <MBox
      title="소비자 취소 요청"
      sub={`${formatDateTime(request.requestedAt)} 접수 · 응답 필요`}
    >
      <FRow label="요청 사유">
        {request.reasonLabel}
        {request.reasonDetail && ` · ${request.reasonDetail}`}
      </FRow>
      <FRow label="요청일시">
        <span className="tabular-nums">
          {formatDateTime(request.requestedAt)}
        </span>
        <FSub>
          {request.hoursSincePrepareStart !== null ? (
            <>
              준비 시작{" "}
              <B>{formatElapsedHours(request.hoursSincePrepareStart)} 후</B>{" "}
              접수
            </>
          ) : (
            "준비 시작 전 접수"
          )}
        </FSub>
      </FRow>
      <FRow label="요청 항목">
        {request.items
          .map(
            item =>
              `${item.productName}(${optionText(item.optionName)}) ${item.quantity}개`
          )
          .join(", ")}
        <FSub>
          {request.remainingItemCount === 0
            ? "전 항목 요청"
            : `남은 ${request.remainingItemCount}건 발송 대기`}
        </FSub>
      </FRow>
      {detail.status === "PREPARING" && (
        <Notice tone="warn" className="mt-3">
          <B>이미 준비를 시작한 주문입니다.</B> 아직 발송하지 않았다면 승인해도
          손실이 없지만, <B>포장·출고가 끝났다면 거부하고 반품으로 안내</B>하는
          편이 낫습니다.
        </Notice>
      )}
    </MBox>
  )
}

function OrderInfoBox(props: {
  detail: OrderDetailResponse
  onClose: () => void
}) {
  const { detail, onClose } = props
  const navigate = useNavigate()
  return (
    <MBox title="주문 정보">
      <FRow label="주문번호">
        <span className="tabular-nums">{detail.orderNumber}</span>
        <FSub>
          하위주문 {detail.subOrderNumber} · <B>이 공구 몫만</B> 표시됩니다
        </FSub>
      </FRow>
      <FRow label="주문일시">
        <span className="tabular-nums">{formatDateTime(detail.orderedAt)}</span>
      </FRow>
      <FRow label="공구명">
        {detail.groupBuyName ?? "—"}{" "}
        {detail.groupBuyId !== null && (
          <button
            type="button"
            className={FLINK_CLASS}
            onClick={() => {
              onClose()
              navigate(`/group-buy/${detail.groupBuyId}`)
            }}
          >
            공구 상세
          </button>
        )}
      </FRow>
      <FRow label="결제수단">{detail.paymentMethod ?? "—"}</FRow>
    </MBox>
  )
}

/** 배송지 — 마스킹 해제. 브랜드가 실제 송장을 찍는 주체다(소비자 입력 · 브랜드는 수정 불가) */
function RecipientBox(props: { detail: OrderDetailResponse }) {
  const { recipient } = props.detail
  return (
    <MBox
      title="배송지"
      sub={
        <>
          소비자 입력 · <B>실명·연락처 전체 표기</B> · 브랜드는 수정 불가
        </>
      }
    >
      <FRow label="수취인">{recipient.name}</FRow>
      <FRow label="연락처">
        <span className="tabular-nums">{recipient.phone}</span>
      </FRow>
      <FRow label="주소">
        ({recipient.zipCode}) {recipient.address}
        {recipient.detailAddress && `, ${recipient.detailAddress}`}
      </FRow>
      <FRow label="배송 요청사항">
        {recipient.deliveryMemo ? (
          <B className="text-sz-warning-text">{recipient.deliveryMemo}</B>
        ) : (
          "없음"
        )}
      </FRow>
    </MBox>
  )
}

/**
 * 주문 항목 · 금액 — 취소·반품·교환은 항목 단위다. 취소 항목은 취소선(준비하지 말라는 신호),
 * 요청 대상 항목은 경고 톤. 부분 취소는 배송비를 재계산하지 않는다(남은 항목이 그대로 나간다).
 */
function ItemsBox(props: { detail: OrderDetailResponse }) {
  const { detail } = props
  const { amounts } = detail
  const isWholeCancelled = detail.status === "CANCELLED"
  const cancelledCount = detail.items.filter(item => item.cancelled).length
  const requestedCount = detail.items.filter(
    item => item.cancelRequested
  ).length

  return (
    <MBox
      title="주문 항목"
      sub={
        requestedCount > 0 ? (
          <>
            {detail.items.length}건 중 <B>{requestedCount}건 요청</B> · 취소는{" "}
            <B>항목 단위</B>
          </>
        ) : (
          <>
            {detail.items.length}건 · 취소·반품·교환은 <B>항목 단위</B>
          </>
        )
      }
      tight
    >
      <table className="w-full table-fixed border-collapse text-[12px]">
        <thead>
          <tr className="bg-sz-n-50 text-[11px] font-semibold text-sz-n-600">
            <td className="border-b border-sz-n-200 px-3 py-[9px]">
              상품 · 옵션
            </td>
            <td className="w-[50px] border-b border-sz-n-200 px-3 py-[9px] text-center">
              수량
            </td>
            <td className="w-[88px] border-b border-sz-n-200 px-3 py-[9px] text-center">
              공구가
            </td>
            <td className="w-[90px] border-b border-sz-n-200 px-3 py-[9px] text-center">
              금액
            </td>
            {/* 서버 문구가 「신규(준비 대기)」까지 길어진다 — 배지가 상자 밖으로 나가지 않는 폭 */}
            <td className="w-[120px] border-b border-sz-n-200 px-3 py-[9px] text-center">
              상태
            </td>
          </tr>
        </thead>
        <tbody>
          {detail.items.map((item, index) => {
            const badge = itemBadge(item, detail.statusTone)
            return (
              <tr
                key={item.orderProductId}
                className={cn(
                  item.cancelRequested && "bg-[#FDFAF4]",
                  item.cancelled && "text-sz-n-400"
                )}
              >
                <td
                  className={cn(
                    "px-3 py-[11px] align-middle",
                    index > 0 && "border-t border-sz-n-100"
                  )}
                >
                  <span
                    className={cn(
                      "block",
                      item.cancelled
                        ? "text-sz-n-400 line-through"
                        : "text-sz-n-900"
                    )}
                  >
                    {item.productName}
                  </span>
                  <div className="mt-0.5 text-[11px] text-sz-n-500">
                    옵션: {optionText(item.optionName)}
                    {item.cancelRequested && (
                      <>
                        {" "}
                        · <B className="text-sz-warning-text">취소 요청 대상</B>
                      </>
                    )}
                  </div>
                </td>
                {[item.quantity, item.price, item.amount].map(
                  (value, cellIndex) => (
                    <td
                      key={cellIndex}
                      className={cn(
                        "px-3 py-[11px] text-center align-middle tabular-nums",
                        index > 0 && "border-t border-sz-n-100"
                      )}
                    >
                      {formatNumber(value)}
                    </td>
                  )
                )}
                <td
                  className={cn(
                    "px-3 py-[11px] text-center align-middle",
                    index > 0 && "border-t border-sz-n-100"
                  )}
                >
                  <StatusBadge variant={badge.variant}>
                    {badge.label}
                  </StatusBadge>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="mt-3 border-t border-sz-n-200 pt-3">
        <SumRow
          label="상품 금액"
          value={formatWon(amounts.productTotal)}
          muted={isWholeCancelled}
        />
        {amounts.cancelRequestedAmount !== null && (
          <SumRow
            label="취소 요청분"
            note={`${requestedCount}개 항목`}
            value={formatWon(amounts.cancelRequestedAmount)}
            tone="warn"
          />
        )}
        {!isWholeCancelled && amounts.cancelledAmount > 0 && (
          <SumRow
            label="취소 환불액"
            note={`${cancelledCount}개 항목`}
            value={`− ${formatWon(amounts.cancelledAmount)}`}
            tone="minus"
          />
        )}
        <SumRow
          label="배송비"
          value={
            amounts.deliveryFee === 0 ? (
              <>
                0원{" "}
                <span className="text-[11px] text-sz-n-500">
                  무료배송
                  {!isWholeCancelled &&
                    amounts.cancelledAmount > 0 &&
                    " · 재계산 없음"}
                </span>
              </>
            ) : (
              <>
                {formatWon(amounts.deliveryFee)}
                {!isWholeCancelled && amounts.cancelledAmount > 0 && (
                  <span className="ml-1 text-[11px] text-sz-n-500">
                    재계산 없음
                  </span>
                )}
              </>
            )
          }
          muted={isWholeCancelled}
        />
        {isWholeCancelled && (
          <SumRow
            label="전액 환불"
            note="배송비 포함"
            value={`− ${formatWon(amounts.totalAmount)}`}
            tone="minus"
          />
        )}
        <div className="mt-1.5 flex justify-between border-t border-sz-n-200 pt-2.5 text-[16px] font-semibold text-sz-n-900">
          <span>
            {isWholeCancelled || amounts.cancelledAmount > 0
              ? "실 결제금액"
              : "총 결제금액"}
          </span>
          <span className="tabular-nums">
            {formatWon(
              isWholeCancelled
                ? 0
                : amounts.totalAmount - amounts.cancelledAmount
            )}
          </span>
        </div>
      </div>
    </MBox>
  )
}

function SumRow(props: {
  label: string
  note?: string
  value: ReactNode
  tone?: "warn" | "minus"
  muted?: boolean
}) {
  const { label, note, value, tone, muted = false } = props
  return (
    <div
      className={cn(
        "flex justify-between py-[5px] text-[12px]",
        tone === "warn" && "text-sz-warning-text"
      )}
    >
      <span className={tone === "warn" ? undefined : "text-sz-n-600"}>
        {label}
        {note && <span className="ml-1 text-[11px] text-sz-n-500">{note}</span>}
      </span>
      <span
        className={cn(
          "tabular-nums",
          tone === "minus"
            ? "text-sz-danger-text"
            : muted
              ? "text-sz-n-400"
              : tone === "warn"
                ? undefined
                : "text-sz-n-900"
        )}
      >
        {value}
      </span>
    </div>
  )
}

// ── 우 레일 ──────────────────────────────────────────

function StatusBox(props: {
  detail: OrderDetailResponse
  onOpen: (modal: SubModal) => void
}) {
  const { detail, onOpen } = props
  const { status, timeline, actions, overlays } = detail
  const isReturning = status === "RETURNING"
  const isOperatorDelivered = timeline.deliveredSourceLabel === "운영자 처리"

  return (
    <MBox title="상태" tight>
      {isReturning && (
        <Notice tone="warn" className="mb-3">
          <B>이 주문은 구매확정되지 않습니다.</B> 소비자가 물건을 받지
          못했으므로 구매확정 타이머가 <B>취소</B>되고 정산 대상에서 빠집니다.{" "}
          <B>환불로 종결</B>되며, 소비자가 다시 받길 원하면 <B>새로 주문</B>
          해야 합니다.
        </Notice>
      )}

      <div className="flex items-center justify-between gap-2.5 border-b border-sz-n-100 pb-3">
        <span className="shrink-0 text-[12px] text-sz-n-500">현재 상태</span>
        <CurrentBadge detail={detail} />
      </div>

      <div className="pt-2">
        <StatusMeta detail={detail} />
      </div>

      {status === "DELIVERED" && timeline.confirmDueAt && (
        <div className="mt-2 border-t border-sz-n-100 pt-3">
          <DCount
            days={daysUntil(timeline.confirmDueAt)}
            label="구매확정까지"
          />
        </div>
      )}

      {actions.canPrepareStart && (
        <div className="mt-4 flex flex-col gap-2">
          <Btn variant="primary" onClick={() => onOpen("prepare")}>
            준비 시작
          </Btn>
        </div>
      )}

      {actions.canDecideCancelRequest && (
        <div className="mt-4 flex flex-col gap-1.5">
          <Btn variant="primary" onClick={() => onOpen("approve")}>
            취소 요청 승인
          </Btn>
          <Btn variant="secondary" onClick={() => onOpen("reject")}>
            취소 요청 거부
          </Btn>
        </div>
      )}

      {actions.canRegisterInvoice && <InvoiceRegisterForm detail={detail} />}

      {actions.canUpdateInvoice && <InvoiceUpdateForm detail={detail} />}

      {actions.canCancelDirectly && (
        // [주문 취소]는 위험색이 아니라 중립 텍스트 버튼 — 품절 대응은 정상 업무다
        <div className="mt-3 text-center">
          <Btn
            variant="ghost"
            className="w-full"
            onClick={() => onOpen("cancel")}
          >
            주문 취소
          </Btn>
        </div>
      )}

      <StatusHint
        detail={detail}
        isOperatorDelivered={isOperatorDelivered}
        hasStalled={overlays.trackingAlert === "STALLED"}
      />
    </MBox>
  )
}

/** 남은 일수 — 서버 목록의 `confirmRemainingDays`와 같은 올림 계산(남은 시간 / 24 올림) */
function daysUntil(value: string) {
  const hoursLeft = parseServerDateTime(value).diff(dayjs(), "hour")
  return Math.max(0, Math.ceil(hoursLeft / 24))
}

/** 상태별 핵심 시각 — 아직 일어나지 않은 시각은 서버가 null로 준다 */
function StatusMeta(props: { detail: OrderDetailResponse }) {
  const { detail } = props
  const { status, timeline, overlays } = detail
  const cancelledCount = detail.items.filter(item => item.cancelled).length

  if (detail.overlays.cancelRequested && detail.cancelRequest) {
    return (
      <>
        {timeline.prepareStartedAt && (
          <MRow label="준비 시작">
            {formatDateTime(timeline.prepareStartedAt)}
          </MRow>
        )}
        <MRow label="요청 접수" tone="warn">
          {formatDateTime(detail.cancelRequest.requestedAt)}
        </MRow>
        <MRow label="처리 후 이동">
          {detail.cancelRequest.remainingItemCount === 0
            ? "승인 시 취소 탭"
            : status === "NEW"
              ? "신규 탭"
              : "상품준비중 탭"}
        </MRow>
      </>
    )
  }

  switch (status) {
    case "NEW":
      // C12 — 준비 시작 전에 일부 항목이 소비자 취소(PG 자동 환불)됐다
      if (cancelledCount > 0) {
        return (
          <>
            <MRow label="취소 항목">{cancelledCount}건 · 자동 환불</MRow>
            <MRow label="남은 항목">
              {detail.items.length - cancelledCount}건
            </MRow>
            <MRow label="소비자 취소">남은 항목은 가능</MRow>
          </>
        )
      }
      return (
        <>
          <MRow label="주문일시">{formatDateTime(detail.orderedAt)}</MRow>
          <MRow label="경과" tone="warn">
            {formatElapsedHours(hoursSince(detail.orderedAt) ?? 0)}
          </MRow>
          {/* 시안은 세 줄 — 기한을 넘겼을 때만 발송기한을 덧붙인다 */}
          {overlays.shipOverdue && (
            <MRow label="발송기한" tone="danger">
              {formatDateTime(timeline.shipDueAt)} · 경과
            </MRow>
          )}
          <MRow label="소비자 취소" tone="warn">
            아직 가능
          </MRow>
        </>
      )
    case "PREPARING":
      return (
        <>
          <MRow label="준비 시작">
            {formatDateTime(timeline.prepareStartedAt)}
          </MRow>
          <MRow label="경과">
            {formatElapsedHours(hoursSince(timeline.prepareStartedAt) ?? 0)}
          </MRow>
          {/* 시안은 세 줄 — 기한을 넘겼을 때만 발송기한을 덧붙인다 */}
          {overlays.shipOverdue && (
            <MRow label="발송기한" tone="danger">
              {formatDateTime(timeline.shipDueAt)} · 경과
            </MRow>
          )}
          <MRow label="소비자 취소">닫힘 · 반품으로만 가능</MRow>
        </>
      )
    case "SHIPPING":
      if (overlays.trackingAlert === "PICKUP_UNCONFIRMED") {
        return (
          <>
            <MRow label="송장 등록">{formatDateTime(timeline.shippedAt)}</MRow>
            <MRow label="경과" tone="warn">
              {formatElapsedHours(hoursSince(timeline.shippedAt) ?? 0)}
            </MRow>
            <MRow label="추적 데이터" tone="warn">
              {timeline.lastTrackingAt ? "갱신 없음" : "없음"}
            </MRow>
          </>
        )
      }
      if (overlays.trackingAlert === "STALLED") {
        return (
          <>
            <MRow label="송장 등록">{formatDateTime(timeline.shippedAt)}</MRow>
            <MRow label="마지막 갱신">
              {formatDateTime(timeline.lastTrackingAt)}
            </MRow>
            <MRow label="경과" tone="danger">
              {formatElapsedHours(hoursSince(timeline.lastTrackingAt) ?? 0)}
            </MRow>
          </>
        )
      }
      return (
        <>
          <MRow label="송장 등록">{formatDateTime(timeline.shippedAt)}</MRow>
          <MRow label="추적 갱신">
            {formatDateTime(timeline.lastTrackingAt)}
          </MRow>
          <MRow label="배송완료">자동 전환 대기</MRow>
        </>
      )
    case "RETURNING":
      return (
        <>
          <MRow label="송장 등록">{formatDateTime(timeline.shippedAt)}</MRow>
          <MRow label="반송 감지">
            {formatDateTime(timeline.returnDetectedAt)}
          </MRow>
          <MRow label="구매확정" tone="danger">
            불가 (반송)
          </MRow>
        </>
      )
    case "DELIVERED":
      return (
        <>
          <MRow label="배송완료">{formatDateTime(timeline.deliveredAt)}</MRow>
          <MRow
            label="확인 방식"
            tone={
              timeline.deliveredSourceLabel === "운영자 처리"
                ? "warn"
                : undefined
            }
          >
            <B>{timeline.deliveredSourceLabel ?? "—"}</B>
          </MRow>
          {timeline.deliveredSourceLabel === "운영자 처리" && (
            <MRow label="처리자">운영자</MRow>
          )}
          <MRow label="구매확정 예정">
            {timeline.confirmDueAt
              ? formatDateTime(timeline.confirmDueAt)
              : overlays.openClaimCount > 0
                ? "반품·교환 진행 중 · 보류"
                : "—"}
          </MRow>
        </>
      )
    case "CONFIRMED":
      return (
        <>
          <MRow label="배송완료">
            {formatDateTime(timeline.deliveredAt)}
            {timeline.deliveredSourceLabel && (
              <span className="ml-1 text-[11px] font-normal text-sz-n-500">
                ({timeline.deliveredSourceLabel})
              </span>
            )}
          </MRow>
          <MRow label="구매확정">{formatDateTime(timeline.confirmedAt)}</MRow>
          <MRow label="정산">
            <Link to="/settlement/history" className={FLINK_CLASS}>
              정산 관리 ↗
            </Link>
          </MRow>
        </>
      )
    case "CANCELLED":
      return (
        <>
          <MRow label="취소일시">{formatDateTime(timeline.cancelledAt)}</MRow>
          <MRow label="취소 주체">{timeline.cancelTypeLabel ?? "—"}</MRow>
          {timeline.cancelReasonLabel && (
            <MRow label="취소 사유">{timeline.cancelReasonLabel}</MRow>
          )}
          {/* 준비 시작 전 소비자 취소만 PG 자동 — 승인·직권은 운영자가 집행한다(E5 · E6) */}
          <MRow label="환불">
            {timeline.cancelTypeLabel?.startsWith("소비자 취소")
              ? "전액 완료 · PG 자동"
              : "전액 · 운영자 실행"}
          </MRow>
          <MRow label="배송비">환불 포함</MRow>
        </>
      )
  }
}

/** 상태별 안내 — 브랜드가 누를 버튼이 없는 이유까지 적는다(배송완료는 자동 · 환불은 운영자) */
function StatusHint(props: {
  detail: OrderDetailResponse
  isOperatorDelivered: boolean
  hasStalled: boolean
}) {
  const { detail, isOperatorDelivered, hasStalled } = props
  const { status, overlays, actions } = detail

  if (overlays.cancelRequested && detail.cancelRequest) {
    const remaining = detail.cancelRequest.remainingItemCount
    const backTab = status === "NEW" ? "신규" : "상품준비중"
    return (
      <StHint>
        {remaining > 0 ? (
          <>
            <b>처리하면 이 주문은 원래 탭으로 돌아갑니다</b> — 요청 항목만
            정리되고 <b>남은 {remaining}개 항목은 그대로 발송</b>해야 하기
            때문입니다.
            <br />· <b>승인</b> → 그 항목만 취소되고 주문은 <b>{backTab}</b>
            으로 복귀(환불은 운영자 실행 · 되돌릴 수 없음)
          </>
        ) : (
          <>
            <b>전 항목이 요청된 주문입니다.</b>
            <br />· <b>승인</b> → 주문이 <b>취소로 종결</b>되어 취소 탭으로
            이동(환불은 운영자 실행 · 되돌릴 수 없음)
          </>
        )}
        <br />· <b>거부</b> → 전 항목이 살아난 채 <b>{backTab}</b>으로
        복귀(소비자에게 사유 전달)
        <br />
        어느 쪽도 기본값이 아니니 출고 상황을 보고 판단하세요.
      </StHint>
    )
  }

  switch (status) {
    case "NEW":
      if (detail.items.some(item => item.cancelled)) {
        return (
          <StHint>
            <b>취소된 항목은 준비하지 마세요.</b> 취소는 <b>PG 자동 취소</b>로
            이미 환불돼 브랜드가 할 일이 없습니다.{" "}
            <b>배송비는 재계산되지 않습니다</b> — 남은 항목이 있어 배송이 그대로
            나가기 때문입니다.
          </StHint>
        )
      }
      return (
        <StHint>
          <b>준비를 시작하면 소비자가 단순 취소할 수 없습니다.</b> 되돌릴 수
          없으니 재고를 확인한 뒤 눌러주세요. 시작 전 취소는 <b>PG 자동 취소</b>
          라 브랜드가 할 일이 없습니다.
        </StHint>
      )
    case "PREPARING":
      return actions.canRegisterInvoice ? (
        <StHint>
          송장을 등록하면 <b>배송중</b>으로 바뀌고, 이후{" "}
          <b>배송 추적과 배송완료 전환은 자동</b>입니다. 송장은 자기 택배사에서
          발급받아 입력하거나 목록의 <b>일괄 업로드</b>를 쓰세요.
        </StHint>
      ) : null
    case "SHIPPING":
      if (overlays.trackingAlert === "PICKUP_UNCONFIRMED") {
        return (
          <StHint>
            번호가 맞다면 택배사 집화가 늦어진 것일 수 있습니다 — 그 경우{" "}
            <b>기다리면 자동으로 갱신</b>됩니다. 번호가 틀렸다면 지금 수정해야
            소비자가 배송을 조회할 수 있습니다.
          </StHint>
        )
      }
      if (hasStalled) {
        return null
      }
      return (
        <StHint>
          배송 추적이 정상 연동돼 <b>배송완료도 자동으로 전환</b>됩니다 —
          브랜드가 누를 버튼이 없습니다. 송장을 잘못 등록했다면{" "}
          <b>배송완료 전까지</b> 수정할 수 있습니다.
        </StHint>
      )
    case "RETURNING":
      return (
        <StHint>
          <b>반송 건은 송장 수정이 의미가 없어 수정할 수 없습니다.</b> 반송
          완료(입고)도 자동으로 감지되고 <b>환불은 운영자가 실행</b>합니다 — 이
          주문으로는 재발송하지 않습니다. 반송 사유는 택배사에서 직접 조회해
          주세요.
        </StHint>
      )
    case "DELIVERED":
      return isOperatorDelivered ? (
        <StHint>
          <b>운영자가 처리한 건입니다.</b> 소비자가 실제 수령일과 다르다고
          이의를 제기하면 <b>구매확정일과 정산 시점이 조정될 수 있습니다</b>.
        </StHint>
      ) : (
        <StHint>
          배송완료일시가 <b>구매확정 D+7의 기산점</b>입니다. 7일 동안
          반품·교환이 없으면 시스템이 자동으로 구매확정합니다.
        </StHint>
      )
    case "CONFIRMED":
      return (
        <StHint>
          <b>정산 대상에 편입되었습니다</b> — 정산은 이 공구의{" "}
          <b>모든 주문이 종결된 뒤</b> 한 번에 실행됩니다. 확정 후에도{" "}
          <b>하자·오배송·광고와 다름</b> 사유로는 반품·교환이 들어올 수
          있습니다.
        </StHint>
      )
    case "CANCELLED":
      return (
        <StHint>
          {detail.timeline.cancelTypeLabel?.startsWith("소비자 취소") ? (
            <>
              <b>준비 시작 전 취소</b>라 <b>PG에서 자동으로 전액 환불</b>
              되었습니다 — 배송비까지 포함됩니다.
            </>
          ) : (
            <>
              <b>환불은 운영자가 실행</b>합니다 — 브랜드가 직접 환불하지
              않습니다.
            </>
          )}{" "}
          브랜드가 할 일은 없고 <b>조회만 가능</b>합니다.
        </StHint>
      )
  }
}

/** C2 · C3 — 송장 등록. 별도 모달로 띄우지 않고 우 레일 안에서 펼친다(이중 레이어 방지) */
function InvoiceRegisterForm(props: { detail: OrderDetailResponse }) {
  const { detail } = props
  const register = useRegisterShipments()
  const [carrier, setCarrier] = useState<DeliveryCarrier | "">("")
  const [trackingNumber, setTrackingNumber] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = () => {
    if (!carrier || !trackingNumber) {
      return
    }
    register.mutate(
      [{ deliveryGroupId: detail.deliveryGroupId, carrier, trackingNumber }],
      {
        onSuccess: result => {
          const skipped = result.skipped.find(
            row => row.deliveryGroupId === detail.deliveryGroupId
          )
          if (skipped) {
            setError(skipped.message)
            return
          }
          toast.success(
            "송장을 등록했습니다. 소비자에게 송장번호가 전달되었습니다."
          )
        },
      }
    )
  }

  return (
    <InlineInvoice
      title="송장 등록"
      carrier={carrier}
      trackingNumber={trackingNumber}
      error={error}
      hint="공백·하이픈은 자동으로 제거됩니다."
      isLoading={register.isPending}
      submitLabel="등록"
      onCarrierChange={value => {
        setCarrier(value)
        setError(null)
      }}
      onTrackingChange={value => {
        setTrackingNumber(value)
        setError(null)
      }}
      onCancel={() => {
        setCarrier("")
        setTrackingNumber("")
        setError(null)
      }}
      onSubmit={handleSubmit}
    />
  )
}

/**
 * 송장 수정 — 배송완료 전까지. 「집화 확인 필요」면 주 액션으로 올린다(C6).
 * 추적 정지는 분실·누락 판정에 플랫폼이 관여하지 않아 재발송 송장을 넣는 [송장 수정] 하나만 둔다(C7b).
 */
function InvoiceUpdateForm(props: { detail: OrderDetailResponse }) {
  const { detail } = props
  const update = useUpdateShipment()
  const [isOpen, setIsOpen] = useState(false)
  const [carrier, setCarrier] = useState<DeliveryCarrier | "">(
    detail.timeline.carrier ?? ""
  )
  const [trackingNumber, setTrackingNumber] = useState(
    detail.timeline.trackingNumber ?? ""
  )
  const [error, setError] = useState<string | null>(null)
  const isPrimary = detail.overlays.trackingAlert === "PICKUP_UNCONFIRMED"

  if (!isOpen) {
    return (
      <div className="mt-4 flex flex-col gap-2">
        <Btn
          variant={isPrimary ? "primary" : "secondary"}
          onClick={() => setIsOpen(true)}
        >
          송장 수정
        </Btn>
      </div>
    )
  }

  const unchanged =
    carrier === detail.timeline.carrier &&
    trackingNumber === detail.timeline.trackingNumber

  return (
    <InlineInvoice
      title="송장 수정"
      carrier={carrier}
      trackingNumber={trackingNumber}
      error={error}
      hint="수정 이력이 남고 소비자에게 새 송장번호가 전달됩니다."
      isLoading={update.isPending}
      submitLabel="수정"
      submitDisabled={unchanged}
      onCarrierChange={value => {
        setCarrier(value)
        setError(null)
      }}
      onTrackingChange={value => {
        setTrackingNumber(value)
        setError(null)
      }}
      onCancel={() => {
        setIsOpen(false)
        setCarrier(detail.timeline.carrier ?? "")
        setTrackingNumber(detail.timeline.trackingNumber ?? "")
        setError(null)
      }}
      onSubmit={() => {
        if (!carrier || !trackingNumber) {
          return
        }
        update.mutate(
          { deliveryGroupId: detail.deliveryGroupId, carrier, trackingNumber },
          {
            onSuccess: () => {
              toast.success("송장을 수정했습니다.")
              setIsOpen(false)
            },
            onError: mutationError =>
              setError(
                errorMessageOf(mutationError, "송장을 수정하지 못했습니다.")
              ),
          }
        )
      }}
    />
  )
}

/** 시안 `.inl` — 우 레일 인라인 입력(택배사 · 송장번호). 미입력은 에러 없이 버튼 비활성 */
function InlineInvoice(props: {
  title: string
  carrier: DeliveryCarrier | ""
  trackingNumber: string
  error: string | null
  hint: string
  isLoading: boolean
  submitLabel: string
  submitDisabled?: boolean
  onCarrierChange: (value: DeliveryCarrier | "") => void
  onTrackingChange: (value: string) => void
  onCancel: () => void
  onSubmit: () => void
}) {
  const {
    title,
    carrier,
    trackingNumber,
    error,
    hint,
    isLoading,
    submitLabel,
    submitDisabled = false,
    onCarrierChange,
    onTrackingChange,
    onCancel,
    onSubmit,
  } = props

  return (
    <div className="mt-3 rounded-[6px] border border-sz-accent-100 bg-sz-accent-50 p-3">
      <div className="mb-2 text-[12px] font-semibold text-sz-accent-600">
        {title}
      </div>
      <label className="mb-[3px] block text-[11px] text-sz-n-600">택배사</label>
      <SelectSm
        aria-label="택배사"
        className="h-[30px] w-full pr-[26px] text-sz-n-900"
        value={carrier}
        onChange={event =>
          onCarrierChange(event.target.value as DeliveryCarrier | "")
        }
      >
        <option value="">선택하세요</option>
        {CARRIERS.map(item => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </SelectSm>
      <label className="mb-[3px] mt-2 block text-[11px] text-sz-n-600">
        송장번호
      </label>
      <input
        aria-label="송장번호"
        inputMode="numeric"
        placeholder="숫자만 입력"
        value={trackingNumber}
        onChange={event =>
          onTrackingChange(sanitizeTrackingNumber(event.target.value))
        }
        onKeyDown={event => {
          if (event.key === "Enter") {
            onSubmit()
          }
        }}
        className={cn(
          "h-[30px] w-full rounded-[6px] border bg-white px-[9px] text-[12px] tabular-nums text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:ring-[3px] focus:ring-sz-accent-50",
          error
            ? "border-sz-danger-text"
            : "border-sz-n-300 focus:border-sz-accent-500"
        )}
      />
      {error ? (
        <div
          role="alert"
          className="mt-1 text-[10px] leading-[1.5] text-sz-danger-text"
        >
          {error}
        </div>
      ) : (
        <div className="mt-1 text-[10px] leading-[1.5] text-sz-n-500">
          {hint}
        </div>
      )}
      <div className="mt-3 flex gap-1.5">
        <Btn
          variant="ghost"
          className="h-7 flex-1 text-[11px]"
          onClick={onCancel}
        >
          취소
        </Btn>
        <Btn
          variant="primary"
          className="h-7 flex-1 text-[11px]"
          disabled={
            !carrier || !trackingNumber || Boolean(error) || submitDisabled
          }
          isLoading={isLoading}
          onClick={onSubmit}
        >
          {submitLabel}
        </Btn>
      </div>
    </div>
  )
}

/** 배송 정보 — 송장 이후. 배송완료일시는 출처를 항상 병기한다(자동 확인 / 운영자 처리) */
function ShippingBox(props: { detail: OrderDetailResponse }) {
  const { detail } = props
  const { timeline, status, overlays } = detail
  // 구매확정은 배송이 끝난 건 — 시안 C10처럼 상태 상자의 배송완료 행으로 충분하다
  if (status === "CONFIRMED") {
    return null
  }
  if (!timeline.trackingNumber && !timeline.deliveredAt) {
    return null
  }
  const trackingUrl = trackingUrlOf(timeline.carrier, timeline.trackingNumber)
  const isStalled = overlays.trackingAlert === "STALLED"
  const isOperator = timeline.deliveredSourceLabel === "운영자 처리"

  return (
    <>
      {isStalled && (
        <MBox title="추적 정지">
          <FRow label="마지막 갱신">
            <span className="tabular-nums">
              {formatDateTime(timeline.lastTrackingAt)}
            </span>
          </FRow>
          <Notice tone="warn" className="my-3">
            <B>7일째 추적 갱신이 없습니다.</B> 소비자나 브랜드가{" "}
            <B>택배사에 직접 조회</B>해 결과에 따라 처리합니다 — <B>누락</B>
            (소비자가 이미 수령)이면 택배사가 <B>배송완료로 처리</B>하고,{" "}
            <B>분실</B>이면 브랜드가 <B>재발송한 뒤 [송장 수정]</B>으로 새
            번호를 넣습니다. <B>분실 보상은 택배사가 따로 처리</B>합니다.
          </Notice>
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-sz-n-500">처리 상태</span>
            <StatusBadge variant="danger">추적 정지</StatusBadge>
          </div>
        </MBox>
      )}
      <MBox
        title="배송 정보"
        sub={isStalled ? "배송 추적 · 갱신 정지" : "배송 추적 자동 연동"}
        tight
      >
        {timeline.carrierLabel && (
          <ShipRow label="택배사">{timeline.carrierLabel}</ShipRow>
        )}
        {timeline.trackingNumber && (
          <ShipRow label="송장번호">
            <span className="tabular-nums">
              {formatTrackingNumber(timeline.trackingNumber)}
            </span>
          </ShipRow>
        )}
        {timeline.deliveredAt && (
          <ShipRow label="배송완료">
            <span className="tabular-nums">
              {formatDateTime(timeline.deliveredAt)}
            </span>{" "}
            {timeline.deliveredSourceLabel && (
              <span
                className={cn(
                  "text-[11px]",
                  isOperator ? "text-sz-warning-text" : "text-sz-n-500"
                )}
              >
                ({timeline.deliveredSourceLabel})
              </span>
            )}
          </ShipRow>
        )}
        {trackingUrl && (
          <ShipRow label="조회">
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={FLINK_CLASS}
            >
              택배사에서 조회 ↗
            </a>
          </ShipRow>
        )}
        {status === "RETURNING" ? (
          <TrackBox
            danger
            title="반송 처리"
            meta={`${formatDateTime(timeline.returnDetectedAt)} 감지 · 반송 배송중`}
          />
        ) : isStalled ? (
          <TrackBox
            danger
            title="추적 갱신 멈춤"
            meta={`${formatDateTime(timeline.lastTrackingAt)} 이후 갱신 없음`}
          />
        ) : overlays.trackingAlert === "PICKUP_UNCONFIRMED" ? (
          <Notice tone="warn" className="mt-3">
            <B>등록 후 24시간이 지났지만 택배사 조회가 되지 않습니다.</B>{" "}
            송장번호를 확인해 주세요.
          </Notice>
        ) : status === "SHIPPING" ? (
          <TrackBox
            title="배송중"
            meta={
              timeline.lastTrackingAt
                ? `${formatDateTime(timeline.lastTrackingAt)} 갱신`
                : "집화 대기 · 추적 데이터가 아직 없습니다"
            }
          />
        ) : timeline.deliveredAt && status === "DELIVERED" ? (
          <TrackBox
            title="배송완료"
            meta={`${formatDateTime(timeline.deliveredAt)} 갱신`}
          />
        ) : null}
      </MBox>
    </>
  )
}

const HISTORY_DOT: Record<string, string> = {
  PAID: "bg-sz-success-text",
  DELIVERED: "bg-sz-success-text",
  PURCHASE_CONFIRMED: "bg-sz-success-text",
  REFUND_EXECUTED: "bg-sz-success-text",
  PREPARE_STARTED: "bg-sz-info-text",
  INVOICE_REGISTERED: "bg-sz-info-text",
  INVOICE_UPDATED: "bg-sz-info-text",
  PICKUP_UNCONFIRMED: "bg-sz-warning-text",
  CANCEL_REQUESTED: "bg-sz-warning-text",
  CANCEL_REQUEST_APPROVED: "bg-sz-warning-text",
  CANCEL_REQUEST_REJECTED: "bg-sz-warning-text",
  CANCELLED_BY_CONSUMER: "bg-sz-warning-text",
  CANCELLED_BY_SELLER: "bg-sz-warning-text",
  TRACKING_STALLED: "bg-sz-danger-text",
  RETURN_DETECTED: "bg-sz-danger-text",
  RETURN_COMPLETED: "bg-sz-danger-text",
}

/** 처리 이력 — 최신순 · 주체 표기(시스템 / 브랜드 / 운영자 / 소비자 / 배송 추적) */
function HistoryBox(props: { history: Array<OrderHistoryItem> }) {
  return (
    <MBox title="처리 이력" tight>
      {props.history.length === 0 ? (
        <div className="py-2 text-[12px] text-sz-n-500">이력이 없습니다.</div>
      ) : (
        props.history.map((item, index) => (
          <div
            key={`${item.eventType}-${index}`}
            className="flex gap-2.5 py-[9px]"
          >
            <span
              className={cn(
                "mt-1.5 size-[7px] shrink-0 rounded-full",
                HISTORY_DOT[item.eventType] ?? "bg-sz-n-300"
              )}
            />
            <div className="min-w-0">
              <div className="text-[12px] text-sz-n-900">
                {item.label}
                {item.detail && (
                  <span className="text-sz-n-600"> · {item.detail}</span>
                )}
              </div>
              <div className="text-[11px] tabular-nums text-sz-n-500">
                {formatDateTime(item.occurredAt)} · {item.actorLabel}
              </div>
            </div>
          </div>
        ))
      )}
    </MBox>
  )
}
