import { PRODUCT_QUERY_KEYS } from "@/features/productManagement/constants/queryKeys"
import {
  productService,
  type DeliveryType,
  type OptionGroupResponse,
  type ProductNotice,
  type VariantResponse,
} from "@/features/productManagement/services/productService"
import { useQuery } from "@tanstack/react-query"
import { useCallback } from "react"

export interface ProductDetail {
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
  productNotice: ProductNotice
  description: string
  tags: Array<string>
  deliveryType: DeliveryType
  deliveryFee: number
  deliveryFreeThreshold: number
  deliveryEstimatedDays: number
  createdAt: string
  optionGroups: Array<OptionGroupResponse>
  variants: Array<VariantResponse>
}

export function useGetProductDetail(productId: number) {
  const queryFn = useCallback(async (): Promise<ProductDetail> => {
    const res = await productService.getProductDetail(productId)
    const productDetail = {
      ...res,
      productNotice: JSON.parse(res.productNotice) as ProductNotice,
      tags: JSON.parse(res.tags || "[]") as Array<string>,
    }

    return productDetail
  }, [productId])

  return useQuery({
    queryKey: [PRODUCT_QUERY_KEYS.PRODUCT_DETAIL, productId],
    queryFn,
    enabled: !!productId,
  })
}
