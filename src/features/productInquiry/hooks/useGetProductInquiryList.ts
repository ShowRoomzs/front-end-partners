import { PRODUCT_INQUIRY_QUERY_KEYS } from "@/features/productInquiry/constants/queryKeys"
import { productInquiryService } from "@/features/productInquiry/services/productInquiryService"
import type { ProductInquiryListParams } from "@/features/productInquiry/types"
import { useQuery } from "@tanstack/react-query"

export function useGetProductInquiryList(params: ProductInquiryListParams) {
  return useQuery({
    queryKey: [PRODUCT_INQUIRY_QUERY_KEYS.INQUIRY_LIST, params],
    queryFn: () => productInquiryService.getInquiryList(params),
  })
}
