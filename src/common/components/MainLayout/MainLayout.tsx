import type { ReactNode } from 'react'
import { useState } from 'react'
import Sidebar from '../Sidebar'
import Header from './Header'
import {
  SELLER_MENU,
  CREATOR_MENU,
  COMMON_MENU,
  CURRENT_USER_ROLE,
} from '@/common/constants'
import { getMenuTypeByRole } from '@/common/types'

interface MainLayoutProps {
  children: ReactNode
}

export default function MainLayout(props: MainLayoutProps) {
  const { children } = props
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const menuType = getMenuTypeByRole(CURRENT_USER_ROLE)

  const roleMenu = menuType === 'SELLER' ? SELLER_MENU : CREATOR_MENU
  const menus = [roleMenu, COMMON_MENU]

  return (
    <div className="h-screen bg-[#f7f8fa] flex flex-col">
      <Header
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div className="flex flex-1 overflow-hidden bg-[#f7f8fa]">
        <Sidebar menus={menus} isOpen={isSidebarOpen} />

        <main
          className={`flex-1 overflow-y-auto p-8 bg-[#f7f8fa] transition-[margin] duration-300 ${
            isSidebarOpen ? 'ml-64' : 'ml-0'
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
