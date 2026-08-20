import { useMemo, useState, useEffect, useCallback } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import Header from "./Header"

import { SIDEBAR_WIDTH } from "../Sidebar/config"
import { SIDEBAR_STORAGE_KEY } from "./config"
import Sidebar from "@/common/components/Sidebar/Sidebar"
import { COMMON_MENU, CREATOR_MENU, SELLER_MENU } from "@/common/constants/menu"
import { getMenuTypeByRole, type Role } from "@/common/types/role"
import type { MenuItem } from "@/common/types/menu"
import { cookie } from "@/common/lib/cookie"
import { COOKIE_NAME } from "@/common/constants/cookie"
import { useMarketStore } from "@/common/stores/useMarketStore"
import { useGetThreadSummary } from "@/features/connections/hooks/useGetThreadSummary"

/**
 * 메뉴에는 없지만 브레드크럼 하위 이름이 필요한 화면들.
 *
 * 목록에서만 들어갈 수 있는 화면(상품 등록·수정 등)은 GNB 항목이 아니라서
 * 메뉴 탐색으로는 이름을 못 찾는다. 접두사가 긴 것부터 검사한다.
 */
const SUB_PAGE_LABELS: Array<{ prefix: string; label: string }> = [
  { prefix: "/product/register", label: "상품 등록" },
  { prefix: "/product/edit", label: "상품 수정" },
  // 목록(/inquiry/product)은 걸리지 않게 끝에 슬래시를 둔다
  { prefix: "/inquiry/product/", label: "문의 상세" },
]

/**
 * 셸의 여백·제목·스크롤을 화면이 직접 가져가는 경로들.
 *
 * 연결·소통처럼 좌우 2패널이 화면 끝까지 꽉 차고 **내부 영역만 각자 스크롤**되는
 * 화면은 셸이 `p-6`·`overflow-auto`를 걸면 구조가 깨진다.
 */
const FULL_BLEED_PREFIXES = ["/connections"]

export default function MainLayout() {
  const navigate = useNavigate()
  const { role, clear } = useMarketStore()

  const getInitialSidebarState = () => {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY)
    return stored === null ? true : stored === "true"
  }
  const [isSidebarOpen, setIsSidebarOpen] = useState(getInitialSidebarState)
  const menuType = getMenuTypeByRole(role as Role)
  const location = useLocation()

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isSidebarOpen))
  }, [isSidebarOpen])

  const menus = useMemo(() => {
    const roleMenu = menuType === "SELLER" ? SELLER_MENU : CREATOR_MENU
    return [roleMenu, COMMON_MENU]
  }, [menuType])

  const flattenMenus = useMemo(() => menus.flatMap(m => m.groups), [menus])

  const handleLogout = useCallback(() => {
    cookie.remove(COOKIE_NAME.ACCESS_TOKEN)
    cookie.remove(COOKIE_NAME.REFRESH_TOKEN)
    clear()
    navigate("/")
  }, [clear, navigate])

  /** 시안 `.crumb` — "상위 메뉴 › 하위 화면" */
  const breadcrumb = useMemo(() => {
    const matches = (item: MenuItem) =>
      (item.matchPaths ?? [item.path]).some(
        path =>
          Boolean(path) &&
          (location.pathname === path ||
            location.pathname.startsWith(`${path}/`))
      )

    const findLabel = (items: Array<MenuItem>): string | undefined => {
      for (const item of items) {
        if (item.children?.length) {
          const childLabel = findLabel(item.children)
          if (childLabel) {
            return childLabel
          }
          continue
        }
        if (matches(item)) {
          return item.label
        }
      }
    }

    return {
      title: findLabel(flattenMenus),
      subtitle: SUB_PAGE_LABELS.find(entry =>
        location.pathname.startsWith(entry.prefix)
      )?.label,
    }
  }, [flattenMenus, location.pathname])

  /**
   * 본문 제목(H1)은 메뉴에 있는 화면에서만 셸이 그린다.
   * 등록·수정처럼 자기 제목을 직접 그리는 화면은 여기서 비운다 —
   * 빈 h1을 남기면 태그만 비어 있고 여백은 그대로 먹는다.
   */
  const isFullBleed = FULL_BLEED_PREFIXES.some(
    prefix =>
      location.pathname === prefix || location.pathname.startsWith(`${prefix}/`)
  )

  const pageTitle =
    breadcrumb.subtitle || isFullBleed ? undefined : breadcrumb.title

  const { data: threadSummary } = useGetThreadSummary(menuType === "SELLER")

  return (
    <div className="flex h-screen bg-sz-n-50">
      <Sidebar
        menus={menus}
        isOpen={isSidebarOpen}
        badgeCounts={{ connections: threadSummary?.unreadCount ?? 0 }}
      />

      <div
        className="flex min-w-0 flex-1 flex-col transition-[margin] duration-300"
        style={{ marginLeft: isSidebarOpen ? 0 : `-${SIDEBAR_WIDTH}px` }}
      >
        <Header
          title={breadcrumb.title}
          subtitle={breadcrumb.subtitle}
          onLogout={handleLogout}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        <main
          className={`flex min-h-0 flex-1 flex-col ${
            isFullBleed ? "overflow-hidden" : "overflow-auto p-6"
          }`}
        >
          {/* 디자인시스템 H1 — 20px/600(bold 아님) */}
          {pageTitle && (
            <h1 className="mb-4 shrink-0 text-[20px] font-semibold text-sz-n-900">
              {pageTitle}
            </h1>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  )
}
