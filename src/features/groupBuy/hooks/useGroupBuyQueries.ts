import {
  GROUP_BUY_QUERY_KEYS,
  GROUP_BUY_SUMMARY_POLL_INTERVAL,
} from "@/features/groupBuy/constants/params"
import { groupBuyService } from "@/features/groupBuy/services/groupBuyService"
import type {
  DetailNavParams,
  GroupBuyListParams,
} from "@/features/groupBuy/types"
import { useQuery } from "@tanstack/react-query"

export function useGetGroupBuyList(params: GroupBuyListParams) {
  return useQuery({
    queryKey: [GROUP_BUY_QUERY_KEYS.LIST, params],
    queryFn: () => groupBuyService.getList(params),
  })
}

/**
 * 탭 카운트 + GNB 배지. 셸(MainLayout)과 목록이 같은 키를 쓰므로 요청은 한 번만 나간다.
 * 브랜드(SELLER) 전용 API라 크리에이터 계정에서는 호출하지 않는다.
 */
export function useGetGroupBuySummary(enabled: boolean) {
  return useQuery({
    queryKey: [GROUP_BUY_QUERY_KEYS.SUMMARY],
    queryFn: groupBuyService.getSummary,
    enabled,
    refetchInterval: GROUP_BUY_SUMMARY_POLL_INTERVAL,
    staleTime: 10_000,
  })
}

/**
 * 상세 — 목록에서 들고 온 조건(탭·검색어·정렬)을 함께 보내면 서버가 그 범위의
 * 이전/다음 공구 ID(`navigation`)를 계산해 내려준다(시안 `.navgrp` [‹ 이전] [다음 ›]).
 */
export function useGetGroupBuyDetail(
  groupBuyId: number,
  params: DetailNavParams
) {
  return useQuery({
    queryKey: [GROUP_BUY_QUERY_KEYS.DETAIL, groupBuyId, params],
    queryFn: () => groupBuyService.getDetail(groupBuyId, params),
    enabled: Number.isFinite(groupBuyId) && groupBuyId > 0,
    // 403·404는 "찾을 수 없음" 화면으로 끝낸다 — 재시도해도 결과가 같다
    retry: false,
  })
}
