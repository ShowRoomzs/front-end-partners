import { CREATOR_SEARCH_PAGE_SIZE } from "@/features/connections/constants/params"
import { CONNECTION_QUERY_KEYS } from "@/features/connections/constants/queryKeys"
import { connectionService } from "@/features/connections/services/connectionService"
import { useQuery } from "@tanstack/react-query"

/** 쇼룸명 부분 일치 검색 (시안 B1·B3·B4) — 빈 키워드로는 조회하지 않는다 */
export function useSearchCreators(keyword: string) {
  return useQuery({
    queryKey: [CONNECTION_QUERY_KEYS.CREATOR_SEARCH, keyword],
    queryFn: () =>
      connectionService.searchCreators({
        keyword,
        page: 1,
        size: CREATOR_SEARCH_PAGE_SIZE,
      }),
    enabled: keyword.trim().length > 0,
  })
}
