import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import type { MenuItem } from '@/common/types'
import MenuItemButton from './MenuItemButton'
import MenuSubItem from './MenuSubItem'
import MenuItemLink from './MenuItemLink'

interface MenuItemComponentProps {
  item: MenuItem
}

export default function MenuItemComponent(props: MenuItemComponentProps) {
  const { item } = props
  const location = useLocation()

  // 로컬스토리지에서 초기값 읽기
  const getInitialOpenState = () => {
    const storageKey = `menu-item-${item.id}`
    const stored = localStorage.getItem(storageKey)
    return stored === 'true'
  }

  const [isOpen, setIsOpen] = useState(getInitialOpenState)
  const hasChildren = item.children && item.children.length > 0

  // 상태 변경 시 로컬스토리지에 저장
  useEffect(() => {
    const storageKey = `menu-item-${item.id}`
    localStorage.setItem(storageKey, String(isOpen))
  }, [isOpen, item.id])

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  // 1depth: children이 있는 경우 (토글 가능)
  if (hasChildren) {
    return (
      <div>
        <MenuItemButton
          label={item.label}
          isOpen={isOpen}
          onClick={handleToggle}
        />

        {isOpen && (
          <div className="bg-[#181b30]">
            {item.children!.map(child => (
              <MenuSubItem
                key={child.id}
                id={child.id}
                label={child.label}
                path={child.path || '#'}
                isActive={child.path === location.pathname}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  // 1depth: children이 없는 경우 (바로 링크)
  return (
    <MenuItemLink
      label={item.label}
      path={item.path || '#'}
      isActive={item.path === location.pathname}
    />
  )
}
