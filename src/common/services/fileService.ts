// product : 상품 이미지

import { apiInstance } from "@/common/lib/apiInstance"

// market : 마켓 이미지
// CHANGE_REQUEST_DOCUMENT : 기본정보 변경 요청 증빙(§15-6, 백엔드 ImageType에 이미 정의됨)
export type FileType = "PRODUCT" | "MARKET" | "CHANGE_REQUEST_DOCUMENT"

export const fileService = {
  upload: async (file: File, type: FileType) => {
    const formData = new FormData()
    formData.append("file", file)
    const { data } = await apiInstance.post("/seller/images", formData, {
      params: { type },
    })
    return data
  },
}
