import ListViewWrapper from "@/common/components/ListViewWrapper/ListViewWrapper"
import Table from "@/common/components/Table/Table"
import { usePaginationInfo } from "@/common/hooks/usePaginationInfo"
import { useParams } from "@/common/hooks/useParams"
import InquiryFilterPanel from "@/features/productInquiry/components/InquiryFilterPanel/InquiryFilterPanel"
import InquiryStatusTabs from "@/features/productInquiry/components/InquiryStatusTabs/InquiryStatusTabs"
import { PRODUCT_INQUIRY_COLUMNS } from "@/features/productInquiry/constants/columns"
import {
  INQUIRY_EMPTY_COUNTS,
  INQUIRY_INITIAL_PARAMS,
  INQUIRY_PAGE_SIZES,
  INQUIRY_SORT_OPTIONS,
  SELECT_CHEVRON_STYLE,
} from "@/features/productInquiry/constants/params"
import { useGetProductInquiryList } from "@/features/productInquiry/hooks/useGetProductInquiryList"
import type {
  InquirySort,
  InquiryStatusFilter,
  InquiryVisibility,
  ProductInquiryListItem,
  ProductInquiryListParams,
  ProductInquiryTypeCode,
} from "@/features/productInquiry/types"
import { useCallback, useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"

export const INQUIRY_LIST_PATH = "/inquiry/product"

/** 켜져 있으면 끄고, 꺼져 있으면 켠다 — 다중선택 축의 토글 */
function toggle<T extends string>(list: Array<T>, code: T): Array<T> {
  return list.includes(code)
    ? list.filter(item => item !== code)
    : [...list, code]
}

/**
 * A1~A3 — 상품 문의 목록(파트너센터).
 *
 * 어드민의 모니터링 화면과 짝을 이루지만 주체가 다르다. 여기서 브랜드는 **답변하는
 * 쪽**이고, 삭제는 요청까지만 할 수 있다. 그래서 목록에 관리 열이 없다.
 * 상태값·색·컬럼은 어드민(§18)을 정본으로 따른다 — 같은 상태가 서피스마다 다른 색이면
 * 3서피스를 오가는 운영 소통에서 혼선이 생긴다.
 */
export default function ProductInquiryListPage() {
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
  } = useParams<ProductInquiryListParams>(INQUIRY_INITIAL_PARAMS)

  const { data: inquiryList, isLoading } = useGetProductInquiryList(params)

  const counts = inquiryList?.statusCounts ?? INQUIRY_EMPTY_COUNTS

  const pageInfo = usePaginationInfo({
    data: inquiryList?.pageInfo,
    onPageChange: page => {
      updateParam("page", page)
    },
  })

  const handleRowClick = useCallback(
    (record: ProductInquiryListItem) => {
      /*
        목록 쿼리스트링을 그대로 들고 간다. 상세는 이 조건으로 이전/다음을 계산하고
        목록 버튼은 같은 탭·필터·페이지로 되돌아온다.
      */
      navigate({
        pathname: `${INQUIRY_LIST_PATH}/${record.inquiryId}`,
        search: location.search,
      })
    },
    [navigate, location.search]
  )

  // 조건을 바꾸면 페이지도 1로 — 3페이지에서 건수 적은 조건으로 옮기면 빈 목록이 뜬다
  const handleStatusChange = useCallback(
    (status: InquiryStatusFilter) => {
      updateParams({ status, page: 1 })
    },
    [updateParams]
  )

  const handleToggleType = useCallback(
    (code: string) => {
      updateParams({
        types: toggle(params.types, code as ProductInquiryTypeCode),
        page: 1,
      })
    },
    [params.types, updateParams]
  )

  const handleToggleVisibility = useCallback(
    (code: string) => {
      updateParams({
        visibilities: toggle(params.visibilities, code as InquiryVisibility),
        page: 1,
      })
    },
    [params.visibilities, updateParams]
  )

  const handleSortChange = useCallback(
    (sort: InquirySort) => {
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

  const hasCondition =
    !!params.keyword ||
    params.types.length > 0 ||
    params.visibilities.length > 0

  /*
    빈 상태는 두 가지다 — 조건이 빗나간 것과 아직 아무 문의도 없는 것.
    어느 쪽에도 CTA를 두지 않는다. 문의는 소비자가 만드는 것이라 브랜드가 이 화면에서
    시작할 수 있는 일이 없다(§23-2).
  */
  const emptyState = useMemo(
    () =>
      hasCondition ? (
        <div className="px-6 py-[72px] text-center">
          <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
            검색 결과가 없습니다
          </div>
          <div className="text-[12px] text-sz-n-500">
            검색어를 바꾸거나 필터를 초기화해 보세요.
          </div>
        </div>
      ) : (
        <div className="px-6 py-[72px] text-center">
          <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
            아직 등록된 문의가 없습니다
          </div>
          <div className="text-[12px] text-sz-n-500">
            소비자가 상품 상세에서 문의를 남기면 여기에 표시됩니다.
          </div>
        </div>
      ),
    [hasCondition]
  )

  return (
    <ListViewWrapper>
      {/*
        셸이 아니라 화면이 제목을 그린다 — GNB 라벨(문의 관리)과 화면 이름(상품 문의)이
        다르고 설명 줄이 붙기 때문이다(MainLayout의 SELF_TITLED_PREFIXES).
      */}
      <div className="mb-4 shrink-0">
        <h1 className="text-[20px] font-semibold text-sz-n-900">상품 문의</h1>
        <p className="mt-0.5 text-[12px] text-sz-n-600">
          소비자가 상품 상세에서 남긴 문의에 답변합니다.
        </p>
      </div>

      <InquiryStatusTabs
        status={params.status}
        onStatusChange={handleStatusChange}
        counts={counts}
      />

      <InquiryFilterPanel
        typeItems={inquiryList?.typeCounts ?? []}
        selectedTypes={params.types}
        onToggleType={handleToggleType}
        visibilityItems={inquiryList?.visibilityCounts ?? []}
        selectedVisibilities={params.visibilities}
        onToggleVisibility={handleToggleVisibility}
        keyword={localParams.keyword}
        onKeywordChange={keyword => updateLocalParam("keyword", keyword)}
        onSearch={update}
        onReset={reset}
      />

      <div className="flex flex-col overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
        <div className="flex shrink-0 items-center justify-between border-b border-sz-n-200 px-4 py-2.5">
          <span className="text-[12px] text-sz-n-600">
            총 <b className="text-sz-n-900">{pageInfo.totalResults}</b>건
            {/*
              답변대기는 마켓 전체 기준이라 탭·필터를 걸어도 값이 흔들리지 않는다 —
              "지금 내가 답해야 할 총량"이라 지금 보고 있는 범위와는 무관해야 한다.
              0건이면 문구 자체를 붙이지 않는다.
            */}
            {!!inquiryList?.waitingCount && (
              <>
                {" · 답변대기 "}
                <b className="text-sz-n-900">{inquiryList.waitingCount}</b>건
              </>
            )}
          </span>

          <div className="flex items-center gap-2">
            <select
              aria-label="정렬"
              value={params.sort}
              onChange={event =>
                handleSortChange(event.target.value as InquirySort)
              }
              style={SELECT_CHEVRON_STYLE}
              className="h-7 appearance-none rounded-[6px] border border-sz-n-300 bg-white py-0 pl-2 pr-[22px] text-[12px] text-sz-n-700 outline-none focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
            >
              {INQUIRY_SORT_OPTIONS.map(option => (
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
              {INQUIRY_PAGE_SIZES.map(size => (
                <option key={size} value={size}>
                  {size}건씩
                </option>
              ))}
            </select>
          </div>
        </div>

        <Table<ProductInquiryListItem, "inquiryId">
          rowKey="inquiryId"
          columns={PRODUCT_INQUIRY_COLUMNS}
          data={inquiryList?.content ?? []}
          pageInfo={pageInfo}
          isLoading={isLoading}
          onRowClick={handleRowClick}
          emptyState={emptyState}
          fitWidth
          bodyClassName="overflow-hidden whitespace-nowrap"
          headerClassName="whitespace-nowrap"
        />
      </div>
    </ListViewWrapper>
  )
}
