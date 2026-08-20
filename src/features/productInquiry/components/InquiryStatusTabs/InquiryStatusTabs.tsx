import { INQUIRY_STATUS_TABS } from "@/features/productInquiry/constants/params"
import type {
  InquiryStatusCounts,
  InquiryStatusFilter,
} from "@/features/productInquiry/types"
import { cn } from "@/lib/utils"

interface InquiryStatusTabsProps {
  status: InquiryStatusFilter
  onStatusChange: (status: InquiryStatusFilter) => void
  counts: InquiryStatusCounts
}

/**
 * 상태 탭 5종 — 배타적 단일선택.
 *
 * 시안 `.tabs`는 카드가 아니라 **밑줄 한 줄**이다(탐색 위계 3단의 1단). 필터 패널을
 * 카드로 두고 탭까지 카드로 감싸면 같은 층으로 보여 위계가 무너진다.
 *
 * 건수는 **마켓 전체 기준**이라 검색어를 넣어도 줄지 않는다. 탭은 "지금 무엇이 얼마나
 * 쌓여 있는가"를 보여주는 자리라, 검색 결과에 따라 숫자가 흔들리면 그 역할을 못 한다.
 */
export default function InquiryStatusTabs(props: InquiryStatusTabsProps) {
  const { status, onStatusChange, counts } = props

  return (
    <div className="mb-4 flex shrink-0 flex-wrap border-b border-sz-n-200">
      {INQUIRY_STATUS_TABS.map(tab => {
        const isActive = status === tab.value

        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onStatusChange(tab.value)}
            className={cn(
              "mr-[22px] flex items-center gap-1.5 whitespace-nowrap border-b-2 px-0.5 py-[9px] text-[12px]",
              isActive
                ? "border-sz-accent-500 font-medium text-sz-accent-500"
                : "border-transparent text-sz-n-500 hover:text-sz-n-700"
            )}
          >
            {tab.label}
            <span
              className={cn(
                "rounded-lg px-1.5 text-[10px]",
                isActive
                  ? "bg-sz-accent-50 text-sz-accent-600"
                  : "bg-sz-n-100 text-sz-n-600"
              )}
            >
              {counts[tab.countKey]}
            </span>
          </button>
        )
      })}
    </div>
  )
}
