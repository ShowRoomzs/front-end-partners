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

/**
 * 배송·반품 정책(`GET /v1/seller/basic-info/delivery-policy`). 반품비·교환비는 따로 없다 —
 * 반품 배송비 차감과 교환 재발송비는 기본 배송비 기준이다. 반품 수취 주소는 담당자·CS 탭.
 */
export interface DeliveryPolicyResponse {
  /** 발송 기한 N — 공구 마감 후 N영업일(주말·공휴일 제외 · 1~7) */
  shippingLeadDays: number
  /** 소비자 상품 상세에 자동 표시되는 문구 — 「공구 마감 후 3영업일 이내 발송 (주말·공휴일 제외)」 */
  shipDueText: string
  /** 미입력 계정은 null일 수 있다(`Market` 컬럼이 nullable) */
  defaultDeliveryFee: number | null
  /** 없으면 null = 무료배송 없음 */
  freeShippingThreshold: number | null
  remoteAreaSurcharge: number | null
}

/** 네 값을 한 번에 저장 — 이후 접수되는 주문에만 적용(이미 접수된 주문은 주문 시점 값) */
export interface UpdateDeliveryPolicyRequest {
  /** 1~7 */
  shippingLeadDays: number
  defaultDeliveryFee: number
  /** 비우면(null) 무료배송 없음 — 0을 보내면 모든 주문이 무료배송이 된다 */
  freeShippingThreshold: number | null
  /** 비우면(null) 0 */
  remoteAreaSurcharge: number | null
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

  getDeliveryPolicy: async () => {
    const { data } = await apiInstance.get<DeliveryPolicyResponse>(
      "/seller/basic-info/delivery-policy"
    )
    return data
  },

  /**
   * 검증 실패는 400 `INVALID_INPUT` + 필드 문구(「발송 기한은 1~7영업일로 입력해 주세요.」 등) — 화면이 같은 규칙을
   * 먼저 막고, 그래도 오면 인터셉터가 서버 문구를 토스트로 띄운다.
   */
  updateDeliveryPolicy: async (request: UpdateDeliveryPolicyRequest) => {
    await apiInstance.put("/seller/basic-info/delivery-policy", request)
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
