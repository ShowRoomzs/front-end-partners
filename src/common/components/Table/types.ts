import type { PaginationProps } from "@/common/components/Pagination/Pagination"
import type { SortOrder } from "@/common/types/page"
import type { ReactNode } from "react"

export type TableFixed = "left" | "right"
export type TableKey = "checkbox" | "number" | "virtual"
export interface Column<T, K extends keyof T = keyof T> {
  key: K | TableKey
  label: string | ReactNode
  render?: (value: T[K], record: T, index: number) => ReactNode
  renderFooter?: (values: Array<T[K]>) => ReactNode | string
  renderToExcel?: (
    value: T[K],
    record: T,
    data: Array<T>,
    index: number
  ) => string | number
  sortable?: boolean
  width?: number
  align?: "left" | "center" | "right"
  fixed?: TableFixed
  justify?: "between" | "center" | "start" | "end"
  delegateClick?: boolean // cell 클릭 시 하위 요소 클릭 위임
  preventRowClick?: boolean // cell 클릭 시 행 클릭 방지
}
export type Columns<T> = Array<Column<T>>
export interface SortOption {
  sortKey: string
  sortOrder: SortOrder
}
export interface TableProps<T, K extends keyof T = keyof T> {
  columns: Columns<T>
  data: Array<T>
  pageInfo: PaginationProps
  isLoading?: boolean
  showCheckbox?: boolean
  rowKey?: K
  renderFooter?: ReactNode
  onRowClick?: (record: T) => void
  checkedKeys?: Array<T[K]>
  onCheckedKeysChange?: (checkedKeys: Array<T[K]>) => void
  sortOption?: SortOption
  onSortChange?: (sortKey: string, sortOrder: SortOrder) => void
  bodyClassName?: string
  headerClassName?: string
  /** 데이터 0건일 때 본문 자리에 넣을 내용. 머리글은 그대로 유지된다 */
  emptyState?: ReactNode
  /**
   * 표를 컨테이너 폭에 맞춘다(가로 스크롤 없음).
   * columns의 고정 폭을 비율로 환산해 남는 공간까지 나눠 갖는다.
   */
  fitWidth?: boolean
}
