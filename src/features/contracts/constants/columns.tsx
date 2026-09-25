import StatusBadge from "@/common/components/StatusBadge/StatusBadge"
import type { Columns } from "@/common/components/Table/types"
import { formatDateTimeShort } from "@/common/utils/formatDate"
import type { ContractListItem } from "@/features/contracts/types"
import { periodText } from "@/features/contracts/utils/format"
import { toneToVariant } from "@/features/contracts/utils/statusBadge"

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
        {formatDateTimeShort(value as string)}
      </span>
    ),
  },
  {
    key: "statusLabel",
    label: "상태",
    width: 124,
    align: "center",
    render: (value, record) => (
      <StatusBadge variant={toneToVariant(record.statusTone)}>
        {value as string}
      </StatusBadge>
    ),
  },
]
