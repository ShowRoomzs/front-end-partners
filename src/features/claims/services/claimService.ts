import { apiInstance } from "@/common/lib/apiInstance"
import type { PageResponse } from "@/common/types/page"
import { paramsToSearchParams } from "@/common/utils/paramsToSearchParams"
import type {
  ClaimBatchResponse,
  ClaimDetailResponse,
  ClaimListItem,
  ClaimListParams,
  ClaimRejectBody,
  ClaimSummaryResponse,
  ReshipExportBody,
  ReshipItem,
  ReshipParseResponse,
  ReshipTemplateResponse,
} from "@/features/claims/types"

const BASE_URL = "/seller/claims"

/** `period`는 화면 상태다 — 서버에는 from·to만 보낸다. 전체 선택(유형 2종)은 생략과 같다 */
function toListSearchParams(params: ClaimListParams) {
  const { types, reason, ...rest } = params
  return paramsToSearchParams({
    ...rest,
    period: null,
    types: types.length === 2 ? [] : types,
    reason: reason || null,
  })
}

/** 서버가 `filename*=UTF-8''…`로 내려준 파일명을 읽는다 */
function filenameFrom(disposition: string | undefined, fallback: string) {
  const match = disposition?.match(/filename\*=UTF-8''([^;]+)/i)
  return match ? decodeURIComponent(match[1]) : fallback
}

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export const claimService = {
  getList: async (params: ClaimListParams) => {
    const { data } = await apiInstance.get<PageResponse<ClaimListItem>>(
      BASE_URL,
      { params: toListSearchParams(params) }
    )
    return data
  },

  /** KPI 4칸 · 탭 카운트 · 유형 카운트 — 검색 조건과 무관한 전체 기준 */
  getSummary: async () => {
    const { data } = await apiInstance.get<ClaimSummaryResponse>(
      `${BASE_URL}/summary`
    )
    return data
  },

  getDetail: async (claimId: number) => {
    const { data } = await apiInstance.get<ClaimDetailResponse>(
      `${BASE_URL}/${claimId}`
    )
    return data
  },

  receive: async (claimIds: Array<number>) => {
    const { data } = await apiInstance.post<ClaimBatchResponse>(
      `${BASE_URL}/receive`,
      { claimIds }
    )
    return data
  },

  pass: async (claimId: number) => {
    const { data } = await apiInstance.post<ClaimDetailResponse>(
      `${BASE_URL}/${claimId}/inspection/pass`
    )
    return data
  },

  reject: async (claimId: number, body: ClaimRejectBody) => {
    const { data } = await apiInstance.post<ClaimDetailResponse>(
      `${BASE_URL}/${claimId}/inspection/reject`,
      body
    )
    return data
  },

  registerReshipments: async (items: Array<ReshipItem>) => {
    const { data } = await apiInstance.post<ClaimBatchResponse>(
      `${BASE_URL}/reshipments`,
      { items }
    )
    return data
  },

  updateReshipment: async (
    claimId: number,
    item: Omit<ReshipItem, "claimId">
  ) => {
    const { data } = await apiInstance.patch<ClaimDetailResponse>(
      `${BASE_URL}/${claimId}/reshipment`,
      item
    )
    return data
  },

  getReshipTemplate: async () => {
    const { data } = await apiInstance.get<ReshipTemplateResponse>(
      `${BASE_URL}/reshipments/export/template`
    )
    return data
  },

  /** 재발송 목록 엑셀 — 선택 컬럼 뒤에 빈 「택배사」「송장번호」 2열이 붙는다 */
  exportReshipments: async (body: ReshipExportBody) => {
    const response = await apiInstance.post<Blob>(
      `${BASE_URL}/reshipments/export`,
      body,
      { responseType: "blob" }
    )
    saveBlob(
      response.data,
      filenameFrom(
        response.headers["content-disposition"] as string | undefined,
        "재발송_목록.xlsx"
      )
    )
  },

  /** 업로드 검증 — 상태를 바꾸지 않는다. 확정은 registerReshipments 하나다 */
  parseReshipments: async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)
    const { data } = await apiInstance.post<ReshipParseResponse>(
      `${BASE_URL}/reshipments/parse`,
      formData
    )
    return data
  },
}
