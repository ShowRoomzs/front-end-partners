import { apiInstance } from "@/common/lib/apiInstance"
import type { PageResponse } from "@/common/types/page"
import { paramsToSearchParams } from "@/common/utils/paramsToSearchParams"
import type {
  ContractClausesResponse,
  ContractCreateRequest,
  ContractCreateResponse,
  ContractDetailResponse,
  ContractDocumentDownloadResponse,
  ContractDocumentType,
  ContractDuplicateResponse,
  ContractFormSourcesResponse,
  ContractListItem,
  ContractListParams,
  ContractResendRequestResponse,
  ContractReviewRequestRequest,
  ContractSummaryResponse,
  ContractUpdateRequest,
  ContractValidationResponse,
} from "@/features/contracts/types"

const BASE_URL = "/seller/contracts"

export const contractService = {
  getList: async (params: ContractListParams) => {
    const { data } = await apiInstance.get<PageResponse<ContractListItem>>(
      BASE_URL,
      { params: paramsToSearchParams(params) }
    )
    return data
  },

  /** 탭 카운트 + GNB 배지 — 목록과 분리된 경량 조회라 셸에서 폴링한다 */
  getSummary: async () => {
    const { data } = await apiInstance.get<ContractSummaryResponse>(
      `${BASE_URL}/summary`
    )
    return data
  },

  getFormSources: async () => {
    const { data } = await apiInstance.get<ContractFormSourcesResponse>(
      `${BASE_URL}/form-sources`
    )
    return data
  },

  getClauses: async () => {
    const { data } = await apiInstance.get<ContractClausesResponse>(
      `${BASE_URL}/clauses`
    )
    return data
  },

  getDetail: async (contractId: number) => {
    const { data } = await apiInstance.get<ContractDetailResponse>(
      `${BASE_URL}/${contractId}`
    )
    return data
  },

  getDocument: async (contractId: number, type: ContractDocumentType) => {
    const { data } = await apiInstance.get<ContractDocumentDownloadResponse>(
      `${BASE_URL}/${contractId}/documents/${type}`,
      // 체결 문서가 아직 업로드 전이면 404가 정상이다 — 토스트로 알릴 일이 아니다
      { suppressErrorToast: true }
    )
    return data
  },

  /** 빈 초안 생성(B1) — 조건은 임시저장(PUT)으로 채운다 */
  create: async (body: ContractCreateRequest) => {
    const { data } = await apiInstance.post<ContractCreateResponse>(
      BASE_URL,
      body
    )
    return data
  },

  /** 임시저장 — 전체 교체. 409 CONTRACT_MODIFIED_ELSEWHERE는 호출부가 직접 처리한다 */
  update: async (contractId: number, body: ContractUpdateRequest) => {
    const { data } = await apiInstance.put<ContractDetailResponse>(
      `${BASE_URL}/${contractId}`,
      body,
      { suppressErrorToast: true }
    )
    return data
  },

  delete: async (contractId: number) => {
    await apiInstance.delete(`${BASE_URL}/${contractId}`)
  },

  /** 상태를 바꾸지 않는 검증 — C3 모달의 경고 열거·재작성 직후 위반 표시에 쓴다 */
  validate: async (contractId: number) => {
    const { data } = await apiInstance.post<ContractValidationResponse>(
      `${BASE_URL}/${contractId}/validate`
    )
    return data
  },

  /** 검토 요청 — 400(hardViolations)·409(WARNING_MISMATCH)는 호출부가 직접 처리한다 */
  requestReview: async (
    contractId: number,
    body: ContractReviewRequestRequest
  ) => {
    const { data } = await apiInstance.post<ContractDetailResponse>(
      `${BASE_URL}/${contractId}/review-request`,
      body,
      { suppressErrorToast: true }
    )
    return data
  },

  cancelReviewRequest: async (contractId: number) => {
    const { data } = await apiInstance.post<ContractDetailResponse>(
      `${BASE_URL}/${contractId}/review-request/cancel`
    )
    return data
  },

  requestResend: async (contractId: number) => {
    const { data } = await apiInstance.post<ContractResendRequestResponse>(
      `${BASE_URL}/${contractId}/resend-request`
    )
    return data
  },

  recordFixedFeePayment: async (contractId: number) => {
    const { data } = await apiInstance.post<ContractDetailResponse>(
      `${BASE_URL}/${contractId}/fixed-fee/payment`
    )
    return data
  },

  /** 이 조건으로 새 계약 작성 — 새 초안이 만들어지고 원 계약은 그대로 남는다 */
  duplicate: async (contractId: number) => {
    const { data } = await apiInstance.post<ContractDuplicateResponse>(
      `${BASE_URL}/${contractId}/duplicate`
    )
    return data
  },
}
