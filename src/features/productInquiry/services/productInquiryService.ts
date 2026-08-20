import { apiInstance } from "@/common/lib/apiInstance"
import { paramsToSearchParams } from "@/common/utils/paramsToSearchParams"
import type {
  InquiryAnswerRequest,
  InquiryDeleteRequestBody,
  ProductInquiryDetail,
  ProductInquiryDetailParams,
  ProductInquiryListParams,
  ProductInquiryListResponse,
} from "@/features/productInquiry/types"

const BASE_URL = "/seller/inquiries"

/*
  `types`·`visibilities`가 배열이라 axios 기본 직렬화(`types[]=A`)를 쓰면 안 된다 —
  서버는 `@ModelAttribute List<...>`로 받아 `types=A&types=B` 형태만 바인딩된다.
  `paramsToSearchParams`가 같은 키를 반복 append 해 주므로 그걸 그대로 넘긴다.
*/
function toQuery(params: object) {
  return paramsToSearchParams(params)
}

export const productInquiryService = {
  getInquiryList: async (params: ProductInquiryListParams) => {
    const { data } = await apiInstance.get<ProductInquiryListResponse>(
      BASE_URL,
      { params: toQuery(params) }
    )
    return data
  },

  /** 목록 조건을 함께 넘긴다 — 서버가 그 범위로 이전/다음 ID를 계산한다 */
  getInquiryDetail: async (
    inquiryId: number,
    params: ProductInquiryDetailParams
  ) => {
    const { data } = await apiInstance.get<ProductInquiryDetail>(
      `${BASE_URL}/${inquiryId}`,
      { params: toQuery(params) }
    )
    return data
  },

  registerAnswer: async (inquiryId: number, body: InquiryAnswerRequest) => {
    await apiInstance.post(`${BASE_URL}/${inquiryId}/answer`, body)
  },

  modifyAnswer: async (inquiryId: number, body: InquiryAnswerRequest) => {
    await apiInstance.patch(`${BASE_URL}/${inquiryId}/answer`, body)
  },

  requestDelete: async (inquiryId: number, body: InquiryDeleteRequestBody) => {
    await apiInstance.post(`${BASE_URL}/${inquiryId}/delete-request`, body)
  },
}
