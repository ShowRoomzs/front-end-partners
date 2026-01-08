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
  page: 0,
  size: 10,
  keywordType: "ALL",
  keyword: "",
}
export default function ProductListPage() {
  const { localParams, updateLocalParam, params, update, reset } =
    useParams<ProductListParams>(INITIAL_PARAMS)
  const { data: productList, isLoading } = useGetProductList(params)
  const pageInfo = usePaginationInfo({ data: productList?.pageInfo })
  const [checkedKeys, setCheckedKeys] = useState<
    Array<ProductItem["productId"]>
  >([])

  const handleCheckedKeysChange = useCallback(
    (newCheckedKeys: Array<ProductItem["productId"]>) => {
      setCheckedKeys(newCheckedKeys)
    },
    []
  )

  return (
    <ListViewWrapper>
      <FilterCard
        options={PRODUCT_LIST_FILTER_OPTIONS}
        params={localParams}
        onChange={updateLocalParam}
        onSubmit={update}
        onReset={reset}
      />
      <Table<ProductItem, "productId">
        onCheckedKeysChange={handleCheckedKeysChange}
        checkedKeys={checkedKeys}
        pageInfo={pageInfo}
        columns={PRODUCT_LIST_COLUMNS}
        showCheckbox
        data={productList?.content ?? []}
        isLoading={isLoading}
      />
    </ListViewWrapper>
  )
}
