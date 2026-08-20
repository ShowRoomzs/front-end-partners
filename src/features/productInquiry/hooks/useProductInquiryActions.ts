import { PRODUCT_INQUIRY_QUERY_KEYS } from "@/features/productInquiry/constants/queryKeys"
import { productInquiryService } from "@/features/productInquiry/services/productInquiryService"
import type { InquiryDeleteRequestBody } from "@/features/productInquiry/types"
import { useMutation, useQueryClient } from "@tanstack/react-query"

/**
 * 답변 등록·수정·삭제 요청 3종.
 *
 * **낙관적 업데이트를 쓰지 않는다.** 세 액션 모두 서버가 상태·이력·버튼 노출 플래그를
 * 함께 다시 계산하므로, 프론트가 미리 그린 화면은 어차피 한 박자 뒤 서버 값으로
 * 덮인다. 그 사이에 실제로는 실패한 요청이 성공한 것처럼 보이는 쪽이 더 나쁘다.
 *
 * 성공 후에는 상세와 목록을 모두 무효화한다 — 목록의 상태·답변일·탭 건수가 같이 변한다.
 */
function useInvalidateInquiry() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({
      queryKey: [PRODUCT_INQUIRY_QUERY_KEYS.INQUIRY_DETAIL],
    })
    queryClient.invalidateQueries({
      queryKey: [PRODUCT_INQUIRY_QUERY_KEYS.INQUIRY_LIST],
    })
  }
}

export function useRegisterAnswer() {
  const invalidate = useInvalidateInquiry()

  return useMutation({
    mutationFn: (variables: { inquiryId: number; answerContent: string }) =>
      productInquiryService.registerAnswer(variables.inquiryId, {
        answerContent: variables.answerContent,
      }),
    onSuccess: invalidate,
  })
}

export function useModifyAnswer() {
  const invalidate = useInvalidateInquiry()

  return useMutation({
    mutationFn: (variables: { inquiryId: number; answerContent: string }) =>
      productInquiryService.modifyAnswer(variables.inquiryId, {
        answerContent: variables.answerContent,
      }),
    onSuccess: invalidate,
  })
}

export function useRequestInquiryDelete() {
  const invalidate = useInvalidateInquiry()

  return useMutation({
    mutationFn: (variables: {
      inquiryId: number
      data: InquiryDeleteRequestBody
    }) =>
      productInquiryService.requestDelete(variables.inquiryId, variables.data),
    onSuccess: invalidate,
  })
}
