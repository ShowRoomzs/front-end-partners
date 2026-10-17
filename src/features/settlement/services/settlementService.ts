import {
  ApiNotReadyError,
  DEV_MOCK_ENABLED,
  mockDelay,
  mockScenario,
} from "@/common/utils/devMock"
import type { PageResponse } from "@/common/types/page"
import {
  mockRequestAdjustment,
  mockSettlements,
  toListItem,
} from "@/features/settlement/services/settlementMock"
import {
  SETTLEMENT_STATUSES,
  type SettlementAdjustmentRequest,
  type SettlementDetail,
  type SettlementListItem,
  type SettlementListParams,
  type SettlementSummary,
} from "@/features/settlement/types"

/**
 * 정산 관리(ui-partner-13 rev.4).
 *
 * ⚠️ 백엔드에 정산 API가 없다. 개발 서버에서만 목업으로 채우고 배포본에서는 화면이 「준비 중」을
 * 띄운다(가짜 금액을 실제 브랜드에게 보이면 안 된다). API가 생기면 아래 함수 본문만 바꾼다 —
 * 예상 경로: `GET /v1/seller/settlements` · `/summary` · `/{id}` · `/{id}/statement`(xlsx) ·
 * `/{id}/tax-invoice`(파일) · `POST /{id}/adjustments`(정산 조정 요청).
 *
 * 시나리오(개발 서버): `?mock=settlement-empty` = L2 빈 상태 ·
 * `?mock=settlement-review-closed` = 정산 확인 기간이 지나 [정산 조정 요청] 비활성.
 */

function source(): Array<SettlementDetail> {
  return mockSettlements(mockScenario())
}

function notReady(): never {
  throw new ApiNotReadyError("정산 관리")
}

export const settlementService = {
  getSummary: async (): Promise<SettlementSummary> => {
    if (!DEV_MOCK_ENABLED) notReady()
    const details = source()
    const of = (status: SettlementDetail["status"]) =>
      details.filter(detail => detail.status === status)
    const paid = of("PAID")
    const scheduled = of("SCHEDULED")
    const reviewing = of("REVIEWING")
    const earliest = (dates: Array<string | null | undefined>) =>
      dates.filter((date): date is string => !!date).sort()[0] ?? null
    return mockDelay({
      paidTotal: paid.reduce((sum, d) => sum + d.breakdown.payoutAmount, 0),
      paidCount: paid.length,
      scheduledTotal: scheduled.reduce(
        (sum, d) => sum + d.breakdown.payoutAmount,
        0
      ),
      scheduledCount: scheduled.length,
      nextPayoutDate: earliest(scheduled.map(d => d.payoutInfo?.scheduledDate)),
      scheduledHasDeduction: scheduled.some(
        d => d.breakdown.deductions.length > 0
      ),
      reviewingCount: reviewing.length,
      nextReviewDeadlineAt: earliest(reviewing.map(d => d.reviewDeadlineAt)),
      statusCounts: Object.fromEntries(
        SETTLEMENT_STATUSES.map(status => [status, of(status).length])
      ) as SettlementSummary["statusCounts"],
    })
  },

  getList: async (
    params: SettlementListParams
  ): Promise<PageResponse<SettlementListItem>> => {
    if (!DEV_MOCK_ENABLED) notReady()
    const keyword = params.keyword.trim().toLowerCase()
    const details = source()
      .filter(detail => params.statuses.includes(detail.status))
      .filter(
        detail =>
          !keyword ||
          detail.groupBuyTitle.toLowerCase().includes(keyword) ||
          detail.creatorShowroomName.toLowerCase().includes(keyword)
      )
    const sorted = [...details].sort((a, b) =>
      params.sort === "RECEIVABLE_DESC"
        ? b.breakdown.brandReceivable - a.breakdown.brandReceivable
        : b.createdAt.localeCompare(a.createdAt)
    )
    const page = Math.max(1, Number(params.page) || 1)
    const size = Number(params.size) || 20
    const totalResults = sorted.length
    const totalPages = Math.max(1, Math.ceil(totalResults / size))
    return mockDelay({
      content: sorted.slice((page - 1) * size, page * size).map(toListItem),
      pageInfo: {
        currentPage: page,
        totalPages,
        totalResults,
        limit: size,
        hasNext: page < totalPages,
      },
    })
  },

  getDetail: async (settlementId: number): Promise<SettlementDetail> => {
    if (!DEV_MOCK_ENABLED) notReady()
    const detail = source().find(item => item.settlementId === settlementId)
    if (!detail) throw new Error("NOT_FOUND")
    return mockDelay(detail)
  },

  /** C1 — 요청하면 정산 전액 보류(조정 협의) + 이슈 스레드 자동 개설. 차액 선지급 없음 */
  requestAdjustment: async (
    settlementId: number,
    body: SettlementAdjustmentRequest
  ): Promise<SettlementDetail> => {
    if (!DEV_MOCK_ENABLED) notReady()
    await mockDelay(null, 400)
    return mockDelay(
      mockRequestAdjustment(mockScenario(), settlementId, body),
      0
    )
  },
}
