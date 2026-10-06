import Btn from "@/features/contracts/components/shared/Btn"
import { INPUT_CLASS } from "@/features/contracts/components/shared/styles"
import { GbEmpty } from "@/features/groupBuy/components/shared/GbParts"
import { SelectSm } from "@/features/orders/components/shared/OrderParts"
import {
  DATE_BASIS_OPTIONS,
  defaultPeriodOf,
  ORDER_TABS,
  PERIOD_PRESETS,
  SEARCH_TYPE_OPTIONS,
} from "@/features/orders/constants/params"
import type {
  OrderDateBasis,
  OrderListParams,
  OrderSearchType,
  OrderSummaryResponse,
  OrderTab,
  PeriodPreset,
} from "@/features/orders/types"
import {
  formatRange,
  objectParticle,
  resolvePeriod,
  validateCustomRange,
} from "@/features/orders/utils/view"
import { cn } from "@/lib/utils"

/** 시안 `.tabs` — 상태 탭 9종. 건수는 검색 조건과 무관한 브랜드 전체 기준(summary) */
export function OrderStatusTabs(props: {
  tab: OrderTab
  onTabChange: (tab: OrderTab) => void
  counts: OrderSummaryResponse["tabCounts"] | undefined
}) {
  const { tab, onTabChange, counts } = props

  return (
    <div className="mb-4 flex shrink-0 flex-wrap border-b border-sz-n-200">
      {ORDER_TABS.map(item => {
        const isActive = tab === item.value
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onTabChange(item.value)}
            className={cn(
              "mr-[22px] flex cursor-pointer items-center gap-1.5 whitespace-nowrap border-b-2 px-0.5 py-[9px] text-[12px]",
              isActive
                ? "border-sz-accent-500 font-medium text-sz-accent-500"
                : "border-transparent text-sz-n-500 hover:text-sz-n-700"
            )}
          >
            {item.label}
            <span
              className={cn(
                "rounded-lg px-[5px] text-[10px]",
                isActive
                  ? "bg-sz-accent-50 text-sz-accent-600"
                  : "bg-sz-n-100 text-sz-n-600"
              )}
            >
              {counts?.[item.value] ?? 0}
            </span>
          </button>
        )
      })}
    </div>
  )
}

const DATE_INPUT_CLASS = cn(INPUT_CLASS, "h-8 w-[136px] px-2.5 tabular-nums")

/**
 * 시안 `.qform` — 조회 기준 · 기간 프리셋 · 검색 타입 + 검색어.
 * 프리셋·조회 기준은 누르는 즉시 조회하고, 직접 입력 기간과 검색어는 [검색]으로 확정한다.
 */
export function OrderQueryForm(props: {
  params: OrderListParams
  localParams: OrderListParams
  onLocalChange: <K extends keyof OrderListParams>(
    key: K,
    value: OrderListParams[K]
  ) => void
  onApply: (changes: Partial<OrderListParams>) => void
  onSearch: () => void
  onReset: () => void
}) {
  const { params, localParams, onLocalChange, onApply, onSearch, onReset } =
    props

  const activePeriod = localParams.period || defaultPeriodOf(localParams.tab)
  const isCustom = activePeriod === "CUSTOM"
  const rangeError = isCustom
    ? validateCustomRange(localParams.from, localParams.to)
    : null
  const appliedRange = resolvePeriod(params.period, params.tab, params)

  const handlePreset = (period: PeriodPreset) => {
    if (period === "CUSTOM") {
      // 직접 입력은 지금 보이는 기간을 출발점으로 펼친다 — 빈 칸부터 치게 하지 않는다
      onLocalChange("period", "CUSTOM")
      onLocalChange("from", localParams.from || appliedRange.from)
      onLocalChange("to", localParams.to || appliedRange.to)
      return
    }
    onApply({ period, from: "", to: "", page: 1 })
  }

  const handleSearch = () => {
    if (rangeError) {
      return
    }
    onSearch()
  }

  return (
    <div className="mb-3 shrink-0 rounded-[8px] border border-sz-n-200 bg-white px-4 py-3.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="w-[62px] shrink-0 text-[11px] font-semibold text-sz-n-500">
          조회 기준
        </span>
        <SelectSm
          tall
          aria-label="조회 기준"
          value={localParams.dateBasis}
          onChange={event =>
            onApply({
              dateBasis: event.target.value as OrderDateBasis,
              page: 1,
            })
          }
        >
          {DATE_BASIS_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectSm>

        <div className="flex overflow-hidden rounded-[6px] border border-sz-n-300">
          {PERIOD_PRESETS.map(preset => {
            const isOn = activePeriod === preset.value
            return (
              <button
                key={preset.value}
                type="button"
                onClick={() => handlePreset(preset.value)}
                className={cn(
                  "inline-flex h-8 cursor-pointer items-center whitespace-nowrap border-r border-sz-n-200 px-[13px] text-[12px] last:border-r-0",
                  isOn
                    ? "bg-sz-accent-500 font-medium text-white"
                    : "bg-white text-sz-n-600 hover:bg-sz-n-50 hover:text-sz-n-900"
                )}
              >
                {preset.label}
              </button>
            )
          })}
        </div>

        {isCustom ? (
          <>
            <input
              type="date"
              aria-label="조회 시작일"
              className={cn(
                DATE_INPUT_CLASS,
                rangeError === "REVERSED" && "border-sz-danger-text"
              )}
              value={localParams.from}
              max={localParams.to || undefined}
              onChange={event => onLocalChange("from", event.target.value)}
            />
            <span className="text-[12px] text-sz-n-600">~</span>
            <input
              type="date"
              aria-label="조회 종료일"
              className={cn(
                DATE_INPUT_CLASS,
                rangeError === "REVERSED" && "border-sz-danger-text"
              )}
              value={localParams.to}
              min={localParams.from || undefined}
              onChange={event => onLocalChange("to", event.target.value)}
            />
            {/* 조회 상한을 필드 옆에 적어 조회 실패 전에 알린다(A1b) */}
            <span
              className={cn(
                "text-[11px]",
                rangeError === "EXCEEDED" || rangeError === "REVERSED"
                  ? "text-sz-danger-text"
                  : "text-sz-n-500"
              )}
            >
              {rangeError === "REVERSED"
                ? "시작일이 종료일보다 늦습니다"
                : "최대 1년 · 초과하면 조회할 수 없습니다"}
            </span>
          </>
        ) : (
          <span className="text-[11px] tabular-nums text-sz-n-500">
            {formatRange(appliedRange.from, appliedRange.to)}
          </span>
        )}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-2.5 border-t border-sz-n-100 pt-2.5">
        <span className="w-[62px] shrink-0 text-[11px] font-semibold text-sz-n-500">
          검색
        </span>
        <SelectSm
          tall
          aria-label="검색 대상"
          value={localParams.searchType}
          onChange={event =>
            onLocalChange("searchType", event.target.value as OrderSearchType)
          }
        >
          {SEARCH_TYPE_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectSm>
        <input
          className={cn(INPUT_CLASS, "h-8 w-[260px]")}
          placeholder="검색어 입력"
          value={localParams.keyword}
          onChange={event => onLocalChange("keyword", event.target.value)}
          onKeyDown={event => {
            if (event.key === "Enter") {
              handleSearch()
            }
          }}
        />
        <Btn
          variant="primary"
          onClick={handleSearch}
          disabled={Boolean(rangeError)}
        >
          검색
        </Btn>
        <Btn variant="secondary" onClick={onReset}>
          초기화
        </Btn>
      </div>
    </div>
  )
}

/**
 * 빈 상태 2종 — 주문이 아예 없으면(A4) 브랜드가 주문을 만들 수 없으니 공구 관리로 보내고,
 * 조건에 맞는 주문이 없으면(A5) 조건 탓임을 밝히고 초기화로 되돌린다.
 */
export function OrderEmptyState(props: {
  noOrdersAtAll: boolean
  tab: OrderTab
  keyword: string
  onReset: () => void
  onGoGroupBuys: () => void
}) {
  const { noOrdersAtAll, tab, keyword, onReset, onGoGroupBuys } = props

  if (noOrdersAtAll) {
    return (
      <GbEmpty
        title="아직 주문이 없습니다"
        action={
          <Btn variant="primary" onClick={onGoGroupBuys}>
            공구 관리로 이동
          </Btn>
        }
      >
        공구가 시작되면 소비자 주문이 여기에 들어옵니다.
        <br />
        진행중인 공구가 없다면 공구 관리에서 준비 상황을 확인하세요.
      </GbEmpty>
    )
  }

  // 문장 안에서는 괄호 보충을 뺀다 — 시안 「신규 탭에서 … 찾지 못했습니다」
  const tabLabel = (
    ORDER_TABS.find(item => item.value === tab)?.label ?? "전체"
  ).replace(/\(.*\)$/, "")
  const trimmed = keyword.trim()
  return (
    <GbEmpty
      title={
        trimmed ? "검색 조건에 맞는 주문이 없습니다" : "조회된 주문이 없습니다"
      }
      action={
        <Btn variant="secondary" onClick={onReset}>
          검색 조건 초기화
        </Btn>
      }
    >
      {trimmed
        ? `${tabLabel} 탭에서 “${trimmed}”${objectParticle(trimmed)} 찾지 못했습니다. 다른 탭에는 있을 수 있습니다.`
        : `${tabLabel} 탭에 조회 기간 안의 주문이 없습니다. 기간을 넓히거나 다른 탭을 확인하세요.`}
    </GbEmpty>
  )
}
