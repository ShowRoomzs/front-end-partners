import { CONTRACT_SUMMARY_POLL_INTERVAL } from "@/features/contracts/constants/params"
import { CONTRACT_QUERY_KEYS } from "@/features/contracts/constants/queryKeys"
import { contractService } from "@/features/contracts/services/contractService"
import type { ContractListParams } from "@/features/contracts/types"
import { useQuery } from "@tanstack/react-query"

export function useGetContractList(params: ContractListParams) {
  return useQuery({
    queryKey: [CONTRACT_QUERY_KEYS.LIST, params],
    queryFn: () => contractService.getList(params),
  })
}

/**
 * 탭 카운트 + GNB 배지. 셸(MainLayout)과 목록이 같은 키를 쓰므로 요청은 한 번만 나간다.
 * 브랜드(SELLER) 전용 API라 크리에이터 계정에서는 호출하지 않는다.
 */
export function useGetContractSummary(enabled: boolean) {
  return useQuery({
    queryKey: [CONTRACT_QUERY_KEYS.SUMMARY],
    queryFn: contractService.getSummary,
    enabled,
    refetchInterval: CONTRACT_SUMMARY_POLL_INTERVAL,
    staleTime: 10_000,
  })
}

export function useGetContractDetail(contractId: number) {
  return useQuery({
    queryKey: [CONTRACT_QUERY_KEYS.DETAIL, contractId],
    queryFn: () => contractService.getDetail(contractId),
    enabled: Number.isFinite(contractId) && contractId > 0,
    // 403·404는 "찾을 수 없음" 화면으로 끝낸다 — 재시도해도 결과가 같다
    retry: false,
  })
}

/** 작성 폼 선택지 — 편집 모드에서만 부른다. 상품·연결이 자주 바뀌지 않아 5분간 재사용 */
export function useGetContractFormSources(enabled: boolean) {
  return useQuery({
    queryKey: [CONTRACT_QUERY_KEYS.FORM_SOURCES],
    queryFn: contractService.getFormSources,
    enabled,
    staleTime: 5 * 60_000,
  })
}

/** 표준 조항 — 시행 버전이 바뀌기 전엔 같은 값이라 세션 동안 한 번만 받는다 */
export function useGetContractClauses(enabled: boolean) {
  return useQuery({
    queryKey: [CONTRACT_QUERY_KEYS.CLAUSES],
    queryFn: contractService.getClauses,
    enabled,
    staleTime: Infinity,
  })
}
