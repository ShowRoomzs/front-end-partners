import { QUERY_KEYS } from "@/common/constants/queryKeys"
import { termsService, type TermsTarget } from "@/common/services/termsService"
import { useQuery } from "@tanstack/react-query"

/** 시행 중 약관 목록(대상 + 전체) — 가입 화면에서 한 번 받는다 */
export function useTermsList(target: TermsTarget) {
  return useQuery({
    queryKey: [QUERY_KEYS.TERMS, target],
    queryFn: () => termsService.getTerms(target),
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}

/** 약관 원문 — 「보기」를 누른 문서만 받는다 */
export function useTermsDetail(documentId: number | null) {
  return useQuery({
    queryKey: [QUERY_KEYS.TERMS_DETAIL, documentId],
    queryFn: () => termsService.getTermsDetail(documentId as number),
    enabled: documentId !== null,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}
