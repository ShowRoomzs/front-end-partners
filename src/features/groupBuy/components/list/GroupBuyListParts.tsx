import Btn from "@/features/contracts/components/shared/Btn"
import { INPUT_CLASS } from "@/features/contracts/components/shared/styles"
import { GbEmpty } from "@/features/groupBuy/components/shared/GbParts"
import { GROUP_BUY_TABS } from "@/features/groupBuy/constants/params"
import type {
  GroupBuySummaryResponse,
  GroupBuyTab,
} from "@/features/groupBuy/types"
import { cn } from "@/lib/utils"

/** 시안 `.tabs` — 상태 탭 6종. 건수는 검색어와 무관한 브랜드 전체 기준(summary) */
export function GroupBuyStatusTabs(props: {
  tab: GroupBuyTab
  onTabChange: (tab: GroupBuyTab) => void
  counts: GroupBuySummaryResponse["tabCounts"] | undefined
}) {
  const { tab, onTabChange, counts } = props

  return (
    <div className="mb-4 flex shrink-0 flex-wrap border-b border-sz-n-200">
      {GROUP_BUY_TABS.map(item => {
        const isActive = tab === item.value
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onTabChange(item.value)}
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

/**
 * 시안 `.toolbar` — 검색어 · [검색] · [초기화].
 * [+ 공구 생성]이 없다 — 공구는 계약 상세에서만 만들어진다.
 */
export function GroupBuyToolbar(props: {
  keyword: string
  onKeywordChange: (keyword: string) => void
  onSearch: () => void
  onReset: () => void
}) {
  const { keyword, onKeywordChange, onSearch, onReset } = props

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <input
        className={cn(INPUT_CLASS, "w-[280px]")}
        placeholder="공구명 · 인플루언서 쇼룸명 검색"
        value={keyword}
        onChange={event => onKeywordChange(event.target.value)}
        onKeyDown={event => {
          if (event.key === "Enter") {
            onSearch()
          }
        }}
      />
      <Btn variant="secondary" onClick={onSearch}>
        검색
      </Btn>
      <Btn variant="secondary" onClick={onReset}>
        초기화
      </Btn>
    </div>
  )
}

/**
 * 빈 상태 2종(A2 · A3). 공구가 아예 없으면 브랜드가 만들 수 없으니 계약 관리로 보내고,
 * 검색 결과가 없으면 조건 탓임을 밝히고 초기화로 되돌린다.
 */
export function GroupBuyEmptyState(props: {
  hasCondition: boolean
  tab: GroupBuyTab
  keyword: string
  onReset: () => void
  onGoContracts: () => void
}) {
  const { hasCondition, tab, keyword, onReset, onGoContracts } = props

  if (hasCondition) {
    const tabLabel =
      GROUP_BUY_TABS.find(item => item.value === tab)?.label ?? "전체"
    return (
      <GbEmpty
        title="검색 조건에 맞는 공구가 없습니다"
        action={
          <Btn variant="secondary" onClick={onReset}>
            검색 조건 초기화
          </Btn>
        }
      >
        {keyword
          ? `${tabLabel} 탭에서 “${keyword}”${objectParticle(keyword)} 찾지 못했습니다. 다른 탭에는 있을 수 있습니다.`
          : `${tabLabel} 탭에 해당하는 공구가 없습니다. 다른 탭에는 있을 수 있습니다.`}
      </GbEmpty>
    )
  }

  return (
    <GbEmpty
      title="진행중인 공구가 없습니다"
      action={
        <Btn variant="primary" onClick={onGoContracts}>
          계약 관리로 이동
        </Btn>
      }
    >
      공구는 <b className="font-semibold">계약이 체결되면</b> 계약 상세에서
      생성할 수 있습니다.
      <br />
      계약 1건당 공구 1건이 만들어집니다.
    </GbEmpty>
  )
}

/** 받침 유무로 목적격 조사를 고른다 — 「립밤을」 · 「토너를」 */
function objectParticle(word: string) {
  const last = word.charCodeAt(word.length - 1)
  const isHangul = last >= 0xac00 && last <= 0xd7a3
  return isHangul && (last - 0xac00) % 28 === 0 ? "를" : "을"
}
