import { useEffect, useMemo, useState } from "react"
import type { PaginationProps } from "@/common/components/Pagination/Pagination"
import type { PageResponse } from "@/common/types/page"

interface UsePaginationInfoOptions {
  data?: PageResponse<unknown> | null
  onPageChange?: (page: number) => void
}

/**
 * 페이지네이션 정보를 관리하는 훅
 * 페이지 전환 시 깜빡임을 방지하기 위해 이전 데이터를 캐시합니다.
 */
export function usePaginationInfo(
  props: UsePaginationInfoOptions
): PaginationProps {
  const { data, onPageChange } = props

  const [cachedPageInfo, setCachedPageInfo] = useState<
    Omit<PaginationProps, "onPageChange">
  >({
    page: 0,
    totalElements: 0,
    totalPages: 0,
    size: 20,
  })

  useEffect(() => {
    if (!data) return

    setCachedPageInfo({
      page: data.page,
      totalElements: data.totalElements,
      totalPages: data.totalPages,
      size: data.size,
    })
  }, [data])

  const pageInfo = useMemo<PaginationProps>(() => {
    return {
      page: data?.page ?? cachedPageInfo.page,
      totalElements: data?.totalElements ?? cachedPageInfo.totalElements,
      totalPages: data?.totalPages ?? cachedPageInfo.totalPages,
      size: data?.size ?? cachedPageInfo.size,
      onPageChange,
    }
  }, [data, cachedPageInfo, onPageChange])

  return pageInfo
}
