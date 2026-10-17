// product : 상품 이미지

import { apiInstance } from "@/common/lib/apiInstance"

// market : 마켓 이미지
// CHANGE_REQUEST_DOCUMENT : 기본정보 변경 요청 증빙(§15-6, 백엔드 ImageType에 이미 정의됨)
// CLAIM : 반품·교환 검수 반려 증빙(§35) — 정사각형 제한이 없다(MARKET은 1:1만 받는다)
export type FileType =
  | "PRODUCT"
  | "MARKET"
  | "CHANGE_REQUEST_DOCUMENT"
  | "CLAIM"

export const fileService = {
  upload: async (
    file: File,
    type: FileType,
    options?: { timeoutMs?: number; suppressErrorToast?: boolean }
  ) => {
    const formData = new FormData()
    formData.append("file", file)
    const { data } = await apiInstance.post("/seller/images", formData, {
      params: { type },
      timeout: options?.timeoutMs,
      suppressErrorToast: options?.suppressErrorToast,
    })
    return data
  },
}
