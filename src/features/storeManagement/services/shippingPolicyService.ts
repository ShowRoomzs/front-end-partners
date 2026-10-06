import {
  ApiNotReadyError,
  DEV_MOCK_ENABLED,
  mockDelay,
} from "@/common/utils/devMock"

/**
 * 배송·반품 정책(ui-partner-06 5-A) — 브랜드가 직접 고치는 값(운영자 검토 없음).
 *
 * ⚠️ 백엔드에 조회·수정 API가 없다. 온보딩(`complete-registration`)이 같은 값(`Market`의
 * defaultDeliveryFee · freeShippingThreshold · remoteAreaSurcharge · shippingLeadDays · returnFee ·
 * exchangeFee)을 저장하지만 기본정보 관리에서 읽고 쓰는 경로가 없고, 제주 추가비는 컬럼 자체가 없다.
 * 필드명은 온보딩 요청에 맞춰 두었다 — API가 생기면 아래 두 함수만 바꾼다.
 */
export interface ShippingPolicy {
  defaultDeliveryFee: number
  /** 0이면 무료배송을 적용하지 않는다 */
  freeShippingThreshold: number
  /** 제주 추가비 — 도서산간과 겹치면 제주가 우선한다 */
  jejuSurcharge: number
  remoteAreaSurcharge: number
  /** 발송 기한 = 공구 마감 + N영업일(1~7) — 서버 필드명은 아직 `shippingLeadDays` */
  shippingLeadDays: number
  returnFee: number
  exchangeFee: number
}

let mockPolicy: ShippingPolicy = {
  defaultDeliveryFee: 3000,
  freeShippingThreshold: 0,
  jejuSurcharge: 0,
  remoteAreaSurcharge: 0,
  shippingLeadDays: 3,
  returnFee: 3000,
  exchangeFee: 6000,
}

export const SHIPPING_POLICY_API_READY = false

export const shippingPolicyService = {
  get: async (): Promise<ShippingPolicy> => {
    if (!DEV_MOCK_ENABLED) throw new ApiNotReadyError("배송·반품 정책")
    return mockDelay(mockPolicy)
  },

  update: async (policy: ShippingPolicy): Promise<void> => {
    if (!DEV_MOCK_ENABLED) throw new ApiNotReadyError("배송·반품 정책")
    mockPolicy = { ...policy }
    await mockDelay(null)
  },
}
