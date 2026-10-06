import StatusBadge from "@/common/components/StatusBadge/StatusBadge"
import {
  SETTLEMENT_STATUS_LABEL,
  SETTLEMENT_STATUS_VARIANT,
} from "@/features/settlement/constants/params"
import type { SettlementListItem } from "@/features/settlement/types"
import {
  formatMonthDay,
  formatPeriod,
  formatWon,
} from "@/features/settlement/utils/format"
import { cn } from "@/lib/utils"

const HEAD_CLASS =
  "whitespace-nowrap border-b border-sz-n-200 bg-sz-n-100 px-4 py-[11px] text-[11px] font-semibold tracking-[.2px] text-sz-n-600"
const CELL_CLASS = "px-4 py-[13px] text-[12px] align-middle"

/**
 * 시안 L1 표 — 열은 **확정 거래액 → 수수료 → 리워드 → 내 수취액** 계산 순서 그대로.
 * 조회 전용이라 체크박스·관리 열이 없다. 정산 대기 행은 금액이 없으니 흐리게 두고 「—」.
 */
export default function SettlementTable(props: {
  rows: Array<SettlementListItem>
  onRowClick: (row: SettlementListItem) => void
}) {
  const { rows, onRowClick } = props

  return (
    <table className="w-full table-fixed border-collapse">
      <thead>
        <tr>
          <td className={HEAD_CLASS}>공구명</td>
          <td className={cn(HEAD_CLASS, "w-[104px]")}>인플루언서</td>
          <td className={cn(HEAD_CLASS, "w-[132px] text-center")}>
            정산 대상 기간
          </td>
          <td className={cn(HEAD_CLASS, "w-[116px] text-center")}>
            확정 거래액
          </td>
          <td className={cn(HEAD_CLASS, "w-[104px] text-center")}>수수료</td>
          <td className={cn(HEAD_CLASS, "w-[104px] text-center")}>리워드</td>
          <td className={cn(HEAD_CLASS, "w-[116px] text-center")}>내 수취액</td>
          <td className={cn(HEAD_CLASS, "w-[96px] text-center")}>상태</td>
          <td className={cn(HEAD_CLASS, "w-[104px] text-center")}>
            지급(예정)일
          </td>
        </tr>
      </thead>
      <tbody>
        {rows.map(row => (
          <Row key={row.settlementId} row={row} onClick={onRowClick} />
        ))}
      </tbody>
    </table>
  )
}

function Row(props: {
  row: SettlementListItem
  onClick: (row: SettlementListItem) => void
}) {
  const { row, onClick } = props
  const pending = row.status === "PENDING"
  const money = (value: number | null, bold = false) =>
    value === null ? (
      <span className="text-sz-n-400">—</span>
    ) : bold ? (
      <b className="font-semibold">{formatWon(value)}</b>
    ) : (
      formatWon(value)
    )

  return (
    <tr
      onClick={() => onClick(row)}
      className={cn(
        "group cursor-pointer border-t border-sz-n-100 first:border-t-0 hover:bg-sz-accent-50",
        pending && "opacity-[.62]"
      )}
    >
      <td className={CELL_CLASS}>
        <span
          className={cn(
            "block truncate font-medium group-hover:text-sz-accent-600",
            pending ? "text-sz-n-500" : "text-sz-n-900"
          )}
          title={
            pending
              ? "모든 주문 처리가 끝나면 정산 금액이 확정됩니다"
              : undefined
          }
        >
          {row.groupBuyTitle}
        </span>
      </td>
      <td className={cn(CELL_CLASS, "truncate", pending && "text-sz-n-500")}>
        {row.creatorShowroomName}
      </td>
      <td
        className={cn(
          CELL_CLASS,
          "text-center whitespace-nowrap tabular-nums text-sz-n-500"
        )}
      >
        {formatPeriod(row.periodStart, row.periodEnd)}
      </td>
      <td className={cn(CELL_CLASS, "text-center tabular-nums")}>
        {money(row.confirmedSales)}
      </td>
      <td className={cn(CELL_CLASS, "text-center tabular-nums")}>
        {money(row.feeAmount)}
      </td>
      <td className={cn(CELL_CLASS, "text-center tabular-nums")}>
        {money(row.rewardAmount)}
      </td>
      <td className={cn(CELL_CLASS, "text-center tabular-nums")}>
        {money(row.payoutAmount, true)}
      </td>
      <td className={cn(CELL_CLASS, "text-center")}>
        <StatusBadge variant={SETTLEMENT_STATUS_VARIANT[row.status]}>
          {SETTLEMENT_STATUS_LABEL[row.status]}
        </StatusBadge>
      </td>
      <td
        className={cn(
          CELL_CLASS,
          "text-center whitespace-nowrap tabular-nums text-sz-n-500"
        )}
      >
        {row.payoutDate === null ? (
          <span className="text-sz-n-400">—</span>
        ) : row.status === "CONFIRMED" ? (
          `${formatMonthDay(row.payoutDate)} 예정`
        ) : (
          formatMonthDay(row.payoutDate)
        )}
      </td>
    </tr>
  )
}
