import NotReady from "@/common/components/NotReady/NotReady"
import Pagination from "@/common/components/Pagination/Pagination"
import { usePaginationInfo } from "@/common/hooks/usePaginationInfo"
import { useParams } from "@/common/hooks/useParams"
import { DEV_MOCK_ENABLED } from "@/common/utils/devMock"
import { SELECT_SM_CLASS } from "@/features/claims/components/list/ClaimListParts"
import { SELECT_CHEVRON_STYLE } from "@/features/contracts/constants/params"
import {
  SettlementEmptyState,
  SettlementFilters,
  SettlementKpis,
  SettlementPageHeader,
} from "@/features/settlement/components/list/SettlementListParts"
import SettlementTable from "@/features/settlement/components/list/SettlementTable"
import {
  GROUP_BUY_LIST_PATH,
  SETTLEMENT_INITIAL_PARAMS,
  SETTLEMENT_LIST_PATH,
  SETTLEMENT_PAGE_SIZES,
  SETTLEMENT_SORT_OPTIONS,
} from "@/features/settlement/constants/params"
import {
  useGetSettlementList,
  useGetSettlementSummary,
} from "@/features/settlement/hooks/useSettlementQueries"
import type {
  SettlementListParams,
  SettlementSort,
} from "@/features/settlement/types"
import { Loader2 } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"

const DESCRIPTION = "공구별 정산 금액과 지급 내역을 확인합니다."

/**
 * 정산 관리 목록(ui-partner-13 L1 · L2).
 *
 * 이 화면이 금액의 단일 소스다 — 성과 관리의 수취 예정액 분해도 같은 로직을 쓴다(성과는 해석,
 * 정산은 돈의 사실). 조회 전용이라 금액 수정·지급 실행·정산 승인 액션이 존재하지 않는다.
 *
 * 정산 API가 아직 없어 개발 서버에서만 목업으로 채운다 — 배포본은 「준비 중」(가짜 금액 금지).
 */
export default function SettlementListPage() {
  if (!DEV_MOCK_ENABLED) {
    return (
      <div>
        <SettlementPageHeader title="정산 관리" description={DESCRIPTION} />
        <div className="overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
          <NotReady title="정산 관리 화면은 준비 중입니다">
            공구별 정산 금액과 지급 내역은 정산 기능이 열리면 이곳에서 확인할 수
            있습니다.
          </NotReady>
        </div>
      </div>
    )
  }

  return <SettlementList />
}

function SettlementList() {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    params,
    localParams,
    updateParam,
    updateParams,
    updateLocalParam,
    update,
    reset,
  } = useParams<SettlementListParams>(SETTLEMENT_INITIAL_PARAMS)

  const { data: list, isLoading } = useGetSettlementList(params)
  const { data: summary } = useGetSettlementSummary()
  const rows = list?.content ?? []

  const pageInfo = usePaginationInfo({
    data: list?.pageInfo,
    onPageChange: page => updateParam("page", page),
  })

  const totalCount = summary
    ? Object.values(summary.statusCounts).reduce((sum, n) => sum + n, 0)
    : 0
  const neverHadSettlements = !!summary && totalCount === 0
  const hasCondition =
    params.keyword.trim() !== "" ||
    params.statuses.length < SETTLEMENT_INITIAL_PARAMS.statuses.length

  return (
    <div>
      <SettlementPageHeader title="정산 관리" description={DESCRIPTION} />

      <SettlementKpis summary={summary} />

      <SettlementFilters
        params={params}
        keyword={localParams.keyword}
        statusCounts={summary?.statusCounts}
        onChange={updateParams}
        onKeywordChange={keyword => updateLocalParam("keyword", keyword)}
        onSearch={update}
        onReset={reset}
      />

      <div className="overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
        {!neverHadSettlements && (
          <div className="flex items-center justify-between border-b border-sz-n-200 px-4 py-2.5">
            <span className="text-[12px] text-sz-n-600">
              총 <b className="text-sz-n-900">{pageInfo.totalResults}</b>건
            </span>
            <div className="flex items-center gap-2">
              <select
                aria-label="정렬"
                value={params.sort}
                onChange={event =>
                  updateParams({
                    sort: event.target.value as SettlementSort,
                    page: 1,
                  })
                }
                style={SELECT_CHEVRON_STYLE}
                className={SELECT_SM_CLASS}
              >
                {SETTLEMENT_SORT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                aria-label="표시 건수"
                value={params.size}
                onChange={event =>
                  updateParams({ size: Number(event.target.value), page: 1 })
                }
                style={SELECT_CHEVRON_STYLE}
                className={SELECT_SM_CLASS}
              >
                {SETTLEMENT_PAGE_SIZES.map(size => (
                  <option key={size} value={size}>
                    {size}건씩
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {isLoading && !list ? (
          <div className="flex justify-center py-[72px]">
            <Loader2 className="size-5 animate-spin text-sz-n-400" />
          </div>
        ) : rows.length === 0 ? (
          <SettlementEmptyState
            hasCondition={!neverHadSettlements && hasCondition}
            keyword={params.keyword}
            onReset={reset}
            onGoGroupBuy={() => navigate(GROUP_BUY_LIST_PATH)}
          />
        ) : (
          <SettlementTable
            rows={rows}
            onRowClick={row =>
              navigate(
                `${SETTLEMENT_LIST_PATH}/${row.settlementId}${location.search}`
              )
            }
          />
        )}

        {pageInfo.totalPages > 0 && rows.length > 0 && (
          <div className="flex justify-center border-t border-sz-n-200 p-3">
            <Pagination {...pageInfo} />
          </div>
        )}
      </div>
    </div>
  )
}
