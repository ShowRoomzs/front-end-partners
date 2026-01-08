import {
  productService,
  type ProductListParams,
} from "@/features/productManagement/services/productService"
import { useQuery } from "@tanstack/react-query"

export function useGetProductList(params: ProductListParams) {
  return useQuery({
    queryKey: ["productList", params],
    queryFn: () => productService.getProductList(params),
  })
}
