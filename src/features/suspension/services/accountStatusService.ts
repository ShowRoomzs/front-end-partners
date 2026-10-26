import { apiInstance } from "@/common/lib/apiInstance"
import { callOrMock, mockScenario } from "@/common/utils/devMock"
import type { MemberAccountStatusResponse } from "@/features/suspension/types"

/*
  계정 상태 — `GET /v1/seller/account-status`(백엔드 main `SellerAccountStatusController`).
  2026-10-24 기준 개발 서버에 아직 배포되지 않았다 → `callOrMock`.
  배포본에서 404면 `ApiNotReadyError`이고, 훅은 이를 「정지 아님」으로 읽는다 — 가짜 정지 배너를 띄우지 않는다.

  개발 서버 목업 시나리오(`?mock=`):
  - (없음)              정상(ACTIVE)
  - suspended          정지 · 사유 상품 정보 허위·과장 · 지급 유지 · 상세 사유 없음(시안 S1 · 16 H4)
  - suspended-payout   정지 · 사유 정산 정보 불일치 · 지급 정지 줄 + 상세 사유 [자세히](시안 S5)
  - suspended-open     정지 · 종료일 없는 정지(자동 해제일 없음)
*/

export const SUSPENSION_SCENARIOS = [
  "suspended",
  "suspended-payout",
  "suspended-open",
] as const

/** 지금 주소의 목업 시나리오가 정지 상태인가 — 다른 목업(홈 등)이 정지 연동 표시를 맞출 때 쓴다 */
export function isSuspendedScenario(scenario: string | null = mockScenario()) {
  return (SUSPENSION_SCENARIOS as ReadonlyArray<string>).includes(
    scenario ?? ""
  )
}

export const accountStatusService = {
  getAccountStatus: () =>
    callOrMock<MemberAccountStatusResponse>(
      "계정 상태",
      async () => {
        // 목업 시나리오를 고른 주소면 실호출을 건너뛴다 — 개발 서버가 배포된 뒤에도 상태를 골라 볼 수 있게
        if (mockScenario()) throw new Error("mock scenario")
        const { data } = await apiInstance.get<MemberAccountStatusResponse>(
          "/seller/account-status",
          { suppressErrorToast: true }
        )
        return data
      },
      async () => {
        const m = await import("./accountStatus.mock")
        return m.getAccountStatusMock(mockScenario())
      }
    ),
}
