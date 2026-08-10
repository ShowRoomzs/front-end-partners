import { PRODUCT_QUERY_KEYS } from "@/features/productManagement/constants/queryKeys"
import { productService } from "@/features/productManagement/services/productService"
import { useQuery } from "@tanstack/react-query"

/**
 * 상세는 서버 응답(ProductDetailResponse)을 **그대로** 돌려준다.
 * productNotice는 JSON 문자열이라 화면에서 parseProductNotice()로 판다 —
 * 훅에서 미리 파싱하면 파싱 실패 시 쿼리 자체가 터진다.
 */
export function useGetProductDetail(productId: number) {
  return useQuery({
    queryKey: [PRODUCT_QUERY_KEYS.PRODUCT_DETAIL, productId],
    queryFn: () => productService.getProductDetail(productId),
    enabled: !!productId,
  })
}
