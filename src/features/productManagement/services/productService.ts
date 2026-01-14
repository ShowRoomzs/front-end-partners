import { apiInstance } from "@/common/lib/apiInstance"
import type { BaseParams, PageResponse } from "@/common/types/page"
import type {
  PRODUCT_LIST_IS_DISPLAY_TYPE,
  PRODUCT_LIST_IS_OUT_OF_STOCK_TYPE,
  PRODUCT_LIST_KEYWORD_TYPE,
} from "@/features/productManagement/constants/params"

export interface ProductNotice {
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

export interface OptionGroupItem {
  name: OptionName
  options: Array<{ name: string; price: number }>
}

export interface VariantItem {
  optionNames: Array<OptionName>
  salePrice: number
  stock: number
  isDisplay: boolean
  isRepresentative: boolean
}
export type DeliveryType = string // TODO : 추후 타입 정의 필요
export interface AddProductRequest {
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
  deliveryType?: DeliveryType // 배송 유형
  deliveryFee?: number
  deliveryFreeThreshold?: number
  deliveryEstimatedDays?: number
}

export interface OptionGroupResponse {
  name: string
  optionGroupId: number
  options: Array<{ optionId: number; name: string; price: number }>
}
export interface VariantResponse {
  isRepresentative: boolean
  isDisplay: boolean
  name: string
  optionIds: Array<number>
  regularPrice: number
  salePrice: number
  stock: number
  variantId: number
}

interface ProductDetailResponse {
  productId: number
  productNumber: string
  marketId: number
  marketName: string
  categoryId: number
  categoryName: string
  name: string
  sellerProductCode: string
  representativeImageUrl: string
  coverImageUrls: Array<string>
  regularPrice: number
  salePrice: number
  purchasePrice: number
  isDisplay: boolean
  isOutOfStockForced: boolean
  isRecommended: boolean
  productNotice: string // json 형태 string
  description: string // html 형태 string
  tags: string // array 형태 string
  deliveryType: DeliveryType
  deliveryFee: number
  deliveryFreeThreshold: number
  deliveryEstimatedDays: number
  createdAt: string
  optionGroups: Array<OptionGroupResponse>
  variants: Array<VariantResponse>
}
// null은 전체 조회
type ProductListIsDisplayType = keyof typeof PRODUCT_LIST_IS_DISPLAY_TYPE
type ProductListIsOutOfStockType =
  keyof typeof PRODUCT_LIST_IS_OUT_OF_STOCK_TYPE
type ProductListKeywordType = keyof typeof PRODUCT_LIST_KEYWORD_TYPE | null // null은 전체 조회
export interface ProductListParams extends BaseParams {
  categoryId?: number
  displayStatus: ProductListIsDisplayType
  stockStatus: ProductListIsOutOfStockType
  keyword: string
  keywordType: ProductListKeywordType
}

export interface ProductItem {
  productId: number
  productNumber: string
  sellerProductCode: string
  thumbnailUrl: string
  name: string
  price: {
    purchasePrice: number
    regularPrice: number
    salePrice: number
  }
  createdAt: string
  displayStatus: ProductListIsDisplayType
  stockStatus: ProductListIsOutOfStockType
  isOutOfStockForced: boolean
}

export type ProductListResponse = PageResponse<ProductItem>

export const productService = {
  addProduct: async (data: AddProductRequest) => {
    const { data: response } = await apiInstance.post("/seller/products", data)

    return response
  },
  updateProduct: async (productId: number, data: AddProductRequest) => {
    const { data: response } = await apiInstance.put(
      `/seller/products/${productId}`,
      data
    )

    return response
  },
  getProductList: async (params: ProductListParams) => {
    const { data: response } = await apiInstance.get<ProductListResponse>(
      "/seller/products",
      {
        params,
      }
    )

    return response
  },
  deleteProducts: async (productIds: Array<ProductItem["productId"]>) => {
    const { data: response } = await apiInstance.delete("/seller/products", {
      data: {
        productIds,
      },
    })

    return response
  },
  updateProductDisplayStatus: async (
    productIds: Array<ProductItem["productId"]>,
    isDisplayed: boolean
  ) => {
    const { data: response } = await apiInstance.post(
      "/seller/products/batch/display-status",
      {
        productIds,
        isDisplayed,
      }
    )

    return response
  },
  updateProductStockStatus: async (
    productIds: Array<ProductItem["productId"]>,
    isOutOfStocked: boolean
  ) => {
    const { data: response } = await apiInstance.post(
      "/seller/products/batch/stock-status",
      {
        productIds,
        isOutOfStocked,
      }
    )

    return response
  },
  getProductDetail: async (productId: number) => {
    const { data: response } = await apiInstance.get<ProductDetailResponse>(
      `/seller/products/${productId}`
    )

    return response
  },
}
