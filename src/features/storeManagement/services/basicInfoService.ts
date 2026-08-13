import { apiInstance } from "@/common/lib/apiInstance"
import type { ChangeRequestBannerResponse } from "@/features/storeManagement/services/changeRequestService"

export type MarketStatus = "ACTIVE" | "SUSPENDED" | "WITHDRAWN" | string

export interface ReviewDocumentItem {
  documentType: string
  label: string
  fileUrl: string
  extension: string
}

export interface BusinessInfoResponse {
  brandName: string
  brandStatus: MarketStatus
  businessType: string
  marketName: string
  representativeName: string
  companyName: string
  businessRegistrationNumber: string
  businessCondition: string
  /** 사업장 주소 + 상세주소가 이미 결합된 단일 문자열 — 프론트에서 다시 분리하지 않는다 */
  businessAddress: string
  mailOrderRegNumber: string
  taxEmail: string
  brandSiteUrl: string
  reviewDocuments: Array<ReviewDocumentItem>
  /** 진행 중인 변경 요청이 없거나, 있어도 이미 확인(acknowledge)한 건이면 null */
  changeRequest: ChangeRequestBannerResponse | null
}

export interface UpdateBusinessInfoRequest {
  taxEmail: string
  brandSiteUrl: string
}

export interface SettlementInfoResponse {
  bankName: string
  /** 뒤 6자리만 노출된 값 — 마스킹은 서버가 이미 처리해서 내려준다 */
  maskedAccountNumber: string
  accountHolder: string
  changeRequest: ChangeRequestBannerResponse | null
}

export interface ReturnAddress {
  recipientName: string
  recipientContact: string
  address: string
  detailAddress: string
}

export interface ManagerInfoResponse {
  managerName: string
  managerContact: string
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
