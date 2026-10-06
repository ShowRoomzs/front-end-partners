import StatusBadge from "@/common/components/StatusBadge/StatusBadge"
import {
  ActBtn,
  Cb,
  DCount,
  ExpandToggle,
  OrderBadge,
  SelectSm,
  SortMark,
  TNote,
} from "@/features/orders/components/shared/OrderParts"
import {
  CANCEL_REQUEST_WARN_HOURS,
  CARRIERS,
} from "@/features/orders/constants/params"
import type {
  DeliveryCarrier,
  OrderListItem,
  OrderTab,
} from "@/features/orders/types"
import {
  formatDateTime,
  formatElapsedHours,
  formatNumber,
  itemBadge,
  optionText,
  sanitizeTrackingNumber,
  splitLabel,
} from "@/features/orders/utils/view"
import { cn } from "@/lib/utils"
import { Fragment, type ReactNode } from "react"

/** 상품준비중 탭 셀 입력 — 저장되지 않은 클라이언트 임시값(확정은 [N건 송장 등록]) */
export interface InvoiceDraft {
  orderNumber: string
  carrier: DeliveryCarrier | ""
  trackingNumber: string
  /** 포커스 아웃 뒤에만 화면 내 중복을 알린다 — 다 치기 전에 빨간불을 켜지 않는다(검사 ②) */
  touched: boolean
  /** 확정 시 서버가 제외한 사유 — 값을 고치면 지운다(검사 ③) */
  serverError: string | null
}

export interface InvoiceRowState {
  draft: InvoiceDraft | undefined
  filled: boolean
  error: string | null
}

export interface OrderTableContext {
  tab: OrderTab
  selectedIds: Set<number>
  onToggleSelect: (id: number, checked: boolean) => void
  onToggleSelectAll: (checked: boolean) => void
  expandedIds: Set<number>
  onToggleExpand: (id: number) => void
  onOpenDetail: (row: OrderListItem) => void
  onPrepareStart: (row: OrderListItem) => void
  /** 발송기한 열 정렬(신규·상품준비중) */
  shipDueSortActive: boolean
  onToggleShipDueSort: () => void
  // 상품준비중 — 셀 입력
  invoiceOf: (row: OrderListItem) => InvoiceRowState
  onInvoiceChange: (
    row: OrderListItem,
    patch: Partial<Pick<InvoiceDraft, "carrier" | "trackingNumber">>
  ) => void
  onInvoiceBlur: (row: OrderListItem) => void
  onRegisterRow: (row: OrderListItem) => void
  registeringIds: Set<number>
  // 배송중 — 「집화 확인 필요」 행만 송장 셀이 열린다
  shipEditOf: (row: OrderListItem) => { value: string; error: string | null }
  onShipEditChange: (row: OrderListItem, value: string) => void
  onUpdateShipment: (row: OrderListItem) => void
  updatingIds: Set<number>
}

interface OrderColumn {
  key: string
  header: ReactNode
  width?: number
  center?: boolean
  /** 체크박스·토글처럼 좁은 열은 기본 패딩(16px)을 줄인다 */
  cellClassName?: string
  render: (row: OrderListItem) => ReactNode
}

const SHIP_DUE_TITLE =
  "송장을 등록한 시각으로 판정합니다 · 결제완료 시각부터 기산"

/**
 * 탭마다 컬럼이 다르다(rev.5) — 한 표에 모든 상태를 담으면 그 탭에서 필요한 정보가 밀려난다.
 * 컬럼 폭은 시안 그대로이고, 남는 폭은 상품 열이 가져간다.
 */
function buildColumns(
  ctx: OrderTableContext,
  rows: Array<OrderListItem>
): Array<OrderColumn> {
  const { tab } = ctx
  const isCancelledTab = tab === "CANCELLED"

  const allSelected =
    rows.length > 0 &&
    rows.every(row => ctx.selectedIds.has(row.deliveryGroupId))

  const checkbox: OrderColumn = {
    key: "checkbox",
    header: (
      <Cb
        label="이 페이지 전체 선택"
        checked={allSelected}
        onChange={ctx.onToggleSelectAll}
      />
    ),
    width: 34,
    cellClassName: "pl-4 pr-0",
    render: row => (
      <Cb
        label={`${row.orderNumber} 선택`}
        checked={ctx.selectedIds.has(row.deliveryGroupId)}
        onChange={checked => ctx.onToggleSelect(row.deliveryGroupId, checked)}
      />
    ),
  }

  const expand: OrderColumn = {
    key: "expand",
    header: "",
    width: 26,
    center: true,
    cellClassName: "px-0",
    render: row => (
      <ExpandToggle
        expanded={ctx.expandedIds.has(row.deliveryGroupId)}
        onToggle={() => ctx.onToggleExpand(row.deliveryGroupId)}
      />
    ),
  }

  // 시안은 114px(ORD-24118)이지만 실제 주문번호는 「결제일-순번」 15자라 그 폭에 다 들어가게 넓혔다
  const orderNumber = (width = 150): OrderColumn => ({
    key: "orderNumber",
    header: "주문번호",
    width,
    render: row => (
      <span
        className={cn(
          "block truncate tabular-nums",
          (isCancelledTab || row.status === "CANCELLED") && "text-sz-n-400"
        )}
        title={row.orderNumber}
      >
        {row.orderNumber}
      </span>
    ),
  })

  const groupBuy: OrderColumn = {
    key: "groupBuy",
    header: "공구명",
    width: 126,
    render: row => (
      <span
        className={cn(
          "block truncate",
          isCancelledTab || row.status === "CANCELLED"
            ? "text-sz-n-400"
            : "text-sz-n-700"
        )}
        title={row.groupBuyName ?? undefined}
      >
        {row.groupBuyName ?? "—"}
      </span>
    ),
  }

  const recipient = (width = 70): OrderColumn => ({
    key: "recipient",
    header: "소비자",
    width,
    render: row => (
      <span
        className={cn(
          "block truncate",
          (isCancelledTab || row.status === "CANCELLED") && "text-sz-n-400"
        )}
        title={row.recipientName}
      >
        {row.recipientName}
      </span>
    ),
  })

  const product: OrderColumn = {
    key: "product",
    header: "상품",
    render: row => {
      const struck = isCancelledTab || row.status === "CANCELLED"
      return (
        <>
          <span
            className={cn(
              "block truncate font-medium group-hover:text-sz-accent-600",
              struck ? "text-sz-n-400 line-through" : "text-sz-n-900"
            )}
            title={row.productSummary ?? undefined}
          >
            {row.productSummary ?? "—"}
          </span>
          {tab === "CANCEL_REQUESTED" && row.cancelRequest && (
            <TNote>
              {isWholeRequest(row.cancelRequest.summary)
                ? "전 항목 요청"
                : row.cancelRequest.summary}
            </TNote>
          )}
        </>
      )
    },
  }

  const quantity: OrderColumn = {
    key: "quantity",
    header: "수량",
    width: 52,
    center: true,
    render: row => (
      <span
        className={cn(
          "tabular-nums",
          (isCancelledTab || row.status === "CANCELLED") && "text-sz-n-400"
        )}
      >
        {row.totalQuantity}
      </span>
    ),
  }

  const shipDue = (width: number): OrderColumn => ({
    key: "shipDue",
    header: (
      <span title={SHIP_DUE_TITLE}>
        발송기한
        {tab === "NEW" || tab === "PREPARING" ? (
          <button
            type="button"
            onClick={ctx.onToggleShipDueSort}
            aria-label="발송기한 임박순으로 정렬"
            aria-pressed={ctx.shipDueSortActive}
            className="cursor-pointer"
          >
            <SortMark active={ctx.shipDueSortActive} />
          </button>
        ) : null}
      </span>
    ),
    width,
    center: true,
    render: row => <ShipDueCell row={row} tab={tab} />,
  })

  const orderedAt: OrderColumn = {
    key: "orderedAt",
    header: (
      <>
        주문일시
        {tab === "ALL" && <SortMark active />}
      </>
    ),
    width: 134,
    center: true,
    render: row => (
      <span className="whitespace-nowrap tabular-nums text-sz-n-500">
        {formatDateTime(row.orderedAt)}
      </span>
    ),
  }

  const carrierText = (width: number): OrderColumn => ({
    key: "carrier",
    header: "택배사",
    width,
    render: row => (
      <span className="block truncate">{row.carrierLabel ?? "—"}</span>
    ),
  })

  const lastTracking: OrderColumn = {
    key: "lastTracking",
    header: "최종 갱신",
    width: 132,
    center: true,
    render: row => <LastTrackingCell row={row} />,
  }

  switch (tab) {
    case "NEW":
      return [
        checkbox,
        expand,
        orderNumber(),
        groupBuy,
        recipient(),
        product,
        quantity,
        shipDue(134),
        orderedAt,
        {
          key: "manage",
          header: "관리",
          width: 100,
          center: true,
          render: row => (
            <ActBtn
              primary
              onClick={event => {
                event.stopPropagation()
                ctx.onPrepareStart(row)
              }}
            >
              준비 시작
            </ActBtn>
          ),
        },
      ]

    case "PREPARING":
      return [
        checkbox,
        expand,
        orderNumber(),
        recipient(),
        product,
        quantity,
        shipDue(124),
        {
          key: "carrierInput",
          header: "택배사",
          width: 150,
          render: row => {
            const { draft } = ctx.invoiceOf(row)
            return (
              <SelectSm
                aria-label={`${row.orderNumber} 택배사`}
                className="h-[30px] w-full pr-6 text-sz-n-900"
                value={draft?.carrier ?? ""}
                onClick={event => event.stopPropagation()}
                onChange={event =>
                  ctx.onInvoiceChange(row, {
                    carrier: event.target.value as DeliveryCarrier | "",
                  })
                }
              >
                <option value="">선택</option>
                {CARRIERS.map(carrier => (
                  <option key={carrier.value} value={carrier.value}>
                    {carrier.label}
                  </option>
                ))}
              </SelectSm>
            )
          },
        },
        {
          key: "trackingInput",
          header: "송장번호",
          width: 172,
          render: row => {
            const { draft, error } = ctx.invoiceOf(row)
            return (
              <>
                <input
                  aria-label={`${row.orderNumber} 송장번호`}
                  inputMode="numeric"
                  placeholder="숫자만 입력"
                  value={draft?.trackingNumber ?? ""}
                  onClick={event => event.stopPropagation()}
                  onChange={event =>
                    ctx.onInvoiceChange(row, {
                      trackingNumber: sanitizeTrackingNumber(
                        event.target.value
                      ),
                    })
                  }
                  onBlur={() => ctx.onInvoiceBlur(row)}
                  className={cn(
                    "h-[30px] w-full rounded-[6px] border bg-white px-[9px] text-[12px] tabular-nums text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:ring-[3px] focus:ring-sz-accent-50",
                    error
                      ? "border-sz-danger-text"
                      : "border-sz-n-300 focus:border-sz-accent-500"
                  )}
                />
                {error && (
                  <span
                    role="alert"
                    className="mt-1 block whitespace-normal text-[11px] leading-[1.5] text-sz-danger-text"
                  >
                    {error}
                  </span>
                )}
              </>
            )
          },
        },
        {
          key: "manage",
          header: "관리",
          width: 96,
          center: true,
          render: row => {
            const { filled, error } = ctx.invoiceOf(row)
            return (
              <ActBtn
                primary={filled && !error}
                disabled={
                  !filled ||
                  Boolean(error) ||
                  ctx.registeringIds.has(row.deliveryGroupId)
                }
                onClick={event => {
                  event.stopPropagation()
                  ctx.onRegisterRow(row)
                }}
              >
                송장 등록
              </ActBtn>
            )
          },
        },
      ]

    case "CANCEL_REQUESTED":
      return [
        expand,
        orderNumber(),
        recipient(80),
        product,
        {
          key: "reason",
          header: "요청 사유",
          width: 150,
          render: row => (
            <>
              <span className="block truncate">
                {row.cancelRequest?.reasonLabel ?? "—"}
              </span>
              {row.cancelRequest?.reasonDetail && (
                <TNote className="truncate">
                  {row.cancelRequest.reasonDetail}
                </TNote>
              )}
            </>
          ),
        },
        {
          key: "requestedAt",
          header: "요청일시",
          width: 140,
          center: true,
          render: row => (
            <span className="whitespace-nowrap tabular-nums text-sz-n-500">
              {formatDateTime(row.cancelRequest?.requestedAt ?? null)}
            </span>
          ),
        },
        {
          key: "elapsed",
          header: "경과",
          width: 120,
          center: true,
          render: row => {
            const hours = row.cancelRequest?.elapsedHours ?? 0
            return (
              <span
                className={cn(
                  "tabular-nums",
                  hours >= CANCEL_REQUEST_WARN_HOURS &&
                    "font-medium text-sz-warning-text"
                )}
              >
                {formatElapsedHours(hours)}
              </span>
            )
          },
        },
        {
          key: "manage",
          header: "관리",
          width: 104,
          center: true,
          render: row => (
            <ActBtn
              primary
              onClick={event => {
                event.stopPropagation()
                ctx.onOpenDetail(row)
              }}
            >
              요청 확인
            </ActBtn>
          ),
        },
      ]

    case "SHIPPING":
    case "RETURNING":
      return [
        expand,
        orderNumber(),
        recipient(),
        product,
        carrierText(124),
        {
          key: "tracking",
          header: "송장번호",
          width: 150,
          render: row => <TrackingCell row={row} ctx={ctx} />,
        },
        lastTracking,
        {
          key: "manage",
          header: "관리",
          width: 96,
          center: true,
          render: row => {
            if (row.status === "RETURNING") {
              // 반송 건은 송장 수정이 의미가 없다 — 번호가 맞아도 물건이 돌아오는 중이다
              return <ActBtn disabled>수정</ActBtn>
            }
            if (row.overlays.trackingAlert === "PICKUP_UNCONFIRMED") {
              const edit = ctx.shipEditOf(row)
              const unchanged =
                !edit.value || edit.value === (row.trackingNumber ?? "")
              return (
                <ActBtn
                  primary
                  disabled={
                    unchanged || ctx.updatingIds.has(row.deliveryGroupId)
                  }
                  onClick={event => {
                    event.stopPropagation()
                    ctx.onUpdateShipment(row)
                  }}
                >
                  수정
                </ActBtn>
              )
            }
            return <span className="text-sz-n-300">—</span>
          },
        },
      ]

    case "DELIVERED":
      return [
        expand,
        orderNumber(),
        recipient(),
        product,
        carrierText(120),
        {
          key: "tracking",
          header: "송장번호",
          width: 144,
          render: row => (
            <span className="block truncate tabular-nums">
              {row.trackingNumber ?? "—"}
            </span>
          ),
        },
        {
          key: "deliveredAt",
          header: "배송완료",
          width: 134,
          center: true,
          render: row => (
            <span
              className="whitespace-nowrap tabular-nums text-sz-n-500"
              title={row.deliveredSourceLabel ?? undefined}
            >
              {formatDateTime(row.deliveredAt)}
            </span>
          ),
        },
        {
          key: "confirmDue",
          header: "구매확정 예정",
          width: 118,
          center: true,
          render: row =>
            row.confirmRemainingDays !== null ? (
              <DCount days={row.confirmRemainingDays} small />
            ) : row.overlays.openClaimCount > 0 ? (
              // 보류 중인 반품·교환이 있으면 구매확정 날짜를 약속하지 않는다
              <span className="block whitespace-normal break-keep text-[11px] leading-[1.4] text-sz-n-600">
                반품·교환 진행 중
              </span>
            ) : (
              <span className="text-sz-n-300">—</span>
            ),
        },
      ]

    case "CONFIRMED":
      return [
        expand,
        orderNumber(),
        recipient(),
        product,
        {
          key: "paidAmount",
          header: "결제금액",
          width: 104,
          center: true,
          render: row => (
            <span className="tabular-nums">{formatNumber(row.paidAmount)}</span>
          ),
        },
        {
          key: "confirmedAt",
          header: "구매확정",
          width: 134,
          center: true,
          render: row => (
            <span className="whitespace-nowrap tabular-nums text-sz-n-500">
              {formatDateTime(row.confirmedAt)}
            </span>
          ),
        },
        {
          key: "settlement",
          header: "정산",
          width: 168,
          render: row => <SettlementCell row={row} />,
        },
      ]

    case "CANCELLED":
      return [
        expand,
        orderNumber(),
        groupBuy,
        recipient(),
        product,
        quantity,
        {
          key: "cancelledAt",
          header: "취소일시",
          width: 134,
          center: true,
          render: row => (
            <span className="whitespace-nowrap tabular-nums text-sz-n-500">
              {formatDateTime(row.cancelledAt)}
            </span>
          ),
        },
        {
          key: "refund",
          header: "환불",
          width: 120,
          center: true,
          render: row => (
            <span className="text-sz-n-600">{refundText(row)}</span>
          ),
        },
        {
          key: "cancelType",
          header: "취소 사유",
          width: 168,
          render: row => {
            const { main, sub } = splitLabel(row.cancelTypeLabel)
            return (
              <>
                <span className="block truncate">{main}</span>
                {sub && <TNote>{sub}</TNote>}
              </>
            )
          },
        },
      ]

    case "ALL":
    default:
      return [
        expand,
        orderNumber(),
        groupBuy,
        recipient(),
        product,
        quantity,
        shipDue(134),
        orderedAt,
        {
          key: "status",
          header: "상태",
          width: 104,
          center: true,
          render: row => <StatusCell row={row} />,
        },
        {
          key: "manage",
          header: "관리",
          width: 100,
          center: true,
          render: row => (
            <ActBtn
              onClick={event => {
                event.stopPropagation()
                ctx.onOpenDetail(row)
              }}
            >
              보기
            </ActBtn>
          ),
        },
      ]
  }
}

function isWholeRequest(summary: string) {
  // 「2건 중 2건 요청 · 남은 0건 발송 대기」 → 전 항목 요청
  return /남은 0건/.test(summary)
}

/** 준비 시작 전 취소는 PG 자동, 그 뒤 취소(승인·직권)는 운영자가 환불을 집행한다 */
function refundText(row: OrderListItem) {
  return row.cancelTypeLabel?.startsWith("소비자 취소")
    ? "전액 · PG 자동"
    : "전액 · 운영자 환불"
}

/**
 * 발송기한 — 이미 발송된 건은 기한이 의미 없어 「—」로 비운다(rev.3).
 * 상품준비중에서 넘긴 기한은 「발송기한 경과」(위험 · 브랜드 귀책) 배지를 단다(A2a).
 */
function ShipDueCell(props: { row: OrderListItem; tab: OrderTab }) {
  const { row, tab } = props
  const workable = row.status === "NEW" || row.status === "PREPARING"
  if (!workable || !row.shipDueAt) {
    return <span className="text-sz-n-300">—</span>
  }
  if (row.overlays.shipOverdue && tab === "PREPARING") {
    return (
      <span className="whitespace-nowrap font-medium tabular-nums text-sz-danger-text">
        {formatDateTime(row.shipDueAt)}
        <span className="mt-1 block">
          <StatusBadge variant="danger">발송기한 경과</StatusBadge>
        </span>
      </span>
    )
  }
  return (
    <span
      className={cn(
        "whitespace-nowrap tabular-nums",
        row.overlays.shipOverdue
          ? "font-medium text-sz-warning-text"
          : "text-sz-n-500"
      )}
    >
      {formatDateTime(row.shipDueAt)}
    </span>
  )
}

/** 배송중 「최종 갱신」 — 위치보다 갱신이 멈춘 것이 문제 신호다(rev.6). 배지가 곧 이상 표시다 */
function LastTrackingCell(props: { row: OrderListItem }) {
  const { row } = props
  const value = formatDateTime(row.lastTrackingAt)

  if (row.status === "RETURNING") {
    return (
      <span className="whitespace-nowrap font-medium tabular-nums text-sz-danger-text">
        {value}
        <span className="mt-1 block">
          <StatusBadge variant="danger">반송 중</StatusBadge>
        </span>
      </span>
    )
  }
  if (row.overlays.trackingAlert) {
    const danger = row.overlays.trackingAlert === "STALLED"
    return (
      <span
        className={cn(
          "whitespace-nowrap font-medium tabular-nums",
          danger ? "text-sz-danger-text" : "text-sz-warning-text"
        )}
      >
        {value}
        <span className="mt-1 block">
          <StatusBadge variant={danger ? "danger" : "warning"}>
            {row.overlays.trackingAlertLabel}
          </StatusBadge>
        </span>
      </span>
    )
  }
  return (
    <span className="whitespace-nowrap tabular-nums text-sz-n-500">
      {value}
    </span>
  )
}

/**
 * 배송중 송장 셀 — 기본 읽기 전용이고 「집화 확인 필요」 행만 편집이 열린다.
 * 경고 배지가 곧 편집 권한이다(rev.6). 추적 정지는 고칠 번호가 아니라 스캔 문제라 목록에서 열지 않는다.
 */
function TrackingCell(props: { row: OrderListItem; ctx: OrderTableContext }) {
  const { row, ctx } = props
  if (
    row.status === "SHIPPING" &&
    row.overlays.trackingAlert === "PICKUP_UNCONFIRMED"
  ) {
    const edit = ctx.shipEditOf(row)
    return (
      <>
        <input
          aria-label={`${row.orderNumber} 송장번호 수정`}
          inputMode="numeric"
          value={edit.value}
          onClick={event => event.stopPropagation()}
          onChange={event =>
            ctx.onShipEditChange(
              row,
              sanitizeTrackingNumber(event.target.value)
            )
          }
          className={cn(
            "h-[30px] w-full rounded-[6px] border bg-white px-[9px] text-[12px] tabular-nums text-sz-n-900 outline-none focus:ring-[3px] focus:ring-sz-accent-50",
            edit.error
              ? "border-sz-danger-text"
              : "border-sz-n-300 focus:border-sz-accent-500"
          )}
        />
        {edit.error ? (
          <span
            role="alert"
            className="mt-1 block whitespace-normal text-[11px] leading-[1.5] text-sz-danger-text"
          >
            {edit.error}
          </span>
        ) : (
          <span className="mt-[5px] block">
            <StatusBadge variant="warning">
              {row.overlays.trackingAlertLabel}
            </StatusBadge>
          </span>
        )}
      </>
    )
  }
  return (
    <span className="block truncate tabular-nums">
      {row.trackingNumber ?? "—"}
    </span>
  )
}

/**
 * 구매확정 「정산」 — 구매확정 ≠ 정산 완료. 정산은 공구의 전 항목 종결 뒤 일괄 실행된다.
 * 반품·교환이 걸린 건은 **중립** 배지다 — 정산 전일 수 있는데 경고색을 쓰면 위험 신호가 무의미해진다.
 */
function SettlementCell(props: { row: OrderListItem }) {
  const { row } = props
  if (row.overlays.openClaimCount > 0) {
    return (
      <>
        <StatusBadge variant="neutral">구매확정 후 클레임</StatusBadge>
        <TNote>클레임 종결 후 재산정</TNote>
      </>
    )
  }
  return (
    <>
      {/* 정산 모듈이 생기기 전까지 서버는 null을 준다 — 구매확정 건은 규칙상 정산 대상이다 */}
      {row.settlementLabel ?? "정산 대상"}
      <TNote>공구 종결 후 일괄</TNote>
    </>
  )
}

/** 전체 탭 상태 열 — 이 탭만 상태 열을 유지한다. 오버레이는 배지 아래 보조 줄로 덧붙인다 */
function StatusCell(props: { row: OrderListItem }) {
  const { row } = props
  if (row.overlays.cancelRequested) {
    return <StatusBadge variant="warning">취소 요청</StatusBadge>
  }
  return (
    <>
      <OrderBadge tone={row.statusTone}>{row.statusLabel}</OrderBadge>
      {row.overlays.trackingAlert && (
        <TNote
          className={cn(
            "font-medium",
            row.overlays.trackingAlert === "STALLED"
              ? "text-sz-danger-text"
              : "text-sz-warning-text"
          )}
        >
          {row.overlays.trackingAlertLabel}
        </TNote>
      )}
      {row.status === "CONFIRMED" && row.overlays.openClaimCount > 0 && (
        <span className="mt-[3px] block">
          <StatusBadge variant="neutral">구매확정 후 클레임</StatusBadge>
        </span>
      )}
    </>
  )
}

/** 행 확장(A1c) — 목록은 하위주문 단위지만 발주 준비는 항목 단위다. 모달 없이 ▸ 하나로 본다 */
function ExpandedItems(props: { row: OrderListItem }) {
  const { row } = props
  return (
    <table className="w-full table-fixed border-collapse overflow-hidden rounded-[6px] border border-sz-n-200 bg-white text-[11px]">
      <thead>
        <tr className="bg-sz-n-100 font-semibold text-sz-n-600">
          <td className="px-3 py-2">상품 · 옵션</td>
          <td className="w-[60px] px-3 py-2 text-center">수량</td>
          <td className="w-[92px] px-3 py-2 text-center">공구가</td>
          <td className="w-[96px] px-3 py-2 text-center">금액</td>
          <td className="w-[92px] px-3 py-2 text-center">항목 상태</td>
        </tr>
      </thead>
      <tbody>
        {row.items.map(item => {
          const badge = itemBadge(item, row.statusTone)
          return (
            <tr
              key={item.orderProductId}
              className={cn(
                "border-t border-sz-n-100",
                item.cancelled && "text-sz-n-400"
              )}
            >
              <td className="px-3 py-2">
                <span className={cn(item.cancelled && "line-through")}>
                  {item.productName}
                </span>{" "}
                <span className="text-sz-n-500">
                  / {optionText(item.optionName)}
                </span>
              </td>
              <td className="px-3 py-2 text-center tabular-nums">
                {item.quantity}
              </td>
              <td className="px-3 py-2 text-center tabular-nums">
                {formatNumber(item.price)}
              </td>
              <td className="px-3 py-2 text-center tabular-nums">
                {formatNumber(item.amount)}
              </td>
              <td className="px-3 py-2 text-center">
                <StatusBadge variant={badge.variant}>{badge.label}</StatusBadge>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

/**
 * 주문 목록 표. 공용 Table은 행 확장·셀 입력을 담지 못해(머리글과 본문이 다른 table) 시안
 * `table{table-layout:fixed}`를 그대로 옮긴 단일 표로 그린다.
 */
export default function OrderTable(props: {
  ctx: OrderTableContext
  rows: Array<OrderListItem>
  /** 데이터 0건일 때 머리글 아래에 넣을 내용(A5) */
  emptyState?: ReactNode
  isLoading?: boolean
}) {
  const { ctx, rows, emptyState, isLoading = false } = props
  const columns = buildColumns(ctx, rows)

  return (
    <div className="relative">
      <table
        className={cn(
          "w-full table-fixed border-collapse transition-opacity",
          isLoading && "opacity-60"
        )}
      >
        <colgroup>
          {columns.map(column => (
            <col
              key={column.key}
              style={column.width ? { width: column.width } : undefined}
            />
          ))}
        </colgroup>
        <thead>
          <tr>
            {columns.map(column => (
              <td
                key={column.key}
                className={cn(
                  "whitespace-nowrap border-b border-sz-n-200 bg-sz-n-100 px-4 py-[11px] text-[11px] font-semibold tracking-[.2px] text-sz-n-600",
                  column.center && "text-center",
                  column.cellClassName
                )}
              >
                {column.header}
              </td>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const invoice =
              ctx.tab === "PREPARING" ? ctx.invoiceOf(row) : undefined
            const selected = ctx.selectedIds.has(row.deliveryGroupId)
            const expanded = ctx.expandedIds.has(row.deliveryGroupId)
            return (
              <Fragment key={row.deliveryGroupId}>
                <tr
                  onClick={() => ctx.onOpenDetail(row)}
                  className={cn(
                    "group cursor-pointer hover:bg-sz-accent-50",
                    invoice?.filled &&
                      (invoice.error ? "bg-[#FDF6F6]" : "bg-sz-accent-50"),
                    !invoice?.filled && selected && "bg-sz-accent-50"
                  )}
                >
                  {columns.map(column => (
                    <td
                      key={column.key}
                      className={cn(
                        "px-4 py-[13px] align-middle text-[12px] text-sz-n-900",
                        index > 0 && "border-t border-sz-n-100",
                        column.center && "text-center",
                        column.cellClassName
                      )}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
                {expanded && (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="bg-sz-n-50 pb-3 pl-[68px] pr-4"
                    >
                      <ExpandedItems row={row} />
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
      {rows.length === 0 && (
        <div className="flex w-full justify-center">
          {isLoading ? (
            <div className="py-12 text-[12px] text-sz-n-500">불러오는 중…</div>
          ) : (
            emptyState
          )}
        </div>
      )}
    </div>
  )
}
