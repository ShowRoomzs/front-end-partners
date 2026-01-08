import type { Columns } from "@/common/components/Table/types"
import type { ProductItem } from "@/features/productManagement/services/productService"

export const PRODUCT_LIST_COLUMNS: Columns<ProductItem> = [
  {
    key: "productNumber",
    label: "상품 번호",
  },
  {
    key: "sellerProductCode",
    label: "판매자 상품 코드",
  },
  {
    key: "thumbnailUrl",
    label: "대표 이미지",
    render: (value, record: ProductItem) => {
      return (
        <img src={value as string} alt={record.name} className="w-10 h-10" />
      )
    },
  },
  {
    key: "name",
    label: "상품명",
  },
  {
    key: "price",
    label: "판매가",
    render: value => {
      return <span>{(value as ProductItem["price"]).regularPrice}</span>
    },
  },
  {
    key: "price",
    label: "할인 판매가",
    render: value => {
      return <span>{(value as ProductItem["price"]).salePrice}</span>
    },
  },
  {
    key: "createdAt",
    label: "등록일",
  },
  {
    key: "isOutOfStockForced",
    label: "품절상태",
  },
  {
    key: "displayStatus",
    label: "판매상태",
  },
]
