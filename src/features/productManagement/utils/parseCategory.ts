import type { Category } from "@/common/services/categoryService"

export function parseCategory(categories: Array<Category>) {
  return categories.map(category => ({
    value: category.categoryId,
    label: category.name,
  }))
}
