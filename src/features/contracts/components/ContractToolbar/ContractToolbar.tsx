import Btn from "@/features/contracts/components/shared/Btn"
import { INPUT_CLASS } from "@/features/contracts/components/shared/styles"
import { SUSPENSION_COPY } from "@/features/suspension"
import { cn } from "@/lib/utils"

interface ContractToolbarProps {
  keyword: string
  onKeywordChange: (keyword: string) => void
  onSearch: () => void
  onCreate: () => void
  isCreating: boolean
  /** 계정 이용 정지 — 버튼은 숨기지 않고 비활성 + 툴팁(시안 15 S4 · 숨기면 메뉴가 사라졌다로 읽힌다) */
  createBlocked?: boolean
}

/**
 * 시안 `.toolbar` — 검색어 · [검색] / 우측 [+ 계약 작성].
 * 공구 기간 필터는 시안에 없다(목록 표의 「공구 기간」 열로만 보여준다).
 */
export default function ContractToolbar(props: ContractToolbarProps) {
  const {
    keyword,
    onKeywordChange,
    onSearch,
    onCreate,
    isCreating,
    createBlocked = false,
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
      <Btn variant="secondary" onClick={onSearch}>
        검색
      </Btn>
      <span className="flex-1" />
      <Btn
        variant="primary"
        onClick={onCreate}
        isLoading={isCreating}
        disabled={createBlocked}
        title={createBlocked ? SUSPENSION_COPY.blockedTooltip : undefined}
      >
        + 계약 작성
      </Btn>
    </div>
  )
}
