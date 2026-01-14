import Image from "@/common/components/Image/Image"
import type { Columns } from "@/common/components/Table/types"
import { formatDate } from "@/common/utils/formatDate"
import {
  PRODUCT_LIST_IS_DISPLAY_TYPE,
  PRODUCT_LIST_IS_OUT_OF_STOCK_TYPE,
} from "@/features/productManagement/constants/params"
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
    align: "center",
    render: (value, record: ProductItem) => {
      return (
        <Image
          src={value as string}
          alt={record.name}
          className="w-10 h-10"
          showPreview
        />
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
      return (
        <span>
          {(value as ProductItem["price"]).regularPrice.toLocaleString()}원
        </span>
      )
    },
  },
  {
    key: "price",
    label: "할인 판매가",
    render: value => {
      return (
        <span>
          {(value as ProductItem["price"]).salePrice.toLocaleString()}원
        </span>
      )
    },
  },
  {
    key: "createdAt",
    label: "등록일",
    render: value => formatDate(new Date(value as string)),
  },
  {
    key: "stockStatus",
    label: "품절상태",
    align: "center",
    render: value =>
      PRODUCT_LIST_IS_OUT_OF_STOCK_TYPE[
        value as keyof typeof PRODUCT_LIST_IS_OUT_OF_STOCK_TYPE
      ],
  },
  {
    key: "displayStatus",
    label: "판매상태",
    align: "center",
    render: value =>
      PRODUCT_LIST_IS_DISPLAY_TYPE[
        value as keyof typeof PRODUCT_LIST_IS_DISPLAY_TYPE
      ],
  },
]
