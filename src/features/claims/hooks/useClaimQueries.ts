import {
  CLAIM_QUERY_KEYS,
  CLAIM_SUMMARY_POLL_INTERVAL,
} from "@/features/claims/constants/params"
import { claimService } from "@/features/claims/services/claimService"
import type {
  ClaimDetailResponse,
  ClaimListParams,
  ClaimRejectBody,
  ReshipExportBody,
  ReshipItem,
} from "@/features/claims/types"
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

export function useGetClaimList(params: ClaimListParams) {
  return useQuery({
    queryKey: [CLAIM_QUERY_KEYS.LIST, params],
    queryFn: () => claimService.getList(params),
    placeholderData: keepPreviousData,
  })
}

export function useGetClaimSummary(enabled = true) {
  return useQuery({
    queryKey: [CLAIM_QUERY_KEYS.SUMMARY],
    queryFn: claimService.getSummary,
    enabled,
    refetchInterval: CLAIM_SUMMARY_POLL_INTERVAL,
    staleTime: 10_000,
  })
}

export function useGetClaimDetail(claimId: number | null) {
  return useQuery({
    queryKey: [CLAIM_QUERY_KEYS.DETAIL, claimId],
    queryFn: () => claimService.getDetail(claimId as number),
    enabled: claimId !== null,
    retry: false,
  })
}

export function useGetReshipTemplate(enabled: boolean) {
  return useQuery({
    queryKey: [CLAIM_QUERY_KEYS.RESHIP_TEMPLATE],
    queryFn: claimService.getReshipTemplate,
    enabled,
  })
}

/**
 * 처리 API는 갱신된 상세를 돌려준다 — 상세 캐시를 그 값으로 바꾸고 목록·요약만 다시 읽는다.
 * 주문 관리 요약(입고 확인 · 재발송·교환 칸)도 같은 숫자라 함께 무효화한다.
 */
export function useClaimMutations() {
  const queryClient = useQueryClient()

  /**
   * 목록 · 요약을 다시 읽고 끝날 때까지 기다린다. onSuccess가 이 약속을 돌려주면 mutateAsync도
   * 다시 읽기가 끝난 뒤에 풀린다 — 그 전에 행 잠금이 풀리면 처리 전 행(버튼)이 그대로 남아 보인다.
   */
  const refreshLists = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: [CLAIM_QUERY_KEYS.LIST] }),
      queryClient.invalidateQueries({ queryKey: [CLAIM_QUERY_KEYS.SUMMARY] }),
      queryClient.invalidateQueries({ queryKey: ["sellerOrderSummary"] }),
    ])
  const applyDetail = (detail: ClaimDetailResponse) => {
    queryClient.setQueryData(
      [CLAIM_QUERY_KEYS.DETAIL, detail.summary.claimId],
      detail
    )
    return refreshLists()
  }

  const receive = useMutation({
    mutationFn: (claimIds: Array<number>) => claimService.receive(claimIds),
    onSuccess: (_data, claimIds) =>
      Promise.all([
        ...claimIds.map(id =>
          queryClient.invalidateQueries({
            queryKey: [CLAIM_QUERY_KEYS.DETAIL, id],
          })
        ),
        refreshLists(),
      ]),
  })

  const pass = useMutation({
    mutationFn: (claimId: number) => claimService.pass(claimId),
    onSuccess: applyDetail,
  })

  const reject = useMutation({
    mutationFn: (vars: { claimId: number; body: ClaimRejectBody }) =>
      claimService.reject(vars.claimId, vars.body),
    onSuccess: applyDetail,
  })

  const registerReshipments = useMutation({
    mutationFn: (items: Array<ReshipItem>) =>
      claimService.registerReshipments(items),
    onSuccess: (_data, items) =>
      Promise.all([
        ...items.map(item =>
          queryClient.invalidateQueries({
            queryKey: [CLAIM_QUERY_KEYS.DETAIL, item.claimId],
          })
        ),
        refreshLists(),
      ]),
  })

  const updateReshipment = useMutation({
    mutationFn: (vars: ReshipItem) =>
      claimService.updateReshipment(vars.claimId, {
        carrier: vars.carrier,
        trackingNumber: vars.trackingNumber,
      }),
    onSuccess: applyDetail,
  })

  const exportReshipments = useMutation({
    mutationFn: (body: ReshipExportBody) =>
      claimService.exportReshipments(body),
    onSuccess: (_data, body) => {
      if (body.saveAsDefault) {
        queryClient.invalidateQueries({
          queryKey: [CLAIM_QUERY_KEYS.RESHIP_TEMPLATE],
        })
      }
    },
  })

  const parseReshipments = useMutation({
    mutationFn: (file: File) => claimService.parseReshipments(file),
  })

  return {
    receive,
    pass,
    reject,
    registerReshipments,
    updateReshipment,
    exportReshipments,
    parseReshipments,
  }
}
