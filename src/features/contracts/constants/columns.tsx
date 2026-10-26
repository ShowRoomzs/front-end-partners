import StatusBadge from "@/common/components/StatusBadge/StatusBadge"
import type { Columns } from "@/common/components/Table/types"
import { formatDateOnly } from "@/common/utils/formatDate"
import type { ContractListItem } from "@/features/contracts/types"
import { SanctionHoldBadge } from "@/features/suspension"
import { periodText } from "@/features/contracts/utils/format"
import {
  contractStatusLabel,
  toneToVariant,
} from "@/features/contracts/utils/statusBadge"

/**
 * 시안 A1 컬럼 6종 — 폭도 시안 그대로다(나머지 / 150 / 82 / 280 / 118 / 124).
 * 관리 열이 없다(행 전체 클릭). 작성중 행은 공구명·기간이 비어 있을 수 있고,
 * 서버는 표시 문구를 지어내지 않으므로 여기서 회색으로 채운다.
 */
export const CONTRACT_COLUMNS: Columns<ContractListItem> = [
  {
    key: "title",
    label: "공구명",
    width: 360,
    render: value =>
      value ? (
        <span className="block truncate font-medium text-sz-n-900 group-hover:text-sz-accent-600">
          {value as string}
        </span>
      ) : (
        <span className="block truncate font-medium text-sz-n-400">
          (공구명 미입력)
        </span>
      ),
  },
  {
    key: "counterpartyName",
    label: "계약 상대",
    width: 150,
    render: value => (
      <span className="block truncate text-sz-n-700">
        {(value as string | null) ?? "—"}
      </span>
    ),
  },
  {
    key: "itemCount",
    label: "상품 수",
    width: 82,
    align: "center",
    render: value => <span className="tabular-nums">{value as number}</span>,
  },
  {
    key: "startAt",
    label: "공구 기간",
    width: 280,
    align: "center",
    render: (_value, record) => {
      const text = periodText(record.startAt, record.endAt)
      return text ? (
        <span className="whitespace-nowrap tabular-nums text-sz-n-500">
          {text}
        </span>
      ) : (
        <span className="text-sz-n-400">미설정</span>
      )
    },
  },
  {
    key: "createdAt",
    label: "생성일",
    width: 118,
    align: "center",
    render: value => (
      <span className="whitespace-nowrap tabular-nums text-sz-n-500">
        {/* 시안 A1 — 118px 열에 시각까지 넣으면 잘린다. 날짜만 */}
        {formatDateOnly(value as string)}
      </span>
    ),
  },
  {
    key: "statusLabel",
    label: "상태",
    width: 124,
    align: "center",
    // 시안 15 S4 — 정지 보류는 상태를 바꾸지 않고 옆에 보조 배지만 붙인다(좁은 열이라 줄바꿈 허용)
    render: (value, record) => (
      <span className="inline-flex flex-wrap justify-center gap-1">
        <StatusBadge variant={toneToVariant(record.statusTone)}>
          {contractStatusLabel(record.status, value as string)}
        </StatusBadge>
        <SanctionHoldBadge hold={record.sanctionHold} />
      </span>
    ),
  },
]

/**
 * 정지 보류 배지가 있는 페이지만 상태 열을 넓힌다. 시안 폭(124px)은 상태 배지 하나 기준이라
 * 「공구 생성 보류 · 계정 이용 정지」가 옆에 붙으면 셀 밖으로 잘린다(공용 Table은 셀을 넘치지 않게 자른다).
 * 배지가 없는 평소 화면은 시안 폭 그대로다. 공구 목록도 같은 이유로 쓴다.
 */
export const SANCTION_HOLD_STATUS_WIDTH = 196

export function widenStatusForHold<T>(
  columns: Columns<T>,
  statusKey: string,
  hasHold: boolean
): Columns<T> {
  if (!hasHold) return columns
  return columns.map(column =>
    column.key === statusKey
      ? { ...column, width: SANCTION_HOLD_STATUS_WIDTH }
      : column
  )
}
