import { apiInstance } from "@/common/lib/apiInstance"
import type { MemberAccountStatusResponse } from "@/features/suspension/types"

/*
  계정 상태 — `GET /v1/seller/account-status`(백엔드 `SellerAccountStatusController`).
  모든 페이지가 배너 · 칩용으로 부른다. 실패는 훅이 「정지 아님」으로 읽으므로(가짜 정지 배너를 띄우지 않는다)
  인터셉터 토스트를 끈다.
*/
export const accountStatusService = {
  getAccountStatus: async () => {
    const { data } = await apiInstance.get<MemberAccountStatusResponse>(
      "/seller/account-status",
      { suppressErrorToast: true }
    )
    return data
  },
}
