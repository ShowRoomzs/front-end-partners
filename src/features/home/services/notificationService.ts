import { apiInstance } from "@/common/lib/apiInstance"
import { callOrMock, mockScenario } from "@/common/utils/devMock"
import { NOTIFICATION_PAGE_SIZE } from "@/features/home/constants/params"
import type {
  NotificationPage,
  NotificationSummary,
} from "@/features/home/types"

/*
  탑바 종 알림 — 백엔드 main `SellerNotificationController`(1017 설계서 1-7 · 최근 30일).
  2026-10-24 기준 개발 서버 미배포 → `callOrMock`. 배포본에서 요약이 「준비 중」이면 종 아이콘을 숨긴다.
  개발 서버 목업: 기본 = 안 읽음 3건(시안 H1) · `?mock=home-empty` · `home-new` 등에서도 같은 목록을 쓴다.
*/

function skipRealIfScenario() {
  if (mockScenario()) throw new Error("mock scenario")
}

const loadMock = () => import("./notification.mock")

export const notificationService = {
  getSummary: () =>
    callOrMock<NotificationSummary>(
      "알림",
      async () => {
        skipRealIfScenario()
        const { data } = await apiInstance.get<NotificationSummary>(
          "/seller/notifications/summary",
          { suppressErrorToast: true }
        )
        return data
      },
      async () => (await loadMock()).getSummaryMock(mockScenario())
    ),

  getList: (unreadOnly: boolean) =>
    callOrMock<NotificationPage>(
      "알림",
      async () => {
        skipRealIfScenario()
        const { data } = await apiInstance.get<NotificationPage>(
          "/seller/notifications",
          {
            params: { unreadOnly, page: 1, size: NOTIFICATION_PAGE_SIZE },
            suppressErrorToast: true,
          }
        )
        return data
      },
      async () => (await loadMock()).getListMock(unreadOnly, mockScenario())
    ),

  markRead: (notificationId: number) =>
    callOrMock<void>(
      "알림",
      async () => {
        skipRealIfScenario()
        await apiInstance.post(
          `/seller/notifications/${notificationId}/read`,
          undefined,
          { suppressErrorToast: true }
        )
      },
      async () => (await loadMock()).markReadMock(notificationId)
    ),

  markAllRead: () =>
    callOrMock<void>(
      "알림",
      async () => {
        skipRealIfScenario()
        await apiInstance.post("/seller/notifications/read-all", undefined, {
          suppressErrorToast: true,
        })
      },
      async () => (await loadMock()).markAllReadMock()
    ),
}
