import {
  CLAIM_LIST_PATH,
  ORDER_LIST_PATH,
} from "@/features/orders/constants/params"
import type { OrderSummaryResponse, OrderTab } from "@/features/orders/types"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router-dom"

type QuickTarget = { tab: OrderTab } | { claims: true }

/**
 * 요약 바 5칸 — 「지금 내가 처리해야 할 게 몇 건인가」(§34-2). 누르면 그 일을 하는 곳으로 간다.
 * 반품·교환 두 칸은 반품·교환 관리 소관이다.
 */
const QUICK_ITEMS: Array<{
  key: keyof OrderSummaryResponse["actionBar"]
  label: string
  target: QuickTarget
}> = [
  { key: "prepareStart", label: "준비 시작", target: { tab: "NEW" } },
  { key: "invoiceRegister", label: "송장 등록", target: { tab: "PREPARING" } },
  { key: "deliveryIssue", label: "배송 이상", target: { tab: "SHIPPING" } },
  { key: "incomingCheck", label: "입고 확인", target: { claims: true } },
  { key: "reshipExchange", label: "재발송 · 교환", target: { claims: true } },
]

/**
 * 판매 관리 상단 — 제목 · 처리 대기 요약 바 · 주문/반품·교환 탭.
 * 요약 바는 검색 조건과 무관한 **전체 기준**이라 검색 결과가 없어도 숫자가 남는다(A5).
 */
export default function SalesHeader(props: {
  view: "orders" | "claims"
  summary: OrderSummaryResponse | undefined
  claimTotal: number | undefined
  /** 같은 화면 안에서 탭만 바꿀 때 — 없으면 주소로 이동한다 */
  onSelectTab?: (tab: OrderTab) => void
}) {
  const { view, summary, claimTotal, onSelectTab } = props
  const navigate = useNavigate()

  const handleQuick = (target: QuickTarget) => {
    if ("claims" in target) {
      navigate(CLAIM_LIST_PATH)
      return
    }
    if (onSelectTab) {
      onSelectTab(target.tab)
      return
    }
    navigate(`${ORDER_LIST_PATH}?tab=${target.tab}`)
  }

  return (
    <>
      <div className="mb-4 shrink-0">
        <h1 className="text-[20px] font-semibold text-sz-n-900">판매 관리</h1>
        <p className="mt-0.5 text-[12px] text-sz-n-600">
          공구 주문의 배송과 반품·교환을 처리합니다.
        </p>
      </div>

      <div className="mb-4 flex shrink-0 overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
        {QUICK_ITEMS.map(item => {
          const count = summary?.actionBar[item.key] ?? 0
          const isOn = count > 0
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => handleQuick(item.target)}
              className={cn(
                "flex-1 cursor-pointer border-r border-sz-n-100 px-4 py-3 text-left last:border-r-0",
                isOn ? "bg-sz-accent-50" : "hover:bg-sz-n-50"
              )}
            >
              <div
                className={cn(
                  "text-[20px] font-semibold leading-[1.2] tabular-nums",
                  isOn ? "text-sz-accent-600" : "text-sz-n-400"
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
          active={view === "orders"}
          label="주문 관리"
          count={summary?.tabCounts.ALL}
          onClick={() => navigate(ORDER_LIST_PATH)}
        />
        <ViewTab
          active={view === "claims"}
          label="반품 · 교환 관리"
          count={claimTotal}
          onClick={() => navigate(CLAIM_LIST_PATH)}
        />
      </div>
    </>
  )
}

/** 시안 `.tab1` — 주문 관리 / 반품·교환 관리 */
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
