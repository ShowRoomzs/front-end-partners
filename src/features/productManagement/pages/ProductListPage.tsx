import Table from "@/common/components/Table/Table"
import { PRODUCT_LIST_COLUMNS } from "@/features/productManagement/constants/columns"
import ListViewWrapper from "@/common/components/ListViewWrapper/ListViewWrapper"
import FilterCard from "@/common/components/FilterCard/FilterCard"
import { PRODUCT_LIST_FILTER_OPTIONS } from "@/features/productManagement/constants/filter"
import { useParams } from "@/common/hooks/useParams"
import type {
  ProductItem,
  ProductListParams,
} from "@/features/productManagement/services/productService"
import { useGetProductList } from "@/features/productManagement/hooks/useGetProductList"
import { usePaginationInfo } from "@/common/hooks/usePaginationInfo"
import { useCallback, useState } from "react"

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
      />
    </ListViewWrapper>
  )
}
