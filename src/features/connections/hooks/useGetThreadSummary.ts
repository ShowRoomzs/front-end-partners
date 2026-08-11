import { THREAD_QUERY_KEYS } from "@/features/connections/constants/queryKeys"
import { SUMMARY_POLL_INTERVAL } from "@/features/connections/constants/params"
import { threadService } from "@/features/connections/services/threadService"
import { useQuery } from "@tanstack/react-query"

/**
 * GNB 배지용 안 읽은 수. 셸 전체에서 항상 돌기 때문에 응답이 가장 가벼운
 * 전용 엔드포인트를 쓴다 — 목록 조회로 대신하면 폴링 비용이 커진다.
 *
 * 브랜드(SELLER) 전용 API라 크리에이터 계정에서는 호출하지 않는다.
 */
export function useGetThreadSummary(enabled: boolean) {
  return useQuery({
    queryKey: [THREAD_QUERY_KEYS.THREAD_SUMMARY],
    queryFn: threadService.getSummary,
    enabled,
    refetchInterval: SUMMARY_POLL_INTERVAL,
  })
}
