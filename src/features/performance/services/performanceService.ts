import { apiInstance } from "@/common/lib/apiInstance"
import { paramsToSearchParams } from "@/common/utils/paramsToSearchParams"
import {
  PERFORMANCE_SORTS,
  PERFORMANCE_STATUSES,
  type PerformanceCostRequest,
  type PerformanceDetail,
  type PerformanceListPage,
  type PerformanceListParams,
  type PerformanceSummary,
} from "@/features/performance/types"

/**
 * 성과 관리(ui-partner-12 rev.8) — `SellerPerformanceController`(48 설계서).
 */
const BASE_URL = "/seller/performance"

/** 상태를 전부 고르면 생략과 같다(서버: 생략 = 전부). 주소창의 옛 값은 서버가 400으로 막으므로 걸러 낸다 */
function toListSearchParams(params: PerformanceListParams) {
  const status = PERFORMANCE_STATUSES.filter(item =>
    params.status.includes(item)
  )
  return paramsToSearchParams({
    page: params.page,
    size: params.size,
    keyword: params.keyword.trim(),
    status: status.length === PERFORMANCE_STATUSES.length ? [] : status,
    sort: PERFORMANCE_SORTS.includes(params.sort) ? params.sort : null,
  })
}

export const performanceService = {
  /** 실패는 목록 화면이 직접 그린다(「성과 목록을 불러오지 못했습니다」) — 인터셉터 토스트를 끈다 */
  getList: async (params: PerformanceListParams) => {
    const { data } = await apiInstance.get<PerformanceListPage>(
      `${BASE_URL}/group-buys`,
      { params: toListSearchParams(params), suppressErrorToast: true }
    )
    return data
  },

  /** KPI 8칸 · 상태 칩 건수 — 검색어 · 상태 칩과 무관한 전체 기준(모집단 = 지급 예정 + 지급 완료) */
  getSummary: async () => {
    const { data } = await apiInstance.get<PerformanceSummary>(
      `${BASE_URL}/summary`
    )
    return data
  },

  /**
   * 남의 공구 · 없는 공구는 404 `GROUP_BUY_NOT_FOUND`.
   * 실패(없음 · 그 밖의 오류)는 상세 화면이 직접 그린다 — 인터셉터 토스트를 끈다.
   */
  getDetail: async (groupBuyId: number) => {
    const { data } = await apiInstance.get<PerformanceDetail>(
      `${BASE_URL}/group-buys/${groupBuyId}`,
      { suppressErrorToast: true }
    )
    return data
  },

  /**
   * 원가 저장(전체 교체) — 저장 뒤 다시 계산한 상세를 돌려준다.
   * 실패 문구(집계 중 잠김 · 항목 불일치 · 금액 범위)는 화면이 서버 문구로 띄우므로 인터셉터 토스트를 끈다.
   */
  saveCost: async (groupBuyId: number, body: PerformanceCostRequest) => {
    const { data } = await apiInstance.put<PerformanceDetail>(
      `${BASE_URL}/group-buys/${groupBuyId}/cost`,
      body,
      { suppressErrorToast: true }
    )
    return data
  },
}
