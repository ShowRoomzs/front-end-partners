import { cn } from "@/lib/utils"

export type BasicInfoTabKey = "business" | "settlement" | "manager" | "account"

interface SubNavItem {
  key: BasicInfoTabKey
  label: string
}

const ITEMS: Array<SubNavItem> = [
  { key: "business", label: "사업자 정보" },
  { key: "settlement", label: "정산 계좌" },
  { key: "manager", label: "담당자·CS" },
  { key: "account", label: "계정" },
]

/**
 * 시안 `.subnav` — GNB가 아니라 화면 안에서만 도는 세로 탭.
 *
 * 시안은 배송·반품 정책·택배 연동을 포함해 6항목이지만, 그 둘은 법률 검토 전이라
 * "준비중" 비활성 항목으로 위치만 확보하고 라우팅을 붙이지 않는다(§15 스코프 한정) —
 * 그래서 이 컴포넌트가 다루는 실제 탭은 4개뿐이고, 준비중 2개는 배열 밖에서 고정 렌더한다.
 */
export default function SubNav(props: {
  active: BasicInfoTabKey
  onChange: (key: BasicInfoTabKey) => void
}) {
  const { active, onChange } = props

  return (
    <nav className="w-[180px] shrink-0">
      <button
        type="button"
        onClick={() => onChange("business")}
        className={cn(
          "mb-0.5 flex w-full items-center justify-between rounded-[6px] px-3.5 py-2.5 text-left text-[12px]",
          active === "business"
            ? "border border-sz-n-300 bg-white font-semibold text-sz-n-900"
            : "text-sz-n-600 hover:bg-sz-n-100"
        )}
      >
        사업자 정보
      </button>

      <DisabledItem label="배송·반품 정책" />
      <DisabledItem label="택배 연동" />

      {ITEMS.slice(1).map(item => (
        <button
          key={item.key}
          type="button"
          onClick={() => onChange(item.key)}
          className={cn(
            "mb-0.5 flex w-full items-center justify-between rounded-[6px] px-3.5 py-2.5 text-left text-[12px]",
            active === item.key
              ? "border border-sz-n-300 bg-white font-semibold text-sz-n-900"
              : "text-sz-n-600 hover:bg-sz-n-100"
          )}
        >
          {item.label}
        </button>
      ))}
    </nav>
  )
}

/** 시안 `.subnav-item.disabled` + `.subnav-tag` — 법률 검토 전이라 클릭되지 않는다 */
function DisabledItem({ label }: { label: string }) {
  return (
    <div className="mb-0.5 flex w-full cursor-not-allowed items-center justify-between rounded-[6px] px-3.5 py-2.5 text-[12px] text-sz-n-400">
      {label}
      <span className="rounded-[8px] bg-sz-n-200 px-[7px] py-px text-[10px] font-medium whitespace-nowrap text-sz-n-500">
        준비중
      </span>
    </div>
  )
}
