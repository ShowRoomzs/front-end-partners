import { apiInstance } from "@/common/lib/apiInstance"
import type {
  HomeCalendar,
  HomeGuide,
  HomeLive,
  SellerBadges,
  SellerHome,
} from "@/features/home/types"

/* 파트너센터 홈 — 백엔드 `SellerHomeController`(1017 설계서 4절) */
export const homeService = {
  /** 실패는 홈 화면이 직접 그린다(「홈을 불러오지 못했습니다」) — 인터셉터 토스트를 끈다 */
  getHome: async () => {
    const { data } = await apiInstance.get<SellerHome>("/seller/home", {
      suppressErrorToast: true,
    })
    return data
  },

  /**
   * 진행 중 공구 실시간 — FE가 1분마다 부른다(서버 캐시 없음).
   * 갱신 실패는 마지막 값을 그대로 두므로 폴링마다 토스트를 띄우지 않는다.
   */
  getLive: async () => {
    const { data } = await apiInstance.get<HomeLive>("/seller/home/live", {
      suppressErrorToast: true,
    })
    return data
  },

  /** @param month yyyy-MM — 서버는 앞뒤 7일까지 넉넉히 내린다 */
  getCalendar: async (month: string) => {
    const { data } = await apiInstance.get<HomeCalendar>(
      "/seller/home/calendar",
      { params: { month } }
    )
    return data
  },

  /** [가이드 숨기기] — 응답은 갱신된 guide 블록 */
  updateGuide: async (hidden: boolean) => {
    const { data } = await apiInstance.patch<HomeGuide>("/seller/home/guide", {
      hidden,
    })
    return data
  },

  /**
   * GNB 배지 — 홈 처리 대기와 같은 계산.
   * 모든 화면의 셸이 부른다 — 실패하면 기존 메뉴별 `/summary` 계산으로 돌아가므로 토스트를 끈다.
   */
  getBadges: async () => {
    const { data } = await apiInstance.get<SellerBadges>("/seller/badges", {
      suppressErrorToast: true,
    })
    return data
  },
}
