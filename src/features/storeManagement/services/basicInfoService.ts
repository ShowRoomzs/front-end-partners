import { apiInstance } from "@/common/lib/apiInstance"
import type { ChangeRequestBannerResponse } from "@/features/storeManagement/services/changeRequestService"

export type MarketStatus = "ACTIVE" | "SUSPENDED" | "WITHDRAWN" | string

export interface ReviewDocumentItem {
  documentType: string
  label: string
  fileUrl: string
  extension: string
}

/**
 * ⚠️ `string | null`인 필드는 백엔드 엔티티에서 DB 컬럼이 nullable인 값들이다
 * (`Seller`의 사업자 정보 전 항목, `Market.brandSiteUrl`).
 * 가입 심사 도중이거나 반려 시 파기(`purgePersonalDataOnRejection`)된 계정은
 * 실제로 null이 내려온다. 타입을 `string`으로 좁히면 그 null이 그대로 상태에 들어가
 * `.trim()`·`.length`에서 런타임 크래시가 난다 — 화면 진입 시 즉시 터졌던 원인이다.
 * null 가능 여부를 여기서 정확히 선언해 두고, 각 화면은 상태 초기화 시점에 `?? ""`로
 * 한 번만 정규화한다.
 */
export interface BusinessInfoResponse {
  brandName: string
  brandStatus: MarketStatus
  businessType: string | null
  marketName: string
  representativeName: string | null
  companyName: string | null
  businessRegistrationNumber: string | null
  businessCondition: string | null
  /** 사업장 주소 + 상세주소가 이미 결합된 단일 문자열 — 프론트에서 다시 분리하지 않는다 */
  businessAddress: string | null
  mailOrderRegNumber: string | null
  taxEmail: string | null
  /** 서버가 빈 값을 null로 저장한다(`normalizeBlank`) — 미입력 계정은 항상 null */
  brandSiteUrl: string | null
  reviewDocuments: Array<ReviewDocumentItem>
  /** 진행 중인 변경 요청이 없거나, 있어도 이미 확인(acknowledge)한 건이면 null */
  changeRequest: ChangeRequestBannerResponse | null
}

export interface UpdateBusinessInfoRequest {
  taxEmail: string
  brandSiteUrl: string
}

export interface SettlementInfoResponse {
  bankName: string | null
  /** 뒤 6자리만 노출된 값 — 마스킹은 서버가 이미 처리해서 내려준다. 계좌 미등록이면 null */
  maskedAccountNumber: string | null
  accountHolder: string | null
  changeRequest: ChangeRequestBannerResponse | null
}

/** 4필드 모두 승인 후 온보딩에서 채워지는 값 — 그 전에는 null이다(`Market`의 shipping_* 컬럼) */
export interface ReturnAddress {
  recipientName: string | null
  recipientContact: string | null
  address: string | null
  detailAddress: string | null
}

export interface ManagerInfoResponse {
  managerName: string
  /** `Seller.phoneNumber` — nullable */
  managerContact: string | null
  csNumber: string
  returnAddress: ReturnAddress
}

export interface UpdateManagerInfoRequest {
  managerName: string
  managerContact: string
  csNumber: string
  recipientName: string
  recipientContact: string
  address: string
  detailAddress: string
}

export interface AccountInfoResponse {
  loginEmail: string
  emailChangeable: boolean
  lastEmailChangedAt: string | null
  nextEmailChangeableAt: string | null
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  newPasswordConfirm: string
}

export interface ChangeEmailRequest {
  currentPassword: string
  newEmail: string
}

export const basicInfoService = {
  getBusinessInfo: async () => {
    const { data } = await apiInstance.get<BusinessInfoResponse>(
      "/seller/basic-info/business"
    )
    return data
  },

  updateBusinessInfo: async (request: UpdateBusinessInfoRequest) => {
    await apiInstance.patch("/seller/basic-info/business", request)
  },

  getSettlementInfo: async () => {
    const { data } = await apiInstance.get<SettlementInfoResponse>(
      "/seller/basic-info/settlement"
    )
    return data
  },

  getManagerInfo: async () => {
    const { data } = await apiInstance.get<ManagerInfoResponse>(
      "/seller/basic-info/manager"
    )
    return data
  },

  updateManagerInfo: async (request: UpdateManagerInfoRequest) => {
    await apiInstance.put("/seller/basic-info/manager", request)
  },

  getAccountInfo: async () => {
    const { data } = await apiInstance.get<AccountInfoResponse>(
      "/seller/basic-info/account"
    )
    return data
  },

  changePassword: async (request: ChangePasswordRequest) => {
    await apiInstance.patch("/seller/basic-info/account/password", request)
  },

  changeEmail: async (request: ChangeEmailRequest) => {
    const { data } = await apiInstance.patch<AccountInfoResponse>(
      "/seller/basic-info/account/email",
      request
    )
    return data
  },
}
