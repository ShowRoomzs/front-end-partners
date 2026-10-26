import { isApiNotReady } from "@/common/utils/devMock"
import { useMarketStore } from "@/common/stores/useMarketStore"
import { getMenuTypeByRole, type Role } from "@/common/types/role"
import { accountStatusService } from "@/features/suspension/services/accountStatusService"
import type { MemberAccountSanction } from "@/features/suspension/types"
import { useQuery } from "@tanstack/react-query"

export const ACCOUNT_STATUS_QUERY_KEY = ["seller", "account-status"] as const

/** 모든 페이지가 같은 키를 쓴다 — 배너 · 칩 · 각 화면 차단이 요청 하나를 나눠 쓴다 */
const ACCOUNT_STATUS_STALE_TIME = 60_000

export interface AccountSuspension {
  /** 정지 중인가 — 조회 전 · 실패 · 「준비 중」이면 false(가짜 정지를 만들지 않는다) */
  isSuspended: boolean
  /** 정지 상세 — 정지가 아니면 null */
  sanction: MemberAccountSanction | null
  /** 탈퇴 신청 심사 중 */
  withdrawalPending: boolean
  isLoading: boolean
  /** 배포본에서 API가 아직 없을 때 */
  isNotReady: boolean
}

/**
 * 내 브랜드 계정 이용 정지 상태 — `GET /v1/seller/account-status`.
 * 브랜드(SELLER) 전용 API라 인플루언서 계정에서는 부르지 않는다.
 */
export function useAccountSuspension(): AccountSuspension {
  const { role } = useMarketStore()
  const enabled = getMenuTypeByRole(role as Role) === "SELLER"

  const query = useQuery({
    queryKey: ACCOUNT_STATUS_QUERY_KEY,
    queryFn: accountStatusService.getAccountStatus,
    enabled,
    staleTime: ACCOUNT_STATUS_STALE_TIME,
    retry: false,
  })

  const sanction =
    query.data?.status === "SUSPENDED" ? (query.data.sanction ?? null) : null

  return {
    isSuspended: sanction !== null,
    sanction,
    withdrawalPending: query.data?.withdrawalPending ?? false,
    isLoading: enabled && query.isLoading,
    isNotReady: isApiNotReady(query.error),
  }
}
