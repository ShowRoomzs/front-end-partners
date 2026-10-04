import ListViewWrapper from "@/common/components/ListViewWrapper/ListViewWrapper"
import Table from "@/common/components/Table/Table"
import { usePaginationInfo } from "@/common/hooks/usePaginationInfo"
import { useParams } from "@/common/hooks/useParams"
import { SELECT_CHEVRON_STYLE } from "@/features/contracts/constants/params"
import {
  GroupBuyEmptyState,
  GroupBuyStatusTabs,
  GroupBuyToolbar,
} from "@/features/groupBuy/components/list/GroupBuyListParts"
import { GROUP_BUY_COLUMNS } from "@/features/groupBuy/components/list/columns"
import {
  GROUP_BUY_INITIAL_PARAMS,
  GROUP_BUY_LIST_PATH,
  GROUP_BUY_PAGE_SIZES,
  GROUP_BUY_SORT_OPTIONS,
} from "@/features/groupBuy/constants/params"
import {
  useGetGroupBuyList,
  useGetGroupBuySummary,
} from "@/features/groupBuy/hooks/useGroupBuyQueries"
import type {
  GroupBuyListItem,
  GroupBuyListParams,
  GroupBuySortType,
  GroupBuyTab,
} from "@/features/groupBuy/types"
import { useCallback, useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"

const SELECT_SM_CLASS =
  "h-7 appearance-none rounded-[6px] border border-sz-n-300 bg-white py-0 pl-2 pr-[22px] text-[12px] text-sz-n-700 outline-none focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"

/**
 * A1~A3 — 공구 목록(파트너센터).
 *
 * 계약 목록과 같은 골격(탭 · 툴바 · 표)이지만 브랜드가 **만들 수 없는** 목록이라
 * [+ 공구 생성]이 없고, 빈 상태 CTA도 계약 관리로 보낸다. 행 클릭으로만 들어간다.
 */
export default function GroupBuyListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    params,
    localParams,
    update,
    updateParam,
    updateParams,
    updateLocalParam,
    reset,
  } = useParams<GroupBuyListParams>(GROUP_BUY_INITIAL_PARAMS)

  const { data: list, isLoading } = useGetGroupBuyList(params)
  const { data: summary } = useGetGroupBuySummary(true)

  const pageInfo = usePaginationInfo({
    data: list?.pageInfo,
    onPageChange: page => {
      updateParam("page", page)
    },
  })

  const handleRowClick = useCallback(
    (record: GroupBuyListItem) => {
      // 목록 조건을 들고 간다 — 상세의 [목록]·[이전]·[다음]이 같은 조건으로 돈다
      navigate({
        pathname: `${GROUP_BUY_LIST_PATH}/${record.groupBuyId}`,
        search: location.search,
      })
    },
    [navigate, location.search]
  )

  const handleTabChange = useCallback(
    (tab: GroupBuyTab) => updateParams({ tab, page: 1 }),
    [updateParams]
  )

  const hasCondition = params.tab !== "ALL" || !!params.keyword
  const isEmpty = !isLoading && (list?.content.length ?? 0) === 0

  const emptyState = useMemo(
    () => (
      <GroupBuyEmptyState
        hasCondition={hasCondition}
        tab={params.tab}
        keyword={params.keyword}
        onReset={reset}
        onGoContracts={() => navigate("/contract")}
      />
    ),
    [hasCondition, params.tab, params.keyword, reset, navigate]
  )

  return (
    <ListViewWrapper>
      {/* 셸이 아니라 화면이 제목을 그린다 — 설명 줄이 붙기 때문이다(MainLayout의 SELF_TITLED_PREFIXES) */}
      <div className="mb-4 shrink-0">
        <h1 className="text-[20px] font-semibold text-sz-n-900">공구 관리</h1>
        <p className="mt-0.5 text-[12px] text-sz-n-600">
          체결된 계약에서 생성된 공구의 준비 상황과 판매 실적을 확인합니다.
        </p>
      </div>

      <GroupBuyStatusTabs
        tab={params.tab}
        onTabChange={handleTabChange}
        counts={summary?.tabCounts}
      />

      <GroupBuyToolbar
        keyword={localParams.keyword}
        onKeywordChange={keyword => updateLocalParam("keyword", keyword)}
        onSearch={update}
        onReset={reset}
      />

      {isEmpty && !hasCondition ? (
        <div className="rounded-[8px] border border-sz-n-200 bg-white">
          {emptyState}
        </div>
      ) : (
        <div className="flex flex-col overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
          {!isEmpty && (
            <div className="flex shrink-0 items-center justify-between border-b border-sz-n-200 px-4 py-2.5">
              <span className="text-[12px] text-sz-n-600">
                총 <b className="text-sz-n-900">{pageInfo.totalResults}</b>건
                {params.tab === "ALL" && (
                  <>
                    {" "}
                    · 준비중{" "}
                    <b className="text-sz-n-900">
                      {summary?.tabCounts.PREPARING ?? 0}
                    </b>
                    건
                  </>
                )}
              </span>

              <div className="flex items-center gap-2">
                <select
                  aria-label="정렬"
                  value={params.sort}
                  onChange={event =>
                    updateParams({
                      sort: event.target.value as GroupBuySortType,
                      page: 1,
                    })
                  }
                  style={SELECT_CHEVRON_STYLE}
                  className={SELECT_SM_CLASS}
                >
                  {GROUP_BUY_SORT_OPTIONS.map(option => (
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
                  {GROUP_BUY_PAGE_SIZES.map(size => (
                    <option key={size} value={size}>
                      {size}건씩
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <Table<GroupBuyListItem, "groupBuyId">
            rowKey="groupBuyId"
            columns={GROUP_BUY_COLUMNS}
            data={list?.content ?? []}
            pageInfo={pageInfo}
            isLoading={isLoading}
            onRowClick={handleRowClick}
            emptyState={emptyState}
            fitWidth
            footerAlign="center"
            bodyClassName="overflow-hidden whitespace-nowrap"
            headerClassName="whitespace-nowrap font-semibold tracking-[.2px]"
            // 시안 `tbody td{padding:13px 16px;border-top:1px solid n-100}`
            cellClassName="border-sz-n-100 py-[13px]"
            rowClassName="hover:bg-sz-accent-50"
          />
        </div>
      )}
    </ListViewWrapper>
  )
}
