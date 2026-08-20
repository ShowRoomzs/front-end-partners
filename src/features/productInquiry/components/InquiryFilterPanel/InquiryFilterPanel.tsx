import type { FilterCount } from "@/features/productInquiry/types"
import { cn } from "@/lib/utils"

/** 체크박스 + 라벨 + 건수 */
function CheckItem(props: {
  label: string
  count: number
  checked: boolean
  onToggle: () => void
}) {
  const { label, count, checked, onToggle } = props

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className={cn(
        "inline-flex items-center gap-1.5 text-[12px]",
        checked ? "font-medium text-sz-n-900" : "text-sz-n-600"
      )}
    >
      <span
        className={cn(
          "flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-[4px] border-[1.5px]",
          checked
            ? "border-sz-accent-500 bg-sz-accent-500"
            : "border-sz-n-300 bg-white"
        )}
      >
        {checked && (
          <svg viewBox="0 0 9 9" className="h-[9px] w-[9px]">
            <path
              d="M1 4.5L3.3 7L8 1.5"
              stroke="#fff"
              strokeWidth="1.6"
              fill="none"
            />
          </svg>
        )}
      </span>
      {label}
      <span className="text-[11px] font-normal text-sz-n-400">{count}</span>
    </button>
  )
}

function CheckRow(props: {
  label: string
  items: Array<FilterCount>
  selected: Array<string>
  onToggle: (code: string) => void
}) {
  const { label, items, selected, onToggle } = props

  return (
    <div className="flex flex-wrap items-center gap-3.5">
      <span className="w-[58px] shrink-0 text-[11px] font-semibold text-sz-n-400">
        {label}
      </span>
      {items.map(item => (
        <CheckItem
          key={item.code}
          label={item.label}
          count={item.count}
          checked={selected.includes(item.code)}
          onToggle={() => onToggle(item.code)}
        />
      ))}
    </div>
  )
}

interface InquiryFilterPanelProps {
  typeItems: Array<FilterCount>
  selectedTypes: Array<string>
  onToggleType: (code: string) => void
  visibilityItems: Array<FilterCount>
  selectedVisibilities: Array<string>
  onToggleVisibility: (code: string) => void
  keyword: string
  onKeywordChange: (keyword: string) => void
  onSearch: () => void
  onReset: () => void
}

/**
 * 필터 패널 — 문의 유형 행 + 공개여부 행 + 우상단 초기화 + 하단 검색.
 *
 * 상품 목록 필터와 생김새는 같지만 **동작이 다르다.** 이쪽은 한 축에서 여러 개를
 * 켤 수 있다(§23-2, 서버 condition의 `types`·`visibilities`가 리스트다).
 * 상품 쪽 단일선택 규칙을 여기에 옮겨 오지 말 것.
 *
 * 「전체」 항목이 없는 것도 의도다 — 아무것도 안 켠 상태가 곧 전체라, 전체 버튼을 두면
 * 같은 의미의 상태가 둘이 된다.
 *
 * 항목 라벨과 건수는 서버가 코드와 함께 내려준다. 유형 5종을 프론트에 박아 두면
 * enum이 늘 때 조용히 빠지므로, 목록 응답이 준 항목만 그린다.
 */
export default function InquiryFilterPanel(props: InquiryFilterPanelProps) {
  const {
    typeItems,
    selectedTypes,
    onToggleType,
    visibilityItems,
    selectedVisibilities,
    onToggleVisibility,
    keyword,
    onKeywordChange,
    onSearch,
    onReset,
  } = props

  return (
    <div className="relative mb-4 flex shrink-0 flex-col gap-4 rounded-[8px] border border-sz-n-200 bg-white px-4 py-5">
      {/* 여백은 버튼과 겹치는 첫 행에만 준다 — 패널 전체에 주면 검색 행까지 밀린다 */}
      <button
        type="button"
        onClick={onReset}
        className="absolute right-3.5 top-[17px] inline-flex h-[26px] items-center gap-[5px] rounded-[6px] border border-sz-n-300 bg-white px-2.5 text-[11px] font-medium text-sz-n-500 hover:border-sz-n-400 hover:bg-sz-n-100 hover:text-sz-n-700"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-[11px] w-[11px]"
        >
          <polyline points="23 4 23 10 17 10" />
          <polyline points="1 20 1 14 7 14" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
        초기화
      </button>

      <div className="pr-[90px]">
        <CheckRow
          label="문의 유형"
          items={typeItems}
          selected={selectedTypes}
          onToggle={onToggleType}
        />
      </div>

      <CheckRow
        label="공개여부"
        items={visibilityItems}
        selected={selectedVisibilities}
        onToggle={onToggleVisibility}
      />

      <div className="flex justify-end gap-1.5">
        <input
          type="text"
          value={keyword}
          onChange={event => onKeywordChange(event.target.value)}
          onKeyDown={event => {
            if (event.key === "Enter") {
              onSearch()
            }
          }}
          placeholder="상품명 · 질문 검색"
          className="h-9 w-[280px] rounded-[6px] border border-sz-n-300 bg-white px-2.5 text-[13px] text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
        />
        <button
          type="button"
          onClick={onSearch}
          className="inline-flex h-9 items-center rounded-[6px] border border-sz-n-300 bg-white px-3.5 text-[12px] font-medium text-sz-n-900 hover:bg-sz-n-100"
        >
          검색
        </button>
      </div>
    </div>
  )
}
