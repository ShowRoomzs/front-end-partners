import {
  ORDER_QUERY_KEYS,
  ORDER_SUMMARY_POLL_INTERVAL,
} from "@/features/orders/constants/params"
import { orderService } from "@/features/orders/services/orderService"
import type { OrderQueryParams } from "@/features/orders/types"
import { keepPreviousData, useQuery } from "@tanstack/react-query"

export function useGetOrderList(params: OrderQueryParams) {
  return useQuery({
    queryKey: [ORDER_QUERY_KEYS.LIST, params],
    queryFn: () => orderService.getList(params),
    // 페이지·정렬을 바꿀 때 표가 비었다 다시 차는 깜빡임을 없앤다
    placeholderData: keepPreviousData,
    // 기간 역전·1년 초과 같은 입력 오류는 다시 보내도 같다
    retry: false,
  })
}

/**
 * 요약 바 · 탭 카운트 · GNB 배지. 셸(MainLayout)과 목록이 같은 키를 쓰므로 요청은 한 번만 나간다.
 * 브랜드(SELLER) 전용 API라 크리에이터 계정에서는 호출하지 않는다.
 */
export function useGetOrderSummary(enabled: boolean) {
  return useQuery({
    queryKey: [ORDER_QUERY_KEYS.SUMMARY],
    queryFn: orderService.getSummary,
    enabled,
    refetchInterval: ORDER_SUMMARY_POLL_INTERVAL,
    staleTime: 10_000,
  })
}

export function useGetOrderDetail(deliveryGroupId: number | null) {
  return useQuery({
    queryKey: [ORDER_QUERY_KEYS.DETAIL, deliveryGroupId],
    queryFn: () => orderService.getDetail(deliveryGroupId as number),
    enabled: deliveryGroupId !== null,
    retry: false,
  })
}

export function useGetPurchaseOrderTemplate(enabled: boolean) {
  return useQuery({
    queryKey: [ORDER_QUERY_KEYS.PURCHASE_ORDER_TEMPLATE],
    queryFn: orderService.getPurchaseOrderTemplate,
    enabled,
  })
}

export function useGetClaimSummary(enabled: boolean) {
  return useQuery({
    queryKey: [ORDER_QUERY_KEYS.CLAIM_SUMMARY],
    queryFn: orderService.getClaimSummary,
    enabled,
    refetchInterval: ORDER_SUMMARY_POLL_INTERVAL,
    staleTime: 10_000,
  })
}
