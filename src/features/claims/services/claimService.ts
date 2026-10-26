import { apiInstance } from "@/common/lib/apiInstance"
import type { PageResponse } from "@/common/types/page"
import { callOrMock, DEV_MOCK_ENABLED } from "@/common/utils/devMock"
import { paramsToSearchParams } from "@/common/utils/paramsToSearchParams"
import dayjs from "dayjs"
import type {
  ClaimBatchResponse,
  ClaimDetailResponse,
  ClaimFreightPreview,
  ClaimListItem,
  ClaimListParams,
  ClaimOverturnBody,
  ClaimRejectBody,
  ClaimSummaryResponse,
  ReshipExportBody,
  ReshipItem,
  ReshipParseResponse,
  ReshipTemplateResponse,
} from "@/features/claims/types"
import { isInspection1021Ready } from "@/features/claims/utils/inspection"

/*
  1021 검수 판정(기-17 · 기-93)은 백엔드 main에 있고 개발 서버에는 아직 없다(2026-10-24).
  - 상세: 실호출 그대로. 개발 서버(`pnpm dev`)만 빠진 1021 필드를 목업으로 채운다(`claim.mock.ts`).
  - 사유 번복: `callOrMock` — 배포본은 404면 ApiNotReadyError, 개발 서버는 목업.
  - 통과 귀책 변경: 배포 전 서버는 본문을 무시하므로, 그 서버에 브랜드 귀책을 보내는 일은 개발 서버 목업만 받는다
    (배포본은 화면이 선택지를 열지 않는다 — utils/inspection).
  - 운임 미리보기: 서버에 원천이 없다 → 개발 서버만 목업 · 배포본 null.
  `?mock=` 시나리오는 없다 — 상태는 실제 판정 버튼으로 바꾼다.
*/

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

/**
 * 서버가 `filename*=UTF-8''…`로 내려준 파일명을 읽는다.
 *
 * ⚠️ 운영 서버 CORS가 Content-Disposition을 노출하지 않아(exposedHeaders 없음) 브라우저에서는 이 헤더가
 * 비어 온다 — 그래서 대체 이름을 서버 규칙(`재발송목록_yyyyMMdd_HHmmss.xlsx`)과 같게 만든다.
 */
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
    if (DEV_MOCK_ENABLED) {
      const { applyMock1021 } = await import("./claim.mock")
      return applyMock1021(data)
    }
    return data
  },

  /**
   * 판정 전 운임 미리보기(B2b · B1r · M1 금액 줄) — 서버 상세에 기본 배송비 · 원래 결제액이 없다.
   * 배포본은 null을 돌려 금액 줄을 그리지 않는다(안내 문구만). 서버가 값을 내려 주면 이 함수만 바꾼다.
   */
  getFreightPreview: async (
    detail: ClaimDetailResponse
  ): Promise<ClaimFreightPreview | null> => {
    if (!DEV_MOCK_ENABLED) return null
    const { freightPreviewMock } = await import("./claim.mock")
    return freightPreviewMock(detail)
  },

  receive: async (claimIds: Array<number>) => {
    const { data } = await apiInstance.post<ClaimBatchResponse>(
      `${BASE_URL}/receive`,
      { claimIds }
    )
    return data
  },

  /** M1 — 본문을 생략하면 신청 때 귀책 그대로 통과한다 */
  pass: async (current: ClaimDetailResponse, faultToSeller: boolean) => {
    if (DEV_MOCK_ENABLED && faultToSeller && !isInspection1021Ready(current)) {
      const { passWithFaultMock } = await import("./claim.mock")
      return passWithFaultMock(current)
    }
    const { data } = await apiInstance.post<ClaimDetailResponse>(
      `${BASE_URL}/${current.summary.claimId}/inspection/pass`,
      faultToSeller ? { faultToSeller } : undefined
    )
    return data
  },

  /** B2b 사유 번복 — 409 CLAIM_OVERTURN_NOT_APPLICABLE(선불 신청) · 400 증빙 누락 */
  overturn: (current: ClaimDetailResponse, body: ClaimOverturnBody) =>
    callOrMock(
      "검수 사유 번복",
      async () => {
        const { data } = await apiInstance.post<ClaimDetailResponse>(
          `${BASE_URL}/${current.summary.claimId}/inspection/overturn`,
          body,
          { suppressErrorToast: true }
        )
        return data
      },
      async () => {
        const { overturnMock } = await import("./claim.mock")
        return overturnMock(current, body)
      }
    ),

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
        `재발송목록_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`
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
