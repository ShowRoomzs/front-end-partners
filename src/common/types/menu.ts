import type { MenuType } from '@/common/types/role'

export interface MenuItem {
  id: string
  label: string
  path?: string
  children?: Array<MenuItem>
}

export interface MenuConfig {
  menuType: MenuType | 'COMMON'
  groups: Array<MenuItem>
}
