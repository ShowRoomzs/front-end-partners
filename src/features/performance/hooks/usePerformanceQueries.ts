import { isApiNotReady } from "@/common/utils/devMock"
import { PERFORMANCE_QUERY_KEYS } from "@/features/performance/constants/params"
import { performanceService } from "@/features/performance/services/performanceService"
import type {
  PerformanceCostRequest,
  PerformanceListParams,
} from "@/features/performance/types"
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

/** 「준비 중」(배포 전 404)은 다시 시도해도 같다 — 재시도로 화면이 늦게 뜨지 않게 한다 */
const retryUnlessNotReady = (count: number, error: unknown) =>
  !isApiNotReady(error) && count < 2

export function useGetPerformanceList(params: PerformanceListParams) {
  return useQuery({
    queryKey: [PERFORMANCE_QUERY_KEYS.LIST, params],
    queryFn: () => performanceService.getList(params),
    placeholderData: keepPreviousData,
    retry: retryUnlessNotReady,
  })
}

export function useGetPerformanceSummary() {
  return useQuery({
    queryKey: [PERFORMANCE_QUERY_KEYS.SUMMARY],
    queryFn: performanceService.getSummary,
    retry: retryUnlessNotReady,
  })
}

export function useGetPerformanceDetail(groupBuyId: number) {
  return useQuery({
    queryKey: [PERFORMANCE_QUERY_KEYS.DETAIL, groupBuyId],
    queryFn: () => performanceService.getDetail(groupBuyId),
    enabled: Number.isFinite(groupBuyId),
    retry: false,
  })
}

/** 원가 저장 — 응답이 다시 계산한 상세라 캐시를 바로 바꾼다(원가는 목록 · 요약에 나오지 않는다) */
export function useSavePerformanceCost(groupBuyId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: PerformanceCostRequest) =>
      performanceService.saveCost(groupBuyId, body),
    onSuccess: detail => {
      queryClient.setQueryData(
        [PERFORMANCE_QUERY_KEYS.DETAIL, groupBuyId],
        detail
      )
    },
  })
}
