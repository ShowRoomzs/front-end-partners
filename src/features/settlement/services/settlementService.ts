import {
  ApiNotReadyError,
  DEV_MOCK_ENABLED,
  mockDelay,
  mockScenario,
} from "@/common/utils/devMock"
import type { PageResponse } from "@/common/types/page"
import {
  MOCK_SETTLEMENT_DETAILS,
  toListItem,
} from "@/features/settlement/services/settlementMock"
import {
  SETTLEMENT_STATUSES,
  type SettlementDetail,
  type SettlementListItem,
  type SettlementListParams,
  type SettlementSummary,
} from "@/features/settlement/types"

/**
 * 정산 관리(ui-partner-13) — 조회 전용.
 *
 * ⚠️ 백엔드에 정산 API가 없다. 개발 서버에서만 목업으로 채우고 배포본에서는 화면이 「준비 중」을
 * 띄운다(가짜 금액을 실제 브랜드에게 보이면 안 된다). API가 생기면 아래 함수 본문만 바꾼다 —
 * 예상 경로: `GET /v1/seller/settlements` · `/summary` · `/{id}` · `/{id}/statement`(xlsx).
 *
 * 시나리오(개발 서버): `?mock=settlement-empty` = L2 빈 상태.
 */

function source(): Array<SettlementDetail> {
  return mockScenario() === "settlement-empty" ? [] : MOCK_SETTLEMENT_DETAILS
}

function notReady(): never {
  throw new ApiNotReadyError("정산 관리")
}

export const settlementService = {
  getSummary: async (): Promise<SettlementSummary> => {
    if (!DEV_MOCK_ENABLED) notReady()
    const items = source().map(toListItem)
    const of = (status: SettlementListItem["status"]) =>
      items.filter(item => item.status === status)
    const paid = of("PAID")
    const scheduled = of("CONFIRMED")
    const nextPayoutDate =
      scheduled
        .map(item => item.payoutDate)
        .filter((date): date is string => !!date)
        .sort()[0] ?? null
    return mockDelay({
      paidTotal: paid.reduce((sum, item) => sum + (item.payoutAmount ?? 0), 0),
      paidCount: paid.length,
      scheduledTotal: scheduled.reduce(
        (sum, item) => sum + (item.payoutAmount ?? 0),
        0
      ),
      scheduledCount: scheduled.length,
      nextPayoutDate,
      pendingCount: of("PENDING").length,
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
    const sorted = [...details].sort((a, b) => {
      if (params.sort === "PAYOUT_DESC") {
        const pa = a.status === "PENDING" ? -1 : a.breakdown.payout
        const pb = b.status === "PENDING" ? -1 : b.breakdown.payout
        return pb - pa
      }
      // 정산 확정일 최신순 — 아직 확정되지 않은 정산 대기가 맨 위(가장 최근 공구)
      if (!a.confirmedAt || !b.confirmedAt) {
        if (!a.confirmedAt && !b.confirmedAt) {
          return b.periodEnd.localeCompare(a.periodEnd)
        }
        return a.confirmedAt ? 1 : -1
      }
      return b.confirmedAt.localeCompare(a.confirmedAt)
    })
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
}
