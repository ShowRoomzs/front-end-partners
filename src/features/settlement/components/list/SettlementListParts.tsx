import Btn from "@/features/contracts/components/shared/Btn"
import { INPUT_CLASS } from "@/features/contracts/components/shared/styles"
import { SETTLEMENT_STATUS_CHIP_LABEL } from "@/features/settlement/constants/params"
import {
  formatMonthDay,
  formatMonthDayTime,
  formatWon,
} from "@/features/settlement/utils/format"
import {
  SETTLEMENT_STATUSES,
  type SettlementListParams,
  type SettlementStatus,
  type SettlementStatusCounts,
  type SettlementSummary,
} from "@/features/settlement/types"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import type { ReactNode } from "react"

/** 시안 본문 줄높이 1.6(디자인시스템 body) — 앱 기본(1.5)과 달라 정산 화면 루트에서 맞춘다 */
export const SETTLEMENT_PAGE_CLASS = "leading-[1.6]"

/** 시안 `.page-h` — 셸 H1 대신 화면이 제목·설명을 그린다 */
export function SettlementPageHeader(props: {
  title: string
  description: ReactNode
  right?: ReactNode
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[20px] font-semibold text-sz-n-900">
          {props.title}
        </h1>
        <div className="mt-0.5 text-[12px] text-sz-n-600">
          {props.description}
        </div>
      </div>
      {props.right}
    </div>
  )
}

/**
 * 시안 `.kgrid.c3` — 누적 지급 · 지급 예정 · 정산 확인 중(§43-1).
 * 건수가 0이면 서버가 `amount = null`을 내린다 — 0원은 실적처럼 읽혀 「—」로 그린다(L2). 요약이 오기 전도 「—」.
 * 지급 예정은 이번 지급액(차감 반영 후) 합계라 차감 반영 건이 있으면 그 사실을 붙인다.
 * 「정산 확인 중」은 조정 요청 창이 열린 건만 센다(서버 `reviewingCount`).
 */
export function SettlementKpis(props: {
  summary: SettlementSummary | undefined
}) {
  const { summary } = props
  const paid = summary?.paid
  const scheduled = summary?.scheduled
  const reviewingCount = summary?.reviewingCount ?? 0

  return (
    <div className="mb-4 grid grid-cols-3 gap-3">
      <Kpi
        label="누적 지급"
        value={paid?.amount != null ? formatWon(paid.amount) : "—"}
        sub={`누적 ${paid?.count ?? 0}건`}
      />
      <Kpi
        label="지급 예정"
        value={scheduled?.amount != null ? formatWon(scheduled.amount) : "—"}
        sub={
          scheduled && scheduled.count > 0
            ? `${scheduled.count}건 · ${formatMonthDay(summary?.nextPayoutDate ?? null)} 지급 예정${summary?.scheduledHasClawback ? " · 차감 반영 후" : ""}`
            : "예정 없음"
        }
      />
      <Kpi
        label="정산 확인 중"
        value={reviewingCount > 0 ? `${reviewingCount}건` : "—"}
        sub={
          reviewingCount > 0
            ? `${formatMonthDayTime(summary?.reviewingDueAt ?? null)}까지 조정 요청 가능`
            : "주문 종결 후 3영업일 확인"
        }
      />
    </div>
  )
}

function Kpi(props: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-[8px] border border-sz-n-200 bg-white px-4 py-3.5">
      <div className="text-[11px] text-sz-n-600">{props.label}</div>
      <div className="mt-[5px] text-[21px] leading-[1.2] font-semibold text-sz-n-900 tabular-nums">
        {props.value}
      </div>
      <div className="mt-1 text-[11px] text-sz-n-500 tabular-nums">
        {props.sub}
      </div>
    </div>
  )
}

/**
 * 시안 `.qform` — 상태(복수 · 기본 전부 켬) / 검색어.
 * 상태는 바로 적용되고 검색어만 [검색]·Enter로 적용된다. 상태는 하나는 남아야 한다 — 전부 끄면
 * 「전체」와 같은데 화면은 아무것도 고르지 않은 것처럼 보인다(반품·교환 관리 유형 필터와 같은 규칙).
 */
export function SettlementFilters(props: {
  params: SettlementListParams
  keyword: string
  statusCounts: SettlementStatusCounts | undefined
  onChange: (next: Partial<SettlementListParams>) => void
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

  const toggle = (status: SettlementStatus) => {
    const has = params.status.includes(status)
    if (has && params.status.length === 1) return
    onChange({
      status: has
        ? params.status.filter(item => item !== status)
        : SETTLEMENT_STATUSES.filter(
            item => item === status || params.status.includes(item)
          ),
      page: 1,
    })
  }

  return (
    <div className="mb-3 rounded-[8px] border border-sz-n-200 bg-white px-4 py-3.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <FilterLabel>상태</FilterLabel>
        {SETTLEMENT_STATUSES.map(status => (
          <StatusCheck
            key={status}
            checked={params.status.includes(status)}
            label={SETTLEMENT_STATUS_CHIP_LABEL[status]}
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

function FilterLabel({ children }: { children: ReactNode }) {
  return (
    <span className="w-[62px] shrink-0 text-[11px] font-semibold text-sz-n-500">
      {children}
    </span>
  )
}

/** 시안 `.fp-item` — 색 없는 체크 + 건수 */
function StatusCheck(props: {
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

/**
 * 빈 상태 — 정산이 아예 없음(L2: 브랜드가 여기서 만들 수 있는 게 없으니 CTA는 공구 관리) /
 * 검색 조건에 맞는 정산 없음.
 */
export function SettlementEmptyState(props: {
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
          검색 조건에 맞는 정산 내역이 없습니다
        </div>
        <div className="text-[12px] text-sz-n-500">
          {keyword
            ? `“${keyword}”에 해당하는 공구명·인플루언서가 없습니다. 상태 조건도 함께 확인해 주세요.`
            : "선택한 상태에 해당하는 정산 내역이 없습니다."}
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
        정산 내역이 없습니다
      </div>
      <div className="text-[12px] text-sz-n-500">
        공구가 종료되고 <b>모든 주문 처리가 끝나면</b> 정산 내역이 표시됩니다.
        <br />
        주문 종결을 기다리는 공구는 <b>공구 관리</b>
        에서 확인할 수 있습니다.
      </div>
      <Btn variant="secondary" className="mt-4" onClick={onGoGroupBuy}>
        공구 관리로 이동
      </Btn>
    </div>
  )
}
