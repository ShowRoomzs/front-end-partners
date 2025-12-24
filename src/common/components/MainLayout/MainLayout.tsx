import { useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../Sidebar'
import Header from './Header'
import {
  SELLER_MENU,
  CREATOR_MENU,
  COMMON_MENU,
  CURRENT_USER_ROLE,
} from '@/common/constants'
import { getMenuTypeByRole, type MenuItem } from '@/common/types'

export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const menuType = getMenuTypeByRole(CURRENT_USER_ROLE)
  const location = useLocation()

  const menus = useMemo(() => {
    const roleMenu = menuType === 'SELLER' ? SELLER_MENU : CREATOR_MENU
    return [roleMenu, COMMON_MENU]
  }, [menuType])

  const flattenMenus = menus.flatMap(m => m.groups)

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
    <div className="h-screen bg-[#f7f8fa] flex flex-col">
      <Header
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div className="flex flex-1 overflow-hidden bg-[#f7f8fa]">
        <Sidebar menus={menus} isOpen={isSidebarOpen} />

        <main
          className={`flex-1 overflow-y-auto p-[20px] bg-[#f7f8fa] transition-[margin] duration-300 ${
            isSidebarOpen ? 'ml-64' : 'ml-0'
          }`}
        >
          <h1 className="text-[20px] font-bold">{title}</h1>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
