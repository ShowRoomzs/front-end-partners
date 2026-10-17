import StatusBadge from "@/common/components/StatusBadge/StatusBadge"
import { MNote } from "@/features/settlement/components/detail/DetailParts"
import { SETTLEMENT_TONE_VARIANT } from "@/features/settlement/constants/params"
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
 * 리워드 칸에는 별도로 붙는 부가세를 병기한다. 조회 전용이라 체크박스·관리 열이 없다.
 * 「내 수취액」은 서버 `brandPayoutAmount`(차감 반영 후 = 이번 지급액)다.
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
          <td className={cn(HEAD_CLASS, "w-[124px] text-center")}>상태</td>
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

/**
 * 지급(예정)일 칸 — 서버 `schedule`(브랜드 지급 행 기준) 그대로.
 * 정산 확인 중 「MM.DD까지 확인」 · 지급 예정 「MM.DD 예정」 · 지급 완료 날짜 · 그 외 「—」.
 * 정산이 아직 지급 예정이어도 브랜드 몫이 나갔으면 지급일이 온다.
 */
function payoutCell(row: SettlementListItem) {
  const { kind, date } = row.schedule
  if (!date) return null
  switch (kind) {
    case "REVIEW_DUE":
      return `${formatMonthDay(date)}까지 확인`
    case "PAYOUT_DUE":
      return `${formatMonthDay(date)} 예정`
    case "PAID":
      return formatMonthDay(date)
    default:
      return null
  }
}

function Row(props: {
  row: SettlementListItem
  onClick: (row: SettlementListItem) => void
}) {
  const { row, onClick } = props
  const payout = payoutCell(row)

  return (
    <tr
      onClick={() => onClick(row)}
      // 행 전체가 상세로 가는 링크라 키보드로도 열 수 있게 한다(Enter · Space)
      tabIndex={0}
      onKeyDown={event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onClick(row)
        }
      }}
      className="group cursor-pointer border-t border-sz-n-100 outline-none first:border-t-0 hover:bg-sz-accent-50 focus-visible:bg-sz-accent-50"
    >
      <td className={CELL_CLASS}>
        <span className="block truncate font-medium text-sz-n-900 group-hover:text-sz-accent-600">
          {row.groupBuyTitle}
        </span>
      </td>
      <td className={cn(CELL_CLASS, "truncate")}>
        {row.influencer.showroomName}
      </td>
      <td
        className={cn(
          CELL_CLASS,
          "text-center whitespace-nowrap tabular-nums text-sz-n-500"
        )}
      >
        {formatPeriod(row.periodStartAt, row.periodEndAt)}
      </td>
      <td className={cn(CELL_CLASS, "text-center tabular-nums")}>
        {formatWon(row.confirmedSalesAmount)}
      </td>
      <td className={cn(CELL_CLASS, "text-center tabular-nums")}>
        {formatWon(row.feeAmount)}
      </td>
      <td className={cn(CELL_CLASS, "text-center tabular-nums")}>
        {formatWon(row.rewardAmount)}
        <MNote>+ 부가세 {formatWon(row.rewardVatAmount)}</MNote>
      </td>
      <td className={cn(CELL_CLASS, "text-center tabular-nums")}>
        <b>{formatWon(row.brandPayoutAmount)}</b>
      </td>
      <td className={cn(CELL_CLASS, "text-center")}>
        <StatusBadge variant={SETTLEMENT_TONE_VARIANT[row.statusTone]}>
          {row.statusLabel}
        </StatusBadge>
      </td>
      <td
        className={cn(
          CELL_CLASS,
          "text-center whitespace-nowrap tabular-nums",
          payout === null ? "text-sz-n-400" : "text-sz-n-500"
        )}
      >
        {payout ?? "—"}
      </td>
    </tr>
  )
}
