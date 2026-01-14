import type { CategoryValue } from "@/common/components/Form/FormCategorySelector"
import type { CategoryMap } from "@/common/hooks/useGetCategory"

export function getCategoryHierarchy(
  categoryId: number,
  categoryMap: CategoryMap
): CategoryValue {
  if (!categoryMap) {
    return { main: null, sub: null, detail: null }
  }

  const category = categoryMap.byId.get(categoryId)
  if (!category) {
    return { main: null, sub: null, detail: null }
  }

  if (!category.parentId) {
    return { main: categoryId, sub: null, detail: null }
  }

  const parent = categoryMap.byId.get(category.parentId)
  if (!parent) {
    return { main: null, sub: null, detail: null }
  }

  if (!parent.parentId) {
    return { main: parent.categoryId, sub: categoryId, detail: null }
  }

  const grandParent = categoryMap.byId.get(parent.parentId)
  if (!grandParent) {
    return { main: null, sub: null, detail: null }
  }

  return {
    main: grandParent.categoryId,
    sub: parent.categoryId,
    detail: categoryId,
  }
}
