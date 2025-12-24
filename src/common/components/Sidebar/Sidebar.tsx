import type { MenuConfig } from '@/common/types'
import MenuSection from './MenuSection'

interface SidebarProps {
  menus: Array<MenuConfig>
  isOpen: boolean
}

export default function Sidebar(props: SidebarProps) {
  const { menus, isOpen } = props

  return (
    <aside
      className={`fixed left-0 top-10 h-[calc(100vh-40px)] w-64 bg-[#1c223f] border-r border-[#2a2d4a] flex flex-col transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#3d4166] scrollbar-track-transparent">
        <div className="py-6">
          {menus.map(menu => (
            <MenuSection key={menu.menuType} groups={menu.groups} />
          ))}
        </div>
      </div>
    </aside>
  )
}
