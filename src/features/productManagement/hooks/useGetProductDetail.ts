import { PRODUCT_QUERY_KEYS } from "@/features/productManagement/constants/queryKeys"
import {
  productService,
  type ProductNotice,
} from "@/features/productManagement/services/productService"
import { useQuery } from "@tanstack/react-query"
import { useCallback } from "react"

export function useGetProductDetail(productId: number) {
  const queryFn = useCallback(async () => {
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
