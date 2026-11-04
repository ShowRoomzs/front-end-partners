import { apiInstance } from "@/common/lib/apiInstance"
import { NOTIFICATION_PAGE_SIZE } from "@/features/home/constants/params"
import type {
  NotificationPage,
  NotificationSummary,
} from "@/features/home/types"

/* 탑바 종 알림 — 백엔드 `SellerNotificationController`(1017 설계서 1-7 · 최근 30일) */
export const notificationService = {
  /** 모든 페이지에서 60초마다 부른다 — 실패하면 종이 숨으므로 인터셉터 토스트를 끈다 */
  getSummary: async () => {
    const { data } = await apiInstance.get<NotificationSummary>(
      "/seller/notifications/summary",
      { suppressErrorToast: true }
    )
    return data
  },

  getList: async (unreadOnly: boolean) => {
    const { data } = await apiInstance.get<NotificationPage>(
      "/seller/notifications",
      { params: { unreadOnly, page: 1, size: NOTIFICATION_PAGE_SIZE } }
    )
    return data
  },

  markRead: async (notificationId: number) => {
    await apiInstance.post(`/seller/notifications/${notificationId}/read`)
  },

  markAllRead: async () => {
    await apiInstance.post("/seller/notifications/read-all")
  },
}
