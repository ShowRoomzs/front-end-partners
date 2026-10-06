import Btn from "@/features/contracts/components/shared/Btn"
import { INPUT_CLASS } from "@/features/contracts/components/shared/styles"
import { SETTLEMENT_STATUS_LABEL } from "@/features/settlement/constants/params"
import { formatMonthDay, formatWon } from "@/features/settlement/utils/format"
import {
  SETTLEMENT_STATUSES,
  type SettlementListParams,
  type SettlementStatus,
  type SettlementSummary,
} from "@/features/settlement/types"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import type { ReactNode } from "react"

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
 * 시안 `.kgrid.c3` — 누적 지급 · 지급 예정 · 정산 대기.
 * 건수가 0이면 금액도 0원이 아니라 「—」 — 0원은 실적처럼 읽힌다(L2). 배포본(요약 없음)도 「—」.
 */
export function SettlementKpis(props: {
  summary: SettlementSummary | undefined
}) {
  const { summary } = props
  const paidCount = summary?.paidCount ?? 0
  const scheduledCount = summary?.scheduledCount ?? 0
  const pendingCount = summary?.pendingCount ?? 0

  return (
    <div className="mb-4 grid grid-cols-3 gap-3">
      <Kpi
        label="누적 지급"
        value={paidCount > 0 ? formatWon(summary?.paidTotal ?? 0) : "—"}
        sub={`누적 ${paidCount}건`}
      />
      <Kpi
        label="지급 예정"
        value={
          scheduledCount > 0 ? formatWon(summary?.scheduledTotal ?? 0) : "—"
        }
        sub={
          scheduledCount > 0
            ? `확정 ${scheduledCount}건 · ${formatMonthDay(summary?.nextPayoutDate ?? null)} 지급 예정`
            : "예정 없음"
        }
      />
      <Kpi
        label="정산 대기"
        value={pendingCount > 0 ? `${pendingCount}건` : "—"}
        sub="공구 종료 후 처리 진행 중"
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
  statusCounts: SettlementSummary["statusCounts"] | undefined
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
    const has = params.statuses.includes(status)
    if (has && params.statuses.length === 1) return
    onChange({
      statuses: has
        ? params.statuses.filter(item => item !== status)
        : SETTLEMENT_STATUSES.filter(
            item => item === status || params.statuses.includes(item)
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
            checked={params.statuses.includes(status)}
            label={SETTLEMENT_STATUS_LABEL[status]}
            count={statusCounts?.[status] ?? 0}
            onToggle={() => toggle(status)}
          />
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-2.5 border-t border-sz-n-100 pt-2.5">
        <FilterLabel>검색</FilterLabel>
        <input
          className={cn(INPUT_CLASS, "h-8 w-[320px]")}
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
        공구가 종료되고 <b className="font-semibold">모든 주문 처리가 끝나면</b>{" "}
        정산 내역이 표시됩니다.
      </div>
      <Btn variant="secondary" className="mt-4" onClick={onGoGroupBuy}>
        공구 관리로 이동
      </Btn>
    </div>
  )
}
