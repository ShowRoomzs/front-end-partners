import { apiInstance } from "@/common/lib/apiInstance"
import type { PageResponse } from "@/common/types/page"
import {
  DEV_MOCK_ENABLED,
  callOrMock,
  mockScenario,
} from "@/common/utils/devMock"
import { paramsToSearchParams } from "@/common/utils/paramsToSearchParams"
import { sanctionMockKind } from "@/features/contracts/constants/suspension"
import type {
  AppealAttachmentPresignBody,
  AppealAttachmentPresignResponse,
  AppealSubmitBody,
  ContractTerminationRequest,
  DetailNavParams,
  EarlyCloseRequestBody,
  ExtensionRequestBody,
  GroupBuyDetailResponse,
  GroupBuyListItem,
  GroupBuyListParams,
  GroupBuySummaryResponse,
  SuspensionRequestBody,
  TerminationRequestBody,
} from "@/features/groupBuy/types"

const BASE_URL = "/seller/group-buys"

/*
  실행 API는 모두 갱신된 상세를 그대로 돌려준다 — 호출부가 상세 캐시를 그 값으로 바꾸고
  목록·요약만 다시 읽는다(요청 한 번에 화면이 바로 다음 상태로 넘어간다).

  1021 해지 요청(기-05)은 백엔드 main에 있으나 개발 서버에 아직 배포되지 않았다 — `callOrMock`으로 감싸
  배포되면 코드 수정 없이 실호출로 바뀐다. 개발 서버(`pnpm dev`)에서는 아래 `?mock=` 값으로 상세를
  목업으로 채워 시안 상태를 본다(`groupBuy.mock.ts` · 배포 번들에서 빠진다).
    gb-preparing        B1 준비중 · [해지 요청] 노출
    gb-ready            B3 준비완료 · [해지 요청] → C4 모달(목업 제출 → 해지 요청 처리 대기)
    gb-termination      B3 준비완료 · 해지 요청 처리 대기
    gb-terminated       해지(오픈 전 종결 · 계약 해지)
    gb-selling          B4 진행중 · [공구 중단 요청] → C2 모달
    gb-exposure         B4j 진행중 · 게시물 노출 중지(새 값 EXPOSURE_SUSPENDED)
    gb-exposure-legacy  B4j 진행중 · 게시물 노출 중지(옛 값 HIDDEN · 라벨 「숨김」)
    gb-notice           B4i 진행중 · 직권 중단 사전통지
    gb-ended            B5 종료 · 정산 대기
    gb-early            B5d 종료 · 조기 마감
    gb-admin-suspended  B7a 중단 · 운영자 직권

  계정 이용 정지(시안 15) — 목록 · 상세 실응답에 서버(배포 전)가 아직 안 주는 sanctionHold를 채운다
  (`groupBuySanction.mock.ts`). 상세 실호출이 실패하면 S3a · R2 목업으로 대신한다.
    suspended · suspended-payout · suspended-open   S3 · S3a  내 정지(오픈 전 경고 배지 · 연장 차단)
    counterparty-suspended                          R2  상대 인플루언서 정지(오픈 전 중립 배지 · 안내)
*/
export const groupBuyService = {
  getList: async (params: GroupBuyListParams) => {
    const { data } = await apiInstance.get<PageResponse<GroupBuyListItem>>(
      BASE_URL,
      { params: paramsToSearchParams(params) }
    )
    const counterparty = sanctionMockKind(mockScenario())
    if (counterparty !== null) {
      const m = await import("./groupBuySanction.mock")
      return m.withListHolds(data, counterparty)
    }
    return data
  },

  /** 탭 카운트 + GNB 배지 — 셸에서 폴링한다 */
  getSummary: async () => {
    const { data } = await apiInstance.get<GroupBuySummaryResponse>(
      `${BASE_URL}/summary`
    )
    return data
  },

  /** 목록 조건을 함께 넘긴다 — 서버가 그 범위로 이전/다음 공구 ID를 계산한다 */
  getDetail: async (groupBuyId: number, params: DetailNavParams) => {
    const counterparty = sanctionMockKind(mockScenario())
    if (counterparty !== null) {
      const m = await import("./groupBuySanction.mock")
      return m.detailWithHold(
        async () => {
          const { data } = await apiInstance.get<GroupBuyDetailResponse>(
            `${BASE_URL}/${groupBuyId}`,
            { params: paramsToSearchParams(params), suppressErrorToast: true }
          )
          return data
        },
        groupBuyId,
        counterparty
      )
    }
    if (DEV_MOCK_ENABLED && mockScenario()?.startsWith("gb-")) {
      const { mockDetail } = await import("./groupBuy.mock")
      return mockDetail(mockScenario()!, groupBuyId)
    }
    const { data } = await apiInstance.get<GroupBuyDetailResponse>(
      `${BASE_URL}/${groupBuyId}`,
      { params: paramsToSearchParams(params) }
    )
    return data
  },

  confirmStock: async (groupBuyId: number) => {
    const { data } = await apiInstance.post<GroupBuyDetailResponse>(
      `${BASE_URL}/${groupBuyId}/stock-confirmation`
    )
    return data
  },

  requestExtension: async (groupBuyId: number, body: ExtensionRequestBody) => {
    const { data } = await apiInstance.post<GroupBuyDetailResponse>(
      `${BASE_URL}/${groupBuyId}/extension-request`,
      body
    )
    return data
  },

  requestEarlyClose: async (
    groupBuyId: number,
    body: EarlyCloseRequestBody
  ) => {
    const { data } = await apiInstance.post<GroupBuyDetailResponse>(
      `${BASE_URL}/${groupBuyId}/early-close-request`,
      body
    )
    return data
  },

  requestSuspension: async (
    groupBuyId: number,
    body: SuspensionRequestBody
  ) => {
    const { data } = await apiInstance.post<GroupBuyDetailResponse>(
      `${BASE_URL}/${groupBuyId}/suspension-request`,
      body
    )
    return data
  },

  /** 소명 증빙 업로드 URL 발급 — 받은 uploadUrl로 파일을 직접 PUT한다 */
  presignAppealAttachment: async (
    groupBuyId: number,
    body: AppealAttachmentPresignBody
  ) => {
    const { data } = await apiInstance.post<AppealAttachmentPresignResponse>(
      `${BASE_URL}/${groupBuyId}/appeal/attachments`,
      body
    )
    return data
  },

  submitAppeal: async (groupBuyId: number, body: AppealSubmitBody) => {
    const { data } = await apiInstance.post<GroupBuyDetailResponse>(
      `${BASE_URL}/${groupBuyId}/appeal`,
      body
    )
    return data
  },

  /**
   * [해지 요청](09 C4 · 1021 기-05) — 공구가 아니라 원 계약에 건다(계약 관리 08 C9와 같은 API).
   * 응답은 계약 상세라 공구 상세를 돌려주지 않는다 — 호출부가 공구 상세를 다시 읽는다.
   * 409 `CONTRACT_TERMINATION_NOT_ALLOWED` · `…_ALREADY_PENDING`은 공용 인터셉터가 알린다.
   */
  requestTermination: (contractId: number, body: TerminationRequestBody) =>
    callOrMock(
      "공구 해지 요청",
      async () => {
        await apiInstance.post(
          `/seller/contracts/${contractId}/termination-request`,
          body
        )
      },
      async () => {
        const { requestTerminationMock } = await import("./groupBuy.mock")
        return requestTerminationMock(contractId, body)
      }
    ),

  /**
   * 원 계약의 해지 요청 — 공구 상세에는 해지 요청 블록이 없다(계약 상세 `terminationRequest`).
   * 아직 배포되지 않은 서버의 계약 상세에는 이 필드가 없어 null이 된다.
   */
  getContractTermination: (contractId: number) =>
    callOrMock(
      "공구 해지 요청",
      async () => {
        const { data } = await apiInstance.get<{
          terminationRequest?: ContractTerminationRequest | null
        }>(`/seller/contracts/${contractId}`, { suppressErrorToast: true })
        return data.terminationRequest ?? null
      },
      async () => {
        const { contractTerminationMock } = await import("./groupBuy.mock")
        return contractTerminationMock(contractId)
      }
    ),
}

/**
 * S3 presigned URL로 파일 본문을 올린다 — 서명에 들어간 Content-Type과 같아야 한다.
 * 우리 API가 아니라서 apiInstance(인증 헤더·토스트)를 거치지 않는다.
 */
export async function putAppealFile(
  uploadUrl: string,
  contentType: string,
  file: File
) {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: file,
  })
  if (!response.ok) {
    throw new Error(`파일 업로드에 실패했습니다 (${response.status})`)
  }
}
