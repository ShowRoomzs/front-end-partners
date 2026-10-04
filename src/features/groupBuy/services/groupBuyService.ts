import { apiInstance } from "@/common/lib/apiInstance"
import type { PageResponse } from "@/common/types/page"
import { paramsToSearchParams } from "@/common/utils/paramsToSearchParams"
import type {
  AppealAttachmentPresignBody,
  AppealAttachmentPresignResponse,
  AppealSubmitBody,
  DetailNavParams,
  EarlyCloseRequestBody,
  ExtensionRequestBody,
  FulfillmentCheckBody,
  GroupBuyDetailResponse,
  GroupBuyListItem,
  GroupBuyListParams,
  GroupBuySummaryResponse,
  IssueOpenBody,
  IssueOpenResponse,
  SuspensionRequestBody,
} from "@/features/groupBuy/types"

const BASE_URL = "/seller/group-buys"

/*
  실행 API는 모두 갱신된 상세를 그대로 돌려준다 — 호출부가 상세 캐시를 그 값으로 바꾸고
  목록·요약만 다시 읽는다(요청 한 번에 화면이 바로 다음 상태로 넘어간다).
*/
export const groupBuyService = {
  getList: async (params: GroupBuyListParams) => {
    const { data } = await apiInstance.get<PageResponse<GroupBuyListItem>>(
      BASE_URL,
      { params: paramsToSearchParams(params) }
    )
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

  openIssue: async (groupBuyId: number, body: IssueOpenBody) => {
    const { data } = await apiInstance.post<IssueOpenResponse>(
      `${BASE_URL}/${groupBuyId}/issues`,
      body
    )
    return data
  },

  checkFulfillment: async (groupBuyId: number, body: FulfillmentCheckBody) => {
    const { data } = await apiInstance.post<GroupBuyDetailResponse>(
      `${BASE_URL}/${groupBuyId}/fulfillment-check`,
      body
    )
    return data
  },
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
