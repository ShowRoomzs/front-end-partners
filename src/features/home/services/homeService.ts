import { apiInstance } from "@/common/lib/apiInstance"
import { callOrMock, mockScenario } from "@/common/utils/devMock"
import type {
  HomeCalendar,
  HomeGuide,
  HomeLive,
  SellerBadges,
  SellerHome,
} from "@/features/home/types"

/*
  파트너센터 홈 — 백엔드 main `SellerHomeController`(1017 설계서 4절).
  2026-10-24 기준 개발 서버에 아직 배포되지 않았다 → `callOrMock`: 배포본은 404면 「준비 중」, 개발 서버는 목업.
  배포되면 코드를 고치지 않아도 실데이터로 바뀐다.

  개발 서버 목업 시나리오(`?mock=`):
  - (없음)               H1 홈 · 기본
  - home-empty          H2 처리할 일 없음
  - home-new            H3 가입 직후(첫 공구 가이드 · 2단계 상품 등록)
  - home-guide-contract H3a 가이드 진행 중(4단계 계약 · 서명)
  - suspended           H4 계정 이용 정지(배너 · 체결 보류 · 승인 보류 · [+ 계약 작성] 비활성)
  - suspended-payout    H4 + 지급 정지 사유 배너(정산 줄 · [자세히])
  - home-not-ready      배포본 「준비 중」 화면을 개발 서버에서 미리 본다
*/

/** 목업 시나리오를 고른 주소면 실호출을 건너뛴다 — 개발 서버가 배포된 뒤에도 상태를 골라 볼 수 있게 */
function skipRealIfScenario() {
  if (mockScenario()) throw new Error("mock scenario")
}

const loadMock = () => import("./home.mock")

export const homeService = {
  getHome: () =>
    callOrMock<SellerHome>(
      "홈",
      async () => {
        skipRealIfScenario()
        const { data } = await apiInstance.get<SellerHome>("/seller/home", {
          suppressErrorToast: true,
        })
        return data
      },
      async () => (await loadMock()).getHomeMock(mockScenario())
    ),

  /** 진행 중 공구 실시간 — FE가 1분마다 부른다(서버 캐시 없음) */
  getLive: () =>
    callOrMock<HomeLive>(
      "홈 실시간",
      async () => {
        skipRealIfScenario()
        const { data } = await apiInstance.get<HomeLive>("/seller/home/live", {
          suppressErrorToast: true,
        })
        return data
      },
      async () => (await loadMock()).getLiveMock(mockScenario())
    ),

  /** @param month yyyy-MM — 서버는 앞뒤 7일까지 넉넉히 내린다 */
  getCalendar: (month: string) =>
    callOrMock<HomeCalendar>(
      "공구 일정",
      async () => {
        skipRealIfScenario()
        const { data } = await apiInstance.get<HomeCalendar>(
          "/seller/home/calendar",
          { params: { month }, suppressErrorToast: true }
        )
        return data
      },
      async () => (await loadMock()).getCalendarMock(month, mockScenario())
    ),

  /** [가이드 숨기기] — 응답은 갱신된 guide 블록 */
  updateGuide: (hidden: boolean) =>
    callOrMock<HomeGuide>(
      "첫 공구 가이드",
      async () => {
        skipRealIfScenario()
        const { data } = await apiInstance.patch<HomeGuide>(
          "/seller/home/guide",
          { hidden },
          { suppressErrorToast: true }
        )
        return data
      },
      async () => (await loadMock()).updateGuideMock(hidden)
    ),

  /**
   * GNB 배지 — 홈 처리 대기와 같은 계산. 목업을 두지 않는다:
   * 셸은 이 값이 없으면(배포 전 404) 기존 메뉴별 `/summary` 계산으로 돌아간다.
   */
  getBadges: async () => {
    const { data } = await apiInstance.get<SellerBadges>("/seller/badges", {
      suppressErrorToast: true,
    })
    return data
  },
}
