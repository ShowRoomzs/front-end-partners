import { isApiNotReady } from "@/common/utils/devMock"
import { parseServerDateTime } from "@/common/utils/formatDate"
import {
  useGetNotificationList,
  useGetNotificationSummary,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from "@/features/home/hooks/useNotifications"
import type { NotificationItem } from "@/features/home/types"
import { notificationTargetPath } from "@/features/home/utils/notificationTarget"
import { cn } from "@/lib/utils"
import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"

/**
 * 탑바 종 알림 — 시안 ui-partner-16 `.bell` · `.ntf`.
 * 안 읽은 수를 인디고 숫자 배지로(GNB 배지와 같은 원칙 — 숫자만), 누르면 전체 / 안 읽음 드롭다운.
 * 줄을 누르면 읽음 처리 · 드롭다운 닫힘 · 그 건의 상세로 이동한다.
 *
 * 배포본에서 알림 API가 아직 없으면(`ApiNotReadyError`) 종 자체를 그리지 않는다 — 빈 종이 「알림 없음」으로 오독된다.
 */
export default function NotificationBell(props: { enabled: boolean }) {
  const { enabled } = props
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const { data: summary, error } = useGetNotificationSummary(enabled)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  // 「준비 중」뿐 아니라 첫 조회가 실패한 경우도 숨긴다 — 받은 적 있는 값이 있으면 그대로 둔다
  if (!enabled || (error && (isApiNotReady(error) || !summary))) return null

  const unreadCount = summary?.unreadCount ?? 0

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        aria-label={unreadCount > 0 ? `알림 ${unreadCount}건` : "알림"}
        aria-expanded={open}
        className={cn(
          "relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-[6px] text-sz-n-600 transition-colors hover:bg-sz-n-100",
          open && "bg-sz-n-100 text-sz-n-900"
        )}
      >
        <svg
          className="h-[18px] w-[18px]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-px flex h-4 min-w-4 items-center justify-center rounded-[8px] bg-sz-accent-500 px-1 text-[10px] font-semibold text-white tabular-nums shadow-[0_0_0_2px_#fff]">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <NotificationDropdown
          unreadCount={unreadCount}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  )
}

function NotificationDropdown(props: {
  unreadCount: number
  onClose: () => void
}) {
  const { unreadCount, onClose } = props
  const navigate = useNavigate()
  const [unreadOnly, setUnreadOnly] = useState(false)
  const { data, isLoading } = useGetNotificationList(unreadOnly, true)
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()
  const items = data?.content ?? []

  const handleClick = (item: NotificationItem) => {
    if (!item.read) markRead.mutate(item.notificationId)
    onClose()
    const path = notificationTargetPath(item.target)
    if (path) navigate(path)
  }

  return (
    <div className="absolute top-[calc(100%+6px)] right-0 z-20 w-[380px] overflow-hidden rounded-[8px] border border-sz-n-200 bg-white shadow-[0_8px_24px_rgba(26,27,31,0.12)]">
      <div className="flex items-center border-b border-sz-n-100 px-4 py-3">
        <span className="text-[12px] font-semibold text-sz-n-900">알림</span>
        <button
          type="button"
          onClick={() => markAllRead.mutate()}
          disabled={unreadCount === 0 || markAllRead.isPending}
          className="ml-auto cursor-pointer text-[11px] text-sz-accent-500 disabled:cursor-default disabled:text-sz-n-400"
        >
          모두 읽음
        </button>
      </div>

      <div className="flex gap-1 border-b border-sz-n-100 px-3 py-2">
        {[
          { label: "전체", value: false },
          {
            label: unreadCount > 0 ? `안 읽음 ${unreadCount}` : "안 읽음",
            value: true,
          },
        ].map(tab => (
          <button
            key={tab.label}
            type="button"
            onClick={() => setUnreadOnly(tab.value)}
            className={cn(
              "flex h-[26px] cursor-pointer items-center rounded-[13px] px-2.5 text-[11px] text-sz-n-600",
              unreadOnly === tab.value && "bg-sz-n-900 text-white"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="max-h-[420px] overflow-y-auto">
        {isLoading ? (
          <div className="px-4 py-8 text-center text-[12px] text-sz-n-500">
            불러오는 중…
          </div>
        ) : items.length === 0 ? (
          <div className="px-4 py-8 text-center text-[12px] text-sz-n-500">
            {unreadOnly ? "안 읽은 알림이 없습니다" : "받은 알림이 없습니다"}
          </div>
        ) : (
          items.map(item => (
            <button
              key={item.notificationId}
              type="button"
              onClick={() => handleClick(item)}
              className={cn(
                "flex w-full cursor-pointer gap-2.5 border-t border-sz-n-100 px-4 py-[11px] text-left first:border-t-0 hover:bg-sz-n-50",
                !item.read && "bg-sz-accent-50 hover:bg-sz-accent-50"
              )}
            >
              <span
                className={cn(
                  "mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full",
                  !item.read && "bg-sz-accent-500"
                )}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] text-sz-n-500">
                  {item.actorLabel}
                </span>
                <span className="mt-px block text-[12px] leading-[1.5] text-sz-n-900">
                  {item.title}
                </span>
                {item.body && (
                  <span className="mt-px block text-[11px] text-sz-n-600">
                    {item.body}
                  </span>
                )}
                <span className="mt-[3px] block text-[11px] text-sz-n-400 tabular-nums">
                  {parseServerDateTime(item.createdAt).format("MM.DD HH:mm")}
                </span>
              </span>
            </button>
          ))
        )}
      </div>

      <div className="border-t border-sz-n-100 px-4 py-2.5 text-center text-[11px] text-sz-n-500">
        최근 30일 알림을 보여 줍니다
      </div>
    </div>
  )
}
