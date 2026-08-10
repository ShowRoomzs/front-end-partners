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

  const flattenMenus = menus.flatMap(m => m.groups)

  const handleLogout = useCallback(() => {
    cookie.remove(COOKIE_NAME.ACCESS_TOKEN)
    cookie.remove(COOKIE_NAME.REFRESH_TOKEN)
    clear()
    navigate("/")
  }, [clear, navigate])

  const title = useMemo(() => {
    const find = (menus: Array<MenuItem>): string | undefined => {
      for (const menu of menus) {
        if (menu.path === location.pathname) {
          return menu.label
        }
        if (menu.children && menu.children.length > 0) {
          const result = find(menu.children)

          if (result) {
            return result
          }
        }
      }
    }
    return find(flattenMenus)
  }, [flattenMenus, location.pathname])

  return (
    <div className="flex h-screen flex-col bg-sz-n-50">
      <Header
        onLogout={handleLogout}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div className="flex flex-1 overflow-hidden bg-sz-n-50">
        <Sidebar menus={menus} isOpen={isSidebarOpen} />
        <main
          className="flex flex-1 flex-col overflow-auto bg-sz-n-50 p-6 transition-[margin] duration-300"
          style={{ marginLeft: isSidebarOpen ? 0 : `-${SIDEBAR_WIDTH}px` }}
        >
          {/*
            디자인시스템 H1 — 20px/600(bold 아님).
            메뉴에 없는 화면(상품 등록·수정 등)은 페이지가 제 제목을 직접 그리므로
            여기서 빈 h1을 렌더하지 않는다(빈 태그도 여백은 그대로 먹는다).
          */}
          {title && (
            <h1 className="mb-4 shrink-0 text-[20px] font-semibold text-sz-n-900">
              {title}
            </h1>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  )
}
