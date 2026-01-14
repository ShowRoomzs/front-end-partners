import Table from "@/common/components/Table/Table"
import { PRODUCT_LIST_COLUMNS } from "@/features/productManagement/constants/columns"
import ListViewWrapper from "@/common/components/ListViewWrapper/ListViewWrapper"
import FilterCard from "@/common/components/FilterCard/FilterCard"
import { PRODUCT_LIST_FILTER_OPTIONS } from "@/features/productManagement/constants/filter"
import { useParams } from "@/common/hooks/useParams"
import {
  productService,
  type ProductItem,
  type ProductListParams,
} from "@/features/productManagement/services/productService"
import { useGetProductList } from "@/features/productManagement/hooks/useGetProductList"
import { usePaginationInfo } from "@/common/hooks/usePaginationInfo"
import { useCallback, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import ButtonGroup from "@/common/components/ButtonGroup/ButtonGroup"
import toast from "react-hot-toast"
import { queryClient } from "@/common/lib/queryClient"
import { confirm } from "@/common/components/ConfirmModal/confirm"
import { PRODUCT_QUERY_KEYS } from "@/features/productManagement/constants/queryKeys"
import { useNavigate } from "react-router-dom"

const INITIAL_PARAMS: ProductListParams = {
  categoryId: undefined,
  displayStatus: "ALL",
  stockStatus: "ALL",
  page: 1,
  size: 10,
  keywordType: null,
  keyword: "",
}
export default function ProductListPage() {
  const [checkedKeys, setCheckedKeys] = useState<
    Array<ProductItem["productId"]>
  >([])

  const { localParams, updateLocalParam, params, update, reset, updateParam } =
    useParams<ProductListParams>(INITIAL_PARAMS)
  const { data: productList, isLoading } = useGetProductList(params)
  const navigate = useNavigate()
  const handlePageChange = useCallback(
    (page: number) => {
      setCheckedKeys([])
      updateParam("page", page)
    },
    [updateParam]
  )

  const pageInfo = usePaginationInfo({
    data: productList?.pageInfo,
    onPageChange: handlePageChange,
  })

  const handleCheckedKeysChange = useCallback(
    (newCheckedKeys: Array<ProductItem["productId"]>) => {
      setCheckedKeys(newCheckedKeys)
    },
    []
  )

  const handleSubmit = useCallback(() => {
    update()
    setCheckedKeys([])
  }, [update])

  const hasCheckedKeys = useMemo(() => checkedKeys.length > 0, [checkedKeys])

  const cleanUp = useCallback(async () => {
    queryClient.invalidateQueries({
      queryKey: [PRODUCT_QUERY_KEYS.PRODUCT_LIST],
    })
    setCheckedKeys([])
  }, [])

  const handleClickDelete = useCallback(
    async (productIds: Array<ProductItem["productId"]>) => {
      const result = await confirm({
        type: "warn",
        title: "상품 삭제",
        content: "선택한 상품을 삭제하시겠습니까?",
      })
      if (result) {
        await productService.deleteProducts(productIds)
        toast.success("상품 삭제 완료")
        cleanUp()
      }
    },
    [cleanUp]
  )

  const handleClickUpdateDisplayStatus = useCallback(
    async (
      productIds: Array<ProductItem["productId"]>,
      isDisplayed: boolean
    ) => {
      const displayStatus = isDisplayed ? "진열" : "미진열"
      const result = await confirm({
        title: `상품 ${displayStatus}처리`,
        content: `선택한 상품을 ${displayStatus} 처리하시겠습니까?`,
      })
      if (result) {
        await productService.updateProductDisplayStatus(productIds, isDisplayed)
        toast.success("상품 진열상태 업데이트 완료")
        cleanUp()
      }
    },
    [cleanUp]
  )

  const handleClickUpdateStockStatus = useCallback(
    async (
      productIds: Array<ProductItem["productId"]>,
      isOutOfStocked: boolean
    ) => {
      const stockStatus = isOutOfStocked ? "품절" : "품절 아님"
      const result = await confirm({
        title: `상품 ${stockStatus}처리`,
        content: `선택한 상품을 ${stockStatus} 처리하시겠습니까?`,
      })
      if (result) {
        await productService.updateProductStockStatus(
          productIds,
          isOutOfStocked
        )
        toast.success("상품 품절상태 업데이트 완료")
        cleanUp()
      }
    },
    [cleanUp]
  )

  const handleClickRow = useCallback(
    (record: ProductItem) => {
      navigate(`/product/edit/${record.productId}`)
    },
    [navigate]
  )

  return (
    <ListViewWrapper>
      <FilterCard
        options={PRODUCT_LIST_FILTER_OPTIONS}
        params={localParams}
        onChange={updateLocalParam}
        onSubmit={handleSubmit}
        onReset={reset}
      />
      <Table<ProductItem, "productId">
        onCheckedKeysChange={handleCheckedKeysChange}
        checkedKeys={checkedKeys}
        pageInfo={pageInfo}
        rowKey="productId"
        columns={PRODUCT_LIST_COLUMNS}
        showCheckbox
        data={productList?.content ?? []}
        isLoading={isLoading}
        onRowClick={handleClickRow}
        renderFooter={
          <div className="flex flex-row gap-4">
            <Button
              onClick={() => handleClickDelete(checkedKeys)}
              disabled={!hasCheckedKeys}
              variant="outline"
            >
              상품 삭제
            </Button>
            <ButtonGroup>
              <Button
                onClick={() => handleClickUpdateStockStatus(checkedKeys, true)}
                disabled={!hasCheckedKeys}
                variant="outline"
              >
                품절 처리
              </Button>
              <Button
                onClick={() => handleClickUpdateStockStatus(checkedKeys, false)}
                disabled={!hasCheckedKeys}
                variant="outline"
              >
                품절 취소
              </Button>
            </ButtonGroup>
            <ButtonGroup>
              <Button
                onClick={() =>
                  handleClickUpdateDisplayStatus(checkedKeys, true)
                }
                disabled={!hasCheckedKeys}
                variant="outline"
              >
                진열 처리
              </Button>
              <Button
                onClick={() =>
                  handleClickUpdateDisplayStatus(checkedKeys, false)
                }
                disabled={!hasCheckedKeys}
                variant="outline"
              >
                미진열 처리
              </Button>
            </ButtonGroup>
          </div>
        }
      />
    </ListViewWrapper>
  )
}
