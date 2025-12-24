import { useMemo, useState, useEffect } from 'react'
import type { MenuGroup } from '@/common/types'
import MenuItemComponent from './MenuItemComponent'
import MenuGroupButton from './MenuGroupButton'
import { useLocation, useNavigate } from 'react-router-dom'

interface MenuGroupComponentProps {
  group: MenuGroup
}

export default function MenuGroupComponent(props: MenuGroupComponentProps) {
  const { group } = props
  const navigate = useNavigate()
  const location = useLocation()

  // 로컬스토리지에서 초기값 읽기
  const getInitialOpenState = () => {
    const storageKey = `menu-group-${group.id}`
    const stored = localStorage.getItem(storageKey)
    return stored === 'true'
  }

  const [isOpen, setIsOpen] = useState(getInitialOpenState)

  // 상태 변경 시 로컬스토리지에 저장
  useEffect(() => {
    const storageKey = `menu-group-${group.id}`
    localStorage.setItem(storageKey, String(isOpen))
  }, [isOpen, group.id])

  const handleClickMenu = () => {
    const hasPath = !!group?.path
    if (hasPath) {
      navigate(group.path!)
      return
    }

    setIsOpen(!isOpen)
  }

  const isActive = useMemo(() => {
    const hasPath = !!group?.path
    if (isOpen) {
      return true
    }
    if (hasPath) {
      return group.path === location.pathname
    }
    const childPaths = group.items?.map(v => v.path)

    return childPaths?.some(v => v === location.pathname) ?? false
  }, [group.items, group.path, isOpen, location.pathname])

  return (
    <div className="mb-3">
      {group.label && (
        <MenuGroupButton
          label={group.label}
          isActive={isActive}
          isOpen={isOpen}
          hasItems={Boolean(group.items && group.items.length > 0)}
          onClick={handleClickMenu}
        />
      )}

      {isOpen && (
        <div className={group.label ? 'mt-1 mb-2' : ''}>
          {group.items?.map(item => (
            <MenuItemComponent key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
