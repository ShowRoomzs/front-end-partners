import { apiInstance } from "@/common/lib/apiInstance"
import type { BaseParams } from "@/common/types/page"
import type {
  PRODUCT_LIST_IS_DISPLAY_TYPE,
  PRODUCT_LIST_IS_OUT_OF_STOCK_TYPE,
  PRODUCT_LIST_KEYWORD_TYPE,
} from "@/features/productManagement/constants/params"

interface ProductNotice {
  origin: string
  material: string
  color: string
  size: string
  manufacturer: string
  washingMethod: string
  manufactureDate: string
  asInfo: string
  qualityAssurance: string
}
type OptionName = string

interface OptionGroupItem {
  name: OptionName
  options: Array<string>
}

interface VariantItem {
  optionNames: Array<OptionName>
  salePrice: number
  stock: number
  isDisplay: boolean
  isRepresentative: boolean
}

interface AddProductRequest {
  isDisplay: boolean // 진열 여부
  isOutOfStockForced: boolean // 강제 품절 처리
  categoryId: number // 카테고리 id
  name: string
  sellerProductCode: string // 판매자 상품코드
  purchasePrice: number // 매입가
  regularPrice: number // 판매가(할인전)
  salePrice: number // 할인 판매가(최종가)
  isDiscount: boolean // 할인 여부
  representativeImageUrl: string // 대표 이미지 url
  coverImageUrls: Array<string> // 커버 이미지 url
  description: string // 상품 상세 (html 형태)
  productNotice: ProductNotice // 상품 정보
  optionGroups: Array<OptionGroupItem>
  variants: Array<VariantItem>

  tags?: Array<string> // 태그(추후 개발)
  deliveryType?: string // 배송 유형 (TODO : 추후 타입 정의 필요)
  deliveryFee?: number
  deliveryFreeThreshold?: number
  deliveryEstimatedDays?: number
}

// null은 전체 조회
type ProductListIsDisplayType = keyof typeof PRODUCT_LIST_IS_DISPLAY_TYPE
type ProductListIsOutOfStockType =
  keyof typeof PRODUCT_LIST_IS_OUT_OF_STOCK_TYPE
type ProductListKeywordType = keyof typeof PRODUCT_LIST_KEYWORD_TYPE
export interface ProductListParams extends BaseParams {
  categoryId: number | null
  isDisplay: ProductListIsDisplayType
  isOutOfStock: ProductListIsOutOfStockType
  keyword: string
  keywordType: ProductListKeywordType
}

export type { AddProductRequest, ProductNotice, OptionGroupItem, VariantItem }

export const productService = {
  addProduct: async (data: AddProductRequest) => {
    const { data: response } = await apiInstance.post("/seller/products", data)

    return response
  },
  getProductList: async (params: ProductListParams) => {},
}
