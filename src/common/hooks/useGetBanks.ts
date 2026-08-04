import { bankService } from "@/common/services/bankService"
import { QUERY_KEYS } from "@/common/constants/queryKeys"
import { useQuery } from "@tanstack/react-query"

/**
 * 은행 목록 조회 — GET /v1/common/banks (인증 불필요).
 *
 * 서버가 displayOrder 오름차순(자주 쓰는 은행 우선)으로 내려주므로 재정렬하지 않는다.
 *
 * staleTime을 명시하는 이유: queryClient에 전역 기본값이 없어 기본 staleTime이 0이라
 * 가입 스텝을 오갈 때마다 재요청한다. 은행 목록은 세션 중 변하지 않는 참조 데이터다.
 */
export function useGetBanks(enabled: boolean = true) {
  return useQuery({
    queryKey: [QUERY_KEYS.BANKS],
    queryFn: bankService.getBanks,
    staleTime: Infinity,
    enabled,
  })
}
