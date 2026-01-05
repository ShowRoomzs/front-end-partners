// product : 상품 이미지

import { apiInstance } from "@/common/lib/apiInstance"

// market : 마켓 이미지
export type FileType = "PRODUCT" | "MARKET"

export const fileService = {
  upload: async (file: File, type: FileType) => {
    const formData = new FormData()
    formData.append("file", file)
    const { data } = await apiInstance.post("/admin/images", formData, {
      params: { type },
    })
    return data
  },
}
