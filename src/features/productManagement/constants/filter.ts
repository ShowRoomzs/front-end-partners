import type { FilterOptionGroup } from "@/common/components/FilterCard/FilterCard"
import { parseMapToOptions } from "@/common/utils/parseMapToOptions"
import {
  PRODUCT_LIST_IS_DISPLAY_TYPE,
  PRODUCT_LIST_IS_OUT_OF_STOCK_TYPE,
  PRODUCT_LIST_KEYWORD_TYPE,
} from "@/features/productManagement/constants/params"
import type { ProductListParams } from "@/features/productManagement/services/productService"

export const PRODUCT_LIST_FILTER_OPTIONS: FilterOptionGroup<ProductListParams> =
  {
    카테고리: [
      {
        type: "category",
        key: "categoryId",
      },
    ],
    "진열 여부": [
      {
        type: "radio",
        key: "displayStatus",
        options: parseMapToOptions(PRODUCT_LIST_IS_DISPLAY_TYPE),
      },
    ],
    "품절 여부": [
      {
        type: "radio",
        key: "stockStatus",
        options: parseMapToOptions(PRODUCT_LIST_IS_OUT_OF_STOCK_TYPE),
      },
    ],
    검색어: [
      {
        type: "select",
        key: "keywordType",
        options: parseMapToOptions(PRODUCT_LIST_KEYWORD_TYPE, true),
      },
      {
        type: "input",
        key: "keyword",
        placeholder: "검색어를 입력하세요",
      },
    ],
  }
