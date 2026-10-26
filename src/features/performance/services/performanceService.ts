import { apiInstance } from "@/common/lib/apiInstance"
import { callOrMock } from "@/common/utils/devMock"
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
 * 성과 관리(ui-partner-12 rev.8) — `SellerPerformanceController`(back-end origin/main · 48 설계서).
 *
 * main에는 있으나 개발 서버(api.showroomz.shop)에 아직 배포되지 않았다(2026-10-24).
 * 그래서 모든 호출을 `callOrMock`으로 감싼다 — 실호출이 먼저 나가고,
 *  - 배포본: 서버가 경로를 모르면(404 · 405) `ApiNotReadyError` → 화면은 「준비 중」
 *  - 개발 서버(`pnpm dev`): 실호출이 실패하면 목업(`performance.mock.ts`, 동적 import라 배포 번들에 안 들어간다)
 * 서버에 배포되면 코드를 고치지 않아도 실데이터로 바뀐다. 목업을 아예 걷어 낼 때는 각 함수의
 * `callOrMock(…)`을 실호출 함수 본문만 남기면 된다.
 *
 * 개발 서버 `?mock=` 시나리오(목록 · 상세 주소 뒤에 붙인다):
 *  - 목록 `/performance`
 *    - (없음) L1 기본 · `empty` L2 빈 상태 · `not-ready` 배포본의 「준비 중」
 *  - 상세 `/performance/:groupBuyId` — 목업 ID 61 데일리 선크림(지급 예정) · 58 수분 토너(조정 협의) ·
 *    57 클렌징 밤(지급 완료) · 64·63·62(집계 중). 시나리오를 주면 ID와 무관하게 그 상태를 그린다.
 *    - `final` D1 확정 성과 · `aggregating` D2 집계 중 · `adjusting` D3 정산 조정 협의 ·
 *      `paid-agreed` D4 지급 완료(합의 반영) · `cost-empty` D1-C 원가 미입력 · `cost-filled` D1-D 원가 입력 완료 ·
 *      `not-found` 없는 공구 · `not-ready` 배포본의 「준비 중」
 *    - D1-C에서 원가를 입력하고 [저장]하면 목업이 PUT을 흉내 내 D1-D로 바뀐다(새로고침하면 처음 상태).
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

const FEATURE = "성과 관리"

export const performanceService = {
  getList: (params: PerformanceListParams) =>
    callOrMock(
      FEATURE,
      async () => {
        const { data } = await apiInstance.get<PerformanceListPage>(
          `${BASE_URL}/group-buys`,
          { params: toListSearchParams(params), suppressErrorToast: true }
        )
        return data
      },
      async () => {
        const { getListMock } = await import("./performance.mock")
        return getListMock(params)
      }
    ),

  /** KPI 8칸 · 상태 칩 건수 — 검색어 · 상태 칩과 무관한 전체 기준(모집단 = 지급 예정 + 지급 완료) */
  getSummary: () =>
    callOrMock(
      FEATURE,
      async () => {
        const { data } = await apiInstance.get<PerformanceSummary>(
          `${BASE_URL}/summary`,
          { suppressErrorToast: true }
        )
        return data
      },
      async () => {
        const { getSummaryMock } = await import("./performance.mock")
        return getSummaryMock()
      }
    ),

  /** 남의 공구 · 없는 공구는 404 `GROUP_BUY_NOT_FOUND` — 배포본에서는 「준비 중」과 구분이 안 돼 화면이 같이 다룬다 */
  getDetail: (groupBuyId: number) =>
    callOrMock(
      FEATURE,
      async () => {
        const { data } = await apiInstance.get<PerformanceDetail>(
          `${BASE_URL}/group-buys/${groupBuyId}`,
          { suppressErrorToast: true }
        )
        return data
      },
      async () => {
        const { getDetailMock } = await import("./performance.mock")
        return getDetailMock(groupBuyId)
      }
    ),

  /**
   * 원가 저장(전체 교체) — 저장 뒤 다시 계산한 상세를 돌려준다.
   * 실패 문구(집계 중 잠김 · 항목 불일치 · 금액 범위)는 화면이 서버 문구로 띄우므로 인터셉터 토스트를 끈다.
   */
  saveCost: (groupBuyId: number, body: PerformanceCostRequest) =>
    callOrMock(
      FEATURE,
      async () => {
        const { data } = await apiInstance.put<PerformanceDetail>(
          `${BASE_URL}/group-buys/${groupBuyId}/cost`,
          body,
          { suppressErrorToast: true }
        )
        return data
      },
      async () => {
        const { saveCostMock } = await import("./performance.mock")
        return saveCostMock(groupBuyId, body)
      }
    ),
}
