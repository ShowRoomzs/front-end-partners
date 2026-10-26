import { apiInstance } from "@/common/lib/apiInstance"
import type { PageResponse } from "@/common/types/page"
import { callOrMock, mockScenario } from "@/common/utils/devMock"
import { sanctionMockKind } from "@/features/contracts/constants/suspension"
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
  ContractTerminationRequestBody,
  ContractUpdateRequest,
  ContractValidationResponse,
} from "@/features/contracts/types"

const BASE_URL = "/seller/contracts"

/*
  해지 요청 · 철회(기-05)는 main에만 있고 개발 서버엔 아직 없다 → `callOrMock`.
  배포본: 실호출 · 404/405면 ApiNotReadyError. 단 버튼 자체가 상세 `permissions.canRequestTermination`
  (main 필드)으로만 그려지므로 배포 전 배포본에는 누를 곳이 없다.

  개발 서버 상세 목업 — 주소에 `?mock=<값>`(로컬은 로그인이 막혀 상세 실호출이 안 된다):
    contract-signing             B4  서명 진행중 · 서명 기한(공구 시작 3일 전 · 운영자 확인)
    contract-conclusion-pending  B4b 공구 생성 대기(서버 옛 라벨 「체결 처리 대기」를 덮어쓰는지)
    contract-concluded           B5  체결완료 · [해지 요청] · 초안 승인 기록 빈 상태
    contract-termination-pending B5  해지 요청 처리 대기 · [요청 철회]
    contract-paid                B5a 지급 완료 기록 · 초안 승인 기록 2건
    contract-fee-due             B5b 지급 예정 · 초안 승인 기록 2건
    contract-terminated          B9  해지(종결)

  계정 이용 정지(시안 15) — 목록 · 상세 실응답에 서버(배포 전)가 아직 안 주는 sanctionHold를 채운다
  (`contractSanction.mock.ts`). 상세 실호출이 실패하면 서명 진행중 목업으로 대신한다.
    suspended · suspended-payout · suspended-open   S4 · S4a · S4b  내 정지(경고 배지 · 작성 차단)
    counterparty-suspended                          R1  상대 인플루언서 정지(중립 배지)
*/
const DETAIL_MOCK_PREFIX = "contract-"

export const contractService = {
  getList: async (params: ContractListParams) => {
    const { data } = await apiInstance.get<PageResponse<ContractListItem>>(
      BASE_URL,
      { params: paramsToSearchParams(params) }
    )
    const counterparty = sanctionMockKind(mockScenario())
    if (counterparty !== null) {
      const m = await import("./contractSanction.mock")
      return m.withListHolds(data, counterparty)
    }
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
    const scenario = mockScenario()
    const counterparty = sanctionMockKind(scenario)
    if (counterparty !== null) {
      const m = await import("./contractSanction.mock")
      const detail = await m.detailOrSigningMock(async () => {
        const { data } = await apiInstance.get<ContractDetailResponse>(
          `${BASE_URL}/${contractId}`,
          { suppressErrorToast: true }
        )
        return data
      }, contractId)
      return m.withDetailHold(detail, counterparty)
    }
    if (scenario?.startsWith(DETAIL_MOCK_PREFIX)) {
      const mock =
        await import("@/features/contracts/services/contractDetail.mock")
      return mock.mockContractDetail(contractId, scenario)
    }
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

  /** [해지 요청](C9) — 계약 상태는 그대로(체결완료)고 처리 대기 요청이 생긴다 */
  requestTermination: (
    contractId: number,
    body: ContractTerminationRequestBody,
    current?: ContractDetailResponse
  ) =>
    callOrMock(
      "계약 해지 요청",
      async () => {
        const { data } = await apiInstance.post<ContractDetailResponse>(
          `${BASE_URL}/${contractId}/termination-request`,
          body,
          { suppressErrorToast: true }
        )
        return data
      },
      async () => {
        const mock =
          await import("@/features/contracts/services/contractDetail.mock")
        return mock.mockRequestTermination(contractId, body, current)
      }
    ),

  /** 해지 요청 철회 — 처리 전(PENDING)만 */
  withdrawTermination: (contractId: number, current?: ContractDetailResponse) =>
    callOrMock(
      "계약 해지 요청 철회",
      async () => {
        const { data } = await apiInstance.delete<ContractDetailResponse>(
          `${BASE_URL}/${contractId}/termination-request`,
          { suppressErrorToast: true }
        )
        return data
      },
      async () => {
        const mock =
          await import("@/features/contracts/services/contractDetail.mock")
        return mock.mockWithdrawTermination(contractId, current)
      }
    ),

  /** 이 조건으로 새 계약 작성 — 새 초안이 만들어지고 원 계약은 그대로 남는다 */
  duplicate: async (contractId: number) => {
    const { data } = await apiInstance.post<ContractDuplicateResponse>(
      `${BASE_URL}/${contractId}/duplicate`
    )
    return data
  },
}
