import {
  HOME_LIVE_POLL_INTERVAL,
  HOME_QUERY_KEYS,
} from "@/features/home/constants/params"
import { homeService } from "@/features/home/services/homeService"
import type { HomeLive } from "@/features/home/types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

/** 홈 1회 조립 — 처리 대기는 진입 시 갱신(폴링하지 않는다) */
export function useGetHome() {
  return useQuery({
    queryKey: HOME_QUERY_KEYS.HOME,
    queryFn: homeService.getHome,
    retry: false,
  })
}

/**
 * 진행 중 공구 실시간 — 홈 응답의 `live`로 먼저 그리고 1분마다 다시 받는다.
 * 갱신이 실패하면 마지막 값을 그대로 둔다(react-query 기본 동작).
 */
export function useGetHomeLive(initial: HomeLive | undefined) {
  return useQuery({
    queryKey: HOME_QUERY_KEYS.LIVE,
    queryFn: homeService.getLive,
    enabled: initial !== undefined,
    initialData: initial,
    // 첫 값은 방금 받은 홈 응답이라 1분 뒤부터 다시 받는다
    initialDataUpdatedAt: Date.now,
    staleTime: HOME_LIVE_POLL_INTERVAL,
    refetchInterval: HOME_LIVE_POLL_INTERVAL,
    retry: false,
  })
}

/** @param month yyyy-MM */
export function useGetHomeCalendar(month: string) {
  return useQuery({
    queryKey: [...HOME_QUERY_KEYS.CALENDAR, month],
    queryFn: () => homeService.getCalendar(month),
    staleTime: 60_000,
    retry: false,
  })
}

export function useHideGuide() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => homeService.updateGuide(true),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: HOME_QUERY_KEYS.HOME }),
  })
}

/**
 * GNB 배지 — `GET /v1/seller/badges`. 셸(MainLayout)이 쓴다.
 * 배포 전(404)이면 data가 없고, 셸은 기존 메뉴별 `/summary` 계산으로 돌아간다.
 */
export function useGetSellerBadges(enabled: boolean) {
  return useQuery({
    queryKey: HOME_QUERY_KEYS.BADGES,
    queryFn: homeService.getBadges,
    enabled,
    refetchInterval: 30_000,
    staleTime: 10_000,
    retry: false,
  })
}
