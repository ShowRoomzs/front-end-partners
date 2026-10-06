import { apiInstance } from "@/common/lib/apiInstance"
import type { PageResponse } from "@/common/types/page"
import { paramsToSearchParams } from "@/common/utils/paramsToSearchParams"
import type {
  BatchActionResponse,
  ClaimSummaryResponse,
  DeliveryCarrier,
  DirectCancelBody,
  OrderDetailResponse,
  OrderListItem,
  OrderQueryParams,
  OrderSummaryResponse,
  PurchaseOrderBody,
  PurchaseOrderColumn,
  PurchaseOrderTemplate,
  ShipmentParseResponse,
  ShipmentRow,
} from "@/features/orders/types"
import { isAxiosError, type AxiosResponse } from "axios"
import toast from "react-hot-toast"

const BASE_URL = "/seller/orders"

export interface DownloadedFile {
  blob: Blob
  filename: string
}

/** `Content-Disposition: attachment; filename*=UTF-8''...` → 파일명 */
function filenameOf(response: AxiosResponse<Blob>, fallback: string) {
  const header = String(response.headers["content-disposition"] ?? "")
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(header)?.[1]
  if (encoded) {
    return decodeURIComponent(encoded)
  }
  const plain = /filename="?([^";]+)"?/i.exec(header)?.[1]
  return plain ?? fallback
}

/**
 * 파일 응답(`responseType: blob`)은 실패해도 본문이 Blob이라 공용 인터셉터가 메시지를 못 읽고
 * 「요청을 처리하지 못했습니다」만 띄운다. 토스트를 끄고 여기서 JSON을 풀어 서버 문구를 그대로 띄운다.
 */
async function toastBlobError(error: unknown) {
  let message =
    "요청을 처리하지 못했습니다. 네트워크 상태를 확인한 뒤 다시 시도해 주세요."
  if (isAxiosError(error) && error.response?.data instanceof Blob) {
    try {
      const body = JSON.parse(await error.response.data.text())
      if (typeof body?.message === "string") {
        message = body.message
      }
    } catch {
      // JSON이 아니면 기본 문구를 쓴다
    }
  }
  toast.error(message)
}

async function downloadFile(
  request: () => Promise<AxiosResponse<Blob>>,
  fallbackName: string
): Promise<DownloadedFile> {
  try {
    const response = await request()
    return { blob: response.data, filename: filenameOf(response, fallbackName) }
  } catch (error) {
    await toastBlobError(error)
    throw error
  }
}

export const orderService = {
  getList: async (params: OrderQueryParams) => {
    const { data } = await apiInstance.get<PageResponse<OrderListItem>>(
      BASE_URL,
      { params: paramsToSearchParams(params) }
    )
    return data
  },

  /** 요약 바 5칸 + 탭 카운트 9종 — 한 응답이라 동시에 갱신된다 */
  getSummary: async () => {
    const { data } = await apiInstance.get<OrderSummaryResponse>(
      `${BASE_URL}/summary`
    )
    return data
  },

  getDetail: async (deliveryGroupId: number) => {
    const { data } = await apiInstance.get<OrderDetailResponse>(
      `${BASE_URL}/${deliveryGroupId}`
    )
    return data
  },

  prepareStart: async (deliveryGroupIds: Array<number>) => {
    const { data } = await apiInstance.post<BatchActionResponse>(
      `${BASE_URL}/prepare-start`,
      { deliveryGroupIds }
    )
    return data
  },

  getPurchaseOrderTemplate: async () => {
    const { data } = await apiInstance.get<PurchaseOrderTemplate>(
      `${BASE_URL}/purchase-order/template`
    )
    return data
  },

  updatePurchaseOrderTemplate: async (columns: Array<PurchaseOrderColumn>) => {
    const { data } = await apiInstance.put<PurchaseOrderTemplate>(
      `${BASE_URL}/purchase-order/template`,
      { columns }
    )
    return data
  },

  /** 발주서 xlsx — 내려받는 순간 대상 신규 주문은 상품준비중으로 넘어간다(서버가 같은 트랜잭션에서 처리) */
  downloadPurchaseOrder: (body: PurchaseOrderBody) =>
    downloadFile(
      () =>
        apiInstance.post<Blob>(`${BASE_URL}/purchase-order`, body, {
          responseType: "blob",
          suppressErrorToast: true,
        }),
      "발주서.xlsx"
    ),

  /** 송장 등록 확정 — 셀 입력과 엑셀 채우기가 공유하는 유일한 확정 지점 */
  registerShipments: async (rows: Array<ShipmentRow>) => {
    const { data } = await apiInstance.post<BatchActionResponse>(
      `${BASE_URL}/shipments`,
      { rows }
    )
    return data
  },

  /** 엑셀 검증 — 상태를 바꾸지 않는다. 결과로 목록 셀만 채운다 */
  parseShipments: async (file: File) => {
    const form = new FormData()
    form.append("file", file)
    const { data } = await apiInstance.post<ShipmentParseResponse>(
      `${BASE_URL}/shipments/parse`,
      form
    )
    return data
  },

  downloadShipmentTemplate: () =>
    downloadFile(
      () =>
        apiInstance.get<Blob>(`${BASE_URL}/shipments/template`, {
          responseType: "blob",
          suppressErrorToast: true,
        }),
      "송장_업로드_양식.xlsx"
    ),

  /** 송장 수정 — 배송중만. 형식·중복 실패는 호출부가 입력란 아래에 그린다 */
  updateShipment: async (
    deliveryGroupId: number,
    body: { carrier: DeliveryCarrier; trackingNumber: string }
  ) => {
    const { data } = await apiInstance.patch<OrderDetailResponse>(
      `${BASE_URL}/${deliveryGroupId}/shipment`,
      body,
      { suppressErrorToast: true }
    )
    return data
  },

  directCancel: async (body: DirectCancelBody) => {
    const { data } = await apiInstance.post<BatchActionResponse>(
      `${BASE_URL}/cancel`,
      body
    )
    return data
  },

  approveCancelRequest: async (cancelRequestId: number) => {
    const { data } = await apiInstance.post<OrderDetailResponse>(
      `${BASE_URL}/cancel-requests/${cancelRequestId}/approve`
    )
    return data
  },

  rejectCancelRequest: async (cancelRequestId: number, reason: string) => {
    const { data } = await apiInstance.post<OrderDetailResponse>(
      `${BASE_URL}/cancel-requests/${cancelRequestId}/reject`,
      { reason }
    )
    return data
  },

  /** 반품·교환 탭 건수 — 반품·교환 화면이 생기기 전까지 이 숫자만 쓴다 */
  getClaimSummary: async () => {
    const { data } = await apiInstance.get<ClaimSummaryResponse>(
      "/seller/claims/summary"
    )
    return data
  },
}

/** 받은 파일을 저장시킨다 — 같은 오리진의 blob URL이라 `download` 속성이 먹는다 */
export function saveFile(file: DownloadedFile) {
  const url = URL.createObjectURL(file.blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = file.filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  // 클릭 직후 바로 해제하면 일부 브라우저가 저장을 시작하기 전에 URL이 사라진다
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** 서버 에러 문구 — 인라인 오류로 그릴 때(토스트를 끈 요청) */
export function errorMessageOf(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message
    if (typeof message === "string" && message) {
      return message
    }
  }
  return fallback
}
