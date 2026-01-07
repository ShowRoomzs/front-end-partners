export interface PageParams {
  page: number
  size: number
}

export interface PageResponse<T> {
  content: Array<T>
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export type SortOrder = "asc" | "desc"
export interface SortParams {
  sortBy: string
  sortOrder: SortOrder
}

export type BaseParams = PageParams & SortParams
