import { PRODUCT_INQUIRY_QUERY_KEYS } from "@/features/productInquiry/constants/queryKeys"
import { productInquiryService } from "@/features/productInquiry/services/productInquiryService"
import type { ProductInquiryDetailParams } from "@/features/productInquiry/types"
import { useQuery } from "@tanstack/react-query"

/**
 * 상세 조회.
 *
 * 목록 조건이 쿼리 키에 함께 들어간다 — 같은 문의라도 어떤 탭·필터에서 들어왔느냐에
 * 따라 이전/다음 ID가 달라지기 때문이다.
 */
export function useGetProductInquiryDetail(
  inquiryId: number,
  params: ProductInquiryDetailParams
) {
  return useQuery({
    queryKey: [PRODUCT_INQUIRY_QUERY_KEYS.INQUIRY_DETAIL, inquiryId, params],
    queryFn: () => productInquiryService.getInquiryDetail(inquiryId, params),
    enabled: Number.isFinite(inquiryId),
  })
}
