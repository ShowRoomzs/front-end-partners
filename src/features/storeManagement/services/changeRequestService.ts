import { apiInstance } from "@/common/lib/apiInstance"

export type ChangeRequestType = "BUSINESS_INFO" | "SETTLEMENT_ACCOUNT"

export type ChangeRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELED"

/**
 * 변경 요청 가능 항목 — 서버 enum과 1:1. 사업자등록번호처럼 변경 불가한 값은
 * 이 목록에 아예 없다(어떤 경로로도 요청할 수 없음, §15-6).
 */
export type ChangeRequestField =
  | "MARKET_NAME"
  | "REPRESENTATIVE_NAME"
  | "COMPANY_NAME"
  | "BUSINESS_CONDITION"
  | "BUSINESS_ADDRESS"
  | "MAIL_ORDER_REG_NUMBER"
  | "BANK_CODE"
  | "ACCOUNT_NUMBER"
  | "ACCOUNT_HOLDER"

export interface ChangeRequestFieldOption {
  fieldKey: ChangeRequestField
  label: string
  currentValue: string
}

export interface ChangeRequestBannerResponse {
  requestId: number
  requestCode: string
  type: ChangeRequestType
  status: ChangeRequestStatus
  changedFieldLabels: Array<string>
  requestedAt: string
  processedAt: string | null
  /** true면 PENDING — 배너에 "요청 취소" 버튼을 노출한다 */
  cancelable: boolean
  /** 정형 반려 사유. REJECTED가 아니면 null. 가공 없이 그대로 표시한다 */
  rejectReason: string | null
  /** 상세 반려 사유. 미입력이면 null — 행 자체를 렌더링하지 않는다(§15-8) */
  rejectReasonDetail: string | null
  requestedAccount: {
    bankName: string
    maskedAccountNumber: string
  } | null
}

export interface ChangeRequestItemRequest {
  fieldKey: ChangeRequestField
  requestedValue: string
}

export interface CreateChangeRequestRequest {
  type: ChangeRequestType
  items: Array<ChangeRequestItemRequest>
  reason?: string
  evidenceFileUrl: string
  evidenceFileName: string
  evidenceFileSize: number
}

export interface ChangeRequestCreateResponse {
  requestId: number
  requestCode: string
  type: ChangeRequestType
  status: ChangeRequestStatus
  requestedAt: string
  /** 결과 안내를 받을 이메일 — 로그인 이메일이며 tax 확인용 이메일이 아니다 */
  notifyEmail: string
}

export const changeRequestService = {
  create: async (request: CreateChangeRequestRequest) => {
    const { data } = await apiInstance.post<ChangeRequestCreateResponse>(
      "/seller/change-requests",
      request
    )
    return data
  },

  /** M1 모달 전용 — 항목·라벨·현재값의 SoT는 서버다, 프론트에서 하드코딩하지 않는다 */
  getFields: async (type: ChangeRequestType) => {
    const { data } = await apiInstance.get<Array<ChangeRequestFieldOption>>(
      "/seller/change-requests/fields",
      { params: { type } }
    )
    return data
  },

  cancel: async (requestId: number) => {
    await apiInstance.post(`/seller/change-requests/${requestId}/cancel`)
  },

  acknowledge: async (requestId: number) => {
    await apiInstance.post(`/seller/change-requests/${requestId}/acknowledge`)
  },
}
