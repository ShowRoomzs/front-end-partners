import {
  categoryService,
  type Category,
} from "@/common/services/categoryService"
import { QUERY_KEYS } from "@/common/constants/queryKeys"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

export interface CategoryMap {
  byId: Map<number, Category>
  byParentId: Map<number, Array<Category>>
  mainCategories: Category[]
}

export function useGetCategory(enabled: boolean = true) {
  const query = useQuery({
    queryKey: [QUERY_KEYS.CATEGORIES],
    queryFn: categoryService.getCategories,
    enabled,
  })
  const categoryMap = useMemo<CategoryMap | null>(() => {
    if (!query.data) return null

    const byId = new Map<number, Category>()
    const byParentId = new Map<number, Array<Category>>()
    const mainCategories: Category[] = []

    query.data.forEach(category => {
      byId.set(category.categoryId, category)

      if (!category.parentId) {
        mainCategories.push(category)
      } else {
        const parentCategories = byParentId.get(category.parentId) || []
        parentCategories.push(category)
        byParentId.set(category.parentId, parentCategories)
      }
    })

    mainCategories.sort((a, b) => a.order - b.order)

    byParentId.forEach(categories => {
      categories.sort((a, b) => a.order - b.order)
    })

    return {
      byId,
      byParentId,
      mainCategories,
    }
  }, [query.data])

  return {
    ...query,
    categoryMap,
  }
}
