import { DEV_MOCK_ENABLED } from "@/common/utils/devMock"
import { SETTLEMENT_QUERY_KEYS } from "@/features/settlement/constants/params"
import { settlementService } from "@/features/settlement/services/settlementService"
import type { SettlementListParams } from "@/features/settlement/types"
import { keepPreviousData, useQuery } from "@tanstack/react-query"

/** 배포본에서는 호출하지 않는다 — API가 없어 화면이 「준비 중」을 띄운다 */
export function useGetSettlementList(params: SettlementListParams) {
  return useQuery({
    queryKey: [SETTLEMENT_QUERY_KEYS.LIST, params],
    queryFn: () => settlementService.getList(params),
    placeholderData: keepPreviousData,
    enabled: DEV_MOCK_ENABLED,
  })
}

/** KPI · 상태 칩 건수 — 검색 조건과 무관한 전체 기준 */
export function useGetSettlementSummary() {
  return useQuery({
    queryKey: [SETTLEMENT_QUERY_KEYS.SUMMARY],
    queryFn: settlementService.getSummary,
    enabled: DEV_MOCK_ENABLED,
  })
}

export function useGetSettlementDetail(settlementId: number) {
  return useQuery({
    queryKey: [SETTLEMENT_QUERY_KEYS.DETAIL, settlementId],
    queryFn: () => settlementService.getDetail(settlementId),
    enabled: DEV_MOCK_ENABLED && Number.isFinite(settlementId),
    retry: false,
  })
}
