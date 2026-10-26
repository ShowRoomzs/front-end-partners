import { apiInstance } from "@/common/lib/apiInstance"
import type { BaseParams, PageResponse } from "@/common/types/page"
import { paramsToSearchParams } from "@/common/utils/paramsToSearchParams"
import { saveBlob } from "@/features/claims/services/claimService"
import {
  SETTLEMENT_SORTS,
  SETTLEMENT_STATUSES,
  type SettlementAdjustmentPreview,
  type SettlementAdjustmentRequest,
  type SettlementAdjustmentRequestResponse,
  type SettlementDetail,
  type SettlementItem,
  type SettlementListItem,
  type SettlementListParams,
  type SettlementSummary,
} from "@/features/settlement/types"
import { isAxiosError, type AxiosResponse } from "axios"
import toast from "react-hot-toast"

/**
 * 정산 관리(ui-partner-13 rev.4) — `SellerSettlementController` · `SellerSettlementAdjustmentController`.
 * 조정 협의 응답(제안 · 동의 · 반대 · 스레드 고정 카드)은 이슈 스레드 화면이 생기면 붙인다.
 */
const BASE_URL = "/seller/settlements"

/**
 * 목록 검색 조건 → 쿼리. 상태를 전부 고르면 생략과 같다(서버: 생략 = 전부).
 * 주소창에서 들어온 옛 값(구 `SCHEDULED` · `CREATED_AT_DESC` 등)은 서버가 400으로 막으므로 여기서 걸러 낸다.
 */
function toListSearchParams(params: SettlementListParams) {
  const status = SETTLEMENT_STATUSES.filter(item =>
    params.status.includes(item)
  )
  return paramsToSearchParams({
    page: params.page,
    size: params.size,
    keyword: params.keyword.trim(),
    status: status.length === SETTLEMENT_STATUSES.length ? [] : status,
    sort: SETTLEMENT_SORTS.includes(params.sort) ? params.sort : null,
  })
}

/** `Content-Disposition: attachment; filename*=UTF-8''…` → 파일명 */
function filenameOf(response: AxiosResponse<Blob>, fallback: string) {
  const header = String(response.headers["content-disposition"] ?? "")
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(header)?.[1]
  return encoded ? decodeURIComponent(encoded) : fallback
}

/**
 * 파일 응답(`responseType: blob`)은 실패해도 본문이 Blob이라 공용 인터셉터가 서버 문구를 못 읽는다.
 * 인터셉터 토스트를 끄고 여기서 JSON을 풀어 서버 문구(「정산이 확정된 뒤에 명세를 내려받을 수 있습니다」 등)를 띄운다.
 */
async function toastBlobError(error: unknown) {
  let message =
    "요청을 처리하지 못했습니다. 네트워크 상태를 확인한 뒤 다시 시도해 주세요."
  if (isAxiosError(error) && error.response?.data instanceof Blob) {
    try {
      const body = JSON.parse(await error.response.data.text())
      if (typeof body?.message === "string") message = body.message
    } catch {
      // JSON이 아니면 기본 문구를 쓴다
    }
  }
  toast.error(message)
}

/**
 * ⚠️ 운영 서버 CORS가 Content-Disposition을 노출하지 않아 브라우저에서는 헤더가 비어 온다 —
 * 대체 이름을 서버 규칙과 같게 짓는다(`fallbackName`).
 */
async function download(url: string, fallbackName: string) {
  try {
    const response = await apiInstance.get<Blob>(url, {
      responseType: "blob",
      suppressErrorToast: true,
    })
    saveBlob(response.data, filenameOf(response, fallbackName))
  } catch (error) {
    await toastBlobError(error)
    throw error
  }
}

/** 운영자 사업자 정보(`GET /v1/common/company-info` · 인증 불요) — 세금계산서 공급자 줄에 쓰는 필드만 */
export interface CompanyInfo {
  name: string
  representative: string
  registrationNumber: string
  address: string
}

export const settlementService = {
  /** 배포 전 서버는 404 — 화면이 기본값(시안 값)으로 그리므로 토스트를 끈다 */
  getCompanyInfo: async () => {
    const { data } = await apiInstance.get<CompanyInfo>(
      "/common/company-info",
      { suppressErrorToast: true }
    )
    return data
  },

  getList: async (params: SettlementListParams) => {
    const { data } = await apiInstance.get<PageResponse<SettlementListItem>>(
      BASE_URL,
      { params: toListSearchParams(params) }
    )
    return data
  },

  /** KPI · 상태 칩 · GNB 배지 — 검색 조건과 무관한 마켓 전체 기준 */
  getSummary: async () => {
    const { data } = await apiInstance.get<SettlementSummary>(
      `${BASE_URL}/summary`
    )
    return data
  },

  /** 남의 정산 · 없는 정산은 404 — 화면이 직접 안내를 그리므로 토스트를 끈다 */
  getDetail: async (settlementId: number) => {
    const { data } = await apiInstance.get<SettlementDetail>(
      `${BASE_URL}/${settlementId}`,
      { suppressErrorToast: true }
    )
    return data
  },

  /** 명세 전체 — 주문번호 내림차순 · 상태 무관(확정 전에도 열린다) */
  getItems: async (settlementId: number, params: BaseParams) => {
    const { data } = await apiInstance.get<PageResponse<SettlementItem>>(
      `${BASE_URL}/${settlementId}/items`,
      { params: paramsToSearchParams(params) }
    )
    return data
  },

  /** 전체 명세 xlsx — 확정 후만(그 전엔 409). 서버 파일명 `정산명세_{정산번호}.xlsx` */
  downloadStatement: (settlementId: number, settlementNumber: string) =>
    download(
      `${BASE_URL}/${settlementId}/items/download`,
      `정산명세_${settlementNumber}.xlsx`
    ),

  /**
   * SHOWROOMZ 발행 세금계산서 PDF — 발행 전이면 409. 서버는 운영팀이 올린 파일 이름을 쓰고,
   * 없으면 `세금계산서_{정산번호}.pdf`로 내린다 — 헤더를 못 읽을 때는 그 기본 규칙을 따른다.
   */
  downloadTaxDocument: (
    settlementId: number,
    documentId: number,
    settlementNumber: string
  ) =>
    download(
      `${BASE_URL}/${settlementId}/tax-documents/${documentId}/download`,
      `세금계산서_${settlementNumber}.pdf`
    ),

  /**
   * 조정 금액 미리보기 — `rewardAmount`를 빼면 모달을 여는 값(상한 · 원래 금액 계산)만 온다.
   * 입력 중 미리보기(`silent`)는 디바운스로 여러 번 나가므로 실패해도 토스트를 띄우지 않고 「—」로 둔다.
   */
  getAdjustmentPreview: async (
    settlementId: number,
    rewardAmount: number | null,
    options?: { silent?: boolean }
  ) => {
    const { data } = await apiInstance.get<SettlementAdjustmentPreview>(
      `${BASE_URL}/${settlementId}/adjustment/preview`,
      {
        params: rewardAmount === null ? undefined : { rewardAmount },
        suppressErrorToast: options?.silent === true,
      }
    )
    return data
  },

  /**
   * 정산 조정 요청 — 3자 이슈 스레드가 자동으로 열리고 정산은 조정 협의(전 수취자 보류)가 된다.
   * 실패 코드별로 모달이 직접 안내하므로(금액·사유 칸 아래 문구 · 기간 경과 시 닫기) 토스트를 끈다.
   */
  requestAdjustment: async (
    settlementId: number,
    body: SettlementAdjustmentRequest
  ) => {
    const { data } =
      await apiInstance.post<SettlementAdjustmentRequestResponse>(
        `${BASE_URL}/${settlementId}/adjustment`,
        body,
        { suppressErrorToast: true }
      )
    return data
  },
}
