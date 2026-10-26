import type { StatusBadgeVariant } from "@/common/components/StatusBadge/StatusBadge"
import { PERFORMANCE_PATH } from "@/features/settlement/constants/params"
import {
  PERFORMANCE_STATUSES,
  type PerformanceListParams,
  type PerformanceSort,
  type PerformanceStatus,
  type PerformanceTone,
} from "@/features/performance/types"

/** 목록 `/performance` · 상세 `/performance/:groupBuyId` — 경로는 정산 관리가 쓰는 상수와 같은 값을 쓴다 */
export const PERFORMANCE_LIST_PATH = PERFORMANCE_PATH

export const performanceDetailPath = (groupBuyId: number) =>
  `${PERFORMANCE_LIST_PATH}/${groupBuyId}`

export const PERFORMANCE_QUERY_KEYS = {
  LIST: "sellerPerformanceList",
  SUMMARY: "sellerPerformanceSummary",
  DETAIL: "sellerPerformanceDetail",
} as const

/** 상태 칩 이름 — 요약이 오기 전에도 칩을 그려야 해서 화면이 든다(서버 `PerformanceStatus` 라벨과 같다) */
export const PERFORMANCE_STATUS_CHIP_LABEL: Record<PerformanceStatus, string> =
  {
    AGGREGATING: "집계 중",
    REVIEWING: "정산 확인 중",
    ADJUSTING: "조정 협의",
    PAYOUT_SCHEDULED: "지급 예정",
    PAID: "지급 완료",
  }

/** 집계 중 · 정산 확인 중 · 지급 예정 = 중립 · 조정 협의 = 경고 · 지급 완료 = 성공 */
export const PERFORMANCE_TONE_VARIANT: Record<
  PerformanceTone,
  StatusBadgeVariant
> = {
  NEUTRAL: "neutral",
  WARNING: "warning",
  SUCCESS: "success",
}

export const PERFORMANCE_SORT_OPTIONS: Array<{
  value: PerformanceSort
  label: string
}> = [
  { value: "ENDED_DESC", label: "종료일 최신순" },
  { value: "SALES_DESC", label: "거래액 높은순" },
]

export const PERFORMANCE_PAGE_SIZES = [20, 50] as const

export const PERFORMANCE_INITIAL_PARAMS: PerformanceListParams = {
  status: [...PERFORMANCE_STATUSES],
  keyword: "",
  sort: "ENDED_DESC",
  page: 1,
  size: 20,
  mock: null,
}

/** 원가 입력 한도 — 서버 검증(0 이상 10억 이하 정수)과 같다 */
export const COST_MAX = 1_000_000_000
