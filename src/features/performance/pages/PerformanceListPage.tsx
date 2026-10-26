import NotReady from "@/common/components/NotReady/NotReady"
import Pagination from "@/common/components/Pagination/Pagination"
import { usePaginationInfo } from "@/common/hooks/usePaginationInfo"
import { useParams } from "@/common/hooks/useParams"
import { isApiNotReady } from "@/common/utils/devMock"
import { SELECT_SM_CLASS } from "@/features/claims/components/list/ClaimListParts"
import { SELECT_CHEVRON_STYLE } from "@/features/contracts/constants/params"
import Btn from "@/features/contracts/components/shared/Btn"
import {
  PerformanceEmptyState,
  PerformanceFilters,
  PerformanceSummaryKpis,
  PerformanceTable,
} from "@/features/performance/components/list/PerformanceListParts"
import {
  PERFORMANCE_INITIAL_PARAMS,
  PERFORMANCE_PAGE_SIZES,
  PERFORMANCE_SORT_OPTIONS,
  performanceDetailPath,
} from "@/features/performance/constants/params"
import {
  useGetPerformanceList,
  useGetPerformanceSummary,
} from "@/features/performance/hooks/usePerformanceQueries"
import type {
  PerformanceListParams,
  PerformanceSort,
} from "@/features/performance/types"
import { formatListPeriod } from "@/features/performance/utils/format"
import {
  SETTLEMENT_PAGE_CLASS,
  SettlementPageHeader,
} from "@/features/settlement/components/list/SettlementListParts"
import { GROUP_BUY_LIST_PATH } from "@/features/settlement/constants/params"
import { Loader2 } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"

const DESCRIPTION = "공구별 판매 성과를 확인합니다."

/**
 * 성과 관리 목록(ui-partner-12 L1 · L2) — 공구 단위 비교표다(브랜드 전체 대시보드가 아니다).
 * 이 화면이 답하는 질문은 「이 공구에서 얼마 받나」와 「이 인플루언서와 또 할 것인가」.
 * 금액의 출처는 정산 관리 — 여기서는 정산액 한 값만 가져다 쓰고 차감 내역을 다시 계산하지 않는다.
 */
export default function PerformanceListPage() {
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
  } = useParams<PerformanceListParams>(PERFORMANCE_INITIAL_PARAMS)

  const { data: list, isLoading, error } = useGetPerformanceList(params)
  const { data: summary, error: summaryError } = useGetPerformanceSummary()
  const rows = list?.content ?? []

  const pageInfo = usePaginationInfo({
    data: list?.pageInfo,
    onPageChange: page => updateParam("page", page),
  })

  // 배포본에서 서버에 아직 경로가 없으면(배포 전) 가짜 값 대신 「준비 중」만 그린다
  if (isApiNotReady(error) || isApiNotReady(summaryError)) {
    return (
      <div className={SETTLEMENT_PAGE_CLASS}>
        <SettlementPageHeader title="성과 관리" description={DESCRIPTION} />
        <div className="overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
          <NotReady title="성과 관리 화면은 준비 중입니다">
            서버 반영이 끝나면 공구별 판매 성과를 이 화면에서 확인할 수
            있습니다.
          </NotReady>
        </div>
      </div>
    )
  }

  const totalCount = summary
    ? Object.values(summary.statusCounts).reduce((sum, n) => sum + n, 0)
    : 0
  const neverHadGroupBuys = !!summary && totalCount === 0
  const hasCondition =
    params.keyword.trim() !== "" ||
    params.status.length < PERFORMANCE_INITIAL_PARAMS.status.length

  return (
    <div className={SETTLEMENT_PAGE_CLASS}>
      <SettlementPageHeader title="성과 관리" description={DESCRIPTION} />

      <PerformanceSummaryKpis summary={summary} />

      <PerformanceFilters
        params={params}
        keyword={localParams.keyword}
        statusCounts={summary?.statusCounts}
        onChange={updateParams}
        onKeywordChange={keyword => updateLocalParam("keyword", keyword)}
        onSearch={update}
        onReset={reset}
      />

      <div className="overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
        {!neverHadGroupBuys && rows.length > 0 && (
          <div className="flex items-center justify-between border-b border-sz-n-200 px-4 py-2.5">
            <span className="text-[12px] text-sz-n-600">
              총 <b className="text-sz-n-900">{pageInfo.totalResults}</b>건
              {list?.listPeriod && (
                <>
                  {" · "}
                  <span className="text-sz-n-500">
                    조회기간{" "}
                    {formatListPeriod(list.listPeriod.from, list.listPeriod.to)}
                  </span>
                </>
              )}
            </span>
            <div className="flex items-center gap-2">
              <select
                aria-label="정렬"
                value={params.sort}
                onChange={event =>
                  updateParams({
                    sort: event.target.value as PerformanceSort,
                    page: 1,
                  })
                }
                style={SELECT_CHEVRON_STYLE}
                className={SELECT_SM_CLASS}
              >
                {PERFORMANCE_SORT_OPTIONS.map(option => (
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
                {PERFORMANCE_PAGE_SIZES.map(size => (
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
        ) : error && !list ? (
          <NotReady
            title="성과 목록을 불러오지 못했습니다"
            action={
              <Btn variant="primary" onClick={() => window.location.reload()}>
                다시 시도
              </Btn>
            }
          >
            네트워크 상태를 확인한 뒤 다시 시도해 주세요.
          </NotReady>
        ) : rows.length === 0 ? (
          <PerformanceEmptyState
            hasCondition={!neverHadGroupBuys && hasCondition}
            keyword={params.keyword}
            onReset={reset}
            onGoGroupBuy={() => navigate(GROUP_BUY_LIST_PATH)}
          />
        ) : (
          <PerformanceTable
            rows={rows}
            onRowClick={row =>
              navigate(
                `${performanceDetailPath(row.groupBuyId)}${location.search}`
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
