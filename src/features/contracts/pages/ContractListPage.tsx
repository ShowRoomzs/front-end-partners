import ListViewWrapper from "@/common/components/ListViewWrapper/ListViewWrapper"
import Table from "@/common/components/Table/Table"
import { usePaginationInfo } from "@/common/hooks/usePaginationInfo"
import { useParams } from "@/common/hooks/useParams"
import ContractEmptyState from "@/features/contracts/components/ContractEmptyState/ContractEmptyState"
import ContractStatusTabs from "@/features/contracts/components/ContractStatusTabs/ContractStatusTabs"
import ContractToolbar from "@/features/contracts/components/ContractToolbar/ContractToolbar"
import { CONTRACT_COLUMNS } from "@/features/contracts/constants/columns"
import {
  CONTRACT_INITIAL_PARAMS,
  CONTRACT_LIST_PATH,
  CONTRACT_PAGE_SIZES,
  CONTRACT_SORT_OPTIONS,
  SELECT_CHEVRON_STYLE,
} from "@/features/contracts/constants/params"
import { useCreateContract } from "@/features/contracts/hooks/useContractMutations"
import {
  useGetContractList,
  useGetContractSummary,
} from "@/features/contracts/hooks/useContractQueries"
import type {
  ContractListItem,
  ContractListParams,
  ContractSortType,
  ContractTab,
} from "@/features/contracts/types"
import { useCallback, useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"

/**
 * A1~A2a — 계약 목록(파트너센터).
 *
 * 상품 문의 목록과 같은 골격(탭 · 툴바 · 표)이지만 주체가 반대다 — 여기서 브랜드는
 * **만드는 쪽**이라 [+ 계약 작성]과 빈 상태 CTA가 있다. 행 클릭으로만 들어가고 관리 열은 없다.
 * 작성중·검토 반려 행은 작성 모드로, 나머지는 계약서 모드로 열리는데 그 판정은 상세가 한다.
 */
export default function ContractListPage() {
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
  } = useParams<ContractListParams>(CONTRACT_INITIAL_PARAMS)

  const { data: contractList, isLoading } = useGetContractList(params)
  const { data: summary } = useGetContractSummary(true)
  const { mutateAsync: createContract, isPending: isCreating } =
    useCreateContract()

  const pageInfo = usePaginationInfo({
    data: contractList?.pageInfo,
    onPageChange: page => {
      updateParam("page", page)
    },
  })

  const handleRowClick = useCallback(
    (record: ContractListItem) => {
      // 목록 조건을 들고 간다 — 상세의 [목록]이 같은 탭·조건·페이지로 돌아온다
      navigate({
        pathname: `${CONTRACT_LIST_PATH}/${record.contractId}`,
        search: location.search,
      })
    },
    [navigate, location.search]
  )

  const handleTabChange = useCallback(
    (tab: ContractTab) => {
      updateParams({ tab, page: 1 })
    },
    [updateParams]
  )

  const handleSortChange = useCallback(
    (sort: ContractSortType) => {
      updateParams({ sort, page: 1 })
    },
    [updateParams]
  )

  const handleSizeChange = useCallback(
    (size: number) => {
      updateParams({ size, page: 1 })
    },
    [updateParams]
  )

  /*
    [+ 계약 작성]은 빈 초안을 먼저 만든다 — 임시저장(PUT)에 계약 ID와 버전이 필요해서다.
    계약번호는 여기서 붙지 않는다(검토 요청 시점에 부여).
  */
  const handleCreate = useCallback(async () => {
    if (isCreating) {
      return
    }
    const created = await createContract({})
    navigate(`${CONTRACT_LIST_PATH}/${created.contractId}`)
  }, [createContract, isCreating, navigate])

  const hasCondition =
    params.tab !== "ALL" ||
    !!params.keyword ||
    !!params.startDate ||
    !!params.endDate

  const emptyState = useMemo(
    () => (
      <ContractEmptyState
        hasCondition={hasCondition}
        tab={params.tab}
        keyword={params.keyword}
        onReset={reset}
        onGoConnections={() => navigate("/connections")}
      />
    ),
    [hasCondition, params.tab, params.keyword, reset, navigate]
  )

  return (
    <ListViewWrapper>
      {/* 셸이 아니라 화면이 제목을 그린다 — 설명 줄이 붙기 때문이다(MainLayout의 SELF_TITLED_PREFIXES) */}
      <div className="mb-4 shrink-0">
        <h1 className="text-[20px] font-semibold text-sz-n-900">계약 관리</h1>
        <p className="mt-0.5 text-[12px] text-sz-n-600">
          연결된 인플루언서와 공구 계약을 작성·검토 요청하고 서명 현황을
          관리합니다.
        </p>
      </div>

      <ContractStatusTabs
        tab={params.tab}
        onTabChange={handleTabChange}
        counts={summary?.tabCounts}
      />

      <ContractToolbar
        keyword={localParams.keyword}
        onKeywordChange={keyword => updateLocalParam("keyword", keyword)}
        startDate={localParams.startDate}
        endDate={localParams.endDate}
        onDateChange={(startDate, endDate) => {
          updateLocalParam("startDate", startDate)
          updateLocalParam("endDate", endDate)
        }}
        onSearch={update}
        onCreate={handleCreate}
        isCreating={isCreating}
      />

      <div className="flex flex-col overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
        <div className="flex shrink-0 items-center justify-between border-b border-sz-n-200 px-4 py-2.5">
          <span className="text-[12px] text-sz-n-600">
            총 <b className="text-sz-n-900">{pageInfo.totalResults}</b>건
          </span>

          <div className="flex items-center gap-2">
            <select
              aria-label="정렬"
              value={params.sort}
              onChange={event =>
                handleSortChange(event.target.value as ContractSortType)
              }
              style={SELECT_CHEVRON_STYLE}
              className="h-7 appearance-none rounded-[6px] border border-sz-n-300 bg-white py-0 pl-2 pr-[22px] text-[12px] text-sz-n-700 outline-none focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
            >
              {CONTRACT_SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              aria-label="표시 건수"
              value={params.size}
              onChange={event => handleSizeChange(Number(event.target.value))}
              style={SELECT_CHEVRON_STYLE}
              className="h-7 appearance-none rounded-[6px] border border-sz-n-300 bg-white py-0 pl-2 pr-[22px] text-[12px] text-sz-n-700 outline-none focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
            >
              {CONTRACT_PAGE_SIZES.map(size => (
                <option key={size} value={size}>
                  {size}건씩
                </option>
              ))}
            </select>
          </div>
        </div>

        <Table<ContractListItem, "contractId">
          rowKey="contractId"
          columns={CONTRACT_COLUMNS}
          data={contractList?.content ?? []}
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
    </ListViewWrapper>
  )
}
