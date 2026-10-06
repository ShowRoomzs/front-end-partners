import { cn } from "@/lib/utils"

export type BasicInfoTabKey =
  | "business"
  | "shipping"
  | "settlement"
  | "manager"
  | "account"

interface SubNavItem {
  key: BasicInfoTabKey
  label: string
}

const ITEMS: Array<SubNavItem> = [
  { key: "business", label: "사업자 정보" },
  { key: "shipping", label: "배송·반품 정책" },
  { key: "settlement", label: "정산 계좌" },
  { key: "manager", label: "담당자·CS" },
  { key: "account", label: "계정" },
]

/**
 * 시안 `.subnav` — GNB가 아니라 화면 안에서만 도는 세로 탭.
 *
 * 시안(rev.9)은 6항목 — 사업자 정보 · 배송·반품 정책 · 택배 연동 · 정산 계좌 · 담당자·CS · 계정.
 * 택배 연동만 "준비중" 비활성 항목으로 위치를 확보하고 라우팅을 붙이지 않는다 — 그래서 실제 탭은 5개이고,
 * 준비중 1개는 배열 밖에서 두 번째 항목 뒤에 고정 렌더한다.
 */
export default function SubNav(props: {
  active: BasicInfoTabKey
  onChange: (key: BasicInfoTabKey) => void
}) {
  const { active, onChange } = props

  return (
    <nav className="w-[180px] shrink-0">
      {ITEMS.slice(0, 2).map(item => (
        <NavItem
          key={item.key}
          item={item}
          active={active === item.key}
          onChange={onChange}
        />
      ))}

      <DisabledItem label="택배 연동" />

      {ITEMS.slice(2).map(item => (
        <NavItem
          key={item.key}
          item={item}
          active={active === item.key}
          onChange={onChange}
        />
      ))}
    </nav>
  )
}

function NavItem(props: {
  item: SubNavItem
  active: boolean
  onChange: (key: BasicInfoTabKey) => void
}) {
  const { item, active, onChange } = props

  return (
    <button
      type="button"
      onClick={() => onChange(item.key)}
      className={cn(
        "mb-0.5 flex w-full items-center justify-between rounded-[6px] px-3.5 py-2.5 text-left text-[12px]",
        active
          ? "border border-sz-n-300 bg-white font-semibold text-sz-n-900"
          : "text-sz-n-600 hover:bg-sz-n-100"
      )}
    >
      {item.label}
    </button>
  )
}

/** 시안 `.subnav-item.disabled` + `.subnav-tag` — 택배사 연동 전이라 클릭되지 않는다 */
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
