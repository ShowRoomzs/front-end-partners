import { CONTRACT_QUERY_KEYS } from "@/features/contracts/constants/queryKeys"
import { contractService } from "@/features/contracts/services/contractService"
import type {
  ContractCreateRequest,
  ContractReviewRequestRequest,
  ContractUpdateRequest,
} from "@/features/contracts/types"
import { useMutation, useQueryClient } from "@tanstack/react-query"

/**
 * 계약 쓰기 9종.
 *
 * **낙관적 업데이트를 쓰지 않는다.** 상태·권한·이력을 전부 서버가 다시 계산해 상세로
 * 돌려주므로, 프론트가 미리 그린 화면은 한 박자 뒤 서버 값으로 덮인다. 성공 후에는
 * 상세·목록·요약(탭 카운트·GNB 배지)을 모두 무효화한다 — 셋이 같이 변한다.
 */
function useInvalidateContract() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: [CONTRACT_QUERY_KEYS.DETAIL] })
    queryClient.invalidateQueries({ queryKey: [CONTRACT_QUERY_KEYS.LIST] })
    queryClient.invalidateQueries({ queryKey: [CONTRACT_QUERY_KEYS.SUMMARY] })
  }
}

export function useCreateContract() {
  const invalidate = useInvalidateContract()

  return useMutation({
    mutationFn: (body: ContractCreateRequest) => contractService.create(body),
    onSuccess: invalidate,
  })
}

export function useUpdateContract() {
  const invalidate = useInvalidateContract()

  return useMutation({
    mutationFn: (variables: {
      contractId: number
      body: ContractUpdateRequest
    }) => contractService.update(variables.contractId, variables.body),
    onSuccess: invalidate,
  })
}

export function useDeleteContract() {
  const invalidate = useInvalidateContract()

  return useMutation({
    mutationFn: (contractId: number) => contractService.delete(contractId),
    onSuccess: invalidate,
  })
}

/** 상태 불변 — 무효화할 것이 없다 */
export function useValidateContract() {
  return useMutation({
    mutationFn: (contractId: number) => contractService.validate(contractId),
  })
}

export function useRequestReview() {
  const invalidate = useInvalidateContract()

  return useMutation({
    mutationFn: (variables: {
      contractId: number
      body: ContractReviewRequestRequest
    }) => contractService.requestReview(variables.contractId, variables.body),
    onSuccess: invalidate,
  })
}

export function useCancelReviewRequest() {
  const invalidate = useInvalidateContract()

  return useMutation({
    mutationFn: (contractId: number) =>
      contractService.cancelReviewRequest(contractId),
    onSuccess: invalidate,
  })
}

export function useRequestResend() {
  const invalidate = useInvalidateContract()

  return useMutation({
    mutationFn: (contractId: number) =>
      contractService.requestResend(contractId),
    onSuccess: invalidate,
  })
}

export function useRecordFixedFeePayment() {
  const invalidate = useInvalidateContract()

  return useMutation({
    mutationFn: (contractId: number) =>
      contractService.recordFixedFeePayment(contractId),
    onSuccess: invalidate,
  })
}

export function useDuplicateContract() {
  const invalidate = useInvalidateContract()

  return useMutation({
    mutationFn: (contractId: number) => contractService.duplicate(contractId),
    onSuccess: invalidate,
  })
}
