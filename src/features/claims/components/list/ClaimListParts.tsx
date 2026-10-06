import Btn from "@/features/contracts/components/shared/Btn"
import { INPUT_CLASS } from "@/features/contracts/components/shared/styles"
import { SELECT_CHEVRON_STYLE } from "@/features/contracts/constants/params"
import {
  CLAIM_LIST_PATH,
  CLAIM_REASON_OPTIONS,
  CLAIM_TAB_LABEL,
  CLAIM_TAB_OPTIONS,
  CLAIM_TYPE_OPTIONS,
  MAX_PERIOD_DAYS,
  PERIOD_OPTIONS,
  periodRange,
} from "@/features/claims/constants/params"
import type {
  ClaimListParams,
  ClaimPeriodPreset,
  ClaimReason,
  ClaimSummaryResponse,
  ClaimTab,
  ClaimType,
} from "@/features/claims/types"
import { ORDER_LIST_PATH } from "@/features/orders/constants/params"
import { cn } from "@/lib/utils"
import dayjs from "dayjs"
import { Check } from "lucide-react"
import type { ReactNode } from "react"
import { useNavigate } from "react-router-dom"

export const SELECT_SM_CLASS =
  "h-7 cursor-pointer appearance-none rounded-[6px] border border-sz-n-300 bg-white py-0 pl-2 pr-[22px] text-[12px] text-sz-n-700 outline-none focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"

/** KPI 4칸 — 누르면 그 일을 하는 탭으로 간다. 「지연」은 전체 탭에서 경과 열로 찾는다 */
const KPI_ITEMS: Array<{
  key: keyof ClaimSummaryResponse["kpi"]
  label: string
  tab: ClaimTab
}> = [
  { key: "collectWait", label: "회수 대기", tab: "COLLECT_WAIT" },
  { key: "inspection", label: "입고·검수", tab: "INSPECTION" },
  { key: "reship", label: "재발송", tab: "RESHIP" },
  { key: "overdue", label: "지연", tab: "ALL" },
]

/**
 * 판매 관리 › 반품·교환 관리 상단 — 제목 · KPI 4칸 · 주문/반품·교환 대탭.
 * KPI는 검색 조건과 무관한 전체 기준이라 검색 결과가 없어도 숫자가 남는다(A0s).
 * 「지연」만 경고색이고 0건이면 경고 톤을 뺀다. 나머지 셋은 정상 작업 큐라 중립이다.
 */
export function ClaimsHeader(props: {
  tab: ClaimTab
  summary: ClaimSummaryResponse | undefined
  orderTotal: number | undefined
  onSelectTab: (tab: ClaimTab) => void
}) {
  const { tab, summary, orderTotal, onSelectTab } = props
  const navigate = useNavigate()

  return (
    <>
      <div className="mb-4 shrink-0">
        <h1 className="text-[20px] font-semibold text-sz-n-900">판매 관리</h1>
        <p className="mt-0.5 text-[12px] text-sz-n-600">
          소비자가 신청한 반품·교환을 처리합니다.
        </p>
      </div>

      <div className="mb-4 flex shrink-0 overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
        {KPI_ITEMS.map(item => {
          const count = summary?.kpi[item.key] ?? 0
          const isWarn = item.key === "overdue" && count > 0
          // 활성 탭의 칸만 강조한다(지연 칸은 탭이 아니라 강조하지 않는다)
          const isOn = item.key !== "overdue" && tab === item.tab
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelectTab(item.tab)}
              className={cn(
                "flex-1 cursor-pointer border-r border-sz-n-100 px-4 py-3 text-left last:border-r-0",
                isOn ? "bg-sz-accent-50" : "hover:bg-sz-n-50"
              )}
            >
              <div
                className={cn(
                  "text-[20px] font-semibold leading-[1.2] tabular-nums",
                  isWarn
                    ? "text-sz-warning-text"
                    : isOn
                      ? "text-sz-accent-600"
                      : "text-sz-n-400"
                )}
              >
                {count}
              </div>
              <div
                className={cn(
                  "mt-[3px] text-[11px]",
                  isOn ? "font-medium text-sz-accent-600" : "text-sz-n-600"
                )}
              >
                {item.label}
              </div>
            </button>
          )
        })}
      </div>

      <div className="mb-4 flex shrink-0 gap-0.5 border-b border-sz-n-200">
        <ViewTab
          active={false}
          label="주문 관리"
          count={orderTotal}
          onClick={() => navigate(ORDER_LIST_PATH)}
        />
        <ViewTab
          active
          label="반품 · 교환 관리"
          count={summary?.tabCounts.ALL}
          onClick={() => navigate(CLAIM_LIST_PATH)}
        />
      </div>
    </>
  )
}

/** 시안 `.tab1` */
function ViewTab(props: {
  active: boolean
  label: string
  count: number | undefined
  onClick: () => void
}) {
  const { active, label, count, onClick } = props
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "-mb-px cursor-pointer border-b-2 px-[18px] py-[9px] text-[13px]",
        active
          ? "border-sz-accent-500 font-semibold text-sz-accent-600"
          : "border-transparent text-sz-n-500 hover:text-sz-n-700"
      )}
    >
      {label}
      <span
        className={cn(
          "ml-[5px] text-[11px] tabular-nums",
          active ? "text-sz-accent-500" : "text-sz-n-400"
        )}
      >
        {count ?? 0}
      </span>
    </button>
  )
}

/** 시안 `.tabs` — 단계 탭 7종. 반품과 교환을 탭으로 나누지 않는다(흐름이 같다) */
export function ClaimStatusTabs(props: {
  tab: ClaimTab
  counts: ClaimSummaryResponse["tabCounts"] | undefined
  onChange: (tab: ClaimTab) => void
}) {
  const { tab, counts, onChange } = props
  return (
    <div className="mb-4 flex shrink-0 flex-wrap border-b border-sz-n-200">
      {CLAIM_TAB_OPTIONS.map(item => {
        const isActive = tab === item.value
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={cn(
              "mr-[22px] flex items-center gap-1.5 whitespace-nowrap border-b-2 px-0.5 py-[9px] text-[12px]",
              isActive
                ? "border-sz-accent-500 font-medium text-sz-accent-500"
                : "border-transparent text-sz-n-500 hover:text-sz-n-700"
            )}
          >
            {item.label}
            <span
              className={cn(
                "rounded-lg px-1.5 text-[10px]",
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

/** 시안 `.fp-item` — 유형 필터 체크박스(색 없는 텍스트 + 건수) */
function TypeCheck(props: {
  checked: boolean
  label: string
  count: number
  onToggle: () => void
}) {
  const { checked, label, count, onToggle } = props
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center gap-1.5 text-[12px]",
        checked ? "font-medium text-sz-n-900" : "text-sz-n-600"
      )}
    >
      <span
        className={cn(
          "flex size-[15px] shrink-0 items-center justify-center rounded-[4px] border-[1.5px]",
          checked
            ? "border-sz-accent-500 bg-sz-accent-500"
            : "border-sz-n-300 bg-white"
        )}
      >
        {checked && <Check className="size-[9px] text-white" strokeWidth={3} />}
      </span>
      {label}
      <span
        className={cn(
          "text-[11px]",
          checked ? "text-sz-n-500" : "text-sz-n-400"
        )}
      >
        {count}
      </span>
    </button>
  )
}

function FilterLabel(props: { children: ReactNode; inline?: boolean }) {
  return (
    <span
      className={cn(
        "shrink-0 text-[11px] font-semibold text-sz-n-500",
        props.inline ? "ml-3.5" : "w-[62px]"
      )}
    >
      {props.children}
    </span>
  )
}

/**
 * 시안 `.qform` — 유형(복수) · 사유(단일) · 기간(신청일시) / 검색어.
 * 유형·사유·기간은 바로 적용되고, 검색어만 [검색]·Enter로 적용된다.
 * 유형은 둘 중 하나는 남아야 한다 — 둘 다 끄면 「전체」와 같은데 화면은 아무것도 고르지 않은 것처럼 보인다.
 */
export function ClaimFilters(props: {
  params: ClaimListParams
  keyword: string
  typeCounts: ClaimSummaryResponse["typeCounts"] | undefined
  onChange: (next: Partial<ClaimListParams>) => void
  onKeywordChange: (keyword: string) => void
  onSearch: () => void
  onReset: () => void
}) {
  const {
    params,
    keyword,
    typeCounts,
    onChange,
    onKeywordChange,
    onSearch,
    onReset,
  } = props

  const toggleType = (type: ClaimType) => {
    const has = params.types.includes(type)
    if (has && params.types.length === 1) {
      return
    }
    onChange({
      types: has
        ? params.types.filter(item => item !== type)
        : [...params.types, type],
      page: 1,
    })
  }

  const handlePreset = (preset: ClaimPeriodPreset) => {
    if (preset === "CUSTOM") {
      onChange({ period: "CUSTOM" })
      return
    }
    onChange({ period: preset, ...periodRange(preset), page: 1 })
  }

  const handleCustomDate = (key: "from" | "to", value: string) => {
    if (!value) return
    onChange({ [key]: value, page: 1 })
  }

  const overYear =
    params.period === "CUSTOM" &&
    dayjs(params.to).diff(dayjs(params.from), "day") > MAX_PERIOD_DAYS

  return (
    <div className="mb-3 rounded-[8px] border border-sz-n-200 bg-white px-4 py-3.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <FilterLabel>유형</FilterLabel>
        {CLAIM_TYPE_OPTIONS.map(option => (
          <TypeCheck
            key={option.value}
            label={option.label}
            checked={params.types.includes(option.value)}
            count={typeCounts?.[option.value] ?? 0}
            onToggle={() => toggleType(option.value)}
          />
        ))}

        <FilterLabel inline>사유</FilterLabel>
        <select
          aria-label="사유"
          value={params.reason}
          onChange={event =>
            onChange({
              reason: event.target.value as ClaimReason | "",
              page: 1,
            })
          }
          style={SELECT_CHEVRON_STYLE}
          className={cn(SELECT_SM_CLASS, "h-8 pr-[26px]")}
        >
          <option value="">전체</option>
          {CLAIM_REASON_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <FilterLabel inline>기간</FilterLabel>
        <div className="flex overflow-hidden rounded-[6px] border border-sz-n-300">
          {PERIOD_OPTIONS.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => handlePreset(option.value)}
              className={cn(
                "inline-flex h-8 cursor-pointer items-center whitespace-nowrap border-r border-sz-n-200 px-[13px] text-[12px] last:border-r-0",
                params.period === option.value
                  ? "bg-sz-accent-500 font-medium text-white"
                  : "bg-white text-sz-n-600 hover:bg-sz-n-50 hover:text-sz-n-900"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        {params.period === "CUSTOM" ? (
          <>
            <input
              type="date"
              aria-label="시작일"
              value={params.from}
              max={params.to}
              onChange={event => handleCustomDate("from", event.target.value)}
              className={cn(INPUT_CLASS, "h-8 w-[138px]")}
            />
            <span className="text-[12px] text-sz-n-600">~</span>
            <input
              type="date"
              aria-label="종료일"
              value={params.to}
              min={params.from}
              max={dayjs().format("YYYY-MM-DD")}
              onChange={event => handleCustomDate("to", event.target.value)}
              className={cn(INPUT_CLASS, "h-8 w-[138px]")}
            />
            <span
              className={cn(
                "text-[11px]",
                overYear ? "text-sz-danger-text" : "text-sz-n-500"
              )}
            >
              최대 1년 · 초과하면 조회할 수 없습니다
            </span>
          </>
        ) : (
          <span className="text-[11px] tabular-nums text-sz-n-500">
            {dayjs(params.from).format("YYYY.MM.DD")} ~{" "}
            {dayjs(params.to).format("YYYY.MM.DD")}
          </span>
        )}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-2.5 border-t border-sz-n-100 pt-2.5">
        <FilterLabel>검색</FilterLabel>
        <input
          className={cn(INPUT_CLASS, "h-8 w-[320px]")}
          placeholder="접수번호 · 주문번호 검색"
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

/** 빈 상태 2종 — 신청이 아예 없음(A0) / 검색 조건에 맞는 신청 없음(A0s) */
export function ClaimEmptyState(props: {
  hasCondition: boolean
  tab: ClaimTab
  keyword: string
  onReset: () => void
  onGoOrders: () => void
}) {
  const { hasCondition, tab, keyword, onReset, onGoOrders } = props

  if (hasCondition) {
    return (
      <div className="px-6 py-[72px] text-center">
        <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
          검색 조건에 맞는 신청이 없습니다
        </div>
        <div className="text-[12px] text-sz-n-500">
          {keyword
            ? `${CLAIM_TAB_LABEL[tab]} 탭에서 “${keyword}”${objectParticle(keyword)} 찾지 못했습니다. 다른 탭에는 있을 수 있습니다.`
            : `${CLAIM_TAB_LABEL[tab]} 탭에 해당하는 신청이 없습니다. 다른 탭에는 있을 수 있습니다.`}
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
        반품·교환 신청이 없습니다
      </div>
      <div className="text-[12px] text-sz-n-500">
        소비자가 반품이나 교환을 신청하면 여기에 들어옵니다.
        <br />
        배송 상태는 <b className="font-semibold">주문 관리</b>에서 확인할 수
        있습니다.
      </div>
      <Btn variant="primary" className="mt-4" onClick={onGoOrders}>
        주문 관리로 이동
      </Btn>
    </div>
  )
}

/** 받침 유무로 목적격 조사를 고른다 — 「CLM-9999를」 */
function objectParticle(word: string) {
  const last = word.charCodeAt(word.length - 1)
  const isHangul = last >= 0xac00 && last <= 0xd7a3
  if (isHangul) {
    return (last - 0xac00) % 28 === 0 ? "를" : "을"
  }
  // 숫자·영문은 읽는 소리로 — 끝이 2·4·5·9 / 모음 소리면 「를」
  return /[2459]$|[aeiouyAEIOUY]$/.test(word) ? "를" : "을"
}
