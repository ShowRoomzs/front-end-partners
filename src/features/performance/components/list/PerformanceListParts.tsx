import StatusBadge from "@/common/components/StatusBadge/StatusBadge"
import Btn from "@/features/contracts/components/shared/Btn"
import { INPUT_CLASS } from "@/features/contracts/components/shared/styles"
import {
  FilterLabel,
  KpiCard,
  KpiGrid,
  StatusCheck,
} from "@/features/performance/components/PerformanceParts"
import {
  PERFORMANCE_STATUS_CHIP_LABEL,
  PERFORMANCE_TONE_VARIANT,
} from "@/features/performance/constants/params"
import {
  PERFORMANCE_STATUSES,
  type PerformanceFigure,
  type PerformanceListItem,
  type PerformanceListParams,
  type PerformanceStatus,
  type PerformanceStatusCounts,
  type PerformanceSummary,
} from "@/features/performance/types"
import {
  formatFigure,
  formatPeriod,
  type FigureUnit,
} from "@/features/performance/utils/format"
import { cn } from "@/lib/utils"

/**
 * KPI 8칸 — 유입 → 판매 → 소비자 → 배송 순으로 상세와 같은 축(L1). 필터 위에 둔다(합산 성과가 먼저 읽히게).
 * 모집단(지급 예정 + 지급 완료)이 0건이면 서버가 값을 null로 내리고 「집계된 공구 없음」을 붙인다 — 0으로 채우지 않는다(L2).
 */
export function PerformanceSummaryKpis(props: {
  summary: PerformanceSummary | undefined
}) {
  const { summary } = props
  const gender = summary?.genderRatio
  const genderText =
    gender?.female == null || gender.male == null
      ? null
      : gender.female >= gender.male
        ? `여 ${gender.female} · 남 ${gender.male}`
        : `남 ${gender.male} · 여 ${gender.female}`

  return (
    <>
      <KpiGrid cols={4}>
        <KpiCard
          label="확정 거래액"
          figure={summary?.confirmedSales}
          unit="won"
        />
        <KpiCard label="쇼룸 방문" figure={summary?.visitors} unit="people" />
        <KpiCard label="평균 AOV" figure={summary?.avgAov} unit="won" />
        <KpiCard
          label="평균 전환율"
          figure={summary?.avgConversionRate}
          unit="rate"
        />
      </KpiGrid>
      <KpiGrid cols={4}>
        <KpiCard label="평균 ROAS" figure={summary?.avgRoas} unit="roas" />
        <KpiCard
          label="소비자 성비"
          text={genderText}
          sub={gender?.basis ?? ""}
        />
        <KpiCard
          label="평균 구매확정률"
          figure={summary?.avgConfirmRate}
          unit="rate"
        />
        <KpiCard
          label="평균 재구매율"
          figure={summary?.avgRepurchaseRate}
          unit="rate"
        />
      </KpiGrid>
    </>
  )
}

/**
 * 시안 `.qform` — 상태(복수 · 기본 전부 켬) / 검색어. 상태는 바로 적용되고 검색어만 [검색]·Enter로 적용된다.
 * 상태는 하나는 남긴다(정산 관리 상태 필터와 같은 규칙).
 */
export function PerformanceFilters(props: {
  params: PerformanceListParams
  keyword: string
  statusCounts: PerformanceStatusCounts | undefined
  onChange: (next: Partial<PerformanceListParams>) => void
  onKeywordChange: (keyword: string) => void
  onSearch: () => void
  onReset: () => void
}) {
  const {
    params,
    keyword,
    statusCounts,
    onChange,
    onKeywordChange,
    onSearch,
    onReset,
  } = props

  const toggle = (status: PerformanceStatus) => {
    const has = params.status.includes(status)
    if (has && params.status.length === 1) return
    onChange({
      status: has
        ? params.status.filter(item => item !== status)
        : PERFORMANCE_STATUSES.filter(
            item => item === status || params.status.includes(item)
          ),
      page: 1,
    })
  }

  return (
    <div className="mb-3 rounded-[8px] border border-sz-n-200 bg-white px-4 py-3.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <FilterLabel>상태</FilterLabel>
        {PERFORMANCE_STATUSES.map(status => (
          <StatusCheck
            key={status}
            checked={params.status.includes(status)}
            label={PERFORMANCE_STATUS_CHIP_LABEL[status]}
            count={statusCounts?.[status] ?? 0}
            onToggle={() => toggle(status)}
          />
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-2.5 border-t border-sz-n-100 pt-2.5">
        <FilterLabel>검색</FilterLabel>
        <input
          className={cn(INPUT_CLASS, "h-8 w-[320px]")}
          aria-label="검색어"
          placeholder="공구명 · 인플루언서 쇼룸명 검색"
          value={keyword}
          onChange={event => onKeywordChange(event.target.value)}
          onKeyDown={event => {
            if (event.key === "Enter") onSearch()
          }}
        />
        <Btn variant="primary" onClick={onSearch}>
          검색
        </Btn>
        <Btn variant="secondary" onClick={onReset}>
          초기화
        </Btn>
      </div>
    </div>
  )
}

const TH = "whitespace-nowrap px-4 py-[11px] tracking-[.2px]"
const TD = "px-4 py-[13px] align-middle"

/**
 * 공구 단위 비교표(L1) — 유입(방문 · 전환율) → 판매(거래액 · 정산액 · 수량 · 확정률) → 상태(맨 뒤).
 * 집계 중 행은 수치가 전부 「—」인 흐린 중립 행이다. 상세(D2)는 열린다(서버 `detailAvailable`).
 * 경고 · 위험색을 쓰지 않는다 — 조정 협의 배지만 정산 관리와 같은 경고색.
 */
export function PerformanceTable(props: {
  rows: Array<PerformanceListItem>
  onRowClick: (row: PerformanceListItem) => void
}) {
  const { rows, onRowClick } = props
  return (
    <table className="w-full table-fixed border-collapse">
      <thead>
        <tr className="border-b border-sz-n-200 bg-sz-n-100 text-[11px] font-semibold text-sz-n-600">
          <td className={TH}>공구명</td>
          <td className={cn(TH, "w-[104px]")}>인플루언서</td>
          <td className={cn(TH, "w-[90px] text-center")}>방문</td>
          <td className={cn(TH, "w-[80px] text-center")}>전환율</td>
          <td className={cn(TH, "w-[120px] text-center")}>확정 거래액</td>
          <td className={cn(TH, "w-[118px] text-center")}>정산액</td>
          <td className={cn(TH, "w-[86px] text-center")}>확정 수량</td>
          <td className={cn(TH, "w-[92px] text-center")}>구매확정률</td>
          <td className={cn(TH, "w-[104px] text-center")}>상태</td>
        </tr>
      </thead>
      <tbody className="[&>tr:first-child>td]:border-t-0">
        {rows.map(row => {
          const aggregating = row.status === "AGGREGATING"
          return (
            <tr
              key={row.groupBuyId}
              onClick={row.detailAvailable ? () => onRowClick(row) : undefined}
              className={cn(
                "group text-[12px] [&>td]:border-t [&>td]:border-sz-n-100",
                row.detailAvailable && "cursor-pointer hover:bg-sz-accent-50",
                aggregating && "opacity-[.62]"
              )}
            >
              <td className={TD}>
                <span
                  className={cn(
                    "block truncate font-medium",
                    aggregating
                      ? "text-sz-n-500"
                      : "text-sz-n-900 group-hover:text-sz-accent-600"
                  )}
                  title={
                    aggregating
                      ? "모든 주문 처리가 끝나면 열람할 수 있습니다"
                      : undefined
                  }
                >
                  {row.groupBuyTitle}
                </span>
                <span className="mt-0.5 block text-[11px] text-sz-n-500">
                  {formatPeriod(row.periodStart, row.periodEnd)}
                </span>
              </td>
              <td
                className={cn(
                  TD,
                  "truncate",
                  aggregating ? "text-sz-n-500" : "text-sz-n-900"
                )}
              >
                {row.influencer.showroomName}
              </td>
              <NumCell figure={row.visitors} unit="plain" />
              <NumCell figure={row.conversionRate} unit="rate" />
              <NumCell figure={row.confirmedSales} unit="won" />
              <NumCell figure={row.payout} unit="won" />
              <NumCell figure={row.confirmedQuantity} unit="pieces" />
              <NumCell figure={row.confirmRate} unit="rate" />
              <td className={cn(TD, "text-center")}>
                <StatusBadge variant={PERFORMANCE_TONE_VARIANT[row.statusTone]}>
                  {row.statusLabel}
                </StatusBadge>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

/** 협의 중 정산액은 「협의 중」 11px 회색 · 값 없음은 「—」 연회색 */
function NumCell(props: { figure: PerformanceFigure; unit: FigureUnit }) {
  const { figure, unit } = props
  if (figure.state === "NEGOTIATING") {
    return (
      <td className={cn(TD, "text-center text-[11px] text-sz-n-500")}>
        협의 중
      </td>
    )
  }
  return (
    <td
      className={cn(
        TD,
        "text-center tabular-nums",
        figure.value == null ? "text-sz-n-400" : "text-sz-n-900"
      )}
    >
      {formatFigure(figure, unit)}
    </td>
  )
}

/**
 * 빈 상태 — 성과가 아예 없음(L2: CTA는 공구 관리) / 검색 조건에 맞는 공구 없음.
 */
export function PerformanceEmptyState(props: {
  hasCondition: boolean
  keyword: string
  onReset: () => void
  onGoGroupBuy: () => void
}) {
  const { hasCondition, keyword, onReset, onGoGroupBuy } = props

  if (hasCondition) {
    return (
      <div className="px-6 py-[72px] text-center">
        <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
          검색 조건에 맞는 공구가 없습니다
        </div>
        <div className="text-[12px] text-sz-n-500">
          {keyword
            ? `“${keyword}”에 해당하는 공구명·인플루언서가 없습니다. 상태 조건도 함께 확인해 주세요.`
            : "선택한 상태에 해당하는 공구가 없습니다."}
        </div>
        <Btn variant="secondary" className="mt-4" onClick={onReset}>
          검색 조건 초기화
        </Btn>
      </div>
    )
  }

  return (
    <div className="px-6 py-[72px] text-center">
      <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
        집계된 성과가 없습니다
      </div>
      <div className="text-[12px] text-sz-n-500">
        <b className="font-semibold">정산이 완료되면 성과가 집계됩니다.</b> 진행
        중인 공구의 판매 현황은 공구 관리에서 볼 수 있습니다.
      </div>
      <Btn variant="primary" className="mt-4" onClick={onGoGroupBuy}>
        공구 관리로 이동
      </Btn>
    </div>
  )
}
