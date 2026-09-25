import Btn from "@/features/contracts/components/shared/Btn"
import { INPUT_CLASS } from "@/features/contracts/components/shared/styles"
import { cn } from "@/lib/utils"

interface ContractToolbarProps {
  keyword: string
  onKeywordChange: (keyword: string) => void
  startDate: string
  endDate: string
  onDateChange: (startDate: string, endDate: string) => void
  onSearch: () => void
  onCreate: () => void
  isCreating: boolean
}

/**
 * 시안 `.toolbar` — 검색어 · 공구 기간 · [검색] / 우측 [+ 계약 작성].
 * 기간은 서버가 "공구 기간이 그 구간에 걸치는 계약"으로 해석한다(작성중 미설정 건은 빠진다).
 */
export default function ContractToolbar(props: ContractToolbarProps) {
  const {
    keyword,
    onKeywordChange,
    startDate,
    endDate,
    onDateChange,
    onSearch,
    onCreate,
    isCreating,
  } = props

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <input
        className={cn(INPUT_CLASS, "w-[280px]")}
        placeholder="공구명 · 상대 쇼룸명 검색"
        value={keyword}
        onChange={event => onKeywordChange(event.target.value)}
        onKeyDown={event => {
          if (event.key === "Enter") {
            onSearch()
          }
        }}
      />
      <span className="ml-1 text-[11px] font-semibold text-sz-n-500">
        공구 기간
      </span>
      <input
        type="date"
        aria-label="공구 기간 시작"
        className={cn(INPUT_CLASS, "w-[150px] tabular-nums")}
        value={startDate}
        max={endDate || undefined}
        onChange={event => onDateChange(event.target.value, endDate)}
      />
      <span className="text-[12px] text-sz-n-500">~</span>
      <input
        type="date"
        aria-label="공구 기간 종료"
        className={cn(INPUT_CLASS, "w-[150px] tabular-nums")}
        value={endDate}
        min={startDate || undefined}
        onChange={event => onDateChange(startDate, event.target.value)}
      />
      <Btn variant="secondary" onClick={onSearch}>
        검색
      </Btn>
      <span className="flex-1" />
      <Btn variant="primary" onClick={onCreate} isLoading={isCreating}>
        + 계약 작성
      </Btn>
    </div>
  )
}
