import { useMarketStore } from "@/common/stores/useMarketStore"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { HEADER_HEIGHT } from "./config"

interface HeaderProps {
  /** 상위 메뉴명 (예: 상품 관리) */
  title?: string
  /** 하위 화면명 (예: 상품 등록) */
  subtitle?: string
  isSidebarOpen: boolean
  onToggleSidebar: () => void
  onLogout: () => void
}

/**
 * 파트너센터 탑바 — 시안 `.top`. 사이드바 **우측에만** 걸친다(높이 56px).
 *
 * 로고는 여기가 아니라 사이드바 상단(`.side-brand`)에 있다 —
 * 예전엔 탑바가 화면 전체 폭을 가로지르고 로고가 그 안에 있었는데,
 * 시안·어드민 모두 사이드바가 전체 높이를 차지하는 구조다.
 */
export default function Header(props: HeaderProps) {
  const { title, subtitle, isSidebarOpen, onToggleSidebar, onLogout } = props
  const { market } = useMarketStore()

  return (
    <header
      className="flex shrink-0 items-center justify-between gap-3 border-b border-sz-n-200 bg-white px-6"
      style={{ height: `${HEADER_HEIGHT}px` }}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        {/* 시안엔 없는 버튼이지만 사이드바 접기는 기존 기능이라 유지한다 */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="-ml-2 shrink-0 cursor-pointer rounded-[6px] p-1.5 text-sz-n-500 transition-colors hover:bg-sz-n-100 hover:text-sz-n-700"
          aria-label={isSidebarOpen ? "사이드바 접기" : "사이드바 펼치기"}
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* 시안 `.crumb` — 16px/600 + 하위 화면은 12px 회색 */}
        <div className="min-w-0 truncate text-[16px] font-semibold text-sz-n-900">
          {title}
          {subtitle && (
            <span className="ml-1.5 text-[12px] font-normal text-sz-n-500">
              › {subtitle}
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {/* 시안 `.brand-chip` — 어느 브랜드로 로그인했는지 항상 보이게 */}
        {market?.marketName && (
          <span className="text-[12px] text-sz-n-600">{market.marketName}</span>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="h-8 px-2.5 text-sz-n-700 hover:bg-sz-n-100 hover:text-sz-n-900"
        >
          <LogOut className="size-4" aria-hidden />
          로그아웃
        </Button>
      </div>
    </header>
  )
}
