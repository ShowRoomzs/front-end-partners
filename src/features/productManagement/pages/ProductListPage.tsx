import { confirm } from "@/common/components/ConfirmModal/confirm"
import ListViewWrapper from "@/common/components/ListViewWrapper/ListViewWrapper"
import Table from "@/common/components/Table/Table"
import type { Columns } from "@/common/components/Table/types"
import { usePaginationInfo } from "@/common/hooks/usePaginationInfo"
import { useParams } from "@/common/hooks/useParams"
import { queryClient } from "@/common/lib/queryClient"
import ProductStatusFilter from "@/features/productManagement/components/ProductStatusFilter/ProductStatusFilter"
import { PRODUCT_LIST_COLUMNS } from "@/features/productManagement/constants/columns"
import {
  DELETE_BLOCKED_TOOLTIP,
  PRODUCT_SORT_OPTIONS,
} from "@/features/productManagement/constants/params"
import { PRODUCT_QUERY_KEYS } from "@/features/productManagement/constants/queryKeys"
import { useGetProductList } from "@/features/productManagement/hooks/useGetProductList"
import {
  productService,
  type ProductDisplayStatus,
  type ProductGroupBuyStatus,
  type ProductItem,
  type ProductListParams,
  type ProductListSortType,
} from "@/features/productManagement/services/productService"
import { isDeleteBlocked } from "@/features/productManagement/utils/productPermission"
import { cn } from "@/lib/utils"
import { useCallback, useMemo } from "react"
import toast from "react-hot-toast"
import { useNavigate } from "react-router-dom"

const PAGE_SIZE_OPTIONS = [20, 50, 100]

const SELECT_CHEVRON_STYLE = {
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='9' height='5'><path d='M0 0L4.5 5L9 0Z' fill='%237B7F89'/></svg>\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 8px center",
}

const EMPTY_DISPLAY_COUNTS = {
  all: 0,
  display: 0,
  hidden: 0,
  pendingReview: 0,
  hideRequest: 0,
}

const EMPTY_GROUP_BUY_COUNTS = {
  all: 0,
  preparing: 0,
  ready: 0,
  inProgress: 0,
  notConnected: 0,
}

const INITIAL_PARAMS: ProductListParams = {
  displayStatus: null,
  groupBuyStatus: null,
  keyword: "",
  sortType: "CREATED_AT",
  page: 1,
  size: 20,
}

const ACTION_BUTTON_CLASS =
  "inline-flex h-7 items-center justify-center rounded-[6px] border border-sz-n-300 bg-white px-3.5 text-[11px] font-medium text-sz-n-700 hover:enabled:border-sz-n-400 hover:enabled:bg-sz-n-100"

export default function ProductListPage() {
  const navigate = useNavigate()
  const { params, localParams, update, updateParam, updateLocalParam, reset } =
    useParams<ProductListParams>(INITIAL_PARAMS)

  const { data: productList, isLoading } = useGetProductList(params)

  const displayCounts = productList?.displayStatusCounts ?? EMPTY_DISPLAY_COUNTS
  const groupBuyCounts =
    productList?.groupBuyStatusCounts ?? EMPTY_GROUP_BUY_COUNTS

  const pageInfo = usePaginationInfo({
    data: productList?.pageInfo,
    onPageChange: page => {
      updateParam("page", page)
    },
  })

  const handleClickRow = useCallback(
    (record: ProductItem) => {
      navigate(`/product/edit/${record.productId}`)
    },
    [navigate]
  )

  const handleClickDelete = useCallback(async (record: ProductItem) => {
    const result = await confirm({
      type: "warn",
      title: "상품 삭제",
      content: `${record.name} 상품을 삭제합니다.\n삭제한 상품은 목록·수정 화면 어디에서도 복구할 수 없습니다.\n\n이미 발생한 주문·정산 이력이 있어도 상품 정보 자체는 사라집니다. 계속하시겠습니까?`,
      confirmText: "삭제",
    })
    if (!result) {
      return
    }
    await productService.deleteProduct(record.productId)
    toast.success("상품을 삭제했습니다.")
    queryClient.invalidateQueries({
      queryKey: [PRODUCT_QUERY_KEYS.PRODUCT_LIST],
    })
  }, [])

  /** 관리 열은 행 클릭(수정 이동)과 충돌하므로 preventRowClick으로 분리한다 */
  const columns = useMemo<Columns<ProductItem>>(
    () => [
      ...PRODUCT_LIST_COLUMNS,
      {
        key: "productId",
        label: "관리",
        align: "center",
        width: 150,
        preventRowClick: true,
        render: (_value, record) => {
          // 삭제 차단은 공구 상태만으로 판단한다 — 진열 상태와 무관(§11-10)
          const deleteBlocked = isDeleteBlocked(record.groupBuyStatus)
          return (
            <div className="flex justify-center gap-1.5">
              <button
                type="button"
                onClick={() => handleClickRow(record)}
                className={ACTION_BUTTON_CLASS}
              >
                수정
              </button>
              <button
                type="button"
                disabled={deleteBlocked}
                title={deleteBlocked ? DELETE_BLOCKED_TOOLTIP : undefined}
                onClick={() => handleClickDelete(record)}
                className={cn(
                  ACTION_BUTTON_CLASS,
                  deleteBlocked
                    ? "cursor-not-allowed border-sz-n-200 bg-sz-n-100 text-sz-n-400"
                    : "text-sz-danger-text hover:enabled:border-sz-danger-text hover:enabled:bg-sz-danger-bg"
                )}
              >
                삭제
              </button>
            </div>
          )
        },
      },
    ],
    [handleClickDelete, handleClickRow]
  )

  return (
    <ListViewWrapper>
      <div className="mb-4 flex shrink-0 items-end justify-between">
        <div>
          <div className="text-[20px] font-semibold text-sz-n-900">
            상품 목록
          </div>
          <div className="mt-0.5 text-[12px] text-sz-n-600">
            등록된 상품을 확인하고 관리합니다.
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate("/product/register")}
          className="inline-flex h-8 items-center rounded-[6px] bg-sz-accent-500 px-3.5 text-[12px] font-medium text-white hover:bg-sz-accent-600"
        >
          + 상품 등록
        </button>
      </div>

      <ProductStatusFilter
        displayStatus={params.displayStatus}
        onDisplayStatusChange={(status: ProductDisplayStatus | null) =>
          updateParam("displayStatus", status)
        }
        displayCounts={displayCounts}
        groupBuyStatus={params.groupBuyStatus}
        onGroupBuyStatusChange={(status: ProductGroupBuyStatus | null) =>
          updateParam("groupBuyStatus", status)
        }
        groupBuyCounts={groupBuyCounts}
        keyword={localParams.keyword}
        onKeywordChange={keyword => updateLocalParam("keyword", keyword)}
        onSearch={update}
        onReset={reset}
      />

      <div className="flex flex-col overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
        <div className="flex shrink-0 items-center justify-between border-b border-sz-n-200 px-4 py-2.5">
          <span className="text-[12px] text-sz-n-600">
            총 <b className="text-sz-n-900">{pageInfo.totalResults}</b>건
          </span>
          <div className="flex items-center gap-2">
            <select
              value={params.sortType}
              onChange={event =>
                updateParam(
                  "sortType",
                  event.target.value as ProductListSortType
                )
              }
              style={SELECT_CHEVRON_STYLE}
              className="h-7 appearance-none rounded-[6px] border border-sz-n-300 bg-white pl-2 pr-[22px] text-[12px] text-sz-n-700 outline-none"
            >
              {PRODUCT_SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={params.size}
              onChange={event =>
                updateParam("size", Number(event.target.value))
              }
              style={SELECT_CHEVRON_STYLE}
              className="h-7 appearance-none rounded-[6px] border border-sz-n-300 bg-white pl-2 pr-[22px] text-[12px] text-sz-n-700 outline-none"
            >
              {PAGE_SIZE_OPTIONS.map(size => (
                <option key={size} value={size}>
                  {size}건
                </option>
              ))}
            </select>
          </div>
        </div>

        <Table<ProductItem, "productId">
          rowKey="productId"
          columns={columns}
          data={productList?.content ?? []}
          pageInfo={pageInfo}
          isLoading={isLoading}
          onRowClick={handleClickRow}
          bodyClassName="overflow-hidden whitespace-nowrap"
          headerClassName="whitespace-nowrap"
        />
      </div>
    </ListViewWrapper>
  )
}
