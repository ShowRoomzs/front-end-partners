import StatusBadge from "@/common/components/StatusBadge/StatusBadge"
import { SELECT_CHEVRON_STYLE } from "@/features/contracts/constants/params"
import {
  CARRIER_OPTIONS,
  CLAIM_TAB_LABEL,
  SELLER_BORNE_REASONS,
} from "@/features/claims/constants/params"
import type {
  ClaimListItem,
  ClaimTab,
  DeliveryCarrier,
} from "@/features/claims/types"
import {
  digitsOnly,
  formatMonthDay,
  formatMonthDayTime,
  formatWon,
} from "@/features/claims/utils/format"
import {
  isDraftFilled,
  type ReshipDraft,
} from "@/features/claims/utils/reshipDraft"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import { Fragment, useState } from "react"
import type { ReactNode } from "react"

interface ClaimTableProps {
  tab: ClaimTab
  rows: Array<ClaimListItem>
  selected: Set<number>
  onToggleSelect: (ids: Array<number>, checked: boolean) => void
  onRowClick: (row: ClaimListItem) => void
  onConfirmReceipt: (row: ClaimListItem) => void
  onInspect: (row: ClaimListItem) => void
  drafts: Record<number, ReshipDraft>
  onDraftChange: (claimId: number, draft: ReshipDraft) => void
  onRegisterOne: (row: ClaimListItem) => void
  busyIds: Set<number>
  emptyState: ReactNode
}

const TH =
  "whitespace-nowrap border-b border-sz-n-200 bg-sz-n-100 px-4 py-[11px] text-left text-[11px] font-semibold tracking-[.2px] text-sz-n-600"
const TD =
  "border-t border-sz-n-100 px-4 py-[13px] align-middle text-[12px] text-sz-n-900"
const NOTE = "mt-[3px] block text-[11px] text-sz-n-600"
const DIM = "text-sz-n-300"
const ACT_BTN =
  "inline-flex h-[26px] cursor-pointer items-center justify-center whitespace-nowrap rounded-[6px] border px-[11px] text-[11px] font-medium disabled:cursor-not-allowed disabled:border-sz-n-200 disabled:bg-sz-n-100 disabled:text-sz-n-400"
const ACT_PRIMARY = `${ACT_BTN} border-sz-accent-500 bg-sz-accent-500 text-white hover:border-sz-accent-600 hover:bg-sz-accent-600`
const GRID_SELECT =
  "h-[30px] w-full cursor-pointer appearance-none rounded-[6px] border border-sz-n-300 bg-white pl-2 pr-6 text-[12px] text-sz-n-900 outline-none focus:border-sz-accent-500"
const GRID_INPUT =
  "h-[30px] w-full rounded-[6px] border border-sz-n-300 bg-white px-[9px] text-[12px] tabular-nums text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500"

interface ColumnDef {
  key: string
  label: string
  width?: number
  center?: boolean
  cell: (row: ClaimListItem, ctx: CellContext) => ReactNode
  /** 묶음 그룹 행에서의 값 — 없으면 빈 칸 */
  groupCell?: (lead: ClaimListItem) => ReactNode
}

interface CellContext {
  member: boolean
  props: ClaimTableProps
}

/** 묶음(박스) 안의 행은 공통 값을 회색으로 낮춘다 — 그룹 행이 대표한다 */
function dimIf(member: boolean, node: ReactNode) {
  return member ? <span className="text-sz-n-500">{node}</span> : node
}

const claimNumberCol: ColumnDef = {
  key: "claimNumber",
  label: "접수번호",
  width: 136,
  cell: (row, { member }) =>
    member ? (
      <span className="pl-[18px] tabular-nums text-sz-n-600">
        └ {row.claimNumber}
      </span>
    ) : (
      <span className="tabular-nums">{row.claimNumber}</span>
    ),
}
const typeCol: ColumnDef = {
  key: "type",
  label: "유형",
  width: 80,
  center: true,
  // 유형은 분류라 색을 쓰지 않는다 — 상태색과 섞이면 어느 쪽이 진행 상태인지 읽히지 않는다
  cell: (row, { member }) => dimIf(member, row.typeLabel),
  groupCell: lead => lead.typeLabel,
}
const consumerCol: ColumnDef = {
  key: "consumer",
  label: "소비자",
  width: 120,
  cell: (row, { member }) => dimIf(member, row.consumerName),
  groupCell: lead => lead.consumerName,
}
const productCol = (label = "상품 · 옵션", width?: number): ColumnDef => ({
  key: "product",
  label,
  width,
  cell: row => (
    <span className="block truncate font-medium text-sz-n-900">
      {row.productLabel}
    </span>
  ),
})
const quantityCol: ColumnDef = {
  key: "quantity",
  label: "수량",
  width: 96,
  center: true,
  cell: row => <span className="tabular-nums">{row.quantity}</span>,
}
const reasonCol = (width = 170): ColumnDef => ({
  key: "reason",
  label: "사유",
  width,
  cell: (row, { member }) =>
    dimIf(
      member,
      <>
        {row.reasonLabel}
        {row.consumerAttachmentCount > 0 && !member && (
          <span className={NOTE}>증빙 {row.consumerAttachmentCount}장</span>
        )}
      </>
    ),
  groupCell: lead => lead.reasonLabel,
})
/** 「경과」 — 현재 단계 진입부터의 달력일. 기한 초과만 경고색이다(경과 일수 자체는 경고가 아니다) */
const elapsedCol = (label = "경과", width = 110): ColumnDef => ({
  key: "elapsed",
  label,
  width,
  center: true,
  cell: (row, { member }) => (
    <span
      className={cn(
        "tabular-nums",
        row.overdue && !member && "font-medium text-sz-warning-text",
        member && "text-sz-n-500"
      )}
    >
      {row.elapsedDays}일
    </span>
  ),
  groupCell: lead => (
    <span
      className={cn(
        "tabular-nums",
        lead.overdue && "font-medium text-sz-warning-text"
      )}
    >
      {lead.elapsedDays}일
    </span>
  ),
})

function ActionCell(props: { children: ReactNode }) {
  return (
    <div
      className="flex justify-center"
      onClick={event => event.stopPropagation()}
    >
      {props.children}
    </div>
  )
}

const noActionCol: ColumnDef = {
  key: "action",
  label: "관리",
  width: 140,
  center: true,
  cell: () => <span className={DIM}>—</span>,
}

/** 재발송비 — 서버 금액이 없어 부담 주체만 밝힌다(사유의 부담 주체는 서버 ClaimReason 값이다) */
function reshipFeeCell(row: ClaimListItem) {
  if (row.reshipReason === "REJECT_RETURN") {
    return (
      <>
        결제됨<span className={NOTE}>소비자 재배송비</span>
      </>
    )
  }
  if (SELLER_BORNE_REASONS.includes(row.reasonCode)) {
    return (
      <>
        브랜드 부담<span className={NOTE}>{row.reasonLabel}</span>
      </>
    )
  }
  return (
    <>
      결제됨<span className={NOTE}>교환 신청 시 선결제</span>
    </>
  )
}

function columnsFor(tab: ClaimTab): Array<ColumnDef> {
  switch (tab) {
    case "COLLECT_WAIT":
      // 회수는 소비자가 직접 보낸다 — 이 탭은 보는 큐라 입력·관리 열이 없다
      return [
        claimNumberCol,
        typeCol,
        consumerCol,
        productCol(),
        { ...quantityCol, width: 120 },
        reasonCol(210),
        elapsedCol(),
      ]
    case "COLLECTING":
      return [
        { ...claimNumberCol, width: 106 },
        { ...typeCol, width: 56 },
        { ...consumerCol, width: 64 },
        productCol("상품 · 옵션", 210),
        { ...quantityCol, width: 50 },
        {
          key: "carrier",
          label: "회수 택배사",
          width: 118,
          cell: (row, { member }) =>
            dimIf(member, row.collection?.carrierLabel ?? "—"),
          groupCell: lead => lead.collection?.carrierLabel ?? "—",
        },
        {
          key: "tracking",
          label: "회수 송장",
          width: 144,
          cell: (row, { member }) =>
            dimIf(
              member,
              <span className="tabular-nums">
                {row.collection?.trackingNumber ?? "—"}
              </span>
            ),
          groupCell: lead => (
            <span className="tabular-nums">
              {lead.collection?.trackingNumber ?? "—"}
            </span>
          ),
        },
        {
          key: "lastTracking",
          label: "최근 추적",
          width: 126,
          center: true,
          cell: (row, { member }) =>
            member ? <span className={DIM}>〃</span> : trackingCell(row),
          groupCell: trackingCell,
        },
        elapsedCol("경과", 88),
        {
          // 택배 추적이 꺼져 있으면 도착이 감지되지 않아 회수 중 건도 입고 확인을 받는다 — 정본은 서버 actions
          ...noActionCol,
          cell: (row, { props }) =>
            row.actions.canConfirmReceipt ? (
              <ActionCell>
                <button
                  type="button"
                  className={ACT_PRIMARY}
                  disabled={props.busyIds.has(row.claimId)}
                  onClick={() => props.onConfirmReceipt(row)}
                >
                  입고 확인
                </button>
              </ActionCell>
            ) : (
              <span className={DIM}>—</span>
            ),
        },
      ]
    case "INSPECTION":
      return [
        { ...claimNumberCol, width: 106 },
        { ...typeCol, width: 56 },
        { ...consumerCol, width: 64 },
        productCol("상품 · 옵션", 210),
        quantityCol,
        reasonCol(124),
        {
          key: "receivedAt",
          label: "입고 확인",
          width: 126,
          center: true,
          cell: row =>
            row.receivedAt ? (
              <span className="tabular-nums text-sz-n-500">
                {formatMonthDayTime(row.receivedAt)}
              </span>
            ) : (
              <span className="text-sz-n-400">—</span>
            ),
        },
        {
          key: "inspectElapsed",
          label: "검수 경과",
          width: 96,
          center: true,
          // 검수 기한은 입고 확인 때 발급된다 — 확인 전에는 셀 일이 없다
          cell: row =>
            row.receivedAt ? (
              <span
                className={cn(
                  "tabular-nums",
                  row.overdue && "font-medium text-sz-warning-text"
                )}
              >
                {row.elapsedDays}일
              </span>
            ) : (
              <span className="text-sz-n-400">—</span>
            ),
        },
        {
          // 한 자리에서 교체된다 — 입고 확인 전 [입고 확인], 확인 뒤 [검수]
          ...noActionCol,
          cell: (row, { props }) => (
            <ActionCell>
              {row.actions.canConfirmReceipt ? (
                <button
                  type="button"
                  className={ACT_PRIMARY}
                  disabled={props.busyIds.has(row.claimId)}
                  onClick={() => props.onConfirmReceipt(row)}
                >
                  입고 확인
                </button>
              ) : row.actions.canInspect ? (
                <button
                  type="button"
                  className={ACT_PRIMARY}
                  onClick={() => props.onInspect(row)}
                >
                  검수
                </button>
              ) : (
                <span className={DIM}>—</span>
              )}
            </ActionCell>
          ),
        },
      ]
    case "RESHIP":
      return [
        { ...claimNumberCol, width: 106 },
        { ...typeCol, width: 56 },
        { ...consumerCol, width: 64 },
        {
          key: "shipLabel",
          label: "보낼 상품 · 옵션",
          cell: row => (
            <span className="block truncate font-medium">
              {row.shipLabel ?? row.productLabel}
            </span>
          ),
        },
        { ...quantityCol, width: 50 },
        {
          key: "reshipReason",
          label: "재발송 사유",
          width: 118,
          // 보내는 물건이 다르다 — 교환 재발송은 새 옵션, 반려 반송은 회수한 원래 상품
          cell: row => (
            <>
              {row.reshipReasonLabel ?? "—"}
              <span className={NOTE}>
                {row.reshipReason === "REJECT_RETURN"
                  ? "원래 상품 반송"
                  : "검수 통과"}
              </span>
            </>
          ),
        },
        {
          key: "reshipFee",
          label: "재발송비",
          width: 112,
          cell: reshipFeeCell,
        },
        {
          key: "carrierInput",
          label: "택배사",
          width: 126,
          cell: (row, { props }) => {
            const draft = props.drafts[row.claimId]
            return (
              <div onClick={event => event.stopPropagation()}>
                <select
                  aria-label="택배사"
                  value={draft?.carrier ?? ""}
                  onChange={event =>
                    props.onDraftChange(row.claimId, {
                      carrier: event.target.value as DeliveryCarrier | "",
                      trackingNumber: draft?.trackingNumber ?? "",
                    })
                  }
                  style={SELECT_CHEVRON_STYLE}
                  className={GRID_SELECT}
                >
                  <option value="">선택</option>
                  {CARRIER_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )
          },
        },
        {
          key: "trackingInput",
          label: "송장번호",
          width: 150,
          cell: (row, { props }) => {
            const draft = props.drafts[row.claimId]
            return (
              <div onClick={event => event.stopPropagation()}>
                <input
                  aria-label="송장번호"
                  inputMode="numeric"
                  placeholder="숫자만 입력"
                  value={draft?.trackingNumber ?? ""}
                  onChange={event =>
                    props.onDraftChange(row.claimId, {
                      carrier: draft?.carrier ?? "",
                      trackingNumber: digitsOnly(event.target.value),
                    })
                  }
                  className={cn(
                    GRID_INPUT,
                    draft?.error && "border-sz-danger-text"
                  )}
                />
                {draft?.error && (
                  <span className="mt-1 block text-[11px] leading-[1.5] text-sz-danger-text">
                    {draft.error}
                  </span>
                )}
              </div>
            )
          },
        },
        { ...elapsedCol("경과", 74) },
        {
          ...noActionCol,
          cell: (row, { props }) => (
            <ActionCell>
              <button
                type="button"
                className={ACT_PRIMARY}
                disabled={
                  !row.actions.canRegisterReshipment ||
                  !isDraftFilled(props.drafts[row.claimId]) ||
                  props.busyIds.has(row.claimId)
                }
                onClick={() => props.onRegisterOne(row)}
              >
                재발송 송장 등록
              </button>
            </ActionCell>
          ),
        },
      ]
    case "REJECT_HOLD":
      return [
        { ...claimNumberCol, width: 106 },
        { ...typeCol, width: 56 },
        { ...consumerCol, width: 64 },
        {
          key: "shipLabel",
          label: "보관 중인 상품",
          cell: row => (
            <span className="block truncate font-medium">
              {row.shipLabel ?? row.productLabel}
            </span>
          ),
        },
        { ...quantityCol, width: 50 },
        {
          key: "rejectReason",
          label: "반려 사유",
          width: 132,
          cell: row => (
            <>
              {row.rejectReasonLabel ?? "—"}
              {row.sellerEvidenceCount > 0 && (
                <span className={NOTE}>증빙 {row.sellerEvidenceCount}장</span>
              )}
            </>
          ),
        },
        {
          key: "rejectedAt",
          label: "반려일시",
          width: 126,
          center: true,
          cell: row => (
            <span className="tabular-nums text-sz-n-500">
              {formatMonthDayTime(row.rejectedAt)}
            </span>
          ),
        },
        {
          key: "storage",
          label: "고지 · 보관 기한",
          width: 150,
          center: true,
          // 고지는 시스템 발송이다 — 브랜드는 몇 번 알렸는지와 언제까지 보관하는지만 본다
          cell: row => {
            const storage = row.storage
            if (!storage) return <span className={DIM}>—</span>
            return (
              <span className="tabular-nums">
                {storage.noticeCount}회 고지
                <span className={NOTE}>
                  {storage.storageDueAt
                    ? `보관 ~ ${formatMonthDay(storage.storageDueAt)} · 최종 고지 ${formatMonthDay(storage.lastNoticeAt)}`
                    : "고지 2회 후 보관 기한 확정"}
                </span>
              </span>
            )
          },
        },
        noActionCol,
      ]
    case "DONE":
      return [
        { ...claimNumberCol, width: 106 },
        { ...typeCol, width: 56 },
        { ...consumerCol, width: 64 },
        productCol("상품 · 옵션", 210),
        quantityCol,
        { ...reasonCol(170), cell: row => row.reasonLabel },
        {
          key: "outcome",
          label: "결과",
          width: 140,
          cell: row => row.outcome?.label ?? row.statusLabel,
        },
        {
          key: "amount",
          label: "금액",
          width: 112,
          center: true,
          cell: row => (
            <span className="tabular-nums">
              {row.amount !== null ? formatWon(row.amount) : "—"}
            </span>
          ),
        },
        {
          key: "completedAt",
          label: "종결일시",
          width: 118,
          center: true,
          cell: row => (
            <span className="tabular-nums text-sz-n-500">
              {row.completedAt ? formatMonthDayTime(row.completedAt) : "—"}
            </span>
          ),
        },
      ]
    case "ALL":
    default:
      // 「단계」 열은 전체 탭에만 있다 — 단일 단계 탭에서는 전 행이 같은 값이라 정보가 없다
      return [
        { ...claimNumberCol, width: 104 },
        { ...typeCol, width: 64 },
        { ...consumerCol, width: 84 },
        {
          ...productCol("상품 · 옵션", 210),
          cell: row => (
            <>
              <span className="block truncate font-medium">
                {row.productLabel}
              </span>
              {row.orderItems.length > 1 && (
                <span className={NOTE}>{row.orderSummary}</span>
              )}
            </>
          ),
        },
        quantityCol,
        { ...reasonCol(170), cell: row => row.reasonLabel },
        {
          key: "requestedAt",
          label: "신청일시",
          width: 110,
          center: true,
          cell: row => (
            <span className="tabular-nums text-sz-n-500">
              {formatMonthDayTime(row.requestedAt)}
            </span>
          ),
        },
        {
          ...elapsedCol("경과", 76),
          cell: row =>
            row.stage === "DONE" ? (
              <span className="tabular-nums">—</span>
            ) : (
              <span
                className={cn(
                  "tabular-nums",
                  row.overdue && "font-medium text-sz-warning-text"
                )}
              >
                {row.elapsedDays}일
              </span>
            ),
        },
        {
          key: "stage",
          label: "단계",
          width: 112,
          center: true,
          // 단계 배지는 전부 중립이다 — 진행 순서일 뿐 조치 필요를 뜻하지 않는다
          cell: row => (
            <StatusBadge variant="neutral">
              {row.stage ? CLAIM_TAB_LABEL[row.stage] : row.statusLabel}
            </StatusBadge>
          ),
        },
      ]
  }
}

function trackingCell(row: ClaimListItem) {
  const collection = row.collection
  if (!collection?.lastTrackingLabel) {
    return <span className="text-sz-n-400">—</span>
  }
  return (
    <>
      {collection.lastTrackingLabel}
      <span className={cn(NOTE, "tabular-nums")}>
        {formatMonthDayTime(collection.lastTrackingAt)}
      </span>
    </>
  )
}

/** 시안 `.cb` */
function CheckBox(props: {
  checked: boolean
  indeterminate?: boolean
  onChange: (checked: boolean) => void
  label: string
}) {
  const { checked, indeterminate = false, onChange, label } = props
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-label={label}
      onClick={event => {
        event.stopPropagation()
        onChange(!checked)
      }}
      className={cn(
        "inline-flex size-[15px] shrink-0 cursor-pointer items-center justify-center rounded-[4px] border-[1.5px] align-middle",
        checked || indeterminate
          ? "border-sz-accent-500 bg-sz-accent-500"
          : "border-sz-n-300 bg-white"
      )}
    >
      {checked && <Check className="size-[9px] text-white" strokeWidth={3} />}
      {!checked && indeterminate && (
        <span className="h-[1.5px] w-[7px] bg-white" />
      )}
    </button>
  )
}

/** 시안 `.xt` — 행 확장 토글 */
function ExpandToggle(props: { open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-label={props.open ? "접기" : "펼치기"}
      aria-expanded={props.open}
      onClick={event => {
        event.stopPropagation()
        props.onToggle()
      }}
      className={cn(
        "inline-flex size-4 cursor-pointer items-center justify-center rounded-[3px] text-[9px] hover:bg-sz-n-100 hover:text-sz-n-700",
        props.open ? "text-sz-accent-600" : "text-sz-n-400"
      )}
    >
      {props.open ? "▼" : "▶"}
    </button>
  )
}

type RowBlock =
  | { kind: "single"; row: ClaimListItem }
  | { kind: "group"; collectionId: number; rows: Array<ClaimListItem> }

/** 같은 박스는 서버가 인접하게 정렬해 준다 — 연속한 같은 묶음을 한 블록으로 모은다 */
function toBlocks(rows: Array<ClaimListItem>, grouped: boolean) {
  const blocks: Array<RowBlock> = []
  rows.forEach(row => {
    const collection = row.collection
    if (!grouped || !collection || collection.size < 2) {
      blocks.push({ kind: "single", row })
      return
    }
    const last = blocks[blocks.length - 1]
    if (
      last?.kind === "group" &&
      last.collectionId === collection.collectionId
    ) {
      last.rows.push(row)
      return
    }
    blocks.push({
      kind: "group",
      collectionId: collection.collectionId,
      rows: [row],
    })
  })
  return blocks
}

/**
 * 반품·교환 목록 표 — 탭마다 열 구성이 다르다(시안 A1·A3~A8).
 *
 * 회수 대기·회수 중은 같은 박스로 오는 클레임을 「회수 그룹」 행으로 묶어 ▼/▶로 펼친다(기본 닫힘).
 * 전체 탭은 ▸로 원 주문의 항목 전체를 펼친다 — 일부만 신청된 주문에서 멀쩡한 항목까지 회수·환불하는 사고를 막는다.
 */
export default function ClaimTable(props: ClaimTableProps) {
  const { tab, rows, selected, onToggleSelect, onRowClick, emptyState } = props
  const [openGroups, setOpenGroups] = useState<Set<number>>(new Set())
  const [openRows, setOpenRows] = useState<Set<number>>(new Set())

  const columns = columnsFor(tab)
  const grouped = tab === "COLLECT_WAIT" || tab === "COLLECTING"
  const expandable = tab === "ALL"
  const blocks = toBlocks(rows, grouped)
  const colSpan = columns.length + 1 + (expandable ? 1 : 0)

  const allIds = rows.map(row => row.claimId)
  const selectedCount = allIds.filter(id => selected.has(id)).length

  const toggleSet = (setter: typeof setOpenGroups, key: number) =>
    setter(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const renderRow = (row: ClaimListItem, member = false) => {
    const filled = tab === "RESHIP" && isDraftFilled(props.drafts[row.claimId])
    const hasError = tab === "RESHIP" && !!props.drafts[row.claimId]?.error
    const isOpen = openRows.has(row.claimId)
    return (
      <Fragment key={row.claimId}>
        <tr
          onClick={() => onRowClick(row)}
          className={cn(
            "cursor-pointer hover:bg-sz-accent-50 [&:hover_.t-nm]:text-sz-accent-600",
            member && "bg-white",
            filled && "bg-sz-accent-50",
            hasError && "bg-[#FDF6F6]",
            selected.has(row.claimId) && "bg-sz-accent-50"
          )}
        >
          <td className={TD} style={{ width: 34 }}>
            {!member && (
              <CheckBox
                label={`${row.claimNumber} 선택`}
                checked={selected.has(row.claimId)}
                onChange={checked => onToggleSelect([row.claimId], checked)}
              />
            )}
          </td>
          {expandable && (
            <td className={cn(TD, "text-center")}>
              {row.orderItems.length > 0 && (
                <ExpandToggle
                  open={isOpen}
                  onToggle={() => toggleSet(setOpenRows, row.claimId)}
                />
              )}
            </td>
          )}
          {columns.map(column => (
            <td
              key={column.key}
              className={cn(
                TD,
                column.center && "text-center",
                "overflow-hidden"
              )}
            >
              {column.cell(row, { member, props })}
            </td>
          ))}
        </tr>
        {expandable && isOpen && (
          <tr>
            <td
              colSpan={colSpan}
              className="border-t-0 bg-sz-n-50 pb-3 pl-[68px] pr-4 pt-0"
            >
              <OrderItemsTable row={row} />
            </td>
          </tr>
        )}
      </Fragment>
    )
  }

  const renderGroup = (block: Extract<RowBlock, { kind: "group" }>) => {
    const lead = block.rows[0]
    const ids = block.rows.map(row => row.claimId)
    const checkedCount = ids.filter(id => selected.has(id)).length
    const isOpen = openGroups.has(block.collectionId)
    const size = lead.collection?.size ?? block.rows.length
    return (
      <Fragment key={`g-${block.collectionId}`}>
        <tr
          onClick={() => toggleSet(setOpenGroups, block.collectionId)}
          className="cursor-pointer bg-sz-n-50 hover:bg-sz-accent-50"
        >
          <td className={TD}>
            <CheckBox
              label="회수 그룹 선택"
              checked={checkedCount === ids.length}
              indeterminate={checkedCount > 0 && checkedCount < ids.length}
              onChange={checked => onToggleSelect(ids, checked)}
            />
          </td>
          {columns.map((column, index) => {
            if (index === 0) {
              return (
                <td key={column.key} className={cn(TD, "tabular-nums")}>
                  <span className="inline-flex items-center gap-1.5">
                    <ExpandToggle
                      open={isOpen}
                      onToggle={() =>
                        toggleSet(setOpenGroups, block.collectionId)
                      }
                    />
                    <span className="inline-flex items-center gap-[5px] text-[11px] font-semibold text-sz-n-600">
                      <i className="inline-block h-[11px] w-[3px] rounded-[2px] bg-sz-accent-500" />
                      회수 그룹
                    </span>
                  </span>
                </td>
              )
            }
            if (column.key === "product") {
              return (
                <td key={column.key} className={TD} colSpan={2}>
                  <span className="t-nm font-medium">
                    {lead.collection?.leadClaimNumber ?? lead.claimNumber} 외{" "}
                    {size - 1}건
                  </span>
                </td>
              )
            }
            if (column.key === "quantity") return null
            return (
              <td
                key={column.key}
                className={cn(TD, column.center && "text-center")}
              >
                {column.groupCell ? column.groupCell(lead) : null}
              </td>
            )
          })}
        </tr>
        {isOpen && block.rows.map(row => renderRow(row, true))}
      </Fragment>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed border-collapse">
        <colgroup>
          <col style={{ width: 34 }} />
          {expandable && <col style={{ width: 26 }} />}
          {columns.map(column => (
            <col
              key={column.key}
              style={column.width ? { width: column.width } : undefined}
            />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th className={TH}>
              <CheckBox
                label="전체 선택"
                checked={rows.length > 0 && selectedCount === rows.length}
                indeterminate={selectedCount > 0 && selectedCount < rows.length}
                onChange={checked => onToggleSelect(allIds, checked)}
              />
            </th>
            {expandable && <th className={TH} />}
            {columns.map(column => (
              <th
                key={column.key}
                className={cn(TH, column.center && "text-center")}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={colSpan}>{emptyState}</td>
            </tr>
          ) : (
            blocks.map(block =>
              block.kind === "group" ? renderGroup(block) : renderRow(block.row)
            )
          )}
        </tbody>
      </table>
    </div>
  )
}

/** A8x — 원 주문의 항목 전체. 신청분과 살아 있는 분이 한눈에 갈린다 */
function OrderItemsTable(props: { row: ClaimListItem }) {
  const XTD = "border-t border-sz-n-100 bg-white px-3 py-2 text-[11px]"
  const XTH =
    "bg-sz-n-100 px-3 py-2 text-left text-[11px] font-semibold text-sz-n-600"
  return (
    <table className="w-full border-collapse overflow-hidden rounded-[6px] border border-sz-n-200 bg-white">
      <thead>
        <tr>
          <th className={XTH}>주문 항목</th>
          <th className={cn(XTH, "w-16 text-center")}>주문 수량</th>
          <th className={cn(XTH, "w-20 text-center")}>신청 수량</th>
          <th className={cn(XTH, "w-24 text-center")}>공구가</th>
          <th className={cn(XTH, "w-[104px] text-center")}>항목 상태</th>
        </tr>
      </thead>
      <tbody>
        {props.row.orderItems.map((item, index) => (
          <tr key={`${item.productName}-${item.optionName}-${index}`}>
            <td className={XTD}>
              {item.productName}
              {item.optionName && (
                <span className="text-sz-n-500"> / {item.optionName}</span>
              )}
            </td>
            <td className={cn(XTD, "text-center tabular-nums")}>
              {item.orderedQuantity}
            </td>
            <td className={cn(XTD, "text-center tabular-nums")}>
              {item.claimedQuantity > 0 ? item.claimedQuantity : "—"}
            </td>
            <td className={cn(XTD, "text-center tabular-nums")}>
              {formatWon(item.price)}
            </td>
            <td className={cn(XTD, "text-center")}>
              <StatusBadge
                variant={
                  item.itemStatusLabel === "구매확정" ? "success" : "neutral"
                }
              >
                {item.itemStatusLabel}
              </StatusBadge>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
