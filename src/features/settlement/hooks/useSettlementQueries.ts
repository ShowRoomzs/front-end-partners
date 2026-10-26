import type { BaseParams } from "@/common/types/page"
import { SETTLEMENT_QUERY_KEYS } from "@/features/settlement/constants/params"
import { settlementService } from "@/features/settlement/services/settlementService"
import type {
  SettlementAdjustmentRequest,
  SettlementListParams,
} from "@/features/settlement/types"
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

export function useGetSettlementList(params: SettlementListParams) {
  return useQuery({
    queryKey: [SETTLEMENT_QUERY_KEYS.LIST, params],
    queryFn: () => settlementService.getList(params),
    placeholderData: keepPreviousData,
  })
}

/** KPI · 상태 칩 건수 · GNB 배지 — 검색 조건과 무관한 전체 기준 */
export function useGetSettlementSummary(enabled = true) {
  return useQuery({
    queryKey: [SETTLEMENT_QUERY_KEYS.SUMMARY],
    queryFn: settlementService.getSummary,
    enabled,
  })
}

/** 세금계산서 공급자 — 설정값이라 한 번 받으면 바뀌지 않는다. 실패하면 화면이 시안 값으로 그린다 */
export function useGetCompanyInfo() {
  return useQuery({
    queryKey: [SETTLEMENT_QUERY_KEYS.COMPANY_INFO],
    queryFn: settlementService.getCompanyInfo,
    staleTime: Infinity,
    retry: false,
  })
}

export function useGetSettlementDetail(settlementId: number) {
  return useQuery({
    queryKey: [SETTLEMENT_QUERY_KEYS.DETAIL, settlementId],
    queryFn: () => settlementService.getDetail(settlementId),
    enabled: Number.isFinite(settlementId),
    retry: false,
  })
}

/** 전체 명세 — 상세의 미리보기 5건을 펼쳤을 때만 부른다 */
export function useGetSettlementItems(
  settlementId: number,
  params: BaseParams,
  enabled: boolean
) {
  return useQuery({
    queryKey: [SETTLEMENT_QUERY_KEYS.ITEMS, settlementId, params],
    queryFn: () => settlementService.getItems(settlementId, params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

/**
 * 조정 요청 모달의 미리보기 — `rewardAmount`가 null이면 모달을 여는 값(상한 · 원래 금액 계산).
 * 입력 미리보기는 직전 결과를 잠깐 들고 있다가(`isPlaceholderData`) 새 결과로 바꾼다.
 */
export function useGetAdjustmentPreview(
  settlementId: number,
  rewardAmount: number | null,
  enabled = true
) {
  return useQuery({
    queryKey: [
      SETTLEMENT_QUERY_KEYS.ADJUSTMENT_PREVIEW,
      settlementId,
      rewardAmount,
    ],
    queryFn: () =>
      settlementService.getAdjustmentPreview(settlementId, rewardAmount, {
        silent: rewardAmount !== null,
      }),
    placeholderData: rewardAmount === null ? undefined : keepPreviousData,
    enabled,
    retry: false,
  })
}

/**
 * 정산 조정 요청 — 정산이 조정 협의로 바뀌고 상태 건수가 움직이므로 상세 · 목록 · 요약을 다시 읽는다.
 */
export function useRequestSettlementAdjustment(settlementId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: SettlementAdjustmentRequest) =>
      settlementService.requestAdjustment(settlementId, body),
    onSuccess: () => invalidateSettlement(queryClient, settlementId),
  })
}

/** 정산 한 건의 사실이 바뀌었을 때(요청 성공 · 기간 경과 · 이미 협의 있음) 화면을 서버 값으로 되돌린다 */
export function invalidateSettlement(
  queryClient: ReturnType<typeof useQueryClient>,
  settlementId: number
) {
  queryClient.invalidateQueries({
    queryKey: [SETTLEMENT_QUERY_KEYS.DETAIL, settlementId],
  })
  queryClient.invalidateQueries({
    queryKey: [SETTLEMENT_QUERY_KEYS.ADJUSTMENT_PREVIEW, settlementId],
  })
  queryClient.invalidateQueries({ queryKey: [SETTLEMENT_QUERY_KEYS.LIST] })
  queryClient.invalidateQueries({ queryKey: [SETTLEMENT_QUERY_KEYS.SUMMARY] })
}
