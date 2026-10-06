import type { Columns } from "@/common/components/Table/types"
import { formatMonthDay } from "@/features/contracts/utils/datetime"
import { periodText } from "@/features/contracts/utils/format"
import { GbBadge } from "@/features/groupBuy/components/shared/GbParts"
import type { GroupBuyListItem } from "@/features/groupBuy/types"

/**
 * 비고 — 상태만으로 알 수 없는 예외(걸린 요청 · 직권 중단)만 서버가 코드로 내린다.
 * 시안 A1은 상태 배지 아래 작은 글씨로 적는다(「직권 중단 예정 · 소명 기한 08.19」).
 */
function remarkText(remark: NonNullable<GroupBuyListItem["remark"]>) {
  switch (remark.code) {
    case "ADMIN_SUSPENSION_NOTICED":
      return remark.appealDeadlineAt
        ? `직권 중단 예정 · 소명 기한 ${formatMonthDay(remark.appealDeadlineAt)}`
        : "직권 중단 예정"
    case "SUSPENSION_REQUEST_REVIEWING":
      return "중단 요청 검토 중"
    case "EARLY_CLOSE_REQUEST_REVIEWING":
      return "조기 마감 요청 검토 중"
    case "EXTENSION_PENDING":
      return "연장 요청 대기"
    case "SUSPENDED_BY_ADMIN":
      return "운영자 직권 중단"
    default:
      return null
  }
}

/**
 * 시안 A1 컬럼 6종(나머지 / 156 / 92 / 272 / 124 / 128 · 본문 1150 기준).
 * 공용 Table은 셀을 px로 고정하므로 합이 본문 폭을 넘으면 상태 열이 잘린다 — 1280 화면 본문(974)에
 * 들어가게 시안 비율로 줄여 두고, fitWidth가 넓은 화면에서 비율대로 다시 늘린다(1440에서 시안과 같은 비율).
 * 공구명에 폭을 안 주면 긴 제목이 한 줄 길이로 측정돼 표가 밀리므로 공구명도 폭을 준다.
 * 관리 열이 없다(행 전체 클릭). 게시물은 인플루언서 소관 값이라 공구 상태와 별 열이다.
 */
export const GROUP_BUY_COLUMNS: Columns<GroupBuyListItem> = [
  {
    key: "title",
    label: "공구명",
    width: 300,
    render: value => (
      <span className="block truncate font-medium text-sz-n-900 group-hover:text-sz-accent-600">
        {value as string}
      </span>
    ),
  },
  {
    key: "creatorName",
    label: "인플루언서",
    width: 132,
    render: value => (
      <span className="block truncate">{(value as string | null) ?? "—"}</span>
    ),
  },
  {
    key: "itemCount",
    label: "상품 수",
    width: 78,
    align: "center",
    render: value => <span className="tabular-nums">{value as number}</span>,
  },
  {
    key: "startAt",
    label: "공구 기간",
    width: 250,
    align: "center",
    render: (_value, record) => (
      <span className="whitespace-nowrap tabular-nums text-sz-n-500">
        {periodText(record.startAt, record.endAt) ?? "—"}
      </span>
    ),
  },
  {
    key: "postStatusLabel",
    label: "게시물",
    width: 105,
    align: "center",
    render: (value, record) => (
      <GbBadge tone={record.postStatusTone}>{value as string}</GbBadge>
    ),
  },
  {
    key: "statusLabel",
    label: "상태",
    width: 108,
    align: "center",
    render: (value, record) => {
      const note = record.remark ? remarkText(record.remark) : null
      return (
        <div className="flex flex-col items-center">
          <GbBadge tone={record.statusTone}>{value as string}</GbBadge>
          {note && (
            <span
              className={
                record.remark?.code === "ADMIN_SUSPENSION_NOTICED"
                  ? "mt-[3px] whitespace-normal text-center text-[11px] text-sz-warning-text"
                  : "mt-[3px] whitespace-normal text-center text-[11px] text-sz-n-600"
              }
            >
              {note}
            </span>
          )}
        </div>
      )
    },
  },
]
