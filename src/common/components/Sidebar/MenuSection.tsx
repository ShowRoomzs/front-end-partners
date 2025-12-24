import type { MenuGroup } from '@/common/types'
import MenuGroupComponent from './MenuGroupComponent'

interface MenuSectionProps {
  groups: Array<MenuGroup>
}

export default function MenuSection(props: MenuSectionProps) {
  const { groups } = props

  return (
    <>
      {groups.map(group => (
        <MenuGroupComponent key={group.id} group={group} />
      ))}
    </>
  )
}
