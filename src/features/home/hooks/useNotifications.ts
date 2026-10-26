import {
  HOME_QUERY_KEYS,
  NOTIFICATION_POLL_INTERVAL,
} from "@/features/home/constants/params"
import { notificationService } from "@/features/home/services/notificationService"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

/** 종 배지 — 안 읽은 수 · 60초 폴링 */
export function useGetNotificationSummary(enabled: boolean) {
  return useQuery({
    queryKey: HOME_QUERY_KEYS.NOTIFICATION_SUMMARY,
    queryFn: notificationService.getSummary,
    enabled,
    refetchInterval: NOTIFICATION_POLL_INTERVAL,
    staleTime: 10_000,
    retry: false,
  })
}

/** 드롭다운 목록 — 열려 있을 때만 받는다 */
export function useGetNotificationList(unreadOnly: boolean, enabled: boolean) {
  return useQuery({
    queryKey: [...HOME_QUERY_KEYS.NOTIFICATION_LIST, unreadOnly],
    queryFn: () => notificationService.getList(unreadOnly),
    enabled,
    retry: false,
  })
}

function useInvalidateNotifications() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: HOME_QUERY_KEYS.NOTIFICATION_SUMMARY,
      }),
      queryClient.invalidateQueries({
        queryKey: HOME_QUERY_KEYS.NOTIFICATION_LIST,
      }),
    ])
}

export function useMarkNotificationRead() {
  const invalidate = useInvalidateNotifications()
  return useMutation({
    mutationFn: notificationService.markRead,
    onSettled: invalidate,
  })
}

export function useMarkAllNotificationsRead() {
  const invalidate = useInvalidateNotifications()
  return useMutation({
    mutationFn: notificationService.markAllRead,
    onSettled: invalidate,
  })
}
