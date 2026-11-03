import { QUERY_KEYS } from "@/common/constants/queryKeys"
import { policyService } from "@/common/services/policyService"
import { useQuery } from "@tanstack/react-query"

/**
 * 정책 영업일 · 일수(`GET /v1/common/policy-values`) — 서버 설정값이라 세션 중 바뀌지 않는다.
 * 실패하거나 받기 전이면 undefined — 화면은 「N영업일」로 둔다.
 */
export function usePolicyValues() {
  return useQuery({
    queryKey: [QUERY_KEYS.POLICY_VALUES],
    queryFn: policyService.getPolicyValues,
    staleTime: Infinity,
    retry: false,
  })
}

/** 「3영업일」 — 값이 없으면 「N영업일」 */
export function businessDaysText(days: number | null | undefined) {
  return typeof days === "number" ? `${days}영업일` : "N영업일"
}
