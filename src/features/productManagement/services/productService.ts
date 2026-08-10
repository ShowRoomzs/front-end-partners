import { apiInstance } from "@/common/lib/apiInstance"
import type { BaseParams, PageInfo } from "@/common/types/page"

/**
 * 진열 상태 — 백엔드 ProductDisplayStatus와 1:1.
 * **브랜드는 이 값을 바꿀 수 없다**(운영자 전용, 기능요구사항 §11-2). 조회 전용이다.
 */
export type ProductDisplayStatus =
  | "DISPLAY"
  | "HIDDEN"
  | "PENDING_REVIEW"
  | "HIDE_REQUEST"

/** 공구 상태 — 백엔드 ProductGroupBuyStatus와 1:1 */
export type ProductGroupBuyStatus =
  | "PREPARING"
  | "READY"
  | "IN_PROGRESS"
  | "NOT_CONNECTED"

/** 미진열 사유 — 백엔드 ProductHideReasonType과 1:1 */
export type ProductHideReasonType =
  | "PRODUCT_NOTICE_ERROR"
  | "AD_DISPLAY_VIOLATION"
  | "BRAND_REQUEST"
  | "OTHER"

export type ProductListSortType = "CREATED_AT" | "MODIFIED_AT" | "STOCK_ASC"

/**
 * 상품정보제공고시 — **화장품 카테고리 고정 11필드**.
 * 백엔드 ProductDto.ProductNoticeRequest와 필드명이 정확히 일치해야 한다.
 */
export interface ProductNotice {
  capacityWeight: string
  mainSpecs: string
  expirationPeriod: string
  usageMethod: string
  manufacturerSeller: string
  origin: string
  ingredients: string
  functionalCosmeticApproval: string
  precautions: string
  qualityAssurance: string
  customerServicePhone: string
}

export interface OptionGroupItem {
  name: string
  options: Array<{ name: string; price: number }>
}

/** 옵션 조합(SKU) 등록·수정 요청 — regularPrice는 **옵션가가 포함된** 판매가다 */
export interface VariantItem {
  optionNames: Array<string>
  regularPrice: number
  stock: number
  isRepresentative: boolean
}

/** 백엔드 ProductDto.CreateProductRequest와 1:1 */
export interface AddProductRequest {
  categoryId: number
  name: string
  sellerProductCode?: string
  regularPrice: number
  representativeImageUrl: string
  coverImageUrls: Array<string>
  description: string
  productNotice: ProductNotice
  /** 옵션을 안 쓸 때만 — variants를 안 보내면 이 값으로 단일 재고 상품이 만들어진다 */
  stock?: number
  optionGroups?: Array<OptionGroupItem>
  variants?: Array<VariantItem>
}

/** 수정은 등록과 같은 필드 구성이다(백엔드 UpdateProductRequest) */
export type UpdateProductRequest = AddProductRequest

export interface OptionGroupResponse {
  optionGroupId: number
  name: string
  options: Array<{ optionId: number; name: string; price: number }>
}

export interface VariantResponse {
  variantId: number
  name: string
  regularPrice: number
  stock: number
  isRepresentative: boolean
  optionIds: Array<number>
}

export type ProductProcessingHistoryType =
  | "PRODUCT_CREATED"
  | "PRODUCT_INFO_UPDATED"
  | "STOCK_UPDATED"
  | "HIDDEN"
  | "REDISPLAYED"
  | "HIDE_REQUESTED"
  | "PENDING_REVIEW"

export interface HideReason {
  reasonType: ProductHideReasonType
  reasonDescription: string
  detail: string | null
}

/** 처리 이력 — `title`은 서버가 채워 내려주므로 프론트에서 라벨을 만들지 않는다 */
export interface ProductHistoryItem {
  historyId: number
  historyType: ProductProcessingHistoryType
  title: string
  previousDisplayStatus: ProductDisplayStatus | null
  newDisplayStatus: ProductDisplayStatus | null
  hideReason: HideReason | null
  stockQuantity: number | null
  processorName: string | null
  createdAt: string
}

/** 최근 미진열 정보 — 미진열 사유 패널의 데이터 출처 */
export interface LatestHideInfo {
  hideReasonType: ProductHideReasonType
  hideReasonDescription: string
  hideDetail: string | null
  hiddenAt: string
  processorName: string | null
}

/** 백엔드 ProductDto.ProductDetailResponse와 1:1 */
export interface ProductDetailResponse {
  productId: number
  productNumber: string
  marketId: number
  marketName: string
  categoryId: number
  categoryName: string
  name: string
  sellerProductCode: string | null
  representativeImageUrl: string | null
  coverImageUrls: Array<string> | null
  regularPrice: number
  displayStatus: ProductDisplayStatus
  groupBuyStatus: ProductGroupBuyStatus
  latestHideInfo: LatestHideInfo | null
  isRecommended: boolean
  /** JSON 문자열 — parseProductNotice()로 판다 */
  productNotice: string | null
  description: string | null
  createdAt: string
  optionGroups: Array<OptionGroupResponse> | null
  variants: Array<VariantResponse> | null
  processingHistory: Array<ProductHistoryItem> | null
}

/**
 * 목록 검색 조건 — 백엔드 SellerProductSearchCondition + PagingRequest.
 *
 * 진열·공구 상태는 각각 **단일값**이다. 화면은 체크박스지만 한 축에 하나만 켜진다 —
 * 서버·화면 모두 단일선택으로 합의된 상태다(ProductStatusFilter 주석 참고).
 */
export interface ProductListParams extends BaseParams {
  displayStatus: ProductDisplayStatus | null
  groupBuyStatus: ProductGroupBuyStatus | null
  /** 상품명·브랜드상품코드 부분 일치 */
  keyword: string
  sortType: ProductListSortType
}

export interface DisplayStatusCounts {
  all: number
  display: number
  hidden: number
  pendingReview: number
  hideRequest: number
}

export interface GroupBuyStatusCounts {
  all: number
  preparing: number
  ready: number
  inProgress: number
  notConnected: number
}

/** 목록 행 — 백엔드 ProductDto.ProductListItem과 1:1 */
export interface ProductItem {
  productId: number
  productNumber: string
  sellerProductCode: string | null
  thumbnailUrl: string | null
  name: string
  regularPrice: number
  createdAt: string
  modifiedAt: string | null
  displayStatus: ProductDisplayStatus
  groupBuyStatus: ProductGroupBuyStatus
  /** 옵션 재고 합계. 0이면 품절 배지 */
  stock: number | null
}

export interface ProductListResponse {
  content: Array<ProductItem>
  pageInfo: PageInfo
  displayStatusCounts: DisplayStatusCounts
  groupBuyStatusCounts: GroupBuyStatusCounts
}

/** 화장품 고시 11필드의 기본값 — 미입력 방지용 플레이스홀더 */
export const DEFAULT_PRODUCT_NOTICE: ProductNotice = {
  capacityWeight: "",
  mainSpecs: "",
  expirationPeriod: "",
  usageMethod: "",
  manufacturerSeller: "",
  origin: "",
  ingredients: "",
  functionalCosmeticApproval: "",
  precautions: "",
  qualityAssurance: "",
  customerServicePhone: "",
}

/**
 * productNotice JSON 문자열을 객체로 판다.
 * 서버가 빈 값·깨진 JSON을 줄 수 있어 실패 시 기본값으로 떨어뜨린다.
 */
export function parseProductNotice(raw: string | null): ProductNotice {
  if (!raw) {
    return { ...DEFAULT_PRODUCT_NOTICE }
  }
  try {
    const parsed: unknown = JSON.parse(raw)
    if (parsed && typeof parsed === "object") {
      return {
        ...DEFAULT_PRODUCT_NOTICE,
        ...(parsed as Partial<ProductNotice>),
      }
    }
    return { ...DEFAULT_PRODUCT_NOTICE }
  } catch {
    return { ...DEFAULT_PRODUCT_NOTICE }
  }
}

export const productService = {
  addProduct: async (data: AddProductRequest) => {
    const { data: response } = await apiInstance.post("/seller/products", data)

    return response
  },
  updateProduct: async (productId: number, data: UpdateProductRequest) => {
    const { data: response } = await apiInstance.put(
      `/seller/products/${productId}`,
      data
    )

    return response
  },
  getProductList: async (params: ProductListParams) => {
    const { data: response } = await apiInstance.get<ProductListResponse>(
      "/seller/products",
      { params }
    )

    return response
  },
  getProductDetail: async (productId: number) => {
    const { data: response } = await apiInstance.get<ProductDetailResponse>(
      `/seller/products/${productId}`
    )

    return response
  },
  deleteProduct: async (productId: number) => {
    const { data: response } = await apiInstance.delete(
      `/seller/products/${productId}`
    )

    return response
  },
  deleteProducts: async (productIds: Array<number>) => {
    const { data: response } = await apiInstance.delete("/seller/products", {
      data: { productIds },
    })

    return response
  },
}
