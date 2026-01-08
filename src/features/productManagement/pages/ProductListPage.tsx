import Table from "@/common/components/Table/Table"
import { PRODUCT_LIST_COLUMNS } from "@/features/productManagement/constants/columns"
import ListViewWrapper from "@/common/components/ListViewWrapper/ListViewWrapper"
import FilterCard from "@/common/components/FilterCard/FilterCard"
import { PRODUCT_LIST_FILTER_OPTIONS } from "@/features/productManagement/constants/filter"
import { useParams } from "@/common/hooks/useParams"
import type { ProductListParams } from "@/features/productManagement/services/productService"

const INITIAL_PARAMS: ProductListParams = {
  categoryId: null,
  isDisplay: "ALL",
  isOutOfStock: "ALL",
  page: 1,
  size: 10,
  sortBy: "createdAt",
  sortOrder: "desc",
  keywordType: "ALL",
  keyword: "",
}
export default function ProductListPage() {
  const { localParams, updateLocalParam, update, reset } =
    useParams<ProductListParams>(INITIAL_PARAMS)

  return (
    <ListViewWrapper>
      <FilterCard
        options={PRODUCT_LIST_FILTER_OPTIONS}
        params={localParams}
        onChange={updateLocalParam}
        onSubmit={update}
        onReset={reset}
      />
      <Table
        pageInfo={{
          page: 0,
          size: 10,
          totalElements: 100,
          totalPages: 10,
          onPageChange: () => {
            console.log("page change")
          },
        }}
        columns={PRODUCT_LIST_COLUMNS}
        showCheckbox
        data={[
          {
            id: "1",
            name: "Product 1",
            price: 10000,
            stock: 100,
            display: true,
            stockStatus: "in-stock",
            displayStatus: "display",
            category: "Category 1",
            createdAt: "2021-01-01",
          },
        ]}
      />
    </ListViewWrapper>
  )
}
