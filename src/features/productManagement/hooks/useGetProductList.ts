import {
  productService,
  type ProductListParams,
} from "@/features/productManagement/services/productService"
import { PRODUCT_QUERY_KEYS } from "@/features/productManagement/constants/queryKeys"
import { useQuery } from "@tanstack/react-query"

export function useGetProductList(params: ProductListParams) {
  return useQuery({
    queryKey: [PRODUCT_QUERY_KEYS.PRODUCT_LIST, params],
    queryFn: () => productService.getProductList(params),
  })
}
