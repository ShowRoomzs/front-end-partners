import { apiInstance } from "@/common/lib/apiInstance"

export interface Category {
  categoryId: number
  name: string
  order: number
  iconUrl: string
  parentId?: number
}

type CategoriesResponse = Array<Category>

export const categoryService = {
  getCategories: async () => {
    const { data: response } =
      await apiInstance.get<CategoriesResponse>("/seller/category")

    return response
  },
}
