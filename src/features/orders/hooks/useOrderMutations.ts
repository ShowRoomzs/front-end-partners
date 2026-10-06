import { ORDER_QUERY_KEYS } from "@/features/orders/constants/params"
import { orderService } from "@/features/orders/services/orderService"
import type {
  DeliveryCarrier,
  DirectCancelBody,
  OrderDetailResponse,
  PurchaseOrderBody,
  ShipmentRow,
} from "@/features/orders/types"
import { useMutation, useQueryClient } from "@tanstack/react-query"

/**
 * 주문 쓰기 — 낙관적 업데이트를 쓰지 않는다. 처리 후 목록·요약(탭 카운트·요약 바·GNB 배지)을
 * 다시 읽어 한 화면의 숫자가 함께 바뀌게 한다(§34-2 동시 갱신).
 */
function useInvalidateOrders() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: [ORDER_QUERY_KEYS.LIST] })
    queryClient.invalidateQueries({ queryKey: [ORDER_QUERY_KEYS.SUMMARY] })
    queryClient.invalidateQueries({ queryKey: [ORDER_QUERY_KEYS.DETAIL] })
  }
}

/** 상세를 돌려주는 API — 그 값으로 상세 캐시를 바꾸고 목록·요약만 다시 읽는다 */
function useApplyDetail() {
  const queryClient = useQueryClient()

  return (detail: OrderDetailResponse) => {
    queryClient.setQueryData(
      [ORDER_QUERY_KEYS.DETAIL, detail.deliveryGroupId],
      detail
    )
    queryClient.invalidateQueries({ queryKey: [ORDER_QUERY_KEYS.LIST] })
    queryClient.invalidateQueries({ queryKey: [ORDER_QUERY_KEYS.SUMMARY] })
  }
}

export function usePrepareStart() {
  const invalidate = useInvalidateOrders()

  return useMutation({
    mutationFn: (deliveryGroupIds: Array<number>) =>
      orderService.prepareStart(deliveryGroupIds),
    onSuccess: invalidate,
  })
}

export function useDownloadPurchaseOrder() {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateOrders()

  return useMutation({
    mutationFn: (body: PurchaseOrderBody) =>
      orderService.downloadPurchaseOrder(body),
    onSuccess: (_file, body) => {
      invalidate()
      if (body.saveAsDefault) {
        queryClient.invalidateQueries({
          queryKey: [ORDER_QUERY_KEYS.PURCHASE_ORDER_TEMPLATE],
        })
      }
    },
  })
}

export function useRegisterShipments() {
  const invalidate = useInvalidateOrders()

  return useMutation({
    mutationFn: (rows: Array<ShipmentRow>) =>
      orderService.registerShipments(rows),
    onSuccess: invalidate,
  })
}

export function useParseShipments() {
  return useMutation({
    mutationFn: (file: File) => orderService.parseShipments(file),
  })
}

export function useUpdateShipment() {
  const apply = useApplyDetail()

  return useMutation({
    mutationFn: (variables: {
      deliveryGroupId: number
      carrier: DeliveryCarrier
      trackingNumber: string
    }) =>
      orderService.updateShipment(variables.deliveryGroupId, {
        carrier: variables.carrier,
        trackingNumber: variables.trackingNumber,
      }),
    onSuccess: apply,
  })
}

export function useDirectCancel() {
  const invalidate = useInvalidateOrders()

  return useMutation({
    mutationFn: (body: DirectCancelBody) => orderService.directCancel(body),
    onSuccess: invalidate,
  })
}

export function useApproveCancelRequest() {
  const apply = useApplyDetail()

  return useMutation({
    mutationFn: (cancelRequestId: number) =>
      orderService.approveCancelRequest(cancelRequestId),
    onSuccess: apply,
  })
}

export function useRejectCancelRequest() {
  const apply = useApplyDetail()

  return useMutation({
    mutationFn: (variables: { cancelRequestId: number; reason: string }) =>
      orderService.rejectCancelRequest(
        variables.cancelRequestId,
        variables.reason
      ),
    onSuccess: apply,
  })
}
