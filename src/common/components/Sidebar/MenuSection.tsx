import type { MenuItem } from "@/common/types/menu"
import MenuGroupComponent from "./MenuGroupComponent"

interface MenuSectionProps {
  groups: Array<MenuItem>
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
